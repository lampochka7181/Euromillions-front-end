# Mac Setup Instructions for iOS Development

## Prerequisites on Your Mac

### 1. Install Xcode
```bash
# Open Mac App Store and search for "Xcode"
# Or download from: https://developer.apple.com/xcode/
# This is a large download (10+ GB), so start this first
```

### 2. Install Homebrew (if not already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 3. Install Node.js
```bash
brew install node
```

## Quick Setup

### Option A: Use the Setup Script
```bash
# Make the script executable
chmod +x mac-setup.sh

# Run the setup script
./mac-setup.sh
```

### Option B: Manual Setup
```bash
# 1. Install CocoaPods
sudo gem install cocoapods

# 2. Install project dependencies
npm install

# 3. Build the project
npm run build

# 4. Sync with Capacitor
npx cap sync ios
```

## Open in Xcode

```bash
# This will open Xcode with your iOS project
npx cap open ios
```

## Configure in Xcode

### 1. Select Your Development Team
1. In Xcode, select your project in the navigator
2. Go to "Signing & Capabilities"
3. Select your Apple Developer Team
4. Enable "Automatically manage signing"

### 2. Update Bundle Identifier
- Change from `com.yourcompany.cryptoeuromillions`
- To something unique like `com.yourname.cryptoeuromillions`

### 3. Set Display Name
- Set to "Crypto EuroMillions"

## Test Your App

### Option A: iOS Simulator
1. Select a simulator (iPhone 15 Pro recommended)
2. Click the Play button (▶️) to build and run
3. Test all features:
   - Wallet connection
   - Number selection
   - Transaction flow

### Option B: Real Device
1. Connect your iPhone via USB
2. Trust the computer on your iPhone
3. Select your device in Xcode
4. Build and run

## Troubleshooting

### Common Issues:

**1. "CocoaPods not found"**
```bash
sudo gem install cocoapods
```

**2. "Xcode command line tools not found"**
```bash
xcode-select --install
```

**3. "Signing issues"**
- Make sure you have an Apple Developer account
- Check your team selection in Xcode

**4. "Build fails"**
```bash
# Clean and rebuild
npx cap sync ios
# Then try building again in Xcode
```

## Next Steps After Testing

### 1. Create App Store Connect App
1. Go to https://appstoreconnect.apple.com/
2. Create a new app
3. Fill in app information

### 2. Archive and Upload
1. In Xcode: Product → Archive
2. Distribute App → App Store Connect
3. Upload to App Store

### 3. Submit for Review
1. Fill in app details in App Store Connect
2. Add screenshots
3. Submit for review

## Important Notes

### App Store Considerations
- Your app involves real money transactions
- Apple has strict gambling app policies
- Consider starting with TestFlight beta first
- May need special approval for gambling apps

### Legal Requirements
- Gambling license may be required
- Age restrictions (18+)
- Terms of Service required
- Privacy Policy required

## Support

If you encounter issues:
1. Check Xcode console for error messages
2. Try cleaning build folder (Product → Clean Build Folder)
3. Re-sync with Capacitor: `npx cap sync ios`
4. Check Apple Developer documentation

## Files Created for You

- ✅ `mac-setup.sh` - Automated setup script
- ✅ `ios/` folder - Native iOS project
- ✅ `public/manifest.json` - PWA configuration
- ✅ Capacitor configuration

Your app is ready for iOS development! 🚀
