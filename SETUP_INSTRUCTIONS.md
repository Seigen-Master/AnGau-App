# 🚀 Complete Setup Instructions

## ✅ Your Credentials Are Ready!

I've configured everything with your Supabase credentials:
- **Project URL**: `https://fhnhewauxzznxpsfjdqz.supabase.co`
- **Anon Key**: ✓ Configured
- **Service Role Key**: ✓ Configured

---

## 📋 Step-by-Step Setup

### Step 1: Create .env.local File

1. **Create a new file** in your project root called `.env.local`

2. **Copy and paste this content** into `.env.local`:

```env
# ============================================
# AnGau App - Environment Variables
# ============================================
# IMPORTANT: Never commit this file to git!

# --------------------------------------------
# Supabase Configuration (Production)
# --------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://fhnhewauxzznxpsfjdqz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobmhld2F1eHp6bnhwc2ZqZHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjEwNTgsImV4cCI6MjA3ODI5NzA1OH0.gwD2aOgp8T0zUP4g7SLk5wMFe2eH2OupVJp2FdxY7Tk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobmhld2F1eHp6bnhwc2ZqZHF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjcyMTA1OCwiZXhwIjoyMDc4Mjk3MDU4fQ.7JdqQrslBWYJP-6bTvWlLRE0sEzdRbzk-WDomuo-WOM

# --------------------------------------------
# App Configuration
# --------------------------------------------
NEXT_PUBLIC_APP_URL=http://localhost:9002
NEXT_PUBLIC_APP_NAME=AnGau Care Management

# --------------------------------------------
# MCP Server Configuration
# --------------------------------------------
MCP_PORT=3001
MCP_API_KEY=angau-mcp-secret-key-2025

# --------------------------------------------
# Google Maps API (for address/location features)
# --------------------------------------------
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# --------------------------------------------
# Optional: Firebase (for migration period only)
# --------------------------------------------
FIREBASE_API_KEY=AIzaSyADTROil5PYK81WZS_hYD_yVTD2FH2RrLQ
FIREBASE_AUTH_DOMAIN=angau-app.firebaseapp.com
FIREBASE_PROJECT_ID=angau-app
FIREBASE_STORAGE_BUCKET=angau-app.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=419631690334
FIREBASE_APP_ID=1:419631690334:web:0783019c454b294e77bacf

# --------------------------------------------
# Development/Debug
# --------------------------------------------
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

3. **Save the file** in the root directory: `C:\Users\falli\Documents\Dev Projects\AnGau\AnGau-App\.env.local`

---

### Step 2: Install Node.js (If Not Installed)

If you don't have Node.js installed:

1. Download from: https://nodejs.org/
2. Install the LTS version (recommended)
3. Restart your terminal/PowerShell after installation
4. Verify: `node --version` and `npm --version`

---

### Step 3: Install Dependencies

Open PowerShell or Command Prompt in your project directory and run:

```bash
npm install
```

**Expected output**: Installation of ~500 packages (takes 1-2 minutes)

---

### Step 4: Link to Supabase Project

```bash
npx supabase link --project-ref fhnhewauxzznxpsfjdqz
```

**When prompted**:
- Enter your database password (check your Supabase dashboard if you forgot it)
- Or create a new access token at: https://supabase.com/dashboard/account/tokens

---

### Step 5: Push Database Schema

```bash
npx supabase db push
```

**What this does**:
- Creates all 13 tables in your Supabase database
- Sets up RLS policies
- Creates indexes and triggers

**Expected output**:
```
Applying migration 20250110000000_initial_schema.sql...
✓ Migration applied successfully
```

**Verify**: Check your tables at https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/editor

---

### Step 6: Generate TypeScript Types

```bash
npx supabase gen types typescript --project-id fhnhewauxzznxpsfjdqz > src/lib/supabase/database.types.ts
```

**What this does**:
- Generates TypeScript types from your database schema
- Provides full type safety for queries

---

### Step 7: Add Seed Data (Optional)

To add test data to your database:

1. Go to: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/sql/new
2. Copy the contents of `supabase/seed/seed.sql`
3. Paste and run the query

**This will create**:
- 4 users (1 admin, 3 caregivers)
- 5 patients
- 6 emergency contacts
- 5 schedules
- 2 conversations with messages
- 3 notifications

---

### Step 8: Start the Application

```bash
npm run dev
```

**Expected output**:
```
▲ Next.js 15.3.3
- Local:        http://localhost:9002
- ready in 2.5s
```

**Open**: http://localhost:9002

---

## ✅ Verification Checklist

After completing all steps, verify:

### 1. Environment Variables
- [ ] `.env.local` file exists in project root
- [ ] Contains your Supabase URL and keys
- [ ] File is NOT committed to git

### 2. Database Tables
- [ ] Visit: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/editor
- [ ] See 13 tables: users, patients, schedules, etc.
- [ ] Tables have data (if you ran seed script)

### 3. Application
- [ ] `npm run dev` starts without errors
- [ ] Can access http://localhost:9002
- [ ] No console errors about Supabase connection

---

## 🐛 Troubleshooting

### Issue: "npm is not recognized"

**Solution**: Install Node.js from https://nodejs.org/

### Issue: "Cannot link to Supabase"

**Solution**: 
1. Get an access token: https://supabase.com/dashboard/account/tokens
2. Use it when prompted during `supabase link`

### Issue: "Migration failed"

**Solution**:
1. Check your database password is correct
2. Try resetting: `npx supabase db reset`
3. View logs in Supabase dashboard

### Issue: "Types not generating"

**Solution**:
```bash
# Make sure you're linked first
npx supabase link --project-ref fhnhewauxzznxpsfjdqz

# Then generate types
npx supabase gen types typescript --project-id fhnhewauxzznxpsfjdqz > src/lib/supabase/database.types.ts
```

### Issue: "Can't connect to database"

**Solution**:
1. Verify `.env.local` has correct credentials
2. Check Supabase project is not paused (free tier auto-pauses)
3. Restart the dev server: `npm run dev`

---

## 🎯 Quick Commands Reference

```bash
# Install dependencies
npm install

# Link to Supabase
npx supabase link --project-ref fhnhewauxzznxpsfjdqz

# Push database schema
npx supabase db push

# Generate types
npx supabase gen types typescript --project-id fhnhewauxzznxpsfjdqz > src/lib/supabase/database.types.ts

# Start development server
npm run dev

# Check Supabase status
npx supabase status

# View Supabase logs
npx supabase logs
```

---

## 📚 Next Steps After Setup

Once everything is working:

1. **Create Admin User**
   - Go to: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/auth/users
   - Click "Add user"
   - Email: `admin@angau.com`
   - Password: (your choice)
   - Then add to `users` table with `role='admin'`

2. **Configure Storage Buckets** (for file uploads)
   - Go to: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/storage/buckets
   - Create: `patient-profile-pictures`, `user-profile-pictures`, `patient-documents`

3. **Test the Application**
   - Login with admin user
   - Create test caregivers
   - Create test patients
   - Create schedules

4. **Proceed to Phase 2**
   - Create Edge Functions
   - Set up scheduled jobs
   - Implement realtime features

---

## 📞 Need Help?

- **Documentation**: See [docs/INDEX.md](docs/INDEX.md)
- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com

---

## 🎉 You're All Set!

Your Supabase backend is configured and ready to use!

**Project Dashboard**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz

**Status**: ✅ Credentials configured, ready to install and deploy!

