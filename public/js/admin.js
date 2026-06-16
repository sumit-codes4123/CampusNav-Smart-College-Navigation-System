// public/js/admin.js  — Admin Panel JavaScript with JWT Authentication

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
const getToken    = ()  => localStorage.getItem('campusnav_token');
const getAdminInfo= ()  => { try { return JSON.parse(localStorage.getItem('campusnav_admin')||'{}'); } catch { return {}; } };

// Build Authorization header for all protected API calls
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

// ─── THEME — synced with student page via localStorage ─────────────────────────────────────────────────────────
function initAdminTheme() {
  const saved = localStorage.getItem('campusnav_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('adminThemeToggle');
  if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
}

function toggleAdminTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('campusnav_theme', next);
  const btn = document.getElementById('adminThemeToggle');
  if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
}

// ─── PAGE INIT — runs on every load ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAdminTheme();
  checkAuth();
  const toggleBtn = document.getElementById('adminThemeToggle');
  if (toggleBtn) toggleBtn.addEventListener('click', toggleAdminTheme);
});
// Check if the user already has a valid token
async function checkAuth() {
  const token = getToken();

  if (!token) {
    showLoginScreen();
    return;
  }

  // Verify the token is still valid with the server
  try {
    const res  = await fetch('/api/auth/verify', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.success) {
      showDashboard(data.admin);
    } else {
      // Token expired or invalid — clear storage and show login
      clearAuth();
      showLoginScreen();
    }
  } catch {
    // Server unreachable — show login as safe fallback
    clearAuth();
    showLoginScreen();
  }
}

// ─── SHOW / HIDE SCREENS ──────────────────────────────────────────────────────
function showLoginScreen() {
  document.getElementById('loginScreen').style.display    = 'flex';
  document.getElementById('adminDashboard').classList.remove('visible');
}

function showDashboard(admin) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminDashboard').classList.add('visible');

  // Update navbar with user info
  document.getElementById('navUserName').textContent = admin.displayName || admin.username || 'Admin';
  document.getElementById('navUserRole').textContent = admin.role || 'staff';

  // Load data
  loadAllLocations();
}

