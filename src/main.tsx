import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { reportWebVitals } from './utils/performance'

createRoot(document.getElementById("root")!).render(<App />)

// Register Service Worker for offline support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.warn('SW registration failed:', error);
      });
  });
}

// Initialize performance monitoring with error handling
try {
  reportWebVitals((metric) => {
    console.log(`Performance metric: ${metric.name} = ${metric.value.toFixed(2)} (${metric.rating})`);
  });
} catch (error) {
  console.warn('Performance monitoring failed:', error);
}
