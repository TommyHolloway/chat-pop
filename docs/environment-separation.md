# Environment Separation Policy

## Overview
ChatPop maintains strict separation between development, staging, and production environments to prevent data leakage, ensure testing safety, and maintain compliance with data protection regulations.

## Environment Architecture

### Production Environment
- **Purpose**: Live customer data and active merchants
- **Supabase Project**: `etwjtxqjcwyxdamlcorf` (production project ID)
- **Database**: Encrypted, backed up daily with PITR enabled
- **Access**: Limited to production-approved personnel only
- **Data**: Real customer PII, production Shopify connections
- **URL**: `https://etwjtxqjcwyxdamlcorf.supabase.co`

### Development Environment
- **Purpose**: Local development and testing
- **Supabase Project**: Separate development project (non-production)
- **Database**: Synthetic test data only, no real PII
- **Access**: Development team members
- **Data**: Anonymized test data, mock Shopify stores
- **Local Setup**: Supabase local development with Docker

### Test/Staging Environment
- **Purpose**: Pre-production testing and QA
- **Supabase Project**: Separate staging project
- **Database**: Sanitized production data subset
- **Access**: QA team and approved developers
- **Data**: Anonymized data that mimics production structure
- **Testing**: Integration tests, performance tests

## Data Isolation Rules

### Production Data Protection
✅ **Allowed**:
- Production deployment of tested code
- Read-only analytics queries by authorized users
- GDPR-compliant data exports
- Security monitoring and logging

❌ **Prohibited**:
- Direct database access from development machines
- Copying production data to local environments
- Testing experimental features on production
- Using production API keys in development
- Storing production credentials in code repositories

### Development Data Requirements
- **Synthetic Data Only**: All PII must be fake
- **Test Accounts**: Use dedicated test Shopify stores
- **API Keys**: Separate development/staging API keys
- **No Production Secrets**: Development uses different environment variables

## Access Controls

### Production Access
- **Database Access**: 
  - No direct SQL access except via Supabase dashboard
  - All queries through authenticated RLS policies
  - Admin access requires 2FA and IP allowlisting
  
- **Admin Panel**:
  - Role-based access via `user_roles` table
  - Admin actions logged in `activity_logs`
  - No shared admin credentials

- **Edge Functions**:
  - Production secrets stored in Supabase Vault
  - No hardcoded API keys
  - Separate function deployments per environment

### Development Access
- **Local Supabase**: Self-hosted via `supabase start`
- **Test Data**: Generated via seed scripts
- **API Mocking**: Use test mode for external services
- **Credentials**: Stored in `.env.local` (gitignored)

## Configuration Management

### Environment Variables
```typescript
// Production (Supabase Dashboard)
SUPABASE_URL=https://etwjtxqjcwyxdamlcorf.supabase.co
SUPABASE_ANON_KEY=<production-key>
SHOPIFY_CLIENT_SECRET=<production-secret>
STRIPE_SECRET_KEY=<production-key>

// Development (.env.local)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<local-key>
SHOPIFY_CLIENT_SECRET=<test-secret>
STRIPE_SECRET_KEY=<test-key>
```

### Secrets Management
- **Production**: Stored in Supabase Edge Function secrets
- **Development**: Local `.env.local` file (gitignored)
- **Never**: Committed to git or shared in chat tools
- **Rotation**: Quarterly secret rotation for production

## Deployment Pipeline

### Development → Staging
1. Code merged to `staging` branch
2. Automated tests run with synthetic data
3. Deploy to staging Supabase project
4. QA testing with anonymized data
5. Security scan passes

### Staging → Production
1. Code merged to `main` branch
2. All staging tests pass
3. Manual approval required
4. Deploy to production Supabase project
5. Smoke tests with real data
6. Rollback plan ready

### Rollback Procedures
- Database: Point-in-time recovery available
- Code: Git revert to previous stable commit
- Edge Functions: Automatic versioning in Supabase
- Testing: Verify rollback in staging first

## Data Sanitization

### Production → Staging Data Copy
If production data is needed for testing (rare):

