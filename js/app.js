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
    if (viewName === 'leger-sas' || viewName === 'sas-workspace') {
      STATE.currentSasSemester = Number(semester);
    } else {
      STATE.currentStsSemester = Number(semester);
    }
  }

  // Kompatibilitas jika ada pemanggilan lama 'leger-sas'
  const resolvedView = viewName === 'leger-sas' ? 'sas-workspace' : viewName;

  const views = ['dashboard', 'tp', 'sumatif', 'formatif', 'katrol', 'leger', 'sas-workspace', 'arsip'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');

    const navEl = document.getElementById(`nav-${v}`);
    if (navEl) navEl.classList.remove('active');
  });

  // Reset highlight sub-nav STS & SAS
  [
    'nav-leger-sts1', 'nav-cetak-sts1', 'nav-leger-sts2', 'nav-cetak-sts2',
    'nav-sas-sem1', 'nav-sas-sem2',
    'nav-leger-sas1', 'nav-cetak-sas1', 'nav-leger-sas2', 'nav-cetak-sas2'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  // Tampilkan View Target
  const targetView = document.getElementById(`view-${resolvedView}`);
  if (targetView) targetView.classList.remove('hidden');

  // Highlight Sub-Nav Aktif atau Main Nav
  if (resolvedView === 'leger') {
    const activeSubNavId = `nav-leger-sts${STATE.currentStsSemester}`;
    const targetSubNav = document.getElementById(activeSubNavId);
    if (targetSubNav) targetSubNav.classList.add('active');
  } else if (resolvedView === 'sas-workspace') {
    const activeSubNavId = `nav-sas-sem${STATE.currentSasSemester}`;
    const targetSubNav = document.getElementById(activeSubNavId);
    if (targetSubNav) targetSubNav.classList.add('active');
  } else {
    const targetNav = document.getElementById(`nav-${resolvedView}`);
    if (targetNav) targetNav.classList.add('active');
  }

  // KONTROL VISIBILITAS DROPDOWN HEADER MAPEL & KELAS
  const headerSelectMapel = document.getElementById('select-mapel')?.parentElement;
  const headerSelectKelas = document.getElementById('select-kelas')?.parentElement;
  if (resolvedView === 'leger' || resolvedView === 'sas-workspace') {
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

  loadActiveMenuData(resolvedView);
}

// BUKA WORKSPACE MODUL RAPOR SAS (8 SUB-MENU)
function openSasWorkspace(semester, initialSubTab = 'leger') {
  STATE.currentSasSemester = Number(semester) || 1;
  if (typeof CURRENT_SAS_SUBTAB !== 'undefined') {
    CURRENT_SAS_SUBTAB = initialSubTab;
  }
  switchMenu('sas-workspace', STATE.currentSasSemester);
}

// BUKA HALAMAN CETAK COVER SAS (3 LEMBAR) DI TAB BARU
function bukaCetakCoverSAS(semester) {
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;
  if (!kelasWalas) {
    alert("Akun Anda tidak terdaftar sebagai Wali Kelas!");
    return;
  }

  const sem = Number(semester) || STATE.currentSasSemester || 1;
  STATE.currentSasSemester = sem;

  sessionStorage.setItem("ERAPOR_PRINT_USER", JSON.stringify(STATE.currentUser));
  sessionStorage.setItem("ERAPOR_PRINT_SAS_SEM", String(sem));

  const cacheKey = `${sem}_${kelasWalas}`;
  if (typeof LEGER_SAS_CACHE !== "undefined" && LEGER_SAS_CACHE[cacheKey]) {
    sessionStorage.setItem(`ERAPOR_LEGER_SAS_${cacheKey}`, JSON.stringify(LEGER_SAS_CACHE[cacheKey]));
  }

  window.open(`cetak-cover-sas.html?sem=${sem}`, "_blank");
}

// BUKA HALAMAN CETAK RAPOR STS DI TAB BARU (cetak-sts.html)
function bukaCetakSTS(semester) {
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;
  if (!kelasWalas) {
    alert("Akun Anda tidak terdaftar sebagai Wali Kelas!");
    return;
  }

  const sem = Number(semester) || 1;
  STATE.currentStsSemester = sem;

  sessionStorage.setItem("ERAPOR_PRINT_USER", JSON.stringify(STATE.currentUser));
  sessionStorage.setItem("ERAPOR_PRINT_SEM", String(sem));

  const cacheKey = `${sem}_${kelasWalas}`;
  if (typeof LEGER_STS_CACHE !== "undefined" && LEGER_STS_CACHE[cacheKey]) {
    sessionStorage.setItem(`ERAPOR_LEGER_${cacheKey}`, JSON.stringify(LEGER_STS_CACHE[cacheKey]));
  }

  window.open(`cetak-sts.html?sem=${sem}`, "_blank");
}

// TOGGLE SUBMENU RAPOR STS
function toggleStsSubmenu() {
  const submenu = document.getElementById('sts-submenu');
  const arrow = document.getElementById('sts-arrow');
  if (submenu) {
    submenu.classList.toggle('hidden');
    if (arrow) arrow.classList.toggle('rotate-180');
  }
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

  if (viewId === 'view-tp') {
    loadSettingTP();
  } else if (viewId === 'view-sumatif') {
    loadNilaiSumatif();
  } else if (viewId === 'view-formatif') {
    loadDataKelas();
  } else if (viewId === 'view-katrol') {
    loadKatrol();
  } else if (viewId === 'view-leger') {
    if (typeof loadLegerSTS === 'function') {
      loadLegerSTS();
    }
  } else if (viewId === 'view-sas-workspace') {
    if (typeof initSasWorkspace === 'function') {
      initSasWorkspace();
    } else if (typeof loadLegerSAS === 'function') {
      loadLegerSAS();
    }
  } else if (viewId === 'view-arsip') {
    // TAMBAHKAN BARIS INI
    if (typeof loadDataArsip === 'function') {
      loadDataArsip();
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

  // KONTROL MENU KHUSUS WALI KELAS
  const navStsGroup = document.getElementById('nav-sts-group');
  if (navStsGroup) {
    if (user && user.walas_kelas) {
      navStsGroup.classList.remove('hidden');
    } else {
      navStsGroup.classList.add('hidden');
    }
  }

  const navSasGroup = document.getElementById('nav-sas-group');
  if (navSasGroup) {
    if (user && user.walas_kelas) {
      navSasGroup.classList.remove('hidden');
    } else {
      navSasGroup.classList.add('hidden');
    }
  }

  // TAMBAHAN: KONTROL MENU ARSIP
  const navArsipGroup = document.getElementById('nav-arsip-group');
  if (navArsipGroup) {
    if (user && user.walas_kelas) {
      navArsipGroup.classList.remove('hidden');
    } else {
      navArsipGroup.classList.add('hidden');
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

async function loadDataArsip() {
  const tbody = document.getElementById('table-arsip-body');
  const metaInfo = document.getElementById('arsip-meta-info');

  // Pastikan yang login adalah Wali Kelas
  if (!STATE.currentUser || !STATE.currentUser.walas_kelas) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-red-500 font-medium">Akses Ditolak: Anda bukan Wali Kelas.</td></tr>';
    return;
  }

  const kelasWalas = STATE.currentUser.walas_kelas;
  // Gunakan semester SAS yang aktif, atau default 1
  const semester = STATE.currentSasSemester || 1; 
  
  metaInfo.textContent = `Kelas: ${kelasWalas} | Semester: ${semester}`;
  tbody.innerHTML = '<tr><td colspan="5" class="text-center p-6"><i class="fa-solid fa-circle-notch animate-spin text-indigo-500 mr-2 text-lg"></i> Memuat data siswa...</td></tr>';

  try {
    // CATATAN: Ganti bagian ini dengan fungsi pemanggilan API Anda untuk mengambil data siswa berdasarkan 'kelasWalas'
    // Contoh jika menggunakan Api.get:
    // const dataSiswa = await Api.get('getSiswaByKelas', { kelas: kelasWalas });
    
    // Ini adalah data dummy sementara agar tabel Anda langsung terisi (Hapus dan ganti dengan API asli nanti)
    const dataSiswa = [
      { nisn: "0012345678", nama: "Ahmad Fulan" },
      { nisn: "0012345679", nama: "Siti Fulanah" }
    ];

    if (!dataSiswa || dataSiswa.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">Belum ada data siswa di kelas ini.</td></tr>';
      return;
    }

    let html = '';
    dataSiswa.forEach((siswa, index) => {
      html += `
        <tr class="hover:bg-slate-50 transition">
          <td class="p-3 border-r text-center">${index + 1}</td>
          <td class="p-3 border-r text-center">${siswa.nisn || '-'}</td>
          <td class="p-3 border-r font-medium">${siswa.nama}</td>
          <td class="p-3 border-r text-center">
            <span class="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] rounded-md font-bold border border-slate-200">Belum Dibuat</span>
          </td>
          <td class="p-3 text-center">
            <button onclick="generateRaporPDF('${siswa.nisn}')" class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded text-xs font-semibold border border-blue-200 transition">
              <i class="fa-solid fa-file-pdf mr-1"></i> Buat PDF
            </button>
          </td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
  } catch (error) {
    console.error("Error memuat data arsip:", error);
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-red-500">Terjadi kesalahan saat memuat data siswa.</td></tr>';
  }
}

// Fungsi untuk tombol 1. Arsip Leger Kelas
function arsipLegerKelas() {
  console.log("Menyiapkan arsip leger kelas...");
  alert("Fitur Arsip Leger Kelas sedang dikembangkan. Nantinya tombol ini akan memproses file Excel.");
}

// Fungsi untuk tombol 2. Generate Rapor PDF (Semua Siswa)
function arsipRaporSekelas() {
  console.log("Memulai proses generate rapor PDF untuk seluruh kelas...");
  alert("Fitur Generate Rapor Sekelas sedang dikembangkan. Nantinya tombol ini akan memproses PDF massal.");
}

// Fungsi untuk tombol Buat PDF di tabel (Per Siswa)
function generateRaporPDF(nisn) {
  console.log("Memproses PDF untuk NISN: " + nisn);
  alert("Fitur Buat PDF untuk siswa dengan NISN " + nisn + " sedang dikembangkan.");
}
