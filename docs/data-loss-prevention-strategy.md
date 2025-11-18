# Data Loss Prevention Strategy

## Overview
ChatPop implements a comprehensive data loss prevention (DLP) strategy to protect customer personal data from unauthorized access, accidental deletion, and system failures.

## Data Classification

### Critical Data (Tier 1)
- Customer PII (names, emails, phone numbers)
- Shopify OAuth tokens (encrypted)
- Payment information (handled by Stripe/Shopify)
- Chat conversation data containing PII

### Important Data (Tier 2)
- Agent configurations
- Product catalogs
- Analytics data
- Visitor session data

### Standard Data (Tier 3)
- Activity logs
- Cache data
- Temporary session data

## Backup Strategy

### Automated Backups (Supabase Native)
- **Frequency**: Continuous real-time backups via Supabase
- **Retention**: 
  - Daily backups: 7 days
  - Weekly backups: 4 weeks
  - Monthly backups: 12 months
- **Backup Method**: Point-in-time recovery (PITR) enabled
- **Storage Location**: Encrypted AWS S3 buckets (managed by Supabase)

### Backup Encryption
- **At Rest**: AES-256 encryption on all Supabase backups
- **In Transit**: TLS 1.3 for all backup transfers
- **Key Management**: AWS KMS (managed by Supabase)
- **Access Control**: Limited to Supabase infrastructure team

### Database Replication
- **Primary**: Hosted in Supabase managed infrastructure
- **Read Replicas**: Automatic failover replicas maintained by Supabase
- **Geographic Distribution**: Multi-region backup storage
- **Replication Lag**: <1 second for real-time sync

## Data Retention Policies

### Personal Data Retention
```sql
-- Visitor data: 14-day strict retention
DELETE FROM visitor_behavior_events 
WHERE created_at < NOW() - INTERVAL '14 days';

DELETE FROM visitor_sessions 
WHERE created_at < NOW() - INTERVAL '14 days';
```

### Security Logs Retention
```sql
-- Standard logs: 60 days
-- Security events: 180 days
DELETE FROM activity_logs 
WHERE created_at < NOW() - INTERVAL '60 days'
  AND action NOT LIKE '%SECURITY%';
```

### Monthly Visitor Tracking
```sql
-- Visitor tracking: 13 months
DELETE FROM agent_monthly_visitors 
WHERE month < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '13 months');
```

## Prevention Mechanisms

### 1. Accidental Deletion Prevention
- **Soft Deletes**: Use `deleted_at` columns instead of hard deletes
- **RLS Policies**: Row-level security prevents unauthorized deletion
- **Audit Trail**: All deletions logged in `activity_logs`
- **Admin Confirmation**: Critical deletions require confirmation

### 2. Database-Level Protection
```sql
-- Prevent modification of reserved schemas
-- auth, storage, realtime, supabase_functions, vault

-- Immutable audit logs
CREATE POLICY "Activity logs are immutable"
ON activity_logs FOR UPDATE
USING (false);
```

### 3. Access Controls
- **Role-Based Access**: `app_role` enum (admin, moderator, user)
- **Least Privilege**: Users can only access their own data
- **Function Security**: All functions use `SECURITY DEFINER` with `set search_path = public`
- **API Key Protection**: Shopify tokens encrypted in database

### 4. Rate Limiting
```typescript
// Prevent bulk data exfiltration
enhanced_rate_limit_check('data_export', 10, 60)
```

### 5. PII Access Monitoring
```sql
-- All PII access logged automatically
log_pii_access('profiles', 'SELECT', record_id, '["email", "phone"]', 'reason')
```

## Disaster Recovery

### Recovery Time Objective (RTO)
- **Critical Systems**: < 1 hour
- **Database Restoration**: < 4 hours
- **Full System Recovery**: < 24 hours

### Recovery Point Objective (RPO)
- **Maximum Data Loss**: < 5 minutes (PITR)
- **Backup Verification**: Daily automated tests
- **Restoration Testing**: Monthly drills

### Recovery Procedures

#### Database Recovery
1. **Point-in-Time Recovery** (for recent data loss):
   ```bash
   # Via Supabase Dashboard
   # Navigate to Database → Backups → Point-in-time Recovery
   # Select timestamp before incident
   # Confirm restoration
   ```

2. **Backup Restoration** (for older data):
   ```bash
   # Contact Supabase support for backup restoration
   # Provide: timestamp, affected tables, incident report
   ```

3. **Verification**:
   - Run data integrity checks
   - Verify PII count matches expected
   - Check audit logs for completeness

## Data Export Controls

### Authorized Exports
- **GDPR Requests**: Via `export_customer_data()` function
- **Merchant Dashboards**: RLS-protected queries only
- **Analytics Reports**: Anonymized data only

### Export Logging
```typescript
log_service_role_operation(
  'data_export',
  'table_name',
  { record_count: count, export_type: 'gdpr' }
)
```

## Monitoring & Alerts

### Automated Monitoring
- **Suspicious Data Access**: `detect_suspicious_pii_access()`
- **Bulk Export Detection**: >50 records/hour triggers alert
- **Failed Backup Alerts**: Via Supabase monitoring
- **Replication Lag Alerts**: >30 seconds

### Daily Security Scans
```sql
-- Runs via cron job
SELECT comprehensive_security_scan();
```

## Encryption Standards

### Data at Rest
- **Database**: AES-256 encryption (Supabase native)
- **File Storage**: AES-256 encryption (Supabase Storage)
- **Backups**: AES-256 encryption (AWS KMS)
- **Sensitive Fields**: Additional encryption for OAuth tokens

### Data in Transit
- **API Calls**: TLS 1.3 mandatory
- **Database Connections**: SSL/TLS required
- **Webhook Delivery**: HTTPS only
- **Admin Access**: TLS 1.3 + certificate pinning

## Third-Party Data Processing

### Shopify Integration
- **Data Minimization**: Only request necessary scopes
- **Token Security**: Encrypted storage in database
- **Webhook Verification**: HMAC-SHA256 validation
- **GDPR Compliance**: Automated webhook handlers

### Supabase (Infrastructure)
- **SOC 2 Type II Certified**
- **GDPR Compliant**
- **Data Residency**: Configurable regions
- **Backup Encryption**: Native AWS KMS

## Compliance

### Standards Adherence
- ✅ GDPR Article 32 (Security of processing)
- ✅ GDPR Article 25 (Data protection by design)
- ✅ SOC 2 Type II (Security & Availability)
- ✅ Shopify Partner Program requirements

### Audit Trail
- All data access logged with timestamps
- PII access requires business justification
- Admin actions logged separately
- Logs immutable for 180 days

## Testing & Validation

### Regular Testing
- **Backup Restoration**: Monthly
- **Disaster Recovery Drill**: Quarterly
- **Penetration Testing**: Bi-annually
- **Security Audits**: Annually

### Validation Checks
```sql
-- Data integrity validation
SELECT COUNT(*) FROM profiles WHERE email IS NULL;
SELECT COUNT(*) FROM leads WHERE deleted_at IS NULL;
```

## Continuous Improvement

### Regular Reviews
- Monthly: Security event analysis
- Quarterly: DLP policy review
- Annually: Full security audit
- Post-incident: Immediate policy updates

### Metrics Tracked
- Mean Time to Detect (MTTD): <15 minutes
- Mean Time to Respond (MTTR): <1 hour
- Data Loss Incidents: 0 (target)
- Recovery Success Rate: 100% (target)

*Last Updated: 2024*
*Next Review: Quarterly*
