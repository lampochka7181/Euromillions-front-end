#!/bin/bash

echo "🍎 Setting up Crypto EuroMillions for iOS development on Mac..."

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is for macOS only"
    exit 1
fi

echo "📦 Installing dependencies..."

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    # Install via Homebrew (recommended)
    if command -v brew &> /dev/null; then
        brew install node
    else
        echo "❌ Please install Homebrew first: https://brew.sh/"
        exit 1
    fi
fi

# Install CocoaPods (required for iOS)
echo "📥 Installing CocoaPods..."
sudo gem install cocoapods

# Install project dependencies
echo "📥 Installing project dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync ios

echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Open Xcode: npx cap open ios"
echo "2. Select your development team in Xcode"
echo "3. Build and run in iOS Simulator"
echo ""
echo "📱 To test on real device:"
echo "1. Connect your iPhone via USB"
echo "2. Trust the computer on your iPhone"
echo "3. Select your device in Xcode"
echo "4. Build and run"
