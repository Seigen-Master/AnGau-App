# 🚀 Quick Start Guide

## Your Supabase Project

**Project ID**: `fhnhewauxzznxpsfjdqz`  
**Dashboard**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz

---

## ⚡ Quick Setup (5 minutes)

### 1. Get Your Credentials

Go to: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/settings/api

Copy:
- **Project URL**: `https://fhnhewauxzznxpsfjdqz.supabase.co`
- **Anon key**: (the public key)
- **Service role key**: (the secret key)

### 2. Configure Environment

Create `.env.local`:

```bash
# Copy the template
cp env.example .env.local
```

Edit `.env.local` and paste your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://fhnhewauxzznxpsfjdqz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Install & Setup

```bash
# Install dependencies
npm install

# Link to your Supabase project
npx supabase link --project-ref fhnhewauxzznxpsfjdqz

# Push database schema
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript --project-id fhnhewauxzznxpsfjdqz > src/lib/supabase/database.types.ts
```

### 4. Verify Setup

```bash
# Start the app
npm run dev
```

Visit: http://localhost:9002

---

## 📋 Verification Checklist

Go to your dashboard and verify:

1. **Tables Created** (13 tables)
   - https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/editor
   - ✅ users, patients, schedules, etc.

2. **RLS Enabled**
   - https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/auth/policies
   - ✅ All tables have policies

3. **Auth Configured**
   - https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/auth/providers
   - ✅ Email provider enabled

4. **Storage Buckets** (optional, can do later)
   - https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/storage/buckets
   - Create: patient-profile-pictures, user-profile-pictures, patient-documents

---

## 🎯 Next Steps

1. **Add Test Data** (optional)
   - Go to SQL Editor: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/sql/new
   - Copy/paste from `supabase/seed/seed.sql`
   - Run query

2. **Create Admin User**
   - Go to Auth: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/auth/users
   - Click "Add user"
   - Email: `admin@angau.com`
   - Password: (your choice)
   - Then add to `users` table with role='admin'

3. **Test the App**
   - Login with admin user
   - Verify dashboard loads
   - Check database queries work

---

## 📚 Documentation

- **[Production Setup Guide](./docs/PRODUCTION_SETUP.md)** - Detailed setup
- **[Setup Guide](./docs/SETUP_GUIDE.md)** - Local development
- **[Phase 1 Progress](./docs/phase-1-progress.md)** - Current status
- **[Migration Plan](./docs/supabase-migration-plan.md)** - Full roadmap

---

## 🆘 Need Help?

**Common Issues:**

1. **Can't connect**: Check `.env.local` has correct URL and keys
2. **Tables not created**: Run `npx supabase db push`
3. **Types not working**: Run `npx supabase gen types...`
4. **RLS blocking**: Check user is authenticated and has correct role

**Get Support:**
- Check [Troubleshooting](./docs/PRODUCTION_SETUP.md#-troubleshooting)
- View [Supabase Docs](https://supabase.com/docs)
- Ask in [Supabase Discord](https://discord.supabase.com)

---

**Status**: Ready to configure ✅  
**Estimated Time**: 5-10 minutes

