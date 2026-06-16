// public/js/app.js — CampusNav v4.0 UNIFIED SEARCH ENGINE
// Combines: Keyword Search + AI/NLP Search + Fuzzy Search + Voice Search
// One search bar handles everything. No separate AI section.
// Theme toggle (dark/light) with localStorage persistence.

'use strict';

// ════════════════════════════════════════════════════════════════
// CONSTANTS & STATE
// ════════════════════════════════════════════════════════════════
const TYPE_ICONS = { faculty:'👨‍🏫', lab:'🔬', office:'🏢', facility:'🍽️' };

let currentFilter      = 'all';
let currentResults     = [];
let autocompleteTimer  = null;
let voiceRecognition   = null;
let isListening        = false;
let lastSearchMode     = '';   // 'keyword' | 'ai' | 'fuzzy' | 'filter'

// ════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initVoiceSearch();
  bindSearchInput();
});

// ════════════════════════════════════════════════════════════════
// THEME TOGGLE — dark / light, persisted in localStorage
// ════════════════════════════════════════════════════════════════
function initTheme() {
  const saved = localStorage.getItem('campusnav_theme') || 'dark';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('campusnav_theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Expose globally for onclick in HTML
window.toggleTheme = toggleTheme;

// Wire theme toggle button
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggle');
  if (btn) btn.addEventListener('click', toggleTheme);
});

// ════════════════════════════════════════════════════════════════
// VOICE SEARCH — Web Speech API
// ════════════════════════════════════════════════════════════════
function initVoiceSearch() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = document.getElementById('micBtn');

  if (!SpeechRecognition) {
    // Browser doesn't support — gracefully disable mic button
    if (micBtn) {
      micBtn.style.opacity = '0.35';
      micBtn.style.cursor  = 'not-allowed';
      micBtn.title = 'Voice search not supported. Try Chrome or Edge.';
    }
    return;
  }

  voiceRecognition = new SpeechRecognition();
  voiceRecognition.lang             = 'en-IN';
  voiceRecognition.continuous       = false;
  voiceRecognition.interimResults   = false;
  voiceRecognition.maxAlternatives  = 1;

  voiceRecognition.onstart = () => {
    isListening = true;
    setMicListening(true);
    setVoiceStatus('🎤 Listening... speak now', 'listening');
  };

  voiceRecognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript.trim();
    const input = document.getElementById('searchInput');
    if (input) input.value = transcript;
    setVoiceStatus(`✅ Got: "${transcript}"`, 'success');
    setTimeout(() => {
      hideVoiceStatus();
      performSearch();
    }, 500);
  };

  voiceRecognition.onerror = (e) => {
    isListening = false;
    setMicListening(false);
    const msgs = {
      'no-speech':    'No speech detected. Try again.',
      'audio-capture':'Microphone not found.',
      'not-allowed':  'Mic permission denied — please allow in browser settings.',
      'network':      'Network error during voice recognition.',
      'aborted':      'Voice search cancelled.',
    };
    setVoiceStatus('⚠️ ' + (msgs[e.error] || 'Voice error: ' + e.error), 'error');
    setTimeout(hideVoiceStatus, 3500);
  };

  voiceRecognition.onend = () => {
    isListening = false;
    setMicListening(false);
  };
}

function toggleVoiceSearch() {
  if (!voiceRecognition) {
    showToast('Voice search requires Chrome or Edge browser', 'error');
    return;
  }
  if (isListening) {
    voiceRecognition.stop();
    hideVoiceStatus();
  } else {
    try {
      voiceRecognition.start();
    } catch {
      voiceRecognition.stop();
      setTimeout(() => voiceRecognition.start(), 300);
    }
  }
}

function setMicListening(active) {
  const btn  = document.getElementById('micBtn');
  const ring = document.getElementById('micPulseRing');
  if (!btn) return;
  btn.classList.toggle('is-listening', active);
  btn.title = active ? 'Click to stop' : 'Click to speak';
  if (ring) ring.style.display = active ? 'block' : 'none';
}

