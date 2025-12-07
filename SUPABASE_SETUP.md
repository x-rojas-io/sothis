# Supabase Setup Guide for Booking System

## Step 1: Create Supabase Account (5 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Click **Start your project**
3. Sign up with GitHub (recommended) or email
4. Verify your email

## Step 2: Create New Project (2 minutes)

1. Click **New Project**
2. Fill in details:
   - **Name**: sothis-booking
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to Edgewater, NJ (e.g., East US)
   - **Pricing Plan**: Free
3. Click **Create new project**
4. Wait ~2 minutes for setup

## Step 3: Run Database Schema (3 minutes)

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

## Step 4: Get API Keys (2 minutes)

1. Go to **Settings** → **API** (left sidebar)
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (long string - keep secret!)

## Step 5: Add to Environment Variables (1 minute)

Add to your `.env.local` file:

```env
# Existing variables
RESEND_API_KEY=your_resend_api_key
CONTACT_EMAIL=sothistherapeutic@gmail.com

# New Supabase variables
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_secret_here
```

To generate NEXTAUTH_SECRET, run:
```bash
openssl rand -base64 32
```

## Step 6: Verify Database Setup (2 minutes)

1. In Supabase dashboard, go to **Table Editor**
2. You should see these tables:
   - users
   - availability_templates
   - time_slots
   - bookings
3. Click on **availability_templates**
4. You should see 3 rows (Mon, Wed, Fri)

## Step 7: Configure Authentication (3 minutes)

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Scroll down to **Email Templates**
4. Customize if desired (optional)
5. Save

## What the Schema Includes

### Tables Created
✅ **users** - Admin and client accounts  
✅ **availability_templates** - Nancy's general schedule  
✅ **time_slots** - Released slots available for booking  
✅ **bookings** - Confirmed appointments  

### Key Features
✅ **15-minute buffer** between appointments (configurable)  
✅ **Automatic slot management** (booked/available status)  
✅ **Row Level Security** (RLS) for data protection  
✅ **Secure cancellation tokens** for client booking management  
✅ **Triggers** for automatic status updates  

### Sample Data Inserted
- Admin user: sothistherapeutic@gmail.com
- Availability: Mon, Wed, Fri 9am-5pm
- Slot duration: 60 minutes
- Buffer: 15 minutes

## Troubleshooting

### "Permission denied" error
- Make sure you're logged into Supabase
- Check that RLS policies are created
- Verify you're using the correct API keys

### Tables not showing
- Refresh the page
- Check SQL Editor for errors
- Make sure the schema ran successfully

### Can't connect from Next.js
- Verify environment variables are set
- Restart dev server after adding variables
- Check that NEXT_PUBLIC_ prefix is correct

## Next Steps

After Supabase is set up:
1. ✅ Database ready
2. ⏳ Create Supabase client utility
3. ⏳ Set up NextAuth.js
4. ⏳ Build admin dashboard
5. ⏳ Implement booking system

## Cost

**Free Tier Includes:**
- 500MB database storage
- 2GB bandwidth
- 50,000 monthly active users
- Unlimited API requests

**Current Usage**: <1% of limits  
**Monthly Cost**: $0

---

Once you complete these steps, the database will be ready for the booking system!
