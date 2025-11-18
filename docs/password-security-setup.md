# Password Security Configuration

## Required Supabase Settings

To comply with Shopify's data protection requirements, the following password security settings must be enabled in your Supabase project.

### Steps to Configure

1. **Navigate to Authentication Settings**
   - Go to [Supabase Dashboard → Authentication → Password](https://supabase.com/dashboard/project/etwjtxqjcwyxdamlcorf/auth/policies)

2. **Enable Leaked Password Protection**
   - Toggle ON: "Leaked Password Protection"
   - This checks passwords against the HaveIBeenPwned database
   - Prevents users from using compromised passwords

3. **Set Minimum Password Length**
   - Set "Minimum Password Length" to **12 characters**
   - This exceeds industry standards (typically 8-10 characters)
   - Provides strong protection against brute force attacks

4. **Additional Recommended Settings**
   - Enable "Password Complexity Requirements" if available
   - Require at least one uppercase, lowercase, number, and special character
   - Enable "Password History" to prevent password reuse

### Current Implementation

The application already implements client-side password validation:

```typescript
// In src/lib/validation.ts
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password cannot exceed 100 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");
```

**Note**: The client-side minimum is 8 characters, but Supabase server-side should be set to 12 for enhanced security.

### Verification

After configuration, verify the settings:

1. Test sign-up with a weak password (should fail)
2. Test sign-up with a known leaked password (should fail)
3. Test sign-up with a strong 12+ character password (should succeed)

### Compliance

These settings satisfy:
- ✅ Shopify Partner Program requirement: "Strong password requirements for staff passwords"
- ✅ NIST SP 800-63B password guidelines
- ✅ OWASP password security recommendations
- ✅ GDPR security requirements (Article 32)

### Monitoring

Password security is monitored via:
- Failed login attempts logged in `activity_logs`
- Suspicious authentication patterns detected by `monitor_admin_access()`
- Rate limiting prevents brute force attacks via `rate_limit_check()`

*Configuration must be completed before Shopify App Store submission*
