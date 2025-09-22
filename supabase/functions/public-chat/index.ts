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
    const sessionId = url.searchParams.get('sessionId'); // Get visitor session ID
    const proactiveMessage = url.searchParams.get('proactiveMessage'); // Get proactive message

    if (!agentId) {
      return new Response('Agent ID is required', { status: 400, headers: corsHeaders });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch agent details using secure function
    const { data: agentData, error } = await supabase.rpc('get_public_agent_data', { agent_uuid: agentId });

    if (error || !agentData || agentData.length === 0) {
      return new Response('Agent not found', { status: 404, headers: corsHeaders });
    }
    
    const agent = agentData[0];

    // Escape agent data to prevent XSS
    const safeName = agent.name?.replace(/'/g, "\\'").replace(/"/g, '\\"') || 'Agent';
    const safeInitialMessage = agent.initial_message?.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r') || '';
    const safeProfileImageUrl = agent.profile_image_url?.replace(/"/g, '\\"') || '';
    const hasProfileImage = !!agent.profile_image_url;
    const avatarFallback = safeName.charAt(0).toUpperCase();

    // Safely prepare URL parameters for JavaScript injection
    const safeSessionId = sessionId || null;
    const safeProactiveMessage = proactiveMessage || null;
    
    // Create properly escaped JavaScript variable values
    const sessionIdValue = safeSessionId ? JSON.stringify(safeSessionId) : 'null';
    const proactiveMessageValue = safeProactiveMessage ? JSON.stringify(safeProactiveMessage) : 'null';
    const agentIdValue = JSON.stringify(agentId);
    const supabaseUrlValue = JSON.stringify(supabaseUrl);
    const supabaseKeyValue = JSON.stringify(supabaseKey);
    const profileImageUrlValue = JSON.stringify(safeProfileImageUrl);
    const avatarFallbackValue = JSON.stringify(avatarFallback);

    // Construct avatar HTML
    const avatarHtml = hasProfileImage 
      ? `<img src="${safeProfileImageUrl}" alt="Agent Avatar" />`
      : avatarFallback;

    // Use Base64 encoding to safely pass complex values through HTML
    const encoder = new TextEncoder();
    const agentIdEncoded = btoa(agentId || '');
    const sessionIdEncoded = btoa(sessionId || '');
    const proactiveMessageEncoded = btoa(proactiveMessage || '');
    const initialMessageEncoded = btoa(safeInitialMessage || '');

    // Build safe JavaScript initialization with Base64 decoding
    const jsVariables = `
        try {
            console.log('🚀 Script starting execution...');
            
            // Decode Base64 encoded values safely
            function safeDecode(base64Str) {
                try {
                    return base64Str ? atob(base64Str) : '';
                } catch (e) {
                    console.warn('Failed to decode:', base64Str);
                    return '';
                }
            }
            
            // Initialize all variables with safe decoding
            const agentId = safeDecode('${agentIdEncoded}');
            const supabaseUrl = ${supabaseUrlValue};
            const supabaseKey = ${supabaseKeyValue};
            const sessionId = safeDecode('${sessionIdEncoded}');
            const proactiveMessage = safeDecode('${proactiveMessageEncoded}');
            const hasAgentProfileImage = ${hasProfileImage ? 'true' : 'false'};
            const agentProfileImageUrl = ${profileImageUrlValue};
            const agentAvatarFallback = ${avatarFallbackValue};
            const initialMessage = safeDecode('${initialMessageEncoded}');
            
            console.log('🔧 Variables initialized successfully:', { 
                agentId: agentId ? 'present' : 'missing',
                sessionId: sessionId ? 'present' : 'missing',
                proactiveMessage: proactiveMessage ? 'present' : 'empty'
            });
            
            // Validate required variables
            if (!agentId) {
                throw new Error('Agent ID is required');
            }
            if (!supabaseUrl || !supabaseKey) {
                throw new Error('Supabase configuration is missing');
            }
            
            console.log('✅ All variables validated successfully');
            
        } catch (error) {
            console.error('❌ Critical initialization error:', error);
            document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial;">Error loading chat: ' + error.message + '</div>';
            throw error;
        }
    `;

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
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          height: 100vh;
          display: flex;
          flex-direction: column;
          color: #f8fafc;
          position: relative;
          overflow: hidden;
        }
        
        body::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(132, 204, 22, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(168, 85, 247, 0.1) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }
        
        .header {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          position: relative;
          z-index: 1;
        }
        
        .avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(132, 204, 22, 0.3);
          position: relative;
          animation: pulseAvatar 3s ease-in-out infinite;
        }
        
        .avatar::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(135deg, #84cc16, #65a30d, #84cc16);
          border-radius: 26px;
          z-index: -1;
          animation: rotate 4s linear infinite;
          opacity: 0.7;
        }
        
        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 24px;
        }
        
        .agent-info h1 {
            font-size: 1.25rem;
            font-weight: 700;
            color: #f8fafc;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: rgba(132, 204, 22, 0.15);
          border: 1px solid rgba(132, 204, 22, 0.3);
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #84cc16;
          margin-top: 0.25rem;
        }
        
        .ai-badge-icon {
          width: 12px;
          height: 12px;
          background: #84cc16;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
        
        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            max-width: 100%;
            overflow: hidden;
            position: relative;
            z-index: 1;
        }
        
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .messages::-webkit-scrollbar {
          width: 6px;
        }
        
        .messages::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        
        .messages::-webkit-scrollbar-thumb {
          background: rgba(132, 204, 22, 0.3);
          border-radius: 3px;
        }
        
        .messages::-webkit-scrollbar-thumb:hover {
          background: rgba(132, 204, 22, 0.5);
        }
        
        .message {
            display: flex;
            gap: 1rem;
            max-width: 85%;
            animation: messageSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .message.user {
            align-self: flex-end;
            flex-direction: row-reverse;
        }
        
        .message-avatar {
            width: 36px;
            height: 36px;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
            font-weight: 700;
            flex-shrink: 0;
            position: relative;
            overflow: hidden;
        }
        
        .message.user .message-avatar {
            background: linear-gradient(135deg, #64748b 0%, #475569 100%);
            color: white;
            box-shadow: 0 4px 16px rgba(100, 116, 139, 0.3);
        }
        
        .message.assistant .message-avatar {
          background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(132, 204, 22, 0.3);
        }
        
        .message.assistant .message-avatar::after {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          right: -1px;
          bottom: -1px;
          background: linear-gradient(135deg, #84cc16, #65a30d);
          border-radius: 19px;
          z-index: -1;
          opacity: 0.5;
          animation: pulse 2s ease-in-out infinite;
        }
        
        .message-content {
            padding: 1rem 1.25rem;
            border-radius: 16px;
            word-wrap: break-word;
            white-space: pre-wrap;
            line-height: 1.6;
            font-size: 0.925rem;
            position: relative;
            backdrop-filter: blur(10px);
        }
        
        .message.user .message-content {
          background: #84cc16;
          color: white;
          box-shadow: 0 8px 24px rgba(132, 204, 22, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .message.assistant .message-content {
          background: rgba(255, 255, 255, 0.08);
          color: #f1f5f9;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        
        .input-area {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 0.75rem;
          position: relative;
          z-index: 1;
        }
        
        .input-area input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          outline: none;
          font-size: 0.925rem;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          color: #f1f5f9;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
        }
        
        .input-area input::placeholder {
          color: rgba(241, 245, 249, 0.6);
        }
        
        .input-area input:focus {
          border-color: rgba(132, 204, 22, 0.5);
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 0 0 2px rgba(132, 204, 22, 0.2);
        }
        
        .input-area button {
          padding: 0.75rem 1.25rem;
          background: #84cc16;
          color: white;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          font-size: 0.925rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(132, 204, 22, 0.3);
          min-width: 70px;
        }
        
        .input-area button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.6s ease;
        }
        
        .input-area button:hover:not(:disabled)::before {
          left: 100%;
        }
        
        .input-area button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(132, 204, 22, 0.4);
        }
        
        .input-area button:disabled {
            background: rgba(148, 163, 184, 0.3);
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .loading {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 1.25rem;
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            color: #f1f5f9;
            font-size: 0.925rem;
        }
        
        .typing-indicator {
          display: flex;
          gap: 4px;
        }
        
        .typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #84cc16;
          animation: typingBounce 1.4s ease-in-out infinite;
        }
        
        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        .empty-state {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: rgba(241, 245, 249, 0.7);
            gap: 1rem;
        }
        
        .empty-state-icon {
          width: 64px;
          height: 64px;
          background: #84cc16;
          border-radius: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 32px rgba(132, 204, 22, 0.3);
          animation: float 3s ease-in-out infinite;
        }
        
        .empty-state p {
          font-size: 1rem;
          font-weight: 500;
          margin: 0;
        }
        
        @keyframes pulseAvatar {
          0%, 100% { 
            box-shadow: 0 8px 24px rgba(132, 204, 22, 0.3);
          }
          50% { 
            box-shadow: 0 8px 32px rgba(132, 204, 22, 0.5);
          }
        }
        
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        
        @keyframes messageSlideIn {
          0% { 
            opacity: 0; 
            transform: translateY(10px) scale(0.98); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        @keyframes typingBounce {
          0%, 60%, 100% { 
            transform: translateY(0); 
          }
          30% { 
            transform: translateY(-8px); 
          }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px); 
          }
          50% { 
            transform: translateY(-6px); 
          }
        }
        
        .powered-by {
          text-align: center;
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .powered-by a {
          color: rgba(241, 245, 249, 0.6);
          text-decoration: none;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .powered-by a:hover {
          color: #84cc16;
          text-shadow: 0 0 8px rgba(132, 204, 22, 0.3);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="avatar">
          ${avatarHtml}
        </div>
        <div class="agent-info">
            <h1>${safeName}</h1>
            <div class="ai-badge">
                <div class="ai-badge-icon"></div>
                AI Assistant
            </div>
        </div>
    </div>

    <div class="chat-container">
        <div class="messages" id="messages">
            <div class="empty-state">
                <div class="empty-state-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                </div>
                <p>Start a conversation with ${safeName}</p>
            </div>
        </div>

        <div class="input-area">
            <input 
                type="text" 
                id="messageInput" 
                placeholder="Type your message..." 
                autofocus
            />
            <button id="sendButton" onclick="sendMessage()">Send</button>
        </div>
    </div>

    <div class="powered-by">
        <a href="https://chatpop.ai" target="_blank" rel="noopener noreferrer">
            ⚡ Powered by ChatPop
        </a>
    </div>

    <script>
    ` + jsVariables + `
        
        // Wrap all function definitions in comprehensive try-catch to ensure they get defined
        try {
            console.log('🔧 Defining chat functions...');
            
            const messagesContainer = document.getElementById('messages');
            const messageInput = document.getElementById('messageInput');
            const sendButton = document.getElementById('sendButton');
            
            if (!messagesContainer || !messageInput || !sendButton) {
                throw new Error('Required DOM elements not found');
            }

            let isLoading = false;
            let conversationId = null;

            console.log('🎯 DOM elements found:', { 
                messagesContainer: !!messagesContainer, 
                messageInput: !!messageInput, 
                sendButton: !!sendButton 
            });

            // Define sendMessage function with comprehensive error handling
            window.sendMessage = async function() {
                try {
                    console.log('🚀 Send button clicked!');
                    console.log('📝 Current input value:', messageInput.value);
                    console.log('⚡ Loading state:', isLoading);
                    
                    const message = messageInput.value.trim();
                    if (!message || isLoading) {
                        console.log('❌ Message blocked:', { message: !!message, isLoading });
                        return;
                    }

                    console.log('✅ Sending message:', message);
                    
                    // Add user message
                    addMessage('user', message);
                    messageInput.value = '';
                    setLoading(true);

                    // Create conversation if needed
                    if (!conversationId) {
                        console.log('🔄 Creating new conversation...');
                        const newSessionId = crypto.randomUUID();
                        const conversationData = {
                            agent_id: agentId,
                            session_id: newSessionId
                        };

                        // Link to visitor session if available
                        if (sessionId) {
                            conversationData.visitor_session_id = sessionId;
                        }

                        const convResponse = await fetch(supabaseUrl + '/rest/v1/conversations', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': supabaseKey,
                                'Prefer': 'return=representation'
                            },
                            body: JSON.stringify(conversationData)
                        });
                        
                        if (convResponse.ok) {
                            const [conversation] = await convResponse.json();
                            conversationId = conversation.id;
                            console.log('✅ Conversation created:', conversationId);
                        } else {
                            throw new Error('Failed to create conversation');
                        }
                    }

                    const requestBody = {
                        agentId: agentId,
                        message: message,
                        conversationId: conversationId
                    };

                    // Include visitor session context if available
                    if (sessionId) {
                        requestBody.visitorSessionId = sessionId;
                    }

                    console.log('Making API request with body:', requestBody);

                    const response = await fetch(supabaseUrl + '/functions/v1/chat-completion', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': supabaseKey,
                            'Authorization': 'Bearer ' + supabaseKey
                        },
                        body: JSON.stringify(requestBody)
                    });

                    console.log('Response status:', response.status);

                    if (response.ok) {
                        const data = await response.json();
                        console.log('Response data:', data);
                        addMessage('assistant', data.message);
                    } else {
                        const errorText = await response.text();
                        console.error('API error:', errorText);
                        addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
                    }

                } catch (error) {
                    console.error('❌ Send message error:', error);
                    addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
                } finally {
                    setLoading(false);
                }
            };

            // Define addMessage function
            function addMessage(role, content) {
                try {
                    console.log('Adding message:', { role, content });
                    
                    // Remove empty state if it exists
                    const emptyState = messagesContainer.querySelector('.empty-state');
                    if (emptyState) {
                        emptyState.remove();
                    }

                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message ' + role;
                    
                    const avatar = document.createElement('div');
                    avatar.className = 'message-avatar';
                    if (role === 'user') {
                      avatar.textContent = 'U';
                    } else {
                      if (hasAgentProfileImage) {
                        avatar.innerHTML = '<img src="' + agentProfileImageUrl + '" alt="Agent" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />';
                      } else {
                        avatar.textContent = agentAvatarFallback;
                      }
                    }
                    
                    const messageContent = document.createElement('div');
                    messageContent.className = 'message-content';
                    
                    // Process content to make URLs clickable and sanitize
                    // First escape HTML characters to prevent XSS
                    let processedContent = content
                      .replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/"/g, '&quot;')
                      .replace(/'/g, '&#39;');
                    
                    // Then make URLs clickable (they are now safely escaped)
                    processedContent = processedContent
                      .replace(/https?:\/\/[^\s&<>"{}|^[\]]+/g, function(url) {
                        return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" style="color: #84cc16; text-decoration: underline; font-weight: 500;">' + url + '</a>';
                      });
                    
                    messageContent.innerHTML = processedContent;
                    
                    messageDiv.appendChild(avatar);
                    messageDiv.appendChild(messageContent);
                    messagesContainer.appendChild(messageDiv);
                    
                    // Scroll to bottom
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                } catch (error) {
                    console.error('❌ Error adding message:', error);
                }
            }

            // Define setLoading function
            function setLoading(loading) {
                try {
                    console.log('Setting loading state:', loading);
                    isLoading = loading;
                    sendButton.disabled = loading;
                    
                    if (loading) {
                        const loadingDiv = document.createElement('div');
                        loadingDiv.className = 'message assistant';
                        loadingDiv.id = 'loading-message';
                        
                        const avatar = document.createElement('div');
                        avatar.className = 'message-avatar';
                        if (hasAgentProfileImage) {
                          avatar.innerHTML = '<img src="' + agentProfileImageUrl + '" alt="Agent" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />';
                        } else {
                          avatar.textContent = agentAvatarFallback;
                        }
                        
                        const loadingContent = document.createElement('div');
                        loadingContent.className = 'loading';
                        loadingContent.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div> Thinking...';
                        
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
                } catch (error) {
                    console.error('❌ Error setting loading state:', error);
                }
            }

            // Set up event listeners with error handling
            console.log('🎯 Setting up event handlers...');
            
            // Add backup event listener for send button
            if (sendButton) {
                console.log('✅ Send button found, adding click listener');
                sendButton.addEventListener('click', function(e) {
                    console.log('🖱️ Send button CLICK event triggered');
                    e.preventDefault();
                    window.sendMessage();
                });
                
                // Add additional event for debugging
                sendButton.addEventListener('mousedown', function(e) {
                    console.log('🖱️ Send button MOUSEDOWN event');
                });
            } else {
                console.error('❌ Send button not found!');
            }

            // Handle enter key
            if (messageInput) {
                console.log('✅ Message input found, adding keypress listener');
                messageInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        console.log('⌨️ Enter key pressed');
                        e.preventDefault();
                        window.sendMessage();
                    }
                });
            } else {
                console.error('❌ Message input not found!');
            }
            
            // Debug function accessible from console
            window.testSendMessage = function() {
                console.log('🧪 Test send message called');
                messageInput.value = 'Test message from console';
                window.sendMessage();
            };
            
            console.log('🎯 Event handlers setup complete');

            // Initialize conversation
            console.log('🚀 Initializing chat widget...');
            
            // Show proactive message or initial message if available        
            if (proactiveMessage && proactiveMessage.trim()) {
              setTimeout(() => {
                const emptyState = document.querySelector(".empty-state");
                if (emptyState) emptyState.remove();
                addMessage("assistant", proactiveMessage);
              }, 100);
            } else if (initialMessage && initialMessage.trim()) {
              setTimeout(() => {
                const emptyState = document.querySelector(".empty-state");
                if (emptyState) emptyState.remove();
                addMessage("assistant", initialMessage);
              }, 100);
            }
            
            try {
              if (window.parent) {
                window.parent.postMessage('CHATPOP_READY', '*');
              }
            } catch (_) {}
            
            console.log('✅ Chat widget initialized successfully');

        } catch (error) {
            console.error('❌ Critical script error:', error);
            document.body.innerHTML = 
                '<div style="padding: 20px; color: red; font-family: Arial; text-align: center; background: white;">' +
                    '<h3>Chat Loading Error</h3>' +
                    '<p>Unable to initialize chat: ' + error.message + '</p>' +
                    '<button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">Retry</button>' +
                '</div>';
        }
    </script>
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