# ChatPop Shopify App Store - Pre-Submission Checklist

## Overview

This checklist ensures ChatPop is fully prepared for Shopify App Store submission. Complete all items before submitting to minimize rejection risk.

**Last Updated:** [Date before submission]  
**Target Submission Date:** [Your target date]  
**Estimated Review Time:** 2-3 weeks

---

## Phase 1: Code & Configuration

### Edge Functions Deployment

- [ ] **All edge functions deployed to production**
  - Verify via Supabase Dashboard > Edge Functions
  - Check deployment logs for errors
  - Test each function individually

- [ ] **Environment variables configured correctly**
  - `APP_BASE_URL` set to production URL
  - `SHOPIFY_CLIENT_ID` matches Partners app
  - `SHOPIFY_CLIENT_SECRET` is production secret
  - `SHOPIFY_ENCRYPTION_KEY` is 32-byte Base64 key
  - `SHOPIFY_BILLING_TEST_MODE` set to `false` for production

- [ ] **Database migrations applied**
  - All RLS policies enabled and tested
  - Indexes created for performance
  - No pending migrations

### OAuth & Authentication

- [ ] **OAuth configuration correct in Partners Dashboard**
  - App URL: `https://[your-production-domain].com`
  - Redirection URLs include:
    - `https://[your-domain]/api/shopify/callback`
    - `https://[your-domain]/shopify-admin`
  - Embedded app toggle: **ON**

- [ ] **OAuth scopes justified and documented**
  - Only requesting necessary scopes
  - Scope usage documented in app listing
  - No excessive permissions requested

- [ ] **Session token authentication tested**
  - Works in embedded iframe
  - Token validation on every request
  - Proper error handling for expired tokens

### Webhooks

- [ ] **Webhooks registered via code (not manually)**
  - Registration handled by `shopify-webhook-register` function
  - All required webhooks included:
    - `app/uninstalled`
    - `customers/data_request`
    - `customers/redact`
    - `shop/redact`
    - `orders/create`
    - `products/update`
    - `inventory_levels/update` (optional)

- [ ] **Webhook endpoints secured**
  - HMAC verification implemented
  - Webhooks only accessible via Shopify
  - Rate limiting on webhook endpoints

- [ ] **Webhook idempotency implemented**
  - Duplicate webhook detection via `X-Shopify-Webhook-Id`
  - Prevents double-processing
  - Tested with manual webhook replays

### Theme Extension

- [ ] **Theme extension deployed via Shopify CLI**
  ```bash
  shopify app deploy
  ```

- [ ] **Extension tested on multiple themes**
  - Dawn (Online Store 2.0)
  - At least one vintage theme
  - No layout breaking
  - Widget loads correctly

- [ ] **Extension configuration options provided**
  - Widget position customizable
  - Color customization available
  - Enable/disable toggle in theme editor

---

## Phase 2: Functionality Testing

### Core Features

- [ ] **Product catalog sync working**
  - Initial sync completes successfully
  - Webhook-based updates working
  - Handles 1000+ products
  - Variant data preserved

- [ ] **Chat widget functional**
  - Loads on storefront
  - AI responds accurately
  - Product recommendations relevant
  - Links navigate correctly
  - Mobile responsive

- [ ] **Cart recovery operational**
  - Abandonment detection working
  - Proactive messages sent
  - Recovery links functional
  - Attribution tracking accurate

- [ ] **Order attribution working**
  - Conversations linked to orders
  - Multi-touch attribution calculated
  - Confidence scores reasonable
  - Revenue correctly attributed

### Analytics & Reporting

- [ ] **Admin dashboard displaying data**
  - Metrics calculate correctly
  - Charts render without errors
  - Date filters functional
  - Export features working

- [ ] **Analytics accurate**
  - Conversation counts match database
  - Revenue attribution verified
  - Conversion rates calculated correctly
  - No data discrepancies

### Billing

- [ ] **Subscription plans configured in Partners Dashboard**
  - Starter plan: $29/month (or your pricing)
  - Pro plan: $99/month (or your pricing)
  - Trial periods set (7-14 days recommended)
  - Return URLs configured

- [ ] **Billing flow tested in TEST MODE first**
  - `SHOPIFY_BILLING_TEST_MODE=true` for testing
  - Subscription creation works
  - Approval flow smooth
  - Cancellation flow works

