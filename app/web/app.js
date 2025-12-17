const $ = (id) => document.getElementById(id);

const messagesEl = $("messages");
const inputEl = $("input");
const sendBtn = $("send");
const statusEl = $("status");
const newChatBtn = $("newChat");
const chatListEl = $("chatList");

// 1. Recover existing chat_id from browser storage
let chatId = localStorage.getItem("chat_id");

// 2. Configure Marked.js to use Hiloaghlight.js
marked.setOptions({
  highlight: function(code, lang) {
    const language = highlight.getLanguage(lang) ? lang : 'plaintext';
    return highlight.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-'
});

// ---------------------------------------------------------
//  VISUALIZATION & CHARTING LOGIC (📊)
// ---------------------------------------------------------
function renderChart(container, data) {
    const columns = data.columns;
    const rows = data.rows;
    
    if (rows.length === 0 || columns.length < 2) return;

    // Heuristic: Find a label column (string) and a data column (number)
    let labelCol = columns.find(c => typeof rows[0][c] === 'string') || columns[0];
    let dataCol = columns.find(c => typeof rows[0][c] === 'number');

    if (!dataCol) return;

    const labels = rows.map(r => r[labelCol]);
    const values = rows.map(r => r[dataCol]);

    // Create Canvas
    const canvas = document.createElement("canvas");
    canvas.style.marginTop = "15px";
    canvas.style.maxHeight = "300px";
    canvas.style.backgroundColor = "#1e2227"; 
    canvas.style.borderRadius = "8px";
    canvas.style.padding = "10px";
    container.appendChild(canvas);

    // Draw Chart
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: dataCol,
                data: values,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: '#444' }, ticks: { color: '#ccc' } },
                x: { grid: { color: '#444' }, ticks: { color: '#ccc' } }
            },
            plugins: {
                legend: { labels: { color: '#fff' } }
            }
        }
    });
}

// ---------------------------------------------------------
//  SELF-HEALING AGENT LOGIC (🩹 NEW)
// ---------------------------------------------------------
async function fixQuery(originalSql, errorMsg, btn) {
  btn.textContent = "🩹 Healing...";
  btn.disabled = true;

  try {
      const res = await fetch("/fix-sql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: originalSql, error: errorMsg })
      });

      const data = await res.json();
      const fixedSql = data.fixed_query;

      // Provide visual feedback
      const feedback = document.createElement("div");
      feedback.style.color = "#4caf50";
      feedback.style.marginTop = "5px";
      feedback.innerHTML = `<em>✨ Fixed! Re-running...</em>`;
      btn.replaceWith(feedback);

      // Inject the new SQL into the logic by calling runQuery again.
      // We pass 'feedback' as the button context so results appear below the "Fixed!" message.
      runQuery(fixedSql, feedback);

  } catch (e) {
      btn.textContent = "Fix Failed";
      alert(e.message);
  }
}

// ---------------------------------------------------------
//  SQL EXECUTION LOGIC
// ---------------------------------------------------------
async function runQuery(sql, btn) {
  // If btn is a real button, update UI. If it's a div (from auto-fix), skip text update.
  if (btn.tagName === "BUTTON") {
      btn.textContent = "Running...";
      btn.disabled = true;
  }
  
  try {
    const res = await fetch("/run-sql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql })
    });
    
    const data = await res.json();
    
    // Clear previous results if exists (look at next sibling)
    const existingContainer = btn.nextElementSibling;
    if (existingContainer && existingContainer.classList.contains("result-container")) {
        existingContainer.remove();
    }

    const container = document.createElement("div");
    container.className = "result-container";
    container.style.marginTop = "10px";

    // 1. Handle Errors -> SHOW FIX BUTTON
    if (data.error) {
        container.innerHTML = `
            <div style="color:#ff6b6b; font-family:monospace; margin-bottom:10px;">
                ❌ ${data.error}
            </div>
        `;
        
        // Create the Auto-Fix Button
        const fixBtn = document.createElement("button");
        fixBtn.className = "btn";
        fixBtn.style.backgroundColor = "#d32f2f"; // Red/Orange
        fixBtn.style.color = "white";
        fixBtn.style.border = "none";
        fixBtn.style.fontSize = "12px";
        fixBtn.style.padding = "6px 12px";
        fixBtn.style.cursor = "pointer";
        fixBtn.style.borderRadius = "4px";
        fixBtn.innerHTML = "🩹 Auto-Fix Query";
        fixBtn.onclick = () => fixQuery(sql, data.error, fixBtn);
        
        container.appendChild(fixBtn);
    } 
    // 2. Handle Success
    else if (data.rows && data.rows.length > 0) {
        const headers = data.columns.map(c => `<th>${c}</th>`).join("");
        const rowsHtml = data.rows.map(r => 
            `<tr>${data.columns.map(c => `<td>${r[c]}</td>`).join("")}</tr>`
        ).join("");
        
        container.innerHTML = `
        <div style="overflow-x:auto; margin-bottom: 10px;">
            <table border="1" style="border-collapse:collapse; width:100%; font-size:13px; border-color:#444; color:#eee;">
                <thead><tr style="background:#222;">${headers}</tr></thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>`;

        // Render Chart
        renderChart(container, data);
    } else {
        container.innerHTML = `<div style="color:#aaa;">Query executed successfully (0 rows returned).</div>`;
    }
    
    // Insert after the button (or feedback element)
    if (btn.parentNode) {
        btn.parentElement.insertBefore(container, btn.nextSibling);
    }
    
    if (btn.tagName === "BUTTON") {
        btn.textContent = "▶ Run Again";
        btn.disabled = false;
    }
    
  } catch (e) {
    if (btn.tagName === "BUTTON") btn.textContent = "Error";
    alert(e.message);
    if (btn.tagName === "BUTTON") btn.disabled = false;
  }
}

