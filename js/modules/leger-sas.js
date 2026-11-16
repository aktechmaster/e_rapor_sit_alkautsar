// ====================================================
// MODUL 6: LEGER SAS & CETAK LEGER LANDSCAPE F4/A4
// (VERSI SEAMLESS INLINE EDIT & GRID NAVIGATION)
// ====================================================
const MASTER_MAPEL_SAS = [
  { key: "PAI",    short: "PAI",    nama: "Pendidikan Agama Islam",          tingkat: [7, 8, 9], inRapor: true },
  { key: "PKN",    short: "PKN",    nama: "Pendidikan Pancasila",            tingkat: [7, 8, 9], inRapor: true },
  { key: "IND",    short: "IND",    nama: "Bahasa Indonesia",                tingkat: [7, 8, 9], inRapor: true },
  { key: "MTK",    short: "MTK",    nama: "Matematika",                      tingkat: [7, 8, 9], inRapor: true },
  { key: "IPA",    short: "IPA",    nama: "Ilmu Pengetahuan Alam",           tingkat: [7, 8, 9], inRapor: true },
  { key: "IPS",    short: "IPS",    nama: "Ilmu Pengetahuan Sosial",         tingkat: [7, 8, 9], inRapor: true },
  { key: "ING",    short: "ING",    nama: "Bahasa Inggris",                  tingkat: [7, 8, 9], inRapor: true },
  { key: "PJOK",   short: "PJOK",   nama: "Pendidikan Jasmani dan Kesehatan",tingkat: [7, 8, 9], inRapor: true },
  { key: "TIK",    short: "TIK",    nama: "Informatika",                     tingkat: [7, 8, 9], inRapor: true },
  { key: "SBK",    short: "SBK",    nama: "Seni Budaya dan Prakarya",        tingkat: [7, 8, 9], inRapor: true },
  { key: "ARAB",   short: "ARAB",   nama: "Bahasa Arab",                     tingkat: [7, 8, 9], inRapor: true },
  { key: "T2Q",    short: "T2Q",    nama: "Tahsin dan Tahfidz Al-Qur'an",    tingkat: [7, 8, 9], inRapor: true },
  { key: "BPI",    short: "BPI",    nama: "Bina Pribadi Islam",              tingkat: [7, 8, 9], inRapor: false },
  { key: "TARJIM", short: "TARJIM", nama: "Tarjim",                          tingkat: [7],       inRapor: true },
  { key: "CODING", short: "CODING", nama: "Coding",                          tingkat: [7, 8],    inRapor: true }
];

function getTingkatNumberSAS(kelasStr) {
  const match = String(kelasStr || "").match(/\d+/);
  return match ? Number(match[0]) : 9;
}

function getSASMapelByKelas(kelasStr, mode = "leger") {
  const tingkat = getTingkatNumberSAS(kelasStr);
  return MASTER_MAPEL_SAS.filter(m => {
    const matchTingkat = m.tingkat.includes(tingkat);
    if (!matchTingkat) return false;
    return mode === "rapor" ? m.inRapor : true;
  });
}

async function loadLegerSAS(forceRefresh = false) {
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;
  if (!kelasWalas) {
    alert("Akun Anda tidak terdaftar sebagai Wali Kelas!");
    return;
  }

  const semActive = STATE.currentSasSemester || 1;
  const spreadsheetId = CONFIG.RAPOR_SAS_DB?.[semActive]?.[kelasWalas];

  if (!spreadsheetId) {
    alert(`ID Spreadsheet SAS untuk Kelas ${kelasWalas} pada SAS ${semActive} belum diisi di config.js!`);
    return;
  }

  const cacheKey = `${semActive}_${kelasWalas}`;
  const tbody = document.getElementById("table-leger-sas-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="30" class="p-8 text-center text-gray-500 font-medium italic">
          <i class="fa-solid fa-spinner fa-spin text-emerald-600 text-xl mb-2 block"></i>
          Sedang mengambil data Leger SAS ${semActive} Kelas ${kelasWalas}...
        </td>
      </tr>
    `;
  }

  if (!forceRefresh && LEGER_SAS_CACHE[cacheKey] && LEGER_SAS_CACHE[cacheKey].status === "success") {
    CURRENT_LEGER_SAS_DATA = LEGER_SAS_CACHE[cacheKey];
    renderLegerSASTable();
    return;
  }

  const res = await callGASAPI("getLegerSAS", {
    spreadsheetId: spreadsheetId,
    kelas: kelasWalas
  });

  if (res && res.status === "success") {
    LEGER_SAS_CACHE[cacheKey] = res;
    CURRENT_LEGER_SAS_DATA = res;
    renderLegerSASTable();
  } else {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="30" class="p-6 text-center text-rose-600 font-semibold bg-rose-50 border border-rose-200 rounded-lg">
            <i class="fa-solid fa-triangle-exclamation text-lg mb-1 block"></i>
            Gagal memuat data: ${res?.message || "Terjadi kesalahan koneksi ke server."}
          </td>
        </tr>
      `;
    }
  }
}

