# Performance Testing Guide

## Built for Shopify Badge Requirements

ChatPop must meet these performance thresholds for the "Built for Shopify" badge:

| Metric | Requirement | Current Target |
|--------|-------------|----------------|
| Largest Contentful Paint (LCP) | ≤ 2500ms | ✓ |
| Cumulative Layout Shift (CLS) | ≤ 0.1 | ✓ |
| First Input Delay (FID) | ≤ 100ms | ✓ |
| Lighthouse Impact | < 10% | ✓ |

## Running Performance Tests

### 1. Web Vitals Monitoring (Automatic)

Performance metrics are automatically logged to the console in development:

```
📊 LCP: 1850 ms (good)
📊 CLS: 0.05 (good)
📊 FID: 45 ms (good)
📊 TTFB: 320 ms (good)
```

### 2. Lighthouse CI (Local)

Run Lighthouse tests locally:

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Build the app
npm run build

# Serve the build
npm run preview

# Run Lighthouse (in another terminal)
lhci autorun
```

### 3. Bundle Analysis

After building, check bundle sizes:

```bash
npm run build
```

This generates `dist/stats.html` with interactive bundle visualization.

## Performance Optimizations Implemented

### Code Splitting
- React lazy loading for all route components
- Separate vendor chunks (react, ui, charts)
- Dynamic imports for heavy components

### Image Optimization
- `OptimizedImage` component with lazy loading
- Priority loading for above-the-fold images
- Preload critical fonts

### Caching
- Service Worker for offline support
- Browser caching of static assets
- Vendor chunk separation for better cache hits

### Bundle Size
- Tree shaking enabled
- ES2020 target for modern browsers
- Manual chunk splitting

## Service Worker

The Service Worker (`public/sw.js`) provides:

- **Precaching**: Essential assets cached on install
- **Network-first strategy**: Fresh content when online
- **Offline fallback**: Graceful degradation when offline
- **Widget fallback**: Offline stub for chat widget

## Monitoring in Production

Web Vitals are logged and can be sent to analytics:

```typescript
reportWebVitals((metric) => {
  // Send to analytics
  analytics.track('web_vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating
  });
});
```

## Troubleshooting

### LCP Too High
1. Check hero image size - compress if > 200KB
2. Verify font preloading in index.html
3. Defer non-critical JavaScript

### CLS Issues
1. Add explicit dimensions to images
2. Avoid inserting content above existing content
3. Use CSS aspect-ratio for media

### FID/TBT Issues
1. Break up long JavaScript tasks
2. Defer non-critical third-party scripts
3. Use web workers for heavy computation
