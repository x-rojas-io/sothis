# Deployment Guide: Sothis Therapeutic Massage

## Current Status
✅ All code committed to git  
✅ Ready for deployment  
✅ Contact form functional  
✅ Business information updated  

## Step 1: Create GitHub Repository

### Option A: Using GitHub Website
1. Go to [github.com](https://github.com)
2. Click the **+** icon → **New repository**
3. Repository name: `sothis-therapeutic` (or any name you prefer)
4. Description: "Sothis Therapeutic Massage - Nancy Raza's wellness practice website"
5. **Keep it Private** (for now) or Public (your choice)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **Create repository**

### Option B: Using GitHub CLI (if installed)
```bash
gh repo create sothis-therapeutic --private --source=. --remote=origin --push
```

## Step 2: Push to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/sothis-therapeutic.git

# Push to GitHub
git push -u origin main
```

## Step 3: Deploy to Vercel

### 3.1 Sign Up for Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up**
3. Choose **Continue with GitHub**
4. Authorize Vercel to access your GitHub

### 3.2 Import Project
1. Click **Add New...** → **Project**
2. Find your `sothis-therapeutic` repository
3. Click **Import**

### 3.3 Configure Project
Vercel will auto-detect Next.js settings:
- **Framework Preset**: Next.js ✅ (auto-detected)
- **Root Directory**: `./` ✅
- **Build Command**: `next build` ✅
- **Output Directory**: `.next` ✅

### 3.4 Add Environment Variables
Click **Environment Variables** and add:

| Name | Value |
|------|-------|
| `RESEND_API_KEY` | `re_xxxxx...` (your Resend API key) |
| `CONTACT_EMAIL` | `sothistherapeutic@gmail.com` |

### 3.5 Deploy!
1. Click **Deploy**
2. Wait 1-2 minutes for build
3. You'll get a URL like: `sothis-therapeutic.vercel.app`

## Step 4: Test Deployment

### Check These Pages:
- ✅ Homepage: `https://your-site.vercel.app/`
- ✅ About: `https://your-site.vercel.app/about`
- ✅ Services: `https://your-site.vercel.app/services`
- ✅ Contact: `https://your-site.vercel.app/contact`
- ✅ Blog: `https://your-site.vercel.app/blog`
- ✅ Testimonials: `https://your-site.vercel.app/testimonials`

### Test Contact Form:
1. Go to contact page
2. Fill out form
3. Submit
4. Check sothistherapeutic@gmail.com for email

## Step 5: Share with Nancy

Send her the Vercel URL for review:
```
Hi Nancy,

Your website is ready for review! 

Preview: https://sothis-therapeutic.vercel.app

Please check:
- All content is accurate
- Images look good
- Contact form works (try sending yourself a test message)
- Everything looks good on your phone

Let me know if you'd like any changes!
```

## Step 6: After Approval - Custom Domain

### 6.1 In Vercel Dashboard
1. Go to your project
2. Click **Settings** → **Domains**
3. Add domain: `sothistherapeutic.com`
4. Also add: `www.sothistherapeutic.com`

### 6.2 In GoDaddy
1. Log in to GoDaddy
2. Go to **My Products** → **DNS**
3. Add these records:

**For root domain (sothistherapeutic.com):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 600 seconds
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600 seconds
```

### 6.3 Wait for DNS Propagation
- Usually takes 5-15 minutes
- Can take up to 48 hours
- Vercel will auto-configure HTTPS

## Troubleshooting

### Build Failed
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify environment variables are set

### Contact Form Not Working
- Verify `RESEND_API_KEY` is set in Vercel
- Check Resend dashboard for errors
- Look at Vercel function logs

### Images Not Loading
- Ensure images are in `public/` folder
- Check file names match exactly (case-sensitive)
- Clear browser cache

### Domain Not Working
- Verify DNS records in GoDaddy
- Wait for propagation (up to 48 hours)
- Check Vercel domain status

## Future Updates

### Making Changes
1. Edit code locally
2. Test locally: `npm run dev`
3. Commit: `git add . && git commit -m "Description"`
4. Push: `git push`
5. Vercel auto-deploys! ✨

### Preview Deployments
- Every push to a branch creates a preview URL
- Test changes before merging to main
- Share preview URLs for feedback

## Cost Breakdown

| Item | Cost |
|------|------|
| Vercel Hosting | **Free** |
| GitHub Repository | **Free** |
| Resend Email (3,000/month) | **Free** |
| Domain (already purchased) | $15/year |
| **Total Monthly** | **$0** |

## Next Steps After Launch

1. **Analytics**: Add Vercel Analytics (free)
2. **SEO**: Submit to Google Search Console
3. **Monitoring**: Set up Vercel monitoring
4. **Booking System**: Plan and develop
5. **Custom Email**: Configure Resend with custom domain

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Resend Docs**: https://resend.com/docs

---

**Ready to deploy?** Follow the steps above and you'll have a live site in ~10 minutes! 🚀
