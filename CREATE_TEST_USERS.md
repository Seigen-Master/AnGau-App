# 🧪 Create Test Users for Login

Quick guide to create admin and caregiver test accounts.

---

## 📋 Test Credentials

### **Admin Account**
- **Email**: `admin@test.com`
- **Password**: `Admin123!`
- **Role**: Admin
- **Access**: Full system access

### **Caregiver Account**
- **Email**: `caregiver@test.com`
- **Password**: `Caregiver123!`
- **Role**: Caregiver
- **Access**: Caregiver dashboard only

---

## 🚀 Quick Setup (5 minutes)

### **Step 1: Create Auth Users**

Go to: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/auth/users

#### **Create Admin User**:
1. Click **"Add user"** → **"Create new user"**
2. **Email**: `admin@test.com`
3. **Password**: `Admin123!`
4. **Auto Confirm User**: ✅ Check this!
5. Click **"Create user"**
6. **Copy the User UID** (you'll need it)

#### **Create Caregiver User**:
1. Click **"Add user"** → **"Create new user"**
2. **Email**: `caregiver@test.com`
3. **Password**: `Caregiver123!`
4. **Auto Confirm User**: ✅ Check this!
5. Click **"Create user"**
6. **Copy the User UID** (you'll need it)

---

### **Step 2: Add Users to Database**

Go to: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/sql/new

Run this SQL (replace the UUIDs with the ones you copied):

```sql
-- Admin User
INSERT INTO users (
  auth_id,
  name,
  email,
  role,
  status,
  phone,
  position,
  rate_per_hour
) VALUES (
  'PASTE_ADMIN_UUID_HERE'::uuid,
  'Admin Test User',
  'admin@test.com',
  'admin',
  'active',
  '+1234567890',
  'Full-time',
  25.00
);

-- Caregiver User
INSERT INTO users (
  auth_id,
  name,
  email,
  role,
  status,
  phone,
  position,
  rate_per_hour
) VALUES (
  'PASTE_CAREGIVER_UUID_HERE'::uuid,
  'Caregiver Test User',
  'caregiver@test.com',
  'caregiver',
  'active',
  '+1234567891',
  'Full-time',
  20.00
);
```

---

### **Step 3: Test Login**

1. Go to: http://localhost:9002
2. Try logging in with:
   - **Admin**: `admin@test.com` / `Admin123!`
   - **Caregiver**: `caregiver@test.com` / `Caregiver123!`

---

## 🎯 Alternative: Use Edge Function

If you want to use the Edge Function to create the caregiver:

### **Create Caregiver via Edge Function**:

1. First, login as admin
2. Then call the Edge Function:

```javascript
const { data, error } = await supabase.functions.invoke('create-caregiver', {
  body: {
    email: 'caregiver@test.com',
    password: 'Caregiver123!',
    name: 'Caregiver Test User',
    phone: '+1234567891'
  }
})
```

---

## 📊 Verify Users

Check if users were created:

**SQL Editor**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/sql/new

```sql
-- View all users
SELECT 
  id,
  name,
  email,
  role,
  status,
  auth_id,
  created_at
FROM users
ORDER BY role, name;
```

**Expected Output**:
```
name                 | email                | role      | status
---------------------|----------------------|-----------|--------
Admin Test User      | admin@test.com       | admin     | active
Caregiver Test User  | caregiver@test.com   | caregiver | active
```

---

## 🔐 Security Notes

### **These are TEST accounts**:
- ⚠️ Use only for development/testing
- ⚠️ Don't use in production
- ⚠️ Change passwords for production

### **Production Setup**:
For production, you should:
1. Use strong, unique passwords
2. Enable 2FA if available
3. Use real email addresses
4. Set up proper email verification

---

## 🧪 Test Scenarios

### **Admin Tests**:
- ✅ Login as admin
- ✅ View all caregivers
- ✅ View all patients
- ✅ Create new caregiver
- ✅ Create new patient
- ✅ Manage schedules
- ✅ Approve/deny requests
- ✅ View reports
- ✅ Change user passwords

### **Caregiver Tests**:
- ✅ Login as caregiver
- ✅ View assigned patients
- ✅ View schedule
- ✅ Clock in/out
- ✅ Submit requests (cancellation, overtime)
- ✅ Send messages
- ✅ View notifications
- ✅ Update profile

---

## 🐛 Troubleshooting

### **Can't login?**
1. Check if auth user exists in Supabase Auth dashboard
2. Check if user exists in users table
3. Verify `auth_id` matches between Auth and users table
4. Check if user status is 'active'

### **"User not found" error?**
- The auth user exists but not in the users table
- Run the INSERT SQL again with correct auth_id

### **"Invalid credentials" error?**
- Wrong email or password
- Check if user is confirmed (Auto Confirm User should be checked)

### **"Permission denied" error?**
- User exists but role is not set correctly
- Check the role in users table

---

## 📝 Quick Reference

### **Admin Account**
```
Email:    admin@test.com
Password: Admin123!
Role:     admin
```

### **Caregiver Account**
```
Email:    caregiver@test.com
Password: Caregiver123!
Role:     caregiver
```

### **Supabase Links**
- **Auth Users**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/auth/users
- **SQL Editor**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/sql/new
- **Users Table**: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/editor

### **Your App**
- **Local**: http://localhost:9002

---

## 🎉 You're Ready to Test!

Once you've created both users, you can:
1. Test the login flow
2. Test role-based access
3. Test all features
4. Find and fix any bugs

**Happy testing!** 🚀

