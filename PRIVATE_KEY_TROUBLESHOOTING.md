# Private Key Decoder Error - Troubleshooting Guide

## Error: `error:1E08010C:DECODER routines::unsupported`

This error occurs when Node.js cannot decode your Google Service Account private key. This is almost always caused by incorrect formatting in Vercel's environment variables.

## Quick Fix Steps:

### Step 1: Get Your Private Key from JSON File

1. Open your service account JSON file (e.g., `learnif-72e780e0e012.json`)
2. Find the `"private_key"` field
3. Copy the ENTIRE value, including the quotes (it will look like this):
   ```json
   "private_key": "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCb8cc5hyWJyxzC\\njwupUlCT2bCXdmdiMuuzsdTRLnuPa0KdEexvSiPjypt3Fi+CFGIUB2IrL5hpb9U+\\n...\\n-----END PRIVATE KEY-----\\n"
   ```

### Step 2: Format for Vercel

You have two options:

#### Option A: Single Line with `\n` (Recommended)

1. Copy the value from the JSON (without the outer quotes)
2. The value should already have `\n` escape sequences
3. Paste it directly into Vercel's `GOOGLE_PRIVATE_KEY` field
4. It should look like this (all on one line):
   ```
   -----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCb8cc5hyWJyxzC\njwupUlCT2bCXdmdiMuuzsdTRLnuPa0KdEexvSiPjypt3Fi+CFGIUB2IrL5hpb9U+\n...\n-----END PRIVATE KEY-----\n
   ```

#### Option B: Multi-line Format

1. Replace all `\\n` in the JSON value with actual newlines
2. Paste it into Vercel's multi-line environment variable field
3. It should look like this:
   ```
   -----BEGIN PRIVATE KEY-----
   MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCb8cc5hyWJyxzC
   jwupUlCT2bCXdmdiMuuzsdTRLnuPa0KdEexvSiPjypt3Fi+CFGIUB2IrL5hpb9U+
   ...
   -----END PRIVATE KEY-----
   ```

### Step 3: Verify in Vercel

1. Go to your Vercel project → Settings → Environment Variables
2. Click on `GOOGLE_PRIVATE_KEY` to view it
3. Verify it:
   - ✅ Starts with `-----BEGIN PRIVATE KEY-----`
   - ✅ Ends with `-----END PRIVATE KEY-----`
   - ✅ Contains the entire key content
   - ✅ Has proper newlines (either as `\n` or actual line breaks)

### Step 4: Redeploy

1. Go to Deployments
2. Click `⋯` on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Step 5: Test

1. Try submitting an email again
2. Check the function logs in Vercel
3. You should see: `[SUBSCRIBE] ✓ Private key formatted correctly`
4. You should see: `[SUBSCRIBE] ✓ JWT client created successfully`

## Common Mistakes:

❌ **Wrong:** Missing `-----BEGIN PRIVATE KEY-----` header  
❌ **Wrong:** Missing `-----END PRIVATE KEY-----` footer  
❌ **Wrong:** Newlines replaced with spaces  
❌ **Wrong:** Extra quotes around the key in Vercel  
❌ **Wrong:** Only part of the key (truncated)  
❌ **Wrong:** Key from a different service account  

✅ **Correct:** Full key with BEGIN/END markers and proper newlines

## Still Not Working?

1. **Check Logs**: Look at Vercel function logs for detailed error messages
2. **Verify Key Length**: A typical Google private key is ~1650-1700 characters long
3. **Re-download Key**: If in doubt, create a new service account key and try again
4. **Test Locally**: Test with `.env.local` first to verify the key works

## Example of Correct Format:

The key should look exactly like this (with `\n` representing newlines):
```
-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCb8cc5hyWJyxzC\njwupUlCT2bCXdmdiMuuzsdTRLnuPa0KdEexvSiPjypt3Fi+CFGIUB2IrL5hpb9U+\nBh5MJMqirBaUovIq7JgeirTlQDkl3Ec/H5xyLo9hkjN5ETdRvZh0Ki5/A8zYpRNR\n... (many more lines) ...\n-----END PRIVATE KEY-----\n
```

