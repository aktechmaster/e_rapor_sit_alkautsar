document.addEventListener("DOMContentLoaded", () => {
  renderFormatifHeaders();

  // Hubungkan event change pada dropdown Mapel dan Kelas
  document.getElementById('select-mapel').addEventListener('change', loadDataKelas);
  document.getElementById('select-kelas').addEventListener('change', loadDataKelas);
});

// Fungsi Navigasi Pindah Halaman / View
function switchMenu(viewName) {
  const views = ['dashboard', 'tp', 'sumatif', 'formatif', 'katrol'];
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

  // Jika pindah ke Formatif dan kelas sudah dipilih, muat data
  if (viewName === 'formatif') {
    loadDataKelas();
  }
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

  const response = await callGASAPI("getDistMengajar");
  
  btnLogin.disabled = false;
  btnLogin.innerHTML = `<span>Masuk Aplikasi</span> <i class="fa-solid fa-arrow-right text-sm"></i>`;

  if (!response) return;

  STATE.distribuasiMengajar = response.data;
  const userMatch = response.data.find(row => row.id_guru.toLowerCase() === idGuruInput.toLowerCase());

  if (userMatch) {
    STATE.currentUser = userMatch;
    
    document.getElementById('user-name').innerText = userMatch.nama_lengkap;
    document.getElementById('user-avatar').innerText = userMatch.nama_lengkap.charAt(0);
    
    populateDropdowns(userMatch);

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

  selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
  if (user.kelas_diajar) {
    const kelasList = user.kelas_diajar.split(',').map(s => s.trim());
    kelasList.forEach(kls => {
      const formattedKls = kls.replace('kls-', '').toUpperCase();
      selectKelas.innerHTML += `<option value="${formattedKls}">${formattedKls}</option>`;
    });
  }
}

// Render Header Kolom TP 1 - TP 20
function renderFormatifHeaders() {
  const headerRow = document.getElementById('table-formatif-header');
  if (!headerRow) return;

  // Bersihkan header TP lama jika ada
  const existingTPs = headerRow.querySelectorAll('.tp-header');
  existingTPs.forEach(el => el.remove());

  for (let i = 1; i <= 20; i++) {
    const th = document.createElement('th');
    th.className = "tp-header p-3 border-r w-16 text-center text-slate-600 font-bold bg-slate-100";
    th.innerText = `TP ${i}`;
    headerRow.appendChild(th);
  }
}

// MEMUAT DATA SISWA & NILAI DARI BACKEND SPREADSHEET
async function loadDataKelas() {
  const selectKelas = document.getElementById('select-kelas').value;
  const selectMapel = document.getElementById('select-mapel').value;

  if (!selectKelas || !selectMapel) return;

  const mapelInfo = CONFIG.MAPEL_DB[selectMapel];
  if (!mapelInfo || !mapelInfo.id) {
    return alert("ID Spreadsheet untuk Mapel ini belum diatur di config.js!");
  }

  const tbody = document.getElementById('table-formatif-body');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="23" class="p-8 text-center text-gray-500 font-medium">
          <i class="fa-solid fa-spinner animate-spin text-indigo-600 text-xl mr-2"></i>
          <span>Mengambil data siswa kelas ${selectKelas} dari Spreadsheet...</span>
        </td>
      </tr>
    `;
  }

  // Panggil API Backend GAS
  const response = await callGASAPI("getNilaiKelas", {
    spreadsheetId: mapelInfo.id,
    sheetName: selectKelas
  });

  if (response && response.status === "success") {
    renderFormatifTable(response.siswa, response.formatif);
  }
}

// RENDER TABEL INPUT FORMATIF (40 BARIS SISWA x 20 KOLOM TP)
function renderFormatifTable(siswaData, formatifData) {
  const tbody = document.getElementById('table-formatif-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  let rowCount = 0;

  siswaData.forEach((siswa, rowIndex) => {
    const nisn = siswa[0] || '';
    const nama = siswa[1] || '';

    // Hanya tampilkan baris yang memiliki data nama/NISN
    if (!nisn && !nama) return;

    rowCount++;
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 border-b border-gray-200";

    // Kolom Sticky: NO, NISN, NAMA
    let rowHTML = `
      <td class="p-2 border-r text-center sticky-col left-0 font-semibold text-gray-600">${rowCount}</td>
      <td class="p-2 border-r text-center sticky-col left-12 font-mono text-gray-700">${nisn}</td>
      <td class="p-2 border-r sticky-col left-40 font-medium text-gray-800 truncate max-w-[200px]" title="${nama}">${nama}</td>
    `;

    // 20 Kolom Sel Input Formatif (TP 1 - TP 20)
    for (let colIndex = 0; colIndex < 20; colIndex++) {
      const val = (formatifData[rowIndex] && formatifData[rowIndex][colIndex] !== undefined) 
        ? formatifData[rowIndex][colIndex] 
        : '';

      rowHTML += `
        <td class="p-0 border-r w-16">
          <input type="number" min="1" max="100" class="cell-input" value="${val}" placeholder="-">
        </td>
      `;
    }

    tr.innerHTML = rowHTML;
    tbody.appendChild(tr);
  });

  if (rowCount === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="23" class="p-6 text-center text-red-500 font-medium">
          Tidak ada data siswa ditemukan pada tab sheet "${document.getElementById('select-kelas').value}".
        </td>
      </tr>
    `;
  }
}

// Simpan Data Formatif Matrix Ke Spreadsheet
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
    // Hanya masukkan baris yang memiliki sel input
    if (inputs.length > 0) {
      matrix20Cols.push(rowValues);
    }
  });

  // Lengkapi sisa baris kosong hingga 40 baris agar sesuai range AS8:BL47 di GAS
  while (matrix20Cols.length < 40) {
    matrix20Cols.push(new Array(20).fill(""));
  }

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
