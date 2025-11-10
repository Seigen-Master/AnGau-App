# AnGau App - Supabase Setup Guide

## 🎯 Quick Start

This guide will help you set up the Supabase backend for the AnGau Care Management app.

---

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ Node.js 18+ installed
- ✅ npm or pnpm installed
- ✅ Docker Desktop installed and running
- ✅ Git installed
- ✅ A Supabase account (https://supabase.com)

---

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
# Navigate to project directory
cd "C:\Users\falli\Documents\Dev Projects\AnGau\AnGau-App"

# Install all dependencies (including Supabase)
npm install
```

**Expected output**:
```
added 500+ packages in 30s
```

---

### Step 2: Install Supabase CLI Globally

```bash
npm install -g supabase
```

**Verify installation**:
```bash
supabase --version
```

**Expected output**:
```
1.200.3
```

---

### Step 3: Start Local Supabase

This will start a local Supabase instance using Docker.

```bash
npm run supabase:start
```

**What this does**:
- Starts PostgreSQL database (port 54322)
- Starts Supabase API (port 54321)
- Starts Supabase Studio (port 54323)
- Starts Realtime server
- Starts Storage server
- Applies migrations automatically

**Expected output**:
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Important**: Save the `anon key` and `service_role key` - you'll need them!

---

### Step 4: Configure Environment Variables

Create `.env.local` in the project root:

```bash
# Copy the example file
cp env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
# Supabase Local Development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-step-3>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-from-step-3>

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:9002
NEXT_PUBLIC_APP_NAME=AnGau Care Management

# MCP Server (optional for now)
MCP_PORT=3001
MCP_API_KEY=your-secret-key-here

# Google Maps API (if you have one)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

---

### Step 5: Apply Migrations & Seed Data

The migrations should have been applied automatically when you ran `supabase start`. To verify or re-apply:

```bash
# Reset database (drops all data and re-applies migrations + seed)
npm run supabase:reset
```

**Expected output**:
```
Resetting local database...
Applying migration 20250110000000_initial_schema.sql...
Seeding database...
✅ Seed data inserted successfully!
📊 Summary:
  - Users: 4 (1 admin, 3 caregivers)
  - Patients: 5
  - Emergency Contacts: 6
  - Schedules: 5
  - Conversations: 2
  - Messages: 9
  - Notifications: 3
```

---

### Step 6: Generate TypeScript Types

Generate TypeScript types from your database schema:

```bash
npm run supabase:types
```

**Expected output**:
```
Generating types...
Types written to src/lib/supabase/database.types.ts
```

This will overwrite the placeholder types with actual generated types from your schema.

---

### Step 7: Verify Setup

#### 7.1 Check Supabase Status

```bash
npm run supabase:status
```

**Expected output**:
```
supabase local development setup is running.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
```

#### 7.2 Open Supabase Studio

Open your browser and go to: **http://localhost:54323**

You should see:
- ✅ Supabase Studio dashboard
- ✅ 13 tables in the "Table Editor"
- ✅ Sample data in tables

#### 7.3 Verify Tables

In Supabase Studio, check that these tables exist:
1. users
2. patients
3. emergency_contacts
4. patient_documents
5. schedules
6. sub_tasks
7. caregiver_patients
8. requests
9. conversations
10. conversation_participants
11. messages
12. notifications
13. caregiver_notes

#### 7.4 Verify Seed Data

Click on the `users` table - you should see:
- 1 admin user
- 3 caregiver users

Click on the `patients` table - you should see:
- 5 patient records

---

### Step 8: Create Supabase Auth Users

The seed data created user records, but we need to create corresponding auth users.

**Option 1: Using Supabase Studio**

1. Go to http://localhost:54323
2. Click "Authentication" → "Users"
3. Click "Add user"
4. Create these users:

| Email | Password | Role |
|-------|----------|------|
| admin@angau.com | admin123 | Admin |
| john.caregiver@angau.com | caregiver123 | Caregiver |
| jane.caregiver@angau.com | caregiver123 | Caregiver |
| mike.caregiver@angau.com | caregiver123 | Caregiver |

**Option 2: Using SQL**

Run this in Supabase Studio SQL Editor:

```sql
-- This will be handled by Supabase Auth signup in the app
-- For now, you can manually create users in Studio
```

---

### Step 9: Test the Setup

#### 9.1 Test Database Connection

Create a test file `test-supabase.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://localhost:54321',
  'YOUR_ANON_KEY_HERE'
);

async function test() {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Success! Found', data.length, 'users');
    console.log(data);
  }
}

test();
```

Run it:
```bash
node test-supabase.js
```

**Expected output**:
```
✅ Success! Found 4 users
[
  { id: '...', name: 'Admin User', role: 'admin', ... },
  { id: '...', name: 'John Caregiver', role: 'caregiver', ... },
  ...
]
```

---

## 🎨 Supabase Studio Features

### Table Editor
- View and edit data
- Add/remove rows
- Filter and search

### SQL Editor
- Run custom SQL queries
- Save queries
- View query history

### Authentication
- Manage users
- View sessions
- Configure auth providers

### Storage
- Upload files
- Manage buckets
- Set permissions

### Database
- View schema
- Manage migrations
- Configure RLS policies

### API Docs
- Auto-generated API documentation
- Test endpoints
- View examples

---

## 🔧 Common Commands

### Start/Stop Supabase

```bash
# Start local Supabase
npm run supabase:start

# Stop local Supabase
npm run supabase:stop

# Check status
npm run supabase:status
```

### Database Operations

```bash
# Reset database (drops all data)
npm run supabase:reset

# Generate TypeScript types
npm run supabase:types

# Create a new migration
npx supabase migration new <migration_name>

# Apply migrations
npx supabase db push
```

### Logs

```bash
# View logs
npx supabase logs

# View specific service logs
npx supabase logs db
npx supabase logs api
npx supabase logs realtime
```

---

## 🐛 Troubleshooting

### Issue: Docker not running

**Error**:
```
Error: Cannot connect to the Docker daemon
```

**Solution**:
1. Install Docker Desktop
2. Start Docker Desktop
3. Wait for Docker to fully start
4. Run `npm run supabase:start` again

---

### Issue: Port already in use

**Error**:
```
Error: Port 54321 is already in use
```

**Solution**:
```bash
# Stop Supabase
npm run supabase:stop

# Or change ports in supabase/config.toml
```

---

### Issue: Migration failed

**Error**:
```
Error applying migration
```

**Solution**:
```bash
# Reset database
npm run supabase:reset

# If that doesn't work, stop and restart
npm run supabase:stop
npm run supabase:start
```

---

### Issue: Types not generating

**Error**:
```
Error generating types
```

**Solution**:
```bash
# Make sure Supabase is running
npm run supabase:status

# Try again
npm run supabase:types

# Manual generation
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

---

### Issue: Can't connect to database

**Error**:
```
Error: Connection refused
```

**Solution**:
1. Check Supabase is running: `npm run supabase:status`
2. Check Docker is running
3. Check firewall settings
4. Verify `.env.local` has correct URL and keys

---

## 🔐 Security Notes

### Local Development

- ✅ Use `anon key` for client-side code
- ✅ Use `service_role key` for server-side admin operations
- ⚠️ Never commit `.env.local` to git
- ⚠️ Never expose `service_role key` to client

### Production

- ✅ Use Supabase hosted service
- ✅ Enable RLS on all tables
- ✅ Test RLS policies thoroughly
- ✅ Use environment variables for keys
- ✅ Rotate keys regularly

---

## 📊 Verification Checklist

Before proceeding to Phase 2, verify:

- ✅ Docker is running
- ✅ Supabase is running (`npm run supabase:status`)
- ✅ All 13 tables exist in Supabase Studio
- ✅ Seed data is present (4 users, 5 patients, etc.)
- ✅ TypeScript types are generated
- ✅ `.env.local` is configured
- ✅ Test connection works
- ✅ Supabase Studio is accessible (http://localhost:54323)

---

## 🚀 Next Steps

Once setup is complete:

1. **Test the database**
   - Run test queries
   - Verify RLS policies
   - Test CRUD operations

2. **Proceed to Phase 2**
   - Create Edge Functions
   - Set up scheduled jobs
   - Implement database triggers

3. **Start Phase 3**
   - Refactor frontend to use Supabase
   - Update AuthContext
   - Replace Firebase queries

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Local Development Guide](https://supabase.com/docs/guides/cli/local-development)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [TypeScript Support](https://supabase.com/docs/reference/javascript/typescript-support)

---

## 🆘 Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review Supabase logs: `npx supabase logs`
3. Check Docker logs in Docker Desktop
4. Consult [Supabase Discord](https://discord.supabase.com)
5. Review [GitHub Issues](https://github.com/supabase/supabase/issues)

---

**Setup Guide Version**: 1.0.0  
**Last Updated**: November 10, 2025  
**Status**: Ready for use

