# ChatPop Edge Functions Documentation

## 📚 Table of Contents
- [Function Classification](#function-classification)
- [Security Patterns](#security-patterns)
- [Rate Limiting](#rate-limiting)
- [CORS Configuration](#cors-configuration)
- [Environment Variables](#environment-variables)
- [Best Practices](#best-practices)
- [Monitoring & Debugging](#monitoring--debugging)

---

## Function Classification

### 🔒 **Authenticated Functions** (Require User + Agent Ownership)
These functions require a valid Authorization header and verify agent ownership:

| Function | Purpose | Rate Limit | Auth Helper |
|----------|---------|------------|-------------|
| `chunk-content` | Manage knowledge base chunks | None | ✅ |
| `analytics-track` | Track usage analytics | None | ✅ |
| `crawl-url` | Crawl and scrape websites | 10/10min | ✅ |
| `train-agent` | Train agent on knowledge | 5/10min | ✅ |
| `extract-file-content` | Extract PDF/doc content | None | ✅ |
| `sync-shopify-products` | Sync Shopify products | 10/10min | ✅ |
| `sync-product-catalog` | Update product catalog | None | ✅ |
| `sync-inventory-levels` | Update inventory | None | ✅ |
| `import-shopify-orders` | Import order history | 5/10min | ✅ |

### 🌐 **Public Functions** (No Authentication Required)
These functions are publicly accessible:

| Function | Purpose | Security | Notes |
|----------|---------|----------|-------|
| `public-chat` | Public chat widget | Agent validation only | `verify_jwt = false` |
| `chat-widget` | Widget configuration | None | Read-only |
| `get-widget-config` | Get widget settings | None | Read-only |
| `shopify-webhook` | Shopify webhooks | HMAC verification | Signature check |
| `shopify-webhook-gdpr` | GDPR webhooks | HMAC verification | Signature check |
| `track-visitor-behavior` | Anonymous tracking | None | Privacy-safe |
| `track-cart-event` | Cart tracking | None | Privacy-safe |

### 👑 **Admin Functions** (Require Admin Role)
These functions require admin privileges:

| Function | Purpose | Auth Pattern |
|----------|---------|--------------|
| `get-users-admin` | User management | Admin role check via `has_role()` |
| `log-admin-action` | Audit logging | Admin role check |

### 🔐 **OAuth Functions** (Shopify Integration)
Special authentication flow for Shopify OAuth:

| Function | Purpose | Auth |
|----------|---------|------|
| `shopify-oauth-install` | OAuth initiation | User auth |
| `shopify-oauth-callback` | OAuth completion | State verification |
| `shopify-oauth-disconnect` | Disconnect Shopify | User auth |

---

## Security Patterns

### ✅ **Shared Authentication Helper**

All authenticated functions use `validateAuthAndAgent()` from `_shared/auth-helpers.ts`:

```typescript
import { validateAuthAndAgent, getRestrictedCorsHeaders } from '../_shared/auth-helpers.ts';

const corsHeaders = getRestrictedCorsHeaders();

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { agentId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Validate auth + ownership
    const authHeader = req.headers.get('Authorization');
    await validateAuthAndAgent(authHeader, agentId, supabaseUrl, supabaseKey, 'function-name');
    
    // Your function logic here...
    
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message?.includes('authorization') ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

### 🔒 **What validateAuthAndAgent() Does:**
1. ✅ Checks Authorization header exists
2. ✅ Extracts and validates JWT token
3. ✅ Verifies user is authenticated
4. ✅ Confirms agent exists in database
5. ✅ Verifies user owns the agent
6. ✅ Logs security events (auth failures, unauthorized access)
7. ✅ Returns user ID and agent ID for further use

### 🚫 **Error Responses:**
- `401` - Missing/invalid auth or unauthorized access
- `429` - Rate limit exceeded
- `500` - Server error

---

## Rate Limiting

Rate limiting is implemented using `checkRateLimit()` from `_shared/rate-limiter.ts`:

```typescript
import { checkRateLimit } from '../_shared/rate-limiter.ts';
import { logSecurityEvent } from '../_shared/security-logger.ts';

const rateLimitResult = await checkRateLimit({
  maxRequests: 10,
  windowMinutes: 10,
  identifier: `operation-${agentId}`
}, supabaseUrl, supabaseKey);

if (!rateLimitResult.allowed) {
  await logSecurityEvent({
    event_type: 'RATE_LIMIT_EXCEEDED',
    function_name: 'function-name',
    agent_id: agentId,
    user_id: userId,
    severity: 'medium'
  }, supabaseUrl, supabaseKey);

  return new Response(JSON.stringify({
    error: 'Rate limit exceeded',
    resetAt: rateLimitResult.resetAt,
    remaining: rateLimitResult.remaining
  }), {
    status: 429,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

### Rate Limits by Function:
- **crawl-url**: 10 requests per 10 minutes per agent
- **train-agent**: 5 requests per 10 minutes per agent
- **sync-shopify-products**: 10 requests per 10 minutes per agent
- **import-shopify-orders**: 5 requests per 10 minutes per agent

---

## CORS Configuration

### Internal Functions (Restricted CORS)
Use `getRestrictedCorsHeaders()` - allows only requests from `APP_URL`:

```typescript
import { getRestrictedCorsHeaders } from '../_shared/auth-helpers.ts';
const corsHeaders = getRestrictedCorsHeaders();
```

### Public Functions (Permissive CORS)
Use `getPublicCorsHeaders()` - allows all origins:

```typescript
import { getPublicCorsHeaders } from '../_shared/auth-helpers.ts';
const corsHeaders = getPublicCorsHeaders();
```

---

## Environment Variables

Required secrets in Supabase:

| Variable | Purpose | Required For |
|----------|---------|--------------|
| `SUPABASE_URL` | Project URL | All functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin access | All functions |
| `APP_URL` | CORS restriction | Internal functions |
| `FIRECRAWL_API_KEY` | Web crawling | `crawl-url` |
| `SHOPIFY_CLIENT_ID` | OAuth | Shopify functions |
| `SHOPIFY_CLIENT_SECRET` | OAuth | Shopify functions |
| `SHOPIFY_ENCRYPTION_KEY` | Token encryption | Shopify functions |
| `ENCRYPTION_SECRET` | General encryption | Various |

**Set in Supabase Dashboard:** Settings → Edge Functions → Secrets

---

## Best Practices

### ✅ **DO:**
- Always use `validateAuthAndAgent()` for authenticated functions
- Use `getRestrictedCorsHeaders()` for internal-only functions
- Implement rate limiting on resource-intensive operations
- Log security events for monitoring
- Handle errors gracefully with appropriate status codes
- Use TypeScript types for request/response bodies
- Include CORS preflight handling (`OPTIONS` method)

### ❌ **DON'T:**
- Don't expose internal functions with permissive CORS (`*`)
- Don't skip authentication checks on functions that modify data
- Don't use hardcoded credentials - always use environment variables
- Don't trust client-provided user_id - always validate with JWT
- Don't forget to handle OPTIONS requests for CORS
- Don't log sensitive data (tokens, passwords) in console logs

### 🔍 **Security Checklist for New Functions:**
- [ ] Uses `validateAuthAndAgent()` if modifying user/agent data
- [ ] Has appropriate CORS headers (`getRestrictedCorsHeaders()` or `getPublicCorsHeaders()`)
- [ ] Handles CORS preflight (`OPTIONS` method)
- [ ] Has rate limiting if resource-intensive
- [ ] Logs security events
- [ ] Returns appropriate error codes (401, 403, 429, 500)
- [ ] Uses environment variables for secrets
- [ ] Has RLS policies for database operations
- [ ] Input validation for all request parameters
- [ ] Documented in this README

---

## Monitoring & Debugging

### View Security Logs:
```sql
-- Recent auth failures
SELECT * FROM security_logs
WHERE event_type IN ('AUTH_FAILURE', 'UNAUTHORIZED_ACCESS')
ORDER BY created_at DESC
LIMIT 50;

-- High severity events
SELECT * FROM security_logs
WHERE severity = 'high'
ORDER BY created_at DESC;

-- Rate limit violations
SELECT * FROM security_logs
WHERE event_type = 'RATE_LIMIT_EXCEEDED'
ORDER BY created_at DESC;

-- Function-specific events
SELECT * FROM security_logs
WHERE function_name = 'crawl-url'
ORDER BY created_at DESC
LIMIT 100;
```

### View Edge Function Logs:
Supabase Dashboard → Edge Functions → [Function Name] → Logs

### Clean up old rate limits (runs automatically):
```sql
SELECT cleanup_old_rate_limits();
```

---

## Support

For questions or issues:
- Security Logs: `supabase.com/dashboard/project/etwjtxqjcwyxdamlcorf/editor`
- Edge Functions: `supabase.com/dashboard/project/etwjtxqjcwyxdamlcorf/functions`
- Supabase Docs: `https://supabase.com/docs/guides/functions`
