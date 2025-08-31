import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agent');
    
    if (!agentId) {
      return new Response('Agent ID is required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Enhanced chat widget with proactive engagement
    const widgetHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chat Widget</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #f5f7fa;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .chat-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
        }
        
        .header-info h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 2px;
        }
        
        .header-info .status {
            font-size: 12px;
            opacity: 0.9;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            background: #4ade80;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .message {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            max-width: 85%;
        }
        
        .message.user {
            flex-direction: row-reverse;
            margin-left: auto;
        }
        
        .message-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            flex-shrink: 0;
        }
        
        .message.bot .message-avatar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .message.user .message-avatar {
            background: #e2e8f0;
            color: #475569;
        }
        
        .message-content {
            background: white;
            padding: 12px 16px;
            border-radius: 18px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            line-height: 1.5;
            word-wrap: break-word;
        }
        
        .message.user .message-content {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .typing-indicator {
            display: flex;
            gap: 4px;
            padding: 12px 16px;
        }
        
        .typing-dot {
            width: 8px;
            height: 8px;
            background: #94a3b8;
            border-radius: 50%;
            animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes typing {
            0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
        }
        
        .input-container {
            padding: 20px;
            background: white;
            border-top: 1px solid #e2e8f0;
            display: flex;
            gap: 12px;
            align-items: end;
        }
        
        .input-field {
            flex: 1;
            border: 2px solid #e2e8f0;
            border-radius: 20px;
            padding: 12px 16px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
            resize: none;
            min-height: 44px;
            max-height: 120px;
            font-family: inherit;
        }
        
        .input-field:focus {
            border-color: #667eea;
        }
        
        .send-button {
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s, box-shadow 0.2s;
            font-size: 18px;
        }
        
        .send-button:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        /* Proactive Suggestion Popup */
        .proactive-suggestion {
            position: fixed;
            bottom: 20px;
            right: 20px;
            max-width: 320px;
            background: white;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
            border: 1px solid #e2e8f0;
            z-index: 10000;
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .proactive-suggestion.visible {
            transform: translateY(0);
            opacity: 1;
        }
        
        .suggestion-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }
        
        .suggestion-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
        }
        
        .suggestion-info h4 {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 2px;
        }
        
        .suggestion-info .badge {
            font-size: 11px;
            background: #f1f5f9;
            color: #64748b;
            padding: 2px 8px;
            border-radius: 12px;
        }
        
        .suggestion-message {
            color: #475569;
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 16px;
        }
        
        .suggestion-actions {
            display: flex;
            gap: 8px;
        }
        
        .suggestion-button {
            flex: 1;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }
        
        .suggestion-button.primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .suggestion-button.primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .suggestion-button.secondary {
            background: #f8fafc;
            color: #64748b;
            border: 1px solid #e2e8f0;
        }
        
        .suggestion-button.secondary:hover {
            background: #f1f5f9;
        }
        
        .close-button {
            position: absolute;
            top: 12px;
            right: 12px;
            width: 24px;
            height: 24px;
            border: none;
            background: none;
            color: #94a3b8;
            cursor: pointer;
            font-size: 16px;
        }
        
        .close-button:hover {
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="chat-header">
        <div class="avatar">AI</div>
        <div class="header-info">
            <h3 id="agent-name">AI Assistant</h3>
            <div class="status">
                <div class="status-dot"></div>
                <span>Online</span>
            </div>
        </div>
    </div>
    
    <div id="messages" class="messages-container">
        <!-- Messages will be added here -->
    </div>
    
    <div class="input-container">
        <textarea id="messageInput" class="input-field" placeholder="Type your message..." rows="1"></textarea>
        <button id="sendButton" class="send-button">→</button>
    </div>

    <!-- Proactive Suggestion Template -->
    <div id="proactiveSuggestion" class="proactive-suggestion" style="display: none;">
        <button class="close-button" onclick="closeSuggestion()">×</button>
        <div class="suggestion-header">
            <div class="suggestion-avatar">AI</div>
            <div class="suggestion-info">
                <h4 id="suggestion-agent-name">AI Assistant</h4>
                <span class="badge">Smart Suggestion</span>
            </div>
        </div>
        <div id="suggestionMessage" class="suggestion-message"></div>
        <div class="suggestion-actions">
            <button class="suggestion-button primary" onclick="acceptSuggestion()">Start Chat</button>
            <button class="suggestion-button secondary" onclick="closeSuggestion()">Maybe Later</button>
        </div>
    </div>

    <script>
        const AGENT_ID = '${agentId}';
        const SUPABASE_URL = 'https://etwjtxqjcwyxdamlcorf.supabase.co';
        
        // Session tracking
        let sessionId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        let isLoading = false;
        let agent = null;
        let conversationId = null;
        let hasShownSuggestion = false;
        
        // DOM elements
        const messagesContainer = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const suggestionPopup = document.getElementById('proactiveSuggestion');
        
        // Initialize
        async function init() {
            // Store start time for time-based triggers
            window.startTime = Date.now();
            
            await loadAgent();
            addMessage('bot', agent?.initial_message || 'Hello! How can I help you today?');
            
            // Set up input handlers
            messageInput.addEventListener('keydown', handleKeyDown);
            sendButton.addEventListener('click', sendMessage);
            
            // Auto-resize textarea
            messageInput.addEventListener('input', autoResize);
            
            // Track page view
            trackBehavior('page_view', window.location.href);
            
            // Set up behavior tracking
            setupBehaviorTracking();
            
            // Check for proactive suggestions every 5 seconds
            setInterval(checkProactiveSuggestions, 5000);
            
            console.log('Chat widget initialized for agent:', AGENT_ID, 'on URL:', window.location.href);
        }
        
        async function loadAgent() {
            try {
                const response = await fetch(\`\${SUPABASE_URL}/rest/v1/agents?id=eq.\${AGENT_ID}&select=*\`, {
                    headers: {
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0d2p0eHFqY3d5eGRhbWxjb3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NDc2MzEsImV4cCI6MjA3MjAyMzYzMX0.zEq6nfkYLNm3D-wDJfmY6FVdL12CKbm8IqWKDka7vSI'
                    }
                });
                
                if (response.ok) {
                    const agents = await response.json();
                    agent = agents[0];
                    
                    if (agent) {
                        document.getElementById('agent-name').textContent = agent.name;
                        document.getElementById('suggestion-agent-name').textContent = agent.name;
                        
                        // Set theme colors if available
                        if (agent.message_bubble_color) {
                            document.documentElement.style.setProperty('--primary-color', agent.message_bubble_color);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading agent:', error);
            }
        }
        
        function addMessage(sender, content, actions = null) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${sender}\`;
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = sender === 'bot' ? 'AI' : 'U';
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.innerHTML = content.replace(/\\n/g, '<br>');
            
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(messageContent);
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        function showTypingIndicator() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message bot';
            typingDiv.id = 'typing-indicator';
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = 'AI';
            
            const typingContent = document.createElement('div');
            typingContent.className = 'message-content';
            
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            typingIndicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
            
            typingContent.appendChild(typingIndicator);
            typingDiv.appendChild(avatar);
            typingDiv.appendChild(typingContent);
            
            messagesContainer.appendChild(typingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        function removeTypingIndicator() {
            const typing = document.getElementById('typing-indicator');
            if (typing) typing.remove();
        }
        
        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message || isLoading) return;
            
            addMessage('user', message);
            messageInput.value = '';
            autoResize();
            
            isLoading = true;
            sendButton.disabled = true;
            showTypingIndicator();
            
            try {
                const response = await fetch(\`\${SUPABASE_URL}/functions/v1/public-chat\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message,
                        agentId: AGENT_ID,
                        sessionId,
                        conversationId
                    })
                });
                
                const data = await response.json();
                removeTypingIndicator();
                
                if (data.response) {
                    addMessage('bot', data.response, data.actions);
                    conversationId = data.conversationId;
                } else {
                    addMessage('bot', 'I apologize, but I encountered an error. Please try again.');
                }
            } catch (error) {
                console.error('Error sending message:', error);
                removeTypingIndicator();
                addMessage('bot', 'I apologize, but I encountered an error. Please try again.');
            } finally {
                isLoading = false;
                sendButton.disabled = false;
                messageInput.focus();
            }
        }
        
        function handleKeyDown(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        }
        
        function autoResize() {
            messageInput.style.height = 'auto';
            messageInput.style.height = messageInput.scrollHeight + 'px';
        }
        
        // Behavior tracking
        function setupBehaviorTracking() {
            // Track time on page
            let startTime = Date.now();
            
            // Track scroll depth
            let maxScrollDepth = 0;
            window.addEventListener('scroll', () => {
                const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
                if (scrollDepth > maxScrollDepth) {
                    maxScrollDepth = scrollDepth;
                    trackBehavior('scroll', window.location.href, null, scrollDepth);
                }
            });
            
            // Track when user leaves
            window.addEventListener('beforeunload', () => {
                const timeSpent = Math.round((Date.now() - startTime) / 1000);
                trackBehavior('time_spent', window.location.href, null, null, timeSpent);
            });
        }
        
        async function trackBehavior(eventType, pageUrl, elementSelector = null, scrollDepth = null, timeOnPage = null) {
            try {
                await fetch(\`\${SUPABASE_URL}/functions/v1/track-visitor-behavior\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionId,
                        agentId: AGENT_ID,
                        eventType,
                        pageUrl,
                        elementSelector,
                        scrollDepth,
                        timeOnPage,
                        sessionData: {
                            userAgent: navigator.userAgent,
                            referrer: document.referrer,
                            firstPageUrl: window.location.href,
                            totalPageViews: 1,
                            totalTimeSpent: 0
                        }
                    })
                });
            } catch (error) {
                console.error('Error tracking behavior:', error);
            }
        }
        
        async function checkProactiveSuggestions() {
            if (hasShownSuggestion) return;
            
            console.log('Checking proactive suggestions...', { 
                sessionId, 
                agentId: AGENT_ID, 
                currentUrl: window.location.href,
                timeOnPage: Date.now() - window.startTime || 0
            });
            
            try {
                const response = await fetch(\`\${SUPABASE_URL}/functions/v1/analyze-visitor-behavior\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionId,
                        agentId: AGENT_ID,
                        currentUrl: window.location.href,
                        currentPath: window.location.pathname,
                        timeOnPage: Date.now() - (window.startTime || Date.now())
                    })
                });
                
                const data = await response.json();
                console.log('Proactive suggestion analysis result:', data);
                
                if (data.success && data.analysis) {
                    // Lower confidence threshold for time-based custom triggers
                    const requiredConfidence = data.analysis.triggerType === 'time_based' ? 0.3 : 0.7;
                    console.log('Confidence check:', { 
                        actualConfidence: data.analysis.confidence, 
                        requiredConfidence,
                        triggerType: data.analysis.triggerType 
                    });
                    
                    if (data.analysis.confidence > requiredConfidence) {
                        console.log('Showing proactive suggestion:', data.analysis.suggestedMessage);
                        showProactiveSuggestion(data.analysis.suggestedMessage);
                    }
                }
            } catch (error) {
                console.error('Error checking proactive suggestions:', error);
            }
        }
        
        function showProactiveSuggestion(message) {
            hasShownSuggestion = true;
            document.getElementById('suggestionMessage').textContent = message;
            suggestionPopup.style.display = 'block';
            
            // Trigger animation
            setTimeout(() => {
                suggestionPopup.classList.add('visible');
            }, 100);
        }
        
        function closeSuggestion() {
            suggestionPopup.classList.remove('visible');
            setTimeout(() => {
                suggestionPopup.style.display = 'none';
            }, 300);
        }
        
        function acceptSuggestion() {
            closeSuggestion();
            messageInput.focus();
            // Optionally add a predefined message
            messageInput.value = "Hi! I saw your suggestion and I'm interested.";
            autoResize();
        }
        
        // Initialize the chat
        init();
    </script>
</body>
</html>
    `;

    return new Response(widgetHtml, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });

  } catch (error) {
    console.error('Error in chat-widget-enhanced function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});