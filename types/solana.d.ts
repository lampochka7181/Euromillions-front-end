declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect?: () => Promise<{ publicKey: any }>;
      signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
    };
  }
}

export {};
