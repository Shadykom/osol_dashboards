# Email Configuration Guide for OSOL Dashboard

## Current Issue
The email service is currently using a mock implementation that doesn't actually send emails. This guide will help you set up a real email service.

## Email Service Options

### 1. SendGrid (Recommended)
SendGrid is easy to set up and has a generous free tier.

#### Setup Steps:
1. Sign up for SendGrid at https://sendgrid.com
2. Create an API key in Settings > API Keys
3. Add to your `.env` file:
```
VITE_EMAIL_SERVICE=sendgrid
VITE_SENDGRID_API_KEY=your_sendgrid_api_key_here
VITE_EMAIL_FROM=reports@yourdomain.com
VITE_EMAIL_FROM_NAME=OSOL Banking Reports
```

### 2. Resend
Modern email API with good developer experience.

#### Setup Steps:
1. Sign up at https://resend.com
2. Get your API key from the dashboard
3. Add to your `.env` file:
```
VITE_EMAIL_SERVICE=resend
VITE_RESEND_API_KEY=your_resend_api_key_here
VITE_EMAIL_FROM=reports@yourdomain.com
VITE_EMAIL_FROM_NAME=OSOL Banking Reports
```

### 3. SMTP (Gmail, Outlook, etc.)
Use any SMTP server including Gmail or your own mail server.

#### Setup Steps for Gmail:
1. Enable 2-factor authentication on your Gmail account
2. Generate an app-specific password
3. Add to your `.env` file:
```
VITE_EMAIL_SERVICE=smtp
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=false
VITE_SMTP_USER=your_email@gmail.com
VITE_SMTP_PASS=your_app_specific_password
VITE_EMAIL_FROM=your_email@gmail.com
VITE_EMAIL_FROM_NAME=OSOL Banking Reports
```

### 4. Vercel Email (for Vercel deployments)
If deploying on Vercel, you can use their email service.

#### Setup Steps:
1. Install Vercel Email in your project dashboard
2. Configure the email service
3. The environment variables will be automatically set

## Implementation Status

Currently, the email service uses a mock implementation that:
- Logs email details to console
- Returns a success response without sending
- Stores email logs in the database

To enable real email sending, you need to:
1. Choose an email service provider
2. Set up the appropriate environment variables
3. Update the `emailService.js` to use the real API

## Testing Email Delivery

After configuration:
1. Use the "Send Test Email" feature in the Reports page
2. Check the console logs for any errors
3. Verify email delivery in the recipient's inbox
4. Check spam folder if email is not in inbox

## Troubleshooting

### Common Issues:
1. **Emails not sending**: Check API keys and environment variables
2. **Emails in spam**: Configure SPF/DKIM records for your domain
3. **Rate limits**: Most services have sending limits on free tiers
4. **Attachment issues**: Ensure attachments are properly base64 encoded

### Debug Steps:
1. Check browser console for errors
2. Verify environment variables are loaded: `console.log(import.meta.env)`
3. Test with a simple text email first
4. Check email service dashboard for logs

## Security Considerations

1. Never commit API keys to version control
2. Use environment variables for all sensitive data
3. Implement rate limiting to prevent abuse
4. Validate email addresses before sending
5. Use email templates to prevent injection attacks