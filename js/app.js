// ====================================================
// GLOBAL CACHE LAYER (Memory Cache)
// ====================================================
let CURRENT_KELAS_DATA = null;
const KELAS_DATA_CACHE = {};  
const TP_DATA_CACHE = {};      
const KATROL_DATA_CACHE = {}; 

// TAMBAHAN: Variabel penyimpan relasi Mapel ke Kelas
let MAPEL_KELAS_MAPPING = {}; 

document.addEventListener("DOMContentLoaded", () => {
  checkAuthSession();
  renderFormatifHeaders();

  // PERUBAHAN: Saat Mapel berubah, perbarui dropdown Kelas terlebih dahulu, lalu load data
  document.getElementById('select-mapel').addEventListener('change', (e) => {
    updateKelasDropdown(e.target.value);
    loadActiveMenuData();
  });
  
  document.getElementById('select-kelas').addEventListener('change', () => loadActiveMenuData());

  attachTableKeyboardNav('table-formatif-body');
  attachTableKeyboardNav('table-sumatif-body');
});

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

function loadActiveMenuData() {
  const activeView = document.querySelector('main > div > div:not(.hidden)');
  if (!activeView) return;

  const viewId = activeView.id;
  if (viewId === 'view-tp') loadSettingTP();
  else if (viewId === 'view-sumatif') loadNilaiSumatif();
  else if (viewId === 'view-formatif') loadDataKelas();
  else if (viewId === 'view-katrol') loadKatrol();
}

// PERUBAHAN: Memecah (parsing) string relasi dari Google Sheets
function populateDropdowns(user) {
  const selectMapel = document.getElementById('select-mapel');
  const selectKelas = document.getElementById('select-kelas');

  selectMapel.innerHTML = '<option value="">-- Pilih Mapel --</option>';
  selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
  
  MAPEL_KELAS_MAPPING = {}; // Reset data tiap kali populate

  // Asumsi data relasi masuk di user.mapel_diajar atau user.hak_akses_mengajar
  // Contoh string: "mp-009:kls-8C | mp-015:kls-9A,kls-9B | mp-005:kls-9A,kls-9B"
  const hakAksesString = user.hak_akses_mengajar || user.mapel_diajar; 

  if (hakAksesString) {
    const mapelGroups = hakAksesString.split('|').map(s => s.trim());
    
    mapelGroups.forEach(group => {
      if (!group) return;
      
      const [mpId, kelasStr] = group.split(':');
      if (mpId && kelasStr) {
        const cleanMpId = mpId.trim();
        
        // Simpan array kelas yang spesifik untuk mapel ini ke global mapping
        MAPEL_KELAS_MAPPING[cleanMpId] = kelasStr.split(',').map(k => k.trim());
        
        // Tambahkan ke dropdown Mapel
        const mapelInfo = CONFIG.MAPEL_DB[cleanMpId];
        if (mapelInfo) {
          selectMapel.innerHTML += `<option value="${cleanMpId}">${mapelInfo.nama}</option>`;
        }
      }
    });
  }
}

// TAMBAHAN: Fungsi untuk mengisi dropdown kelas secara dinamis
function updateKelasDropdown(selectedMapel) {
  const selectKelas = document.getElementById('select-kelas');
  selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
  
  // Jika tidak ada mapel dipilih atau mapel tidak memiliki relasi kelas, berhenti.
  if (!selectedMapel || !MAPEL_KELAS_MAPPING[selectedMapel]) return;

  // Render daftar kelas HANYA yang diajar pada mapel terpilih
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

  tbody.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'INPUT') {
      e.target.select();
    }
  });
}

// ----------------------------------------------------
// MODUL 1: SETTING CP / TP
// ----------------------------------------------------
async function loadSettingTP(forceRefresh = false) {
  const selectMapel = document.getElementById('select-mapel').value;
  const tingkat = getTingkatKelas();

  if (!selectMapel || !tingkat) {
    document.getElementById('tp-tingkat-info').innerText = "Pilih Mapel & Kelas terlebih dahulu!";
    return;
  }

  document.getElementById('tp-tingkat-info').innerText = `Tingkat Kelas: ${tingkat}`;
  const cacheKey = `${selectMapel}_${tingkat}`;

  let res = null;
  if (!forceRefresh && TP_DATA_CACHE[cacheKey]) {
    res = TP_DATA_CACHE[cacheKey];
  } else {
    const mapelInfo = CONFIG.MAPEL_DB[selectMapel];
    res = await callGASAPI("getSettingTP", {
      spreadsheetId: mapelInfo.id,
      tingkat: tingkat
    });
    if (res) TP_DATA_CACHE[cacheKey] = res;
  }

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

  if (res) {
    alert(res.message);
    await loadSettingTP(true);
  }
}

