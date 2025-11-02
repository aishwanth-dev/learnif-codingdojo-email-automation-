# Vercel Environment Variables Configuration

Copy and paste these environment variables into your Vercel project settings.

## How to Add in Vercel:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable below one by one
4. Make sure to check **Production**, **Preview**, and **Development** for each
5. After adding all, **Redeploy** your project

---

## Required Environment Variables:

### 1. Google Sheets Configuration

**GOOGLE_SHEET_ID**
```
1V7RKKDE-RiVH_9mTIgbOTpPf9JsgQI0iY2yzRWq5-lc
```

**GOOGLE_SERVICE_ACCOUNT_EMAIL**
```
learnif-sheets@learnif.iam.gserviceaccount.com
```

**GOOGLE_PRIVATE_KEY**
```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCb8cc5hyWJyxzC
jwupUlCT2bCXdmdiMuuzsdTRLnuPa0KdEexvSiPjypt3Fi+CFGIUB2IrL5hpb9U+
Bh5MJMqirBaUovIq7JgeirTlQDkl3Ec/H5xyLo9hkjN5ETdRvZh0Ki5/A8zYpRNR
mUbAPaqxPabztQgp/UhgGW7h2EMzh+HLzRoY6heDEd3YNY7R9vaQQTP/bSTC7MmS
Zj2lMmzVCHYDAZ7/BVnirrTnZVIuY2uR9a7+mYpE5jJMsOB61i3ILDv9AmxI3E6/
+0eqnmEsMzxu3Ci4V/UOlXOtYd9SAQCz9WlOU+oQ8zrcZGx7g2vuYjRrJhO7V4QS
JkmSajfLAgMBAAECggEAL9jDE7ePoPOc42UYYt9KsdJ9CDvgBJUzFHNfpL7qUlrK
mX7CWHMbB+1GPgekk/jFDvgk+rMjxFX3y4v9B8fSFI9QblKAkwL8uYI9dol5/0/S
3F9KlQ4MGBfPiznpCz9s41d95KK5207q2oJ43ssM8EzGSMgmtRttdW7YQpskI073
Lk4UJugQYdseFDiJKigxGgVWV5ToPxBzbeBsZFhzMPHOdzpnQmp1rVRCiitAQGTm
XffY1UKVooHZCaDNAtuCk1im7dA66GfSva4G+wV/isxXu+g+L00d4M1uNEXimkE+
rWM6vw0i7CZflkMSdWuyiREmH8NMmkND0gBFKQcl4QKBgQDKO+eLWSMyF5+fzKEF
whYK68b3a0qf+PQFRmrp/7QmWNbrzQ1RQpVdbv243re6/VXULbPSuDc4h91mcIUp
/6Al/93FY/DxdEOzXFuLwKxGOXRwoIkAMCCowKi2aEZxxao3Bos2Z/GtAiq0kWZ5
uKCE/LKtkRPv0SP5mTG1T6rfxwKBgQDFZ2UyAI0A5Q/BFW0nGVVYL7nwbx819Riq
Ppcg3Uvdj9Z+VQHrfcceHbSNCZJqsAue/m4UICWUb6+U3iIn/1rUuB9HGrvqp1cG
xVbaGVnOjpPIfh5Fg6RDNx6Bdlm5OJG/QVPkWDPfIrq6LWvv5zgmsUUAgARv0vsw
+ytil6Kv3QKBgQCM5DMqF823ZlHk6JD+C/uDXEPft7XjwXNwAWEW6Pg/BwGkgdTX
WgXpdBv7od5qvXgAPF7dXU3LaoxKg/WiDt8p2hpNHJWOAivwV1XIBVGAEyMWHCGW
KfF239IqUndRaB5v+3UdUElE+Q97gRjdkEz0mYB5/2reVtwzVhEVeg1XnQKBgQC9
E0/GGOj1lnEEi7VE4erw0KXUOVs3n07Eoba3b78etIrJ7josiQiTO/iXrjdjoMNA
wopFFJVqG5+dgzZMATXK0aCDxoN/OlEM1y9dLzLpuX6rZsEv6+sFxmGdtvIxipFv
Eu97o0/rxaP8d00PN/R8ewaQeA3H3dljDPB9OqhEsQKBgEexOTxGelzgokPegZiU
dLk8eV46N40+DgMGOti84bUKQjDj7mSkpMw5wQVTJKHP9xNajk05+b2GhpwSQju7
2BQogP+o40jDGDfKalkc5jg2lOkmR23R4F5Bq2YUq94OZLT1vQUJi3P6y1+bTLmi
yQE9yB3JsgE5fmExv9R8cDBi
-----END PRIVATE KEY-----
```

### 2. Website URL

**WEBSITE_URL**
```
https://learnif.16xstudios.space
```

### 3. SMTP Email Configuration

**SMTP_HOST**
```
mail.privateemail.com
```

**SMTP_PORT**
```
465
```

**SMTP_USER**
```
no-reply@16xstudios.space
```

**SMTP_PASSWORD**
```
aishwanth1234
```

---

## Important Notes:

1. **GOOGLE_PRIVATE_KEY** (CRITICAL - Follow these steps exactly):
   
   **Option A (Recommended):** Copy the entire private key from your JSON file as a single string with `\n` escape sequences:
   ```
   -----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCb8cc5hyWJyxzC\njwupUlCT2bCXdmdiMuuzsdTRLnuPa0KdEexvSiPjypt3Fi+CFGIUB2IrL5hpb9U+\n...\n-----END PRIVATE KEY-----\n
   ```
   
   **Option B:** In Vercel's environment variable field, paste the key as a multi-line string (Vercel supports this). The format should be:
   ```
   -----BEGIN PRIVATE KEY-----
   MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCb8cc5hyWJyxzC
   jwupUlCT2bCXdmdiMuuzsdTRLnuPa0KdEexvSiPjypt3Fi+CFGIUB2IrL5hpb9U+
   ...
   -----END PRIVATE KEY-----
   ```
   
   **⚠️ IMPORTANT:** 
   - The key MUST include the `-----BEGIN PRIVATE KEY-----` line at the start
   - The key MUST include the `-----END PRIVATE KEY-----` line at the end
   - All newlines must be preserved (either as actual newlines or as `\n` characters)
   - Do NOT add extra quotes around the key
   - After pasting, verify in Vercel that the key appears correctly formatted

2. **After Adding All Variables**:
   - Make sure to **Redeploy** your project
   - Go to **Deployments** → Click **⋯** on latest deployment → **Redeploy**

3. **Verify Variables Are Set**:
   - After redeploy, check your function logs
   - You should see `[SUBSCRIBE] ✓` messages instead of missing variable errors

---

## Quick Copy-Paste Format (for Vercel Dashboard):

When adding in Vercel, copy the value (not the variable name) from below:

```
Variable: GOOGLE_SHEET_ID
Value: 1V7RKKDE-RiVH_9mTIgbOTpPf9JsgQI0iY2yzRWq5-lc

Variable: GOOGLE_SERVICE_ACCOUNT_EMAIL  
Value: learnif-sheets@learnif.iam.gserviceaccount.com

Variable: GOOGLE_PRIVATE_KEY
Value: (paste the entire private key block above)

Variable: WEBSITE_URL
Value: https://learnif.16xstudios.space

Variable: SMTP_HOST
Value: mail.privateemail.com

Variable: SMTP_PORT
Value: 465

Variable: SMTP_USER
Value: no-reply@16xstudios.space

Variable: SMTP_PASSWORD
Value: aishwanth1234
```