- [ ] **Production billing configured**
  - `SHOPIFY_BILLING_TEST_MODE=false` for production
  - Test charges NOT created
  - Webhook handling for billing updates
  - Grace period for failed payments

---

## Phase 3: Performance & Security

### Performance Metrics

- [ ] **Lighthouse performance audit passed**
  - Run on storefront with widget enabled
  - Performance score > 90 (or < 10 point drop)
  - LCP (Largest Contentful Paint) ≤ 2.5 seconds
  - CLS (Cumulative Layout Shift) ≤ 0.1

- [ ] **API response times within limits**
  - Average response < 1.5 seconds
  - 95th percentile < 3 seconds
  - No timeouts under normal load

- [ ] **Widget load performance optimized**
  - Async script loading
  - No blocking resources
  - Minimal layout shift
  - Fast initial paint

- [ ] **Database queries optimized**
  - Indexes on foreign keys
  - Query plans reviewed
  - No N+1 queries
  - Connection pooling configured

### Security

- [ ] **All API calls over HTTPS**
  - No mixed content warnings
  - TLS 1.2 or higher
  - Valid SSL certificates

- [ ] **Sensitive data encrypted**
  - Shopify access tokens encrypted at rest
  - AES-256 encryption used
  - Encryption keys secured (not in code)

- [ ] **Rate limiting implemented**
  - Chat widget: 10 messages per 10 minutes
  - Product sync: 5 per 10 minutes
  - Admin endpoints protected
  - Proper error responses

- [ ] **Input validation on all endpoints**
  - SQL injection prevention
  - XSS protection
  - CSRF protection (via session tokens)
  - Shop domain validation

- [ ] **Security logging active**
  - Failed auth attempts logged
  - Suspicious activity monitored
  - PII access tracked
  - Logs reviewed regularly

### GDPR Compliance

- [ ] **Privacy policy published and linked**
  - URL added to app listing
  - Covers data collection practices
  - Explains data retention
  - Contact information provided

- [ ] **Terms of service published and linked**
  - URL added to app listing
  - Covers usage terms
  - Liability disclosures
  - Dispute resolution process

- [ ] **GDPR webhooks implemented**
  - `customers/data_request` handler complete
  - `customers/redact` handler complete
  - `shop/redact` handler complete
  - All tested and verified

- [ ] **Data retention policy documented**
  - 48-hour grace period after uninstall
  - Automatic data deletion implemented
  - Audit logs maintained
  - Backup policy documented

- [ ] **Customer data export functional**
  - All customer data identifiable
  - Export includes conversations, leads, analytics
  - Format is machine-readable (JSON)
  - Delivered within 30 days

---

## Phase 4: Documentation & Listing

### App Listing Materials

- [ ] **App name finalized**
  - Unique and descriptive
  - No trademark conflicts
  - Matches branding

- [ ] **App tagline written** (70 characters max)
  - Clearly describes value proposition
  - Mentions key benefit (e.g., "AI shopping assistant for cart recovery and product recommendations")

- [ ] **App description written** (300-500 words)
  - Explains features clearly
  - Highlights benefits for merchants
  - Includes use cases
  - No marketing fluff

- [ ] **App icon prepared** (1024x1024px PNG)
  - High resolution
  - Clear and recognizable
  - Matches brand colors
  - No text overlay

- [ ] **Screenshots prepared** (at least 3, max 5)
  - 1920x1080px or 1920x1200px
  - Show key features:
    1. Chat widget on storefront
    2. Admin dashboard
    3. Analytics screen
    4. Settings/configuration
  - High quality, no compression artifacts
  - Annotations optional but helpful

- [ ] **Demo video created** (30-90 seconds, optional but recommended)
  - Shows installation process
  - Demonstrates key features
  - Voiceover or captions
  - Hosted on YouTube or Vimeo

### Developer Documentation

- [ ] **README.md comprehensive**
  - Installation instructions
  - Configuration guide
  - Troubleshooting section
  - Support contact information

- [ ] **API documentation created** (if exposing APIs)
  - Endpoint descriptions
  - Authentication requirements
  - Request/response examples
  - Rate limits documented

- [ ] **Changelog maintained**
  - Version history
  - Feature additions
  - Bug fixes
  - Breaking changes noted

