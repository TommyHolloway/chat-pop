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
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(132, 204, 22, 0.2);
      border-radius: 16px;
      padding: 20px;
      max-width: 320px;
      box-shadow: 
        0 16px 48px rgba(0, 0, 0, 0.1),
        0 4px 16px rgba(132, 204, 22, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
      z-index: 9998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.5;
      animation: slideInSuggestion 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    \`;

    suggestionBubble.innerHTML = \`
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #84cc16 0%, #65a30d 100%);
        border-radius: 16px 16px 0 0;
      "></div>
      <div style="
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        padding-top: 4px;
      ">
        <div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3);
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M9 12l2 2 4-4"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
        </div>
        <div style="
          font-weight: 600;
          color: #111827;
          font-size: 14px;
        ">AI Assistant</div>
      </div>
      <div style="
        margin-bottom: 20px; 
        color: #374151;
        font-weight: 500;
      ">
        \${analysis.suggestedMessage}
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button onclick="this.parentElement.parentElement.remove()" style="
          padding: 10px 16px; 
          background: rgba(107, 114, 128, 0.1); 
          border: 1px solid rgba(107, 114, 128, 0.2); 
          border-radius: 10px; 
          font-size: 13px; 
          cursor: pointer;
          color: #6b7280;
          font-weight: 500;
          transition: all 0.2s ease;
        " onmouseover="this.style.background='rgba(107, 114, 128, 0.15)'" onmouseout="this.style.background='rgba(107, 114, 128, 0.1)'">
          Maybe Later
        </button>
        <button onclick="acceptSuggestion()" style="
          padding: 10px 20px; 
          background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); 
          color: white; 
          border: none; 
          border-radius: 10px; 
          font-size: 13px; 
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3);
          transition: all 0.2s ease;
        " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(132, 204, 22, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(132, 204, 22, 0.3)'">
          Start Chat
        </button>
      </div>
    \`;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = \`
      @keyframes slideInSuggestion {
        0% { 
          opacity: 0; 
          transform: translateY(20px) scale(0.95); 
        }
        100% { 
          opacity: 1; 
          transform: translateY(0) scale(1); 
        }
      }
      
      @keyframes fadeOutSuggestion {
        0% { 
          opacity: 1; 
          transform: translateY(0) scale(1); 
        }
        100% { 
          opacity: 0; 
          transform: translateY(-10px) scale(0.98); 
        }
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
    
    // Store the proactive message for the chat
    if (suggestion && suggestion.suggestedMessage) {
      // Update the iframe src to include the proactive message
      if (iframe) {
        const chatUrlWithMessage = chatUrl + '&sessionId=' + encodeURIComponent(sessionId) + 
          '&proactiveMessage=' + encodeURIComponent(suggestion.suggestedMessage);
        
        // Reload the iframe with the proactive message
        fetch(chatUrlWithMessage)
          .then(response => response.text())
          .then(html => {
            iframe.srcdoc = html;
          })
          .catch(error => {
            console.error('Failed to reload chat with proactive message:', error);
            iframe.src = chatUrlWithMessage;
          });
      }
    }
    
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
      position: fixed !important;
      \${position.includes('right') ? 'right: 20px !important;' : 'left: 20px !important;'}
      \${position.includes('bottom') ? 'bottom: 20px !important;' : 'top: 20px !important;'}
      width: 60px !important;
      height: 60px !important;
      background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%) !important;
      border: none !important;
      border-radius: 50% !important;
      box-shadow: 0 8px 32px rgba(132, 204, 22, 0.4), 0 4px 16px rgba(0, 0, 0, 0.1) !important;
      cursor: pointer !important;
      z-index: 999999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      animation: pulseGlow 3s ease-in-out infinite !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    \`;

    // Add hover and animation styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = \`
      @keyframes pulseGlow {
        0%, 100% { 
          box-shadow: 0 8px 32px rgba(132, 204, 22, 0.4), 0 4px 16px rgba(0, 0, 0, 0.1);
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 12px 40px rgba(132, 204, 22, 0.6), 0 6px 20px rgba(0, 0, 0, 0.15);
          transform: scale(1.02);
        }
      }
      
      @keyframes sparkle {
        0%, 100% { opacity: 0; transform: rotate(0deg) scale(0); }
        50% { opacity: 1; transform: rotate(180deg) scale(1); }
      }
      
      .chat-widget-button:hover {
        transform: scale(1.05) !important;
        box-shadow: 0 16px 48px rgba(132, 204, 22, 0.6), 0 8px 24px rgba(0, 0, 0, 0.2) !important;
        animation: none !important;
      }
      
      .chat-widget-sparkle {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 12px;
        height: 12px;
        background: radial-gradient(circle, #fbbf24 0%, #f59e0b 100%);
        border-radius: 50%;
        animation: sparkle 2s ease-in-out infinite;
        animation-delay: 1s;
      }
    \`;
    document.head.appendChild(styleSheet);

    widget.className = 'chat-widget-button';

    // Enhanced chat icon with AI elements
    widget.innerHTML = \`
      <div class="chat-widget-sparkle"></div>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
        <circle cx="12" cy="11" r="1" fill="white" opacity="0.8"/>
        <circle cx="8" cy="11" r="1" fill="white" opacity="0.6"/>
        <circle cx="16" cy="11" r="1" fill="white" opacity="0.6"/>
      </svg>
    \`;

    widget.addEventListener('click', toggleChat);
    widget.addEventListener('mouseenter', () => {
      widget.style.animation = 'none';
    });
    widget.addEventListener('mouseleave', () => {
      widget.style.animation = 'pulseGlow 3s ease-in-out infinite';
    });
    
    document.body.appendChild(widget);
  }

  // Create chat overlay
  function createOverlay() {
    overlay = document.createElement('div');
    overlay.style.cssText = \`
      position: fixed !important;
      \${position.includes('right') ? 'right: 20px !important;' : 'left: 20px !important;'}
      \${position.includes('bottom') ? 'bottom: 90px !important;' : 'top: 90px !important;'}
      width: 360px !important;
      height: 500px !important;
      background: rgba(255, 255, 255, 0.98) !important;
      backdrop-filter: blur(20px) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      border-radius: 16px !important;
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.15),
        0 8px 32px rgba(132, 204, 22, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
      z-index: 999998 !important;
      display: none !important;
      overflow: hidden !important;
      animation: slideInChat 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
      transform-origin: \${position.includes('right') ? 'bottom right' : 'bottom left'} !important;
    \`;

    // Add overlay animation styles
    const overlayStyles = document.createElement('style');
    overlayStyles.textContent = \`
      @keyframes slideInChat {
        0% {
          opacity: 0;
          transform: scale(0.8) translateY(20px);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      @keyframes slideOutChat {
        0% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
        100% {
          opacity: 0;
          transform: scale(0.8) translateY(20px);
        }
      }
    \`;
    document.head.appendChild(overlayStyles);

    iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-same-origin';
    iframe.allow = 'fullscreen';
    iframe.style.cssText = \`
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 20px;
      background: transparent;
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
        <div style="
          padding: 32px; 
          text-align: center; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
        ">
          <div style="
            width: 60px; 
            height: 60px; 
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin-bottom: 20px;
            box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
          ">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h3 style="margin: 0 0 12px 0; color: #dc2626; font-size: 20px; font-weight: 600;">Chat Unavailable</h3>
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #6b7280; line-height: 1.5;">
            We're having trouble loading the chat. Please try again in a moment.
          </p>
          <button onclick="location.reload()" style="
            padding: 12px 24px; 
            background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); 
            color: white; 
            border: none; 
            border-radius: 12px; 
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 16px rgba(132, 204, 22, 0.3);
            transition: all 0.2s ease;
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(132, 204, 22, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(132, 204, 22, 0.3)'">
            Retry Connection
          </button>
        </div>
      \`;
    }
  }

  // Toggle chat
  function toggleChat() {
    isOpen = !isOpen;
    
    if (isOpen) {
      overlay.style.display = 'block';
      overlay.style.animation = 'slideInChat 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
      overlay.style.animation = 'slideOutChat 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300);
    }
    
    // Update button icon with enhanced styling
    widget.innerHTML = isOpen ? \`
      <div class="chat-widget-sparkle"></div>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); transform: rotate(90deg); transition: transform 0.3s ease;">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    \` : \`
      <div class="chat-widget-sparkle"></div>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); transition: transform 0.3s ease;">
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
        <circle cx="12" cy="11" r="1" fill="white" opacity="0.8"/>
        <circle cx="8" cy="11" r="1" fill="white" opacity="0.6"/>
        <circle cx="16" cy="11" r="1" fill="white" opacity="0.6"/>
      </svg>
    \`;
    
    // Update button gradient when open
    if (isOpen) {
      widget.style.background = 'linear-gradient(135deg, #65a30d 0%, #4d7c0f 100%)';
      widget.style.animation = 'none';
    } else {
      widget.style.background = 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)';
      widget.style.animation = 'pulseGlow 3s ease-in-out infinite';
    }
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