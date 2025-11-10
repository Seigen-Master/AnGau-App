# AnGau App - Firebase to Supabase Migration

## 🎯 Overview

This document provides a comprehensive guide for migrating the AnGau Care Management application from Firebase to Supabase. The migration includes backend restructuring, frontend refactoring, and MCP (Model Context Protocol) integration.

---

## 📚 Documentation Structure

### Core Documents

1. **[Supabase Migration Plan](./supabase-migration-plan.md)** - Master plan with 6 phases
2. **[Data Model](./data-model.md)** - Complete database schema and RLS policies
3. **[MCP Setup](./mcp-setup.md)** - Model Context Protocol server setup
4. **[Phase 0 Checklist](./phase-0-checklist.md)** - Preparation tasks and inventory

### Quick Links

- [Blueprint](./blueprint.md) - Original app architecture
- [Firebase Export Script](../scripts/export-firebase-data.js)
- [Environment Template](../env.example)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm/pnpm/yarn
- Supabase account
- Firebase Admin access (for data export)

### 1. Clone and Install

```bash
git clone <repository-url>
cd AnGau-App
npm install
```

### 2. Set Up Environment

```bash
# Copy environment template
cp env.example .env.local

# Fill in your Supabase credentials
# Get them from: https://app.supabase.com/project/_/settings/api
```

### 3. Export Firebase Data (Optional)

```bash
# Export sample data for analysis
node scripts/export-firebase-data.js

# Output will be in: data/firebase-export/
```

### 4. Review Documentation

Read through the migration plan and data model to understand the changes.

---

## 📋 Migration Phases

### Phase 0: Preparation ✅ (Current)

**Status**: Complete

**Deliverables**:
- ✅ Firebase audit complete
- ✅ Supabase schema designed
- ✅ Migration plan documented
- ✅ MCP setup guide created
- ⏳ Supabase project setup
- ⏳ Sample data exported

**Next Steps**: Create Supabase project and proceed to Phase 1

---

### Phase 1: Backend Foundation (2-3 days)

**Goals**:
- Create Supabase database schema
- Implement RLS policies
- Set up authentication
- Create seed data

**Tasks**:
1. Initialize Supabase project
2. Create database migrations
3. Apply RLS policies
4. Set up Supabase Auth
5. Create seed scripts
6. Write integration tests

**Deliverables**:
- Running Supabase backend
- All tables created with RLS
- Auth configured
- Test data seeded

---

### Phase 2: Edge Functions (1-2 days)

**Goals**:
- Replace Firebase Cloud Functions
- Set up scheduled jobs
- Implement database triggers

**Tasks**:
1. Create Edge Functions for scheduled jobs
2. Implement database triggers
3. Set up cron jobs
4. Add monitoring/logging

**Deliverables**:
- 8 Edge Functions deployed
- Scheduled jobs running
- Triggers active

---

### Phase 3: Frontend Refactor (3-4 days)

**Goals**:
- Replace Firebase SDK with Supabase
- Update contexts and hooks
- Refactor data fetching

**Tasks**:
1. Install Supabase client
2. Create Supabase helpers
3. Update AuthContext
4. Refactor data access layer
5. Update all components
6. Test all features

**Deliverables**:
- Frontend fully migrated
- Feature parity achieved
- All tests passing

---

### Phase 4: Data Migration (1-2 days)

**Goals**:
- Migrate production data
- Validate integrity
- Execute cutover

**Tasks**:
1. Write migration scripts
2. Test on staging
3. Execute migration
4. Validate data
5. Update production

**Deliverables**:
- All data migrated
- Validation complete
- Production live on Supabase

---

### Phase 5: MCP Integration (1 day)

**Goals**:
- Set up MCP server
- Configure Cursor integration
- Document workflows

**Tasks**:
1. Create MCP server
2. Configure endpoints
3. Set up Cursor client
4. Test integration
5. Document usage

**Deliverables**:
- MCP server running
- Cursor integrated
- Documentation complete

---

### Phase 6: Cleanup (1 day)

**Goals**:
- Remove Firebase dependencies
- Update documentation
- Final testing

**Tasks**:
1. Remove Firebase packages
2. Delete Firebase configs
3. Update README
4. Final security review
5. Performance testing

**Deliverables**:
- Clean codebase
- Updated docs
- Production stable

---

## 🗂️ Project Structure (After Migration)

```
AnGau-App/
├── src/
│   ├── app/                    # Next.js app directory
│   ├── components/             # React components
│   ├── contexts/               # React contexts (updated for Supabase)
│   ├── hooks/                  # Custom hooks
│   ├── lib/
│   │   ├── supabase/          # NEW: Supabase client & helpers
│   │   │   ├── client.ts      # Client-side Supabase client
│   │   │   ├── server.ts      # Server-side Supabase client
│   │   │   ├── queries.ts     # Database queries
│   │   │   └── mutations.ts   # Database mutations
│   │   ├── utils.ts           # Utilities
│   │   └── geolocation.ts     # Geolocation helpers
│   └── types/                  # TypeScript types
│
├── supabase/                   # NEW: Supabase configuration
│   ├── migrations/             # Database migrations
│   ├── functions/              # Edge Functions
│   ├── seed.sql               # Seed data
│   └── config.toml            # Supabase config
│
├── mcp-server/                 # NEW: MCP server
│   ├── src/
│   │   └── index.ts           # MCP server implementation
│   ├── package.json
│   └── tsconfig.json
│
├── scripts/                    # Utility scripts
│   ├── export-firebase-data.js
│   ├── import-to-supabase.ts
│   └── transform-data.ts
│
├── docs/                       # Documentation
│   ├── supabase-migration-plan.md
│   ├── data-model.md
│   ├── mcp-setup.md
│   ├── phase-0-checklist.md
│   └── MIGRATION_README.md
│
├── .cursor/                    # NEW: Cursor MCP config
│   └── mcp-config.json
│
├── env.example                 # Environment template
└── package.json
```

