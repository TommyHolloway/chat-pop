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
    const color = url.searchParams.get('color') || '#84cc16';

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
      if (timeSpent > 10) {
        trackBehavior('time_spent', { timeOnPage: timeSpent });
      }
    }
  }

  function trackScroll() {
    const scrollDepth = Math.floor((window.pageYOffset / (document.body.scrollHeight - window.innerHeight)) * 100);
    if (scrollDepth > 25 && scrollDepth % 25 === 0) {
      trackBehavior('scroll', { scrollDepth: scrollDepth });
    }
  }

  async function analyzeAndSuggest() {
    try {
      const timeOnPage = Math.floor((Date.now() - currentPageStartTime) / 1000);
      
      const response = await fetch('https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/analyze-visitor-behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: sessionId, 
          agentId: agentId, 
          currentUrl: window.location.href,
          currentPath: window.location.pathname,
          timeOnPage: timeOnPage
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.analysis && data.analysis.confidence > 0.4 && !suggestionShown) {
          showProactiveSuggestion(data.analysis, data.messageDisplayDuration || 15000);
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
    }
  }

  function showProactiveSuggestion(analysis, displayDuration = 15000) {
    suggestionShown = true;
    suggestion = analysis;

    const suggestionBubble = document.createElement('div');
    
    suggestionBubble.style.cssText = \`
      position: fixed !important;
      \${position.includes('right') ? 'right: 100px !important;' : 'left: 100px !important;'}
      \${position.includes('bottom') ? 'bottom: 30px !important;' : 'top: 100px !important;'}
      background: rgba(255, 255, 255, 0.98) !important;
      backdrop-filter: blur(16px);
      border: 1px solid rgba(132, 204, 22, 0.2) !important;
      border-radius: 16px;
      padding: 20px;
      max-width: 300px;
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.15),
        0 8px 32px rgba(132, 204, 22, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
      z-index: 999999 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      animation: slideInSuggestion 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      color: #374151 !important;
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
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3);
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
          </svg>
        </div>
        <div style="
          font-weight: 600;
          color: #374151;
          font-size: 13px;
        ">AI Assistant</div>
      </div>
      <div style="
        margin-bottom: 18px; 
        color: #6b7280;
        font-weight: 400;
        line-height: 1.6;
      ">
        \${analysis.suggestedMessage}
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button onclick="this.parentElement.parentElement.remove()" style="
          padding: 8px 14px; 
          background: rgba(156, 163, 175, 0.1); 
          border: 1px solid rgba(156, 163, 175, 0.2); 
          border-radius: 8px; 
          font-size: 12px; 
          cursor: pointer;
          color: #6b7280;
          font-weight: 500;
          transition: all 0.2s ease;
        " onmouseover="this.style.background='rgba(156, 163, 175, 0.15)'" onmouseout="this.style.background='rgba(156, 163, 175, 0.1)'">
          Maybe Later
        </button>
        <button onclick="acceptSuggestion()" style="
          padding: 8px 16px; 
          background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); 
          color: white; 
          border: none; 
          border-radius: 8px; 
          font-size: 12px; 
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(132, 204, 22, 0.25);
          transition: all 0.2s ease;
        " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(132, 204, 22, 0.35)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(132, 204, 22, 0.25)'">
          Start Chat
        </button>
      </div>
    \`;

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
    \`;
    document.head.appendChild(style);

    document.body.appendChild(suggestionBubble);

    setTimeout(() => {
      if (suggestionBubble.parentNode) {
        suggestionBubble.remove();
      }
    }, displayDuration);
  }

  window.acceptSuggestion = function() {
    const bubbles = document.querySelectorAll('[style*="z-index: 9998"]');
    bubbles.forEach(bubble => bubble.remove());
    
    if (suggestion && suggestion.suggestedMessage) {
      if (iframe) {
        const chatUrlWithMessage = chatUrl + '&sessionId=' + encodeURIComponent(sessionId) + 
          '&proactiveMessage=' + encodeURIComponent(suggestion.suggestedMessage);
        
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
    
    if (!isOpen) toggleChat();
  };

  function initTracking() {
    trackPageView();

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        trackTimeOnPage();
      }
    });

    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(trackScroll, 200);
    });

    document.addEventListener('click', (e) => {
      const element = e.target;
      if (element.tagName === 'A' || element.tagName === 'BUTTON' || element.closest('a') || element.closest('button')) {
        let selector = element.tagName.toLowerCase();
        if (element.id) selector += '#' + element.id;
        if (element.className) selector += '.' + element.className.split(' ').join('.');
        
        trackBehavior('click', { elementSelector: selector });
      }
    });

    // Check for proactive suggestions every 5 seconds
    setInterval(() => analyzeAndSuggest(), 5000);
  }

  window.addEventListener('message', (event) => {
    if (event && event.data === 'ECCOCHAT_READY') {
      iframeReady = true;
      console.log('EccoChat iframe ready');
    }
  });

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

    console.log('Fetching chat HTML content...');
    const chatUrlWithSession = chatUrl + '&sessionId=' + encodeURIComponent(sessionId);
    fetch(chatUrlWithSession)
      .then(response => {
        console.log('Chat fetch response status:', response.status);
        return response.text();
      })
      .then(html => {
        console.log('Chat HTML fetched successfully, length:', html.length);
        iframe.srcdoc = html;
      })
      .catch(error => {
        console.error('Failed to fetch chat HTML:', error);
        iframe.src = chatUrlWithSession;
      });

    overlay.appendChild(iframe);
    document.body.appendChild(overlay);
  }

  function toggleChat() {
    if (!overlay) {
      createOverlay();
    }
    
    isOpen = !isOpen;
    
    if (isOpen) {
      overlay.style.display = 'block';
      overlay.style.animation = 'slideInChat 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      widget.style.background = 'linear-gradient(135deg, #65a30d 0%, #4d7c0f 100%)';
      
      trackBehavior('chat_opened');
      
      widget.innerHTML = \`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      \`;
    } else {
      overlay.style.animation = 'slideOutChat 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300);
      
      widget.style.background = 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)';
      
      widget.innerHTML = \`
        <div class="chat-widget-sparkle"></div>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
          <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
          <circle cx="12" cy="11" r="1" fill="white" opacity="0.8"/>
          <circle cx="8" cy="11" r="1" fill="white" opacity="0.6"/>
          <circle cx="16" cy="11" r="1" fill="white" opacity="0.6"/>
        </svg>
      \`;
    }
  }

  // Initialize everything
  function init() {
    console.log('🚀 Initializing Enhanced Chat Widget for agent:', agentId);
    console.log('🎯 Position:', position, 'Theme:', theme, 'Color:', primaryColor);
    createWidget();
    initTracking();
    
    // Add manual test function for debugging
    window.testProactiveMessage = function() {
      console.log('🧪 Manual test triggered');
      showProactiveSuggestion({
        confidence: 0.9,
        suggestedMessage: "Test message: Hi! Can I help you with anything?",
        triggerType: "manual_test",
        triggerName: "Manual Test",
        reason: "Manual test triggered"
      });
    };
    
    console.log('🛠️ Debug functions available:');
    console.log('- window.testProactiveMessage() - manually trigger proactive message');
    console.log('- Current suggestionShown state:', suggestionShown);
    
    // Mark widget as loaded
    window.EccoChatWidget = {
      agentId: agentId,
      toggleChat: toggleChat,
      isOpen: () => isOpen,
      testMessage: window.testProactiveMessage
    };
    
    console.log('✅ Widget initialization complete');
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
    `;

    return new Response(widgetScript, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error serving enhanced chat widget:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders
    });
  }
});