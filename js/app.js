// Cache Data Nilai Kelas dari GAS (Memory Cache Layer)
let CURRENT_KELAS_DATA = null;
const KELAS_DATA_CACHE = {};

document.addEventListener("DOMContentLoaded", () => {
  checkAuthSession();
  renderFormatifHeaders();

  document.getElementById('select-mapel').addEventListener('change', () => loadActiveMenuData());
  document.getElementById('select-kelas').addEventListener('change', () => loadActiveMenuData());

  // Pasang listener navigasi keyboard panah di tabel
  attachTableKeyboardNav('table-formatif-body');
  attachTableKeyboardNav('table-sumatif-body');
});

// Cek Sesi Login Guru
function checkAuthSession() {
  const userSession = sessionStorage.getItem("eRaporUser");
  if (!userSession) {
    window.location.href = "login.html";
    return;
  }

  const user = JSON.parse(userSession);
  STATE.currentUser = user;

  document.getElementById('user-name').innerText = user.nama_lengkap;
  document.getElementById('user-avatar').innerText = user.nama_lengkap.charAt(0);

  populateDropdowns(user);
}

// Navigasi Pindah View / Menu
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

  loadActiveMenuData();
}

// Muat Data Otomatis Sesuai Menu Aktif
function loadActiveMenuData() {
  const activeView = document.querySelector('main > div > div:not(.hidden)');
  if (!activeView) return;

  const viewId = activeView.id;
  if (viewId === 'view-tp') loadSettingTP();
  else if (viewId === 'view-sumatif') loadNilaiSumatif();
  else if (viewId === 'view-formatif') loadDataKelas();
  else if (viewId === 'view-katrol') loadKatrol();
}

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

function getTingkatKelas() {
  const selectKelas = document.getElementById('select-kelas').value;
  if (!selectKelas) return null;
  const match = selectKelas.match(/\d+/);
  return match ? match[0] : null;
}

// ----------------------------------------------------
// NAVIGASI KEYBOARD SPREADSHEET (EXCEL LIKE)
// ----------------------------------------------------
function attachTableKeyboardNav(tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  tbody.addEventListener('keydown', (e) => {
    const input = e.target;
    if (!input.classList.contains('cell-input') && !input.classList.contains('sumatif-input')) return;

    const td = input.closest('td');
    const tr = td.closest('tr');
    const cellIndex = td.cellIndex;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const rowIndex = rows.indexOf(tr);

    // Cegah panah atas/bawah mengubah nilai di type="number"
    if (['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === 'ArrowUp' && rowIndex > 0) {
      const targetInput = rows[rowIndex - 1].children[cellIndex]?.querySelector('input');
      if (targetInput) { targetInput.focus(); targetInput.select(); }
    } 
    else if ((e.key === 'ArrowDown' || e.key === 'Enter') && rowIndex < rows.length - 1) {
      const targetInput = rows[rowIndex + 1].children[cellIndex]?.querySelector('input');
      if (targetInput) { targetInput.focus(); targetInput.select(); }
    } 
    else if (e.key === 'ArrowLeft' && input.selectionStart === 0) {
      const prevTd = td.previousElementSibling;
      const targetInput = prevTd?.querySelector('input');
      if (targetInput) { targetInput.focus(); targetInput.select(); }
    } 
    else if (e.key === 'ArrowRight' && input.selectionEnd === input.value.length) {
      const nextTd = td.nextElementSibling;
      const targetInput = nextTd?.querySelector('input');
      if (targetInput) { targetInput.focus(); targetInput.select(); }
    }
  });

  // Otomatis menyorot seluruh teks saat fokus (mudah langsung ketik)
  tbody.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'INPUT') {
      e.target.select();
    }
  });
}

