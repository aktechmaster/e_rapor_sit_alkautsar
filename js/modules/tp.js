// ====================================================
// MODUL 1: SETTING CP / TP
// ====================================================
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
