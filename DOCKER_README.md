# 🐳 Docker Setup - One Command to Rule Them All

## 🚀 Super Quick Start (30 seconds)

### **Windows (PowerShell)**
```powershell
.\docker-setup.ps1
```

### **Mac/Linux (Terminal)**
```bash
chmod +x docker-setup.sh
./docker-setup.sh
```

That's it! 🎉 Your app will be running at http://localhost:9002

---

## 📋 Prerequisites

**Only one thing needed:**
- **Docker Desktop** - Download from: https://www.docker.com/products/docker-desktop

**No need for:**
- ❌ Node.js
- ❌ npm
- ❌ Supabase CLI
- ❌ Manual configuration

Everything runs inside Docker! 🐳

---

## 🎯 What the Setup Script Does

1. ✅ Checks if Docker is installed and running
2. ✅ Creates `.env.local` with your Supabase credentials
3. ✅ Starts Docker containers
4. ✅ Installs all dependencies automatically
5. ✅ Starts the development server
6. ✅ Opens on http://localhost:9002

**Time**: 1-2 minutes (first time), 10 seconds (subsequent times)

---

## 🎮 Commands You'll Use

### **Start Everything**
```bash
# Development mode (with hot reload)
docker-compose -f docker-compose.dev.yml up -d

# Production mode
docker-compose up -d
```

### **Stop Everything**
```bash
docker-compose -f docker-compose.dev.yml down
```

### **View Logs**
```bash
# All logs
docker-compose -f docker-compose.dev.yml logs -f

# Just app logs
docker-compose -f docker-compose.dev.yml logs -f dev
```

### **Restart**
```bash
docker-compose -f docker-compose.dev.yml restart
```

### **Rebuild (after code changes)**
```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

---

## 📁 What's Included

### **docker-compose.dev.yml** (Development)
- Hot reload enabled
- Source code mounted
- Fast iteration
- Debug-friendly

### **docker-compose.yml** (Production)
- Optimized build
- Smaller image size
- Production-ready
- Includes MCP server

### **Dockerfile**
- Multi-stage build
- Optimized layers
- Security best practices
- Alpine Linux (small size)

---

## 🔧 Advanced Usage

### **Run Commands Inside Container**
```bash
# Open shell
docker-compose -f docker-compose.dev.yml exec dev sh

# Run npm commands
docker-compose -f docker-compose.dev.yml exec dev npm install <package>

# Generate Supabase types
docker-compose -f docker-compose.dev.yml exec dev npx supabase gen types typescript --project-id fhnhewauxzznxpsfjdqz > src/lib/supabase/database.types.ts
```

### **Push Database Schema**
```bash
# Install Supabase CLI in container
docker-compose -f docker-compose.dev.yml exec dev npm install -g supabase

# Link and push
docker-compose -f docker-compose.dev.yml exec dev npx supabase link --project-ref fhnhewauxzznxpsfjdqz
docker-compose -f docker-compose.dev.yml exec dev npx supabase db push
```

### **Clean Everything**
```bash
# Stop and remove containers
docker-compose -f docker-compose.dev.yml down

# Remove volumes (fresh start)
docker-compose -f docker-compose.dev.yml down -v

# Remove images
docker-compose -f docker-compose.dev.yml down --rmi all
```

---

## 🐛 Troubleshooting

### **Issue: Docker not found**
**Solution**: Install Docker Desktop from https://www.docker.com/products/docker-desktop

### **Issue: Docker not running**
**Solution**: Start Docker Desktop application

### **Issue: Port 9002 already in use**
**Solution**: 
```bash
# Find what's using the port
netstat -ano | findstr :9002  # Windows
lsof -i :9002                 # Mac/Linux

# Kill the process or change port in docker-compose.dev.yml
```

### **Issue: Container won't start**
**Solution**:
```bash
# View logs
docker-compose -f docker-compose.dev.yml logs

# Rebuild
docker-compose -f docker-compose.dev.yml up -d --build
```

### **Issue: Changes not reflecting**
**Solution**:
```bash
# Restart container
docker-compose -f docker-compose.dev.yml restart

# Or rebuild
docker-compose -f docker-compose.dev.yml up -d --build
```

---

## 📊 Container Status

### **Check Status**
```bash
docker-compose -f docker-compose.dev.yml ps
```

### **View Resource Usage**
```bash
docker stats
```

### **Access Container**
```bash
docker-compose -f docker-compose.dev.yml exec dev sh
```

---

## 🎯 Development Workflow

### **1. Start Coding**
```bash
.\docker-setup.ps1  # or ./docker-setup.sh
```

### **2. Make Changes**
- Edit files in VS Code
- Changes auto-reload (hot reload enabled)
- View at http://localhost:9002

### **3. View Logs**
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

### **4. Stop When Done**
```bash
docker-compose -f docker-compose.dev.yml down
```

---

## 🚀 Production Deployment

### **Build Production Image**
```bash
docker-compose build
```

### **Run Production**
```bash
docker-compose up -d
```

### **Deploy to Cloud**
```bash
# Tag image
docker tag angau-app:latest your-registry/angau-app:latest

# Push to registry
docker push your-registry/angau-app:latest

# Deploy (example: Railway, Render, etc.)
```

---

## 💡 Why Docker?

### **Benefits**
- ✅ **No local setup** - Everything in containers
- ✅ **Consistent environment** - Works same everywhere
- ✅ **Easy sharing** - Share with team instantly
- ✅ **Isolated** - Won't mess up your system
- ✅ **Fast** - Start/stop in seconds
- ✅ **Production-ready** - Same setup for dev and prod

### **vs Traditional Setup**
| Task | Traditional | Docker |
|------|-------------|--------|
| Install Node.js | ✅ Required | ❌ Not needed |
| Install dependencies | `npm install` | Automatic |
| Configure environment | Manual | Automatic |
| Start server | `npm run dev` | One command |
| Share with team | Complex | Share docker-compose.yml |
| Deploy | Configure server | Push image |

---

## 🎉 You're All Set!

Just run the setup script and start coding!

**Windows**: `.\docker-setup.ps1`  
**Mac/Linux**: `./docker-setup.sh`

**App**: http://localhost:9002  
**Supabase Dashboard**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz

---

## 📚 Next Steps

1. ✅ Run setup script
2. ✅ Open http://localhost:9002
3. ✅ Start coding!
4. Push database schema (see Advanced Usage)
5. Create admin user
6. Build features

**Happy coding!** 🚀

