
/***** script.js — NetWise (Gemini-only) frontend - FIXED *****/
document.addEventListener('DOMContentLoaded', () => {
  // --- UI / timing config ---
  const LOADER_FADE_MS = 1200;
  const ANIMATION_DELAY_MS = 300;
  let soundOn = true;

  // --- DOM refs (required ones) ---
  const loader = document.getElementById('loader');
  const app = document.getElementById('app');
  const connDot = document.getElementById('conn-dot');
  const connText = document.getElementById('conn-text');
  const messages = document.getElementById('messages');
  const form = document.getElementById('form');
  const input = document.getElementById('input');
  const topicChips = document.getElementById('topic-chips');
  const clearBtn = document.getElementById('clearBtn');
  const toggleSound = document.getElementById('toggleSound');
  const particles = document.getElementById('particles');

  // Basic sanity
  if (!app || !messages || !form || !input) {
    console.error('Essential DOM nodes missing. Check your HTML IDs (app, messages, form, input).');
    return;
  }

  // --- Suggested topic chips ---
  const SUGGESTED = ['TCP', 'Routing', 'DNS', 'Congestion Control', 'Socket programming', 'ARP', 'DHCP'];
  if (topicChips) {
    SUGGESTED.forEach(t => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'text-xs px-3 py-1 rounded-full bg-slate-700/50 text-slate-200 hover:bg-slate-700 hover:text-sky-400 transition';
      btn.innerText = t;
      btn.onclick = () => { input.value = t; input.focus(); };
      topicChips.appendChild(btn);
    });
  }

  // --- Sound ping ---
  function playPing(){
    if(!soundOn) return;
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.value = 0.02;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.06);
    }catch(e){ /* ignore */ }
  }

  // --- Connection indicator ---
  function setConn(status, text){
    if (!connDot || !connText) return;
    const dotClass = status === 'connected'
      ? 'bg-green-500 shadow-green-500/50'
      : (status === 'connecting'
          ? 'bg-yellow-400 shadow-yellow-400/30 animate-pulse'
          : 'bg-red-500 shadow-red-500/50');
    connDot.className = `w-3 h-3 rounded-full ${dotClass} shadow-md`;
    connText.textContent = text;
  }

  // Utility to safely escape HTML content
  function escapeHtml(unsafe) {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;") // Added for completeness, though less critical here
      .replace(/'/g, "&#039;"); // Added for completeness
  }

  // --- Chat rendering helpers ---
  function appendMessage(text, who='bot'){
    // Remove welcome if present
    const welcome = document.getElementById('welcome');
    if (welcome) welcome.remove();

    const wrapper = document.createElement('div');
    wrapper.className = 'flex ' + (who === 'user' ? 'justify-end' : 'justify-start');

    const bubble = document.createElement('div');
    bubble.className = (who === 'user' ? 'bubble-user' : 'bubble-bot') + ' px-4 py-2 rounded-2xl max-w-[80%] break-words whitespace-pre-wrap';

    if (who === 'bot') {
      // FIX: Escape HTML first, then replace newlines with <br> for simple formatting.
      // The spark icon is added safely as a separate escaped element.
      const safeText = escapeHtml(text).replace(/\n/g, '<br>');
      bubble.innerHTML = `<span class="text-violet-500 text-lg mr-2 inline-block">⚡</span>${safeText}`;
    } else {
      // User message uses textContent for absolute safety
      bubble.textContent = text;
    }

    wrapper.appendChild(bubble);
    messages.appendChild(wrapper);
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });

    if (who === 'bot') playPing();
  }

  // Typing indicator
  function showTyping(){
    hideTyping();
    const el = document.createElement('div');
    el.className = 'flex items-center gap-2';
    el.id = 'typing';
    el.innerHTML = '<div class="w-3 h-3 rounded-full bg-sky-400/80 animate-pulse shadow-lg shadow-sky-400/40"></div><div class="text-slate-300 text-sm">NetWise is typing…</div>';
    messages.appendChild(el);
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
  }
  function hideTyping(){ const t = document.getElementById('typing'); if (t) t.remove(); }

  // Transition app UI after loader
  function transitionToApp() {
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => {
        if (loader) loader.style.visibility = 'hidden';
      }, LOADER_FADE_MS);
    }
    app.style.opacity = '1';
    app.style.pointerEvents = 'auto';
    app.removeAttribute('aria-hidden');
  }

  // Start state
  setTimeout(() => {
    transitionToApp();
    setConn('connected','Ready');
  }, LOADER_FADE_MS + ANIMATION_DELAY_MS);

  // --- Particles (cosmetic) ---
  (function spawnParticles(){
    if (!particles) return;
    for(let i=0;i<20;i++){
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random()*100 + 'vw';
      p.style.top = Math.random()*100 + 'vh';
      p.style.opacity = (Math.random()*0.07 + 0.02);
      p.style.transform = 'scale(' + (Math.random()*1.4+0.3) + ')';
      particles.appendChild(p);
    }
  })();

  // --- Clear and sound buttons ---
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      messages.innerHTML = `<div id="welcome" class="text-center text-slate-400 pt-12">
        <div class="text-3xl text-sky-400 font-extrabold tracking-wide">NETWORK YOUR KNOWLEDGE</div>
        <div class="mt-4 text-slate-300">Type a question about Computer Networks to begin.</div>
      </div>`;
    });
  }
  if (toggleSound) {
    toggleSound.addEventListener('click', () => {
      soundOn = !soundOn;
      toggleSound.textContent = soundOn ? '🔔' : '🔕';
    });
  }

  // ====================================================
  // ================== GEMINI / NETWISE =================
  // ====================================================

  const GEMINI_API_KEY = "";
  const MODEL_NAME = "gemini-2.5-flash";

  const systemInstructionText = `
You are NetWise — an AI that ONLY answers Computer Networking questions:
OSI layers, TCP/IP, routing, switching, DNS, DHCP, ARP, network security, IoT protocols.
Politely refuse non-networking questions.
You may greet when user says hi or hello.
Tone: short, technical, helpful.
`;

  async function sendToGemini(message) {
    // guard
    if (!message || !message.trim()) return;
    appendMessage(message, 'user');
    showTyping();

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
    // The request body should be structured to use a system instruction and a single user message.
    // The existing structure using 'systemInstruction' property at the root is correct for the API call.
   const requestBody = {
  systemInstruction: { parts: [{ text: systemInstructionText }] },
  contents: [
    {
      role: "user",
      parts: [{ text: message }]
    }
  ]
};


    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        // try to show server text for debugging
        const txt = await res.text();
        hideTyping();
        appendMessage(`API Error: ${res.status} ${res.statusText} — ${txt}`, 'bot');
        return;
      }

      const data = await res.json();
      hideTyping();

      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply && reply.trim()) {
        appendMessage(reply, 'bot');
      } else {
        // Check for blockage reasons (e.g., safety settings)
        const reason = data?.candidates?.[0]?.finishReason || 'Unknown';
        appendMessage(`No response from AI (Reason: ${reason}). Try rephrasing or asking a networking question.`, 'bot');
      }
    } catch (err) {
      hideTyping();
      appendMessage('Network/Fetch error: ' + (err.message || err), 'bot');
      console.error('sendToGemini error', err);
    }
  }

  // ====================================================
  // ============== Submission wiring ===================
  // ====================================================
  const sendButton = form.querySelector('button[type="submit"]') || form.querySelector('button');

  // Form submit: send to Gemini
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendToGemini(text);
  });

  // Enter key handling (already correct)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (sendButton) sendButton.click(); // triggers form submit
    }
  });

  // Optional: click handler on send button — (already correct)
  if (sendButton) {
    sendButton.addEventListener('click', (ev) => {
      // If button is inside a form, click will trigger submit; just let it.
      if (!form || !form.contains(sendButton)) {
        ev.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        sendToGemini(text);
      }
    });
  }

 
  setTimeout(() => {
    appendMessage("Connection established. Ask a CN question.", 'bot');
  }, LOADER_FADE_MS + ANIMATION_DELAY_MS + 200);


});
