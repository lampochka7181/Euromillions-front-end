"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getApiUrl } from '@/lib/utils';

interface User {
  walletAddress: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  validateToken: (token: string) => Promise<boolean>;
  wallet: any;
  connected: boolean;
  publicKey: any;
  setIsLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { wallet, publicKey, connected, connect, disconnect: walletDisconnect, wallets } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  // Debug wallet state changes and monitor wallet availability
  useEffect(() => {
    console.log('AuthContext wallet state changed:', {
      wallet: wallet?.adapter?.name,
      connected,
      publicKey: publicKey?.toString(),
      walletReady: wallet?.adapter?.readyState
    });
    
    // Check if wallet is available but not connected
    if (wallet?.adapter && !connected) {
      console.log('Wallet adapter available:', {
        name: wallet.adapter.name,
        readyState: wallet.adapter.readyState,
        connected: wallet.adapter.connected
      });
    }
  }, [wallet, connected, publicKey]);

  // Check for existing auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const walletAddress = localStorage.getItem('wallet_address');
    if (token && walletAddress) {
      console.log('Found existing token:', token);
      console.log('Token length:', token.length);
      console.log('Stored wallet address:', walletAddress);
      
      // Validate the token before setting user
      validateToken(token).then(isValid => {
        if (isValid) {
          console.log('Token is valid, setting user');
          setUser({ walletAddress, token });
          
          // Try to restore wallet connection if possible
          console.log('Attempting to restore wallet connection...');
          const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
          if (phantomWallet && phantomWallet.adapter.readyState === 'Installed') {
            console.log('Phantom wallet is available, checking if we can restore connection');
            // Don't auto-connect, but mark that we should be connected
            // The wallet adapter will handle the connection state
          }
        } else {
          console.log('Token is invalid, clearing storage');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('wallet_address');
        }
      });
    }
  }, [wallets]);

  // Monitor for account changes and try to restore connection
  useEffect(() => {
    if (!wallet?.adapter) return;

    const handleAccountChange = () => {
      if (isDisconnecting) {
        console.log('Already disconnecting, ignoring account change event');
        return;
      }
      
      console.log('Account changed, disconnecting user');
      setIsDisconnecting(true);
      
      // Clear user data and wallet connection
      localStorage.removeItem('auth_token');
      localStorage.removeItem('wallet_address');
      setUser(null);
      setError(null);
      
      // Reset the disconnecting flag after a short delay
      setTimeout(() => {
        setIsDisconnecting(false);
      }, 1000);
    };

    // Listen for disconnect events only
    wallet.adapter.on('disconnect', handleAccountChange);

    // Try to restore connection if we have a valid user but wallet is not connected
    if (user && user.walletAddress && !connected && wallet.adapter.readyState === 'Installed') {
      console.log('Attempting to restore wallet connection for existing user...');
      // Give the wallet adapter some time to initialize
      setTimeout(async () => {
        try {
          // Try to connect without showing error if it fails
          await wallet.adapter.connect();
          console.log('Wallet connection restored successfully');
        } catch (err) {
          console.log('Could not restore wallet connection automatically:', err);
          // This is expected - user might need to manually connect
        }
      }, 1000);
    }

    return () => {
      wallet.adapter.off('disconnect', handleAccountChange);
    };
  }, [wallet, walletDisconnect, user, connected]);

  const signMessage = async (message: string): Promise<string> => {
    let walletToUse = wallet;
    
    // If no wallet is selected, try to use available wallets
    if (!walletToUse || !walletToUse.adapter.publicKey) {
      const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom' && w.adapter.publicKey);
      if (phantomWallet) {
        walletToUse = phantomWallet;
        console.log('Using Phantom wallet from available wallets for signing');
      }
    }
    
    if (!walletToUse || !walletToUse.adapter.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const messageBytes = new TextEncoder().encode(message);
      
      // Check if adapter has signMessage method
      if (!('signMessage' in walletToUse.adapter) || typeof (walletToUse.adapter as any).signMessage !== 'function') {
        throw new Error('Wallet does not support message signing');
      }
      
      const signature = await (walletToUse.adapter as any).signMessage(messageBytes);
      return Buffer.from(signature).toString('base64');
    } catch (err) {
      console.error('Sign message error:', err);
      throw new Error('Failed to sign message');
    }
  };

  // Validate token by making a test request
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      console.log('Validating token...');
      console.log('Token being validated:', token);
      console.log('Authorization header:', `Bearer ${token}`);
      
      const response = await fetch(`${getApiUrl()}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Token validation response:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('Token validation error:', errorData);
      }
      
      return response.ok;
    } catch (err) {
      console.error('Token validation failed:', err);
      return false;
    }
  };

  const connectWallet = async () => {
    console.log('Attempting to connect wallet...');
    console.log('Available wallet:', wallet);
    console.log('Connected:', connected);
    console.log('Public key:', publicKey);

    // Always try to use Phantom wallet directly if available, regardless of selection state
    console.log('Available wallets in AuthContext:', wallets.map(w => w.adapter.name));
    const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
    
    if (!phantomWallet) {
      setError('No Phantom wallet found. Please install Phantom wallet and refresh the page.');
      setIsLoading(false);
      return;
    }
    
    console.log('Using Phantom wallet directly for connection');

    // Clear any previous errors and reset loading state
    setError(null);
    setIsLoading(true);

    try {
      // Connect directly with Phantom wallet
      console.log('Connecting with Phantom wallet directly...');
      try {
        const result = await phantomWallet.adapter.connect();
        console.log('Phantom wallet connect result:', result);
      } catch (connectErr) {
        console.log('Direct Phantom connect failed:', connectErr);
        // Try the useWallet connect as fallback
        console.log('Trying useWallet connect() as fallback...');
        try {
          await connect();
          console.log('useWallet connect() successful');
        } catch (fallbackErr) {
          console.log('useWallet connect() also failed:', fallbackErr);
          throw new Error('Failed to connect to Phantom wallet');
        }
      }
      
      // Wait longer for the connection to establish
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get the public key from multiple sources with more robust retry
      let walletPublicKey = null;
      
      // Try different sources for the public key, prioritizing the direct Phantom wallet
      if (phantomWallet && phantomWallet.adapter.publicKey) {
        walletPublicKey = phantomWallet.adapter.publicKey;
        console.log('Got public key from direct Phantom wallet');
      } else if (wallet && wallet.adapter && wallet.adapter.publicKey) {
        walletPublicKey = wallet.adapter.publicKey;
        console.log('Got public key from selected wallet');
      } else if (publicKey) {
        walletPublicKey = publicKey;
        console.log('Got public key from useWallet hook');
      }
      
      console.log('Wallet public key (first attempt):', walletPublicKey);
      
      // Retry getting public key if it's not available immediately
      if (!walletPublicKey) {
        console.log('Public key not available, retrying...');
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Try all sources again, prioritizing direct Phantom wallet
          if (phantomWallet && phantomWallet.adapter.publicKey) {
            walletPublicKey = phantomWallet.adapter.publicKey;
          } else if (wallet && wallet.adapter && wallet.adapter.publicKey) {
            walletPublicKey = wallet.adapter.publicKey;
          } else if (publicKey) {
            walletPublicKey = publicKey;
          }
          
          console.log(`Retry ${i + 1}:`, walletPublicKey);
          if (walletPublicKey) break;
        }
      }
      
      if (!walletPublicKey) {
        throw new Error('Failed to get public key from wallet adapter after retries. Please try connecting again.');
      }

      const walletAddress = walletPublicKey.toString();
      
      // Create message to sign
      const message = `Sign this message to authenticate with Crypto EuroMillions.\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      
      // Sign the message
      console.log('Signing message...');
      const signature = await signMessage(message);
      console.log('Message signed successfully');
      console.log('Signature length:', signature.length);
      console.log('Signature preview:', signature.substring(0, 20) + '...');
      
      // Send to backend for authentication
      console.log('Sending to backend...');
      const requestData = {
        wallet_address: walletAddress,
        signature: signature,
        message: message,
      };
      console.log('Request data:', requestData);
      console.log('Request JSON:', JSON.stringify(requestData));
      
      // Step 1: Connect wallet
      const connectResponse = await fetch(`${getApiUrl()}/auth/wallet-connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!connectResponse.ok) {
        console.log('Wallet connect failed:', connectResponse.status);
        const errorData = await connectResponse.json();
        console.log('Connect error response:', errorData);
        throw new Error(errorData.message || `Wallet connect failed with status ${connectResponse.status}`);
      }

      const connectData = await connectResponse.json();
      console.log('Wallet connect successful:', connectData);
      
      // Extract token from connect response
      let token = connectData.token || connectData.access_token || connectData.auth_token;
      
      if (!token) {
        // If no token in connect response, try to register user
        console.log('No token in connect response, trying to register user...');
        const registerResponse = await fetch(`${getApiUrl()}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wallet_address: walletAddress,
          }),
        });

        if (registerResponse.ok) {
          const registerData = await registerResponse.json();
          console.log('User registration successful:', registerData);
          token = registerData.token || registerData.access_token || registerData.auth_token;
        } else if (registerResponse.status === 409) {
          // User already exists, try to get user info
          console.log('User already exists, getting user info...');
          const userResponse = await fetch(`${getApiUrl()}/auth/me`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('User info retrieved:', userData);
            token = userData.token || userData.access_token || userData.auth_token;
          }
        } else {
          console.log('User registration failed:', registerResponse.status);
          const errorData = await registerResponse.json();
          console.log('Register error response:', errorData);
          throw new Error(errorData.message || `User registration failed with status ${registerResponse.status}`);
        }
      }
      
      if (!token) {
        throw new Error('No token found after authentication');
      }

      console.log('Authentication successful');
      console.log('Token received:', token);
      console.log('Token length:', token.length);
      console.log('Token type:', typeof token);
      
      // Store auth data
      localStorage.setItem('auth_token', token);
      localStorage.setItem('wallet_address', walletAddress);
      
      setUser({ walletAddress, token });
    } catch (err) {
      console.error('Authentication error:', err);
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError('Backend server not running. Please start your backend on port 3001.');
      } else {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (isDisconnecting) {
      console.log('Already disconnecting, ignoring disconnect request');
      return;
    }
    
    console.log('Disconnecting user...');
    console.log('Current wallet state:', { connected, wallet: wallet?.adapter?.name });
    
    setIsDisconnecting(true);
    
    // Clear user data first
    localStorage.removeItem('auth_token');
    localStorage.removeItem('wallet_address');
    setUser(null);
    setError(null);
    setIsLoading(false);
    
    // Disconnect wallet if connected
    try {
      if (wallet?.adapter?.connected || connected) {
        console.log('Wallet is connected, disconnecting...');
        await walletDisconnect();
        console.log('Wallet disconnect completed');
      } else {
        console.log('Wallet was not connected');
      }
    } catch (err) {
      console.log('Error during wallet disconnect:', err);
    }
    
    // Reset the disconnecting flag after a delay to ensure cleanup is complete
    setTimeout(() => {
      setIsDisconnecting(false);
      console.log('User disconnected successfully');
    }, 500);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      error,
      connectWallet,
      disconnect,
      signMessage,
      validateToken,
      wallet,
      connected,
      publicKey,
      setIsLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
