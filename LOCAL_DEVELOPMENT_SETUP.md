# Local Development Setup

## Environment Variables for Local Development

Create a `.env.local` file in your project root with these variables:

```bash
# Local Development Environment Variables

# Backend API URL (for local development)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Solana Network (use devnet for development)
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Solana RPC Endpoint (use devnet RPC for development)
# You can use the free public devnet RPC or get a free one from:
# - Helius: https://devnet.helius-rpc.com/?api-key=YOUR_KEY
# - QuickNode: https://your-devnet-endpoint.quiknode.pro/YOUR_KEY/
# - Alchemy: https://solana-devnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Supabase Configuration (Optional)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

## Why Use Devnet for Development?

### ✅ **Devnet Benefits:**
- **Free SOL** for testing (no real money)
- **No rate limits** on RPC calls
- **Fast transactions** (test environment)
- **Safe testing** without real funds

### ❌ **Mainnet Issues:**
- **Rate limited** (403 errors)
- **Real money** at risk
- **Slower** confirmation times
- **Expensive** for testing

## Quick Setup Steps

### 1. Create Environment File
```bash
# Create .env.local file
touch .env.local
```

### 2. Add the Variables
Copy the environment variables above into `.env.local`

### 3. Get Devnet SOL
```bash
# Get free devnet SOL from Solana CLI
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet

# Or use the web faucet:
# https://faucet.solana.com/
```

### 4. Restart Development Server
```bash
npm run dev
```

## Testing with Devnet

### 1. **Connect Phantom Wallet**
- Make sure Phantom is set to **Devnet** mode
- Go to Settings → Change Network → Devnet

### 2. **Get Devnet SOL**
- Use the Solana faucet: https://faucet.solana.com/
- Enter your wallet address
- Get free test SOL

### 3. **Test Transactions**
- Your app will now use devnet
- Transactions will be fast and free
- No real money involved

## Production vs Development

### **Development (.env.local)**
```bash
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### **Production (Vercel Environment Variables)**
```bash
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_API_URL=https://euromillions-back-end.onrender.com
```

## Troubleshooting

### **Still Getting 403 Errors?**
1. **Check your `.env.local` file** exists
2. **Restart the dev server** (`npm run dev`)
3. **Check browser console** for environment variable values
4. **Verify Phantom is on devnet**

### **Environment Variables Not Loading?**
1. **File must be named** `.env.local` (not `.env`)
2. **Must be in project root** (same level as `package.json`)
3. **Restart dev server** after creating file
4. **Check for typos** in variable names

### **Wallet Connection Issues?**
1. **Switch Phantom to devnet** in wallet settings
2. **Clear browser cache** and reload
3. **Disconnect and reconnect** wallet

## Development Workflow

### **1. Start Backend** (if running locally)
```bash
# In your backend project
npm start
```

### **2. Start Frontend**
```bash
# In your frontend project
npm run dev
```

### **3. Test Transactions**
- Use devnet SOL (free)
- Test all features safely
- No real money at risk

## Next Steps

Once you're done testing locally:
1. **Commit your changes**
2. **Push to GitHub**
3. **Vercel will deploy** with production environment variables
4. **Production uses mainnet** with your Helius RPC

## Important Notes

- **Never commit** `.env.local` to git (it's in `.gitignore`)
- **Use devnet** for all local development
- **Use mainnet** only for production
- **Test thoroughly** on devnet before deploying


