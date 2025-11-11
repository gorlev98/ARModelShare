# Supabase Storage Policies Setup

## Issue: 403 Unauthorized on File Upload

If you're getting a 403 error when uploading files, your storage policies need to be configured.

## Step-by-Step Fix

### 1. Go to Your Supabase Project

Visit: https://app.supabase.com/project/yzkatpxsvpvixvhovdob/storage/buckets

### 2. Create the 'models' Bucket (if not exists)

1. Click **"Create a new bucket"**
2. Name: `models`
3. **Check "Public bucket"** ✅ (IMPORTANT!)
4. Click **"Create bucket"**

### 3. Configure Storage Policies

Click on the `models` bucket, then go to **Policies** tab.

#### Policy 1: Public Read Access
Allows anyone to view/download files (needed for AR viewing).

**Click "New Policy" → "For full customization"**

- Policy name: `Public read access`
- Allowed operation: `SELECT`
- Target roles: Check **`public`**
- Policy definition (WITH CHECK / USING):
```sql
bucket_id = 'models'
```

Click **"Review"** then **"Save policy"**

---

#### Policy 2: Authenticated Users Can Upload
Allows logged-in users to upload files to their own folder.

**Click "New Policy" → "For full customization"**

- Policy name: `Authenticated users can upload to their folder`
- Allowed operation: `INSERT`
- Target roles: Check **`authenticated`**
- WITH CHECK expression:
```sql
bucket_id = 'models'
AND (storage.foldername(name))[1] = auth.uid()::text
```

Click **"Review"** then **"Save policy"**

---

#### Policy 3: Users Can Delete Their Own Files
Allows users to delete only their own uploaded files.

**Click "New Policy" → "For full customization"**

- Policy name: `Users can delete their own files`
- Allowed operation: `DELETE`
- Target roles: Check **`authenticated`**
- USING expression:
```sql
bucket_id = 'models'
AND (storage.foldername(name))[1] = auth.uid()::text
```

Click **"Review"** then **"Save policy"**

---

#### Policy 4: Users Can Update Their Own Files
Allows users to update/replace their own files.

**Click "New Policy" → "For full customization"**

- Policy name: `Users can update their own files`
- Allowed operation: `UPDATE`
- Target roles: Check **`authenticated`**
- USING expression:
```sql
bucket_id = 'models'
AND (storage.foldername(name))[1] = auth.uid()::text
```

Click **"Review"** then **"Save policy"**

---

## Alternative: Quick Setup via SQL

If you prefer, you can run this SQL in the **SQL Editor**:

```sql
-- Enable public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'models');

-- Authenticated users can upload to their folder
CREATE POLICY "Authenticated users can upload to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Verify Setup

After configuring policies:

1. **Refresh your browser** (to clear any cached auth states)
2. **Try uploading again**
3. Upload should now work!

## Understanding the Policy

The key part is:
```sql
(storage.foldername(name))[1] = auth.uid()::text
```

This ensures:
- Files are uploaded to path: `userId/filename.glb`
- Users can only upload to folders matching their user ID
- Path structure: `models/USER_ID/timestamp_filename.glb`

## Troubleshooting

### Still Getting 403?

1. **Check if you're logged in**: Open browser console, type:
   ```javascript
   supabase.auth.getSession()
   ```
   Should show a valid session with user data.

2. **Check bucket is public**:
   - Go to Storage → Buckets
   - The `models` bucket should show as **"Public"**

3. **Verify policies exist**:
   - Go to Storage → Policies
   - You should see 4 policies listed

4. **Check bucket name**:
   - Must be exactly `models` (lowercase)

5. **Try creating bucket via SQL**:
   ```sql
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('models', 'models', true);
   ```

### Network Issues?

Check the browser Network tab:
- Request URL should be: `https://yzkatpxsvpvixvhovdob.supabase.co/storage/v1/object/models/...`
- Check request headers include `Authorization: Bearer ...`
- Response should not be CORS-related

## Need More Help?

Check the full setup guide: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
