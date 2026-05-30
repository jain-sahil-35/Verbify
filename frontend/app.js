/* ── FuncName · app.js ── */

// ── Config ──
// Change this to your deployed backend URL (e.g. https://your-app.onrender.com)
const API_BASE = 'https://verbify-3bg7.onrender.com';

// ── State ──
let conversationHistory = [];
let generatedCount = 0;
let lastGeneratedName = '';

// ── DOM refs ──
const descInput         = document.getElementById('descInput');
const genBtn            = document.getElementById('genBtn');
const resultPlaceholder = document.getElementById('resultPlaceholder');
const resultOutput      = document.getElementById('resultOutput');
const resultName        = document.getElementById('resultName');
const resultMeta        = document.getElementById('resultMeta');
const loadingState      = document.getElementById('loadingState');
const errorState        = document.getElementById('errorState');
const errorMsg          = document.getElementById('errorMsg');
const historyList       = document.getElementById('historyList');
const historyEmpty      = document.getElementById('historyEmpty');
const historyCount      = document.getElementById('historyCount');
const contextIndicator  = document.getElementById('contextIndicator');
const ctxDot            = contextIndicator.querySelector('.ctx-dot');
const ctxText           = contextIndicator.querySelector('.ctx-text');
const keepContext       = document.getElementById('keepContext');
const toast             = document.getElementById('toast');

// ── Keyboard shortcut ──
descInput.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    generate();
  }
});

// ── Context indicator ──
function updateContextIndicator() {
  const turns = conversationHistory.length / 2;
  if (turns === 0) {
    ctxDot.classList.remove('active');
    ctxText.textContent = 'No context yet';
  } else {
    ctxDot.classList.add('active');
    ctxText.textContent = `${turns} turn${turns > 1 ? 's' : ''} in context`;
  }
}

// ── Show/hide result panels ──
function showResult(name) {
  resultPlaceholder.classList.add('hidden');
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  resultOutput.classList.remove('hidden');
  resultName.textContent = name;
  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  resultMeta.textContent = `Generated ${ts} · ${keepContext.checked ? 'with context' : 'no context'}`;
  lastGeneratedName = name;
}

function showLoading() {
  resultPlaceholder.classList.add('hidden');
  resultOutput.classList.add('hidden');
  errorState.classList.add('hidden');
  loadingState.classList.remove('hidden');
}

function showError(msg) {
  resultPlaceholder.classList.add('hidden');
  resultOutput.classList.add('hidden');
  loadingState.classList.add('hidden');
  errorState.classList.remove('hidden');
  errorMsg.textContent = msg;
}

// ── Main generate function ──
async function generate() {
  const desc = descInput.value.trim();
  if (!desc) { descInput.focus(); return; }

  genBtn.disabled = true;
  showLoading();

  const history = keepContext.checked ? conversationHistory : [];

  try {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc, history })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Server error ${response.status}`);
    }

    const data = await response.json();
    const name = data.name;

    if (keepContext.checked) {
      conversationHistory.push({ role: 'user', content: desc });
      conversationHistory.push({ role: 'assistant', content: name });
      if (conversationHistory.length > 40) {
        conversationHistory = conversationHistory.slice(-40);
      }
    }

    updateContextIndicator();
    showResult(name);
    addToHistory(desc, name);
    descInput.value = '';
    descInput.focus();

  } catch (err) {
    if (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
      showError('Cannot reach the backend. Is the Python server running?');
    } else {
      showError(err.message || 'Something went wrong. Please try again.');
    }
  } finally {
    genBtn.disabled = false;
  }
}

// ── Copy ──
function copyName() {
  if (!lastGeneratedName) return;
  navigator.clipboard.writeText(lastGeneratedName).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.classList.add('copied');
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied`;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
    }, 1800);
  });
}

// ── History ──
function addToHistory(desc, name) {
  generatedCount++;
  const empty = document.getElementById('historyEmpty');
  if (empty) empty.remove();

  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `
    <span class="hist-desc" title="${escapeHtml(desc)}">${escapeHtml(desc)}</span>
    <span class="hist-name">${escapeHtml(name)}</span>
    <button class="hist-copy" onclick="event.stopPropagation(); copyToClipboard('${escapeHtml(name)}', this)">copy</button>
  `;
  item.addEventListener('click', () => copyToClipboard(name, null));
  historyList.prepend(item);
  historyCount.textContent = `${generatedCount} name${generatedCount > 1 ? 's' : ''}`;
}

function clearHistory() {
  historyList.innerHTML = '';
  const empty = document.createElement('div');
  empty.className = 'history-empty';
  empty.id = 'historyEmpty';
  empty.innerHTML = '<p>Your generated names will appear here.</p>';
  historyList.appendChild(empty);
  generatedCount = 0;
  historyCount.textContent = '0 names';
}

function clearContext() {
  conversationHistory = [];
  updateContextIndicator();
  showToast('Context cleared');
}

// ── Toast ──
let toastTimeout;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ── Clipboard helper ──
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copied: ${text}`);
    if (btn) {
      btn.textContent = '✓';
      setTimeout(() => btn.textContent = 'copy', 1500);
    }
  });
}

// ── Escape HTML ──
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── Init ──
updateContextIndicator();
