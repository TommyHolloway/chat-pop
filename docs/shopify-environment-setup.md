# Shopify Environment Variables Setup

This document lists all required environment variables for the Shopify integration to work properly.

## Required Environment Variables

### 1. Supabase Variables (Already Configured)

These are automatically set by Lovable/Supabase:

```bash
SUPABASE_URL=https://etwjtxqjcwyxdamlcorf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

✅ **Status**: Already configured in Supabase secrets

---

### 2. Shopify API Credentials

These must be obtained from Shopify Partners Dashboard:

#### `SHOPIFY_CLIENT_ID`
- **Source**: Shopify Partners Dashboard → Apps → Your App → Client credentials
- **Format**: Alphanumeric string (e.g., `a1b2c3d4e5f6g7h8i9j0`)
- **Purpose**: Public identifier for OAuth and App Bridge
- **Where to add**: 
  - **Frontend**: `.env` as `VITE_SHOPIFY_CLIENT_ID`
  - **Backend**: Supabase secrets as `SHOPIFY_CLIENT_ID`

#### `SHOPIFY_CLIENT_SECRET`
- **Source**: Shopify Partners Dashboard → Apps → Your App → Client credentials
- **Format**: Alphanumeric string (longer than client ID)
- **Purpose**: Secret key for OAuth token exchange and session verification
- **Where to add**: Supabase secrets as `SHOPIFY_CLIENT_SECRET`
- **⚠️ CRITICAL**: Never expose this in frontend code!

---

### 3. Encryption Key

#### `SHOPIFY_ENCRYPTION_KEY`
- **Purpose**: Encrypt Shopify access tokens in database
- **Format**: Base64-encoded 32-byte key
- **How to generate**:
  ```bash
  # Option 1: Using Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

  # Option 2: Using OpenSSL
  openssl rand -base64 32

  # Option 3: Using Python
  python3 -c "import os, base64; print(base64.b64encode(os.urandom(32)).decode())"
  ```
- **Where to add**: Supabase secrets as `SHOPIFY_ENCRYPTION_KEY`
- **Example output**: `xK8vQp2Nm5LrYt9Hc3Fd6Gw1Jx4Sz7Uv0Tb8Wq3Rc5A=`

---

### 4. Application Base URL

#### `APP_BASE_URL`
- **Purpose**: Base URL for OAuth redirects and app references
- **Format**: Full HTTPS URL (no trailing slash)
- **Examples**:
  - Development: `http://localhost:5173`
  - Staging: `https://staging.yourdomain.com`
  - Production: `https://yourdomain.com`
- **Where to add**: Supabase secrets as `APP_BASE_URL`

---

### 5. Billing Configuration

#### `SHOPIFY_BILLING_TEST_MODE`
- **Purpose**: Control whether to use Shopify test billing or live billing
- **Format**: Boolean string (`"true"` or `"false"`)
- **Values**:
  - `"true"`: Test mode (no actual charges)
  - `"false"`: Live mode (real charges)
- **Where to add**: Supabase secrets as `SHOPIFY_BILLING_TEST_MODE`
- **⚠️ Important**: Start with `"true"`, switch to `"false"` only after app approval

---

## How to Add Secrets to Supabase

### Method 1: Using Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `etwjtxqjcwyxdamlcorf`
3. Navigate to **Settings** → **Edge Functions** → **Secrets**
4. Click **Add new secret**
5. Enter secret name and value
6. Click **Save**

### Method 2: Using Supabase CLI

```bash
# Set a single secret
supabase secrets set SHOPIFY_CLIENT_ID=your_client_id_here

# Set multiple secrets from .env file
supabase secrets set --env-file .env.production
```

---

## Environment Variables Checklist

Use this checklist to ensure all variables are configured:

### Frontend (.env file)
```bash
✅ VITE_SHOPIFY_CLIENT_ID=<from-partners-dashboard>
```

### Backend (Supabase Secrets)
```bash
✅ SHOPIFY_CLIENT_ID=<from-partners-dashboard>
✅ SHOPIFY_CLIENT_SECRET=<from-partners-dashboard>
✅ SHOPIFY_ENCRYPTION_KEY=<generated-32-byte-base64-key>
✅ APP_BASE_URL=<your-production-url>
✅ SHOPIFY_BILLING_TEST_MODE="true"
```

### Already Configured (Auto-managed)
```bash
✅ SUPABASE_URL=https://etwjtxqjcwyxdamlcorf.supabase.co
✅ SUPABASE_SERVICE_ROLE_KEY=<auto-configured>
```

---

## Environment-Specific Configuration

### Development Environment