// ----------------------------------------------------
// MODUL 1: SETTING CP / TP
// ----------------------------------------------------
async function loadSettingTP() {
  const selectMapel = document.getElementById('select-mapel').value;
  const tingkat = getTingkatKelas();

  if (!selectMapel || !tingkat) {
    document.getElementById('tp-tingkat-info').innerText = "Pilih Mapel & Kelas terlebih dahulu!";
    return;
  }

  document.getElementById('tp-tingkat-info').innerText = `Tingkat Kelas: ${tingkat}`;

  const mapelInfo = CONFIG.MAPEL_DB[selectMapel];
  const res = await callGASAPI("getSettingTP", {
    spreadsheetId: mapelInfo.id,
    tingkat: tingkat
  });

  const cpContainer = document.getElementById('container-input-cp');
  const lmContainer = document.getElementById('container-input-lm');
  cpContainer.innerHTML = '';
  lmContainer.innerHTML = '';

  for (let i = 0; i < 10; i++) {
    const cpVal = (res && res.cp && res.cp[i]) ? res.cp[i][0] : '';
    const lmVal = (res && res.lm && res.lm[i]) ? res.lm[i][0] : '';

    cpContainer.innerHTML += `
      <div class="flex items-center space-x-2">
        <span class="text-xs font-bold text-gray-400 w-6">${i+1}.</span>
        <input type="text" class="input-cp-item w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500" value="${cpVal}" placeholder="Isi CP/ATP ${i+1}">
      </div>
    `;

    lmContainer.innerHTML += `
      <div class="flex items-center space-x-2">
        <span class="text-xs font-bold text-gray-400 w-6">${i+1}.</span>
        <input type="text" class="input-lm-item w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500" value="${lmVal}" placeholder="Isi Lingkup Materi ${i+1}">
      </div>
    `;
  }
}

async function simpanTP() {
  const selectMapel = document.getElementById('select-mapel').value;
  const tingkat = getTingkatKelas();
  if (!selectMapel || !tingkat) return alert("Pilih Mapel & Kelas terlebih dahulu!");

  const cpValues = Array.from(document.querySelectorAll('.input-cp-item')).map(el => [el.value]);
  const lmValues = Array.from(document.querySelectorAll('.input-lm-item')).map(el => [el.value]);

  const mapelInfo = CONFIG.MAPEL_DB[selectMapel];
  const res = await callGASAPI("saveTP", {
    spreadsheetId: mapelInfo.id,
    tingkat: tingkat,
    data: { cp: cpValues, lm: lmValues }
  });

  if (res) alert(res.message);
}

// ----------------------------------------------------
// MODUL 2 & 3: FETCH DATA DENGAN SISTEM CACHE CLIENT
// ----------------------------------------------------
async function fetchKelasDataCached(forceRefresh = false) {
  const selectKelas = document.getElementById('select-kelas').value;
  const selectMapel = document.getElementById('select-mapel').value;
  if (!selectKelas || !selectMapel) return null;

  const cacheKey = `${selectMapel}_${selectKelas}`;

  if (!forceRefresh && KELAS_DATA_CACHE[cacheKey]) {
    CURRENT_KELAS_DATA = KELAS_DATA_CACHE[cacheKey];
    return CURRENT_KELAS_DATA;
  }

  const mapelInfo = CONFIG.MAPEL_DB[selectMapel];
  const response = await callGASAPI("getNilaiKelas", {
    spreadsheetId: mapelInfo.id,
    sheetName: selectKelas
  });

  if (response && response.status === "success") {
    KELAS_DATA_CACHE[cacheKey] = response;
    CURRENT_KELAS_DATA = response;
    return response;
  }
  return null;
}

// MODUL 2: NILAI SUMATIF
async function loadNilaiSumatif() {
  const data = await fetchKelasDataCached();
  if (data) renderSumatifTable();
}

