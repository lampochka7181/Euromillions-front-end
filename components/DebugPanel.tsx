"use client";

import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';

export default function DebugPanel() {
  const { wallet, wallets, connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="mb-4 p-2 bg-gray-900/20 border border-gray-800 rounded text-gray-400 text-xs">
      Debug: Wallets: {wallets.length}, Selected: {wallet?.adapter?.name || 'None'}, Connected: {connected ? 'Yes' : 'No'}
    </div>
  );
}
