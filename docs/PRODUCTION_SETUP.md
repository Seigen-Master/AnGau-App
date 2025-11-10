# Production Supabase Setup

## 🎯 Your Supabase Project

**Project URL**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz

---

## 🔑 Step 1: Get Your Project Credentials

1. Go to your project dashboard: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/settings/api

2. Copy these values:

   - **Project URL**: `https://fhnhewauxzznxpsfjdqz.supabase.co`
   - **Anon (public) key**: (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **Service role key**: (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

⚠️ **Important**: Keep the service role key secret! Never commit it to git or expose it to the client.

---

## 📝 Step 2: Update Environment Variables

Edit your `.env.local` file:

```env
# Production Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://fhnhewauxzznxpsfjdqz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:9002
NEXT_PUBLIC_APP_NAME=AnGau Care Management

# MCP Server
MCP_PORT=3001
MCP_API_KEY=generate-a-secure-random-key

# Google Maps API (if you have one)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Optional: Firebase (for migration period only)
# Keep these during parallel run, remove after migration complete
FIREBASE_API_KEY=AIzaSyADTROil5PYK81WZS_hYD_yVTD2FH2RrLQ
FIREBASE_AUTH_DOMAIN=angau-app.firebaseapp.com
FIREBASE_PROJECT_ID=angau-app
FIREBASE_STORAGE_BUCKET=angau-app.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=419631690334
FIREBASE_APP_ID=1:419631690334:web:0783019c454b294e77bacf
```

---

## 🔗 Step 3: Link Local Project to Supabase

```bash
# Link your local project to the remote Supabase project
npx supabase link --project-ref fhnhewauxzznxpsfjdqz
```

When prompted:
- Enter your Supabase access token (get it from https://supabase.com/dashboard/account/tokens)
- Confirm the database password (if you don't have it, reset it in the dashboard)

---

## 📤 Step 4: Push Migrations to Production

```bash
# Push your local migrations to the production database
npx supabase db push
```

This will:
- Apply all migrations from `supabase/migrations/`
- Create all 13 tables
- Set up RLS policies
- Create indexes and triggers

---

## 🌱 Step 5: Seed Production Data (Optional)

⚠️ **Warning**: Only do this if you want to add test data to production!

```bash
# Connect to your production database
npx supabase db reset --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.fhnhewauxzznxpsfjdqz.supabase.co:5432/postgres"
```

Or manually run the seed script in the SQL Editor:
1. Go to https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/sql/new
2. Copy contents of `supabase/seed/seed.sql`
3. Run the query

---

## 🔐 Step 6: Configure Authentication

### Enable Email Authentication

1. Go to https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/auth/providers
2. Enable "Email" provider
3. Configure email templates if needed

### Set Site URL

1. Go to https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/auth/url-configuration
2. Set **Site URL**: `http://localhost:9002` (for development)
3. Add **Redirect URLs**: 
   - `http://localhost:9002/**`
   - Your production URL when ready

---

## 💾 Step 7: Configure Storage

### Create Storage Buckets

1. Go to https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/storage/buckets

2. Create these buckets:

   **Bucket 1: patient-profile-pictures**
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg, image/png, image/webp`

   **Bucket 2: user-profile-pictures**
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg, image/png, image/webp`

   **Bucket 3: patient-documents**
   - Public: No (private)
   - File size limit: 10MB
   - Allowed MIME types: `application/pdf, image/jpeg, image/png`

### Set Storage Policies

For each bucket, add RLS policies:

```sql
-- patient-profile-pictures (Public read, authenticated write)
CREATE POLICY "Public can view patient profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'patient-profile-pictures');

CREATE POLICY "Authenticated users can upload patient profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'patient-profile-pictures' 
  AND auth.role() = 'authenticated'
);

-- user-profile-pictures (Public read, own write)
CREATE POLICY "Public can view user profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-profile-pictures');

CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- patient-documents (Private, RLS-based)
CREATE POLICY "Admins and caregivers can view patient documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'patient-documents'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid()
    AND role IN ('admin', 'caregiver')
  )
);

CREATE POLICY "Admins and caregivers can upload patient documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'patient-documents'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid()
    AND role IN ('admin', 'caregiver')
  )
);
```

---

## 🧪 Step 8: Verify Setup

### Test Database Connection

```bash
# Install dependencies first
npm install

# Test connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://fhnhewauxzznxpsfjdqz.supabase.co',
  'YOUR_ANON_KEY'
);
supabase.from('users').select('count').then(console.log);
"
```

### Check Tables

1. Go to https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/editor
2. Verify all 13 tables exist:
   - users
   - patients
   - emergency_contacts
   - patient_documents
   - schedules
   - sub_tasks
   - caregiver_patients
   - requests
   - conversations
   - conversation_participants
   - messages
   - notifications
   - caregiver_notes

### Test RLS Policies

1. Go to https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/auth/policies
2. Verify policies are enabled for all tables

---

## 🚀 Step 9: Generate TypeScript Types

```bash
# Generate types from your production database
npx supabase gen types typescript --project-id fhnhewauxzznxpsfjdqz > src/lib/supabase/database.types.ts
```

---

## 🔄 Step 10: Test the Application

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit http://localhost:9002 and test:
- ✅ Database queries work
- ✅ Authentication works
- ✅ RLS policies enforce correctly
- ✅ Storage uploads work

---

## 📊 Monitoring & Logs

### View Logs

1. **API Logs**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/logs/edge-logs
2. **Database Logs**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/logs/postgres-logs
3. **Auth Logs**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/logs/auth-logs

### Monitor Usage

1. **Database**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/reports/database
2. **API**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/reports/api
3. **Auth**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/reports/auth

---

## 🔐 Security Checklist

Before going to production:

- ✅ All tables have RLS enabled
- ✅ RLS policies tested thoroughly
- ✅ Service role key is secret (not in git)
- ✅ Environment variables are secure
- ✅ Storage buckets have proper policies
- ✅ Auth redirect URLs configured
- ✅ Database backups enabled
- ✅ API rate limiting configured

---

## 🆘 Troubleshooting

### Can't connect to database

1. Check your credentials in `.env.local`
2. Verify project URL: `https://fhnhewauxzznxpsfjdqz.supabase.co`
3. Check if Supabase project is paused (free tier auto-pauses)

### Migrations failed

1. Check migration syntax
2. View error logs in dashboard
3. Try rolling back: `npx supabase db reset`

### RLS blocking queries

1. Check RLS policies in dashboard
2. Verify user is authenticated
3. Check user role in `users` table
4. Test with service role key (bypasses RLS)

---

## 📚 Quick Links

- **Dashboard**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz
- **Table Editor**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/editor
- **SQL Editor**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/sql/new
- **API Docs**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/api
- **Auth**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/auth/users
- **Storage**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/storage/buckets
- **Settings**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/settings/general

---

**Setup Status**: Ready to configure  
**Project ID**: fhnhewauxzznxpsfjdqz  
**Region**: (check in dashboard)