```bash
# .env.local
VITE_SHOPIFY_CLIENT_ID=<test-app-client-id>

# Supabase Secrets (Dev)
SHOPIFY_CLIENT_ID=<test-app-client-id>
SHOPIFY_CLIENT_SECRET=<test-app-client-secret>
SHOPIFY_ENCRYPTION_KEY=<any-32-byte-key>
APP_BASE_URL=http://localhost:5173
SHOPIFY_BILLING_TEST_MODE="true"
```

### Production Environment

```bash
# .env.production
VITE_SHOPIFY_CLIENT_ID=<production-app-client-id>

# Supabase Secrets (Prod)
SHOPIFY_CLIENT_ID=<production-app-client-id>
SHOPIFY_CLIENT_SECRET=<production-app-client-secret>
SHOPIFY_ENCRYPTION_KEY=<secure-32-byte-key>
APP_BASE_URL=https://yourdomain.com
SHOPIFY_BILLING_TEST_MODE="false"
```

---

## Security Best Practices

### ✅ DO:
- Store all secrets in Supabase secrets (never in code)
- Use different credentials for dev/staging/production
- Rotate encryption keys periodically
- Use HTTPS for all production URLs
- Keep `SHOPIFY_CLIENT_SECRET` confidential
- Use test mode for billing until app is approved

### ❌ DON'T:
- Commit secrets to version control
- Share API keys in public channels
- Use production credentials in development
- Expose `SHOPIFY_CLIENT_SECRET` in frontend
- Use the same encryption key across environments
- Switch to live billing before app approval

---

## Verifying Configuration

### Test Frontend Configuration

1. Open browser console on your app
2. Check if `VITE_SHOPIFY_CLIENT_ID` is available:
   ```javascript
   console.log(import.meta.env.VITE_SHOPIFY_CLIENT_ID);
   ```
3. Should output your client ID (not undefined)

### Test Backend Configuration

1. Check Supabase secrets:
   ```bash
   supabase secrets list
   ```
2. Should show all required secrets (values hidden)

### Test OAuth Flow

1. Try connecting a Shopify store
2. Check edge function logs for any "undefined" errors
3. Verify OAuth redirects work correctly

---

## Troubleshooting

### "SHOPIFY_CLIENT_ID not configured"
- **Cause**: Missing `VITE_SHOPIFY_CLIENT_ID` in frontend `.env`
- **Fix**: Add to `.env` and restart dev server

### "SHOPIFY_CLIENT_SECRET not configured"
- **Cause**: Missing in Supabase secrets
- **Fix**: Add using Supabase Dashboard or CLI

### "Invalid session token" errors
- **Cause**: Wrong `SHOPIFY_CLIENT_SECRET` or expired token
- **Fix**: Verify secret matches Partners Dashboard value

### "Encryption key not configured"
- **Cause**: Missing `SHOPIFY_ENCRYPTION_KEY`
- **Fix**: Generate new key and add to Supabase secrets

### OAuth redirect fails
- **Cause**: Wrong `APP_BASE_URL` or missing redirect URL in Partners Dashboard
- **Fix**: 
  1. Verify `APP_BASE_URL` matches your domain
  2. Add redirect URLs to Shopify Partners Dashboard

---

## Migration Path

If you're updating an existing Shopify integration:

1. **Backup existing data**:
   ```sql
   -- Export existing connections
   SELECT * FROM shopify_connections;
   ```

2. **Add new secrets**:
   - Follow the checklist above
   - Test with one store first

3. **Deploy updated edge functions**:
   - Edge functions deploy automatically with your code
   - Monitor logs for errors

4. **Update frontend**:
   - Add `VITE_SHOPIFY_CLIENT_ID` to `.env`
   - Rebuild and deploy

5. **Test thoroughly**:
   - Install on development store
   - Test all features
   - Check error logs

---

## Quick Reference

| Variable | Type | Location | Example |
|----------|------|----------|---------|
| `VITE_SHOPIFY_CLIENT_ID` | Public | Frontend .env | `a1b2c3d4e5f6` |
| `SHOPIFY_CLIENT_ID` | Public | Supabase Secrets | `a1b2c3d4e5f6` |
| `SHOPIFY_CLIENT_SECRET` | Secret | Supabase Secrets | `shpss_abc123...` |
| `SHOPIFY_ENCRYPTION_KEY` | Secret | Supabase Secrets | `xK8vQp...Rc5A=` |
| `APP_BASE_URL` | Public | Supabase Secrets | `https://yourdomain.com` |
| `SHOPIFY_BILLING_TEST_MODE` | Config | Supabase Secrets | `"true"` or `"false"` |

---

## Next Steps

After configuring all environment variables:

1. ✅ Test OAuth flow on development store
2. ✅ Verify session token authentication works
3. ✅ Test billing flow (in test mode)
4. ✅ Check webhook delivery
5. ✅ Review edge function logs
6. 📝 Proceed to [Shopify Partners Configuration](./shopify-partners-configuration.md)
