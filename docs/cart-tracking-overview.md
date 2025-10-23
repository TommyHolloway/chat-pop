# Cart Tracking Overview

Learn how automatic cart tracking works to help you recover abandoned carts and increase conversions.

## How It Works (Automatic)

Once you embed the ChatPop widget on your Shopify store, cart tracking happens automatically:

1. **Auto-Detection**: Widget detects your Shopify store
2. **Event Monitoring**: Hooks into Shopify's cart events (add to cart, checkout, purchase)
3. **Data Collection**: Tracks cart data in real-time
4. **Abandonment Detection**: Identifies when customers leave without purchasing

**No code required from you** - just embed the widget and it works!

## What Gets Tracked

### Cart Data
- **Product details**: Name, price, image, product ID
- **Quantities**: Number of each item in cart
- **Cart total**: Subtotal before taxes/shipping
- **Currency**: Store's currency (USD, EUR, etc.)

### Session Information
- **Session ID**: Anonymous identifier (no personal data)
- **Timestamps**: When cart was created, updated, abandoned
- **Event types**: `cart_add`, `cart_update`, `checkout_start`, `purchase_complete`

### Privacy & Compliance
- ✅ No personal data collected without consent
- ✅ Session-based tracking (anonymous by default)
- ✅ GDPR/CCPA compliant
- ✅ No cookies or tracking without user knowledge

## Viewing Abandoned Carts

### In Your Dashboard

1. Navigate to **Analytics → Abandoned Carts**
2. See all carts that weren't completed
3. View cart details:
   - Items in cart
   - Total value
   - Time since abandonment
   - Recovery status

### Filter & Search

- **Filter by status**: Not recovered, recovery attempted, recovered
- **Search**: Find specific sessions by ID
- **Sort**: By date, value, or status

## Sending Recovery Messages

### Manual Recovery

1. Go to **Analytics → Abandoned Carts**
2. Click on any abandoned cart
3. Click **Send Recovery Message**
4. A proactive message appears in the chat widget when customer returns
5. Message includes cart details and encourages completion

### How It Appears

When the customer returns to your site:
- Chat widget shows a notification
- Message reminds them about their cart
- Includes product images and total
- One-click to view cart

### Customize Recovery Messages

1. Go to **Settings → Proactive Engagement**
2. Enable **Cart Abandonment Recovery**
3. Customize the recovery message template
4. Set timing (e.g., show after 24 hours)

## Tracking Metrics

### Key Metrics (Available in Analytics)

- **Total Abandoned Carts**: Number of carts not completed
- **Recovery Rate**: % of abandoned carts recovered
- **Recovery Revenue**: Total revenue from recovered carts
- **Average Cart Value**: Average value of abandoned carts

### E-commerce Analytics

View detailed e-commerce performance:
- **Total Revenue**: All revenue attributed to your agent
- **Orders Generated**: Number of completed purchases
- **Carts Recovered**: Successfully recovered abandonment
- **Average Order Value**: Mean purchase amount

## Technical Details

### Event Types

| Event | When It Fires | Data Captured |
|-------|---------------|---------------|
| `cart_add` | Customer adds item to cart | Product details, new cart total |
| `cart_update` | Cart quantity changes | Updated items and total |
| `checkout_start` | Customer goes to checkout | Full cart contents |
| `purchase_complete` | Order confirmed | Order ID, final total |

### Cart Abandonment Criteria

A cart is considered "abandoned" when:
- Customer added items to cart
- Did NOT complete checkout
- 30+ minutes of inactivity
- Session ended without purchase

## Best Practices

### For Merchants

✅ **Enable proactive engagement** - Auto-send recovery messages  
✅ **Personalize messages** - Reference specific products in cart  
✅ **Time it right** - Wait 2-24 hours before recovery attempt  
✅ **Offer incentives** - Consider small discounts for hesitant customers  
✅ **Test recovery flow** - Add items to cart yourself and test  

### For Customers

The recovery experience should:
- Be helpful, not pushy
- Remind them of specific items
- Make it easy to return to cart
- Respect privacy (no spam)

## Troubleshooting

**"No carts are being tracked"**
- Verify widget is embedded correctly
- Check browser console for errors
- Ensure Shopify is detected (widget shows Shopify features)
- Test by adding items to cart yourself

**"Recovery messages not showing"**
- Enable proactive engagement in Settings
- Check message timing settings
- Verify session ID matches returning customer
- Ensure widget is loaded on page

**"Analytics show zero revenue"**
- Connect Shopify store (Settings → Integrations)
- Ensure `read_orders` permission is granted
- Conversions tracked only after widget installation
- Revenue attribution takes up to 24 hours

## Data Retention

- Cart data retained for **90 days**
- Recovered carts archived after completion
- Analytics aggregated monthly
- Session data anonymized after 30 days

## Need Help?

- Review [Shopify Setup Guide](./shopify-setup-guide.md)
- Check widget installation in Deploy section
- Test cart tracking with real cart actions
- Contact support for technical issues
