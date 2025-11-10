# Model Context Protocol (MCP) Setup Guide

## Overview

The Model Context Protocol (MCP) enables Cursor AI to interact directly with your Supabase backend, providing:

- Direct database queries from the editor
- Schema inspection and migration management
- Seed data generation and testing utilities
- Real-time debugging and data exploration

---

## Architecture

```
┌─────────────────┐
│  Cursor Editor  │
│   (MCP Client)  │
└────────┬────────┘
         │
         │ MCP Protocol (JSON-RPC)
         │
┌────────▼────────┐
│   MCP Server    │
│  (Node/Deno)    │
└────────┬────────┘
         │
         │ Supabase Client
         │
┌────────▼────────┐
│  Supabase API   │
│   (Postgres)    │
└─────────────────┘
```

---

## Prerequisites

1. **Supabase Project**
   - Project URL: `https://<project-ref>.supabase.co`
   - Service Role Key (for server-side operations)
   - Anon Key (for client-side operations)

2. **Node.js/Deno Runtime**
   - Node.js 18+ or Deno 1.40+

3. **Cursor Editor**
   - Latest version with MCP support

---

## Phase 5: MCP Implementation Steps

### Step 1: Create MCP Server

Create a new directory for the MCP server:

```bash
mkdir mcp-server
cd mcp-server
npm init -y
```

Install dependencies:

```bash
npm install @supabase/supabase-js dotenv express
npm install -D @types/node @types/express typescript tsx
```

Create `mcp-server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Step 2: Implement MCP Server

Create `mcp-server/src/index.ts`:

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Execute raw SQL query
app.post('/query', async (req, res) => {
  try {
    const { sql, params } = req.body;
    const { data, error } = await supabase.rpc('execute_sql', { 
      query: sql, 
      params: params || [] 
    });
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get table schema
app.get('/schema/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', table);
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List all tables
app.get('/tables', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get migration status
app.get('/migrations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('supabase_migrations.schema_migrations')
      .select('*')
      .order('version', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Seed data (example)
app.post('/seed', async (req, res) => {
  try {
    const { table, data } = req.body;
    const { error } = await supabase.from(table).insert(data);
    
    if (error) throw error;
    res.json({ success: true, message: `Seeded ${table}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get users
