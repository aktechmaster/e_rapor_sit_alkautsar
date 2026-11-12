// ====================================================
// MODUL KHUSUS HALAMAN CETAK RAPOR STS (cetak-sts.html)
// ====================================================
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Pulihkan sesi user login
  if (typeof checkAuthSession === "function") {
    try { checkAuthSession(); } catch (e) {}
  }
  if (!STATE.currentUser) {
    const savedUser = sessionStorage.getItem("ERAPOR_PRINT_USER");
    if (savedUser) STATE.currentUser = JSON.parse(savedUser);
  }

  // 2. Baca parameter semester dari URL (?sem=1 atau ?sem=2)
  const urlParams = new URLSearchParams(window.location.search);
  const semParam = Number(urlParams.get("sem")) || Number(sessionStorage.getItem("ERAPOR_PRINT_SEM")) || 1;
  STATE.currentStsSemester = semParam;

  const selectSem = document.getElementById("select-semester-sts");
  if (selectSem) selectSem.value = String(semParam);

  await initCetakRaporSTS();
});

async function gantiSemesterSTS(semValue) {
  STATE.currentStsSemester = Number(semValue);
  sessionStorage.setItem("ERAPOR_PRINT_SEM", String(semValue));
  await initCetakRaporSTS(true);
}

async function initCetakRaporSTS(forceFetch = false) {
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;
  if (!kelasWalas) {
    alert("Sesi Wali Kelas tidak ditemukan. Silakan buka halaman ini melalui menu Cetak Rapor STS di Dashboard.");
    return;
  }

  const semActive = STATE.currentStsSemester || 1;
  const cacheKey = `${semActive}_${kelasWalas}`;
  const selectSiswa = document.getElementById("select-siswa-rapor");

  // Cek apakah ada data kiriman langsung dari index.html di sessionStorage
  if (!forceFetch && !LEGER_STS_CACHE[cacheKey]) {
    const rawCache = sessionStorage.getItem(`ERAPOR_LEGER_${cacheKey}`);
    if (rawCache) {
      try {
        const parsed = JSON.parse(rawCache);
        if (parsed && parsed.status === "success") {
          LEGER_STS_CACHE[cacheKey] = parsed;
        }
      } catch (e) {}
    }
  }

  // Jika belum ada di cache, tarik langsung dari GAS API
  if (forceFetch || !LEGER_STS_CACHE[cacheKey]) {
    const spreadsheetId = CONFIG.RAPOR_STS_DB?.[semActive]?.[kelasWalas];
    if (!spreadsheetId) {
      alert(`ID Spreadsheet untuk Kelas ${kelasWalas} pada STS ${semActive} belum diisi di config.js!`);
      if (selectSiswa) selectSiswa.innerHTML = `<option value="">-- Data STS ${semActive} Kosong --</option>`;
      return;
    }

    if (selectSiswa) selectSiswa.innerHTML = `<option value="">-- Mengambil Data dari Server... --</option>`;

    const res = await callGASAPI("getLegerSTS", {
      spreadsheetId: spreadsheetId,
      kelas: kelasWalas
    });

    if (res && res.status === "success") {
      LEGER_STS_CACHE[cacheKey] = res;
      sessionStorage.setItem(`ERAPOR_LEGER_${cacheKey}`, JSON.stringify(res));
    } else {
      alert("Gagal mengambil data rapor: " + (res?.message || "Koneksi bermasalah."));
      return;
    }
  }

  CURRENT_LEGER_DATA = LEGER_STS_CACHE[cacheKey];
  if (!CURRENT_LEGER_DATA || !selectSiswa) return;

  selectSiswa.innerHTML = "";
  const dataSiswa = CURRENT_LEGER_DATA.data || [];
  let firstValidIdx = -1;

  dataSiswa.forEach((row, idx) => {
    if (row[2] && row[2] !== "NAMA SISWA" && row[2] !== "NAMA") {
      if (firstValidIdx === -1) firstValidIdx = idx;
      selectSiswa.innerHTML += `<option value="${idx}">${row[0]}. ${row[2]}</option>`;
    }
  });

  if (firstValidIdx !== -1) {
    CURRENT_SISWA_INDEX = firstValidIdx;
    selectSiswa.value = String(firstValidIdx);
    renderLembarRapor(firstValidIdx);
  }
}

