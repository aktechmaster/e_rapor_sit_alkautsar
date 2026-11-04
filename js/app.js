document.addEventListener("DOMContentLoaded", () => {
  renderFormatifHeaders();
});

// Switch Menu View
function switchMenu(viewName) {
  document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden'));
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.remove('hidden');
}

// Handle Authentikasi Login
async function handleLogin() {
  const idGuru = document.getElementById('input-idguru').value.trim();
  if (!idGuru) return alert("Masukkan ID Guru!");

  const response = await callGASAPI("getDistMengajar");
  if (!response) return;

  STATE.distribuasiMengajar = response.data;
  const userMatch = response.data.find(row => row.id_guru.toLowerCase() === idGuru.toLowerCase());

  if (userMatch) {
    STATE.currentUser = userMatch;
    document.getElementById('user-name').innerText = userMatch.nama_lengkap;
    document.getElementById('user-avatar').innerText = userMatch.nama_lengkap.charAt(0);
    
    populateDropdowns(userMatch);
    document.getElementById('view-login').classList.add('hidden');
    switchMenu('formatif');
  } else {
    alert("ID Guru tidak ditemukan dalam database!");
  }
}

// Dynamic Populate Mapel & Kelas berdasarkan Dist_Mengajar
function populateDropdowns(user) {
  const selectMapel = document.getElementById('select-mapel');
  const selectKelas = document.getElementById('select-kelas');

  // Populate Mapel
  selectMapel.innerHTML = '<option value="">-- Pilih Mapel --</option>';
  const mapelList = user.mapel_diajar.split(',').map(s => s.trim());
  mapelList.forEach(mpId => {
    const mapelInfo = CONFIG.MAPEL_DB[mpId];
    if (mapelInfo) {
      selectMapel.innerHTML += `<option value="${mpId}">${mapelInfo.nama}</option>`;
    }
  });

  // Populate Kelas
  selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
  const kelasList = user.kelas_diajar.split(',').map(s => s.trim());
  kelasList.forEach(kls => {
    // Normalisasi string kls-7C menjadi 7C
    const formattedKls = kls.replace('kls-', '').toUpperCase();
    selectKelas.innerHTML += `<option value="${formattedKls}">${formattedKls}</option>`;
  });
}

// Render Header Tabel Formatif TP 1 - TP 20
function renderFormatifHeaders() {
  const headerRow = document.getElementById('table-formatif-header');
  for (let i = 1; i <= 20; i++) {
    const th = document.createElement('th');
    th.className = "p-3 border-r w-16 text-center text-slate-600 font-bold bg-slate-100";
    th.innerText = `TP ${i}`;
    headerRow.appendChild(th);
  }
}

// Simpan Data Formatif Matrix 40 Baris x 20 Kolom
async function simpanFormatif() {
  const selectKelas = document.getElementById('select-kelas').value;
  const selectMapel = document.getElementById('select-mapel').value;

  if (!selectKelas || !selectMapel) {
    return alert("Pilih Mapel dan Kelas terlebih dahulu!");
  }

  // Mengambil seluruh nilai dari grid tabel
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