function setVoiceStatus(msg, type) {
  const el = document.getElementById('voiceStatus');
  if (!el) return;
  el.textContent = msg;
  el.className   = `voice-status show ${type}`;
}

function hideVoiceStatus() {
  const el = document.getElementById('voiceStatus');
  if (el) el.className = 'voice-status';
}

// ════════════════════════════════════════════════════════════════
// SEARCH INPUT BINDINGS
// ════════════════════════════════════════════════════════════════
function bindSearchInput() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  // Enter key triggers search
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { closeAutocomplete(); performSearch(); }
    if (e.key === 'Escape') closeAutocomplete();
  });

  // Autocomplete while typing
  input.addEventListener('input', (e) => {
    clearTimeout(autocompleteTimer);
    const q = e.target.value.trim();
    if (q.length < 2) { closeAutocomplete(); return; }
    autocompleteTimer = setTimeout(() => fetchAutocomplete(q), 280);
  });

  // Close autocomplete on outside click
  document.addEventListener('click', (e) => {
    const box = document.getElementById('searchBox');
    if (box && !box.contains(e.target)) closeAutocomplete();
  });
}

// ════════════════════════════════════════════════════════════════
// UNIFIED SEARCH — THE CORE ENGINE
// Decides automatically: simple keyword → API search
// OR natural language → AI endpoint → falls back to keyword
// ════════════════════════════════════════════════════════════════
async function performSearch() {
  const query = (document.getElementById('searchInput')?.value || '').trim();
  closeAutocomplete();

  // No query + no filter = show browse section
  if (!query && currentFilter === 'all') {
    resetSearch();
    return;
  }

  showLoading();

  try {
    // Decide search strategy:
    // If the query looks like natural language (>3 words, or contains question words),
    // use the AI endpoint. Otherwise use the fast keyword endpoint.
    const useAI = shouldUseAI(query);

    let results = [];
    let mode    = 'keyword';

    if (useAI && query) {
      // Try AI search first
      const aiData = await callAiSearch(query);
      if (aiData.success && aiData.locations?.length) {
        results = aiData.locations;
        mode    = aiData.method === 'fuzzy' ? 'fuzzy' : 'ai';
      }
    }

    // If AI found nothing or we're doing simple keyword search, use normal API
    if (!results.length) {
      const kwData = await callKeywordSearch(query, currentFilter);
      if (kwData.success && kwData.data?.length) {
        results = kwData.data;
        mode    = 'keyword';
      }
    }

    // If filter-only (no query), mode is filter
    if (!query && currentFilter !== 'all') mode = 'filter';

    showResults(results, query, mode);

  } catch (err) {
    hideLoading();
    showToast('Connection error. Is the server running?', 'error');
    console.error('Search error:', err);
  }
}

// Heuristic: natural language if query is 3+ words or starts with a question word
function shouldUseAI(query) {
  if (!query) return false;
  const words = query.trim().split(/\s+/);
  const questionWords = ['where', 'find', 'show', 'who', 'what', 'how', 'locate', 'want', 'need', 'visit', 'take', 'looking'];
  const firstWord = words[0].toLowerCase();
  return words.length >= 3 || questionWords.includes(firstWord);
}

async function callAiSearch(query) {
  const res  = await fetch('/api/ai/search', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ query }),
  });
  return res.json();
}

async function callKeywordSearch(query, type) {
  const params = new URLSearchParams();
  if (query)                  params.set('q', query);
  if (type && type !== 'all') params.set('type', type);
  const res = await fetch(`/api/search?${params.toString()}`);
  return res.json();
}

// ════════════════════════════════════════════════════════════════
// FILTER MANAGEMENT
// ════════════════════════════════════════════════════════════════
function setFilter(btnEl) {
  currentFilter = btnEl.dataset.type;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  btnEl.classList.add('active');
  const q = document.getElementById('searchInput')?.value.trim();
  if (q || currentFilter !== 'all') performSearch();
}

