# Contact Form Setup Instructions

## Quick Start

Your contact form is ready to use! Follow these steps to enable email functionality:

### 1. Sign Up for Resend (Free)

1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Verify your email address

### 2. Get Your API Key

1. In the Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "Sothis Contact Form")
4. Copy the API key (you'll only see it once!)

### 3. Add API Key to Your Project

1. Open the file `.env.local` in your project root
2. Replace `your_resend_api_key_here` with your actual API key:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   CONTACT_EMAIL=sothistherapeutic@gmail.com
   ```
3. Save the file

### 4. Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart it:
npm run dev
```

### 5. Test the Contact Form

1. Go to http://localhost:3000/contact
2. Fill out the form
3. Click "Send Message"
4. Check sothistherapeutic@gmail.com for the email!

## Using Your Custom Domain (Optional)

Once you're ready to use emails from @sothistherapeutic.com:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter `sothistherapeutic.com`
4. Resend will give you DNS records
5. Add those records to your GoDaddy DNS settings
6. Wait for verification (usually 5-15 minutes)
7. Update the API route to use your domain:
   ```typescript
   from: 'Contact Form <noreply@sothistherapeutic.com>'
   ```

## Troubleshooting

### "Failed to send message" error
- Check that your API key is correct in `.env.local`
- Make sure you restarted the dev server after adding the key
- Check the terminal for error messages

### Emails not arriving
- Check spam folder
- Verify the API key is active in Resend dashboard
- Check Resend dashboard for delivery logs

### Rate Limits
- Free tier: 100 emails/day, 3,000/month
- More than enough for a small business contact form

## For Production (Vercel Deployment)

When you deploy to Vercel:

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add:
   - `RESEND_API_KEY`: Your Resend API key
   - `CONTACT_EMAIL`: sothistherapeutic@gmail.com
4. Redeploy your site

## Need Help?

- Resend Documentation: https://resend.com/docs
- Resend Support: support@resend.com
