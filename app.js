/* ── Verbify · app.js · v2 ── */

// ── Config ──
// Change this to your deployed backend URL (e.g. https://verbify-3bg7.onrender.com)
// const API_BASE = 'https://verbify-3bg7.onrender.com';
const API_BASE = 'http://localhost:8000';

// ── State ──
let conversationHistory = [];   // Shared across all naming types in a session
let generatedCount      = 0;
let lastBestName        = '';   // Tracks the last best match for copy
let currentType         = 'function'; // Active naming type

// ── DOM refs ──
const descInput         = document.getElementById('descInput');
const genBtn            = document.getElementById('genBtn');
const resultPlaceholder = document.getElementById('resultPlaceholder');
const resultOutput      = document.getElementById('resultOutput');
const resultName        = document.getElementById('resultName');
const resultAltsRow     = document.getElementById('resultAltsRow');
const resultMeta        = document.getElementById('resultMeta');
const loadingState      = document.getElementById('loadingState');
const errorState        = document.getElementById('errorState');
const errorMsg          = document.getElementById('errorMsg');
const historyList       = document.getElementById('historyList');
const historyCount      = document.getElementById('historyCount');
const contextIndicator  = document.getElementById('contextIndicator');
const ctxDot            = contextIndicator.querySelector('.ctx-dot');
const ctxText           = contextIndicator.querySelector('.ctx-text');
const keepContext       = document.getElementById('keepContext');
const toast             = document.getElementById('toast');
const typeTabs          = document.getElementById('typeTabs');

// ── Type tab — placeholder text per type ──
const PLACEHOLDERS = {
  function: 'Describe what it does…\ne.g. check if the user\'s session has expired',
  variable: 'Describe what it stores…\ne.g. the total number of failed login attempts',
  class:    'Describe what it represents…\ne.g. manages database connection pooling',
  file:     'Describe the file\'s purpose…\ne.g. middleware for request authentication'
};

// ── Type tab switching ──
typeTabs.addEventListener('click', e => {
  const tab = e.target.closest('.type-tab');
  if (!tab) return;

  // Update active tab
  typeTabs.querySelectorAll('.type-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-checked', 'false');
  });
  tab.classList.add('active');
  tab.setAttribute('aria-checked', 'true');

  currentType = tab.dataset.type;
  descInput.placeholder = PLACEHOLDERS[currentType];

  // Reset result area when switching type
  resetResult();
});

// ── Keyboard shortcut (Cmd/Ctrl + Enter) ──
descInput.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    generate();
  }
});

// ── Context indicator ──
function updateContextIndicator() {
  const turns = Math.floor(conversationHistory.length / 2);
  if (turns === 0) {
    ctxDot.classList.remove('active');
    ctxText.textContent = 'No context yet';
  } else {
    ctxDot.classList.add('active');
    ctxText.textContent = `${turns} turn${turns > 1 ? 's' : ''} in context`;
  }
}

// ── Result panel states ──

