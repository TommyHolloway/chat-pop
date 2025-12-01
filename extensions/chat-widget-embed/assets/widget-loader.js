(function() {
  'use strict';

  // Get configuration from Shopify theme settings
  const config = window.ChatPopConfig || {};
  
  if (!config.agentId || !config.enabled) {
    console.log('ChatPop: Widget disabled or agent ID missing');
    return;
  }

  // Retry configuration
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds
  let retryCount = 0;

  // Widget loader function with retry logic
  function loadChatPopWidget() {
    // Check if widget is already loaded
    if (document.getElementById('chatpop-widget-script')) {
      console.log('ChatPop: Widget already loaded');
      return;
    }

    // Validate agent ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(config.agentId)) {
      console.error('ChatPop: Invalid agent ID format');
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.id = 'chatpop-widget-script';
    script.type = 'module';
    script.crossOrigin = 'anonymous';
    
    // Use the Supabase edge function endpoint directly
    const supabaseUrl = 'https://etwjtxqjcwyxdamlcorf.supabase.co';
    script.src = `${supabaseUrl}/functions/v1/chat-widget?agentId=${encodeURIComponent(config.agentId)}`;

    // Error handling with retry
    script.onerror = function() {
      console.error('ChatPop: Failed to load widget script (attempt ' + (retryCount + 1) + ')');
      
      // Remove failed script
      script.remove();
      
      // Retry if not exceeded max retries
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log('ChatPop: Retrying in ' + (RETRY_DELAY / 1000) + ' seconds...');
        setTimeout(loadChatPopWidget, RETRY_DELAY);
      } else {
        console.error('ChatPop: Maximum retries exceeded. Widget failed to load.');
        // Report error to merchant (optional)
        if (window.Shopify && window.Shopify.designMode) {
          console.warn('ChatPop: Check your app configuration in the Shopify admin.');
        }
      }
    };

    // Success handling
    script.onload = function() {
      console.log('ChatPop: Widget loaded successfully for agent:', config.agentId);
      retryCount = 0; // Reset retry count on success
    };

    // Append to document
    document.head.appendChild(script);
  }

  // Load widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadChatPopWidget);
  } else {
    // DOM already loaded, check if we're in an iframe (for theme editor)
    if (window.self !== window.top && window.Shopify && window.Shopify.designMode) {
      console.log('ChatPop: Running in theme editor, loading widget...');
    }
    loadChatPopWidget();
  }

})();
