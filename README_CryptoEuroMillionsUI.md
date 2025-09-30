# Crypto EuroMillions – Mobile-Only React UI (Base)

This is a **mobile-first EuroMillions-like ticket UI** for crypto. It keeps your exact UX decisions and the dark trending style you wanted.

## What’s Included
- 5 numbers (1–30) + **1 Lucky Star** (1–10)
- Sticky header with **Jackpot**, **countdown**, schedule, **Flash** button
- Single fixed bottom CTA: **Connect** → **Play · 0.01 SOL**
- “Activity” screen (full-screen replace) with back button and ticket list (date, numbers, **Solscan** link)
- Simulated Phantom connect + fake tx signature for demo

## Quick Start (Next.js + Tailwind + shadcn/ui)

1. Install deps:
```bash
npm i framer-motion lucide-react
# shadcn/ui should already provide Button/Separator; otherwise scaffold them or replace with your own
```

2. Copy `CryptoEuroMillionsUI.tsx` into your app (e.g., `app/page.tsx` or a route component). Ensure your alias `@/components/ui/*` resolves to valid Button/Separator components (shadcn/ui).

3. Tailwind styles assumed. If not using Tailwind, add equivalent CSS classes.

4. Run your app.

## Wiring to Real Wallet & Chain

Replace the demo parts in the component:
- `connectWallet()` → integrate Phantom via `@solana/wallet-adapter` (Phantom/EVM alternatives).
- `playNow()`:
  - Derive a server or program instruction to **register the ticket on-chain**.
  - Replace the `randomHex` with the real transaction signature.
  - Persist activity server-side or on-chain; keep optimistic local append for snappy UX.

## Config

```ts
const EM_CONFIG = {
  main: { count: 5, max: 30, label: "Numbers" },
  stars: { count: 1, max: 10, label: "Lucky Star" },
  ticketPriceSOL: 0.01,
  scheduleLabel: "Tue & Fri 20:00 UTC",
  jackpotLabel: "$12,340,000",
};
```
Change `ticketPriceSOL`, ranges, or labels as needed.

## Notes
- The UI is intentionally minimal: **no rules/results** on this screen; those belong on separate pages.
- The **Flash** button uses the same price label style as your spec.
- Activity uses `https://solscan.io/tx/<sig>` for convenience.