app.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(100);
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get schedules
app.get('/schedules', async (req, res) => {
  try {
    const { caregiver_id, status, limit = 50 } = req.query;
    let query = supabase.from('schedules').select('*');
    
    if (caregiver_id) query = query.eq('caregiver_id', caregiver_id);
    if (status) query = query.eq('status', status);
    
    const { data, error } = await query.limit(Number(limit));
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get patients
app.get('/patients', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .limit(100);
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analytics endpoint
app.get('/analytics/summary', async (req, res) => {
  try {
    const [usersCount, patientsCount, schedulesCount, requestsCount] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('schedules').select('*', { count: 'exact', head: true }),
      supabase.from('requests').select('*', { count: 'exact', head: true }),
    ]);
    
    res.json({
      success: true,
      data: {
        users: usersCount.count,
        patients: patientsCount.count,
        schedules: schedulesCount.count,
        requests: requestsCount.count,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.MCP_PORT || 3001;
app.listen(PORT, () => {
  console.log(`MCP Server running on http://localhost:${PORT}`);
});
```

### Step 3: Create Environment Configuration

Create `mcp-server/.env`:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
MCP_PORT=3001
```

**⚠️ SECURITY WARNING:**
- Never commit `.env` files to version control
- Use environment-specific configurations
- Rotate keys regularly
- Limit service role key usage to server-side only

### Step 4: Add Scripts to package.json

Update `mcp-server/package.json`:

```json
{
  "name": "angau-mcp-server",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### Step 5: Configure Cursor MCP Client

Create `.cursor/mcp-config.json` in the root of your project:

```json
{
  "mcpServers": {
    "angau-supabase": {
      "url": "http://localhost:3001",
      "description": "AnGau Supabase MCP Server",
      "capabilities": [
        "query",
        "schema",
        "migrations",
        "seed"
      ]
    }
  }
}
```

### Step 6: Start MCP Server

```bash
cd mcp-server
npm run dev
```

---

## Usage in Cursor

### 1. Query Database

In Cursor, you can now use MCP commands:

```
@mcp query users where role = 'caregiver'
```

This will translate to:

```typescript
fetch('http://localhost:3001/users?role=caregiver')
```

### 2. Inspect Schema

```
@mcp schema schedules
```

### 3. View Migrations

```
@mcp migrations
```

### 4. Seed Test Data

```
@mcp seed patients with test data
```

---

## Advanced MCP Features

### Custom Commands

Add domain-specific commands to the MCP server:

```typescript
// Get caregiver workload
app.get('/caregiver/:id/workload', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('caregiver_id', id)
    .eq('status', 'pending')
    .gte('start_timestamp', new Date().toISOString());
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, workload: data.length, schedules: data });
});

// Get patient care history
app.get('/patient/:id/history', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('schedules')
    .select('*, caregiver:users(name)')
    .eq('patient_id', id)
    .order('start_timestamp', { ascending: false })
    .limit(20);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});
```

### Real-time Subscriptions

Add WebSocket support for real-time updates:

```typescript
import { Server } from 'socket.io';
import http from 'http';

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Subscribe to schedule changes
  const scheduleChannel = supabase
    .channel('schedules')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'schedules' },
      (payload) => {
        socket.emit('schedule_update', payload);
      }
    )
    .subscribe();
  
  socket.on('disconnect', () => {
    scheduleChannel.unsubscribe();
    console.log('Client disconnected:', socket.id);
  });
});
```

---

## Security Best Practices

### 1. Authentication

Add API key authentication to MCP server:

```typescript
const MCP_API_KEY = process.env.MCP_API_KEY;

app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== MCP_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

### 2. Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

### 3. Input Validation

```bash
npm install zod
```

```typescript
import { z } from 'zod';

const querySchema = z.object({
  sql: z.string().max(1000),
  params: z.array(z.any()).optional()
});

app.post('/query', async (req, res) => {
  try {
    const { sql, params } = querySchema.parse(req.body);
    // ... execute query
  } catch (error) {
    res.status(400).json({ error: 'Invalid input' });
  }
});
```

---

## Deployment

### Option 1: Local Development Only

Keep MCP server running locally for development:

```bash
npm run dev
```

### Option 2: Deploy to Cloud

Deploy MCP server to a cloud provider (Railway, Render, Fly.io):

1. Add `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

2. Deploy:

```bash
# Example: Railway
railway up
```

3. Update Cursor config with production URL:

```json
{
  "mcpServers": {
    "angau-supabase": {
      "url": "https://your-mcp-server.railway.app",
      "apiKey": "${MCP_API_KEY}"
    }
  }
}
```

---

## Troubleshooting

### MCP Server Not Responding

1. Check if server is running: `curl http://localhost:3001/health`
2. Verify environment variables are set
3. Check Supabase credentials
4. Review server logs

### Cursor Not Connecting

1. Verify `.cursor/mcp-config.json` exists
2. Restart Cursor editor
3. Check MCP server URL is correct
4. Ensure no firewall blocking localhost:3001

### Permission Errors

1. Verify Supabase service role key has correct permissions
2. Check RLS policies are not blocking queries
3. Use service role key (bypasses RLS) for admin operations

---

## Future Enhancements

1. **GraphQL Support**: Add GraphQL layer for complex queries
2. **Caching**: Implement Redis caching for frequently accessed data
3. **Audit Logging**: Track all MCP operations for security
4. **AI Integration**: Connect MCP to AI models for intelligent queries
5. **Multi-tenant Support**: Support multiple Supabase projects

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Cursor MCP Guide](https://docs.cursor.com/mcp)

---

*Document created: Phase 0 — Preparation*
*Last updated: 2025-11-10*

