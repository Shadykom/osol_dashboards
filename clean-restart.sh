#!/bin/bash

echo "🧹 Cleaning all caches and restarting..."

# Kill any running dev servers
echo "Stopping any running dev servers..."
pkill -f "vite" || true

# Clean all cache directories
echo "Removing cache directories..."
rm -rf node_modules/.vite
rm -rf .vite-cache
rm -rf dist

# Clear npm/pnpm cache
echo "Clearing package manager cache..."
pnpm store prune

# Ensure all env files have correct values
echo "Verifying environment files..."
if grep -q "YOUR_ANON_KEY_HERE" .env* 2>/dev/null; then
    echo "❌ Found placeholder API key in .env files!"
    echo "Please ensure all .env files have the correct API key"
    exit 1
fi

echo "✅ Environment files look good"

# Start fresh
echo "Starting development server..."
pnpm dev