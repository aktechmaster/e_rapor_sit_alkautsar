// ====================================================
// MODUL KHUSUS HALAMAN CETAK COVER SAS (3 LEMBAR F4)
// ====================================================
let CURRENT_COVER_SISWA_INDEX = 0;

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof checkAuthSession === "function") {
    try { checkAuthSession(); } catch (e) {}
  }
  if (!STATE.currentUser) {
    const savedUser = sessionStorage.getItem("ERAPOR_PRINT_USER");
    if (savedUser) STATE.currentUser = JSON.parse(savedUser);
  }

  const urlParams = new URLSearchParams(window.location.search);
  const semParam = Number(urlParams.get("sem")) || Number(sessionStorage.getItem("ERAPOR_PRINT_SAS_SEM")) || 1;
  STATE.currentSasSemester = semParam;

  const selectSem = document.getElementById("select-semester-cover");
  if (selectSem) selectSem.value = String(semParam);

  await initCetakCoverSAS();
});

async function gantiSemesterCoverSAS(semValue) {
  STATE.currentSasSemester = Number(semValue);
  sessionStorage.setItem("ERAPOR_PRINT_SAS_SEM", String(semValue));
  await initCetakCoverSAS(true);
}

async function initCetakCoverSAS(forceFetch = false) {
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;
  if (!kelasWalas) {
    alert("Sesi Wali Kelas tidak ditemukan. Silakan buka halaman ini melalui menu Modul Rapor SAS di Dashboard.");
    return;
  }

  const semActive = STATE.currentSasSemester || 1;
  const cacheKey = `${semActive}_${kelasWalas}`;
  const selectSiswa = document.getElementById("select-siswa-cover");

  if (!forceFetch && !LEGER_SAS_CACHE[cacheKey]) {
    const rawCache = sessionStorage.getItem(`ERAPOR_LEGER_SAS_${cacheKey}`);
    if (rawCache) {
      try {
        const parsed = JSON.parse(rawCache);
        if (parsed && parsed.status === "success") {
          LEGER_SAS_CACHE[cacheKey] = parsed;
        }
      } catch (e) {}
    }
  }

  if (forceFetch || !LEGER_SAS_CACHE[cacheKey]) {
    const spreadsheetId = CONFIG.RAPOR_SAS_DB?.[semActive]?.[kelasWalas];
    if (!spreadsheetId) {
      alert(`ID Spreadsheet untuk Kelas ${kelasWalas} pada SAS ${semActive} belum diisi di config.js!`);
      if (selectSiswa) selectSiswa.innerHTML = `<option value="">-- Data SAS ${semActive} Kosong --</option>`;
      return;
    }

    if (selectSiswa) selectSiswa.innerHTML = `<option value="">-- Mengambil Data dari Server... --</option>`;

    const res = await callGASAPI("getLegerSAS", {
      spreadsheetId: spreadsheetId,
      kelas: kelasWalas
    });

    if (res && res.status === "success") {
      LEGER_SAS_CACHE[cacheKey] = res;
      sessionStorage.setItem(`ERAPOR_LEGER_SAS_${cacheKey}`, JSON.stringify(res));
    } else {
      alert("Gagal mengambil data cover SAS: " + (res?.message || "Koneksi bermasalah."));
      return;
    }
  }

  CURRENT_LEGER_SAS_DATA = LEGER_SAS_CACHE[cacheKey];
  if (!CURRENT_LEGER_SAS_DATA || !selectSiswa) return;

  selectSiswa.innerHTML = "";
  const dataSiswa = CURRENT_LEGER_SAS_DATA.data || [];

  dataSiswa.forEach((student, idx) => {
    selectSiswa.innerHTML += `<option value="${idx}">${idx + 1}. ${student.nama}</option>`;
  });

  if (dataSiswa.length > 0) {
    CURRENT_COVER_SISWA_INDEX = 0;
    selectSiswa.value = "0";
    renderCoverSAS(0);
  }
}

function prevSiswaCoverSAS() {
  const selectSiswa = document.getElementById("select-siswa-cover");
  if (selectSiswa && selectSiswa.selectedIndex > 0) {
    selectSiswa.selectedIndex--;
    renderCoverSAS(selectSiswa.value);
  }
}

