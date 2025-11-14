# Shopify App Testing Guide

Comprehensive testing checklist for ChatPop Shopify integration before submitting to the App Store.

## Prerequisites

Before testing:
- ✅ All environment variables configured ([see environment setup](./shopify-environment-setup.md))
- ✅ Development store created in Shopify Partners Dashboard
- ✅ App deployed to production/staging environment
- ✅ Billing in test mode (`SHOPIFY_BILLING_TEST_MODE="true"`)

---

## 1. OAuth Installation Flow

### Test Case 1.1: Fresh Installation

**Steps:**
1. Navigate to Shopify Partners Dashboard → Apps → Your App → Test on development store
2. Click "Install app" on your development store
3. Review permission scopes displayed
4. Click "Install"
5. Verify redirect to your app's embedded interface

**Expected Results:**
- ✅ OAuth permissions screen shows all required scopes
- ✅ Installation completes without errors
- ✅ Redirects to `/shopify-admin/settings` with success message
- ✅ Access token saved in `shopify_connections` table (encrypted)
- ✅ Shop owner email and name captured
- ✅ Webhooks automatically registered
- ✅ `billing_provider` set to 'shopify' in profiles table

**Common Issues:**
- Invalid redirect URL → Check `APP_BASE_URL` environment variable
- CSRF state error → Verify state stored in `shopify_oauth_states` table
- Encryption error → Check `SHOPIFY_ENCRYPTION_KEY` is configured

---

### Test Case 1.2: OAuth from Embedded Context

**Steps:**
1. Open Shopify Admin
2. Navigate to Apps → ChatPop (already installed)
3. Go to Settings tab in embedded app
4. Use "Connect Store" button (if implementing re-auth)
5. Complete OAuth flow

**Expected Results:**
- ✅ OAuth initiated with `embedded=true` flag
- ✅ Smooth redirect back to embedded app
- ✅ No "outside of iframe" warnings
- ✅ Session token authentication works after OAuth

---

## 2. Session Token Authentication

### Test Case 2.1: Session Token Verification

**Steps:**
1. Open ChatPop app from Shopify Admin
2. Open browser DevTools → Network tab
3. Navigate between embedded pages (Dashboard, Analytics, Settings)
4. Observe function calls to `verify-shopify-session`

**Expected Results:**
- ✅ Session token obtained from App Bridge
- ✅ Token verified successfully
- ✅ Shop domain extracted correctly
- ✅ Agent ID retrieved if store connected
- ✅ Token refreshes automatically when expired

**Test Invalid Token:**
1. Manually modify session token in browser
2. Try to load an embedded page

**Expected:**
- ✅ Graceful error handling
- ✅ User prompted to refresh/reconnect
- ✅ No application crashes

---

### Test Case 2.2: Session Persistence

**Steps:**
1. Open ChatPop in Shopify Admin
2. Navigate to different pages
3. Refresh browser
4. Close and reopen app

**Expected Results:**
- ✅ Session maintained across page navigation
- ✅ Session persists after browser refresh
- ✅ No unnecessary re-authentication

---

## 3. Embedded App Interface

### Test Case 3.1: Page Loading

Test all embedded pages load correctly:

**Dashboard (`/shopify-admin/dashboard`):**
- ✅ Stats display correctly
- ✅ Agent list populated
- ✅ Shop name shown in header
- ✅ Loading states work

**Analytics (`/shopify-admin/analytics`):**
- ✅ Charts render without errors
- ✅ Time range selector works
- ✅ Data updates on filter change

**Billing (`/shopify-admin/billing`):**
- ✅ Current plan displayed
- ✅ Available plans shown
- ✅ Upgrade buttons functional
- ✅ Test mode indicator visible

**Settings (`/shopify-admin/settings`):**
- ✅ Shop domain auto-populated
- ✅ Connected status banner shows
- ✅ Settings save successfully

---

### Test Case 3.2: App Bridge Integration

**Steps:**
1. Open ChatPop in Shopify Admin
2. Check for console errors
3. Test navigation within embedded app
4. Try using App Bridge features

**Expected Results:**
- ✅ No App Bridge initialization errors
- ✅ Navigation works smoothly
- ✅ No iframe-related warnings
- ✅ App Bridge API calls succeed

---

## 4. Billing Flow

### Test Case 4.1: Subscription Creation (Test Mode)

**Steps:**
1. Go to Billing page in embedded app
2. Click "Upgrade" on a paid plan
3. Complete Shopify billing approval
4. Verify subscription created

**Expected Results:**
- ✅ Redirects to Shopify billing approval page
- ✅ Test mode banner displayed ("This is a test transaction")
- ✅ Subscription created in `shopify_subscriptions` table
- ✅ Status set to 'active'
- ✅ Redirect back to app after approval
- ✅ Current plan updated in UI
- ✅ No actual charges made

