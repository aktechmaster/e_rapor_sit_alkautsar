// ====================================================
// MODUL 4: KATROL
// ====================================================
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
