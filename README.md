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

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

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

## Notes

This is a demo application with simulated wallet connections and transactions. For production use, integrate with real Solana wallet adapters and blockchain transactions.