- [ ] **Reviewer guide prepared** (this document)
  - Step-by-step testing instructions
  - Expected behaviors documented
  - Edge cases covered
  - Test credentials provided

### Support Infrastructure

- [ ] **Support email configured**
  - Dedicated support address (e.g., support@chatpop.com)
  - Monitored regularly (24-48 hour response time)
  - Ticketing system optional but recommended

- [ ] **Documentation website live**
  - Getting started guide
  - Feature tutorials
  - FAQ section
  - Video walkthroughs

- [ ] **Status page setup** (optional but recommended)
  - Shows system status
  - Incident history
  - Maintenance schedules
  - Subscribe to updates

---

## Phase 5: Testing & Validation

### Functionality Tests

- [ ] **All features tested on development store**
  - OAuth installation
  - Product sync
  - Chat interactions
  - Cart recovery
  - Order attribution
  - Billing subscription

- [ ] **Cross-browser testing completed**
  - Chrome (latest)
  - Firefox (latest)
  - Safari (latest)
  - Edge (latest)

- [ ] **Mobile testing completed**
  - iOS Safari
  - Android Chrome
  - Responsive design verified
  - Touch interactions work

- [ ] **Edge cases tested**
  - Large product catalogs (1000+ products)
  - Concurrent users
  - Network failures
  - API timeouts
  - Invalid data handling

### User Acceptance Testing

- [ ] **Beta testing with real merchants**
  - At least 3 beta testers
  - Feedback collected and addressed
  - No critical bugs reported
  - Positive user experience

- [ ] **Load testing performed**
  - Simulated 100 concurrent users
  - No performance degradation
  - Error rate < 0.1%
  - Response times consistent

---

## Phase 6: Pre-Submission Final Checks

### Configuration Review

- [ ] **ALL environment variables in production mode**
  - `SHOPIFY_BILLING_TEST_MODE=false` ✅ CRITICAL
  - All URLs point to production domains
  - No test/development keys in production

- [ ] **Partners Dashboard configuration finalized**
  - App URL correct
  - Redirection URLs complete
  - Webhooks configured
  - Billing plans published

- [ ] **Database ready for production**
  - All RLS policies enabled
  - No test data in production tables
  - Backups configured
  - Monitoring setup

### Code Quality

- [ ] **Code reviewed and cleaned**
  - No console.log statements in production code
  - No commented-out code blocks
  - No TODOs or FIXMEs in critical paths
  - Linting passes with no errors

- [ ] **Dependencies up to date**
  - No security vulnerabilities (run `npm audit`)
  - All packages on stable versions
  - No unused dependencies

- [ ] **Error tracking configured**
  - Sentry or similar tool setup
  - Error notifications enabled
  - Source maps uploaded
  - Team alerted on critical errors

### Final Smoke Test

- [ ] **Fresh installation test**
  - Uninstall from all test stores
  - Install fresh on new development store
  - Complete full setup wizard
  - Test all core features
  - Verify no errors

- [ ] **Reviewer credentials prepared**
  - Test store URL documented
  - Test products added to store
  - Test orders created
  - Admin access ready
  - Shared securely with Shopify (via Partners dashboard)

---

## Phase 7: Submission

### Submission Package

- [ ] **App listing complete in Partners Dashboard**
  - Name, tagline, description
  - Icon and screenshots uploaded
  - Demo video linked (if available)
  - Category selected correctly
  - Tags added (max 5 relevant tags)

- [ ] **App URLs finalized**
  - App URL (main app entry point)
  - Privacy policy URL
  - Terms of service URL
  - Support URL
  - Documentation URL

- [ ] **Compliance questions answered**
  - Data collection practices disclosed
  - Third-party services listed (e.g., OpenAI, Supabase)
  - Payment processing described (Shopify Billing API)
  - Geographic restrictions noted (if any)

- [ ] **Pricing model configured**
  - Plans published in Partners Dashboard
  - Trial periods set
  - Upgrade/downgrade paths clear
  - Refund policy documented

### Submit Application

- [ ] **Click "Submit for Review" in Partners Dashboard**
  - Review submission confirmation
  - Note submission date and ID
  - Monitor email for Shopify communication

