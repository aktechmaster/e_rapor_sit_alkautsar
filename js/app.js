// ====================================================
// GLOBAL CACHE LAYER (Memory Cache)
// ====================================================
let CURRENT_KELAS_DATA = null;
const KELAS_DATA_CACHE = {};  
const TP_DATA_CACHE = {};      
const KATROL_DATA_CACHE = {}; 
const LEGER_STS_CACHE = {};
let MAPEL_KELAS_MAPPING = {}; 

let CURRENT_LEGER_DATA = null;
let CURRENT_SISWA_INDEX = 0;

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
  
  // Tampilkan Peran Wali Kelas pada Sidebar jika terdaftar
  const userRoleEl = document.getElementById('user-role');
  if (user.walas_kelas) {
    userRoleEl.innerText = `Wali Kelas ${user.walas_kelas}`;
  } else {
    userRoleEl.innerText = `Guru Mata Pelajaran`;
  }
  updateWalasMenuVisibility(user);
  populateDropdowns(user);
}

// LOGIKA DYNAMIC MENU SIDEBAR BERDASARKAN HASIL IDENTIFIKASI WALI KELAS
function updateWalasMenuVisibility(user) {
  const navLeger = document.getElementById('nav-leger');
  const navCetak = document.getElementById('nav-cetak-sts');
  
  if (user && user.walas_kelas) {
    if (navLeger) navLeger.classList.remove('hidden');
    if (navCetak) navCetak.classList.remove('hidden');
  } else {
    if (navLeger) navLeger.classList.add('hidden');
    if (navCetak) navCetak.classList.add('hidden');
  }
}

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