// ─── LOGIN FORM ───────────────────────────────────────────────────────────────
async function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginBtn');

  // Hide previous error
  hideLoginError();

  if (!username || !password) {
    showLoginError('Please enter your username and password');
    return;
  }

  // Show loading state
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const res  = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (data.success) {
      // Save token and admin info
      localStorage.setItem('campusnav_token', data.token);
      localStorage.setItem('campusnav_admin', JSON.stringify(data.admin));
      showDashboard(data.admin);
    } else {
      showLoginError(data.message || 'Invalid username or password');
    }
  } catch {
    showLoginError('Connection error. Is the server running?');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
function handleLogout() {
  clearAuth();
  // Per the spec: remove token, role, redirect to admin page (shows login)
  window.location.href = '/admin';
}

function clearAuth() {
  localStorage.removeItem('campusnav_token');
  localStorage.removeItem('campusnav_admin');
  localStorage.removeItem('role'); // legacy key cleanup
}

// ─── LOGIN UI HELPERS ─────────────────────────────────────────────────────────
function showLoginError(msg) {
  document.getElementById('loginErrorMsg').textContent = msg;
  document.getElementById('loginError').classList.add('show');
}
function hideLoginError() {
  document.getElementById('loginError').classList.remove('show');
}

function togglePassword() {
  const input = document.getElementById('loginPassword');
  const icon  = document.getElementById('pwEyeIcon');
  if (input.type === 'password') {
    input.type  = 'text';
    icon.textContent = '🙈';
  } else {
    input.type  = 'password';
    icon.textContent = '👁️';
  }
}

// ─── STATE ────────────────────────────────────────────────────────────────────
let allLocations      = [];
let filteredLocations = [];
let activeTypeFilter  = 'all';

// ─── LOAD LOCATIONS ───────────────────────────────────────────────────────────
async function loadAllLocations() {
  try {
    const res  = await fetch('/api/locations'); // public route — no auth needed
    const data = await res.json();
    if (data.success) {
      allLocations = data.data;
      applyFilter();
      updateStats();
    }
  } catch {
    showToast('Failed to load locations', 'error');
  }
}

function applyFilter() {
  filteredLocations = activeTypeFilter === 'all'
    ? [...allLocations]
    : allLocations.filter(l => l.type === activeTypeFilter);
  renderAdminList(filteredLocations);
}

function filterAdmin(btnEl) {
  activeTypeFilter = btnEl.dataset.type;
  document.querySelectorAll('.sidebar-filter').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');
  applyFilter();
  showPanel('list');
}

function adminSearch(query) {
  const q = query.toLowerCase().trim();
  if (!q) { renderAdminList(filteredLocations); return; }
  renderAdminList(filteredLocations.filter(l =>
    l.name.toLowerCase().includes(q) ||
    l.room.toLowerCase().includes(q) ||
    l.block.toLowerCase().includes(q) ||
    (l.department && l.department.toLowerCase().includes(q))
  ));
}

function renderAdminList(locations) {
  const list = document.getElementById('adminLocationList');
  if (!locations.length) { list.innerHTML='<div class="no-results-admin">No locations found</div>'; return; }
  list.innerHTML = locations.map(loc => `
    <div class="admin-list-item">
      <div class="list-item-info">
        <div class="list-item-name">${esc(loc.name)}</div>
        <div class="list-item-meta">
          <span class="card-type-badge type-${loc.type}" style="font-size:0.65rem;padding:2px 8px">${loc.type}</span>
          &nbsp;${esc(loc.room)} · ${esc(loc.floor)} · ${esc(loc.block)}
          ${loc.department?' · '+esc(loc.department):''}
        </div>
      </div>
      <div class="list-item-actions">
        <button class="action-btn edit"   onclick="openEdit('${loc._id}')">✏️ Edit</button>
        <button class="action-btn delete" onclick="confirmDelete('${loc._id}','${esc(loc.name).replace(/'/g,"\\'")}')">🗑️ Delete</button>
      </div>
    </div>`).join('');
}

function updateStats() {
  const c = (t) => allLocations.filter(l => l.type===t).length;
  document.getElementById('adminStats').innerHTML = `
    <div class="stat-chip">📊 Total: ${allLocations.length}</div>
    <div class="stat-chip">👨‍🏫 Faculty: ${c('faculty')}</div>
    <div class="stat-chip">🔬 Labs: ${c('lab')}</div>
    <div class="stat-chip">🏢 Offices: ${c('office')}</div>
    <div class="stat-chip">🍽️ Facilities: ${c('facility')}</div>`;
}

// ─── PANELS ───────────────────────────────────────────────────────────────────
function showPanel(panel) {
  ['addPanel','listPanel','editPanel'].forEach(id => document.getElementById(id).style.display='none');
  document.getElementById('btnShowAdd').classList.toggle('active',  panel==='add');
  document.getElementById('btnShowList').classList.toggle('active', panel==='list');
  if (panel === 'list') { document.getElementById('listPanel').style.display='block'; loadAllLocations(); }
  if (panel === 'add')  document.getElementById('addPanel').style.display='block';
  if (panel === 'edit') document.getElementById('editPanel').style.display='block';
}

// ─── ADD ──────────────────────────────────────────────────────────────────────
async function addLocation() {
  const name     = document.getElementById('addName').value.trim();
  const type     = document.getElementById('addType').value;
  const room     = document.getElementById('addRoom').value.trim();
  const floor    = document.getElementById('addFloor').value.trim();
  const block    = document.getElementById('addBlock').value.trim();
  const dept     = document.getElementById('addDept').value.trim();
  const keywords = document.getElementById('addKeywords').value.trim();
  const desc     = document.getElementById('addDesc').value.trim();

  if (!name||!type||!room||!floor||!block) { showToast('Please fill all required fields (*)','error'); return; }

  try {
    const res  = await fetch('/api/add-location', {
      method:  'POST',
      headers: authHeaders(),   // ← JWT token attached
      body:    JSON.stringify({ name,type,room,floor,block,department:dept,keywords,description:desc }),
    });
    const data = await res.json();

    if (res.status === 401) { handleAuthError(); return; }
    if (data.success) {
      showToast('✅ Location added!','success');
      clearAddForm();
      loadAllLocations();
    } else {
      showToast(data.message||'Failed to add','error');
    }
  } catch { showToast('Server error','error'); }
}

function clearAddForm() {
  ['addName','addType','addRoom','addFloor','addBlock','addDept','addKeywords','addDesc']
    .forEach(id => { document.getElementById(id).value=''; });
}

// ─── EDIT ─────────────────────────────────────────────────────────────────────
function openEdit(id) {
  const loc = allLocations.find(l => l._id===id);
  if (!loc) return;
  document.getElementById('editId').value       = loc._id;
  document.getElementById('editName').value     = loc.name;
  document.getElementById('editType').value     = loc.type;
  document.getElementById('editRoom').value     = loc.room;
  document.getElementById('editFloor').value    = loc.floor;
  document.getElementById('editBlock').value    = loc.block;
  document.getElementById('editDept').value     = loc.department||'';
  document.getElementById('editKeywords').value = (loc.keywords||[]).join(', ');
  document.getElementById('editDesc').value     = loc.description||'';
  showPanel('edit');
}

async function saveEdit() {
  const id       = document.getElementById('editId').value;
  const name     = document.getElementById('editName').value.trim();
  const type     = document.getElementById('editType').value;
  const room     = document.getElementById('editRoom').value.trim();
  const floor    = document.getElementById('editFloor').value.trim();
  const block    = document.getElementById('editBlock').value.trim();
  const dept     = document.getElementById('editDept').value.trim();
  const keywords = document.getElementById('editKeywords').value.trim();
  const desc     = document.getElementById('editDesc').value.trim();

  if (!name||!type||!room||!floor||!block) { showToast('Please fill all required fields','error'); return; }

  try {
    const res  = await fetch(`/api/update-location/${id}`, {
      method:  'PUT',
      headers: authHeaders(),   // ← JWT token attached
      body:    JSON.stringify({ name,type,room,floor,block,department:dept,keywords,description:desc }),
    });
    const data = await res.json();

    if (res.status === 401) { handleAuthError(); return; }
    if (data.success) { showToast('✅ Location updated!','success'); loadAllLocations(); showPanel('list'); }
    else showToast(data.message||'Update failed','error');
  } catch { showToast('Server error','error'); }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
function confirmDelete(id,name) {
  if (confirm(`Delete "${name}"?\nThis cannot be undone.`)) deleteLocation(id);
}
function deleteFromEdit() { confirmDelete(document.getElementById('editId').value, document.getElementById('editName').value); }

async function deleteLocation(id) {
  try {
    const res  = await fetch(`/api/delete-location/${id}`, {
      method:  'DELETE',
      headers: authHeaders(),   // ← JWT token attached
    });
    const data = await res.json();

    if (res.status === 401) { handleAuthError(); return; }
    if (data.success) { showToast('🗑️ '+data.message,'success'); loadAllLocations(); showPanel('list'); }
    else showToast(data.message||'Delete failed','error');
  } catch { showToast('Server error','error'); }
}

// ─── AUTH ERROR HANDLER ───────────────────────────────────────────────────────
// Called when a 401 response comes back — token expired mid-session
function handleAuthError() {
  showToast('Session expired — please log in again','error');
  setTimeout(() => { clearAuth(); window.location.href='/admin'; }, 1800);
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function esc(t) { if(!t) return ''; return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function showToast(msg,type='default') {
  const t=document.getElementById('toast'); t.textContent=msg; t.className=`toast show ${type}`;
  setTimeout(()=>{t.className='toast';},3500);
}
