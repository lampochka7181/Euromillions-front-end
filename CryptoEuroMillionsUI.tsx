"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Clock, Check, Zap, List, ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "./app/contexts/AuthContext";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TicketService, TicketActivity, JackpotInfo } from "./lib/ticketService";
import { getApiUrl } from "./lib/utils";
import Confetti from "react-confetti";

/**
 * Crypto EuroMillions — Mobile-Only (Dark Trending-Style UI)
 * ---------------------------------------------------------
 * - One Lucky Star only (5 + 1 instead of 5 + 2)
 * - Activity view replaces screen with back button
 * - Connect button directly simulates Phantom connection then enables Play
 * - Purchased tickets are stored in activity list with date & Solscan link
 */

// ---------- Utils ----------
const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);
const pickUnique = (pool: number[], k: number): number[] => {
  const copy = [...pool];
  const out: number[] = [];
  for (let i = 0; i < k; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
};
const sortAsc = (arr: number[]): number[] => [...arr].sort((a, b) => a - b);

// Utility function to send SOL transaction
const sendSolTransaction = async (wallet: any, connection: any, fromPublicKey: PublicKey, toPublicKey: PublicKey, amountSol: number): Promise<string> => {
  try {
    console.log('Creating SOL transaction:', {
      from: fromPublicKey.toString(),
      to: toPublicKey.toString(),
      amount: amountSol,
      amountLamports: amountSol * LAMPORTS_PER_SOL
    });

    // Create the transaction
    const transaction = new Transaction();
    
    // Add the transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: toPublicKey,
        lamports: amountSol * LAMPORTS_PER_SOL,
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    console.log('Transaction created, sending for signature...');

    // Send transaction for signature
    const signature = await wallet.adapter.sendTransaction(transaction, connection);
    
    console.log('Transaction sent, signature:', signature);

    // Wait for confirmation
    console.log('Waiting for transaction confirmation...');
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    console.log('Transaction confirmed:', signature);
    return signature;
  } catch (error) {
    console.error('SOL transaction error:', error);
    throw error;
  }
};

// ---------- Config ----------
const EM_CONFIG = {
  main: { count: 4, max: 30, label: "Numbers" },
  stars: { count: 1, max: 10, label: "Powerball" },
  ticketPriceSOL: 0.05,
  scheduleLabel: "Fri 20:00 UTC",
  jackpotLabel: "$12,340,000",
};

function NumberBall({ n, selected, onClick, disabled }: { n: number; selected: boolean; onClick?: (n: number) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onClick?.(n)}
      className={
        `relative inline-flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold transition-all ` +
        (disabled
          ? " bg-neutral-800 text-neutral-500 cursor-not-allowed"
          : selected
          ? " bg-purple-600 text-white"
          : " bg-neutral-900 text-white border border-neutral-700 active:scale-95")
      }
      aria-pressed={selected}
      disabled={disabled}
    >
      {n}
      {selected && <Check className="absolute -right-1 -top-1 h-4 w-4 text-white" />}
    </button>
  );
}

