# 🚀 Simple Start (No Docker Needed)

Hey! Docker isn't installed yet. Let's get you coding faster with a simpler approach!

## ⚡ Quick Start (5 minutes)

### **Step 1: Install Node.js** (2 minutes)

1. **Download**: https://nodejs.org/en/download/prebuilt-installer
2. **Choose**: Windows Installer (.msi) - 64-bit
3. **Install**: Click "Next" through everything
4. **Restart**: Close VS Code and reopen it

---

### **Step 2: Create .env.local** (30 seconds)

Create a file called `.env.local` in your project root and paste this:

```env
NEXT_PUBLIC_SUPABASE_URL=https://fhnhewauxzznxpsfjdqz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobmhld2F1eHp6bnhwc2ZqZHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjEwNTgsImV4cCI6MjA3ODI5NzA1OH0.gwD2aOgp8T0zUP4g7SLk5wMFe2eH2OupVJp2FdxY7Tk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobmhld2F1eHp6bnhwc2ZqZHF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjcyMTA1OCwiZXhwIjoyMDc4Mjk3MDU4fQ.7JdqQrslBWYJP-6bTvWlLRE0sEzdRbzk-WDomuo-WOM
NEXT_PUBLIC_APP_URL=http://localhost:9002
NODE_ENV=development
```

---

### **Step 3: Run These Commands** (2 minutes)

After Node.js is installed, open PowerShell in your project folder:

```powershell
# Install dependencies
npm install

# Start the app
npm run dev
```

**That's it!** Open http://localhost:9002

---

## 🎯 After It's Running

### **Push Database Schema** (Creates all tables)

```powershell
# Link to Supabase
npx supabase link --project-ref fhnhewauxzznxpsfjdqz

# Push schema
npx supabase db push
```

**Verify**: Check tables at https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/editor

---

### **Add Test Data** (Optional)

1. Go to: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/sql/new
2. Copy contents of `supabase/seed/seed.sql`
3. Run the query

---

### **Create Admin User**

1. Go to: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/auth/users
2. Click "Add user"
3. Email: `admin@angau.com`
4. Password: (your choice)

---

## 🎨 Start Coding!

- Edit files in VS Code
- Changes auto-reload
- View at http://localhost:9002
- Vibe and build! ✨

---

## 📚 Commands You'll Use

```powershell
# Start development server
npm run dev

# Stop (Ctrl+C in terminal)

# Install new package
npm install <package-name>

# Build for production
npm run build
```

---

## 💡 Want Docker Later?

Once you have Docker Desktop installed, you can switch to the Docker setup anytime:

1. Install Docker Desktop
2. Run `.\docker-setup.ps1`
3. Done!

But for now, this simple approach gets you coding faster! 🚀

---

**Ready?** Just install Node.js, create `.env.local`, and run `npm install && npm run dev`!

