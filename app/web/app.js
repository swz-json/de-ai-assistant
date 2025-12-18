const $ = (id) => document.getElementById(id);

const messagesEl = $("messages");
const inputEl = $("input");
const sendBtn = $("send");
const newChatBtn = $("newChat");
const chatListEl = $("chatList");

let chatId = localStorage.getItem("chat_id");

// ---------------------------------------------------------
//  ✨ ADVANCED UI FEATURES
// ---------------------------------------------------------

// 1. Post-Process: Adds Copy Buttons & Run Buttons to Code Blocks
function enhanceMessage(bubble) {
    const blocks = bubble.querySelectorAll('pre code');
    blocks.forEach((block) => {
        const pre = block.parentElement;
        
        // A. Add "Copy" Button
        if (!pre.querySelector('.copy-btn')) {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = '📋 Copy';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(block.innerText);
                copyBtn.textContent = '✅ Copied!';
                setTimeout(() => copyBtn.textContent = '📋 Copy', 2000);
            };
            pre.appendChild(copyBtn);
        }

        // B. Add "Run Query" Button (Only for SQL)
        if (block.className.includes('language-sql') && !pre.nextElementSibling?.classList.contains('run-sql-btn')) {
            const runBtn = document.createElement('button');
            runBtn.className = 'run-sql-btn';
            runBtn.innerHTML = '▶ Run Query';
            runBtn.onclick = () => executeSql(block.innerText, runBtn);
            pre.after(runBtn);
        }

        // C. Apply Syntax Highlighting
        if (typeof highlight !== 'undefined') highlight.highlightElement(block);
    });
}

// 2. Execute SQL Function (Advanced Table Styling)
async function executeSql(query, btn) {
    btn.disabled = true;
    btn.innerHTML = "⏳ Running...";
    
    try {
        const res = await fetch("/run-sql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: query })
        });
        const data = await res.json();

        // Create sleek result table container
        const resultDiv = document.createElement('div');
        resultDiv.style.marginTop = "15px";
        resultDiv.style.overflowX = "auto";
        resultDiv.style.borderRadius = "8px";
        resultDiv.style.border = "1px solid #333";
        resultDiv.style.background = "#111";

        if (data.error) {
            resultDiv.innerHTML = `<div style="padding:10px; background:#3f1a1a; color:#ff8888;">❌ ${data.error}</div>`;
        } else if (data.rows && data.rows.length > 0) {
            const headers = data.columns.map(c => `<th style="padding:8px; background:#222; text-align:left; border-bottom:1px solid #444; color:#fff;">${c}</th>`).join('');
            const rows = data.rows.map(r => `<tr>${data.columns.map(c => `<td style="padding:8px; border-bottom:1px solid #333; color:#ccc;">${r[c]}</td>`).join('')}</tr>`).join('');
            resultDiv.innerHTML = `<table style="width:100%; border-collapse:collapse; font-size:13px;"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
        } else {
            resultDiv.innerHTML = `<div style="padding:10px; background:#222; color:#aaa;">✅ Query executed successfully (0 rows returned).</div>`;
        }

        // Remove old result if exists
        if(btn.nextElementSibling?.tagName === 'DIV') btn.nextElementSibling.remove();
        
        btn.after(resultDiv);
        btn.innerHTML = "▶ Run Again";
    } catch (e) {
        alert("Execution failed: " + e.message);
        btn.innerHTML = "❌ Error";
    } finally {
        btn.disabled = false;
    }
}

// ---------------------------------------------------------
//  CHAT LOGIC & SIDEBAR
// ---------------------------------------------------------

async function loadSidebar() {
  try {
    const res = await fetch("/chats");
    const chats = await res.json();
    chatListEl.innerHTML = "";
    chats.forEach(c => {
      const div = document.createElement("div");
      div.className = "chat-item";
      div.innerHTML = `<span class="chat-title">${c.title}</span><span class="delete-btn" style="margin-left:auto;cursor:pointer;">&times;</span>`;
      div.onclick = () => loadChat(c.id);
      div.querySelector(".delete-btn").onclick = async (e) => {
        e.stopPropagation();
        if(confirm("Delete?")) { await fetch(`/chats/${c.id}`, {method:"DELETE"}); loadSidebar(); if(chatId===c.id) newChatBtn.click(); }
      };
      chatListEl.appendChild(div);
    });
  } catch(e) {}
}

async function loadChat(id) {
  chatId = id;
  localStorage.setItem("chat_id", id);
  messagesEl.innerHTML = "";
  try {
    const res = await fetch(`/chats/${id}`);
    const data = await res.json();
    data.messages.forEach(m => addMsg(m.role==="user"?"you":"assistant", m.content));
  } catch(e) {}
}

function addMsg(role, text) {
  const wrap = document.createElement("div");
  wrap.className = "msg";
  wrap.innerHTML = `<div class="role" style="font-weight:bold; margin-bottom:5px; color:#666; text-transform:uppercase; font-size:10px;">${role}</div><div class="bubble markdown-body"></div>`;
  const bubble = wrap.querySelector(".bubble");
  
  if (role === "assistant") {
      bubble.innerHTML = marked.parse(text);
      enhanceMessage(bubble);
  } else {
      bubble.textContent = text;
  }
  
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

// ---------------------------------------------------------
//  CORE SEND LOGIC (With Regex Cleaner 🧹)
// ---------------------------------------------------------
async function send() {
  const text = inputEl.value.trim();
  if (!text) return;

  addMsg("you", text);
  inputEl.value = "";
  sendBtn.disabled = true;
  
  const assistantBubble = addMsg("assistant", "..."); 

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, chat_id: chatId })
    });

    const contentType = res.headers.get("content-type");

    // CASE 1: Fast JSON Response
    if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.chat_id) { chatId = data.chat_id; localStorage.setItem("chat_id", chatId); }
        
        const cleanText = data.welcome_answer || data.answer || data.message || JSON.stringify(data);
        assistantBubble.innerHTML = marked.parse(cleanText);
        enhanceMessage(assistantBubble);
        loadSidebar();
    } 
    // CASE 2: Streaming Response
    else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let currentAnswer = "";
        assistantBubble.innerHTML = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          currentAnswer += decoder.decode(value, { stream: true });
          
          // 🧹 ULTRA-CLEANER: Removes {"chat_id":...} JSON header
          let displayText = currentAnswer.replace(/^\s*\{.*?"scope".*?\}\s*/s, "");

          assistantBubble.innerHTML = marked.parse(displayText);
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
        enhanceMessage(assistantBubble); 
        loadSidebar();
    }
  } catch (e) {
    assistantBubble.innerHTML = `<span style="color:red">Error: ${e.message}</span>`;
  } finally {
    sendBtn.disabled = false;
  }
}

// ---------------------------------------------------------
//  🚀 INIT & EVENT LISTENERS (Crucial Part!)
// ---------------------------------------------------------

newChatBtn.onclick = () => { 
    chatId = null; 
    localStorage.removeItem("chat_id"); 
    messagesEl.innerHTML=""; 
    addMsg("assistant", "Hi! I'm ready."); 
    loadSidebar(); 
};

sendBtn.onclick = send;

inputEl.onkeydown = (e) => { 
    if(e.key==="Enter" && !e.shiftKey) { 
        e.preventDefault(); 
        send(); 
    }
};

// Start the app
loadSidebar();
if (chatId) loadChat(chatId);
