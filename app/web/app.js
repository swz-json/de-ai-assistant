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
    // Find all code blocks
    const blocks = bubble.querySelectorAll('pre code');
    
    blocks.forEach((block) => {
        const pre = block.parentElement;
        
        // A. Add "Copy" Button (if not already there)
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
        // Checks if the class contains 'sql' (added by marked.js)
        if (block.className.includes('language-sql') && !pre.nextElementSibling?.classList.contains('run-sql-btn')) {
            const runBtn = document.createElement('button');
            runBtn.className = 'run-sql-btn';
            runBtn.innerHTML = '▶ Run Query';
            runBtn.onclick = () => executeSql(block.innerText, runBtn);
            pre.after(runBtn);
        }

        // C. Apply Syntax Highlighting (if highlight.js is loaded)
        if (typeof highlight !== 'undefined') highlight.highlightElement(block);
    });
}

// 2. Execute SQL Function
async function executeSql(query, btn) {
    btn.disabled = true;
    btn.textContent = "Running...";
    
    try {
        const res = await fetch("/run-sql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: query })
        });
        const data = await res.json();

        // Create a result table
        const resultDiv = document.createElement('div');
        resultDiv.style.marginTop = "10px";
        resultDiv.style.overflowX = "auto";
        resultDiv.style.background = "#111";
        resultDiv.style.padding = "10px";
        resultDiv.style.borderRadius = "6px";

        if (data.error) {
            resultDiv.innerHTML = `<span style="color:#ff5555">❌ ${data.error}</span>`;
        } else if (data.rows && data.rows.length > 0) {
            // Build Table
            const headers = data.columns.map(c => `<th style="padding:5px; border-bottom:1px solid #444">${c}</th>`).join('');
            const rows = data.rows.map(r => `<tr>${data.columns.map(c => `<td style="padding:5px; border-bottom:1px solid #333">${r[c]}</td>`).join('')}</tr>`).join('');
            resultDiv.innerHTML = `<table style="width:100%; border-collapse:collapse; font-size:12px; color:#ddd"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
        } else {
            resultDiv.innerHTML = `<span style="color:#aaa">✅ Query executed successfully (0 rows).</span>`;
        }

        btn.after(resultDiv);
        btn.textContent = "✅ Ran Successfully";
    } catch (e) {
        alert("Execution failed: " + e.message);
        btn.textContent = "❌ Error";
    } finally {
        setTimeout(() => { btn.disabled = false; btn.textContent = "▶ Run Again"; }, 3000);
    }
}

// ---------------------------------------------------------
//  STANDARD CHAT LOGIC (Optimized)
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
  const res = await fetch(`/chats/${id}`);
  const data = await res.json();
  data.messages.forEach(m => addMsg(m.role==="user"?"you":"assistant", m.content));
}

function addMsg(role, text) {
  const wrap = document.createElement("div");
  wrap.className = "msg";
  wrap.innerHTML = `<div class="role">${role}</div><div class="bubble markdown-body"></div>`;
  const bubble = wrap.querySelector(".bubble");
  
  // Render Markdown if assistant, else Plain Text
  if (role === "assistant") {
      bubble.innerHTML = marked.parse(text);
      enhanceMessage(bubble); // ✨ Apply Pro Features
  } else {
      bubble.textContent = text;
  }
  
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

async function send() {
  const text = inputEl.value.trim();
  if (!text) return;

  addMsg("you", text);
  inputEl.value = "";
  sendBtn.disabled = true;
  const assistantBubble = addMsg("assistant", "..."); // Placeholder

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, chat_id: chatId })
    });

    const contentType = res.headers.get("content-type");

    // ⚡ CASE 1: Fast JSON (Welcome / Errors)
    if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.chat_id) { chatId = data.chat_id; localStorage.setItem("chat_id", chatId); }
        
        const cleanText = data.welcome_answer || data.answer || data.message || JSON.stringify(data);
        assistantBubble.innerHTML = marked.parse(cleanText);
        enhanceMessage(assistantBubble); // ✨ Apply Pro Features
        loadSidebar();
    } 
    // 🌊 CASE 2: Streaming Response
    else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let currentAnswer = "";
        assistantBubble.innerHTML = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          currentAnswer += decoder.decode(value, { stream: true });
          assistantBubble.innerHTML = marked.parse(currentAnswer);
          // Only enhance at the end to save performance, or periodically
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
        enhanceMessage(assistantBubble); // ✨ Apply Pro Features (Final Pass)
        loadSidebar();
    }
  } catch (e) {
    assistantBubble.innerHTML = `<span style="color:red">Error: ${e.message}</span>`;
  } finally {
    sendBtn.disabled = false;
  }
}

newChatBtn.onclick = () => { chatId = null; localStorage.removeItem("chat_id"); messagesEl.innerHTML=""; addMsg("assistant", "Hi! I'm ready."); loadSidebar(); };
sendBtn.onclick = send;
inputEl.onkeydown = (e) => { if(e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); }};

loadSidebar();
if (chatId) loadChat(chatId);
