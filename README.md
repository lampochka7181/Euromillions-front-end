# Crypto EuroMillions - Frontend App

A mobile-first React/Next.js application for a crypto lottery game inspired by EuroMillions.

## Features

- 🎯 Pick 5 numbers (1-30) + 1 Lucky Star (1-10)
- 💰 Jackpot display with countdown timer
- ⚡ Quick pick (Flash) functionality
- 📱 Mobile-optimized dark theme UI
- 🔗 Simulated wallet connection
- 📊 Activity tracking with transaction links

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```bash
# Backend API URL
# For local development, this can be omitted (defaults to http://localhost:3001)
# For production, set this to your deployed backend URL
NEXT_PUBLIC_API_URL=https://your-backend-url.com

# Solana Network Configuration
# Options: 'mainnet-beta', 'devnet', 'testnet'
# Defaults to 'mainnet-beta' if not set
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# Solana RPC Endpoint (Recommended for Production)
# For better performance and reliability, use a custom RPC provider:
# - Helius: https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
# - QuickNode: https://your-endpoint.quiknode.pro/YOUR_KEY/
# - Alchemy: https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY
# If not set, uses default public RPC (slow and rate-limited)
NEXT_PUBLIC_SOLANA_RPC_URL=https://your-rpc-endpoint.com

# Supabase Configuration (Optional)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **shadcn/ui** - UI components

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility functions
├── CryptoEuroMillionsUI.tsx # Main lottery component
└── README.md
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` - Your production backend URL (required)
   - `NEXT_PUBLIC_SOLANA_NETWORK` - Set to `mainnet-beta` for production (optional, defaults to mainnet-beta)
   - `NEXT_PUBLIC_SOLANA_RPC_URL` - Your custom Solana RPC endpoint (highly recommended for production)
   - `NEXT_PUBLIC_SUPABASE_URL` - (Optional) Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - (Optional) Your Supabase anonymous key
4. Deploy!

**Important Notes**:
- Make sure to set `NEXT_PUBLIC_API_URL` to your production backend URL
- For production, use a custom RPC endpoint (Helius, QuickNode, or Alchemy) to avoid transaction timeouts
- The default public RPC is slow and rate-limited - not suitable for production use

## Notes

This is a demo application with simulated wallet connections and transactions. For production use, integrate with real Solana wallet adapters and blockchain transactions.
