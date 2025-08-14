import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const agentId = url.searchParams.get('agentId');

    if (!agentId) {
      return new Response('Agent ID is required', { status: 400, headers: corsHeaders });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch agent details
    const { data: agent, error } = await supabase
      .from('agents')
      .select('name')
      .eq('id', agentId)
      .eq('status', 'active')
      .single();

    if (error || !agent) {
      return new Response('Agent not found', { status: 404, headers: corsHeaders });
    }

    // Escape agent data to prevent XSS
    const safeName = agent.name?.replace(/'/g, "\\'").replace(/"/g, '\\"') || 'Agent';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${safeName} - Chat</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: white;
            border-bottom: 1px solid #e2e8f0;
            padding: 1rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .avatar {
            width: 40px;
            height: 40px;
            background: #3b82f6;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
        }
        
        .agent-info h1 {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e293b;
        }
        
        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            max-width: 100%;
            overflow: hidden;
        }
        
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .message {
            display: flex;
            gap: 0.75rem;
            max-width: 80%;
        }
        
        .message.user {
            align-self: flex-end;
            flex-direction: row-reverse;
        }
        
        .message-avatar {
            width: 32px;
            height: 32px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 600;
            flex-shrink: 0;
        }
        
        .message.user .message-avatar {
            background: #e2e8f0;
            color: #475569;
        }
        
        .message.assistant .message-avatar {
            background: #3b82f6;
            color: white;
        }
        
        .message-content {
            padding: 0.75rem;
            border-radius: 0.75rem;
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        
        .message.user .message-content {
            background: #3b82f6;
            color: white;
        }
        
        .message.assistant .message-content {
            background: white;
            color: #1e293b;
            border: 1px solid #e2e8f0;
        }
        
        .input-area {
            padding: 1rem;
            background: white;
            border-top: 1px solid #e2e8f0;
            display: flex;
            gap: 0.5rem;
        }
        
        .input-area input {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            outline: none;
            font-size: 0.875rem;
        }
        
        .input-area input:focus {
            border-color: #3b82f6;
        }
        
        .input-area button {
            padding: 0.75rem 1rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            transition: background 0.2s;
        }
        
        .input-area button:hover:not(:disabled) {
            background: #2563eb;
        }
        
        .input-area button:disabled {
            background: #94a3b8;
            cursor: not-allowed;
        }
        
        .loading {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 0.75rem;
        }
        
        .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid #e2e8f0;
            border-top: 2px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .empty-state {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: #64748b;
        }
        
        .empty-state svg {
            width: 48px;
            height: 48px;
            margin-bottom: 1rem;
            opacity: 0.5;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="avatar">${safeName.charAt(0).toUpperCase()}</div>
        <div class="agent-info">
            <h1>${safeName}</h1>
        </div>
    </div>
    
    <div class="chat-container">
        <div class="messages" id="messages">
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
                </svg>
                <p>Start a conversation with ${safeName}</p>
            </div>
        </div>
        
        <div class="input-area">
            <input type="text" id="messageInput" placeholder="Type your message..." />
            <button onclick="sendMessage()" id="sendButton">Send</button>
        </div>
    </div>

    <script>
        const agentId = '${agentId}';
        const messagesContainer = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        let conversationId = null;
        let isLoading = false;

        // Initialize conversation
        async function initConversation() {
            const sessionId = crypto.randomUUID();
            try {
                const response = await fetch('${supabaseUrl}/rest/v1/conversations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': '${supabaseKey}',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        agent_id: agentId,
                        session_id: sessionId
                    })
                });
                
                if (response.ok) {
                    const [conversation] = await response.json();
                    conversationId = conversation.id;
                }
            } catch (error) {
                console.error('Error initializing conversation:', error);
            }
        }

        // Send message
        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message || isLoading) return;

            // Add user message
            addMessage('user', message);
            messageInput.value = '';
            setLoading(true);

            try {
                const response = await fetch('${supabaseUrl}/functions/v1/chat-completion', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        agentId: agentId,
                        message: message,
                        conversationId: conversationId
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    addMessage('assistant', data.message);
                } else {
                    addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
                }
            } catch (error) {
                console.error('Error sending message:', error);
                addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        // Add message to UI
        function addMessage(role, content) {
            // Remove empty state if it exists
            const emptyState = messagesContainer.querySelector('.empty-state');
            if (emptyState) {
                emptyState.remove();
            }

            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${role}\`;
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = role === 'user' ? 'U' : '${safeName.charAt(0).toUpperCase()}';
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.textContent = content;
            
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(messageContent);
            messagesContainer.appendChild(messageDiv);
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Set loading state
        function setLoading(loading) {
            isLoading = loading;
            sendButton.disabled = loading;
            
            if (loading) {
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'message assistant';
                loadingDiv.id = 'loading-message';
                
                const avatar = document.createElement('div');
                avatar.className = 'message-avatar';
                avatar.textContent = '${safeName.charAt(0).toUpperCase()}';
                
                const loadingContent = document.createElement('div');
                loadingContent.className = 'loading';
                loadingContent.innerHTML = '<div class="spinner"></div>';
                
                loadingDiv.appendChild(avatar);
                loadingDiv.appendChild(loadingContent);
                messagesContainer.appendChild(loadingDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } else {
                const loadingMessage = document.getElementById('loading-message');
                if (loadingMessage) {
                    loadingMessage.remove();
                }
            }
        }

        // Handle enter key
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Initialize
        initConversation();
        try {
          if (window.parent) {
            window.parent.postMessage('ECCOCHAT_READY', '*');
          }
        } catch (_) {}
    </script>
</body>
</html>
    `;

    // Log response details for debugging
    console.log('Sending HTML response for agentId:', agentId);
    console.log('Response headers:', {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    });

    return new Response(html, { 
      status: 200,
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src *; frame-ancestors *",
        'X-Frame-Options': 'ALLOWALL',
        'Cache-Control': 'no-cache',
        ...corsHeaders
      } 
    });
  } catch (error) {
    console.error('Error in public-chat function:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: corsHeaders
    });
  }
});