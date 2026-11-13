// ====================================================
// MODUL 6: LEGER SAS & CETAK LEGER LANDSCAPE F4/A4
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
        <td colspan="24" class="p-8 text-center text-gray-500 font-medium italic">
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
          <td colspan="24" class="p-6 text-center text-rose-600 font-semibold bg-rose-50 border border-rose-200 rounded-lg">
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

  // Bangun Header Dinamis Sesuai Jenjang (15/14/13 Mapel)
  let headerHtml = `
    <th class="p-2 border-r w-10 text-center bg-slate-100 sticky left-0 z-20">NO</th>
    <th class="p-2 border-r w-28 text-center bg-slate-100 sticky left-10 z-20">NISN</th>
    <th class="p-2 border-r w-52 bg-slate-100 sticky left-[152px] z-20">NAMA SISWA</th>
  `;
  activeMapels.forEach(mp => {
    const badgeBg = mp.inRapor ? "bg-blue-50 text-blue-900" : "bg-purple-50 text-purple-900";
    headerHtml += `<th class="p-2 border-r w-14 text-center ${badgeBg}" title="${mp.nama}${mp.inRapor ? '' : ' (Khusus Leger)'}">${mp.short}</th>`;
  });
  headerHtml += `
    <th class="p-2 border-r w-16 text-center bg-emerald-100 font-bold">JUMLAH</th>
    <th class="p-2 border-r w-16 text-center bg-emerald-100 font-bold">RATA</th>
    <th class="p-2 border-r w-14 text-center bg-amber-200 font-bold">RANK</th>
    <th class="p-2 border-r w-10 text-center bg-rose-50">S</th>
    <th class="p-2 border-r w-10 text-center bg-rose-50">I</th>
    <th class="p-2 border-r w-10 text-center bg-rose-50">A</th>
  `;
  theadRow.innerHTML = headerHtml;

  tbody.innerHTML = "";
  if (!data || !Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${activeMapels.length + 9}" class="p-4 text-center text-gray-400">Tidak ada data siswa ditemukan.</td></tr>`;
    return;
  }

  data.forEach((student, idx) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 border-b border-gray-200 h-8 text-xs";

    let rowHtml = `
      <td class="p-1.5 border-r text-center sticky left-0 font-semibold text-gray-600 bg-white">${student.no || idx + 1}</td>
      <td class="p-1.5 border-r text-center sticky left-10 text-gray-700 bg-white">${student.nisn || "-"}</td>
      <td class="p-1.5 border-r sticky left-[152px] font-medium text-gray-800 truncate bg-white" title="${student.nama}">${student.nama}</td>
    `;

    let sumNilai = 0;
    let countNilai = 0;

    activeMapels.forEach(mp => {
      const rawScore = student.scores ? student.scores[mp.key] : null;
      const val = (rawScore !== null && rawScore !== undefined && !isNaN(Number(rawScore)))
        ? Math.round(Number(rawScore))
        : null;

      if (val !== null) {
        sumNilai += val;
        countNilai++;
      }

      const cellBg = mp.inRapor ? "" : "bg-purple-50/40 text-purple-900 font-medium";
      rowHtml += `<td class="p-1.5 border-r text-center ${cellBg}">${val !== null ? val : "-"}</td>`;
    });

    const totalDisplay = countNilai > 0 ? sumNilai.toLocaleString("id-ID") : (student.jumlahSheet ?? "-");
    const avgDisplay = countNilai > 0
      ? (sumNilai / countNilai).toFixed(2).replace(".", ",")
      : (student.rataSheet !== null ? Number(student.rataSheet).toFixed(2).replace(".", ",") : "-");

    rowHtml += `
      <td class="p-1.5 border-r text-center font-bold bg-emerald-50 text-emerald-900">${totalDisplay}</td>
      <td class="p-1.5 border-r text-center font-bold bg-emerald-50 text-emerald-900">${avgDisplay}</td>
      <td class="p-1.5 border-r text-center font-extrabold bg-amber-100 text-amber-900">${student.rank ?? "-"}</td>
      <td class="p-1.5 border-r text-center bg-rose-50/30">${student.sakit ?? 0}</td>
      <td class="p-1.5 border-r text-center bg-rose-50/30">${student.izin ?? 0}</td>
      <td class="p-1.5 border-r text-center bg-rose-50/30">${student.alpa ?? 0}</td>
    `;

    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  });
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
        <td class="tc">${student.no || idx + 1}</td>
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
        @page {
          size: 330.2mm 215.9mm; /* F4 Landscape */
          margin: 10mm 12mm;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 8.5pt;
          color: #000;
          margin: 0;
          padding: 0;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 6px;
          margin-bottom: 8px;
        }
        .header h2 { margin: 0; font-size: 12pt; text-transform: uppercase; }
        .header h3 { margin: 2px 0; font-size: 11pt; text-transform: uppercase; }
        .header p  { margin: 0; font-size: 8.5pt; }
        .meta {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin-bottom: 6px;
          font-size: 9pt;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
        }
        th, td {
          border: 1px solid #000;
          padding: 2.5px 3px;
        }
        th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }
        .tc { text-align: center; }
        .tl { text-align: left; }
        .bold { font-weight: bold; }
        .ttd-wrap {
          display: flex;
          justify-content: space-between;
          margin-top: 14px;
          padding: 0 30px;
          font-size: 9pt;
          page-break-inside: avoid;
        }
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
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  printWin.document.close();
}
