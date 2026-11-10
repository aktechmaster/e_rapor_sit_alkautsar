// ====================================================
// MAIN ENTRY POINT & CONTROLLER ROUTING
// ====================================================
document.addEventListener("DOMContentLoaded", () => {
  checkAuthSession();
  renderFormatifHeaders();
  
  document.getElementById('select-mapel').addEventListener('change', (e) => {
    updateKelasDropdown(e.target.value);
    loadActiveMenuData();
  });
  
  document.getElementById('select-kelas').addEventListener('change', () => loadActiveMenuData());
  attachTableKeyboardNav('table-formatif-body');
  attachTableKeyboardNav('table-sumatif-body');
});

function switchMenu(viewName) {
  const views = ['dashboard', 'tp', 'sumatif', 'formatif', 'katrol', 'leger', 'cetak-sts'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');
    
    const navEl = document.getElementById(`nav-${v}`);
    if (navEl) navEl.classList.remove('active');
  });
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.remove('hidden');
  const targetNav = document.getElementById(`nav-${viewName}`);
  if (targetNav) targetNav.classList.add('active');
  // KONTROL VISIBILITAS DROPDOWN HEADER MAPEL & KELAS
  const headerSelectMapel = document.getElementById('select-mapel')?.parentElement;
  const headerSelectKelas = document.getElementById('select-kelas')?.parentElement;
  if (viewName === 'leger' || viewName === 'cetak-sts') {
    if (headerSelectMapel) headerSelectMapel.classList.add('hidden');
    if (headerSelectKelas) headerSelectKelas.classList.add('hidden');
  } else {
    if (headerSelectMapel) headerSelectMapel.classList.remove('hidden');
    if (headerSelectKelas) headerSelectKelas.classList.remove('hidden');
  }
  if (window.innerWidth < 768) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (overlay) overlay.classList.add('hidden');
  }
  loadActiveMenuData();
}

function loadActiveMenuData() {
  const activeView = document.querySelector('main > div > div:not(.hidden)');
  if (!activeView) return;
  const viewId = activeView.id;
  if (viewId === 'view-tp') loadSettingTP();
  else if (viewId === 'view-sumatif') loadNilaiSumatif();
  else if (viewId === 'view-formatif') loadDataKelas();
  else if (viewId === 'view-katrol') loadKatrol();
  else if (viewId === 'view-leger') loadLegerSTS();
  else if (viewId === 'view-cetak-sts') loadCetakRaporSTS();
}

function populateDropdowns(user) {
  const selectMapel = document.getElementById('select-mapel');
  const selectKelas = document.getElementById('select-kelas');
  selectMapel.innerHTML = '<option value="">-- Pilih Mapel --</option>';
  selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
  
  MAPEL_KELAS_MAPPING = {};
  const hakAksesString = user.hak_akses_mengajar || user.mapel_diajar; 
  if (hakAksesString) {
    const mapelGroups = hakAksesString.split('|').map(s => s.trim());
    mapelGroups.forEach(group => {
      if (!group) return;
      const [mpId, kelasStr] = group.split(':');
      if (mpId && kelasStr) {
        const cleanMpId = mpId.trim();
        MAPEL_KELAS_MAPPING[cleanMpId] = kelasStr.split(',').map(k => k.trim());
        const mapelInfo = CONFIG.MAPEL_DB[cleanMpId];
        if (mapelInfo) {
          selectMapel.innerHTML += `<option value="${cleanMpId}">${mapelInfo.nama}</option>`;
        }
      }
    });
  }
  if (user.walas_kelas) {
    let exists = false;
    for (let i = 0; i < selectKelas.options.length; i++) {
      if (selectKelas.options[i].value === user.walas_kelas) exists = true;
    }
    if (!exists) {
      selectKelas.innerHTML += `<option value="${user.walas_kelas}">${user.walas_kelas} (Kelas Wali)</option>`;
    }
  }
}

function updateKelasDropdown(selectedMapel) {
  const selectKelas = document.getElementById('select-kelas');
  selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
  
  if (!selectedMapel || !MAPEL_KELAS_MAPPING[selectedMapel]) return;
  const kelasList = MAPEL_KELAS_MAPPING[selectedMapel];
  kelasList.forEach(kls => {
    const formattedKls = kls.replace('kls-', '').toUpperCase();
    selectKelas.innerHTML += `<option value="${formattedKls}">${formattedKls}</option>`;
  });
}

function getTingkatKelas() {
  const selectKelas = document.getElementById('select-kelas').value;
  if (!selectKelas) return null;
  const match = selectKelas.match(/\d+/);
  return match ? match[0] : null;
}
