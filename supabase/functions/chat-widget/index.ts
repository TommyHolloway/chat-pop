import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/javascript',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agentId');
    const position = url.searchParams.get('position') || 'bottom-right';
    const theme = url.searchParams.get('theme') || 'light';
    const color = url.searchParams.get('color') || '#000000';

    if (!agentId) {
      return new Response('Agent ID is required', { status: 400 });
    }

    const widgetScript = `
(function() {
  // Check if widget is already loaded
  if (window.EccoChatWidget) return;

  const agentId = '${agentId}';
  const position = '${position}';
  const theme = '${theme}';
  const primaryColor = '${color}';
  const chatUrl = 'https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/public-chat?agentId=' + agentId;

  // Widget state
  let isOpen = false;
  let widget = null;
  let overlay = null;
  let iframe = null;
  let iframeReady = false;

  // Visitor tracking
  const sessionId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  let startTime = Date.now();
  let currentPageStartTime = Date.now();
  let totalPageViews = 0;
  let hasTrackedCurrentPage = false;
  let suggestion = null;
  let suggestionShown = false;

  // Visitor tracking functions
  function trackBehavior(eventType, data = {}) {
    const payload = {
      sessionId: sessionId,
      agentId: agentId,
      eventType: eventType,
      pageUrl: window.location.href,
      eventData: data,
      sessionData: {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        firstPageUrl: window.location.href,
        totalPageViews: totalPageViews,
        totalTimeSpent: Math.floor((Date.now() - startTime) / 1000)
      }
    };

    fetch('https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/track-visitor-behavior', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(error => console.error('Tracking error:', error));
  }

  function trackPageView() {
    if (!hasTrackedCurrentPage) {
      totalPageViews++;
      trackBehavior('page_view');
      hasTrackedCurrentPage = true;
      currentPageStartTime = Date.now();
    }
  }

  function trackTimeOnPage() {
    if (hasTrackedCurrentPage) {
      const timeSpent = Math.floor((Date.now() - currentPageStartTime) / 1000);
      if (timeSpent > 10) { // Only track if spent more than 10 seconds
        trackBehavior('time_spent', { timeOnPage: timeSpent });
      }
    }
  }

  function trackScroll() {
    const scrollDepth = Math.floor((window.pageYOffset / (document.body.scrollHeight - window.innerHeight)) * 100);
    if (scrollDepth > 25 && scrollDepth % 25 === 0) { // Track at 25%, 50%, 75%, 100%
      trackBehavior('scroll', { scrollDepth: scrollDepth });
    }
  }

  async function analyzeAndSuggest() {
    try {
      const response = await fetch('https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/analyze-visitor-behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId, agentId: agentId })
      });

      if (response.ok) {
        const { analysis } = await response.json();
        if (analysis && analysis.confidence > 0.6 && !suggestionShown) {
          showProactiveSuggestion(analysis);
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
    }
  }

  function showProactiveSuggestion(analysis) {
    suggestionShown = true;
    suggestion = analysis;

    const suggestionBubble = document.createElement('div');
    suggestionBubble.style.cssText = \`
      position: fixed;
      \${position.includes('right') ? 'right: 100px;' : 'left: 100px;'}
      \${position.includes('bottom') ? 'bottom: 30px;' : 'top: 100px;'}
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      max-width: 280px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
      z-index: 9998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      animation: slideIn 0.3s ease-out;
    \`;

    suggestionBubble.innerHTML = \`
      <div style="margin-bottom: 12px; color: #374151;">
        \${analysis.suggestedMessage}
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button onclick="this.parentElement.parentElement.remove()" style="
          padding: 6px 12px; 
          background: #f3f4f6; 
          border: none; 
          border-radius: 6px; 
          font-size: 12px; 
          cursor: pointer;
          color: #6b7280;
        ">Dismiss</button>
        <button onclick="acceptSuggestion()" style="
          padding: 6px 12px; 
          background: #3b82f6; 
          color: white; 
          border: none; 
          border-radius: 6px; 
          font-size: 12px; 
          cursor: pointer;
        ">Chat Now</button>
      </div>
    \`;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = \`
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    \`;
    document.head.appendChild(style);

    document.body.appendChild(suggestionBubble);

    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (suggestionBubble.parentNode) {
        suggestionBubble.remove();
      }
    }, 15000);
  }

  window.acceptSuggestion = function() {
    // Remove suggestion bubble
    const bubbles = document.querySelectorAll('[style*="z-index: 9998"]');
    bubbles.forEach(bubble => bubble.remove());
    
    // Open chat
    if (!isOpen) toggleChat();
  };

  // Set up tracking listeners
  function initTracking() {
    // Track initial page view
    trackPageView();

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        trackTimeOnPage();
      }
    });

    // Track scroll events (throttled)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(trackScroll, 200);
    });

    // Track clicks on important elements
    document.addEventListener('click', (e) => {
      const element = e.target;
      if (element.tagName === 'A' || element.tagName === 'BUTTON' || element.closest('a') || element.closest('button')) {
        let selector = element.tagName.toLowerCase();
        if (element.id) selector += '#' + element.id;
        if (element.className) selector += '.' + element.className.split(' ').join('.');
        
        trackBehavior('click', { elementSelector: selector });
      }
    });

    // Analyze behavior periodically
    setTimeout(() => analyzeAndSuggest(), 15000); // After 15 seconds
    setTimeout(() => analyzeAndSuggest(), 45000); // After 45 seconds
    setTimeout(() => analyzeAndSuggest(), 90000); // After 1.5 minutes
  }

  // Listen for readiness from iframe
  window.addEventListener('message', (event) => {
    if (event && event.data === 'ECCOCHAT_READY') {
      iframeReady = true;
      console.log('EccoChat iframe ready');
    }
  });

  // Create widget button
  function createWidget() {
    widget = document.createElement('div');
    widget.style.cssText = \`
      position: fixed;
      \${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      \${position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      width: 60px;
      height: 60px;
      background: #000000;
      border: 2px solid white;
      border-radius: 30px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      cursor: pointer;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    \`;

    // Chat icon SVG
    widget.innerHTML = \`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
      </svg>
    \`;

    widget.addEventListener('click', toggleChat);
    document.body.appendChild(widget);
  }

  // Create chat overlay
  function createOverlay() {
    overlay = document.createElement('div');
    overlay.style.cssText = \`
      position: fixed;
      \${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      \${position.includes('bottom') ? 'bottom: 90px;' : 'top: 90px;'}
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      z-index: 9999;
      display: none;
      overflow: hidden;
    \`;

    iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-same-origin';
    iframe.allow = 'fullscreen';
    iframe.style.cssText = \`
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 12px;
      background: white;
    \`;

    // Fetch HTML content and use srcdoc to force proper rendering
    console.log('Fetching chat HTML content...');
    const chatUrlWithSession = chatUrl + '&sessionId=' + encodeURIComponent(sessionId);
    fetch(chatUrlWithSession)
      .then(response => {
        console.log('Chat fetch response status:', response.status);
        console.log('Chat fetch content-type:', response.headers.get('content-type'));
        return response.text();
      })
      .then(html => {
        console.log('Chat HTML fetched successfully, length:', html.length);
        iframe.srcdoc = html;
        console.log('Chat HTML injected via srcdoc');
      })
      .catch(error => {
        console.error('Failed to fetch chat HTML, falling back to src:', error);
        iframe.src = chatUrlWithSession;
      });

    iframe.addEventListener('load', function() {
      console.log('EccoChat iframe loaded successfully');
    });

    iframe.addEventListener('error', function() {
      console.error('EccoChat iframe failed to load');
      showErrorFallback();
    });

    overlay.appendChild(iframe);
    document.body.appendChild(overlay);
  }

  // Show error fallback
  function showErrorFallback() {
    if (overlay) {
      overlay.innerHTML = \`
        <div style="padding: 20px; text-align: center; color: #ef4444; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <h3 style="margin: 0 0 10px 0; color: #dc2626;">Chat Failed to Load</h3>
          <p style="margin: 0; font-size: 14px;">Please refresh the page or contact support.</p>
          <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
        </div>
      \`;
    }
  }

  // Toggle chat
  function toggleChat() {
    isOpen = !isOpen;
    overlay.style.display = isOpen ? 'block' : 'none';
    
    // Update button icon
    widget.innerHTML = isOpen ? \`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    \` : \`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
      </svg>
    \`;
  }

  // Initialize widget
  function init() {
    createWidget();
    createOverlay();
    initTracking(); // Initialize visitor tracking
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose widget globally
  window.EccoChatWidget = {
    open: () => {
      if (!isOpen) toggleChat();
    },
    close: () => {
      if (isOpen) toggleChat();
    },
    toggle: toggleChat
  };
})();
    `;

    return new Response(widgetScript, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in chat-widget function:', error);
    return new Response(
      'console.error("Failed to load EccoChat widget");',
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});