// ----------------------------------------------------
// NAVIGASI KEYBOARD SPREADSHEET
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

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
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
      <div class="flex items-start space-x-2">
        <span class="text-xs font-bold text-gray-400 w-6 pt-2 shrink-0">${i+1}.</span>
        <textarea rows="1" oninput="autoResizeTextarea(this)" placeholder="Isi CP/ATP ${i+1}" class="input-cp-item w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none overflow-hidden transition-all">${cpVal}</textarea>
      </div>
    `;
    lmContainer.innerHTML += `
      <div class="flex items-start space-x-2">
        <span class="text-xs font-bold text-gray-400 w-6 pt-2 shrink-0">${i+1}.</span>
        <textarea rows="1" oninput="autoResizeTextarea(this)" placeholder="Isi Lingkup Materi ${i+1}" class="input-lm-item w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none overflow-hidden transition-all">${lmVal}</textarea>
      </div>
    `;
  }
  setTimeout(() => {
    document.querySelectorAll('#container-input-cp textarea, #container-input-lm textarea').forEach(el => autoResizeTextarea(el));
  }, 50);
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
// FETCH DATA KELAS (FORMATIF & SUMATIF - CACHED)
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
// MODUL 2: NILAI SUMATIF
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
    headerRow.innerHTML += `
      <th class="dynamic-header p-2 border-r w-24 text-center bg-gray-200 text-xs">Akhir LM (40%)</th>
      <th class="dynamic-header p-2 border-r w-20 text-center bg-gray-200 text-xs">STS</th>
      <th class="dynamic-header p-2 border-r w-20 text-center bg-blue-100 text-xs">SAS Tes</th>
      <th class="dynamic-header p-2 border-r w-24 text-center bg-yellow-200 text-xs">SAS Non-Tes</th>
      <th class="dynamic-header p-2 border-r w-24 text-center bg-green-200 text-xs">Rapor Asli</th>
      <th class="dynamic-header p-2 border-r w-24 text-center bg-green-300 text-xs">Rapor Akhir</th>
    `;
  } else {
    headerRow.innerHTML += `
      <th class="dynamic-header p-2 border-r w-24 text-center bg-slate-100">TH 1</th>
      <th class="dynamic-header p-2 border-r w-24 text-center bg-slate-100">TH 2</th>
      <th class="dynamic-header p-2 border-r w-24 text-center bg-slate-100">TH 3</th>
      <th class="dynamic-header p-2 border-r w-24 text-center bg-emerald-100 text-emerald-800">PH</th>
      <th class="dynamic-header p-2 border-r w-24 text-center bg-indigo-100 text-indigo-900 font-bold">NS</th>
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
      const valNonTes = (CURRENT_KELAS_DATA.sasNonTes && CURRENT_KELAS_DATA.sasNonTes[rowIndex]) 
                        ? CURRENT_KELAS_DATA.sasNonTes[rowIndex][0] : '';
      const rekap = (CURRENT_KELAS_DATA.rekapAkhir && CURRENT_KELAS_DATA.rekapAkhir[rowIndex]) 
                    ? CURRENT_KELAS_DATA.rekapAkhir[rowIndex] 
                    : ["", "", "", "", "", "", ""];
      const formatNum = (num) => (num !== "" && num !== null && !isNaN(num)) ? Number(num).toFixed(2).replace('.', ',') : "-";
      rowHTML += `
        <td class="p-2 border-r text-center w-24 bg-gray-50 text-xs">${formatNum(rekap[0])}</td>
        <td class="p-2 border-r text-center w-20 bg-gray-50 text-xs">${formatNum(rekap[1])}</td>
        <td class="p-2 border-r text-center w-20 bg-blue-50 text-xs">${formatNum(rekap[2])}</td>
        <td class="p-0 border-r w-24 h-9">
          <input type="number" min="0" max="100" class="sumatif-input text-center w-full h-full border-none outline-none bg-yellow-50 focus:bg-yellow-100" value="${valNonTes}" placeholder="-">
        </td>
        <td class="p-2 border-r text-center w-24 bg-green-50 text-xs font-bold">${formatNum(rekap[5])}</td>
        <td class="p-2 border-r text-center w-24 bg-green-300 text-xs font-bold text-indigo-700">${formatNum(rekap[6])}</td>
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

// ----------------------------------------------------
// MODUL 5: LEGER STS (KHUSUS KELAS WALI)
// ----------------------------------------------------
async function loadLegerSTS(forceRefresh = false) {
  // PAKSA MENGGUNAKAN KELAS WALI DARI USER SESSION (TANPA TERPENGARUH DROPDOWN HEADER)
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;

  if (!kelasWalas) {
    alert("Akun Anda tidak terdaftar sebagai Wali Kelas!");
    return;
  }

  if (!forceRefresh && LEGER_STS_CACHE[kelasWalas]) {
    CURRENT_LEGER_DATA = LEGER_STS_CACHE[kelasWalas];
    renderLegerTable();
    return;
  }

  const res = await callGASAPI("getLegerSTS", { kelas: kelasWalas });
  if (res && res.status === "success") {
    LEGER_STS_CACHE[kelasWalas] = res;
    CURRENT_LEGER_DATA = res;
    renderLegerTable();
  }
}

function renderLegerTable() {
  if (!CURRENT_LEGER_DATA) return;
  const { meta, data } = CURRENT_LEGER_DATA;
  document.getElementById('leger-meta-info').innerText = `Kelas: ${meta.kelas || '-'} | Wali Kelas: ${meta.walas || '-'}`;

  const tbody = document.getElementById('table-leger-body');
  tbody.innerHTML = '';

  data.forEach((row, idx) => {
    if (idx < 1) return;
    const no = row[0];
    const kelasStr = row[1];
    const namaSiswa = row[2];
    if (!namaSiswa) return;

    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 border-b border-gray-200 h-8 text-xs";

    let html = `
      <td class="p-1.5 border-r text-center sticky-col left-0 font-semibold text-gray-600 bg-white">${no}</td>
      <td class="p-1.5 border-r text-center sticky-col left-10 text-gray-700 bg-white">${kelasStr}</td>
      <td class="p-1.5 border-r sticky-col left-[136px] font-medium text-gray-800 truncate bg-white" title="${namaSiswa}">${namaSiswa}</td>
    `;

    for (let c = 3; c <= 17; c++) {
      const val = row[c] !== "" ? row[c] : "-";
      html += `<td class="p-1.5 border-r text-center">${val}</td>`;
    }

    for (let c = 18; c <= 23; c++) {
      const val = row[c] || "-";
      html += `<td class="p-1.5 border-r text-center font-semibold text-amber-700 bg-amber-50/30">${val}</td>`;
    }

    for (let c = 24; c <= 26; c++) {
      const val = row[c] !== "" ? row[c] : "0";
      html += `<td class="p-1.5 border-r text-center bg-rose-50/30">${val}</td>`;
    }

    const total = row[27] !== "" ? Number(row[27]).toLocaleString('id-ID') : "-";
    const avg = row[28] !== "" ? Number(row[28]).toFixed(2).replace('.', ',') : "-";
    const rank = row[29] !== "" ? row[29] : "-";
    const surat = row[31] || "-";

    html += `
      <td class="p-1.5 border-r text-center font-bold bg-emerald-50 text-emerald-900">${total}</td>
      <td class="p-1.5 border-r text-center font-bold bg-emerald-50 text-emerald-900">${avg}</td>
      <td class="p-1.5 border-r text-center font-extrabold bg-amber-100 text-amber-900">${rank}</td>
      <td class="p-1.5 border-r text-gray-700 truncate max-w-xs" title="${surat}">${surat}</td>
    `;

    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

// ----------------------------------------------------
// MODUL 6: CETAK RAPOR STS (KHUSUS KELAS WALI)
// ----------------------------------------------------
async function loadCetakRaporSTS() {
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;

  if (!kelasWalas) {
    alert("Akun Anda tidak terdaftar sebagai Wali Kelas!");
    return;
  }

  if (!LEGER_STS_CACHE[kelasWalas]) {
    await loadLegerSTS();
  } else {
    CURRENT_LEGER_DATA = LEGER_STS_CACHE[kelasWalas];
  }

  if (!CURRENT_LEGER_DATA) return;

  const selectSiswa = document.getElementById('select-siswa-rapor');
  selectSiswa.innerHTML = '';
  
  const dataSiswa = CURRENT_LEGER_DATA.data.slice(1);
  dataSiswa.forEach((row, idx) => {
    if (row[2]) {
      selectSiswa.innerHTML += `<option value="${idx}">${row[0]}. ${row[2]}</option>`;
    }
  });

  if (dataSiswa.length > 0) {
    CURRENT_SISWA_INDEX = 0;
    selectSiswa.value = "0";
    renderLembarRapor(0);
  }
}

function prevSiswaRapor() {
  const selectSiswa = document.getElementById('select-siswa-rapor');
  if (CURRENT_SISWA_INDEX > 0) {
    CURRENT_SISWA_INDEX--;
    selectSiswa.value = CURRENT_SISWA_INDEX;
    renderLembarRapor(CURRENT_SISWA_INDEX);
  }
}

function nextSiswaRapor() {
  const selectSiswa = document.getElementById('select-siswa-rapor');
  const max = selectSiswa.options.length - 1;
  if (CURRENT_SISWA_INDEX < max) {
    CURRENT_SISWA_INDEX++;
    selectSiswa.value = CURRENT_SISWA_INDEX;
    renderLembarRapor(CURRENT_SISWA_INDEX);
  }
}

function renderLembarRapor(siswaIndex) {
  siswaIndex = Number(siswaIndex);
  CURRENT_SISWA_INDEX = siswaIndex;
  if (!CURRENT_LEGER_DATA) return;

  const meta = CURRENT_LEGER_DATA.meta;
  const row = CURRENT_LEGER_DATA.data[siswaIndex + 1];
  if (!row) return;

  document.getElementById('lbl-rapor-nama').innerText = row[2] || '-';
  document.getElementById('lbl-rapor-kelas').innerText = meta.kelas || '-';
  document.getElementById('lbl-rapor-walas').innerText = meta.walas || '-';
  document.getElementById('lbl-rapor-tgl').innerText = meta.tglRapor || '9 Oktober 2026';
  document.getElementById('lbl-rapor-nisn').innerText = `314519${1000 + Number(row[0])}`;

  const mapelList = [
    { no: 1, nama: "Pendidikan Agama Islam", col: 3, grp: "A" },
    { no: 2, nama: "Pendidikan Kewarganegaraan", col: 4, grp: "A" },
    { no: 3, nama: "Bahasa Indonesia", col: 5, grp: "A" },
    { no: 4, nama: "Matematika", col: 6, grp: "A" },
    { no: 5, nama: "Ilmu Pengetahuan Alam", col: 7, grp: "A" },
    { no: 6, nama: "Ilmu Pengetahuan Sosial", col: 8, grp: "A" },
    { no: 7, nama: "Bahasa Inggris", col: 9, grp: "A" },
    { no: 8, nama: "Pendidikan Jasmani Olahraga dan Kesehatan", col: 10, grp: "B" },
    { no: 9, nama: "Teknologi Informasi dan Komunikasi", col: 11, grp: "B" },
    { no: 10, nama: "Seni Budaya dan Keterampilan", col: 12, grp: "B" },
    { no: 11, nama: "Bahasa Arab", col: 13, grp: "B" },
    { no: 12, nama: "Tarjim", col: 16, grp: "B" },
    { no: 13, nama: "Koding", col: 17, grp: "B" },
    { no: 14, nama: "Tahsin dan Tahfidzul Qur'an", col: 14, grp: "B" }
  ];

  const tbody = document.getElementById('rapor-tbody-nilai');
  tbody.innerHTML = '';

  const getHuruf = (val) => {
    if (val >= 90) return 'A';
    if (val >= 80) return 'B';
    if (val >= 75) return 'C';
    if (val >= 60) return 'D';
    return 'E';
  };

  tbody.innerHTML += `<tr class="bg-gray-100 font-bold"><td colspan="6" class="border border-black p-1">Kelompok A :</td></tr>`;
  mapelList.filter(m => m.grp === "A").forEach(m => {
    const val = row[m.col] !== "" ? Number(row[m.col]) : "-";
    const huruf = typeof val === 'number' ? getHuruf(val) : "-";
    const desk = val >= 75 ? "Terlampaui" : "Belum Tercapai";
    tbody.innerHTML += `
      <tr>
        <td class="border border-black p-1 text-center">${m.no}</td>
        <td class="border border-black p-1">${m.nama}</td>
        <td class="border border-black p-1 text-center">75</td>
        <td class="border border-black p-1 text-center font-bold">${val}</td>
        <td class="border border-black p-1 text-center font-bold">${huruf}</td>
        <td class="border border-black p-1 text-center italic">${desk}</td>
      </tr>
    `;
  });

  tbody.innerHTML += `<tr class="bg-gray-100 font-bold"><td colspan="6" class="border border-black p-1">Kelompok B :</td></tr>`;
  mapelList.filter(m => m.grp === "B").forEach(m => {
    const val = row[m.col] !== "" ? Number(row[m.col]) : "-";
    const huruf = typeof val === 'number' ? getHuruf(val) : "-";
    const desk = val >= 75 ? "Terlampaui" : "Belum Tercapai";
    tbody.innerHTML += `
      <tr>
        <td class="border border-black p-1 text-center">${m.no}</td>
        <td class="border border-black p-1">${m.nama}</td>
        <td class="border border-black p-1 text-center">75</td>
        <td class="border border-black p-1 text-center font-bold">${val}</td>
        <td class="border border-black p-1 text-center font-bold">${huruf}</td>
        <td class="border border-black p-1 text-center italic">${desk}</td>
      </tr>
    `;
  });

  const catatanT2Q = row[31] || `Ananda ${row[2]} telah menyelesaikan hafalan.`;
  tbody.innerHTML += `
    <tr>
      <td colspan="6" class="border border-black p-1.5 italic font-medium bg-gray-50">
        ${catatanT2Q}
      </td>
    </tr>
  `;

  document.getElementById('rapor-ekstra-pramuka-nilai').innerText = row[18] || 'B';
  document.getElementById('rapor-sikap-ibadah').innerText = row[19] || 'B';
  document.getElementById('rapor-sikap-sosial').innerText = row[20] || 'A';
  document.getElementById('rapor-sikap-mandiri').innerText = row[21] || 'B';
  document.getElementById('rapor-akh-val').innerText = row[22] || 'B';
  document.getElementById('rapor-kpb-val').innerText = row[23] || 'B';

  document.getElementById('rapor-abs-s').innerText = `${row[24] !== "" ? row[24] : 0} Hari`;
  document.getElementById('rapor-abs-i').innerText = `${row[25] !== "" ? row[25] : 0} Hari`;
  document.getElementById('rapor-abs-a').innerText = `${row[26] !== "" ? row[26] : 0} Hari`;

  document.getElementById('rapor-total-val').innerText = row[27] !== "" ? Number(row[27]).toLocaleString('id-ID') : '-';
  document.getElementById('rapor-avg-val').innerText = row[28] !== "" ? Number(row[28]).toFixed(2).replace('.', ',') : '-';
  document.getElementById('rapor-rank-val').innerText = `${row[29] || '-'} dari 26 Siswa`;

  document.getElementById('rapor-ttd-walas').innerText = meta.walas || '( Wali Kelas )';
  document.getElementById('rapor-ttd-tgl').innerText = `Mukomuko, ${meta.tglRapor || '9 Oktober 2026'}`;
}

function logout() {
  sessionStorage.clear();
  window.location.href = "login.html";
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (!sidebar) return;
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    sidebar.classList.toggle('-translate-x-full');
    if (overlay) overlay.classList.toggle('hidden');
  } else {
    sidebar.classList.toggle('hidden');
  }
}
