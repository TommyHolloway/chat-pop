# Shopify CLI Usage Guide

## Overview
The Shopify CLI has been added to this project to manage the ChatPop App Embed extension. This allows you to develop, test, and deploy the widget as a native Shopify app extension.

## Installation Complete ✅
The required Shopify CLI packages have been installed:
- `@shopify/cli` - Core Shopify CLI tools
- `@shopify/app` - Shopify app development framework

## Available Commands

### Development Mode
Start a local development server with live reloading:
```bash
npx shopify app dev
```

This will:
- Start a development server for your app
- Provide a tunnel URL for testing
- Watch for changes and hot-reload the extension
- Allow you to test the App Embed in your development store

### Deploy Extension
Deploy the App Embed extension to production:
```bash
npx shopify app deploy
```

This will:
- Build and upload the extension to Shopify
- Make the App Embed available to merchants
- Update the extension version

### Generate Extension
Create new extension types:
```bash
npx shopify app generate extension
```

## App Embed Extension Structure

The extension is located at:
```
extensions/chat-widget-embed/
├── shopify.extension.toml    # Extension configuration
├── blocks/
│   └── app-embed.liquid      # Main embed block
├── snippets/
│   └── chatpop-config.liquid # Widget configuration
├── assets/
│   └── widget-loader.js      # Widget loading script
└── locales/
    └── en.default.json       # Translations
```

## Configuration

The `shopify.app.toml` file contains:
- App metadata (name, client ID, URLs)
- OAuth scopes (read_products, write_products)
- Webhook configuration
- App proxy settings

## Automatic Setup After OAuth

When a merchant connects their Shopify store:
1. ✅ OAuth callback automatically stores `agent_id` in shop metafields
2. ✅ Widget configuration is set up with correct URLs
3. ✅ Merchant receives success message about App Embed availability
4. ✅ Merchant can enable widget in Theme Settings → App Embeds

## Testing the Extension

### In Development Store:
1. Run `npx shopify app dev`
2. Install the dev app on your development store
3. Go to Online Store → Themes → Customize
4. Check Theme Settings → App Embeds
5. Toggle "ChatPop Widget" ON

### In Production:
After running `npx shopify app deploy`, merchants who install your app will automatically see the App Embed option in their theme settings.

## Troubleshooting

### Extension Not Appearing
- Ensure you've run `npx shopify app deploy`
- Check that OAuth completed successfully
- Verify metafields are set: Admin → Settings → Custom Data → Metafields

### Widget Not Loading
- Check browser console for errors
- Verify `agent_id` metafield is correctly set
- Ensure widget URL is accessible
- Check Theme Settings → App Embeds is enabled

### Development Server Issues
- Ensure you're using the correct Shopify Partner account
- Check that your app credentials are in `.env` or environment variables
- Verify tunnel connectivity

## Benefits of App Embed

✅ **No manual code editing** - Merchants just toggle it on
✅ **Automatic updates** - Widget updates deploy instantly
✅ **Theme editor integration** - Customize appearance visually
✅ **Multi-theme support** - Works across all themes
✅ **Version control** - Roll back if needed
✅ **App Store compliant** - Meets Shopify requirements

## Next Steps

1. Test the extension in your development store
2. Deploy to production when ready
3. Submit app to Shopify App Store (optional)
4. Monitor merchant installations and feedback

## Resources

- [Shopify CLI Documentation](https://shopify.dev/docs/apps/tools/cli)
- [App Extensions Guide](https://shopify.dev/docs/apps/app-extensions)
- [Theme App Extensions](https://shopify.dev/docs/apps/online-store/theme-app-extensions)
- [App Embed Blocks](https://shopify.dev/docs/apps/online-store/theme-app-extensions/extensions-framework/app-embed)