// ----------------------------------------------------
// FETCH DATA KELAS (FORMATIF & SUMATIF - WITH CACHE)
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

// ----------------------------------------------------
// MODUL 2: NILAI SUMATIF (DENGAN KALKULASI LIVE NS)
// ----------------------------------------------------
async function loadNilaiSumatif() {
  const data = await fetchKelasDataCached();
  if (data) renderSumatifTable();
}

function calculateRowNS(tr) {
  const inputs = tr.querySelectorAll('.sumatif-input');
  if (inputs.length < 4) return;

  const thValues = [];
  for (let i = 0; i < 3; i++) {
    const v = inputs[i].value;
    if (v !== '' && !isNaN(v)) thValues.push(Number(v));
  }

  const phValStr = inputs[3].value;
  const phVal = (phValStr !== '' && !isNaN(phValStr)) ? Number(phValStr) : null;
  const nsCell = tr.querySelector('.ns-cell');

  if (!nsCell) return;

  if (thValues.length > 0 && phVal !== null) {
    const avgTH = thValues.reduce((a, b) => a + b, 0) / thValues.length;
    const nsResult = (avgTH * 0.4) + (phVal * 0.6);
    nsCell.innerText = nsResult.toFixed(2).replace('.', ',');
  } else {
    nsCell.innerText = '-';
  }
}

function renderSumatifTable() {
  if (!CURRENT_KELAS_DATA) return;

  const tpKey = document.getElementById('select-sumatif-tp').value;
  const headerRow = document.getElementById('table-sumatif-header');
  const tbody = document.getElementById('table-sumatif-body');

  headerRow.querySelectorAll('.dynamic-header').forEach(el => el.remove());
  tbody.innerHTML = '';

  if (tpKey === 'SAS') {
    headerRow.innerHTML += `<th class="dynamic-header p-2 border-r w-32 text-center bg-slate-100">SAS NON-TES</th>`;
  } else {
    headerRow.innerHTML += `
      <th class="dynamic-header p-2 border-r w-24 text-center bg-slate-100">TH 1</th>
      <th class="dynamic-header p-2 border-r w-24 text-center bg-slate-100">TH 2</th>
      <th class="dynamic-header p-2 border-r w-24 text-center bg-slate-100">TH 3</th>
      <th class="dynamic-header p-2 border-r w-24 text-center bg-emerald-100 text-emerald-800">PH</th>
      <th class="dynamic-header p-2 border-r w-24 text-center bg-indigo-100 text-indigo-900 font-bold" title="Rumus: (Rata TH x 40%) + (PH x 60%)">NS</th>
    `;
  }

  let rowCount = 0;
  CURRENT_KELAS_DATA.siswa.forEach((siswa, rowIndex) => {
    const nisn = siswa[0] || '';
    const nama = siswa[1] || '';
    if (!nisn && !nama) return;

    rowCount++;
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 border-b border-gray-200 h-9";

    let rowHTML = `
      <td class="p-2 border-r text-center sticky-col left-0 font-semibold text-gray-600 w-10">${rowCount}</td>
      <td class="p-2 border-r text-center sticky-col left-10 font-mono text-gray-700 w-28 text-xs">${nisn}</td>
      <td class="p-2 border-r sticky-col left-[152px] font-medium text-gray-800 truncate w-56 text-xs" title="${nama}">${nama}</td>
    `;

    if (tpKey === 'SAS') {
      const val = (CURRENT_KELAS_DATA.sasNonTes && CURRENT_KELAS_DATA.sasNonTes[rowIndex]) ? CURRENT_KELAS_DATA.sasNonTes[rowIndex][0] : '';
      rowHTML += `
        <td class="p-0 border-r w-32 h-9">
          <input type="number" min="0" max="100" class="sumatif-input text-center w-full h-full border-none outline-none bg-transparent" value="${val}" placeholder="-">
        </td>
      `;
    } else {
      const tpValues = (CURRENT_KELAS_DATA.sumatif && CURRENT_KELAS_DATA.sumatif[tpKey]) ? CURRENT_KELAS_DATA.sumatif[tpKey][rowIndex] : ['', '', '', ''];
      for (let c = 0; c < 4; c++) {
        const val = tpValues ? tpValues[c] : '';
        rowHTML += `
          <td class="p-0 border-r w-24 h-9">
            <input type="number" min="0" max="100" class="sumatif-input text-center w-full h-full border-none outline-none bg-transparent font-semibold text-gray-800" value="${val}" placeholder="-">
          </td>
        `;
      }
      /* PERUBAHAN: Penambahan class text-center, align-middle, dan styling untuk sel NS */
      rowHTML += `<td class="p-2 border-r w-24 h-9 ns-cell text-center align-middle font-bold text-indigo-700 bg-indigo-50/30">-</td>`;
    }

    tr.innerHTML = rowHTML;

    if (tpKey !== 'SAS') {
      tr.querySelectorAll('.sumatif-input').forEach(inp => {
        inp.addEventListener('input', () => calculateRowNS(tr));
      });
      calculateRowNS(tr); 
    }

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
      await fetchKelasDataCached(true);
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
      await fetchKelasDataCached(true);
    }
  }
}

