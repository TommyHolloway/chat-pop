# Shopify Partners Dashboard Configuration Guide

This guide walks you through setting up your ChatPop app in the Shopify Partners Dashboard for App Store submission.

## Prerequisites

Before configuring the Shopify Partners Dashboard, ensure you have:
- ✅ Shopify Partners account
- ✅ Production domain for your app (e.g., `chatpop.ai` or `yourdomain.com`)
- ✅ All environment variables configured (see [shopify-environment-setup.md](./shopify-environment-setup.md))
- ✅ App code deployed to production
- ✅ SSL certificate installed on your domain

---

## Step 1: Create App in Partners Dashboard

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com)
2. Click **Apps** → **Create app**
3. Select **Custom app** (or **Public app** if you plan to list in App Store)
4. Fill in basic information:
   - **App name**: `ChatPop - AI Shopping Assistant`
   - **App handle**: (auto-generated, e.g., `chatpop-ai-assistant`)
   - **Contact email**: Your support email

---

## Step 2: App Setup Configuration

### App URL Settings

Navigate to **App setup** section:

1. **App URL**: `https://yourdomain.com/shopify-admin`
   - This is the entry point when merchants open your app from Shopify Admin
   - Must be HTTPS
   - Must load the embedded app interface

2. **Allowed redirection URLs**: Add all these URLs (one per line):
   ```
   https://yourdomain.com/shopify-admin
   https://yourdomain.com/shopify-admin/dashboard
   https://yourdomain.com/shopify-admin/settings
   https://yourdomain.com/shopify-admin/billing
   https://yourdomain.com/shopify-admin/analytics
   https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/shopify-oauth-callback
   ```

### Embedded App Configuration

3. **Embedded app**: Toggle **ON**
   - Required for App Store listing
   - Allows your app to run inside Shopify Admin iframe

4. **App Bridge version**: Select **Latest** (v4.x)

---

## Step 3: API Access Configuration

Navigate to **Configuration** → **API scopes**:

### Required API Scopes

Select the following scopes (minimum required):

- ✅ `read_products` - Read product catalog for AI recommendations
- ✅ `read_orders` - Access order data for analytics and cart recovery
- ✅ `read_customers` - Read customer information for personalization
- ✅ `read_inventory` - Check stock levels for availability
- ✅ `read_discounts` - Access active promotions for AI suggestions

### Optional Scopes (if needed for advanced features)
- `write_orders` - Create draft orders (if implementing AI-assisted checkout)
- `write_customers` - Update customer data (if implementing loyalty features)
- `read_analytics` - Advanced store analytics

**Important**: Only request scopes you actually use. Unnecessary scopes will be questioned during app review.

---

## Step 4: Webhooks Configuration

Navigate to **Configuration** → **Webhooks**:

All webhook endpoints use your Supabase function URL:
`https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/[function-name]`

### Required Webhooks

| Webhook Topic | Endpoint URL | Purpose |
|--------------|-------------|---------|
| `app/uninstalled` | `/functions/v1/shopify-webhook-uninstall` | Clean up data when merchant uninstalls |
| `customers/data_request` | `/functions/v1/shopify-webhook-gdpr` | GDPR data request compliance |
| `customers/redact` | `/functions/v1/shopify-webhook-gdpr` | GDPR data deletion compliance |
| `shop/redact` | `/functions/v1/shopify-webhook-gdpr` | GDPR shop data deletion |
| `app_subscriptions/update` | `/functions/v1/shopify-subscription-webhook` | Billing subscription updates |

### Recommended Webhooks (for real-time features)

| Webhook Topic | Endpoint URL | Purpose |
|--------------|-------------|---------|
| `orders/create` | `/functions/v1/shopify-webhook` | Track new orders |
| `orders/updated` | `/functions/v1/shopify-webhook` | Update order status |
| `products/update` | `/functions/v1/shopify-webhook` | Sync product changes |
| `inventory_levels/update` | `/functions/v1/shopify-webhook` | Update stock availability |

**Note**: Webhooks are also automatically registered during OAuth installation via the `registerWebhooks` function in `shopify-oauth-callback`.

---

## Step 5: App Credentials

After creating the app, you'll receive:

1. **API key** (Client ID)
2. **API secret key** (Client Secret)

**⚠️ CRITICAL**: Save these securely and add them to your environment variables:
- `SHOPIFY_CLIENT_ID` = API key
- `SHOPIFY_CLIENT_SECRET` = API secret key

See [shopify-environment-setup.md](./shopify-environment-setup.md) for detailed environment setup.

---

## Step 6: Billing Configuration

Navigate to **App pricing** → **Create pricing plan**:

### Pricing Plan 1: Starter

- **Plan name**: Starter
- **Pricing model**: Recurring application charge
- **Price**: $47.00 USD/month
- **Trial days**: 7
- **Description**:
  ```
  Perfect for growing stores. Includes:
  • 2,000 AI interactions per month
  • 2 custom AI agents
  • Cart abandonment recovery
  • Basic analytics
  • Email support
  ```

### Pricing Plan 2: Growth

