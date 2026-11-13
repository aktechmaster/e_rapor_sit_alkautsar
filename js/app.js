// ====================================================
// MAIN ENTRY POINT & CONTROLLER ROUTING
// ====================================================
document.addEventListener("DOMContentLoaded", () => {
  checkAuthSession();
  renderFormatifHeaders();

  const selectMapel = document.getElementById('select-mapel');
  if (selectMapel) {
    selectMapel.addEventListener('change', (e) => {
      updateKelasDropdown(e.target.value);
      loadActiveMenuData();
    });
  }

  const selectKelas = document.getElementById('select-kelas');
  if (selectKelas) {
    selectKelas.addEventListener('change', () => loadActiveMenuData());
  }

  attachTableKeyboardNav('table-formatif-body');
  attachTableKeyboardNav('table-sumatif-body');
});

function switchMenu(viewName, semester = null) {
  if (semester !== null && semester !== undefined) {
    if (viewName === 'leger-sas') {
      STATE.currentSasSemester = Number(semester);
    } else {
      STATE.currentStsSemester = Number(semester);
    }
  }

  const views = ['dashboard', 'tp', 'sumatif', 'formatif', 'katrol', 'leger', 'leger-sas'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');

    const navEl = document.getElementById(`nav-${v}`);
    if (navEl) navEl.classList.remove('active');
  });

  // Reset highlight sub-nav STS & SAS
  [
    'nav-leger-sts1', 'nav-cetak-sts1', 'nav-leger-sts2', 'nav-cetak-sts2',
    'nav-leger-sas1', 'nav-cetak-sas1', 'nav-leger-sas2', 'nav-cetak-sas2'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  // Tampilkan View Target
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.remove('hidden');

  // Highlight Sub-Nav Aktif atau Main Nav
  if (viewName === 'leger') {
    const activeSubNavId = `nav-leger-sts${STATE.currentStsSemester}`;
    const targetSubNav = document.getElementById(activeSubNavId);
    if (targetSubNav) targetSubNav.classList.add('active');
  } else if (viewName === 'leger-sas') {
    const activeSubNavId = `nav-leger-sas${STATE.currentSasSemester}`;
    const targetSubNav = document.getElementById(activeSubNavId);
    if (targetSubNav) targetSubNav.classList.add('active');
  } else {
    const targetNav = document.getElementById(`nav-${viewName}`);
    if (targetNav) targetNav.classList.add('active');
  }

  // KONTROL VISIBILITAS DROPDOWN HEADER MAPEL & KELAS
  const headerSelectMapel = document.getElementById('select-mapel')?.parentElement;
  const headerSelectKelas = document.getElementById('select-kelas')?.parentElement;
  if (viewName === 'leger' || viewName === 'leger-sas') {
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

  loadActiveMenuData(viewName);
}

// BUKA HALAMAN CETAK RAPOR SAS DI TAB BARU (cetak-sas.html)
function bukaCetakSAS(semester) {
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;
  if (!kelasWalas) {
    alert("Akun Anda tidak terdaftar sebagai Wali Kelas!");
    return;
  }

  const sem = Number(semester) || 1;
  STATE.currentSasSemester = sem;

  sessionStorage.setItem("ERAPOR_PRINT_USER", JSON.stringify(STATE.currentUser));
  sessionStorage.setItem("ERAPOR_PRINT_SAS_SEM", String(sem));

  const cacheKey = `${sem}_${kelasWalas}`;
  if (typeof LEGER_SAS_CACHE !== "undefined" && LEGER_SAS_CACHE[cacheKey]) {
    sessionStorage.setItem(`ERAPOR_LEGER_SAS_${cacheKey}`, JSON.stringify(LEGER_SAS_CACHE[cacheKey]));
  }

  window.open(`cetak-sas.html?sem=${sem}`, "_blank");
}

// TOGGLE SUBMENU RAPOR SAS
function toggleSasSubmenu() {
  const submenu = document.getElementById('sas-submenu');
  const arrow = document.getElementById('sas-arrow');
  if (submenu) {
    submenu.classList.toggle('hidden');
    if (arrow) arrow.classList.toggle('rotate-180');
  }
}

function loadActiveMenuData(targetViewName = null) {
  let viewId = targetViewName ? `view-${targetViewName}` : null;

  if (!viewId) {
    const activeView = document.querySelector('[id^="view-"]:not(.hidden)');
    if (activeView) viewId = activeView.id;
  }

  if (!viewId) return;

  if (viewId === 'view-tp') loadSettingTP();
  else if (viewId === 'view-sumatif') loadNilaiSumatif();
  else if (viewId === 'view-formatif') loadDataKelas();
  else if (viewId === 'view-katrol') loadKatrol();
  else if (viewId === 'view-leger') {
    if (typeof loadLegerSTS === 'function') {
      loadLegerSTS();
  else if (viewId === 'view-leger-sas') {
    if (typeof loadLegerSAS === 'function') {
      loadLegerSAS();
    }
  }
    }
  }
}

function populateDropdowns(user) {
  const selectMapel = document.getElementById('select-mapel');
  const selectKelas = document.getElementById('select-kelas');
  if (!selectMapel || !selectKelas) return;

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

  if (selectMapel.options.length === 2) {
    selectMapel.selectedIndex = 1;
    updateKelasDropdown(selectMapel.value);
  }

  const navStsGroup = document.getElementById('nav-sts-group');
  if (navStsGroup) {
    if (user && user.walas_kelas) {
      navStsGroup.classList.remove('hidden');
    } else {
      navStsGroup.classList.add('hidden');
  const navSasGroup = document.getElementById('nav-sas-group');
  if (navSasGroup) {
    if (user && user.walas_kelas) {
      navSasGroup.classList.remove('hidden');
    } else {
      navSasGroup.classList.add('hidden');
    }
  }
    }
  }
}

function updateKelasDropdown(selectedMapel) {
  const selectKelas = document.getElementById('select-kelas');
  if (!selectKelas) return;

  selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';

  if (!selectedMapel || !MAPEL_KELAS_MAPPING[selectedMapel]) return;

  const kelasList = MAPEL_KELAS_MAPPING[selectedMapel];
  kelasList.forEach(kls => {
    const formattedKls = kls.replace(/^kls-/i, '').toUpperCase();
    selectKelas.innerHTML += `<option value="${formattedKls}">${formattedKls}</option>`;
  });
}

function getTingkatKelas() {
  const selectKelas = document.getElementById('select-kelas');
  if (!selectKelas || !selectKelas.value) return null;
  const match = selectKelas.value.match(/\d+/);
  return match ? match[0] : null;
}