```sql
-- Anonymize PII before copying
UPDATE profiles SET
  email = 'test_' || id || '@example.com',
  phone = NULL,
  display_name = 'Test User ' || substring(id::text, 1, 8);

UPDATE leads SET
  lead_data_json = jsonb_set(
    lead_data_json,
    '{email}',
    '"test_' || id || '@example.com"'
  );

-- Remove sensitive Shopify data
UPDATE shopify_connections SET
  encrypted_access_token = 'REDACTED',
  shop_owner_email = 'test@example.com',
  shop_owner_name = 'Test Shop';
```

### Test Data Generation
```sql
-- Generate synthetic test users
INSERT INTO profiles (user_id, email, display_name, plan)
SELECT
  gen_random_uuid(),
  'testuser' || generate_series || '@example.com',
  'Test User ' || generate_series,
  'free'
FROM generate_series(1, 100);
```

## Monitoring & Compliance

### Environment Health Checks
- **Production**: 24/7 uptime monitoring via Supabase
- **Development**: Local health checks
- **Staging**: Pre-deployment validation tests

### Audit Logging
```sql
-- Log environment-specific actions
log_service_role_operation(
  'environment_access',
  'production_database',
  jsonb_build_object(
    'environment', 'production',
    'action', 'query_executed',
    'user', auth.uid()
  )
);
```

### Compliance Checks
- ✅ No production data in development environments
- ✅ Separate credentials per environment
- ✅ Encrypted backups for production only
- ✅ Access logs maintained per environment
- ✅ GDPR-compliant data handling in all environments

## Developer Onboarding

### New Developer Setup
1. **Local Environment**:
   ```bash
   # Clone repository
   git clone <repo-url>
   
   # Install Supabase CLI
   npm install -g supabase
   
   # Start local Supabase
   supabase start
   
   # Copy development env file
   cp .env.example .env.local
   ```

2. **Access Grants**:
   - GitHub repository access
   - Development Supabase project (view only)
   - Test Shopify partner account
   - No production access initially

3. **Training**:
   - Review this environment separation policy
   - Complete security awareness training
   - Sign data protection agreement

### Production Access Request
**Requirements**:
- 6+ months with the company
- Security training completed
- Business justification documented
- Manager approval required
- 2FA enabled on all accounts

**Process**:
1. Submit access request ticket
2. Security team review
3. Approval by CTO/Security Officer
4. Time-limited access grant (90 days)
5. Re-certification required after 90 days

## Security Considerations

### Network Separation
- **Production**: Restricted IP ranges for admin access
- **Development**: Local network only
- **API Access**: Different base URLs per environment

### Credential Rotation
- **Production Secrets**: Rotated quarterly
- **Development Secrets**: Rotated on developer offboarding
- **Emergency Rotation**: Within 1 hour of suspected compromise

### Incident Response
If production data is accidentally accessed from development:
1. Immediately revoke development access
2. Rotate all compromised credentials
3. Audit logs for data exfiltration
4. Document incident in security log
5. Notify affected parties if PII compromised
6. Update access controls to prevent recurrence

## Testing Guidelines

### Acceptable Testing Practices
✅ Unit tests with mocked data
✅ Integration tests with synthetic data
✅ Load testing on staging environment
✅ Security testing on isolated test instances

### Prohibited Testing Practices
❌ Performance testing on production database
❌ Destructive operations without safeguards
❌ Testing with real customer email addresses
❌ Automated scripts that modify production data

## Continuous Improvement

### Regular Audits
- **Monthly**: Review production access logs
- **Quarterly**: Environment separation compliance audit
- **Annually**: Full security review of all environments
- **Post-Incident**: Immediate policy review and updates

### Metrics Tracked
- Production access requests: <5/month
- Accidental production data access: 0 (target)
- Environment misconfiguration incidents: 0 (target)
- Credential rotation compliance: 100%

## Documentation
- All environment changes documented in changelog
- Access grants tracked in security log
- Configuration changes peer-reviewed
- Deployment procedures version-controlled

*Last Updated: 2024*
*Next Review: Quarterly*