- **Plan name**: Growth
- **Pricing model**: Recurring application charge
- **Price**: $197.00 USD/month
- **Trial days**: 7
- **Description**:
  ```
  For established stores. Includes:
  • 10,000 AI interactions per month
  • 5 custom AI agents
  • Advanced cart recovery
  • Real-time analytics
  • Visitor behavior tracking
  • Priority support
  ```

### Billing Settings

- **Test mode**: Enable initially for testing
- **Capped amount**: Optional - set if using usage-based billing
- **Return URL**: `https://yourdomain.com/shopify-admin/billing`

**⚠️ Important**: Keep test mode enabled until you're ready to charge real merchants. Switch to live billing only after app approval.

---

## Step 7: GDPR & Compliance

Navigate to **App setup** → **Protected customer data**:

### Data Protection URLs

1. **Privacy policy URL**: `https://yourdomain.com/privacy-policy`
2. **Terms of service URL**: `https://yourdomain.com/terms-of-service`

### Data Handling Declaration

Declare what customer data you access and why:

- ✅ **Customer personal information**: For personalized AI recommendations
- ✅ **Order information**: For cart recovery and analytics
- ✅ **Product information**: For AI product suggestions
- ✅ **Store analytics**: For performance insights

### Data Retention Policy

Document your data retention:
```
ChatPop retains customer data for the duration of the app installation plus 30 days. 
Data is automatically deleted upon:
1. Merchant app uninstallation
2. GDPR deletion request
3. 30 days post-uninstallation

All data is encrypted at rest and in transit using AES-256 encryption.
```

---

## Step 8: App Listing (for Public Apps)

If submitting to Shopify App Store:

### Required Materials

1. **App icon**: 1200x1200px PNG
   - Must include app name/logo
   - No generic icons
   - Professional design

2. **Screenshots**: At least 3 screenshots (1920x1080px)
   - Show key features
   - Include captions
   - Professional quality

3. **Demo video**: 30-60 seconds
   - Show installation process
   - Demonstrate key features
   - Professional voice-over or captions

4. **App description**:
   ```
   ChatPop transforms your Shopify store with AI-powered shopping assistants that boost conversions and reduce cart abandonment.

   KEY FEATURES:
   • Intelligent product recommendations
   • 24/7 AI shopping assistant
   • Automated cart recovery
   • Real-time visitor behavior tracking
   • Custom agent training on your catalog
   • Seamless Shopify integration

   BENEFITS:
   • Increase conversion rates by up to 35%
   • Recover up to 20% of abandoned carts
   • Reduce customer support costs
   • Provide instant product guidance
   • Build customer loyalty with personalized experiences

   Perfect for stores of all sizes looking to leverage AI for better customer engagement and higher sales.
   ```

5. **Feature bullets** (3-5 key features):
   - AI-powered product recommendations
   - Intelligent cart abandonment recovery
   - Real-time customer behavior insights
   - Custom AI agent training
   - Seamless Shopify integration

---

## Step 9: Testing Checklist

Before submitting your app:

### Development Store Testing

1. Create a development store in Partners Dashboard
2. Install your app on the development store
3. Test all features thoroughly:
   - ✅ OAuth installation flow
   - ✅ Session token authentication
   - ✅ All embedded pages load correctly
   - ✅ Billing subscription flow (test mode)
   - ✅ Product catalog syncing
   - ✅ Order tracking
   - ✅ Webhook handling
   - ✅ App uninstallation
   - ✅ Reinstallation after uninstall

### Browser Compatibility

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### Mobile Testing

Test embedded app on:
- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Shopify Mobile app

---

## Step 10: Submission

Once all testing is complete:

1. Return to Partners Dashboard → **Apps** → Your app
2. Click **Create app listing** (for public apps)
3. Fill in all required information
4. Upload all media assets
5. Review all configurations
6. Click **Submit for review**

### Review Timeline

- Initial review: 7-14 business days
- Updates after feedback: 3-5 business days
- Average approval time: 2-3 weeks

### Common Rejection Reasons

- Insufficient app description
- Low-quality screenshots
- Missing privacy policy
- Unclear value proposition
- Bugs or broken features
- Unnecessary API scope requests
- Poor user experience

---

## Post-Approval Checklist

After approval:

1. ✅ Switch billing from test mode to live
2. ✅ Monitor error logs daily for first week
3. ✅ Set up monitoring alerts
4. ✅ Prepare customer support system
5. ✅ Create help documentation for merchants
6. ✅ Set up analytics tracking
7. ✅ Plan marketing strategy

---

## Support & Resources

- [Shopify Partners Help Center](https://help.shopify.com/en/partners)
- [App Review Guidelines](https://shopify.dev/apps/store/review)
- [App Design Guidelines](https://shopify.dev/apps/design-guidelines)
- [Embedded App SDK Docs](https://shopify.dev/docs/api/app-bridge)

---

## Need Help?

If you encounter issues during setup:
1. Check edge function logs in Supabase
2. Review browser console for errors
3. Test webhooks using Shopify's webhook tester
4. Contact Shopify Partner Support for approval questions
