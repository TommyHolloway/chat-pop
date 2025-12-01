import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { reportWebVitals } from './utils/performance'

createRoot(document.getElementById("root")!).render(<App />)

// Initialize performance monitoring with error handling
try {
  reportWebVitals((metric) => {
    console.log(`Performance metric: ${metric.name} = ${metric.value.toFixed(2)} (${metric.rating})`);
  });
} catch (error) {
  console.warn('Performance monitoring failed:', error);
}
