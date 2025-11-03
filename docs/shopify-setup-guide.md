# Shopify Setup Guide

Connect your Shopify store to enable product recommendations and cart tracking features.

## Prerequisites

- Active Shopify store
- Shopify admin access
- ChatPop agent created

## Step 1: Get Shopify Credentials

### Create Admin API Token

1. Log into your Shopify admin panel
2. Go to **Settings → Apps and sales channels → Develop apps**
3. Click **Create an app** (or select existing app)
4. Name it "ChatPop Integration"
5. Go to **Configuration** tab
6. Under **Admin API access scopes**, enable:
   - `read_products` - To search and recommend products
   - `read_orders` - To track conversions and revenue
   - `read_customers` - To analyze customer lifetime value (CLV)
   - `read_inventory` - To show real-time stock levels
   - `read_price_rules` - To promote active discounts
7. Click **Save**
8. Go to **API credentials** tab
9. Click **Install app**
10. Copy the **Admin API access token** (you'll only see this once!)

### Find Your Store Domain

Your store domain is in the format: `your-store.myshopify.com`

You can find it in your Shopify admin URL or under **Settings → Domains**

## Step 2: Connect in ChatPop

1. Navigate to your agent
2. Go to **Settings → Integrations**
3. Find the **Shopify** section
4. Click **Connect Shopify Store**
5. Enter your credentials:
   - **Store Domain**: `your-store.myshopify.com`
   - **Admin API Token**: (paste the token from Step 1)
6. Click **Save**

## Step 3: Verify Connection

✅ **Success indicators:**
- Green checkmark appears next to Shopify integration
- You can now search products in the chat playground
- Cart tracking is automatically enabled

❌ **Common issues:**

**"Invalid credentials"**
- Double-check your store domain format (must include `.myshopify.com`)
- Verify the Admin API token was copied correctly
- Ensure the token hasn't expired

**"Missing permissions"**
- Make sure you enabled all 5 required scopes: `read_products`, `read_orders`, `read_customers`, `read_inventory`, `read_price_rules`
- Reinstall the app in Shopify if you changed scopes

**"Store not found"**
- Use your **permanent** Shopify domain (.myshopify.com), not custom domain
- Check for typos in the store name

## What's Next?

Once connected, your agent can:
- **Product Search** - Search and recommend products from your catalog with real-time stock levels
- **Cart Tracking** - Track abandoned carts automatically (when widget is embedded)
- **Smart Recovery** - Send personalized cart recovery messages
- **Revenue Analytics** - Track conversions, revenue, and order metrics
- **Customer Insights** - Analyze customer lifetime value (CLV) and segment VIP customers
- **Inventory Sync** - Display live stock levels and low-stock alerts
- **Promotions** - Automatically mention active discounts and sales to customers

### Deploy Your Widget

To enable cart tracking, you need to embed the chat widget on your Shopify store:

1. Go to **Deploy → Embed Widget**
2. Copy the widget code
3. In Shopify: **Online Store → Themes → Edit code**
4. Paste before `</body>` in `theme.liquid`
5. Save and publish

Cart tracking will now work automatically!

## Need Help?

- Check the [Cart Tracking Overview](./cart-tracking-overview.md)
- Contact support if issues persist
- Review Shopify's API documentation for advanced setup
