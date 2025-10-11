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
  if (window.ChatPopWidget) return;

  const agentId = '${agentId}';
  const position = '${position}';
  const theme = '${theme}';
  const primaryColor = '${color}';
  const chatUrl = 'https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/public-chat?agentId=' + agentId;

  // Widget state
  let isOpen = false;
  let widget = null;
  let overlay = null;
  let backdrop = null;
  let conversationId = null;
  let isLoading = false;
  let messageCount = 0;
  let leadCaptured = false;
  let leadConfig = null;
  let agentData = null;
  const supabaseUrl = 'https://etwjtxqjcwyxdamlcorf.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0d2p0eHFqY3d5eGRhbWxjb3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzI3MTcsImV4cCI6MjA2ODk0ODcxN30.Dji_q0KFNL8hetK_Og8k9MI4l8sZJ5iCQQxQc4j1isM';

  // Visitor tracking
  const sessionId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  let startTime = Date.now();
  let currentPageStartTime = Date.now();
  let totalPageViews = 0;
  let hasTrackedCurrentPage = false;
  let shownSuggestions = [];
  let proactivePopup = null;
  let checkTriggerInterval = null;

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

  // Check for proactive triggers
  function checkProactiveTriggers() {
    // Don't check if chat is already open or if we've shown too many
    if (isOpen || shownSuggestions.length >= 3) return;

    const payload = {
      sessionId: sessionId,
      agentId: agentId,
      currentUrl: window.location.href,
      currentPath: window.location.pathname,
      currentHash: window.location.hash,
      timeOnPage: Math.floor((Date.now() - currentPageStartTime) / 1000)
    };

    fetch('https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/analyze-visitor-behavior', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Trigger check response:', data); // Debug logging

      if (data.success && data.analysis && data.analysis.triggered) {
        // Construct suggestion object from API response
        const suggestion = {
          id: data.analysis.triggerName || data.analysis.triggerType || 'unknown',
          message: data.analysis.suggestedMessage,
          type: data.analysis.triggerType,
          reason: data.analysis.reason,
          displayDuration: data.messageDisplayDuration || 15000
        };
        
        // Enforce frequency limit (max 3 suggestions) and prevent duplicates
        if (shownSuggestions.length < 3 && !shownSuggestions.includes(suggestion.id)) {
          showProactivePopup(suggestion);
          shownSuggestions.push(suggestion.id);
          
          console.log('✅ Showing proactive popup:', suggestion);
        } else {
          console.log('⏭️ Skipping popup - already shown or limit reached');
        }
      }
    })
    .catch(error => console.error('Proactive trigger check error:', error));
  }

  // Show proactive popup
  function showProactivePopup(suggestion) {
    // Remove existing popup if any
    if (proactivePopup) {
      proactivePopup.remove();
    }

    proactivePopup = document.createElement('div');
    proactivePopup.style.cssText = \`
      position: fixed !important;
      \${position.includes('right') ? 'right: 90px !important;' : 'left: 90px !important;'}
      \${position.includes('bottom') ? 'bottom: 20px !important;' : 'top: 20px !important;'}
      max-width: 280px !important;
      background: white !important;
      border: 1px solid rgba(132, 204, 22, 0.2) !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(132, 204, 22, 0.1) !important;
      z-index: 999998 !important;
      padding: 16px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      cursor: pointer !important;
      animation: slideInPopup 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      transition: all 0.2s ease !important;
    \`;

    const popupStyles = document.createElement('style');
    popupStyles.textContent = \`
      @keyframes slideInPopup {
        0% {
          opacity: 0;
          transform: translateX(\${position.includes('right') ? '20px' : '-20px'}) scale(0.95);
        }
        100% {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }
    \`;
    document.head.appendChild(popupStyles);

    proactivePopup.innerHTML = \`
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
        <div style="flex: 1;">
          <div style="font-size: 14px; color: #374151; line-height: 1.5; margin-bottom: 8px;">
            \${(suggestion.message || '').replace(/^["']|["']$/g, '').trim()}
          </div>
          <div style="font-size: 12px; color: #84cc16; font-weight: 500;">
            Click to chat →
          </div>
        </div>
        <button onclick="event.stopPropagation(); this.parentElement.parentElement.remove();" style="
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>
    \`;

    proactivePopup.addEventListener('click', () => {
      proactivePopup.remove();
      proactivePopup = null;
      if (!isOpen) toggleChat();
      
      // Mark suggestion as clicked
      fetch('https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/analyze-visitor-behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          agentId: agentId,
          suggestionId: suggestion.id,
          action: 'clicked'
        })
      }).catch(err => console.error('Failed to track suggestion click:', err));
    });

    proactivePopup.addEventListener('mouseenter', () => {
      proactivePopup.style.transform = 'scale(1.02)';
      proactivePopup.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(132, 204, 22, 0.15)';
    });

    proactivePopup.addEventListener('mouseleave', () => {
      proactivePopup.style.transform = 'scale(1)';
      proactivePopup.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(132, 204, 22, 0.1)';
    });

    document.body.appendChild(proactivePopup);

    // Mark suggestion as shown
    fetch('https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/analyze-visitor-behavior', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        agentId: agentId,
        suggestionId: suggestion.id,
        action: 'shown'
      })
    }).catch(err => console.error('Failed to track suggestion shown:', err));

    // Auto-dismiss popup after configured duration
    const displayDuration = suggestion.displayDuration || 15000;
    console.log(`Popup will auto-dismiss in ${displayDuration}ms`);

    setTimeout(() => {
      if (proactivePopup && proactivePopup.parentElement) {
        console.log('Auto-dismissing proactive popup');
        proactivePopup.remove();
        proactivePopup = null;
      }
    }, displayDuration);
  }

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

    // Start proactive trigger checking (every 5 seconds)
    checkTriggerInterval = setInterval(checkProactiveTriggers, 5000);
    
    // Check immediately after 2 seconds
    setTimeout(checkProactiveTriggers, 2000);
  }

  // Helper functions for chat UI
  function adjustColorBrightness(hex, percent) {
    const num = parseInt(hex.replace('#',''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R*0x10000 + G*0x100 + B).toString(16).slice(1);
  }

  function getAvatarUrl(data, isUser) {
    if (isUser) {
      const color = (data?.message_bubble_color || '#3B82F6').replace('#', '');
      return 'https://ui-avatars.com/api/?name=You&background=' + color + '&color=fff';
    }
    if (data?.profile_image_url) return data.profile_image_url;
    const name = data?.name || 'AI';
    const color = (data?.message_bubble_color || '#3B82F6').replace('#', '');
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=' + color + '&color=fff';
  }

  async function fetchAgentData() {
    try {
      const configRes = await fetch(supabaseUrl + '/functions/v1/get-widget-config?agentId=' + agentId, {
        headers: { 'apikey': supabaseKey }
      });
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.agent?.lead_capture_config) {
          leadConfig = configData.agent.lead_capture_config;
        }
      }
      
      const response = await fetch(supabaseUrl + '/rest/v1/rpc/get_public_agent_data?agent_uuid=' + agentId, {
        headers: { 'apikey': supabaseKey, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          agentData = data[0];
          checkProactiveLeadCapture();
          return agentData;
        }
      }
    } catch (error) {
      console.error('Error fetching agent:', error);
    }
    return null;
  }

  function addMessage(content, isUser) {
    const messages = document.getElementById('messages');
    if (!messages) return;
    
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom:16px;display:flex;gap:12px;align-items:flex-start;' + (isUser ? 'flex-direction:row-reverse;' : '');
    
    const avatar = document.createElement('img');
    avatar.src = getAvatarUrl(agentData, isUser);
    avatar.style.cssText = 'width:32px;height:32px;border-radius:50%;';
    
    const messageDiv = document.createElement('div');
    messageDiv.textContent = content;
    messageDiv.style.cssText = 'padding:12px 16px;border-radius:16px;max-width:70%;word-wrap:break-word;background:' + 
      (isUser ? (overlay?.dataset?.primaryColor || '#3B82F6') : '#f3f4f6') + 
      ';color:' + (isUser ? 'white' : '#1f2937') + ';';
    
    div.appendChild(avatar);
    div.appendChild(messageDiv);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    
    if (isUser) {
      messageCount++;
      checkProactiveLeadCapture();
    }
  }

  function checkProactiveLeadCapture() {
    if (!leadConfig || !leadConfig.enabled || leadCaptured) return;
    
    const triggerType = leadConfig.trigger_type || 'ai_detection';
    if (triggerType === 'immediate' && messageCount === 0) {
      renderLeadCaptureForm({
        prompt: leadConfig.prompt,
        fields: leadConfig.fields,
        button_text: leadConfig.button_text
      });
    } else if (triggerType === 'after_messages' && messageCount >= (leadConfig.trigger_after_messages || 2)) {
      renderLeadCaptureForm({
        prompt: leadConfig.prompt,
        fields: leadConfig.fields,
        button_text: leadConfig.button_text
      });
    }
  }

  function renderLeadCaptureForm(actionData) {
    if (leadCaptured) return;
    
    const formDiv = document.createElement('div');
    formDiv.style.cssText = 'background:#f8fafc;padding:16px;border-radius:12px;margin-top:8px;';
    
    let formHTML = '<div style="margin-bottom:12px;"><p style="margin:0 0 12px 0;font-weight:600;color:#1f2937;">' + 
      (actionData.prompt || 'Please share your information') + '</p>';
    
    actionData.fields.forEach(field => {
      formHTML += '<div style="margin-bottom:12px;"><label style="display:block;margin-bottom:4px;font-size:13px;color:#4b5563;">' + 
        field.label + (field.required ? ' *' : '') + '</label>';
      
      if (field.type === 'textarea') {
        formHTML += '<textarea id="lead-' + field.key + '" placeholder="' + field.placeholder + 
          '" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;color:#1f2937;" rows="3"></textarea>';
      } else if (field.type === 'select') {
        formHTML += '<select id="lead-' + field.key + 
          '" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;color:#1f2937;">';
        formHTML += '<option value="">' + field.placeholder + '</option>';
        if (field.options) {
          field.options.forEach(opt => {
            formHTML += '<option value="' + opt + '">' + opt + '</option>';
          });
        }
        formHTML += '</select>';
      } else {
        formHTML += '<input type="' + field.type + '" id="lead-' + field.key + '" placeholder="' + field.placeholder + 
          '" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;color:#1f2937;" />';
      }
      formHTML += '</div>';
    });
    
    formHTML += '<button id="submit-lead-btn" style="width:100%;padding:10px;background:' + 
      (overlay?.dataset?.primaryColor || '#3B82F6') + 
      ';color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">' + 
      (actionData.button_text || 'Submit') + '</button></div>';
    
    formDiv.innerHTML = formHTML;
    document.getElementById('messages').appendChild(formDiv);
    document.getElementById('submit-lead-btn').onclick = () => handleLeadSubmit(actionData.fields, actionData.success_message);
  }

  async function handleLeadSubmit(fields, successMessage) {
    const leadData = {};
    let hasError = false;
    
    fields.forEach(field => {
      const input = document.getElementById('lead-' + field.key);
      const value = input?.value.trim();
      
      if (field.required && !value) {
        hasError = true;
        input.style.borderColor = '#ef4444';
        return;
      }
      
      if (value) leadData[field.key] = value;
    });
    
    if (hasError) {
      addMessage('Please fill in all required fields.', false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(supabaseUrl + '/functions/v1/capture-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          agentId: agentId,
          conversationId: conversationId,
          leadData: leadData
        })
      });
      
      if (!response.ok) throw new Error('Failed to submit');
      
      const data = await response.json();
      leadCaptured = true;
      addMessage(successMessage || leadConfig?.success_message || data.message || 'Thank you! We will be in touch soon.', false);
      
      document.getElementById('submit-lead-btn').disabled = true;
      document.getElementById('submit-lead-btn').textContent = 'Submitted!';
    } catch (error) {
      console.error('Lead submit error:', error);
      addMessage('Sorry, there was an error submitting your information.', false);
    } finally {
      setLoading(false);
    }
  }

  function setLoading(loading) {
    isLoading = loading;
    const input = document.getElementById('chat-input');
    const btn = document.getElementById('send-btn');
    
    if (input) input.disabled = loading;
    if (btn) {
      btn.disabled = loading;
      btn.style.opacity = loading ? '0.6' : '1';
    }
  }

  async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input?.value.trim();
    
    if (!message || isLoading) return;
    
    addMessage(message, true);
    input.value = '';
    setLoading(true);
    
    try {
      const response = await fetch(supabaseUrl + '/functions/v1/chat-completion', {
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
      
      if (data.message) {
        addMessage(data.message, false);
      }
      
      if (data.actions && data.actions.length > 0) {
        data.actions.forEach(action => {
          if (action.type === 'lead_capture') {
            renderLeadCaptureForm(action.data);
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
      addMessage('Sorry, I encountered an error. Please try again.', false);
    } finally {
      setLoading(false);
    }
  }

  // Helper to convert HEX to RGBA
  function hexToRGBA(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return \`rgba(\${r}, \${g}, \${b}, \${alpha})\`;
  }

  // Create widget button
  function createWidget(primaryColor) {
    const darkerColor = adjustColorBrightness(primaryColor, -20);
    widget = document.createElement('div');
    widget.style.cssText = \`
      position: fixed !important;
      \${position.includes('right') ? 'right: 20px !important;' : 'left: 20px !important;'}
      \${position.includes('bottom') ? 'bottom: 20px !important;' : 'top: 20px !important;'}
      width: 60px !important;
      height: 60px !important;
      background: linear-gradient(135deg, \${primaryColor} 0%, \${darkerColor} 100%) !important;
      border: none !important;
      border-radius: 50% !important;
      box-shadow: 0 8px 32px \${hexToRGBA(primaryColor, 0.4)}, 0 4px 16px rgba(0, 0, 0, 0.1) !important;
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
          box-shadow: 0 8px 32px \${hexToRGBA(primaryColor, 0.4)}, 0 4px 16px rgba(0, 0, 0, 0.1);
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 12px 40px \${hexToRGBA(primaryColor, 0.6)}, 0 6px 20px rgba(0, 0, 0, 0.15);
          transform: scale(1.02);
        }
      }
      
      @keyframes sparkle {
        0%, 100% { opacity: 0; transform: rotate(0deg) scale(0); }
        50% { opacity: 1; transform: rotate(180deg) scale(1); }
      }
      
      .chat-widget-button:hover {
        transform: scale(1.05) !important;
        box-shadow: 0 16px 48px \${hexToRGBA(primaryColor, 0.6)}, 0 8px 24px rgba(0, 0, 0, 0.2) !important;
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

  // Create backdrop
  function createBackdrop() {
    backdrop = document.createElement('div');
    backdrop.style.cssText = \`
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0, 0, 0, 0.3) !important;
      z-index: 999997 !important;
      display: none !important;
      backdrop-filter: blur(2px) !important;
      transition: opacity 0.3s ease !important;
    \`;
    
    backdrop.addEventListener('click', toggleChat);
    document.body.appendChild(backdrop);
  }

  // Create chat overlay with direct embedding
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
        0 8px 32px \${hexToRGBA(agentData?.message_bubble_color || '#84cc16', 0.1)},
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

    // Fetch agent data and build UI
    fetchAgentData().then(data => {
      if (!data) {
        console.error('Failed to fetch agent data');
        return;
      }
      
      agentData = data;
      const primaryColor = data?.message_bubble_color || '#84cc16';
      const gradientEnd = adjustColorBrightness(primaryColor, -20);
      
      overlay.dataset.primaryColor = primaryColor;
      
      // Build chat UI directly (no iframe)
      overlay.innerHTML = \`
        <div style="display:flex;flex-direction:column;height:100%;background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);">
          <div style="background:linear-gradient(135deg, \${primaryColor} 0%, \${gradientEnd} 100%);color:white;padding:20px;display:flex;align-items:center;gap:12px;">
            <img id="agent-avatar" style="width:48px;height:48px;border-radius:50%;border:3px solid white;" src="\${getAvatarUrl(agentData, false)}">
            <div>
              <h2 id="agent-name" style="margin:0;font-size:18px;">\${agentData?.name || 'AI Assistant'}</h2>
              <p style="margin:0;font-size:13px;opacity:0.9;">AI Assistant</p>
            </div>
          </div>
          <div id="messages" style="flex:1;overflow-y:auto;padding:20px;"></div>
          <div style="padding:16px;background:white;border-top:1px solid #e5e7eb;">
            <div style="display:flex;gap:8px;">
              <input 
                id="chat-input" 
                type="text" 
                placeholder="Type your message..." 
                style="flex:1;padding:12px;border:2px solid #e5e7eb;border-radius:12px;font-size:14px;outline:none;color:#1f2937 !important;background:#ffffff;-webkit-text-fill-color:#1f2937;"
              />
              <button 
                id="send-btn" 
                style="padding:12px 24px;background:\${primaryColor};color:white;border:none;border-radius:12px;cursor:pointer;font-weight:600;"
              >Send</button>
            </div>
          </div>
          <div style="text-align:center;padding:12px;font-size:11px;color:#9ca3af;">Powered by ChatPop</div>
        </div>
      \`;
      
      // Attach event listeners directly
      const sendBtn = document.getElementById('send-btn');
      const chatInput = document.getElementById('chat-input');
      
      if (sendBtn) {
        sendBtn.onclick = sendMessage;
        console.log('✅ Send button click listener attached');
      }
      
      if (chatInput) {
        chatInput.onkeypress = (e) => {
          if (e.key === 'Enter') sendMessage();
        };
        console.log('✅ Chat input enter listener attached');
      }
      
      // Show initial message
      if (agentData?.initial_message) {
        addMessage(agentData.initial_message, false);
      }
    }).catch(error => {
      console.error('Error initializing chat overlay:', error);
    });

    document.body.appendChild(overlay);
  }

  // Toggle chat
  function toggleChat() {
    isOpen = !isOpen;
    
    if (isOpen) {
      if (!overlay) {
        console.log('Creating overlay for first time');
        createOverlay();
      }
      backdrop.style.display = 'block';
      overlay.style.display = 'block';
      overlay.style.animation = 'slideInChat 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
      overlay.style.animation = 'slideOutChat 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      setTimeout(() => {
        backdrop.style.display = 'none';
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
  async function init() {
    // Fetch agent data first to get the color
    const data = await fetchAgentData();
    agentData = data;
    const primaryColor = data?.message_bubble_color || '#84cc16';
    
    createWidget(primaryColor);
    createBackdrop();
    // Don't create overlay until user clicks
    initTracking(); // Initialize visitor tracking
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose widget globally
  window.ChatPopWidget = {
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
      'console.error("Failed to load ChatPop widget");',
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});