function nextSiswaCoverSAS() {
  const selectSiswa = document.getElementById("select-siswa-cover");
  if (selectSiswa && selectSiswa.selectedIndex < selectSiswa.options.length - 1) {
    selectSiswa.selectedIndex++;
    renderCoverSAS(selectSiswa.value);
  }
}

function renderCoverSAS(siswaIndex) {
  siswaIndex = Number(siswaIndex);
  CURRENT_COVER_SISWA_INDEX = siswaIndex;
  if (!CURRENT_LEGER_SAS_DATA) return;

  const meta = CURRENT_LEGER_SAS_DATA.meta || {};
  const student = CURRENT_LEGER_SAS_DATA.data[siswaIndex];
  if (!student) return;

  // LEMBAR 1: SAMPUL DEPAN
  document.getElementById("cov-nama-siswa").innerText = student.nama || "-";
  document.getElementById("cov-nisn-siswa").innerText = student.nisn || "-";

  // LEMBAR 2: IDENTITAS SEKOLAH
  document.getElementById("cov-sek-nama").innerText = meta.namaSekolah || "SMP IT AL-KAUTSAR";
  document.getElementById("cov-sek-npsn").innerText = meta.npsn || "69982612";
  document.getElementById("cov-sek-alamat").innerText = meta.alamatSekolah || "Jalan Kuku Besi Sukarame";
  document.getElementById("cov-sek-kodepos").innerText = meta.kodePos || "38225";
  document.getElementById("cov-sek-desa").innerText = meta.desaKelurahan || "Pasar Sebelah";
  document.getElementById("cov-sek-kecamatan").innerText = meta.kecamatan || "Kota Mukomuko";
  document.getElementById("cov-sek-kabupaten").innerText = meta.kabupatenKota || "Mukomuko";
  document.getElementById("cov-sek-provinsi").innerText = meta.provinsi || "Bengkulu";
  document.getElementById("cov-sek-website").innerText = meta.website || "-";
  document.getElementById("cov-sek-email").innerText = meta.email || "smpitalkautsarmm@gmail.com";

  // LEMBAR 3: IDENTITAS PESERTA DIDIK
  const nisnNisCombined = (student.nisn && student.nisn !== "-" && student.nis && student.nis !== "-")
    ? `${student.nisn}   / ${student.nis}`
    : (student.nisn || student.nis || "-");

  document.getElementById("cov-id-nama").innerText = student.nama || "-";
  document.getElementById("cov-id-nisn-nis").innerText = nisnNisCombined;
  document.getElementById("cov-id-ttl").innerText = student.ttl || "-";
  document.getElementById("cov-id-jk").innerText = student.jk || "-";
  document.getElementById("cov-id-agama").innerText = student.agama || "Islam";
  document.getElementById("cov-id-alamat").innerText = student.alamat || "-";

  document.getElementById("cov-id-ayah").innerText = student.ayah || "-";
  document.getElementById("cov-id-ibu").innerText = student.ibu || "-";
  document.getElementById("cov-id-kerja-ayah").innerText = student.pekerjaanAyah || "-";
  document.getElementById("cov-id-kerja-ibu").innerText = student.pekerjaanIbu || "-";

  document.getElementById("cov-id-ortu-jalan").innerText = student.alamat || "-";
  document.getElementById("cov-id-ortu-desa").innerText = student.kelurahan || "-";
  document.getElementById("cov-id-ortu-kec").innerText = student.kecamatan || "-";
  document.getElementById("cov-id-ortu-kab").innerText = student.kabupaten || "MUKOMUKO";
  document.getElementById("cov-id-ortu-prov").innerText = student.provinsi || "BENGKULU";

  document.getElementById("cov-id-wali-nama").innerText = student.wali || "";
  document.getElementById("cov-id-wali-kerja").innerText = student.pekerjaanWali || "";
  document.getElementById("cov-id-wali-alamat").innerText = student.alamatWali || "";

  // TANDA TANGAN KEPALA SEKOLAH
  document.getElementById("cov-ttd-tgl").innerText = meta.tglRapor || "Mukomuko, 18 Desember 2026";
  document.getElementById("cov-ttd-kepsek").innerText = meta.kepsek || "Warto, S.Pd.I., M.Pd., Gr";
  document.getElementById("cov-ttd-kepsek-nipy").innerText = meta.nipyKepsek
    ? `NIPY. ${String(meta.nipyKepsek).replace(/^NIPY\.?\s*/i, "")}`
    : "NIPY. 141981071801014";
}