function resetResult() {
  resultPlaceholder.classList.remove('hidden');
  resultOutput.classList.add('hidden');
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
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

/**
 * Render the best match and alternatives in the result panel.
 * @param {string} best
 * @param {string[]} alternatives
 * @param {string} type  - naming type used
 */
function showResult(best, alternatives, type) {
  resultPlaceholder.classList.add('hidden');
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  resultOutput.classList.remove('hidden');

  // Best match
  resultName.textContent = best;
  lastBestName = best;

  // Reset copy button state
  const copyBtn = document.getElementById('copyBtn');
  copyBtn.classList.remove('copied');
  copyBtn.innerHTML = `${COPY_ICON} Copy`;

  // Alternatives
  resultAltsRow.innerHTML = '';
  alternatives.forEach(alt => {
    const chip = document.createElement('div');
    chip.className = 'alt-chip';
    chip.innerHTML = `
      <span class="alt-name">${escapeHtml(alt)}</span>
      <button class="alt-copy-btn" onclick="copyAlt('${escapeHtml(alt)}', this)" title="Copy ${escapeHtml(alt)}">
        ${COPY_ICON}
      </button>
    `;
    resultAltsRow.appendChild(chip);
  });

  // Meta line
  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  resultMeta.textContent = `${type} · ${ts} · ${keepContext.checked ? 'with context' : 'no context'}`;
}

// ── SVG icon constant (avoids repetition) ──
const COPY_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const CHECK_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;

// ── Main generate function ──
async function generate() {
  const desc = descInput.value.trim();
  if (!desc) {
    descInput.focus();
    shakeInput();
    return;
  }

  genBtn.disabled = true;
  showLoading();

  const history = keepContext.checked ? conversationHistory : [];

  try {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: currentType,
        description: desc,
        history
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Server error ${response.status}`);
    }

    const data = await response.json();

    // Guard: ensure we have a usable response
    if (!data.best) {
      throw new Error('Invalid response from server. Please try again.');
    }

    const best = data.best;
    const alternatives = Array.isArray(data.alternatives) ? data.alternatives : [];

    // Update conversation history (store best name as the assistant turn)
    if (keepContext.checked) {
      conversationHistory.push({ role: 'user', content: `[${currentType}] ${desc}` });
      conversationHistory.push({ role: 'assistant', content: best });
      // Cap at 20 turns (40 messages) to stay within token limits
      if (conversationHistory.length > 40) {
        conversationHistory = conversationHistory.slice(-40);
      }
    }

    updateContextIndicator();
    showResult(best, alternatives, currentType);
    addToHistory(desc, best, alternatives, currentType);
    descInput.value = '';
    descInput.focus();

  } catch (err) {
    // Network error detection
    if (
      err.message.includes('Failed to fetch') ||
      err.message.includes('NetworkError') ||
      err.message.includes('fetch')
    ) {
      showError('Cannot reach the backend. Is the server running?');
    } else {
      showError(err.message || 'Something went wrong. Please try again.');
    }
  } finally {
    genBtn.disabled = false;
  }
}

// ── Copy helpers ──

/** Copy the best match name */
function copyBest() {
  if (!lastBestName) return;
  copyToClipboard(lastBestName, document.getElementById('copyBtn'));
}

/** Copy an alternative name; btn is the button element that was clicked */
function copyAlt(name, btn) {
  copyToClipboard(name, btn);
}

/**
 * Copies text to clipboard and provides button feedback.
 * @param {string} text
 * @param {HTMLButtonElement|null} btn  - button to animate (optional)
 */
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copied: ${text}`);
    if (btn) {
      const original = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = `${CHECK_ICON} Copied`;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = original;
      }, 1800);
    }
  }).catch(() => {
    showToast('Copy failed — please copy manually.');
  });
}

// ── History ──

/**
 * Prepend a history item for the latest generation.
 * @param {string}   desc          - user description
 * @param {string}   best          - best generated name
 * @param {string[]} alternatives  - alternative names
 * @param {string}   type          - naming type
 */
function addToHistory(desc, best, alternatives, type) {
  generatedCount++;

  // Remove empty state placeholder on first entry
  const empty = document.getElementById('historyEmpty');
  if (empty) empty.remove();

  const altsHtml = alternatives.map(a =>
    `<span class="hist-alt" onclick="event.stopPropagation(); copyToClipboard('${escapeHtml(a)}', null)">${escapeHtml(a)}</span>`
  ).join('');

  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `
    <div class="hist-left">
      <span class="hist-type-badge hist-${type}">${type}</span>
      <span class="hist-desc" title="${escapeHtml(desc)}">${escapeHtml(desc)}</span>
    </div>
    <div class="hist-right">
      <span class="hist-name">${escapeHtml(best)}</span>
      <div class="hist-alts">${altsHtml}</div>
    </div>
    <button class="hist-copy" onclick="event.stopPropagation(); copyToClipboard('${escapeHtml(best)}', this)">copy</button>
  `;
  // Click anywhere on row copies the best name
  item.addEventListener('click', () => copyToClipboard(best, null));

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
  toast.classList.remove('hidden');
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ── Input shake animation on empty submit ──
function shakeInput() {
  descInput.classList.add('shake');
  setTimeout(() => descInput.classList.remove('shake'), 400);
}

// ── Escape HTML ──
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Init ──
updateContextIndicator();