**Test Edge Function:**
- Check logs for `shopify-create-subscription`
- Verify GraphQL mutation sent correctly
- Confirm return URL includes confirmation URL

---

### Test Case 4.2: Subscription Cancellation

**Steps:**
1. With active test subscription
2. Click "Cancel Subscription" button
3. Confirm cancellation
4. Verify subscription cancelled

**Expected Results:**
- ✅ Subscription marked as 'cancelled' in database
- ✅ Access continues until end of billing period
- ✅ UI updates to show cancellation
- ✅ No errors in edge function logs

---

### Test Case 4.3: Webhook - Subscription Update

**Steps:**
1. Manually trigger `app_subscriptions/update` webhook using Shopify's webhook tester
2. Or wait for subscription status change
3. Check `shopify-subscription-webhook` logs

**Expected Results:**
- ✅ Webhook received and verified
- ✅ HMAC signature validated
- ✅ Subscription status updated in database
- ✅ Appropriate action taken (activate, cancel, freeze)

---

## 5. Webhook Handling

### Test Case 5.1: App Uninstall

**Steps:**
1. Go to Shopify Admin → Apps
2. Uninstall ChatPop
3. Verify webhook received

**Expected Results:**
- ✅ `app/uninstalled` webhook triggered
- ✅ Shopify connection marked as 'inactive'
- ✅ Subscription cancelled (if applicable)
- ✅ No data deleted (for potential reinstall)
- ✅ Proper logging in `shopify-webhook-uninstall`

---

### Test Case 5.2: GDPR Webhooks

Test all three GDPR webhooks:

**customers/data_request:**
- ✅ Webhook received
- ✅ Customer data compiled
- ✅ Response includes all relevant data
- ✅ 48-hour compliance window met

**customers/redact:**
- ✅ Webhook received
- ✅ Customer data anonymized/deleted
- ✅ Order history preserved if required
- ✅ Proper audit trail

**shop/redact:**
- ✅ Webhook received
- ✅ All shop data marked for deletion
- ✅ 30-day retention window followed
- ✅ Final deletion occurs

---

### Test Case 5.3: Product/Order Webhooks

**orders/create & orders/updated:**
- ✅ Webhooks received
- ✅ Order data synced correctly
- ✅ No duplicate processing
- ✅ Error handling for invalid orders

**products/update:**
- ✅ Product catalog syncs
- ✅ Inventory levels updated
- ✅ Product availability reflected

**inventory_levels/update:**
- ✅ Stock levels sync
- ✅ Out-of-stock items marked
- ✅ Real-time updates

---

## 6. Data Syncing

### Test Case 6.1: Product Catalog Sync

**Steps:**
1. Trigger `sync-product-catalog` function
2. Or wait for automatic sync after OAuth
3. Check products table

**Expected Results:**
- ✅ All products imported
- ✅ Variants handled correctly
- ✅ Images synced
- ✅ Prices and inventory accurate
- ✅ Handles large catalogs (pagination)

---

### Test Case 6.2: Order Import

**Steps:**
1. Create test orders in Shopify
2. Trigger `import-shopify-orders` function
3. Verify orders in database

**Expected Results:**
- ✅ Recent orders imported
- ✅ Order line items correct
- ✅ Customer data captured
- ✅ Order totals match Shopify
- ✅ Handles multiple order statuses

---

## 7. Security Testing

### Test Case 7.1: HMAC Verification

**Steps:**
1. Send webhook with invalid HMAC
2. Send webhook with modified payload
3. Check webhook handler response

**Expected Results:**
- ✅ Invalid HMAC rejected (401/403)
- ✅ Modified payload rejected
- ✅ Valid HMAC accepted
- ✅ Proper error logging

---

### Test Case 7.2: Token Encryption

**Steps:**
1. Check `shopify_connections` table
2. Verify `encrypted_access_token` column
3. Attempt to decrypt manually

**Expected Results:**
- ✅ Tokens stored encrypted (not plaintext)
- ✅ Encryption uses AES-GCM
- ✅ IV included with ciphertext
- ✅ Decryption works in edge functions
- ✅ No tokens exposed in logs

---

### Test Case 7.3: Session Token Security

**Steps:**
1. Try accessing embedded pages without valid session token
2. Try using expired session token
3. Check token validation logic

**Expected Results:**
- ✅ Invalid tokens rejected
- ✅ Expired tokens trigger refresh
- ✅ Audience (client ID) verified
- ✅ Signature validated with client secret

---

## 8. Error Handling

### Test Case 8.1: Network Failures

**Steps:**
1. Simulate Shopify API downtime
2. Block outgoing requests
3. Test with slow network

**Expected Results:**
- ✅ Graceful error messages
- ✅ Retry logic works
- ✅ User not left in broken state
- ✅ Operations queued if possible

