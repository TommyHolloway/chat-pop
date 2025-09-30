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

    // Build widget script using string concatenation to avoid template literal nesting
    let widgetScript = '(function() {\n';
    widgetScript += '  "use strict";\n';
    widgetScript += '  \n';
    widgetScript += '  if (window.ChatPopWidget) {\n';
    widgetScript += '    console.log("ChatPop widget already loaded");\n';
    widgetScript += '    return;\n';
    widgetScript += '  }\n';
    widgetScript += '\n';
    widgetScript += '  const agentId = "' + agentId + '";\n';
    widgetScript += '  const position = "' + position + '";\n';
    widgetScript += '  const supabaseUrl = "https://etwjtxqjcwyxdamlcorf.supabase.co";\n';
    widgetScript += '  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0d2p0eHFqY3d5eGRhbWxjb3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzI3MTcsImV4cCI6MjA2ODk0ODcxN30.Dji_q0KFNL8hetK_Og8k9MI4l8sZJ5iCQQxQc4j1isM";\n';
    widgetScript += '  const chatUrl = "https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/public-chat?agentId=" + agentId;\n';
    widgetScript += '\n';
    widgetScript += '  let isOpen = false;\n';
    widgetScript += '  let widget, overlay, conversationId, agentData, isLoading = false;\n';
    widgetScript += '  let sessionId = "session-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);\n';
    widgetScript += '\n';
    widgetScript += '  // Instead of iframe, embed chat UI directly\n';
    widgetScript += '  window.ChatPopWidget = { open: () => toggleChat(), close: () => toggleChat() };\n';
    widgetScript += '\n';
    widgetScript += '  function createWidget() {\n';
    widgetScript += '    widget = document.createElement("button");\n';
    widgetScript += '    widget.id = "chatpop-widget";\n';
    widgetScript += '    widget.innerHTML = "💬";\n';
    widgetScript += '    widget.style.cssText = "position:fixed;' + (position.includes('bottom') ? 'bottom:20px;' : 'top:20px;') + (position.includes('right') ? 'right:20px;' : 'left:20px;') + 'width:60px;height:60px;border-radius:50%;background:#84cc16;color:white;border:none;font-size:28px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:2147483647;transition:all 0.3s;";\n';
    widgetScript += '    widget.onclick = toggleChat;\n';
    widgetScript += '    document.body.appendChild(widget);\n';
    widgetScript += '  }\n';
    widgetScript += '\n';
    widgetScript += '  function createOverlay() {\n';
    widgetScript += '    overlay = document.createElement("div");\n';
    widgetScript += '    overlay.style.cssText = "position:fixed;' + (position.includes('bottom') ? 'bottom:0;' : 'top:0;') + (position.includes('right') ? 'right:0;' : 'left:0;') + 'width:400px;height:600px;background:white;box-shadow:-4px 0 40px rgba(0,0,0,0.15);z-index:2147483646;display:none;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;";\n';
    widgetScript += '    overlay.innerHTML = \'<div style="display:flex;flex-direction:column;height:100%;background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);">\' +\n';
    widgetScript += '      \'<div style="background:linear-gradient(135deg, #84cc16 0%, #65a30d 100%);color:white;padding:20px;display:flex;align-items:center;gap:12px;"><img id="agent-avatar" style="width:48px;height:48px;border-radius:50%;border:3px solid white;" src="https://ui-avatars.com/api/?name=AI&background=84cc16&color=fff"><div><h2 id="agent-name" style="margin:0;font-size:18px;">Loading...</h2><p style="margin:0;font-size:13px;opacity:0.9;">AI Assistant</p></div></div>\' +\n';
    widgetScript += '      \'<div id="messages" style="flex:1;overflow-y:auto;padding:20px;"></div>\' +\n';
    widgetScript += '      \'<div style="padding:16px;background:white;border-top:1px solid #e5e7eb;"><div style="display:flex;gap:8px;"><input id="chat-input" type="text" placeholder="Type your message..." style="flex:1;padding:12px;border:2px solid #e5e7eb;border-radius:12px;font-size:14px;outline:none;"/><button id="send-btn" style="padding:12px 24px;background:#84cc16;color:white;border:none;border-radius:12px;cursor:pointer;font-weight:600;">Send</button></div></div>\' +\n';
    widgetScript += '      \'<div style="text-align:center;padding:12px;font-size:11px;color:#9ca3af;">Powered by ChatPop</div></div>\';\n';
    widgetScript += '    document.body.appendChild(overlay);\n';
    widgetScript += '    document.getElementById("send-btn").onclick = sendMessage;\n';
    widgetScript += '    document.getElementById("chat-input").onkeypress = (e) => { if (e.key === "Enter") sendMessage(); };\n';
    widgetScript += '    fetchAgentData().then(data => { if (data) { document.getElementById("agent-name").textContent = data.name || "AI Assistant"; document.getElementById("agent-avatar").src = data.profile_image_url || "https://ui-avatars.com/api/?name=AI&background=84cc16&color=fff"; if (data.initial_message) addMessage(data.initial_message, false); } });\n';
    widgetScript += '  }\n';
    widgetScript += '\n';
    widgetScript += '  function toggleChat() {\n';
    widgetScript += '    if (!overlay) createOverlay();\n';
    widgetScript += '    isOpen = !isOpen;\n';
    widgetScript += '    overlay.style.display = isOpen ? "block" : "none";\n';
    widgetScript += '  }\n';
    widgetScript += '\n';
    widgetScript += '  async function fetchAgentData() {\n';
    widgetScript += '    try {\n';
    widgetScript += '      const response = await fetch(supabaseUrl + "/rest/v1/rpc/get_public_agent_data?agent_uuid=" + agentId, { headers: { "apikey": supabaseKey, "Content-Type": "application/json" } });\n';
    widgetScript += '      if (response.ok) { const data = await response.json(); if (data && data.length > 0) { agentData = data[0]; return agentData; } }\n';
    widgetScript += '    } catch (error) { console.error("Error fetching agent:", error); }\n';
    widgetScript += '    return null;\n';
    widgetScript += '  }\n';
    widgetScript += '\n';
    widgetScript += '  function addMessage(content, isUser) {\n';
    widgetScript += '    const messages = document.getElementById("messages");\n';
    widgetScript += '    if (!messages) return;\n';
    widgetScript += '    const div = document.createElement("div");\n';
    widgetScript += '    div.style.cssText = "margin-bottom:16px;display:flex;gap:12px;align-items:flex-start;" + (isUser ? "flex-direction:row-reverse;" : "");\n';
    widgetScript += '    const avatar = document.createElement("img");\n';
    widgetScript += '    avatar.src = isUser ? "https://ui-avatars.com/api/?name=You&background=84cc16&color=fff" : (agentData?.profile_image_url || "https://ui-avatars.com/api/?name=AI&background=84cc16&color=fff");\n';
    widgetScript += '    avatar.style.cssText = "width:32px;height:32px;border-radius:50%;";\n';
    widgetScript += '    const messageDiv = document.createElement("div");\n';
    widgetScript += '    messageDiv.textContent = content;\n';
    widgetScript += '    messageDiv.style.cssText = "padding:12px 16px;border-radius:16px;max-width:70%;word-wrap:break-word;background:" + (isUser ? "#84cc16" : "#f3f4f6") + ";color:" + (isUser ? "white" : "#1f2937") + ";";\n';
    widgetScript += '    div.appendChild(avatar);\n';
    widgetScript += '    div.appendChild(messageDiv);\n';
    widgetScript += '    messages.appendChild(div);\n';
    widgetScript += '    messages.scrollTop = messages.scrollHeight;\n';
    widgetScript += '  }\n';
    widgetScript += '\n';
    widgetScript += '  function setLoading(loading) {\n';
    widgetScript += '    isLoading = loading;\n';
    widgetScript += '    const input = document.getElementById("chat-input");\n';
    widgetScript += '    const btn = document.getElementById("send-btn");\n';
    widgetScript += '    if (input) input.disabled = loading;\n';
    widgetScript += '    if (btn) btn.disabled = loading;\n';
    widgetScript += '  }\n';
    widgetScript += '\n';
    widgetScript += '  async function sendMessage() {\n';
    widgetScript += '    const input = document.getElementById("chat-input");\n';
    widgetScript += '    const message = input?.value.trim();\n';
    widgetScript += '    if (!message || isLoading) return;\n';
    widgetScript += '    addMessage(message, true);\n';
    widgetScript += '    input.value = "";\n';
    widgetScript += '    setLoading(true);\n';
    widgetScript += '    try {\n';
    widgetScript += '      const response = await fetch(supabaseUrl + "/functions/v1/chat-completion", { method: "POST", headers: { "Content-Type": "application/json", "apikey": supabaseKey }, body: JSON.stringify({ agentId, message, conversationId, sessionId }) });\n';
    widgetScript += '      if (!response.ok) throw new Error("Failed to send message");\n';
    widgetScript += '      const data = await response.json();\n';
    widgetScript += '      if (!conversationId && data.conversationId) conversationId = data.conversationId;\n';
    widgetScript += '      if (data.reply) addMessage(data.reply, false);\n';
    widgetScript += '    } catch (error) { console.error("Error:", error); addMessage("Sorry, I encountered an error. Please try again.", false); }\n';
    widgetScript += '    finally { setLoading(false); }\n';
    widgetScript += '  }\n';
    widgetScript += '\n';
    widgetScript += '  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", createWidget); } else { createWidget(); }\n';
    widgetScript += '})();';

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
