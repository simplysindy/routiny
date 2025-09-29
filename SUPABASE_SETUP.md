# Supabase Setup Instructions

## ✅ Connection Status: CONNECTED
Your Supabase connection is working with:
- **URL**: https://oatqvxdchnobnqajejpa.supabase.co
- **Anon Key**: Configured ✅

## 🔧 Manual Database Schema Setup (Required)

Since the service role key is not configured, please set up the database manually:

### Step 1: Access Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/oatqvxdchnobnqajejpa/sql
2. Click "New Query" or use the SQL Editor

### Step 2: Apply Database Schema
Copy and paste the entire contents of `database.sql` into the SQL Editor and run it.

This will create:
- ✅ User profiles table with preferences
- ✅ Tasks table with AI breakdown support  
- ✅ Task steps table for micro-steps
- ✅ Row Level Security policies
- ✅ Database triggers for automatic stats
- ✅ Performance indexes

### Step 3: Verify Setup
After running the schema, you can test by running:
```bash
node setup-database.js
```

## 🔑 Optional: Service Role Key Setup

To enable automated schema management, add your service role key to `.env`:

1. Go to: https://supabase.com/dashboard/project/oatqvxdchnobnqajejpa/settings/api
2. Copy the "service_role" key (not the anon key)
3. Add to your `.env` file:
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 🧪 Test Authentication

Once the schema is applied, test the auth flow:
1. Visit: http://localhost:3001/auth
2. Enter your email for magic link
3. Check your email and click the link
4. Should redirect to dashboard

## 🎯 Next Steps

After schema is applied:
- ✅ User registration will work
- ✅ Magic link authentication will work  
- ✅ Protected routes will function
- ✅ User profiles will be auto-created
- ✅ Task management will be available

Your Routiny app architecture is complete and ready!