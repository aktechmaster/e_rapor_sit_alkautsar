// ====================================================
// MODUL 5: LEGER STS (KHUSUS KELAS WALI)
// ====================================================
async function loadLegerSTS(forceRefresh = false) {
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;
  if (!kelasWalas) {
    alert("Akun Anda tidak terdaftar sebagai Wali Kelas!");
    return;
  }

  const semActive = STATE.currentStsSemester || 1;
  const spreadsheetId = CONFIG.RAPOR_STS_DB?.[semActive]?.[kelasWalas];

  if (!spreadsheetId) {
    alert(`ID Spreadsheet STS untuk Kelas ${kelasWalas} pada STS ${semActive} belum diisi di config.js!`);
    return;
  }

  const cacheKey = `${semActive}_${kelasWalas}`;

  // 1. TAMPILKAN STATUS LOADING DI TABEL
  const tbody = document.getElementById('table-leger-body');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="32" class="p-8 text-center text-gray-500 font-medium italic">
          <i class="fa-solid fa-spinner fa-spin text-indigo-600 text-xl mb-2 block"></i>
          Sedang mengambil data Leger STS ${semActive} Kelas ${kelasWalas}...
        </td>
      </tr>
    `;
  }

  // 2. GUNAKAN CACHE HANYA JIKA ADA DAN TIDAK DIPAKSA REFRESH
  if (!forceRefresh && LEGER_STS_CACHE[cacheKey] && LEGER_STS_CACHE[cacheKey].status === "success") {
    CURRENT_LEGER_DATA = LEGER_STS_CACHE[cacheKey];
    renderLegerTable();
    return;
  }

  // 3. PANGGIL API GAS
  const res = await callGASAPI("getLegerSTS", { 
    spreadsheetId: spreadsheetId, 
    kelas: kelasWalas 
  });

  if (res && res.status === "success") {
    LEGER_STS_CACHE[cacheKey] = res; // Simpan cache jika berhasil
    CURRENT_LEGER_DATA = res;
    renderLegerTable();
  } else {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="32" class="p-6 text-center text-rose-600 font-semibold bg-rose-50 border border-rose-200 rounded-lg">
            <i class="fa-solid fa-triangle-exclamation text-lg mb-1 block"></i>
            Gagal memuat data: ${res?.message || "Terjadi kesalahan koneksi ke server."}
          </td>
        </tr>
      `;
    }
  }
}

function renderLegerTable() {
  if (!CURRENT_LEGER_DATA || CURRENT_LEGER_DATA.status !== "success") return;
  const { meta, data } = CURRENT_LEGER_DATA;

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
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="32" class="p-4 text-center text-gray-400">Tidak ada data siswa ditemukan.</td></tr>`;
    return;
  }

  data.forEach((row) => {
    const no = row[0];
    const kelasStr = row[1];
    const namaSiswa = row[2];

    // Lewati baris header jika terbaca dari sheet
    if (!namaSiswa || namaSiswa === "NAMA SISWA" || namaSiswa === "NAMA" || no === "NO") return;
    
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 border-b border-gray-200 h-8 text-xs";
    let html = `
      <td class="p-1.5 border-r text-center sticky-col left-0 font-semibold text-gray-600 bg-white">${no}</td>
      <td class="p-1.5 border-r text-center sticky-col left-10 text-gray-700 bg-white">${kelasStr}</td>
      <td class="p-1.5 border-r sticky-col left-[136px] font-medium text-gray-800 truncate bg-white" title="${namaSiswa}">${namaSiswa}</td>
    `;
    
    // Nilai Mapel (Kolom D - R / indeks 3 - 17)
    for (let c = 3; c <= 17; c++) {
      const val = row[c] !== "" && row[c] !== undefined ? Math.round(Number(row[c])) : "-";
      html += `<td class="p-1.5 border-r text-center">${isNaN(val) ? (row[c] || "-") : val}</td>`;
    }
    
    // Sikap (Kolom S - X / indeks 18 - 23)
    for (let c = 18; c <= 23; c++) {
      const val = row[c] || "-";
      html += `<td class="p-1.5 border-r text-center font-semibold text-amber-700 bg-amber-50/30">${val}</td>`;
    }
    
    // Absensi (Kolom Y - AA / indeks 24 - 26)
    for (let c = 24; c <= 26; c++) {
      const val = row[c] !== "" && row[c] !== undefined ? row[c] : "0";
      html += `<td class="p-1.5 border-r text-center bg-rose-50/30">${val}</td>`;
    }
    
    // Rekap (Total, Rata, Rank, Hafalan)
    const total = row[27] !== "" && row[27] !== undefined ? Number(row[27]).toLocaleString('id-ID') : "-";
    const avg = row[28] !== "" && row[28] !== undefined ? Number(row[28]).toFixed(2).replace('.', ',') : "-";
    const rank = row[29] !== "" && row[29] !== undefined ? row[29] : "-";
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
