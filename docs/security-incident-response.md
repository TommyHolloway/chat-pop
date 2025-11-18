# Security Incident Response Policy

## Purpose
This document outlines ChatPop's procedures for identifying, responding to, and recovering from security incidents involving customer personal data.

## Incident Classification

### Critical Incidents
- Unauthorized access to customer personal data
- Data breach or exposure of PII
- System compromise affecting customer data
- Loss of encryption keys
- Ransomware or malicious attacks

### High Priority Incidents
- Suspicious access patterns to PII
- Repeated authentication failures
- Unusual API activity
- Database security violations

### Medium Priority Incidents
- Rate limit violations
- Failed security validations
- Abnormal usage patterns

## Response Procedures

### 1. Detection & Identification (0-1 hour)
- **Automated Monitoring**: System logs security events via `log_security_event()` and `log_pii_access()` functions
- **Detection Mechanisms**:
  - `detect_suspicious_pii_access()` runs hourly to identify unusual access patterns
  - `comprehensive_security_scan()` provides 24-hour security reports
  - Real-time triggers monitor for security violations
- **Alert Threshold**: >50 PII accesses per hour for non-admins triggers automatic alerts

### 2. Initial Response (1-4 hours)
- **Containment**: 
  - Identify affected user accounts via activity logs
  - Temporarily suspend suspicious accounts if needed
  - Review `activity_logs` table for incident scope
- **Assessment**:
  - Query `activity_logs` with `action LIKE 'SECURITY_VIOLATION:%'`
  - Check `log_pii_access()` entries for data accessed
  - Identify affected customer records

### 3. Investigation (4-24 hours)
- **Root Cause Analysis**:
  - Review IP addresses and user agents from activity logs
  - Check authentication logs in Supabase Auth
  - Examine RLS policy violations
  - Review edge function logs for unauthorized access attempts
- **Data Impact Assessment**:
  - Identify specific PII fields accessed
  - Determine number of affected customers
  - Review `leads` and `profiles` access logs

### 4. Notification (24-72 hours)
- **Internal Notification**:
  - Notify admin team immediately
  - Document incident in secure incident log
- **External Notification** (if breach confirmed):
  - Notify affected merchants within 48 hours
  - Prepare GDPR-compliant breach notification if EU customers affected
  - Contact Shopify Partner support if Shopify data compromised

### 5. Recovery & Remediation
- **Immediate Actions**:
  - Apply security patches if vulnerability identified
  - Update RLS policies if policy gap found
  - Rotate API keys and secrets if compromised
  - Force password resets for affected accounts
- **Long-term Actions**:
  - Implement additional monitoring for identified attack vectors
  - Update security policies and procedures
  - Conduct security training if human error involved

### 6. Post-Incident Review (Within 7 days)
- **Documentation**:
  - Complete incident report with timeline
  - Document lessons learned
  - Update security procedures based on findings
- **Prevention Measures**:
  - Implement additional security controls
  - Update automated detection rules
  - Enhance monitoring for similar incidents

## Automated Security Features

### Continuous Monitoring
- `automated_security_maintenance_v2()` runs daily to:
  - Clean up old visitor data (14-day retention)
  - Remove old activity logs (60-day retention for non-security events)
  - Keep security events for 180 days
  - Run suspicious activity detection

### Access Logging
- All PII access logged via `log_pii_access()`
- Profile updates monitored via `monitor_profiles_pii_access()`
- Lead captures tracked via `monitor_leads_pii_access()`
- Admin access monitored via `monitor_admin_access()`

### Rate Limiting
- `enhanced_rate_limit_check()` prevents abuse
- Automatic blocking of excessive access attempts
- IP-based rate limiting for visitor sessions

## Contact Information
- **Security Team**: security@chatpop.ai
- **Incident Hotline**: Available 24/7 via Supabase Dashboard alerts
- **Escalation**: Admin users notified via `log_security_event()`

## Compliance
This policy complies with:
- GDPR Article 33 (Breach notification within 72 hours)
- GDPR Article 34 (Communication to data subjects)
- Shopify Partner Program requirements
- SOC 2 Type II controls

## Review Schedule
This policy is reviewed and updated:
- Quarterly by security team
- After each security incident
- When new features are deployed
- When regulations change

*Last Updated: 2024*
*Next Review: Quarterly*