// ----------------------------------------------------
// MODUL 3: NILAI FORMATIF
// ----------------------------------------------------
async function loadDataKelas() {
  const data = await fetchKelasDataCached();
  if (data && data.siswa && data.formatif) {
    renderFormatifTable(data.siswa, data.formatif);
  }
}

function renderFormatifHeaders() {
  const headerRow = document.getElementById('table-formatif-header');
  if (!headerRow) return;

  headerRow.querySelectorAll('.tp-header').forEach(el => el.remove());
  for (let i = 1; i <= 20; i++) {
    const th = document.createElement('th');
    /* PERUBAHAN: Lebar kolom header diubah dari w-16 menjadi w-20 agar lebih luas */
    th.className = "tp-header p-2 border-r w-20 text-center text-slate-600 font-bold bg-slate-100 text-xs";
    th.innerText = `TP ${i}`;
    headerRow.appendChild(th);
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
    tr.className = "hover:bg-slate-50 border-b border-gray-200 h-9";

    let rowHTML = `
      <td class="p-2 border-r text-center sticky-col left-0 font-semibold text-gray-600 w-10">${rowCount}</td>
      <td class="p-2 border-r text-center sticky-col left-10 font-mono text-gray-700 w-28 text-xs">${nisn}</td>
      <td class="p-2 border-r sticky-col left-[152px] font-medium text-gray-800 truncate w-56 text-xs" title="${nama}">${nama}</td>
    `;

    for (let colIndex = 0; colIndex < 20; colIndex++) {
      const val = (formatifData[rowIndex] && formatifData[rowIndex][colIndex] !== undefined) 
        ? formatifData[rowIndex][colIndex] 
        : '';

      /* PERUBAHAN: Lebar sel td diubah jadi w-20. 
         Class input ditambah text-center, w-full, h-full, border-none, bg-transparent agar presisi rata tengah */
      rowHTML += `
        <td class="p-0 border-r w-20 h-9">
          <input type="number" min="1" max="100" class="cell-input text-center w-full h-full border-none outline-none bg-transparent font-semibold text-gray-800" value="${val}" placeholder="-">
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
    await fetchKelasDataCached(true);
  }
}

// ----------------------------------------------------
// MODUL 4: KATROL
// ----------------------------------------------------
async function loadKatrol(forceRefresh = false) {
  const selectMapel = document.getElementById('select-mapel').value;
  const tingkat = getTingkatKelas();

  if (!selectMapel || !tingkat) {
    document.getElementById('katrol-tingkat-info').innerText = "Pilih Mapel & Kelas terlebih dahulu!";
    return;
  }

  document.getElementById('katrol-tingkat-info').innerText = `Batas Katrol Nilai - Tingkat Kelas ${tingkat}`;
  const cacheKey = `${selectMapel}_${tingkat}`;

  let res = null;
  if (!forceRefresh && KATROL_DATA_CACHE[cacheKey]) {
    res = KATROL_DATA_CACHE[cacheKey];
  } else {
    const mapelInfo = CONFIG.MAPEL_DB[selectMapel];
    res = await callGASAPI("getKatrol", {
      spreadsheetId: mapelInfo.id,
      tingkat: tingkat
    });
    if (res && res.status === "success") {
      KATROL_DATA_CACHE[cacheKey] = res;
    }
  }

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

  if (res) {
    alert(res.message);
    await loadKatrol(true);
  }
}

function logout() {
  sessionStorage.clear();
  window.location.href = "login.html";
}
