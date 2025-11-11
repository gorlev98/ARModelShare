# Supabase Setup Guide

This guide will help you set up Supabase for the AR Model Sharing application.

## Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com/](https://app.supabase.com/)
2. Sign in or create an account
3. Click **"New Project"**
4. Fill in the details:
   - **Name**: ARModelShare (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely!)
   - **Region**: Select the region closest to your users
5. Click **"Create new project"**
6. Wait for the project to be provisioned (1-2 minutes)

## Step 2: Set Up the Database Schema

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the contents of `supabase-schema.sql` from this repository
4. Paste into the SQL editor
5. Click **"Run"** to execute the schema
6. You should see success messages for all tables and policies created

## Step 3: Set Up Storage

1. Go to **Storage** in the left sidebar
2. Click **"Create a new bucket"**
3. Name it: `models`
4. Set as **Public bucket** (check the box)
5. Click **"Create bucket"**

### Configure Storage Policies

1. Click on the `models` bucket
2. Go to **Policies** tab
3. Add the following policies:

**Policy 1: Public Read Access**
- Policy name: `Public read access`
- Target roles: `public`
- Policy definition: `SELECT`
- USING expression: `true`

**Policy 2: Authenticated Users Can Upload**
- Policy name: `Authenticated users can upload`
- Target roles: `authenticated`
- Policy definition: `INSERT`
- WITH CHECK expression:
```sql
bucket_id = 'models' AND (storage.foldername(name))[1] = auth.uid()::text
```

**Policy 3: Users Can Delete Their Own Files**
- Policy name: `Users can delete their own files`
- Target roles: `authenticated`
- Policy definition: `DELETE`
- USING expression:
```sql
bucket_id = 'models' AND (storage.foldername(name))[1] = auth.uid()::text
```

## Step 4: Enable Authentication Providers

### Email/Password Authentication

1. Go to **Authentication** → **Providers** (left sidebar)
2. **Email** should be enabled by default
3. Configure settings as needed:
   - Enable **Confirm email** (recommended)
   - Set **Email templates** if desired

### Google OAuth (Optional)

1. Go to **Authentication** → **Providers**
2. Find **Google** in the list
3. Toggle **Enabled**
4. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Click **Save**

To get Google OAuth credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

## Step 5: Get Your API Keys

1. Go to **Project Settings** → **API** (gear icon in sidebar)
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under Project API keys)

## Step 6: Update Your .env File

1. Open `client/.env.local` in your project
2. Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

3. Save the file
4. Restart your development server

## Step 7: Test the Setup

1. Run your development server: `npm run dev`
2. Try to sign up with a new account
3. Try uploading a 3D model file
4. Check the Supabase dashboard:
   - **Authentication** → **Users** (should see your new user)
   - **Table Editor** → **models** (should see your uploaded model record)
   - **Storage** → **models** (should see your uploaded file)

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Make sure `.env.local` is in the `client/` directory (not project root)
- Check that variable names are exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your dev server after changing .env files

### Upload fails with 404 or permission error
- Verify the `models` bucket exists and is public
- Check storage policies are configured correctly
- Make sure you're logged in

### Authentication fails
- Verify email/password provider is enabled
- Check that you're using a valid email format
- Password must be at least 6 characters

### Database queries fail
- Run the `supabase-schema.sql` script again
- Check that RLS policies are enabled
- Verify you're authenticated when querying

## Security Notes

- **Never commit `.env.local`** to version control (it's in .gitignore)
- The **anon key is safe to expose** in client-side code (it's public)
- **Service role key** should NEVER be used in client code (server-side only)
- Row Level Security (RLS) policies protect your data even with public anon key

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
