#!/usr/bin/env node

import fs from 'fs';

// This script helps you get the Supabase anon key for your project
// Since we can't directly access the Supabase dashboard API without authentication,
// we'll provide a solution that works with the information we have

const projectRef = 'bzlenegoilnswsbanxgb';
const supabaseUrl = `https://${projectRef}.supabase.co`;

console.log('🔧 Supabase Anon Key Helper');
console.log('===========================\n');

console.log('Your Supabase Project Details:');
console.log(`Project Reference: ${projectRef}`);
console.log(`Project URL: ${supabaseUrl}`);
console.log(`Connection String: postgresql://postgres:OSOL1a15975311@db.${projectRef}.supabase.co:5432/postgres\n`);

// Generate a temporary anon key based on the JWT structure
// Note: This is a workaround - you should get the real key from the dashboard
const header = {
  "alg": "HS256",
  "typ": "JWT"
};

const payload = {
  "iss": `https://${projectRef}.supabase.co/auth/v1`,
  "ref": projectRef,
  "role": "anon",
  "iat": Math.floor(Date.now() / 1000),
  "exp": Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year from now
};

console.log('📋 INSTRUCTIONS TO GET YOUR ANON KEY:');
console.log('=====================================\n');

console.log('Option 1: Via Supabase Dashboard (RECOMMENDED)');
console.log('----------------------------------------------');
console.log(`1. Open your browser and go to:`);
console.log(`   https://supabase.com/dashboard/project/${projectRef}/settings/api\n`);
console.log('2. Sign in with your Supabase account\n');
console.log('3. Look for "Project API keys" section\n');
console.log('4. Copy the "anon" key (it starts with "eyJ...")\n');
console.log('5. Update your .env file with:');
console.log('   VITE_SUPABASE_ANON_KEY=<paste-your-anon-key-here>\n');

console.log('Option 2: Use Supabase CLI');
console.log('---------------------------');
console.log('1. Install Supabase CLI:');
console.log('   npm install -g supabase\n');
console.log('2. Login to Supabase:');
console.log('   supabase login\n');
console.log(`3. Link to your project:`);
console.log(`   supabase link --project-ref ${projectRef}\n`);
console.log('4. Get your project status:');
console.log('   supabase status\n');

console.log('Option 3: Quick Workaround (TEMPORARY)');
console.log('--------------------------------------');
console.log('The application is already configured to use mock data');
console.log('when the database is unavailable. Check the browser');
console.log('console for "Using mock data" messages.\n');

console.log('⚠️  IMPORTANT: The 401 errors you\'re seeing are because');
console.log('   Row Level Security (RLS) is enabled on your tables.');
console.log('   You need either:');
console.log('   1. The correct anon key from the dashboard');
console.log('   2. Or disable RLS for testing (not recommended for production)\n');

// Create a sample .env file
const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE

# Get your anon key from:
# https://supabase.com/dashboard/project/${projectRef}/settings/api

# Database Connection (for reference only - don't use in frontend)
# DATABASE_URL=postgresql://postgres:OSOL1a15975311@db.${projectRef}.supabase.co:5432/postgres
`;

fs.writeFileSync('.env.example', envContent);
console.log('✅ Created .env.example file with configuration template\n');

console.log('Next Steps:');
console.log('-----------');
console.log('1. Get your anon key from the Supabase dashboard');
console.log('2. Copy .env.example to .env');
console.log('3. Replace YOUR_ANON_KEY_HERE with your actual key');
console.log('4. Restart your development server\n');