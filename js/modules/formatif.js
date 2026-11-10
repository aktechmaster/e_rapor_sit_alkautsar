// ====================================================
// MODUL 3: NILAI FORMATIF
// ====================================================
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