function renderSumatifTable() {
  if (!CURRENT_KELAS_DATA) return;

  const tpKey = document.getElementById('select-sumatif-tp').value;
  const headerRow = document.getElementById('table-sumatif-header');
  const tbody = document.getElementById('table-sumatif-body');

  headerRow.querySelectorAll('.dynamic-header').forEach(el => el.remove());
  tbody.innerHTML = '';

  if (tpKey === 'SAS') {
    headerRow.innerHTML += `<th class="dynamic-header p-3 border-r w-32 text-center bg-slate-100">SAS NON-TES</th>`;
  } else {
    headerRow.innerHTML += `
      <th class="dynamic-header p-3 border-r w-20 text-center bg-slate-100">TH 1</th>
      <th class="dynamic-header p-3 border-r w-20 text-center bg-slate-100">TH 2</th>
      <th class="dynamic-header p-3 border-r w-20 text-center bg-slate-100">TH 3</th>
      <th class="dynamic-header p-3 border-r w-20 text-center bg-emerald-100 text-emerald-800">PH</th>
    `;
  }

  let rowCount = 0;
  CURRENT_KELAS_DATA.siswa.forEach((siswa, rowIndex) => {
    const nisn = siswa[0] || '';
    const nama = siswa[1] || '';
    if (!nisn && !nama) return;

    rowCount++;
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 border-b border-gray-200";

    let rowHTML = `
      <td class="p-2 border-r text-center sticky-col left-0 font-semibold text-gray-600">${rowCount}</td>
      <td class="p-2 border-r text-center sticky-col left-12 font-mono text-gray-700">${nisn}</td>
      <td class="p-2 border-r sticky-col left-40 font-medium text-gray-800 truncate max-w-[200px]">${nama}</td>
    `;

    if (tpKey === 'SAS') {
      const val = (CURRENT_KELAS_DATA.sasNonTes && CURRENT_KELAS_DATA.sasNonTes[rowIndex]) ? CURRENT_KELAS_DATA.sasNonTes[rowIndex][0] : '';
      rowHTML += `
        <td class="p-0 border-r w-32">
          <input type="number" min="0" max="100" class="cell-input sumatif-input" value="${val}" placeholder="-">
        </td>
      `;
    } else {
      const tpValues = (CURRENT_KELAS_DATA.sumatif && CURRENT_KELAS_DATA.sumatif[tpKey]) ? CURRENT_KELAS_DATA.sumatif[tpKey][rowIndex] : ['', '', '', ''];
      for (let c = 0; c < 4; c++) {
        const val = tpValues ? tpValues[c] : '';
        rowHTML += `
          <td class="p-0 border-r w-20">
            <input type="number" min="0" max="100" class="cell-input sumatif-input" value="${val}" placeholder="-">
          </td>
        `;
      }
    }

    tr.innerHTML = rowHTML;
    tbody.appendChild(tr);
  });
}

async function simpanSumatif() {
  const selectKelas = document.getElementById('select-kelas').value;
  const selectMapel = document.getElementById('select-mapel').value;
  const tpKey = document.getElementById('select-sumatif-tp').value;
  if (!selectKelas || !selectMapel) return alert("Pilih Mapel & Kelas terlebih dahulu!");

  const rows = document.querySelectorAll('#table-sumatif-body tr');
  const mapelInfo = CONFIG.MAPEL_DB[selectMapel];

  if (tpKey === 'SAS') {
    const sasValues = [];
    rows.forEach(row => {
      const input = row.querySelector('.sumatif-input');
      sasValues.push([input && input.value ? Number(input.value) : ""]);
    });
    while (sasValues.length < 40) sasValues.push([""]);

    const res = await callGASAPI("saveNilaiSumatif", {
      spreadsheetId: mapelInfo.id,
      sheetName: selectKelas,
      data: { sasNonTesValues: sasValues }
    });

    if (res) {
      alert(res.message);
      await fetchKelasDataCached(true); // Invalidate Cache & Refresh
    }
  } else {
    const sumatifMatrix = [];
    rows.forEach(row => {
      const inputs = row.querySelectorAll('.sumatif-input');
      const rowVals = [];
      inputs.forEach(inp => rowVals.push(inp.value ? Number(inp.value) : ""));
      sumatifMatrix.push(rowVals);
    });
    while (sumatifMatrix.length < 40) sumatifMatrix.push(["", "", "", ""]);

    const res = await callGASAPI("saveNilaiSumatif", {
      spreadsheetId: mapelInfo.id,
      sheetName: selectKelas,
      data: { tpKey: tpKey, values: sumatifMatrix }
    });

    if (res) {
      alert(res.message);
      await fetchKelasDataCached(true); // Invalidate Cache & Refresh
    }
  }
}

