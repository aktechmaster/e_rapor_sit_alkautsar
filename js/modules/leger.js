// ====================================================
// MODUL 5: LEGER STS (KHUSUS KELAS WALI)
// ====================================================
async function loadLegerSTS(forceRefresh = false) {
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;
  if (!kelasWalas) {
    alert("Akun Anda tidak terdaftar sebagai Wali Kelas!");
    return;
  }

  // 1. Ambil semester aktif (STS 1 atau STS 2) dari State
  const semActive = STATE.currentStsSemester || 1;

  // 2. Ambil ID Spreadsheet dinamis dari config.js berdasarkan semester dan kelas
  const spreadsheetId = CONFIG.RAPOR_STS_DB?.[semActive]?.[kelasWalas];
  if (!spreadsheetId) {
    alert(`ID Spreadsheet STS untuk Kelas ${kelasWalas} pada STS ${semActive} belum diisi di config.js!`);
    return;
  }

  // 3. Kunci cache dipisahkan per semester dan kelas
  const cacheKey = `${semActive}_${kelasWalas}`;

  if (!forceRefresh && LEGER_STS_CACHE[cacheKey]) {
    CURRENT_LEGER_DATA = LEGER_STS_CACHE[cacheKey];
    renderLegerTable();
    return;
  }

  // 4. Kirim spreadsheetId dan kelas ke GAS API
  const res = await callGASAPI("getLegerSTS", { 
    spreadsheetId: spreadsheetId, 
    kelas: kelasWalas 
  });

  if (res && res.status === "success") {
    LEGER_STS_CACHE[cacheKey] = res;
    CURRENT_LEGER_DATA = res;
    renderLegerTable();
  } else {
    alert("Gagal mengambil data Leger STS: " + (res?.message || "Terjadi kesalahan koneksi."));
  }
}

function renderLegerTable() {
  if (!CURRENT_LEGER_DATA) return;
  const { meta, data } = CURRENT_LEGER_DATA;

  // Mengambil nama Walas resmi dari akun login (Dashboard), atau fallback ke meta
  const namaWalasResmi = (STATE.currentUser && STATE.currentUser.nama_lengkap) 
    ? STATE.currentUser.nama_lengkap 
    : (meta?.walas || '-');

  const elMeta = document.getElementById('leger-meta-info');
  if (elMeta) {
    elMeta.innerText = `Kelas: ${meta?.kelas || '-'} | Wali Kelas: ${namaWalasResmi}`;
  }
  
  const tbody = document.getElementById('table-leger-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (!data || !Array.isArray(data)) return;

  data.forEach((row) => {
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
