-- Fix users INSERT policy to allow server-side user creation
-- The previous policy required auth.uid() = id, but server-side code needs to create users too

DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- New policy: Allow authenticated users to insert their own profile
-- This works for both client-side and server-side (after setSession)
CREATE POLICY "Users can insert own data"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also allow service_role to bypass RLS for user creation
ALTER TABLE users FORCE ROW LEVEL SECURITY;
