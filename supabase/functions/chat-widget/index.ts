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

  // Create widget button
  function createWidget() {
    widget = document.createElement('div');
    widget.style.cssText = \`
      position: fixed;
      \${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      \${position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      width: 60px;
      height: 60px;
      background: \${primaryColor};
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
    iframe.src = chatUrl;
    iframe.sandbox = 'allow-same-origin allow-scripts allow-forms';
    iframe.style.cssText = \`
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 12px;
    \`;

    // Add iframe load event debugging
    iframe.addEventListener('load', function() {
      console.log('EccoChat iframe loaded successfully');
    });

    iframe.addEventListener('error', function() {
      console.error('EccoChat iframe failed to load');
    });

    overlay.appendChild(iframe);
    document.body.appendChild(overlay);
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