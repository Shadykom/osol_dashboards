#!/bin/bash

echo "=== Supabase API Key Helper ==="
echo ""
echo "Your Supabase project ID: bzlenegoilnswsbanxgb"
echo "Your Supabase URL: https://bzlenegoilnswsbanxgb.supabase.co"
echo ""
echo "To get your API keys, you have two options:"
echo ""
echo "Option 1: Via Supabase Dashboard (Recommended)"
echo "==========================================="
echo "1. Open your browser and go to:"
echo "   https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb/settings/api"
echo ""
echo "2. Sign in with your Supabase account"
echo ""
echo "3. In the 'Project API keys' section, you'll find:"
echo "   - anon (public): This is safe to use in your frontend"
echo "   - service_role (secret): Only use this in backend/server code"
echo ""
echo "4. Copy the 'anon' key and add it to your .env file:"
echo "   VITE_SUPABASE_ANON_KEY=<paste-your-anon-key-here>"
echo ""

echo "Option 2: Using Supabase CLI"
echo "============================"
echo "1. Install Supabase CLI if you haven't:"
echo "   npm install -g supabase"
echo ""
echo "2. Login to Supabase:"
echo "   supabase login"
echo ""
echo "3. Link to your project:"
echo "   supabase link --project-ref bzlenegoilnswsbanxgb"
echo ""
echo "4. Get your keys:"
echo "   supabase status"
echo ""

echo "Quick Setup:"
echo "==========="
echo "1. Create a .env file in your project root:"
echo "   cp .env.example .env"
echo ""
echo "2. Edit the .env file and add your anon key"
echo ""
echo "3. Restart your development server:"
echo "   npm run dev"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "✓ .env file exists"
    
    # Check if anon key is set
    if grep -q "VITE_SUPABASE_ANON_KEY=your-anon-key-here" .env; then
        echo "⚠️  You still need to update the VITE_SUPABASE_ANON_KEY in .env"
    else
        echo "✓ VITE_SUPABASE_ANON_KEY appears to be set"
    fi
else
    echo "⚠️  No .env file found. Creating one from .env.example..."
    cp .env.example .env
    echo "✓ .env file created. Please update it with your API keys."
fi