/***** script.js — NetWise (Frontend-only Gemini) - FINAL *****/
document.addEventListener('DOMContentLoaded', () => {
  const LOADER_FADE_MS = 1200;
  const ANIMATION_DELAY_MS = 300;
  let soundOn = true;

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

  if (!app || !messages || !form || !input) return;

  const SUGGESTED = ['TCP', 'Routing', 'DNS', 'Congestion Control', 'Socket programming', 'ARP', 'DHCP'];
  if (topicChips) {
    SUGGESTED.forEach(t => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'text-xs px-3 py-1 rounded-full bg-slate-700/50 text-slate-200 hover:bg-slate-700 hover:text-sky-400 transition';
      btn.innerText = t;
      btn.onclick = () => { input.value = t; input.focus(); };
      topicChips.appendChild(btn);
    });
  }

  function playPing() {
    if (!soundOn) return;
    try {
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
    } catch (e) { }
  }

  function setConn(status, text) {
    if (!connDot || !connText) return;
    const dotClass =
      status === 'connected'
        ? 'bg-green-500 shadow-green-500/50'
        : status === 'connecting'
          ? 'bg-yellow-400 shadow-yellow-400/30 animate-pulse'
          : 'bg-red-500 shadow-red-500/50';
    connDot.className = `w-3 h-3 rounded-full ${dotClass} shadow-md`;
    connText.textContent = text;
  }

  function escapeHtml(unsafe) {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function appendMessage(text, who = 'bot') {
    const welcome = document.getElementById('welcome');
    if (welcome) welcome.remove();

    const wrapper = document.createElement('div');
    wrapper.className = 'flex ' + (who === 'user' ? 'justify-end' : 'justify-start');

    const bubble = document.createElement('div');
    bubble.className =
      (who === 'user' ? 'bubble-user' : 'bubble-bot') +
      ' px-4 py-2 rounded-2xl max-w-[80%] break-words whitespace-pre-wrap';

    if (who === 'bot') {
      const safeText = escapeHtml(text).replace(/\n/g, '<br>');
      bubble.innerHTML = `<span class="text-violet-500 text-lg mr-2 inline-block">⚡</span>${safeText}`;
    } else {
      bubble.textContent = text;
    }

    wrapper.appendChild(bubble);
    messages.appendChild(wrapper);
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });

    if (who === 'bot') playPing();
  }

  function showTyping() {
    hideTyping();
    const el = document.createElement('div');
    el.className = 'flex items-center gap-2';
    el.id = 'typing';
    el.innerHTML =
      '<div class="w-3 h-3 rounded-full bg-sky-400/80 animate-pulse shadow-lg shadow-sky-400/40"></div><div class="text-slate-300 text-sm">NetWise is typing…</div>';
    messages.appendChild(el);
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
  }
  function hideTyping() { const t = document.getElementById('typing'); if (t) t.remove(); }

  function transitionToApp() {
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => { if (loader) loader.style.visibility = 'hidden'; }, LOADER_FADE_MS);
    }
    app.style.opacity = '1';
    app.style.pointerEvents = 'auto';
    app.removeAttribute('aria-hidden');
  }

  setTimeout(() => {
    transitionToApp();
    setConn('connected', 'Ready');
  }, LOADER_FADE_MS + ANIMATION_DELAY_MS);

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

  // ===================== GEMINI / NETWISE =====================
  async function sendToGemini(prompt) {
  const GEMINI_API_KEY = ""; // put your actual key
  const MODEL_NAME = "gemini-1.5-flash";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const textResponse = await response.text(); // read raw text
    console.log("RAW RESPONSE:", textResponse);

    let data;
    try {
      data = JSON.parse(textResponse);
    } catch {
      addMessage("bot", "⚠️ Response is not valid JSON.");
      return;
    }

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      addMessage("bot", `❌ Gemini API Error: ${data.error?.message || "Unknown"}`);
      return;
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚡No reply from Gemini.";

    addMessage("bot", reply);
  } catch (err) {
    console.error("Fetch failed:", err);
    addMessage("bot", "❌ Network error. Check console for details.");
  }
}

  const sendButton = form.querySelector('button[type="submit"]') || form.querySelector('button');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendToGemini(text);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (sendButton) sendButton.click();
    }
  });

  setTimeout(() => {
    appendMessage("Connection established. Ask a CN question.", 'bot');
  }, LOADER_FADE_MS + ANIMATION_DELAY_MS + 200);
});




