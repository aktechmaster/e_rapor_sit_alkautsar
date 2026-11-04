document.addEventListener("DOMContentLoaded", () => {
  renderFormatifHeaders();
});

// Fungsi Navigasi Pindah Halaman / View
function switchMenu(viewName) {
  // Sembunyikan semua wadah view
  const views = ['dashboard', 'tp', 'sumatif', 'formatif', 'katrol'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');
    
    const navEl = document.getElementById(`nav-${v}`);
    if (navEl) navEl.classList.remove('active');
  });

  // Tampilkan view yang dipilih
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.remove('hidden');

  const targetNav = document.getElementById(`nav-${viewName}`);
  if (targetNav) targetNav.classList.add('active');
}

// Handle Authentikasi Login Guru
async function handleLogin() {
  const idGuruInput = document.getElementById('input-idguru').value.trim();
  const btnLogin = document.getElementById('btn-login-submit');

  if (!idGuruInput) {
    return alert("Silakan masukkan ID Guru!");
  }

  btnLogin.disabled = true;
  btnLogin.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> <span>Memeriksa...</span>`;

  // Panggil API Backend GAS
  const response = await callGASAPI("getDistMengajar");
  
  btnLogin.disabled = false;
  btnLogin.innerHTML = `<span>Masuk Aplikasi</span> <i class="fa-solid fa-arrow-right text-sm"></i>`;

  if (!response) return;

  STATE.distribuasiMengajar = response.data;
  const userMatch = response.data.find(row => row.id_guru.toLowerCase() === idGuruInput.toLowerCase());

  if (userMatch) {
    STATE.currentUser = userMatch;
    
    // Perbarui UI User Profile
    document.getElementById('user-name').innerText = userMatch.nama_lengkap;
    document.getElementById('user-avatar').innerText = userMatch.nama_lengkap.charAt(0);
    
    // Isi Dropdown Mapel & Kelas
    populateDropdowns(userMatch);

    // Pindah Tampilan ke Dashboard Utama
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    switchMenu('dashboard');
  } else {
    alert("ID Guru tidak ditemukan! Pastikan ID sesuai dengan data sheet Dist_Mengajar (Contoh: gr_008).");
  }
}

// Populate Dropdown Mapel & Kelas Sesuai Hak Akses Guru
function populateDropdowns(user) {
  const selectMapel = document.getElementById('select-mapel');
  const selectKelas = document.getElementById('select-kelas');

  // Populate Mapel
  selectMapel.innerHTML = '<option value="">-- Pilih Mapel --</option>';
  if (user.mapel_diajar) {
    const mapelList = user.mapel_diajar.split(',').map(s => s.trim());
    mapelList.forEach(mpId => {
      const mapelInfo = CONFIG.MAPEL_DB[mpId];
      if (mapelInfo) {
        selectMapel.innerHTML += `<option value="${mpId}">${mapelInfo.nama}</option>`;
      }
    });
  }

  // Populate Kelas
  selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
  if (user.kelas_diajar) {
    const kelasList = user.kelas_diajar.split(',').map(s => s.trim());
    kelasList.forEach(kls => {
      const formattedKls = kls.replace('kls-', '').toUpperCase();
      selectKelas.innerHTML += `<option value="${formattedKls}">${formattedKls}</option>`;
    });
  }
}

// Render Kolom Header TP 1 - TP 20 pada Tabel Formatif
function renderFormatifHeaders() {
  const headerRow = document.getElementById('table-formatif-header');
  if (!headerRow) return;

  for (let i = 1; i <= 20; i++) {
    const th = document.createElement('th');
    th.className = "p-3 border-r w-16 text-center text-slate-600 font-bold bg-slate-100";
    th.innerText = `TP ${i}`;
    headerRow.appendChild(th);
  }
}

// Simpan Data Formatif Ke Spreadsheet
async function simpanFormatif() {
  const selectKelas = document.getElementById('select-kelas').value;
  const selectMapel = document.getElementById('select-mapel').value;

  if (!selectKelas || !selectMapel) {
    return alert("Pilih Mapel dan Kelas terlebih dahulu pada header di atas!");
  }

  const matrix20Cols = [];
  const rows = document.querySelectorAll('#table-formatif-body tr');

  rows.forEach(row => {
    const rowValues = [];
    const inputs = row.querySelectorAll('.cell-input');
    inputs.forEach(input => {
      rowValues.push(input.value ? Number(input.value) : "");
    });
    matrix20Cols.push(rowValues);
  });

  const targetSpreadsheetId = CONFIG.MAPEL_DB[selectMapel].id;

  const res = await callGASAPI("saveNilaiFormatif", {
    spreadsheetId: targetSpreadsheetId,
    sheetName: selectKelas,
    data: matrix20Cols
  });

  if (res) alert(res.message);
}

function logout() {
  location.reload();
}