---

## 🔧 Key Changes

### Backend

**Before (Firebase)**:
- Firestore for database
- Firebase Auth
- Cloud Functions (18 functions)
- Firebase Storage
- Custom security rules

**After (Supabase)**:
- PostgreSQL with RLS
- Supabase Auth
- Edge Functions (8 functions)
- Supabase Storage
- Row Level Security policies

### Frontend

**Before**:
```typescript
// Firebase
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const snapshot = await getDocs(collection(db, 'users'));
```

**After**:
```typescript
// Supabase
import { supabase } from '@/lib/supabase/client';

const { data, error } = await supabase
  .from('users')
  .select('*');
```

### Authentication

**Before**:
```typescript
// Firebase Auth
import { signInWithEmailAndPassword } from 'firebase/auth';
await signInWithEmailAndPassword(auth, email, password);
```

**After**:
```typescript
// Supabase Auth
import { supabase } from '@/lib/supabase/client';
await supabase.auth.signInWithPassword({ email, password });
```

---

## 🔐 Security Considerations

### Environment Variables

**Critical**: Never commit these to version control
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side only
- `MCP_API_KEY` - MCP server authentication
- Firebase credentials (during migration only)

### RLS Policies

All tables have Row Level Security enabled:
- Users can only access their own data
- Admins have full access
- Caregivers have limited access based on assignments

### MCP Server

- API key authentication required
- Rate limiting enabled
- Input validation with Zod
- CORS configured for localhost only

---

## 🧪 Testing Strategy

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

### Manual Testing Checklist

- [ ] User authentication (login/logout)
- [ ] Admin dashboard
- [ ] Caregiver dashboard
- [ ] Schedule management
- [ ] Clock in/out functionality
- [ ] Messaging system
- [ ] Notifications
- [ ] Profile management
- [ ] Patient management
- [ ] Request system (cancellation/overtime)

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Supabase Connection Error

```
Error: Invalid Supabase URL or key
```

**Solution**: Verify environment variables in `.env.local`

#### 2. RLS Policy Blocking Query

```
Error: new row violates row-level security policy
```

**Solution**: Check RLS policies in Supabase dashboard

#### 3. Migration Script Fails

```
Error: Foreign key constraint violation
```

**Solution**: Ensure data is migrated in correct order (users → patients → schedules)

#### 4. MCP Server Not Responding

```
Error: ECONNREFUSED localhost:3001
```

**Solution**: Start MCP server with `cd mcp-server && npm run dev`

---

## 📊 Performance Benchmarks

### Expected Improvements

| Metric | Firebase | Supabase | Improvement |
|--------|----------|----------|-------------|
| Query Time | 150ms | 50ms | 3x faster |
| Cold Start | 2s | 100ms | 20x faster |
| Realtime Latency | 500ms | 100ms | 5x faster |
| Cost (monthly) | $150 | $50 | 66% reduction |

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch from `main`
2. Make changes
3. Run tests
4. Create pull request
5. Wait for review
6. Merge after approval

### Code Style

- Use TypeScript for all new code
- Follow existing patterns
- Add JSDoc comments for functions
- Use meaningful variable names

---

## 📞 Support

### Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [MCP Protocol](https://modelcontextprotocol.io)

### Team Contacts

- **Project Lead**: [Name]
- **Backend Lead**: [Name]
- **Frontend Lead**: [Name]

---

## 📅 Timeline

| Phase | Duration | Start Date | End Date | Status |
|-------|----------|------------|----------|--------|
| Phase 0 | 1 day | 2025-11-10 | 2025-11-10 | ✅ Complete |
| Phase 1 | 2-3 days | TBD | TBD | ⏳ Pending |
| Phase 2 | 1-2 days | TBD | TBD | ⏳ Pending |
| Phase 3 | 3-4 days | TBD | TBD | ⏳ Pending |
| Phase 4 | 1-2 days | TBD | TBD | ⏳ Pending |
| Phase 5 | 1 day | TBD | TBD | ⏳ Pending |
| Phase 6 | 1 day | TBD | TBD | ⏳ Pending |
| **Total** | **9-13 days** | | | |

---

## ✅ Success Criteria

### Phase 0 (Preparation)
- ✅ All Firebase collections documented
- ✅ Supabase schema designed
- ✅ Migration plan approved
- ⏳ Sample data exported

### Phase 1 (Backend)
- [ ] All tables created
- [ ] RLS policies applied
- [ ] Auth configured
- [ ] Seed data loaded

### Phase 2 (Functions)
- [ ] Edge Functions deployed
- [ ] Scheduled jobs running
- [ ] Triggers active

### Phase 3 (Frontend)
- [ ] All components migrated
- [ ] Feature parity achieved
- [ ] Tests passing

### Phase 4 (Migration)
- [ ] Data migrated
- [ ] Validation complete
- [ ] Production live

### Phase 5 (MCP)
- [ ] MCP server running
- [ ] Cursor integrated

### Phase 6 (Cleanup)
- [ ] Firebase removed
- [ ] Docs updated
- [ ] Production stable

---

## 🎉 Post-Migration

### Monitoring

- Set up Supabase monitoring
- Configure alerts
- Track performance metrics

### Optimization

- Analyze slow queries
- Add indexes as needed
- Optimize RLS policies

### Future Enhancements

- GraphQL API layer
- Advanced analytics
- Mobile app integration
- AI-powered scheduling

---

*Last Updated: 2025-11-10*
*Version: 1.0.0*