function prevSiswaRapor() {
  const selectSiswa = document.getElementById("select-siswa-rapor");
  if (selectSiswa && selectSiswa.selectedIndex > 0) {
    selectSiswa.selectedIndex--;
    renderLembarRapor(selectSiswa.value);
  }
}

function nextSiswaRapor() {
  const selectSiswa = document.getElementById("select-siswa-rapor");
  if (selectSiswa && selectSiswa.selectedIndex < selectSiswa.options.length - 1) {
    selectSiswa.selectedIndex++;
    renderLembarRapor(selectSiswa.value);
  }
}

function renderLembarRapor(siswaIndex) {
  siswaIndex = Number(siswaIndex);
  CURRENT_SISWA_INDEX = siswaIndex;
  if (!CURRENT_LEGER_DATA) return;

  const meta = CURRENT_LEGER_DATA.meta || {};
  const row = CURRENT_LEGER_DATA.data[siswaIndex];
  if (!row) return;

  const namaSiswa = row[2] || "-";

  // Kunci pencarian ganda (Standard & Alpha-only)
  const keyUpper = String(namaSiswa).trim().replace(/\s+/g, " ").toUpperCase();
  const keyAlpha = String(namaSiswa).toUpperCase().replace(/[^A-Z0-9]/g, "");

  const ortuMap = meta.ortuMap || {};
  const nisnMap = meta.nisnMap || {};

  const realNisn = nisnMap[keyUpper] || nisnMap[keyAlpha] || "-";
  const namaOrtu = ortuMap[keyUpper] || ortuMap[keyAlpha] || "";

  document.getElementById("lbl-rapor-nama").innerText = namaSiswa;
  document.getElementById("lbl-rapor-kelas").innerText = meta.kelas || "-";
  document.getElementById("lbl-rapor-nisn").innerText = realNisn;

  // Judul & Semester Dinamis (STS 1 / STS 2)
  const semActive = STATE.currentStsSemester || 1;
  const elJudul = document.getElementById("lbl-rapor-judul");
  const elSemester = document.getElementById("lbl-rapor-semester");

  if (elJudul) {
    elJudul.textContent = semActive === 2
      ? "LAPORAN HASIL BELAJAR SUMATIF TENGAH SEMESTER GENAP"
      : "LAPORAN HASIL BELAJAR SUMATIF TENGAH SEMESTER GANJIL";
  }

  if (elSemester) {
    elSemester.textContent = semActive === 2 ? "II (Genap)" : "I (Ganjil)";
  }

  // Tanda Tangan Orang Tua
  const elOrtu = document.getElementById("rapor-ttd-ortu");
  if (elOrtu) {
    elOrtu.innerText = namaOrtu ? `( ${namaOrtu} )` : "( .................................... )";
  }

  // Wali Kelas
  const namaWalasResmi = (STATE.currentUser && STATE.currentUser.nama_lengkap)
    ? STATE.currentUser.nama_lengkap
    : (meta.walas || "( Wali Kelas )");

  const elWalas = document.getElementById("rapor-ttd-walas");
  if (elWalas) elWalas.innerText = namaWalasResmi;

  const elWalasNipy = document.getElementById("rapor-ttd-walas-nipy");
  if (elWalasNipy) {
    const nipVal = (STATE.currentUser && STATE.currentUser.nip_nik)
      ? STATE.currentUser.nip_nik
      : meta.nipyWalas;

    if (nipVal) {
      const cleanNipy = String(nipVal).replace(/^NIPY\.?\s*/i, "");
      elWalasNipy.innerText = `NIPY. ${cleanNipy}`;
    } else {
      elWalasNipy.innerText = "";
    }
  }

  // Tanggal & Kepala Sekolah
  const elTgl = document.getElementById("rapor-ttd-tgl");
  if (elTgl) elTgl.innerText = `Mukomuko, ${meta.tglRapor || "9 Oktober 2026"}`;

  const elKepsek = document.getElementById("rapor-ttd-kepsek");
  if (elKepsek) elKepsek.innerText = meta.kepsek || "Warto, S.Pd.I., M.Pd., Gr.";

  const elKepsekNipy = document.getElementById("rapor-ttd-kepsek-nipy");
  if (elKepsekNipy) {
    if (meta.nipyKepsek) {
      const cleanKepsekNipy = String(meta.nipyKepsek).replace(/^NIPY\.?\s*/i, "");
      elKepsekNipy.innerText = `NIPY. ${cleanKepsekNipy}`;
    } else {
      elKepsekNipy.innerText = "NIPY. 141981071801014";
    }
  }

  const mapelList = [
    { no: 1,  nama: "Pendidikan Agama Islam", col: 3, grp: "A" },
    { no: 2,  nama: "Pendidikan Kewarganegaraan", col: 4, grp: "A" },
    { no: 3,  nama: "Bahasa Indonesia", col: 5, grp: "A" },
    { no: 4,  nama: "Matematika", col: 6, grp: "A" },
    { no: 5,  nama: "Ilmu Pengetahuan Alam", col: 7, grp: "A" },
    { no: 6,  nama: "Ilmu Pengetahuan Sosial", col: 8, grp: "A" },
    { no: 7,  nama: "Bahasa Inggris", col: 9, grp: "A" },
    { no: 8,  nama: "Pendidikan Jasmani Olahraga dan Kesehatan", col: 10, grp: "B" },
    { no: 9,  nama: "Teknologi Informasi dan Komunikasi", col: 11, grp: "B" },
    { no: 10, nama: "Seni Budaya dan Keterampilan", col: 12, grp: "B" },
    { no: 11, nama: "Bahasa Arab", col: 13, grp: "B" },
    { no: 12, nama: "Tarjim", col: 16, grp: "B" },
    { no: 13, nama: "Koding", col: 17, grp: "B" },
    { no: 14, nama: "Tahsin dan Tahfidzul Qur'an", col: 14, grp: "B" }
  ];

  const tbody = document.getElementById("rapor-tbody-nilai");
  tbody.innerHTML = "";

  const getHuruf = (val) => {
    if (val >= 90) return "A";
    if (val >= 80) return "B";
    if (val >= 75) return "C";
    if (val >= 60) return "D";
    return "E";
  };

  // Kelompok A
  tbody.innerHTML += `<tr class="bg-gray-100 font-bold"><td colspan="6" class="border border-black p-1">Kelompok A :</td></tr>`;
  mapelList.filter(m => m.grp === "A").forEach(m => {
    const val = row[m.col] !== "" && row[m.col] !== undefined ? Math.round(Number(row[m.col])) : "-";
    const huruf = typeof val === "number" && !isNaN(val) ? getHuruf(val) : "-";
    const desk = typeof val === "number" && !isNaN(val) ? (val >= 75 ? "Terlampaui" : "Belum Tercapai") : "Belum Tercapai";
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

  // Kelompok B
  tbody.innerHTML += `<tr class="bg-gray-100 font-bold"><td colspan="6" class="border border-black p-1">Kelompok B :</td></tr>`;
  mapelList.filter(m => m.grp === "B").forEach(m => {
    const val = row[m.col] !== "" && row[m.col] !== undefined ? Math.round(Number(row[m.col])) : "-";
    const huruf = typeof val === "number" && !isNaN(val) ? getHuruf(val) : "-";
    const desk = typeof val === "number" && !isNaN(val) ? (val >= 75 ? "Terlampaui" : "Belum Tercapai") : "Belum Tercapai";
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

  document.getElementById("rapor-ekstra-pramuka-nilai").innerText = row[18] || "B";
  document.getElementById("rapor-sikap-ibadah").innerText = row[19] || "B";
  document.getElementById("rapor-sikap-sosial").innerText = row[20] || "A";
  document.getElementById("rapor-sikap-mandiri").innerText = row[21] || "B";
  document.getElementById("rapor-akh-val").innerText = row[22] || "B";
  document.getElementById("rapor-kpb-val").innerText = row[23] || "B";
  document.getElementById("rapor-abs-s").innerText = `${row[24] !== "" && row[24] !== undefined ? row[24] : 0} Hari`;
  document.getElementById("rapor-abs-i").innerText = `${row[25] !== "" && row[25] !== undefined ? row[25] : 0} Hari`;
  document.getElementById("rapor-abs-a").innerText = `${row[26] !== "" && row[26] !== undefined ? row[26] : 0} Hari`;
  document.getElementById("rapor-total-val").innerText = row[27] !== "" && row[27] !== undefined ? Number(row[27]).toLocaleString("id-ID") : "-";
  document.getElementById("rapor-avg-val").innerText = row[28] !== "" && row[28] !== undefined ? Number(row[28]).toFixed(2).replace(".", ",") : "-";
}
