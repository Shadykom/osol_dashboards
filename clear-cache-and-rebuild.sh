#!/bin/bash

echo "🧹 Clearing cache and rebuilding..."

# Clear node_modules cache
echo "Clearing node_modules..."
rm -rf node_modules/.cache
rm -rf node_modules/.vite

# Clear build outputs
echo "Clearing build outputs..."
rm -rf dist
rm -rf .vercel

# Clear browser cache reminder
echo ""
echo "⚠️  IMPORTANT: Clear your browser cache!"
echo "   - Chrome: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)"
echo "   - Or open DevTools > Application > Storage > Clear site data"
echo ""

# Reinstall and rebuild
echo "Reinstalling dependencies..."
pnpm install

echo "Starting dev server..."
pnpm run dev