function addRunButtons(bubble) {
    bubble.querySelectorAll('pre code.language-sql').forEach(block => {
        const pre = block.parentElement;
        if (pre.nextElementSibling?.classList.contains('btn')) return; 

        const sql = block.innerText;
        const btn = document.createElement("button");
        btn.className = "btn secondary";
        btn.style.marginTop = "8px";
        btn.style.fontSize = "12px";
        btn.style.padding = "4px 10px";
        btn.innerHTML = "▶ Run Query";
        btn.onclick = () => runQuery(sql, btn);
        
        pre.after(btn);
    });
}

// ---------------------------------------------------------
//  UI & CHAT LOGIC
// ---------------------------------------------------------

// ✅ UPDATED: Sidebar with Delete Functionality
async function loadSidebar() {
  try {
    const res = await fetch("/chats");
    const chats = await res.json();
    chatListEl.innerHTML = "";
    
    chats.forEach(c => {
      const div = document.createElement("div");
      div.className = "chat-item";
      
      // We insert the Title AND the Delete Button
      div.innerHTML = `
        <span class="chat-title" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${c.title}
        </span>
        <span class="delete-btn" title="Delete this chat">×</span>
      `;

      // 1. Logic for clicking the row (Loads the chat)
      div.onclick = (e) => {
        loadChat(c.id);
      };

      // 2. Logic for clicking the 'X' (Deletes the chat)
      const delBtn = div.querySelector(".delete-btn");
      delBtn.onclick = async (e) => {
        e.stopPropagation(); // 🛑 STOP the click from loading the chat!
        
        if (!confirm("Are you sure you want to delete this chat?")) return;

        try {
          await fetch(`/chats/${c.id}`, { method: "DELETE" });
          
          // If we deleted the one we are looking at, switch to New Chat
          if (chatId === c.id) {
            newChatBtn.click();
          }
          
          // Refresh the list to make it disappear
          loadSidebar(); 
        } catch (err) {
          alert("Error deleting chat");
        }
      };

      chatListEl.appendChild(div);
    });
  } catch (e) {
    console.error("Failed to load sidebar", e);
  }
}

async function loadChat(id) {
  chatId = id;
  localStorage.setItem("chat_id", id);
  messagesEl.innerHTML = "";
  
  try {
    const res = await fetch(`/chats/${id}`);
    const data = await res.json();
    
    data.messages.forEach(m => {
      addMsg(m.role === "user" ? "you" : `assistant`, m.content);
    });
  } catch(e) {
    console.error("Failed to load chat", e);
  }
}

function addMsg(role, text) {
  const wrap = document.createElement("div");
  wrap.className = "msg";
  wrap.innerHTML = `
    <div class="role">${role}</div>
    <div class="bubble markdown-body"></div> 
  `;
  
  const bubble = wrap.querySelector(".bubble");
  
  if (role.startsWith("assistant")) {
      bubble.innerHTML = marked.parse(text);
      addRunButtons(bubble);
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
  statusEl.textContent = "Thinking...";
  sendBtn.disabled = true;

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, chat_id: chatId })
    });

    // Handle Streaming
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    
    let assistantBubble = addMsg("assistant", "");
    let currentAnswer = "";
    let isFirstChunk = true;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      
      if (isFirstChunk) {
        const lines = chunk.split("\n");
        try {
            const meta = JSON.parse(lines[0]);
            if (meta.chat_id) {
                chatId = meta.chat_id;
                localStorage.setItem("chat_id", chatId);
            }
            if (meta.scope) statusEl.textContent = `Mode: ${meta.scope}`;
            if (lines.length > 1) {
                currentAnswer += lines.slice(1).join("\n");
            }
        } catch (e) {
            currentAnswer += chunk;
        }
        isFirstChunk = false;
        loadSidebar(); 
      } else {
        currentAnswer += chunk;
      }

      // Update UI with Markdown parsing
      assistantBubble.innerHTML = marked.parse(currentAnswer);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    
    // Final pass to add buttons
    addRunButtons(assistantBubble);
    statusEl.textContent = "";

  } catch (e) {
    statusEl.textContent = "Error: " + e.message;
    addMsg("error", String(e));
  } finally {
    sendBtn.disabled = false;
  }
}

// ---------------------------------------------------------
//  EVENT LISTENERS & BOOT
// ---------------------------------------------------------

newChatBtn.addEventListener("click", () => {
  messagesEl.innerHTML = "";
  statusEl.textContent = "";
  inputEl.value = "";
  inputEl.focus();
  chatId = null;
  localStorage.removeItem("chat_id");
  addMsg("assistant", "Hi! I'm ready. Ask me about Data Engineering.");
  loadSidebar();
});

sendBtn.addEventListener("click", send);
inputEl.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") send();
});

// Startup
loadSidebar();
if (chatId) {
    loadChat(chatId);
} else {
    addMsg("assistant", "Hi! Ask me about dbt, Airflow, BigQuery, SQL...");
}
