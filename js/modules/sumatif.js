// ====================================================
// MODUL 2: NILAI SUMATIF
// ====================================================
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