function quickFilter(type) {
  currentFilter = type;
  document.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.dataset.type === type));
  document.getElementById('searchInput').value = '';
  performSearch();
  document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ════════════════════════════════════════════════════════════════
// RENDER RESULTS
// ════════════════════════════════════════════════════════════════
function showResults(locations, query, mode) {
  hideLoading();
  currentResults = locations;

  const section = document.getElementById('resultsSection');
  const grid    = document.getElementById('resultsGrid');
  const empty   = document.getElementById('emptyState');
  const browse  = document.getElementById('browseSection');

  section.style.display = 'block';
  browse.style.display  = 'none';

  // Update meta bar
  updateMeta(locations.length, query, mode);

  if (!locations.length) {
    grid.style.display  = 'none';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  grid.style.display  = 'grid';

  grid.innerHTML = locations.map((loc, i) => `
    <div class="location-card" onclick="openModal('${loc._id}')" style="animation-delay:${i*0.04}s" role="button" tabindex="0">
      <div class="card-header">
        <div>
          <div class="card-name">${esc(loc.name)}</div>
          ${loc.department ? `<div class="card-dept">📚 ${esc(loc.department)}</div>` : ''}
        </div>
        <span class="card-type-badge type-${loc.type}">${TYPE_ICONS[loc.type]||'📍'} ${loc.type}</span>
      </div>
      <div class="card-details">
        <div class="card-detail">
          <div class="detail-icon">🚪</div>
          <div><div class="detail-label">Room</div><div class="detail-value">${esc(loc.room)}</div></div>
        </div>
        <div class="card-detail">
          <div class="detail-icon">🏗️</div>
          <div><div class="detail-label">Floor</div><div class="detail-value">${esc(loc.floor)}</div></div>
        </div>
        <div class="card-detail">
          <div class="detail-icon">🏛️</div>
          <div><div class="detail-label">Block</div><div class="detail-value">${esc(loc.block)}</div></div>
        </div>
      </div>
    </div>`).join('');
}

function updateMeta(count, query, mode) {
  const countEl  = document.getElementById('resultsCount');
  const badgeEl  = document.getElementById('resultsModeBadge');
  const filterEl = document.getElementById('activeFilter');

  countEl.textContent = `${count} result${count!==1?'s':''}${query?` for "${esc(query)}"`:' in category'}`;

  const modeCfg = {
    ai:      { label:'🤖 AI match',      cls:'mode-ai' },
    keyword: { label:'🔍 Keyword match',  cls:'mode-keyword' },
    fuzzy:   { label:'🔀 Fuzzy match',    cls:'mode-fuzzy' },
    filter:  { label:'🏷️ Category',        cls:'mode-keyword' },
  };
  const m = modeCfg[mode] || modeCfg.keyword;
  badgeEl.textContent = m.label;
  badgeEl.className   = `results-mode-badge ${m.cls}`;

  if (currentFilter !== 'all') {
    filterEl.textContent  = currentFilter;
    filterEl.style.display = 'inline';
  } else {
    filterEl.style.display = 'none';
  }
}

// ════════════════════════════════════════════════════════════════
// DETAIL MODAL
// ════════════════════════════════════════════════════════════════
function openModal(id) {
  const loc = currentResults.find(l => l._id === id);
  if (!loc) return;

  document.getElementById('modalContent').innerHTML = `
    <span class="modal-type-badge type-${loc.type}">${TYPE_ICONS[loc.type]||'📍'} ${loc.type}</span>
    <div class="modal-name">${esc(loc.name)}</div>
    <div class="modal-dept">${loc.department ? '📚 '+esc(loc.department) : '&nbsp;'}</div>
    <div class="modal-details">
      <div class="modal-detail-box">
        <div class="modal-detail-label">🚪 Room</div>
        <div class="modal-detail-value">${esc(loc.room)}</div>
      </div>
      <div class="modal-detail-box">
        <div class="modal-detail-label">🏗️ Floor</div>
        <div class="modal-detail-value">${esc(loc.floor)}</div>
      </div>
      <div class="modal-detail-box">
        <div class="modal-detail-label">🏛️ Block</div>
        <div class="modal-detail-value">${esc(loc.block)}</div>
      </div>
      ${loc.department ? `<div class="modal-detail-box">
        <div class="modal-detail-label">📚 Department</div>
        <div class="modal-detail-value" style="font-size:0.82rem">${esc(loc.department)}</div>
      </div>` : ''}
    </div>
    ${loc.description ? `<div class="modal-desc">💡 ${esc(loc.description)}</div>` : ''}`;

  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ════════════════════════════════════════════════════════════════
// AUTOCOMPLETE
// ════════════════════════════════════════════════════════════════
async function fetchAutocomplete(query) {
  try {
    const res  = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.success && data.data.length) renderAutocomplete(data.data, query);
    else closeAutocomplete();
  } catch { closeAutocomplete(); }
}

function renderAutocomplete(items, query) {
  const dropdown = document.getElementById('autocompleteDropdown');
  dropdown.innerHTML = items.map(item => `
    <div class="autocomplete-item" onclick="selectAutocomplete('${esc(item.name).replace(/'/g,"\\'")}')">
      <div class="autocomplete-type-icon">${TYPE_ICONS[item.type]||'📍'}</div>
      <div>
        <div class="autocomplete-name">${highlight(esc(item.name), query)}</div>
        <div class="autocomplete-meta">${item.type}${item.department ? ' · '+esc(item.department) : ''}</div>
      </div>
    </div>`).join('');
  dropdown.classList.add('open');
}

function selectAutocomplete(name) {
  document.getElementById('searchInput').value = name;
  closeAutocomplete();
  performSearch();
}

function closeAutocomplete() {
  const d = document.getElementById('autocompleteDropdown');
  if (d) { d.classList.remove('open'); d.innerHTML = ''; }
}

function highlight(text, q) {
  if (!q) return text;
  return text.replace(new RegExp(`(${escReg(q)})`, 'gi'), '<strong style="color:var(--cyan)">$1</strong>');
}

// ════════════════════════════════════════════════════════════════
// UI HELPERS
// ════════════════════════════════════════════════════════════════
function showLoading() {
  document.getElementById('resultsSection').style.display = 'block';
  document.getElementById('browseSection').style.display  = 'none';
  document.getElementById('loadingState').style.display   = 'block';
  document.getElementById('resultsGrid').style.display    = 'none';
  document.getElementById('emptyState').style.display     = 'none';
}

function hideLoading() {
  document.getElementById('loadingState').style.display = 'none';
}

function resetSearch() {
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  currentFilter  = 'all';
  currentResults = [];
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  const allPill = document.querySelector('.pill[data-type="all"]');
  if (allPill) allPill.classList.add('active');
  document.getElementById('resultsSection').style.display = 'none';
  document.getElementById('browseSection').style.display  = 'block';
  document.getElementById('loadingState').style.display   = 'none';
  document.getElementById('resultsGrid').innerHTML        = '';
  document.getElementById('emptyState').style.display     = 'none';
}

// ════════════════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════════════════
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent  = msg;
  t.className    = `toast show ${type}`;
  setTimeout(() => { t.className = 'toast'; }, 3200);
}

// ════════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════════
function esc(t) {
  if (!t) return '';
  return String(t)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function escReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

// Expose globals needed by HTML onclick attributes
window.performSearch    = performSearch;
window.setFilter        = setFilter;
window.quickFilter      = quickFilter;
window.openModal        = openModal;
window.closeModal       = closeModal;
window.toggleVoiceSearch= toggleVoiceSearch;
window.resetSearch      = resetSearch;
window.selectAutocomplete = selectAutocomplete;
