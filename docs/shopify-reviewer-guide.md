# ChatPop Shopify App - Reviewer Testing Guide

## Overview

**App Name:** ChatPop  
**App Type:** Embedded App with Theme Extension  
**Category:** Conversion & Marketing  
**Purpose:** AI-powered shopping assistant for Shopify stores that provides product recommendations, cart recovery, and customer engagement

This guide provides step-by-step instructions for Shopify reviewers to test all functionality of the ChatPop app.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation & OAuth Flow](#installation--oauth-flow)
3. [Embedded Admin Interface](#embedded-admin-interface)
4. [Theme Extension Installation](#theme-extension-installation)
5. [Chat Widget Functionality](#chat-widget-functionality)
6. [Product Catalog Sync](#product-catalog-sync)
7. [Order Attribution](#order-attribution)
8. [Billing & Subscriptions](#billing--subscriptions)
9. [Webhooks & Data Handling](#webhooks--data-handling)
10. [GDPR Compliance](#gdpr-compliance)
11. [Performance Verification](#performance-verification)
12. [Security Testing](#security-testing)

---

## Prerequisites

### Required Access
- Shopify Partners account
- Development store with test products
- Test credit card for billing verification

### Test Store Setup
1. Create a development store with at least 10 products
2. Add product variants (sizes, colors)
3. Create at least 2 test orders
4. Enable Online Store 2.0 theme (Dawn recommended)

---

## Installation & OAuth Flow

### Test 1: Initial OAuth Installation

**Expected Behavior:** Secure OAuth flow with proper scope requests

**Steps:**
1. Navigate to app installation URL (provided in submission)
2. Verify OAuth permission screen displays required scopes:
   - `read_products`
   - `write_products`
   - `read_orders`
   - `write_orders`
   - `read_customers`
   - `read_inventory`
3. Click "Install App"
4. Verify redirect to ChatPop embedded admin interface
5. Confirm no errors in browser console

**Success Criteria:**
- ✅ OAuth completes without errors
- ✅ Proper scopes requested (no excessive permissions)
- ✅ Secure redirect with state parameter validation
- ✅ Session token authentication established

### Test 2: OAuth Security Validation

**Expected Behavior:** Proper HMAC verification and state validation

**Steps:**
1. Attempt to access OAuth callback with invalid HMAC (manual URL manipulation)
2. Verify app rejects the request
3. Check security_logs table for logged security event

**Success Criteria:**
- ✅ Invalid HMAC requests rejected
- ✅ Security events logged appropriately
- ✅ No sensitive data exposed in error messages

---

## Embedded Admin Interface

### Test 3: Dashboard Access

**Expected Behavior:** Polaris-compliant embedded interface loads properly

**Steps:**
1. From Shopify Admin, navigate to Apps > ChatPop
2. Verify embedded dashboard loads within iframe
3. Check that App Bridge is properly initialized (no console errors)
4. Navigate through tabs: Dashboard, Analytics, Settings

**Success Criteria:**
- ✅ Interface loads within 2 seconds
- ✅ Navigation works without page reloads
- ✅ Polaris components render correctly
- ✅ No console errors or warnings

### Test 4: Analytics Display

**Expected Behavior:** Real-time analytics showing conversation metrics

**Steps:**
1. Navigate to Analytics tab
2. Verify metrics display:
   - Total conversations
   - Conversion rate
   - Revenue attributed
   - Cart recovery stats
3. Check that charts render properly
4. Verify date range filters work

**Success Criteria:**
- ✅ Metrics update based on actual data
- ✅ Charts load without errors
- ✅ Date filters function correctly
- ✅ No performance issues with large datasets

---

## Theme Extension Installation

### Test 5: Widget Installation via Theme Editor

**Expected Behavior:** Chat widget appears on storefront after enabling theme extension

**Steps:**
1. In embedded admin, navigate to Settings > Installation
2. Click "Enable Chat Widget"
3. Go to Shopify Admin > Online Store > Themes > Customize
4. In theme editor, enable ChatPop app embed
5. Save changes and preview storefront
6. Verify widget bubble appears in bottom-right corner

**Success Criteria:**
- ✅ Widget appears on storefront
- ✅ Widget is customizable via theme editor
- ✅ Widget doesn't break theme layout
- ✅ Widget loads on all pages (unless configured otherwise)

### Test 6: Widget Customization

**Expected Behavior:** Widget appearance can be customized

**Steps:**
1. In ChatPop Settings > Appearance, change:
   - Widget bubble color
   - Initial greeting message
   - Profile image
2. Save changes
3. Refresh storefront and verify changes applied

**Success Criteria:**
- ✅ Color changes reflect immediately
- ✅ Message customization works
- ✅ Image upload and display functions
- ✅ Changes persist across sessions

---

## Chat Widget Functionality

### Test 7: Basic Chat Interaction

**Expected Behavior:** AI responds to customer queries with relevant information

**Steps:**
1. On storefront, click chat widget bubble
2. Type: "What products do you have for [category]?"
3. Verify AI responds with product recommendations
4. Click on a recommended product card
5. Verify it opens correct product page

**Success Criteria:**
- ✅ Chat interface opens smoothly
- ✅ AI responses are relevant and accurate
- ✅ Product cards display correct information
- ✅ Product links navigate to correct pages
- ✅ Response time < 3 seconds

### Test 8: Product Search & Recommendations

**Expected Behavior:** AI can search products and provide recommendations

**Steps:**
1. Ask: "Do you have [specific product name]?"
2. Ask: "What's your best selling product?"
3. Ask: "Show me products under $50"
4. Verify AI provides relevant results for each query

**Success Criteria:**
- ✅ Product search returns accurate results
- ✅ Price filtering works correctly
- ✅ Product data is current and synced
- ✅ Images display properly in chat

### Test 9: Cart Recovery Simulation

**Expected Behavior:** Widget detects cart abandonment and sends recovery message

**Steps:**
1. Add products to cart (minimum $20 total)
2. Navigate away from checkout without completing purchase
3. Wait 5 minutes (or configured delay)
4. Verify proactive message appears in chat widget
5. Click on recovery message
6. Verify it links back to checkout with cart intact

**Success Criteria:**
- ✅ Cart abandonment detected
- ✅ Recovery message sent at appropriate time
- ✅ Message includes cart details
- ✅ Checkout link preserves cart items
- ✅ Recovery tracked in admin analytics

---

## Product Catalog Sync

### Test 10: Initial Product Sync

**Expected Behavior:** All store products sync to ChatPop database

**Steps:**
1. In embedded admin, navigate to Settings > Integrations
2. Click "Sync Products Now"
3. Verify sync status updates in real-time
4. Check that product count matches store inventory
5. Verify product details (price, variants, images) are accurate

**Success Criteria:**
- ✅ All products synced successfully
- ✅ Sync completes within 60 seconds for 100 products
- ✅ Product data matches Shopify admin
- ✅ Variants properly imported
- ✅ Images and descriptions included

### Test 11: Webhook-Based Sync

**Expected Behavior:** Product changes automatically sync via webhooks

**Steps:**
1. In Shopify Admin, edit a product:
   - Change price
   - Update description
   - Add new variant
2. Wait 30 seconds
3. In ChatPop admin, verify product changes reflected
4. Test chat widget, verify AI uses updated information

**Success Criteria:**
- ✅ Webhook received and processed
- ✅ Product updates reflected in < 1 minute
- ✅ AI uses most current product data
- ✅ No sync errors logged

---

## Order Attribution

### Test 12: Conversation-to-Order Attribution

**Expected Behavior:** Orders are attributed to chat conversations when applicable

**Steps:**
1. Start a chat session on storefront
2. Ask about products and get recommendations
3. Click on recommended product
4. Complete a test order for that product
5. In ChatPop admin, navigate to Analytics > Attributed Orders
6. Verify the order appears with attribution details

**Success Criteria:**
- ✅ Order correctly attributed to conversation
- ✅ Attribution confidence score displayed
- ✅ Product match between recommendation and purchase tracked
- ✅ Revenue correctly calculated
- ✅ Attribution appears within 5 minutes of order creation

### Test 13: Multi-Touch Attribution

**Expected Behavior:** Multiple interactions tracked before conversion

**Steps:**
1. Have multiple chat conversations over 24 hours
2. View different products in each conversation
3. Complete order including products from different conversations
4. Verify admin shows multi-touch attribution
5. Check that all contributing conversations listed

**Success Criteria:**
- ✅ Multiple touchpoints tracked
- ✅ Attribution split calculated correctly
- ✅ Conversation history preserved
- ✅ Timeline of interactions displayed

---

## Billing & Subscriptions

### Test 14: Subscription Creation (Test Mode)

**Expected Behavior:** Billing flow completes in test mode without actual charges

**Steps:**
1. In ChatPop admin, navigate to Settings > Billing
2. Click "Upgrade to Pro Plan"
3. Verify Shopify billing approval screen appears
4. Click "Approve"
5. Verify redirect back to ChatPop with success message
6. Check that subscription status shows "Active"

**Success Criteria:**
- ✅ Billing screen displays correct plan details
- ✅ Test mode clearly indicated
- ✅ No actual charge attempted
- ✅ Subscription activates immediately
- ✅ Plan features enabled

### Test 15: Usage-Based Billing Display

**Expected Behavior:** Usage metrics displayed with billing information

**Steps:**
1. Navigate to Billing section
2. Verify current usage displayed:
   - Monthly visitors count
   - Conversation count
   - Cart recovery attempts
3. Check that usage limits shown for current plan
4. Verify upgrade prompts if limits approached

**Success Criteria:**
- ✅ Usage metrics accurate
- ✅ Limits clearly communicated
- ✅ Proactive upgrade suggestions when needed
- ✅ Billing period clearly indicated

### Test 16: Plan Downgrade/Cancel

**Expected Behavior:** Subscription can be downgraded or cancelled

**Steps:**
1. Navigate to Billing settings
2. Click "Cancel Subscription"
3. Verify confirmation dialog appears
4. Confirm cancellation
5. Check that status updates to "Cancelled"
6. Verify features still accessible until period end

**Success Criteria:**
- ✅ Cancellation flow works smoothly
- ✅ Confirmation prevents accidental cancellation
- ✅ Grace period honored
- ✅ Webhook received and processed

---

## Webhooks & Data Handling

### Test 17: Webhook Registration

**Expected Behavior:** Required webhooks automatically registered

**Steps:**
1. In Shopify Admin, go to Settings > Notifications > Webhooks
2. Verify ChatPop webhooks registered:
   - `app/uninstalled`
   - `customers/data_request`
   - `customers/redact`
   - `shop/redact`
   - `orders/create`
   - `products/update`
3. Check webhook URLs are HTTPS and point to correct edge functions

**Success Criteria:**
- ✅ All required webhooks registered
- ✅ Webhook URLs are valid
- ✅ Webhook secret properly configured
- ✅ No duplicate webhooks

### Test 18: Order Webhook Processing

**Expected Behavior:** New orders trigger attribution analysis

**Steps:**
1. Create a test order in Shopify Admin
2. Wait 30 seconds
3. Check ChatPop admin for order in analytics
4. Verify order attribution attempted
5. Check edge function logs for webhook processing

**Success Criteria:**
- ✅ Webhook received successfully
- ✅ Order data parsed correctly
- ✅ Attribution logic executed
- ✅ Admin UI updated
- ✅ No errors in logs

### Test 19: Product Update Webhook

**Expected Behavior:** Product changes sync immediately via webhook

**Steps:**
1. Update product in Shopify Admin
2. Verify webhook fires (check logs)
3. Confirm product updated in ChatPop database
4. Test chat widget uses new product data

**Success Criteria:**
- ✅ Webhook delivered reliably
- ✅ Product sync completes in < 30 seconds
- ✅ No data inconsistencies
- ✅ Idempotency handled (duplicate webhook rejection)

---

## GDPR Compliance

### Test 20: Customer Data Request

**Expected Behavior:** Customer data export completes as required by GDPR

**Steps:**
1. In Shopify Admin, go to Settings > Customer privacy
2. Request customer data export for test customer
3. Verify `customers/data_request` webhook received
4. Check that customer data compiled and logged
5. Verify response within 30 days requirement

**Success Criteria:**
- ✅ Webhook received and acknowledged
- ✅ Customer data identified across all tables
- ✅ Data export generated
- ✅ Includes all conversations, leads, analytics
- ✅ Security logged appropriately

### Test 21: Customer Data Redaction

**Expected Behavior:** Customer PII removed on request

**Steps:**
1. Request customer data redaction via Shopify Admin
2. Verify `customers/redact` webhook processed
3. Check that customer email, name anonymized in database
4. Verify conversation data retained but PII removed
5. Confirm analytics not affected by anonymization

**Success Criteria:**
- ✅ Redaction webhook processed
- ✅ PII fields anonymized
- ✅ Historical data integrity maintained
- ✅ Anonymization irreversible
- ✅ Logged for audit trail

### Test 22: Shop Data Redaction

**Expected Behavior:** All shop data removed after uninstall + 48 hours

**Steps:**
1. Trigger `shop/redact` webhook (via Partners dashboard)
2. Verify webhook acknowledged
3. Check that scheduled cleanup created
4. After 48 hours, verify all shop data deleted
5. Confirm no residual data in any tables

**Success Criteria:**
- ✅ Redaction scheduled correctly
- ✅ Grace period honored (48 hours)
- ✅ All shop data removed from:
  - shopify_connections
  - agent_product_catalog
  - shopify_orders
  - conversations
  - leads
- ✅ Audit trail maintained
- ✅ Billing records preserved (as required)

---

## Performance Verification

### Test 23: Widget Load Performance

**Expected Behavior:** Widget loads without impacting page performance

**Steps:**
1. Open storefront in Chrome DevTools
2. Navigate to Lighthouse tab
3. Run performance audit with widget disabled
4. Enable widget and run audit again
5. Compare performance scores

**Success Criteria:**
- ✅ Performance impact < 10 points
- ✅ LCP (Largest Contentful Paint) ≤ 2.5 seconds
- ✅ CLS (Cumulative Layout Shift) ≤ 0.1
- ✅ Widget script loads asynchronously
- ✅ No layout shift caused by widget

### Test 24: Response Time

**Expected Behavior:** API responses within acceptable latency

**Steps:**
1. Open browser Network tab
2. Interact with chat widget (send 10 messages)
3. Measure response times for each API call
4. Calculate average and 95th percentile

**Success Criteria:**
- ✅ Average response time < 1.5 seconds
- ✅ 95th percentile < 3 seconds
- ✅ No timeouts
- ✅ Consistent performance under load

### Test 25: Large Product Catalog

**Expected Behavior:** App handles stores with 1000+ products

**Steps:**
1. Import 1000 test products to development store
2. Trigger product sync in ChatPop
3. Verify sync completes successfully
4. Test product search in chat widget
5. Check that search results return quickly

**Success Criteria:**
- ✅ Sync completes within 10 minutes
- ✅ Product search responds in < 2 seconds
- ✅ No memory issues or timeouts
- ✅ Database queries optimized

---

## Security Testing

### Test 26: Session Token Validation

**Expected Behavior:** Embedded app validates session tokens properly

**Steps:**
1. Access embedded app from Shopify Admin
2. Inspect Network requests for session tokens
3. Verify all API calls include valid session token
4. Attempt to call API with expired token
5. Verify request rejected

**Success Criteria:**
- ✅ Session tokens validated on every request
- ✅ Expired tokens rejected with 401
- ✅ Token refresh works automatically
- ✅ No session leakage

### Test 27: HMAC Verification

**Expected Behavior:** All Shopify webhooks validated via HMAC

**Steps:**
1. Capture a legitimate webhook payload
2. Modify payload and recalculate HMAC incorrectly
3. Send modified webhook to app endpoint
4. Verify webhook rejected
5. Check security logs

**Success Criteria:**
- ✅ Invalid HMAC webhooks rejected
- ✅ Security event logged
- ✅ No processing of tampered data
- ✅ Proper error response returned

### Test 28: Rate Limiting

**Expected Behavior:** API endpoints protected against abuse

**Steps:**
1. Send 20 rapid chat messages from widget
2. Verify rate limiting kicks in after threshold
3. Check error message displayed to user
4. Wait for rate limit window to reset
5. Verify normal operation resumes

**Success Criteria:**
- ✅ Rate limits enforced (10 requests/10 min per session)
- ✅ Graceful error messages shown
- ✅ Rate limit tracking accurate
- ✅ No bypass possible

### Test 29: Data Encryption

**Expected Behavior:** Sensitive data encrypted at rest and in transit

**Steps:**
1. Verify all API calls use HTTPS
2. Check that Shopify access tokens encrypted in database
3. Verify encryption key properly secured
4. Test that encrypted data cannot be decrypted without key

**Success Criteria:**
- ✅ All connections use TLS 1.2+
- ✅ Access tokens encrypted with AES-256
- ✅ Encryption keys stored securely (not in code)
- ✅ Decryption only via authorized functions

---

## Edge Cases & Error Handling

### Test 30: Network Failure Recovery

**Expected Behavior:** App handles API outages gracefully

**Steps:**
1. Simulate Shopify API downtime (block network requests)
2. Attempt to sync products
3. Verify error message displayed
4. Verify app remains functional (cached data used)
5. Restore network and verify automatic recovery

**Success Criteria:**
- ✅ Graceful error messages
- ✅ No data loss or corruption
- ✅ Cached data used when available
- ✅ Automatic retry logic works
- ✅ Circuit breaker prevents repeated failures

### Test 31: Concurrent Access

**Expected Behavior:** Multiple users can access embedded app simultaneously

**Steps:**
1. Open ChatPop embedded app in 3 different browsers
2. Make changes in each session simultaneously
3. Verify no data conflicts or race conditions
4. Check that each session maintains proper state

**Success Criteria:**
- ✅ No data corruption
- ✅ Session isolation maintained
- ✅ Database transactions handle concurrency
- ✅ No performance degradation

---

## Uninstallation & Cleanup

### Test 32: App Uninstall Flow

**Expected Behavior:** Clean uninstall with webhook handling

**Steps:**
1. Uninstall ChatPop from development store
2. Verify `app/uninstalled` webhook received
3. Check that:
   - OAuth tokens revoked
   - Webhooks deregistered
   - Widget removed from storefront
4. Verify data marked for deletion (48-hour grace period)
5. After 48 hours, confirm all shop data removed

**Success Criteria:**
- ✅ Uninstall webhook received
- ✅ Access tokens immediately revoked
- ✅ Widget no longer loads on storefront
- ✅ Data cleanup scheduled correctly
- ✅ Billing subscription cancelled
- ✅ Audit trail maintained

### Test 33: Reinstallation After Uninstall

**Expected Behavior:** App can be reinstalled and data restored (within grace period)

**Steps:**
1. Uninstall app
2. Within 48 hours, reinstall app
3. Verify previous configuration and data available
4. Check that agent settings preserved
5. Confirm product catalog re-syncs

**Success Criteria:**
- ✅ Reinstall completes successfully
- ✅ Historical data accessible
- ✅ Settings preserved
- ✅ No duplicate data created

---

## Support & Documentation

### Test 34: In-App Help Resources

**Expected Behavior:** Merchants can access help documentation

**Steps:**
1. Navigate to embedded admin
2. Look for Help or Support links
3. Verify documentation is accessible
4. Check that contact support option available

**Success Criteria:**
- ✅ Help documentation easily found
- ✅ Documentation accurate and comprehensive
- ✅ Support contact information provided
- ✅ Links work correctly

---

## Expected Review Timeline

- **Initial Submission:** All tests passing, documentation complete
- **Review Duration:** 2-3 weeks typical
- **Feedback Cycles:** 1-3 rejection cycles expected
- **Common Rejections:** Performance issues, privacy policy updates, webhook handling edge cases

---

## Reviewer Checklist Summary

### Must Pass (Critical)
- [ ] OAuth flow secure and compliant
- [ ] GDPR webhooks implemented and tested
- [ ] Billing in test mode (no actual charges)
- [ ] Performance metrics within limits (LCP, CLS)
- [ ] Session token validation working
- [ ] Webhook HMAC verification working
- [ ] Data encryption implemented
- [ ] Privacy policy compliant

### Should Pass (Important)
- [ ] Widget loads without breaking themes
- [ ] Product sync reliable and accurate
- [ ] Order attribution working
- [ ] Analytics display correctly
- [ ] Rate limiting enforced
- [ ] Error handling graceful
- [ ] Uninstall cleanup proper

### Nice to Have (Enhancement)
- [ ] Multi-touch attribution
- [ ] Advanced analytics features
- [ ] Customization options robust
- [ ] Performance exceeds minimums

---

## Contact for Review Questions

**Developer Contact:** [Your email]  
**Support URL:** [Your support site]  
**Privacy Policy:** [Your privacy policy URL]  
**Terms of Service:** [Your ToS URL]

---

## Appendix: Test Credentials

*Note: Actual test credentials will be provided separately in the submission package*

- Test Store URL: [Provided during submission]
- Admin Access: [Provided during submission]
- Test Payment Details: Use Shopify test cards