function renderLegerSASTable() {
  if (!CURRENT_LEGER_SAS_DATA || CURRENT_LEGER_SAS_DATA.status !== "success") return;
  const { meta, data } = CURRENT_LEGER_SAS_DATA;

  const semActive = STATE.currentSasSemester || 1;
  const kelasWalas = STATE.currentUser?.walas_kelas || meta?.kelas || "";
  const namaWalasResmi = (STATE.currentUser && STATE.currentUser.nama_lengkap)
    ? STATE.currentUser.nama_lengkap
    : (meta?.walas || "-");

  const elTitle = document.getElementById("leger-sas-title");
  if (elTitle) {
    elTitle.innerText = `Leger Rekap Nilai SAS ${semActive} (${semActive === 2 ? "Genap" : "Ganjil"})`;
  }

  const elMeta = document.getElementById("leger-sas-meta-info");
  if (elMeta) {
    elMeta.innerText = `Kelas: ${meta?.kelas || kelasWalas} | Wali Kelas: ${namaWalasResmi} | Tahun Pelajaran: ${meta?.tahunPelajaran || "-"}`;
  }

  const activeMapels = getSASMapelByKelas(kelasWalas, "leger");
  const theadRow = document.getElementById("table-leger-sas-header");
  const tbody = document.getElementById("table-leger-sas-body");
  if (!theadRow || !tbody) return;

  // Tombol Simpan
  let btnContainer = document.getElementById("leger-sas-action-container");
  if (!btnContainer) {
    const table = tbody.closest("table");
    if (table && table.parentNode) {
      btnContainer = document.createElement("div");
      btnContainer.id = "leger-sas-action-container";
      btnContainer.className = "flex justify-end mb-3";
      btnContainer.innerHTML = `
        <button id="btn-save-leger-sas" onclick="saveAllLegerSAS()" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-md flex items-center gap-2 transition-all">
          <i class="fa-solid fa-save"></i> Simpan Data Non-Akademik
        </button>
      `;
      table.parentNode.insertBefore(btnContainer, table);
    }
  }

  // Header Tanpa Catatan
  let headerHtml = `
    <th class="p-2 border-r w-10 text-center bg-slate-100 sticky left-0 z-20">NO</th>
    <th class="p-2 border-r w-24 text-center bg-slate-100 sticky left-10 z-20">NISN</th>
    <th class="p-2 border-r w-48 bg-slate-100 sticky left-[136px] z-20">NAMA SISWA</th>
  `;
  activeMapels.forEach(mp => {
    const badgeBg = mp.inRapor ? "bg-blue-50 text-blue-900" : "bg-purple-50 text-purple-900";
    headerHtml += `<th class="p-2 border-r w-12 text-center ${badgeBg}" title="${mp.nama}">${mp.short}</th>`;
  });
  
  headerHtml += `
    <th class="p-2 border-r w-12 text-center bg-emerald-100 font-bold">JML</th>
    <th class="p-2 border-r w-12 text-center bg-emerald-100 font-bold">RATA</th>
    <th class="p-2 border-r w-12 text-center bg-amber-200 font-bold">RNK</th>
    <th class="p-2 border-r w-10 text-center bg-rose-100">S</th>
    <th class="p-2 border-r w-10 text-center bg-rose-100">I</th>
    <th class="p-2 border-r w-10 text-center bg-rose-100">A</th>
    <th class="p-2 border-r w-12 text-center bg-indigo-100">PRA</th>
    <th class="p-2 border-r w-12 text-center bg-indigo-100">IBD</th>
    <th class="p-2 border-r w-12 text-center bg-indigo-100">SOS</th>
    <th class="p-2 border-r w-12 text-center bg-indigo-100">MDR</th>
    <th class="p-2 border-r w-12 text-center bg-indigo-100">AKH</th>
    <th class="p-2 border-r w-12 text-center bg-indigo-100">KPB</th>
  `;
  theadRow.innerHTML = headerHtml;

  // Body Tabel - Input Transparan (Seamless)
  tbody.innerHTML = "";
  if (!data || !Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="30" class="p-4 text-center text-gray-400">Tidak ada data siswa ditemukan.</td></tr>`;
    return;
  }

  // Menggunakan type="text" agar panah atas/bawah tidak merubah angka bawaan browser
  const inputClass = "sas-nav-input w-full h-full min-h-[32px] px-1 bg-transparent text-center focus:outline-none focus:bg-blue-50 focus:ring-inset focus:ring-1 focus:ring-blue-400 text-xs";

  data.forEach((student, idx) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 border-b border-gray-200 h-8 text-xs";

    let rowHtml = `
      <td class="p-1.5 border-r text-center sticky left-0 font-semibold text-gray-600 bg-white">${idx + 1}</td>
      <td class="p-1.5 border-r text-center sticky left-10 text-gray-700 bg-white">${student.nisn || "-"}</td>
      <td class="p-1.5 border-r sticky left-[136px] font-medium text-gray-800 truncate bg-white" title="${student.nama}">${student.nama}</td>
    `;

    let sumNilai = 0;
    let countNilai = 0;

    activeMapels.forEach(mp => {
      const rawScore = student.scores ? student.scores[mp.key] : null;
      const val = (rawScore !== null && rawScore !== undefined && !isNaN(Number(rawScore))) ? Math.round(Number(rawScore)) : null;

      if (val !== null) {
        sumNilai += val;
        countNilai++;
      }
      const cellBg = mp.inRapor ? "" : "bg-purple-50/40 text-purple-900 font-medium";
      rowHtml += `<td class="p-1.5 border-r text-center ${cellBg}">${val !== null ? val : "-"}</td>`;
    });

    const totalDisplay = countNilai > 0 ? sumNilai.toLocaleString("id-ID") : (student.jumlahSheet ?? "-");
    const avgDisplay = countNilai > 0 ? (sumNilai / countNilai).toFixed(2).replace(".", ",") : (student.rataSheet !== null ? Number(student.rataSheet).toFixed(2).replace(".", ",") : "-");

    rowHtml += `
      <td class="p-1.5 border-r text-center font-bold bg-emerald-50 text-emerald-900">${totalDisplay}</td>
      <td class="p-1.5 border-r text-center font-bold bg-emerald-50 text-emerald-900">${avgDisplay}</td>
      <td class="p-1.5 border-r text-center font-extrabold bg-amber-100 text-amber-900">${student.rank ?? "-"}</td>
      
      <td class="p-0 border-r text-center align-middle"><input type="text" inputmode="numeric" id="sas-s-${idx}" value="${student.sakit||''}" class="${inputClass}"></td>
      <td class="p-0 border-r text-center align-middle"><input type="text" inputmode="numeric" id="sas-i-${idx}" value="${student.izin||''}" class="${inputClass}"></td>
      <td class="p-0 border-r text-center align-middle"><input type="text" inputmode="numeric" id="sas-a-${idx}" value="${student.alpa||''}" class="${inputClass}"></td>
      
      <td class="p-0 border-r text-center align-middle"><input type="text" id="sas-pra-${idx}" value="${student.pra||''}" class="${inputClass} uppercase"></td>
      <td class="p-0 border-r text-center align-middle"><input type="text" id="sas-ibd-${idx}" value="${student.ibd||''}" class="${inputClass} uppercase"></td>
      <td class="p-0 border-r text-center align-middle"><input type="text" id="sas-sos-${idx}" value="${student.sos||''}" class="${inputClass} uppercase"></td>
      <td class="p-0 border-r text-center align-middle"><input type="text" id="sas-mdr-${idx}" value="${student.mdr||''}" class="${inputClass} uppercase"></td>
      <td class="p-0 border-r text-center align-middle"><input type="text" id="sas-akh-${idx}" value="${student.akh||''}" class="${inputClass} uppercase"></td>
      <td class="p-0 border-r text-center align-middle"><input type="text" id="sas-kpb-${idx}" value="${student.kpb||''}" class="${inputClass} uppercase"></td>
    `;

    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  });

  attachGridNavigation();
}

// Fungsi Navigasi Keyboard (Atas, Bawah, Kiri, Kanan)
function attachGridNavigation() {
  const inputs = Array.from(document.querySelectorAll('.sas-nav-input'));
  const colsPerRow = 9; // Jumlah kolom input (S, I, A, PRA, IBD, SOS, MDR, AKH, KPB)

  inputs.forEach((input, index) => {
    input.addEventListener('keydown', function(e) {
      let nextIndex = null;
      
      if (e.key === 'ArrowUp') {
        nextIndex = index - colsPerRow;
        e.preventDefault(); // Mencegah kursor lari ke awal teks
      } else if (e.key === 'ArrowDown') {
        nextIndex = index + colsPerRow;
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        nextIndex = index - 1;
      } else if (e.key === 'ArrowRight') {
        nextIndex = index + 1;
      }

      if (nextIndex !== null && nextIndex >= 0 && nextIndex < inputs.length) {
        inputs[nextIndex].focus();
        inputs[nextIndex].select(); // Memblok teks otomatis agar cepat diedit
      }
    });
  });
}

// ==========================================
// FUNGSI SIMPAN MASSAL (BATCH SAVE)
// ==========================================
async function saveAllLegerSAS() {
  if (!CURRENT_LEGER_SAS_DATA || !CURRENT_LEGER_SAS_DATA.data) return;

  const btn = document.getElementById("btn-save-leger-sas");
  if (btn) {
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;
    btn.disabled = true;
  }

  const kelasWalas = STATE.currentUser.walas_kelas;
  const semActive = STATE.currentSasSemester || 1;
  const spreadsheetId = CONFIG.RAPOR_SAS_DB[semActive][kelasWalas];

  const payload = CURRENT_LEGER_SAS_DATA.data.map((student, idx) => {
    return {
      id: student.nisn || "",
      nama: student.nama,
      s: document.getElementById(`sas-s-${idx}`).value,
      i: document.getElementById(`sas-i-${idx}`).value,
      a: document.getElementById(`sas-a-${idx}`).value,
      pra: document.getElementById(`sas-pra-${idx}`).value.toUpperCase(),
      ibd: document.getElementById(`sas-ibd-${idx}`).value.toUpperCase(),
      sos: document.getElementById(`sas-sos-${idx}`).value.toUpperCase(),
      mdr: document.getElementById(`sas-mdr-${idx}`).value.toUpperCase(),
      akh: document.getElementById(`sas-akh-${idx}`).value.toUpperCase(),
      kpb: document.getElementById(`sas-kpb-${idx}`).value.toUpperCase()
    };
  });

  const res = await callGASAPI("updateLegerSAS", {
    spreadsheetId: spreadsheetId,
    sheetName: "LEGER", // <--- PERBAIKAN DI SINI (sebelumnya `LEGER ${kelasWalas}`)
    data: payload 
  });

  if (btn) {
    btn.innerHTML = `<i class="fa-solid fa-save"></i> Simpan Data Non-Akademik`;
    btn.disabled = false;
  }

  if (res && res.status === "success") {
    alert("Berhasil menyimpan seluruh data non-akademik SAS.");
    loadLegerSAS(true);
  } else {
    alert("Gagal menyimpan: " + (res?.message || "Kesalahan jaringan."));
  }
}

// ====================================================
// CETAK LEGER SAS LANDSCAPE F4 / A4
// ====================================================
function cetakLegerSAS() {
  if (!CURRENT_LEGER_SAS_DATA || CURRENT_LEGER_SAS_DATA.status !== "success") {
    alert("Data Leger SAS belum dimuat. Silakan tunggu hingga tabel tampil terlebih dahulu.");
    return;
  }

  const { meta, data } = CURRENT_LEGER_SAS_DATA;
  const semActive = STATE.currentSasSemester || 1;
  const kelasWalas = STATE.currentUser?.walas_kelas || meta?.kelas || "";
  const activeMapels = getSASMapelByKelas(kelasWalas, "leger");

  const namaWalas = (STATE.currentUser && STATE.currentUser.nama_lengkap)
    ? STATE.currentUser.nama_lengkap
    : (meta?.walas || "-");
  const rawNipyWalas = (STATE.currentUser && STATE.currentUser.nip_nik)
    ? STATE.currentUser.nip_nik
    : (meta?.nipyWalas || "");
  const cleanNipyWalas = rawNipyWalas ? `NIPY. ${String(rawNipyWalas).replace(/^NIPY\.?\s*/i, "")}` : "";

  const kepsekNama = meta?.kepsek || "Warto, S.Pd.I., M.Pd., Gr.";
  const cleanNipyKepsek = meta?.nipyKepsek
    ? `NIPY. ${String(meta.nipyKepsek).replace(/^NIPY\.?\s*/i, "")}`
    : "NIPY. 141981071801014";

  let thMapel = "";
  activeMapels.forEach(mp => {
    thMapel += `<th style="width: 26px;">${mp.short}</th>`;
  });

  let rowsHtml = "";
  data.forEach((student, idx) => {
    let tdScores = "";
    let sum = 0;
    let cnt = 0;
    activeMapels.forEach(mp => {
      const rawScore = student.scores ? student.scores[mp.key] : null;
      const val = (rawScore !== null && rawScore !== undefined && !isNaN(Number(rawScore)))
        ? Math.round(Number(rawScore))
        : null;
      if (val !== null) {
        sum += val;
        cnt++;
      }
      tdScores += `<td class="tc">${val !== null ? val : "-"}</td>`;
    });

    const totalStr = cnt > 0 ? sum.toLocaleString("id-ID") : "-";
    const avgStr = cnt > 0 ? (sum / cnt).toFixed(2).replace(".", ",") : "-";

    rowsHtml += `
      <tr>
        <td class="tc">${idx + 1}</td>
        <td class="tc">${student.nisn || "-"}</td>
        <td class="tl" style="white-space: nowrap;">${student.nama}</td>
        ${tdScores}
        <td class="tc bold">${totalStr}</td>
        <td class="tc bold">${avgStr}</td>
        <td class="tc bold">${student.rank ?? "-"}</td>
        <td class="tc">${student.sakit ?? 0}</td>
        <td class="tc">${student.izin ?? 0}</td>
        <td class="tc">${student.alpa ?? 0}</td>
      </tr>
    `;
  });

  const printWin = window.open("", "_blank");
  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Cetak Leger SAS ${semActive} - ${meta?.kelas || kelasWalas}</title>
      <style>
        @page { size: 330.2mm 215.9mm; margin: 10mm 12mm; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 8.5pt; color: #000; margin: 0; padding: 0; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
        .header h2 { margin: 0; font-size: 12pt; text-transform: uppercase; }
        .header h3 { margin: 2px 0; font-size: 11pt; text-transform: uppercase; }
        .header p  { margin: 0; font-size: 8.5pt; }
        .meta { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 6px; font-size: 9pt; }
        table { width: 100%; border-collapse: collapse; font-size: 8pt; }
        th, td { border: 1px solid #000; padding: 2.5px 3px; }
        th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
        .tc { text-align: center; }
        .tl { text-align: left; }
        .bold { font-weight: bold; }
        .ttd-wrap { display: flex; justify-content: space-between; margin-top: 14px; padding: 0 30px; font-size: 9pt; page-break-inside: avoid; }
        .ttd-box { text-align: center; width: 240px; }
        .ttd-space-walas { height: 56px; }
        .ttd-space-kepsek { height: 42px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>YAYASAN AL-AMANAH MUKOMUKO — SMPIT AL-KAUTSAR</h2>
        <h3>LEGER NILAI SUMATIF AKHIR SEMESTER (SAS) ${semActive === 2 ? "GENAP" : "GANJIL"}</h3>
        <p>Alamat: ${meta?.alamatSekolah || "Jalan Kuku Besi Sukarame"}, Kota Mukomuko, Bengkulu</p>
      </div>
      <div class="meta">
        <span>Kelas: ${meta?.kelas || kelasWalas} | Fase: ${meta?.fase || "D"}</span>
        <span>Semester: ${semActive === 2 ? "II (Genap)" : "I (Ganjil)"} | Tahun Pelajaran: ${meta?.tahunPelajaran || "2025/2026"}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width: 22px;">No</th>
            <th rowspan="2" style="width: 68px;">NISN</th>
            <th rowspan="2">Nama Peserta Didik</th>
            <th colspan="${activeMapels.length}">Nilai Mata Pelajaran</th>
            <th rowspan="2" style="width: 40px;">Jml</th>
            <th rowspan="2" style="width: 36px;">Rata</th>
            <th rowspan="2" style="width: 30px;">Rank</th>
            <th colspan="3">Absensi</th>
          </tr>
          <tr>
            ${thMapel}
            <th style="width: 20px;">S</th>
            <th style="width: 20px;">I</th>
            <th style="width: 20px;">A</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <div class="ttd-wrap">
        <div class="ttd-box">
          <p style="margin:0;">Mengetahui,</p>
          <p style="margin:0;">Kepala SMPIT Al-Kautsar</p>
          <div class="ttd-space-walas"></div>
          <p style="margin:0; font-weight:bold; text-decoration:underline;">${kepsekNama}</p>
          <p style="margin:0; font-size:8pt;">${cleanNipyKepsek}</p>
        </div>
        <div class="ttd-box">
          <p style="margin:0;">${meta?.tglRapor || "Mukomuko, 19 Desember 2025"}</p>
          <p style="margin:0;">Wali Kelas ${meta?.kelas || kelasWalas}</p>
          <div class="ttd-space-kepsek"></div>
          <p style="margin:0; font-weight:bold; text-decoration:underline;">${namaWalas}</p>
          <p style="margin:0; font-size:8pt;">${cleanNipyWalas}</p>
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `);
  printWin.document.close();
}
