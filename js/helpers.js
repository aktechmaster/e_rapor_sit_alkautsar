// ====================================================
// API DATA FETCHING (CACHED)
// ====================================================
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