// MODUL 3: NILAI FORMATIF
function renderFormatifHeaders() {
  const headerRow = document.getElementById('table-formatif-header');
  if (!headerRow) return;

  headerRow.querySelectorAll('.tp-header').forEach(el => el.remove());
  for (let i = 1; i <= 20; i++) {
    const th = document.createElement('th');
    th.className = "tp-header p-3 border-r w-16 text-center text-slate-600 font-bold bg-slate-100";
    th.innerText = `TP ${i}`;
    headerRow.appendChild(th);
  }
}

async function loadDataKelas(forceRefresh = false) {
  const data = await fetchKelasDataCached(forceRefresh);
  if (data) {
    renderFormatifTable(data.siswa, data.formatif);
  }
}

function renderFormatifTable(siswaData, formatifData) {
  const tbody = document.getElementById('table-formatif-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  let rowCount = 0;
  siswaData.forEach((siswa, rowIndex) => {
    const nisn = siswa[0] || '';
    const nama = siswa[1] || '';
    if (!nisn && !nama) return;

    rowCount++;
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 border-b border-gray-200";

    let rowHTML = `
      <td class="p-2 border-r text-center sticky-col left-0 font-semibold text-gray-600">${rowCount}</td>
      <td class="p-2 border-r text-center sticky-col left-12 font-mono text-gray-700">${nisn}</td>
      <td class="p-2 border-r sticky-col left-40 font-medium text-gray-800 truncate max-w-[200px]">${nama}</td>
    `;

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
}

async function simpanFormatif() {
  const selectKelas = document.getElementById('select-kelas').value;
  const selectMapel = document.getElementById('select-mapel').value;
  if (!selectKelas || !selectMapel) return alert("Pilih Mapel & Kelas terlebih dahulu!");

  const matrix20Cols = [];
  const rows = document.querySelectorAll('#table-formatif-body tr');

  rows.forEach(row => {
    const rowValues = [];
    const inputs = row.querySelectorAll('.cell-input');
    inputs.forEach(input => {
      rowValues.push(input.value ? Number(input.value) : "");
    });
    if (inputs.length > 0) matrix20Cols.push(rowValues);
  });

  while (matrix20Cols.length < 40) matrix20Cols.push(new Array(20).fill(""));

  const mapelInfo = CONFIG.MAPEL_DB[selectMapel];
  const res = await callGASAPI("saveNilaiFormatif", {
    spreadsheetId: mapelInfo.id,
    sheetName: selectKelas,
    data: matrix20Cols
  });

  if (res) {
    alert(res.message);
    await fetchKelasDataCached(true); // Invalidate Cache & Refresh
  }
}

// ----------------------------------------------------
// MODUL 4: KATROL
// ----------------------------------------------------
async function loadKatrol() {
  const selectMapel = document.getElementById('select-mapel').value;
  const tingkat = getTingkatKelas();

  if (!selectMapel || !tingkat) {
    document.getElementById('katrol-tingkat-info').innerText = "Pilih Mapel & Kelas terlebih dahulu!";
    return;
  }

  document.getElementById('katrol-tingkat-info').innerText = `Batas Katrol Nilai - Tingkat Kelas ${tingkat}`;

  const mapelInfo = CONFIG.MAPEL_DB[selectMapel];
  const res = await callGASAPI("getKatrol", {
    spreadsheetId: mapelInfo.id,
    tingkat: tingkat
  });

  if (res && res.status === "success") {
    document.getElementById('input-katrol-max').value = res.max || '';
    document.getElementById('input-katrol-min').value = res.min || '';
  }
}

async function simpanKatrol() {
  const selectMapel = document.getElementById('select-mapel').value;
  const tingkat = getTingkatKelas();
  if (!selectMapel || !tingkat) return alert("Pilih Mapel & Kelas terlebih dahulu!");

  const maxVal = document.getElementById('input-katrol-max').value;
  const minVal = document.getElementById('input-katrol-min').value;

  if (!maxVal || !minVal) return alert("Isi batas nilai maksimal dan minimal katrol!");

  const mapelInfo = CONFIG.MAPEL_DB[selectMapel];
  const res = await callGASAPI("saveKatrol", {
    spreadsheetId: mapelInfo.id,
    tingkat: tingkat,
    data: [[Number(maxVal)], [Number(minVal)]]
  });

  if (res) alert(res.message);
}

function logout() {
  sessionStorage.clear();
  window.location.href = "login.html";
}
