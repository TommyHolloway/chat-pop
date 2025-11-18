(function() {
  'use strict';

  // Get configuration from Shopify theme settings
  const config = window.ChatPopConfig || {};
  
  if (!config.agentId || !config.enabled) {
    console.log('ChatPop: Widget disabled or agent ID missing');
    return;
  }

  // Widget loader function
  function loadChatPopWidget() {
    // Check if widget is already loaded
    if (document.getElementById('chatpop-widget-script')) {
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.id = 'chatpop-widget-script';
    script.type = 'module';
    script.crossOrigin = 'anonymous';
    
    // Use the Supabase edge function endpoint directly
    const supabaseUrl = 'https://etwjtxqjcwyxdamlcorf.supabase.co';
    script.src = `${supabaseUrl}/functions/v1/chat-widget?agentId=${config.agentId}`;

    // Error handling
    script.onerror = function() {
      console.error('ChatPop: Failed to load widget script');
    };

    // Success handling
    script.onload = function() {
      console.log('ChatPop: Widget loaded successfully for agent:', config.agentId);
    };

    // Append to document
    document.head.appendChild(script);
  }

  // Load widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadChatPopWidget);
  } else {
    loadChatPopWidget();
  }

})();