function GridPicker({ title, max, needed, selected, onToggle }: { title: string; max: number; needed: number; selected: number[]; onToggle: (n: number) => void }) {
  const nums = useMemo(() => range(max), [max]);
  const count = selected.length;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-neutral-400">{title}</div>
        <div className="text-xs text-neutral-500">{count}/{needed}</div>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {nums.map((n) => (
          <NumberBall
            key={n}
            n={n}
            selected={selected.includes(n)}
            onClick={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

function Countdown({ target }: { target: number }) {
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);
  
  React.useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  
  if (!mounted) {
    return (
      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <Clock className="h-3 w-3" />
        Draw in --h --m --s
      </div>
    );
  }
  
  const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return (
    <div className="flex items-center gap-2 text-xs text-neutral-400">
      <Clock className="h-3 w-3" />
      Draw in {h}h {m}m {s}s
    </div>
  );
}

export default function CryptoEuroMillionsUI() {
  const [main, setMain] = useState<number[]>([]);
  const [stars, setStars] = useState<number[]>([]);
  const [view, setView] = useState<"home" | "activity">("home"); // "home" or "activity"
  const [activities, setActivities] = useState<TicketActivity[]>([]); // {id,date,main,stars,price,txSig}
  const [mounted, setMounted] = useState(false);
  const [jackpot, setJackpot] = useState<JackpotInfo | null>(null);
  const [countdown, setCountdown] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  const { user, isLoading, error, connectWallet, disconnect, wallet, connected, publicKey, setIsLoading } = useAuth();
  const { select, wallets } = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    setMounted(true);
    
    // Set initial window dimensions
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    
    // Handle window resize
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Test backend connectivity
  const testBackend = async () => {
    try {
      console.log('Testing backend connectivity...');
      const response = await fetch(`${getApiUrl()}/auth/me`, {
        method: 'GET',
      });
      console.log('Backend connectivity check - Status:', response.status, response.status === 401 ? '(Expected - no token provided)' : '(Unexpected)');
      return response.status === 401 || response.ok; // 401 is expected without token
    } catch (err) {
      console.error('Backend not reachable:', err);
      return false;
    }
  };

  // Test token format (for debugging purposes)
  const testToken = async (token: string) => {
    try {
      console.log('Testing token format...');
      console.log('Raw token:', token);
      console.log('Token length:', token.length);
      
      // Try to decode the token to see its structure
      try {
        const decoded = Buffer.from(token, 'base64').toString();
        console.log('Decoded token:', decoded);
      } catch (e) {
        console.log('Token is not base64 encoded');
      }
      
      // Test backend connectivity first
      const backendOk = await testBackend();
      if (!backendOk) {
        console.error('Backend is not reachable');
        return false;
      }
      
      // Test token validity with auth endpoint
      const testResponse = await fetch(`${getApiUrl()}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Token validation response status:', testResponse.status);
      
      if (testResponse.ok) {
        console.log('Token is valid');
        return true;
      } else {
        console.log('Token validation failed:', testResponse.status);
        const errorData = await testResponse.json().catch(() => ({}));
        console.log('Error details:', errorData);
        return false;
      }
    } catch (err) {
      console.error('Token test failed:', err);
      return false;
    }
  };

  // Fetch user's tickets from backend
  const fetchUserTickets = async () => {
    if (!user || !user.token) return;

    try {
      console.log('Fetching user tickets from backend...');
      console.log('Using auth token:', user.token);

      // Fetch tickets directly from backend API
      const activities = await TicketService.getUserTickets(user.token);
      console.log('Successfully fetched tickets from backend:', activities);

      setActivities(activities);
    } catch (err) {
      console.error('Failed to fetch tickets from backend:', err);
      setActivities([]);
    }
  };

  // Fetch jackpot information from backend
  const fetchJackpot = async () => {
    try {
      console.log('Fetching jackpot from backend...');
      const jackpotData = await TicketService.getJackpot();
      console.log('Successfully fetched jackpot:', jackpotData);
      setJackpot(jackpotData);
    } catch (err) {
      console.error('Failed to fetch jackpot:', err);
      setJackpot(null);
    }
  };

  // Fetch countdown information from backend
  const fetchCountdown = async () => {
    try {
      console.log('Fetching countdown from backend...');
      const response = await fetch(`${getApiUrl()}/countdown`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Countdown fetch failed:', response.status, response.statusText);
        setCountdown(null);
        return;
      }

      const countdownData = await response.json();
      console.log('Successfully fetched countdown:', countdownData);
      setCountdown(countdownData);
    } catch (err) {
      console.error('Failed to fetch countdown:', err);
      setCountdown(null);
    }
  };

  // Fetch tickets when user is authenticated
  useEffect(() => {
    if (user) {
      fetchUserTickets();
    }
  }, [user]);

  // Fetch jackpot and countdown on component mount
  useEffect(() => {
    fetchJackpot();
    fetchCountdown();
  }, []);

  const drawTarget = useMemo(() => {
    const d = new Date();
    d.setUTCHours(20, 0, 0, 0);
    if (d.getTime() < Date.now()) d.setUTCDate(d.getUTCDate() + 1);
    return d.getTime();
  }, []);

  const canPlay = user && main.length === EM_CONFIG.main.count && stars.length === EM_CONFIG.stars.count;
  
  // More intelligent account change detection
  const needsReconnect = useMemo(() => {
    if (!user || !user.walletAddress) return false;
    
    // If wallet is connected and has a public key, check if it matches
    if (wallet && wallet.adapter.publicKey) {
      const currentAddress = wallet.adapter.publicKey.toString();
      const storedAddress = user.walletAddress;
      
      console.log('Account check:', {
        currentAddress,
        storedAddress,
        matches: currentAddress === storedAddress
      });
      
      return currentAddress !== storedAddress;
    }
    
    // If wallet is not connected but we have a valid user session,
    // don't show reconnect message immediately - give time for wallet to connect
    return false;
  }, [user, wallet, connected, publicKey]);
  

  function toggleMain(n: number) {
    setMain((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      if (prev.length >= EM_CONFIG.main.count) return prev;
      return [...prev, n];
    });
  }
  function toggleStar(n: number) {
    setStars((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      if (prev.length >= EM_CONFIG.stars.count) return prev;
      return [...prev, n];
    });
  }

  function quickPick() {
    const m = pickUnique(range(EM_CONFIG.main.max), EM_CONFIG.main.count);
    const s = pickUnique(range(EM_CONFIG.stars.max), EM_CONFIG.stars.count);
    setMain(sortAsc(m));
    setStars(sortAsc(s));
  }

  async function flashPickAndBuy() {
    if (!user || needsReconnect) {
      handleConnectWallet();
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Auto-select random numbers
      const m = pickUnique(range(EM_CONFIG.main.max), EM_CONFIG.main.count);
      const s = pickUnique(range(EM_CONFIG.stars.max), EM_CONFIG.stars.count);
      const selectedMain = sortAsc(m);
      const selectedStars = sortAsc(s);
      
      // Update UI state
      setMain(selectedMain);
      setStars(selectedStars);
      
      console.log('Flash pick selected:', {
        main: selectedMain,
        stars: selectedStars
      });
      
      // Immediately proceed with purchase
      await playNowWithNumbers(selectedMain, selectedStars);
    } catch (err) {
      console.error('Flash pick and buy failed:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function clearPick() {
    setMain([]);
    setStars([]);
  }

  const triggerConfetti = () => {
    setShowConfetti(true);
    // Auto-hide confetti after 5 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
  };

  const showSuccessPopup = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    triggerConfetti();
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage("");
  };

  async function handleConnectWallet() {
    try {
      console.log('Available wallets:', wallets.map(w => w.adapter.name));
      
      // Try to select Phantom wallet for better UX, but AuthContext will handle direct connection
      if (wallets.length > 0) {
        const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
        if (phantomWallet) {
          console.log('Selecting Phantom wallet for UI consistency...');
          select(phantomWallet.adapter.name);
          // Don't wait for propagation - AuthContext will handle direct connection
        } else {
          console.log('Phantom wallet not found in available wallets');
        }
      } else {
        console.log('No wallets available');
      }
      
      // AuthContext will handle the actual connection directly
      await connectWallet();
    } catch (err) {
      console.error('Connection failed:', err);
    }
  }

  function randomHex(len: number) {
    const chars = "abcdef0123456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  async function playNow() {
    if (!user || needsReconnect) {
      handleConnectWallet();
      return;
    }
    if (!canPlay) {
      // Instead of showing an alert, use the Flash button functionality to auto-select numbers
      console.log('User authenticated but no numbers selected, using Flash pick...');
      await flashPickAndBuy();
      return;
    }
    
    console.log('Playing with numbers:', {
      main: sortAsc(main),
      stars: sortAsc(stars),
      canPlay,
      mainCount: main.length,
      starsCount: stars.length
    });
    
    await playNowWithNumbers(main, stars);
  }

  async function playNowWithNumbers(selectedMain: number[], selectedStars: number[]) {
    if (!user || needsReconnect) {
      handleConnectWallet();
      return;
    }
    
    // Validate the provided numbers
    if (!selectedMain || !selectedStars || 
        selectedMain.length !== EM_CONFIG.main.count || 
        selectedStars.length !== EM_CONFIG.stars.count) {
      alert("Invalid number selection. Please try again.");
      return;
    }
    
    console.log('Playing with provided numbers:', {
      main: sortAsc(selectedMain),
      stars: sortAsc(selectedStars),
      mainCount: selectedMain.length,
      starsCount: selectedStars.length
    });
    
    try {
      setIsLoading(true);
      
      // Step 1: Create payment intent
      console.log('Creating payment intent...');
      console.log('Using token for payment:', user.token);
      console.log('Authorization header:', `Bearer ${user.token}`);
      
      const paymentResponse = await fetch(`${getApiUrl()}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          ticket_count: 1
        }),
      });

      if (!paymentResponse.ok) {
        console.error('Payment intent failed:', paymentResponse.status, paymentResponse.statusText);
        const errorData = await paymentResponse.json();
        console.error('Payment error data:', errorData);
        console.error('Payment response headers:', Object.fromEntries(paymentResponse.headers.entries()));
        console.error('Payment request headers sent:', {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        });
        throw new Error(errorData.message || 'Failed to create payment intent');
      }

      const paymentData = await paymentResponse.json();
      console.log('Payment intent created:', paymentData);
      
      // Step 2: Execute real Solana transaction
      console.log('Executing SOL transaction...');
      
      // Get treasury wallet from payment response
      const treasuryWallet = paymentData.recipient_address;
      console.log('Treasury wallet:', treasuryWallet);
      
      // Get user's public key
      const userPublicKey = wallet.adapter.publicKey || publicKey;
      if (!userPublicKey) {
        throw new Error('User wallet not connected');
      }
      
      console.log('User wallet:', userPublicKey.toString());
      
      // Send SOL transaction
      const transactionHash = await sendSolTransaction(
        wallet,
        connection,
        userPublicKey,
        new PublicKey(treasuryWallet),
        EM_CONFIG.ticketPriceSOL
      );
      
      console.log('SOL transaction completed:', transactionHash);
      
      // Step 3: Verify payment
      console.log('Verifying payment...');
      const verifyResponse = await fetch(`${getApiUrl()}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          transaction_hash: transactionHash,
          payment_intent_id: paymentData.payment_intent_id
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.message || 'Payment verification failed');
      }

      const verifyData = await verifyResponse.json();
      console.log('Payment verified:', verifyData);
      
      // Step 4: Create ticket
      console.log('Creating ticket...');
      
      const ticketRequestData = {
        numbers: sortAsc(selectedMain),
        powerball: sortAsc(selectedStars)[0],
        transaction_hash: transactionHash
      };
      
      console.log('Ticket request data:', ticketRequestData);
      console.log('Ticket request JSON:', JSON.stringify(ticketRequestData));
      
      const ticketResponse = await fetch(`${getApiUrl()}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify(ticketRequestData),
      });

      console.log('Ticket response status:', ticketResponse.status);
      console.log('Ticket response headers:', Object.fromEntries(ticketResponse.headers.entries()));

      if (!ticketResponse.ok) {
        const errorData = await ticketResponse.json().catch(() => ({}));
        console.error('Ticket creation failed:', errorData);
        console.error('Response status:', ticketResponse.status, ticketResponse.statusText);
        throw new Error(errorData.message || `Failed to create ticket: ${ticketResponse.status} ${ticketResponse.statusText}`);
      }

      const ticketData = await ticketResponse.json();
      console.log('Ticket created:', ticketData);
      
      // Backend handles all ticket persistence - no frontend Supabase insertion
      
      // Add to local activities
      const entry = {
        id: ticketData.ticketId || Date.now(),
        date: new Date().toISOString(),
        main: sortAsc(selectedMain),
        stars: sortAsc(selectedStars),
        price: EM_CONFIG.ticketPriceSOL,
        txSig: transactionHash,
      };
      setActivities((prev) => [entry, ...prev]);
      
      // Refresh jackpot and countdown to show updated amounts
      console.log('Refreshing jackpot and countdown after ticket purchase...');
      await fetchJackpot();
      await fetchCountdown();
      
      showSuccessPopup(`Ticket purchased! You played 1 ticket • ${EM_CONFIG.ticketPriceSOL} SOL`);
      clearPick();
    } catch (err) {
      console.error('Purchase failed:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to purchase ticket'}`);
    } finally {
      setIsLoading(false);
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString();
  }

  if (!mounted) {
    return (
      <div className="mx-auto max-w-md bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-neutral-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (view === "activity") {
    return (
      <div className="mx-auto max-w-md bg-black text-white min-h-screen">
        <div className="sticky top-0 z-30 bg-black border-b border-neutral-800 px-4 py-3 flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => setView("home")}>
            <ArrowLeft className="h-5 w-5 text-neutral-400" />
          </Button>
          <div className="text-lg font-semibold">My Activity</div>
          {user && !needsReconnect && (
            <div className="ml-auto">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => disconnect()}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                title="Disconnect wallet"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
        <div className="p-4">
          {activities.length === 0 ? (
            <div className="text-sm text-neutral-400">No tickets yet.</div>
          ) : (
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-neutral-400">{formatDate(a.date)}</div>
                    <div className="text-xs text-neutral-400">{a.price} SOL</div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {a.main.map((n) => (
                      <span key={`m-${a.id}-${n}`} className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-neutral-800 px-2 text-sm font-semibold">{n}</span>
                    ))}
                    <span className="mx-1 text-neutral-600">•</span>
                    {a.stars.map((n) => (
                      <span key={`s-${a.id}-${n}`} className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-yellow-500/20 px-2 text-sm font-semibold text-yellow-300">★ {n}</span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs">
                    <a className="underline text-neutral-300" href={`https://solscan.io/tx/${a.txSig}`} target="_blank" rel="noreferrer">View on Solscan</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md pb-28 bg-black text-white min-h-screen">
      {/* Sticky Jackpot Header */}
      <div className="sticky top-0 z-30 bg-black">
        <div className="px-4 pt-4 pb-3 border-b border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-neutral-400">Global Mega Jackpot</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                className="bg-purple-600 text-white hover:bg-purple-700 disabled:bg-neutral-800 disabled:text-neutral-500" 
                onClick={flashPickAndBuy}
                disabled={isLoading}
              >
                <Zap className="mr-1 h-4 w-4" /> 
                {isLoading ? "Processing..." : `Flash · ${EM_CONFIG.ticketPriceSOL} SOL`}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setView("activity")}>
                <List className="h-5 w-5 text-neutral-400" />
              </Button>
              {user && !needsReconnect && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => disconnect()}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  title="Disconnect wallet"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          <div className="text-3xl font-extrabold tracking-tight">
            {jackpot ? (
              <>
                <span className="text-yellow-400">
                  {jackpot.pot.current_amount.toFixed(2)} SOL
                </span>
                <span className="text-neutral-400 ml-2">Jackpot</span>
              </>
            ) : (
              <>
                <span className="text-neutral-400">Loading...</span>
                <span className="text-neutral-400 ml-2">Jackpot</span>
              </>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between">
            {countdown ? (
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Clock className="h-3 w-3" />
                Draw in {countdown.countdown.formatted}
              </div>
            ) : (
              <Countdown target={drawTarget} />
            )}
            <div className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs text-neutral-400">
              {countdown ? (
                <>{countdown.next_draw.day} {countdown.next_draw.time}</>
              ) : (
                EM_CONFIG.scheduleLabel
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {mounted && error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
        {mounted && user && needsReconnect && (
          <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg text-yellow-300 text-sm">
            Account changed. Please reconnect to continue.
          </div>
        )}
        {mounted && user && !needsReconnect && wallet && !connected && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-blue-300 text-sm">
            Wallet connection restored. You can continue playing.
          </div>
        )}
        {mounted && wallets.length === 0 && (
          <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg text-yellow-300 text-sm">
            No wallet detected. Please install Phantom wallet and refresh the page.
          </div>
        )}
        {mounted && wallets.length > 0 && !wallet && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-blue-300 text-sm">
            Connect wallet to start playing.
          </div>
        )}
        {mounted && user && (
          <div className="px-4 py-2 bg-neutral-900 rounded-lg mb-4">
            <div className="text-xs text-neutral-400 mb-1">Connected Wallet:</div>
            <div className="text-sm text-green-400 font-mono">
              {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-8)}
            </div>
          </div>
        )}
        <div className="mb-3">
          <div className="text-sm text-neutral-400">Pick numbers (4 + 1 Powerball)</div>
        </div>

        <GridPicker
          title={`${EM_CONFIG.main.label} (1–${EM_CONFIG.main.max})`}
          max={EM_CONFIG.main.max}
          needed={EM_CONFIG.main.count}
          selected={main}
          onToggle={toggleMain}
        />

        <GridPicker
          title={`${EM_CONFIG.stars.label} (1–${EM_CONFIG.stars.max})`}
          max={EM_CONFIG.stars.max}
          needed={EM_CONFIG.stars.count}
          selected={stars}
          onToggle={toggleStar}
        />

        <div className="mt-4 flex items-center justify-between">
          <Button variant="ghost" className="text-neutral-400" onClick={clearPick}>Clear</Button>
          <div className="text-xs text-neutral-500">Price per ticket: {EM_CONFIG.ticketPriceSOL} SOL</div>
        </div>
      </div>

      {/* Fixed bottom Play/Connect button */}
      <AnimatePresence>
        <div
          className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t border-neutral-800 bg-black p-3"
          style={{ pointerEvents: 'auto' }}
        >
          <button
            className={`w-full text-base px-4 py-2 rounded-md ${(!user || needsReconnect) ? 'bg-purple-600 text-white hover:bg-purple-700' : (canPlay ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-purple-600 text-white hover:bg-purple-700')}`}
            onClick={playNow}
            disabled={false}
            style={{ pointerEvents: 'auto' }}
          >
            {isLoading ? "Connecting..." : needsReconnect ? "Connect" : user ? (canPlay ? `Play · ${EM_CONFIG.ticketPriceSOL} SOL` : `Select ${EM_CONFIG.main.count} numbers + ${EM_CONFIG.stars.count} Powerball`) : "Connect"}
          </button>
        </div>
      </AnimatePresence>
      
      {/* Confetti Animation */}
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          initialVelocityY={20}
          colors={['#8B5CF6', '#A855F7', '#C084FC', '#DDD6FE', '#F3E8FF', '#FEF3C7', '#FDE047', '#FACC15']}
        />
      )}

      {/* Custom Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={closeSuccessModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative mx-4 max-w-sm w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Success Icon */}
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
              </div>
              
              {/* Success Message */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Success!</h3>
                <p className="text-neutral-300 text-sm leading-relaxed">
                  {successMessage}
                </p>
              </div>
              
              {/* OK Button */}
              <Button
                onClick={closeSuccessModal}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                OK
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