- [ ] **Provide reviewer access** (if requested)
  - Development store URL
  - Admin credentials (via secure channel)
  - Test scenarios documented
  - Expected review completion: 2-3 weeks

---

## Phase 8: Post-Submission

### Monitoring

- [ ] **Monitor edge function logs daily**
  - Check for unexpected errors
  - Review performance metrics
  - Watch for security events

- [ ] **Monitor email for Shopify feedback**
  - Respond to questions within 24 hours
  - Address rejection reasons immediately
  - Resubmit quickly after fixes

- [ ] **Track review status in Partners Dashboard**
  - Check status daily
  - Note any status changes
  - Document feedback received

### Prepare for Feedback

- [ ] **Common rejection reasons documented**
  - Performance issues
  - Privacy policy updates needed
  - Webhook handling improvements
  - Better error messages
  - Documentation clarity

- [ ] **Response plan for rejections**
  - Fix issues within 48 hours
  - Test thoroughly before resubmit
  - Document changes made
  - Provide explanation to reviewers

---

## Expected Timeline

| Phase | Duration | Notes |
|-------|----------|-------|
| Pre-submission prep | 1-2 weeks | Complete all checklist items |
| Submission | 1 day | Upload materials, click submit |
| Initial review | 3-5 days | Shopify assigns reviewer |
| Testing & feedback | 1-2 weeks | Back-and-forth if issues found |
| Approval | Immediate | After passing all tests |
| **Total** | **2-4 weeks** | Expect 1-3 rejection cycles |

---

## Critical Items (Must Complete)

These items are **non-negotiable** for approval:

1. ✅ `SHOPIFY_BILLING_TEST_MODE=false` in production
2. ✅ All GDPR webhooks implemented and tested
3. ✅ Privacy policy and ToS published and linked
4. ✅ Performance metrics within Shopify limits (LCP, CLS)
5. ✅ OAuth flow secure (HMAC, state validation)
6. ✅ Session token authentication working
7. ✅ No excessive API scope requests
8. ✅ Webhook HMAC verification implemented
9. ✅ Data encryption for access tokens
10. ✅ Clean uninstall with data deletion

---

## Sign-Off

**Developer:** _____________________ Date: __________

**QA Lead:** _____________________ Date: __________

**Project Manager:** _____________________ Date: __________

---

## Appendix: Quick Reference

### Key URLs to Verify

- [ ] App URL: `https://[your-domain].com`
- [ ] OAuth Callback: `https://[your-domain].com/api/shopify/callback`
- [ ] Embedded Admin: `https://[your-domain].com/shopify-admin`
- [ ] Privacy Policy: `https://[your-domain].com/privacy`
- [ ] Terms of Service: `https://[your-domain].com/terms`
- [ ] Support: `https://[your-domain].com/support` or `support@[your-domain].com`

### Critical Environment Variables

```bash
# Verify these are set correctly in Supabase Dashboard > Project Settings > Edge Functions
APP_BASE_URL=https://[your-production-domain].com
SHOPIFY_CLIENT_ID=[your-production-client-id]
SHOPIFY_CLIENT_SECRET=[your-production-secret]
SHOPIFY_ENCRYPTION_KEY=[32-byte-base64-key]
SHOPIFY_BILLING_TEST_MODE=false  # CRITICAL: Must be false for production
```

### Useful Commands

```bash
# Deploy theme extension
shopify app deploy

# Check edge function logs
supabase functions logs [function-name] --project-ref [your-ref]

# Run Lighthouse audit
lighthouse https://[your-test-store].myshopify.com --view

# Test webhook locally
curl -X POST https://[your-domain].com/api/webhooks/shopify \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Webhook-Id: test-123" \
  -d '{"topic":"app/uninstalled","shop_domain":"test.myshopify.com"}'
```

---

## Resources

- [Shopify App Store Requirements](https://shopify.dev/docs/apps/launch/app-store-requirements)
- [Built for Shopify Badge](https://shopify.dev/docs/apps/launch/built-for-shopify)
- [App Review Process](https://shopify.dev/docs/apps/launch/review-process)
- [Performance Best Practices](https://shopify.dev/docs/apps/best-practices/performance)
- [Privacy & Security](https://shopify.dev/docs/apps/store/security-compliance/app-data-protection)

---

**Ready to submit?** Double-check EVERY item above before clicking "Submit for Review" ✨
