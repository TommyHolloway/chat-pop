const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agentId');
    const position = url.searchParams.get('position') || 'bottom-right';
    const theme = url.searchParams.get('theme') || 'light';
    const primaryColor = url.searchParams.get('color') || '#84cc16';

    const widgetScript = `
(function() {
  'use strict';
  
  if (window.ChatPopWidget) {
    console.log('ChatPop widget already loaded');
    return;
  }

  const agentId = '${agentId}';
  const position = '${position}';
  const theme = '${theme}';
  const primaryColor = '${primaryColor}';
  const chatUrl = 'https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/public-chat?agentId=' + agentId;
  const supabaseUrl = 'https://etwjtxqjcwyxdamlcorf.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0d2p0eHFqY3d5eGRhbWxjb3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzI3MTcsImV4cCI6MjA2ODk0ODcxN30.Dji_q0KFNL8hetK_Og8k9MI4l8sZJ5iCQQxQc4j1isM';

  let widget, overlay;
  let isOpen = false;
  let sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  let startTime = Date.now();
  let totalPageViews = 0;
  let hasTrackedCurrentPage = false;
  let currentPageStartTime = Date.now();
  let suggestionShown = false;
  let suggestion = null;
  let conversationId = null;
  let agentData = null;
  let isLoading = false;

  async function checkWidgetPageRestrictions() {
    try {
      const response = await fetch('https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/get-widget-config?agentId=' + agentId);
      
      if (response.ok) {
        const config = await response.json();
        if (config && config.allowedPages && config.allowedPages.length > 0) {
          const currentPath = window.location.pathname;
          const currentUrl = window.location.href;
          
          const isAllowed = config.allowedPages.some(pattern => {
            return currentUrl.includes(pattern) || currentPath.includes(pattern);
          });
          
          if (!isAllowed) {
            console.log('Widget not allowed on this page');
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking widget restrictions:', error);
      return true;
    }
  }

  function trackBehavior(eventType, additionalData = {}) {
    const payload = {
      agentId: agentId,
      sessionId: sessionId,
      eventType: eventType,
      eventData: {
        ...additionalData,
        url: window.location.href,
        path: window.location.pathname,
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

  let proactiveEnabled = false;
  let allowedPages = [];
  
  async function checkProactiveSettings() {
    try {
      const response = await fetch('https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/get-widget-config?agentId=' + agentId);
      
      if (response.ok) {
        const config = await response.json();
        if (config) {
          proactiveEnabled = config.proactiveEnabled;
          allowedPages = config.allowedPages || [];
        }
      }
    } catch (error) {
      console.error('Error fetching agent config:', error);
    }
  }

  async function analyzeAndSuggest() {
    if (!proactiveEnabled || isOpen) return;
    
    if (allowedPages.length > 0) {
      const currentPath = window.location.pathname;
      const currentUrl = window.location.href;
      
      const isAllowed = allowedPages.some(pattern => {
        return currentUrl.includes(pattern) || currentPath.includes(pattern);
      });
      
      if (!isAllowed) return;
    }
    
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
          currentHash: window.location.hash,
          timeOnPage: timeOnPage
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.analysis && data.analysis.triggered && !suggestionShown && !isOpen) {
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
    
    suggestionBubble.style.cssText = `
      position: fixed !important;
      ${position.includes('right') ? 'right: 100px !important;' : 'left: 100px !important;'}
      ${position.includes('bottom') ? 'bottom: 30px !important;' : 'top: 100px !important;'}
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
    `;

    suggestionBubble.innerHTML = `
      <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #84cc16 0%, #65a30d 100%); border-radius: 16px 16px 0 0;"></div>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-top: 4px;">
        <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(132, 204, 22, 0.3);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
          </svg>
        </div>
        <div style="font-weight: 600; color: #374151; font-size: 13px;">AI Assistant</div>
      </div>
      <div style="margin-bottom: 18px; color: #6b7280; font-weight: 400; line-height: 1.6;">
        ${analysis.suggestedMessage}
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button onclick="this.parentElement.parentElement.remove()" style="padding: 8px 14px; background: rgba(156, 163, 175, 0.1); border: 1px solid rgba(156, 163, 175, 0.2); border-radius: 8px; font-size: 12px; cursor: pointer; color: #6b7280; font-weight: 500; transition: all 0.2s ease;" onmouseover="this.style.background='rgba(156, 163, 175, 0.15)'" onmouseout="this.style.background='rgba(156, 163, 175, 0.1)'">
          Maybe Later
        </button>
        <button onclick="acceptSuggestion()" style="padding: 8px 16px; background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); color: white; border: none; border-radius: 8px; font-size: 12px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(132, 204, 22, 0.25); transition: all 0.2s ease;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(132, 204, 22, 0.35)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(132, 204, 22, 0.25)'">
          Start Chat
        </button>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInSuggestion {
        0% { opacity: 0; transform: translateY(20px) scale(0.95); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(suggestionBubble);

    setTimeout(() => {
      if (suggestionBubble.parentNode) {
        suggestionBubble.remove();
      }
    }, displayDuration);
  }

  window.acceptSuggestion = function() {
    const bubbles = document.querySelectorAll('[style*="z-index: 999999"]');
    bubbles.forEach(bubble => {
      if (bubble.innerHTML && bubble.innerHTML.includes('Start Chat')) {
        bubble.remove();
      }
    });
    
    if (suggestion && suggestion.suggestedMessage) {
      // Store proactive message to show when chat opens
      sessionStorage.setItem('chatpop_proactive_message', suggestion.suggestedMessage);
    }
    
    if (!isOpen) toggleChat();
  };

  async function initTracking() {
    await checkProactiveSettings();
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

    if (proactiveEnabled) {
      setInterval(() => analyzeAndSuggest(), 5000);
    }
  }

  function createWidget() {
    widget = document.createElement('div');
    widget.style.cssText = `
      position: fixed !important;
      ${position.includes('right') ? 'right: 20px !important;' : 'left: 20px !important;'}
      ${position.includes('bottom') ? 'bottom: 20px !important;' : 'top: 20px !important;'}
      width: 60px !important;
      height: 60px !important;
      background: linear-gradient(135deg, ${primaryColor} 0%, #65a30d 100%);
      border-radius: 50% !important;
      cursor: pointer !important;
      box-shadow: 0 8px 32px rgba(132, 204, 22, 0.4), 0 4px 16px rgba(0, 0, 0, 0.15);
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 2147483647 !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      animation: float 3s ease-in-out infinite;
      position: relative;
      overflow: visible;
    `;

    const sparkle = document.createElement('div');
    sparkle.className = 'chat-widget-sparkle';
    sparkle.style.cssText = `
      position: absolute;
      top: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      background: #fbbf24;
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(251, 191, 36, 0.8);
      animation: pulse 2s ease-in-out infinite;
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.7; }
      }
    `;
    document.head.appendChild(styleSheet);

    widget.appendChild(sparkle);
    
    widget.innerHTML += `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
        <circle cx="12" cy="11" r="1" fill="white" opacity="0.8"/>
        <circle cx="8" cy="11" r="1" fill="white" opacity="0.6"/>
        <circle cx="16" cy="11" r="1" fill="white" opacity="0.6"/>
      </svg>
    `;

    widget.addEventListener('click', toggleChat);
    widget.addEventListener('mouseenter', () => {
      widget.style.transform = 'scale(1.1) translateY(-4px)';
      widget.style.boxShadow = '0 12px 40px rgba(132, 204, 22, 0.5), 0 6px 20px rgba(0, 0, 0, 0.2)';
    });
    widget.addEventListener('mouseleave', () => {
      widget.style.transform = 'scale(1)';
      widget.style.boxShadow = '0 8px 32px rgba(132, 204, 22, 0.4), 0 4px 16px rgba(0, 0, 0, 0.15)';
    });

    document.body.appendChild(widget);
  }

  async function fetchAgentData() {
    try {
      const response = await fetch(\`\${supabaseUrl}/rest/v1/rpc/get_public_agent_data?agent_uuid=\${agentId}\`, {
        headers: {
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          agentData = data[0];
          return agentData;
        }
      }
    } catch (error) {
      console.error('Error fetching agent data:', error);
    }
    return null;
  }

  function addMessage(content, isUser = false) {
    const messagesContainer = document.getElementById('chatpop-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'chatpop-message ' + (isUser ? 'user' : 'bot');
    
    const avatarImg = document.createElement('img');
    avatarImg.className = 'chatpop-message-avatar';
    avatarImg.src = isUser ? 'https://ui-avatars.com/api/?name=You&background=84cc16&color=fff' : (agentData?.profile_image_url || 'https://ui-avatars.com/api/?name=AI&background=84cc16&color=fff');
    avatarImg.alt = isUser ? 'You' : 'Agent';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'chatpop-message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(avatarImg);
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function setLoading(loading) {
    isLoading = loading;
    const input = document.getElementById('chatpop-input');
    const sendBtn = document.getElementById('chatpop-send-btn');
    const messagesContainer = document.getElementById('chatpop-messages');
    
    if (input) input.disabled = loading;
    if (sendBtn) sendBtn.disabled = loading;
    
    if (loading) {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'chatpop-message bot';
      typingDiv.id = 'chatpop-typing';
      
      const avatarImg = document.createElement('img');
      avatarImg.className = 'chatpop-message-avatar';
      avatarImg.src = agentData?.profile_image_url || 'https://ui-avatars.com/api/?name=AI&background=84cc16&color=fff';
      
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'chatpop-typing-indicator';
      typingIndicator.innerHTML = `
        <div class="chatpop-typing-dot"></div>
        <div class="chatpop-typing-dot"></div>
        <div class="chatpop-typing-dot"></div>
      `;
      
      typingDiv.appendChild(avatarImg);
      typingDiv.appendChild(typingIndicator);
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else {
      const typingIndicator = document.getElementById('chatpop-typing');
      if (typingIndicator) typingIndicator.remove();
    }
  }

  async function sendMessage() {
    const input = document.getElementById('chatpop-input');
    const message = input?.value.trim();
    
    if (!message || isLoading) return;
    
    addMessage(message, true);
    input.value = '';
    setLoading(true);
    
    try {
      const response = await fetch(\`\${supabaseUrl}/functions/v1/chat-completion\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          agentId: agentId,
          message: message,
          conversationId: conversationId,
          sessionId: sessionId
        })
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      
      if (!conversationId && data.conversationId) {
        conversationId = data.conversationId;
      }
      
      if (data.reply) {
        addMessage(data.reply, false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('Sorry, I encountered an error. Please try again.', false);
    } finally {
      setLoading(false);
    }
  }

  function createOverlay() {
    const chatStyles = document.createElement('style');
    chatStyles.textContent = `
      .chatpop-overlay * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      @keyframes slideInChat {
        0% { opacity: 0; transform: scale(0.8) translateY(20px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
      
      @keyframes slideOutChat {
        0% { opacity: 1; transform: scale(1) translateY(0); }
        100% { opacity: 0; transform: scale(0.8) translateY(20px); }
      }
      
      @keyframes pulseAvatar {
        0%, 100% { box-shadow: 0 0 0 0 rgba(132, 204, 22, 0.4); }
        50% { box-shadow: 0 0 0 8px rgba(132, 204, 22, 0); }
      }
      
      @keyframes messageSlideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes typingBounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-4px); }
      }
      
      .chatpop-chat-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      }
      
      .chatpop-chat-header {
        background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
        color: white;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 4px 20px rgba(132, 204, 22, 0.2);
      }
      
      .chatpop-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: pulseAvatar 2s infinite;
      }
      
      .chatpop-agent-info h2 {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 4px 0;
      }
      
      .chatpop-agent-info p {
        font-size: 13px;
        opacity: 0.9;
        margin: 0;
      }
      
      .chatpop-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .chatpop-message {
        display: flex;
        gap: 12px;
        animation: messageSlideIn 0.3s ease-out;
      }
      
      .chatpop-message.user {
        flex-direction: row-reverse;
      }
      
      .chatpop-message-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      
      .chatpop-message-content {
        max-width: 70%;
        padding: 12px 16px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.5;
      }
      
      .chatpop-message.bot .chatpop-message-content {
        background: white;
        color: #374151;
        border-bottom-left-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
      
      .chatpop-message.user .chatpop-message-content {
        background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
        color: white;
        border-bottom-right-radius: 4px;
        box-shadow: 0 2px 8px rgba(132, 204, 22, 0.3);
      }
      
      .chatpop-typing-indicator {
        display: flex;
        gap: 4px;
        padding: 12px 16px;
        background: white;
        border-radius: 16px;
        border-bottom-left-radius: 4px;
        width: fit-content;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
      
      .chatpop-typing-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #84cc16;
        animation: typingBounce 1.4s infinite;
      }
      
      .chatpop-typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .chatpop-typing-dot:nth-child(3) { animation-delay: 0.4s; }
      
      .chatpop-chat-input-area {
        padding: 20px;
        background: white;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 12px;
      }
      
      .chatpop-chat-input {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-size: 14px;
        font-family: inherit;
        transition: all 0.2s;
      }
      
      .chatpop-chat-input:focus {
        outline: none;
        border-color: #84cc16;
        box-shadow: 0 0 0 3px rgba(132, 204, 22, 0.1);
      }
      
      .chatpop-chat-input:disabled {
        background: #f3f4f6;
        cursor: not-allowed;
      }
      
      .chatpop-send-btn {
        padding: 12px 24px;
        background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(132, 204, 22, 0.25);
      }
      
      .chatpop-send-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(132, 204, 22, 0.35);
      }
      
      .chatpop-send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .chatpop-powered-by {
        text-align: center;
        padding: 12px;
        font-size: 11px;
        color: #9ca3af;
        background: white;
      }
    `;
    document.head.appendChild(chatStyles);

    overlay = document.createElement('div');
    overlay.className = 'chatpop-overlay';
    overlay.style.cssText = `
      position: fixed !important;
      ${position.includes('right') ? 'right: 0 !important;' : 'left: 0 !important;'}
      ${position.includes('bottom') ? 'bottom: 0 !important;' : 'top: 0 !important;'}
      width: 400px !important;
      height: 600px !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      background: white;
      box-shadow: -4px 0 40px rgba(0, 0, 0, 0.15);
      z-index: 2147483646 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: none;
      ${position.includes('left') ? 'border-radius: 0 16px 16px 0;' : 'border-radius: 16px 0 0 16px;'}
      overflow: hidden;
      transform-origin: ${position.includes('right') ? 'bottom right' : 'bottom left'};
    `;

    overlay.innerHTML = `
      <div class="chatpop-chat-container">
        <div class="chatpop-chat-header">
          <img class="chatpop-avatar" id="chatpop-agent-avatar" src="https://ui-avatars.com/api/?name=AI&background=84cc16&color=fff" alt="Agent" />
          <div class="chatpop-agent-info">
            <h2 id="chatpop-agent-name">Loading...</h2>
            <p>AI Assistant</p>
          </div>
        </div>
        <div class="chatpop-chat-messages" id="chatpop-messages"></div>
        <div class="chatpop-chat-input-area">
          <input 
            type="text" 
            class="chatpop-chat-input" 
            id="chatpop-input" 
            placeholder="Type your message..."
          />
          <button class="chatpop-send-btn" id="chatpop-send-btn">Send</button>
        </div>
        <div class="chatpop-powered-by">
          Powered by ChatPop
        </div>
      </div>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    closeBtn.style.cssText = `
      position: absolute !important;
      top: 20px !important;
      right: 20px !important;
      width: 36px !important;
      height: 36px !important;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      transition: all 0.2s;
      backdrop-filter: blur(8px);
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    closeBtn.onclick = toggleChat;
    overlay.appendChild(closeBtn);
    
    document.body.appendChild(overlay);

    const sendBtn = document.getElementById('chatpop-send-btn');
    const input = document.getElementById('chatpop-input');
    
    if (sendBtn) sendBtn.onclick = sendMessage;
    if (input) {
      input.onkeypress = (e) => {
        if (e.key === 'Enter') sendMessage();
      };
    }
  }

  async function toggleChat() {
    if (!overlay) {
      createOverlay();
    }

    if (isOpen) {
      overlay.style.animation = 'slideOutChat 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300);
      widget.style.transform = 'scale(1)';
      widget.innerHTML = `
        <div class="chat-widget-sparkle"></div>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
          <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
          <circle cx="12" cy="11" r="1" fill="white" opacity="0.8"/>
          <circle cx="8" cy="11" r="1" fill="white" opacity="0.6"/>
          <circle cx="16" cy="11" r="1" fill="white" opacity="0.6"/>
        </svg>
      `;
    } else {
      overlay.style.display = 'block';
      overlay.style.animation = 'slideInChat 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      
      const data = await fetchAgentData();
      if (data) {
        const nameEl = document.getElementById('chatpop-agent-name');
        const avatarEl = document.getElementById('chatpop-agent-avatar');
        if (nameEl) nameEl.textContent = data.name;
        if (avatarEl && data.profile_image_url) avatarEl.src = data.profile_image_url;
        
        const proactiveMsg = sessionStorage.getItem('chatpop_proactive_message');
        if (proactiveMsg) {
          addMessage(proactiveMsg, false);
          sessionStorage.removeItem('chatpop_proactive_message');
        } else if (data.initial_message) {
          addMessage(data.initial_message, false);
        }
      }
      
      widget.style.transform = 'scale(0.9)';
      widget.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      
      setTimeout(() => {
        const input = document.getElementById('chatpop-input');
        if (input) input.focus();
      }, 400);
    }
    
    isOpen = !isOpen;
  }

  async function init() {
    console.log('🚀 Initializing Enhanced Chat Widget for agent:', agentId);
    
    const canLoadWidget = await checkWidgetPageRestrictions();
    if (!canLoadWidget) return;
    
    createWidget();
    await initTracking();
    
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
    
    window.ChatPopWidget = {
      agentId: agentId,
      toggleChat: toggleChat,
      isOpen: () => isOpen,
      testMessage: window.testProactiveMessage
    };
    
    console.log('✅ Widget initialization complete');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
    `;

    return new Response(widgetScript, {
      headers: { ...corsHeaders, 'Content-Type': 'application/javascript' }
    });

  } catch (error) {
    console.error('Error serving enhanced chat widget:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders
    });
  }
});