---

### Test Case 8.2: Invalid Data

**Steps:**
1. Send malformed webhook payload
2. Create order with missing fields
3. Update product with invalid data

**Expected Results:**
- ✅ Validation catches errors
- ✅ Appropriate error responses
- ✅ Database remains consistent
- ✅ Errors logged for debugging

---

## 9. Browser Compatibility

Test embedded app in:

### Desktop Browsers
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### Mobile Browsers
- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Shopify Mobile App

**Check for:**
- Layout issues
- JavaScript errors
- CSS problems
- Touch interactions
- Responsive design

---

## 10. Performance Testing

### Test Case 10.1: Load Time

**Steps:**
1. Clear cache
2. Open embedded app
3. Measure load time

**Expected Results:**
- ✅ Initial load < 3 seconds
- ✅ Subsequent pages < 1 second
- ✅ No unnecessary network requests
- ✅ Images optimized

---

### Test Case 10.2: Large Datasets

**Steps:**
1. Test with store having 1000+ products
2. Test with 100+ orders
3. Check analytics with large date ranges

**Expected Results:**
- ✅ Pagination works
- ✅ No timeout errors
- ✅ UI remains responsive
- ✅ Database queries optimized

---

## 11. Reinstallation

### Test Case 11.1: Uninstall & Reinstall

**Steps:**
1. Install app
2. Create some data (agents, conversations)
3. Uninstall app
4. Reinstall app
5. Check data persistence

**Expected Results:**
- ✅ Previous data available after reinstall
- ✅ Connection reactivated
- ✅ Webhooks re-registered
- ✅ No duplicate data created

---

## 12. Edge Cases

### Test Case 12.1: Multiple Concurrent Requests

**Steps:**
1. Open multiple browser tabs
2. Perform actions simultaneously
3. Check for race conditions

**Expected Results:**
- ✅ No duplicate records
- ✅ State remains consistent
- ✅ No data corruption

---

### Test Case 12.2: Very Long Shop Names

**Steps:**
1. Test with shop having very long name
2. Test with special characters in name

**Expected Results:**
- ✅ UI handles overflow
- ✅ Special characters escaped
- ✅ No layout breaks

---

## Testing Checklist Summary

Use this checklist before submission:

### Authentication & Authorization
- ✅ OAuth flow works correctly
- ✅ Session tokens verified
- ✅ Invalid tokens rejected
- ✅ Token encryption working

### Embedded App
- ✅ All pages load without errors
- ✅ App Bridge integrated correctly
- ✅ Navigation works smoothly
- ✅ No console errors

### Billing
- ✅ Subscription creation works (test mode)
- ✅ Cancellation works
- ✅ Webhook updates handled
- ✅ No actual charges in test mode

### Webhooks
- ✅ All required webhooks registered
- ✅ HMAC verification working
- ✅ GDPR webhooks handled
- ✅ Uninstall cleanup works

### Data Syncing
- ✅ Products sync correctly
- ✅ Orders import properly
- ✅ Inventory updates work

### Security
- ✅ Tokens encrypted at rest
- ✅ HMAC verified
- ✅ No secrets in logs
- ✅ Input validation in place

### Performance
- ✅ Load times acceptable
- ✅ Handles large datasets
- ✅ No memory leaks

### Compatibility
- ✅ Works in all major browsers
- ✅ Mobile responsive
- ✅ Shopify Mobile App compatible

---

## Debugging Tips

### Check Edge Function Logs

```bash
# In Supabase Dashboard
Project → Functions → [function-name] → Logs

# Or use CLI
supabase functions logs verify-shopify-session
```

### Check Database Records

```sql
-- Check OAuth states
SELECT * FROM shopify_oauth_states 
ORDER BY created_at DESC 
LIMIT 10;

-- Check active connections
SELECT * FROM shopify_connections 
WHERE status = 'active';

-- Check subscriptions
SELECT * FROM shopify_subscriptions 
ORDER BY created_at DESC 
LIMIT 10;
```

### Test Webhooks Manually

Use Shopify's webhook testing tool:
1. Go to Settings → Notifications → Webhooks in Shopify Admin
2. Click test button next to webhook
3. Check edge function logs for delivery

---

## Next Steps

After passing all tests:
1. ✅ Document any known issues or limitations
2. ✅ Create user documentation/help articles
3. ✅ Prepare support resources
4. ✅ Switch to staging environment for final review
5. ✅ Proceed with [Shopify Partners Configuration](./shopify-partners-configuration.md)
6. ✅ Submit app for review

---

## Support During Testing

If you encounter issues:
- Check edge function logs first
- Review browser console for client-side errors
- Verify environment variables are set correctly
- Test with a fresh development store
- Consult [Shopify App Development Docs](https://shopify.dev/docs/apps)
