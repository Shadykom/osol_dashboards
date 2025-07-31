#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('\n🚀 OSOL Dashboard Email Configuration Setup\n');

async function setupEmail() {
  try {
    // Check if .env exists
    const envPath = join(process.cwd(), '.env');
    let envContent = '';
    
    if (existsSync(envPath)) {
      envContent = readFileSync(envPath, 'utf8');
      console.log('✅ Found existing .env file\n');
    } else {
      console.log('📝 Creating new .env file\n');
    }

    // Ask for email service choice
    console.log('Available email services:');
    console.log('1. Mock (default - for testing, no actual emails sent)');
    console.log('2. SendGrid (recommended for production)');
    console.log('3. Resend (modern email API)');
    console.log('4. SMTP (Gmail, Outlook, etc.)');
    console.log('5. Keep current configuration\n');

    const choice = await question('Select email service (1-5): ');

    if (choice === '5') {
      console.log('\n✅ Keeping current configuration');
      rl.close();
      return;
    }

    let emailConfig = '\n# Email Service Configuration\n';

    switch (choice) {
      case '1':
        emailConfig += 'VITE_EMAIL_SERVICE=mock\n';
        console.log('\n✅ Mock email service configured');
        console.log('⚠️  Emails will be logged but not actually sent');
        break;

      case '2':
        emailConfig += 'VITE_EMAIL_SERVICE=sendgrid\n';
        const sgKey = await question('\nEnter your SendGrid API key: ');
        emailConfig += `VITE_SENDGRID_API_KEY=${sgKey}\n`;
        console.log('\n✅ SendGrid configured');
        break;

      case '3':
        emailConfig += 'VITE_EMAIL_SERVICE=resend\n';
        const resendKey = await question('\nEnter your Resend API key: ');
        emailConfig += `VITE_RESEND_API_KEY=${resendKey}\n`;
        console.log('\n✅ Resend configured');
        break;

      case '4':
        emailConfig += 'VITE_EMAIL_SERVICE=smtp\n';
        const smtpHost = await question('\nEnter SMTP host (e.g., smtp.gmail.com): ');
        const smtpPort = await question('Enter SMTP port (e.g., 587): ');
        const smtpUser = await question('Enter SMTP username/email: ');
        const smtpPass = await question('Enter SMTP password: ');
        
        emailConfig += `VITE_SMTP_HOST=${smtpHost}\n`;
        emailConfig += `VITE_SMTP_PORT=${smtpPort}\n`;
        emailConfig += `VITE_SMTP_SECURE=false\n`;
        emailConfig += `VITE_SMTP_USER=${smtpUser}\n`;
        emailConfig += `VITE_SMTP_PASS=${smtpPass}\n`;
        console.log('\n✅ SMTP configured');
        break;

      default:
        console.log('\n❌ Invalid choice. Using mock service.');
        emailConfig += 'VITE_EMAIL_SERVICE=mock\n';
    }

    // Common settings
    if (choice !== '1') {
      const fromEmail = await question('\nEnter sender email address (default: reports@osol-banking.com): ');
      const fromName = await question('Enter sender name (default: OSOL Banking Reports): ');
      
      emailConfig += `VITE_EMAIL_FROM=${fromEmail || 'reports@osol-banking.com'}\n`;
      emailConfig += `VITE_EMAIL_FROM_NAME=${fromName || 'OSOL Banking Reports'}\n`;
    }

    // Update or append to .env
    if (envContent.includes('VITE_EMAIL_SERVICE')) {
      // Replace existing email configuration
      const lines = envContent.split('\n');
      const emailStart = lines.findIndex(line => line.includes('# Email Service Configuration'));
      const emailEnd = lines.findIndex((line, index) => index > emailStart && line.startsWith('#') && !line.includes('Email'));
      
      if (emailStart !== -1) {
        const before = lines.slice(0, emailStart).join('\n');
        const after = emailEnd !== -1 ? lines.slice(emailEnd).join('\n') : '';
        envContent = before + emailConfig + after;
      } else {
        envContent += emailConfig;
      }
    } else {
      envContent += emailConfig;
    }

    writeFileSync(envPath, envContent);
    console.log('\n✅ Email configuration saved to .env file');
    console.log('\n📚 For more information, see EMAIL_CONFIGURATION_GUIDE.md');
    
    // Test email option
    const testEmail = await question('\nWould you like to send a test email? (y/n): ');
    if (testEmail.toLowerCase() === 'y') {
      const testRecipient = await question('Enter test email recipient: ');
      console.log(`\n📧 To send a test email to ${testRecipient}:`);
      console.log('1. Start the application: npm run dev');
      console.log('2. Go to Reports page');
      console.log('3. Generate any report');
      console.log('4. Click "Send Email" and enter the test recipient');
    }

  } catch (error) {
    console.error('\n❌ Error during setup:', error.message);
  } finally {
    rl.close();
  }
}

setupEmail();