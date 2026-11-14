// ====================================================
// MODUL KHUSUS HALAMAN CETAK PIAGAM PENGHARGAAN (TOP 10)
// ====================================================
let PIAGAM_WINNERS_LIST = [];

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
  const idxParam = urlParams.get("idx");
  STATE.currentSasSemester = semParam;

  const selectSem = document.getElementById("select-semester-piagam");
  if (selectSem) selectSem.value = String(semParam);

  const tahunNow = new Date().getFullYear();
  const inpNomor = document.getElementById("input-nomor-piagam");
  const inpEval  = document.getElementById("input-jenis-evaluasi");
  if (inpNomor) {
    inpNomor.value = semParam === 2
      ? `.../..../D.6/SMPIT-AK/VI/${tahunNow}`
      : `.../..../D.6/SMPIT-AK/XII/${tahunNow}`;
  }
  if (inpEval) {
    inpEval.value = semParam === 2
      ? "Sumatif Akhir Tahun (SAT)"
      : "Sumatif Akhir Semester (SAS)";
  }

  await initCetakPiagamSAS(false, idxParam);
});

async function gantiSemesterPiagamSAS(semValue) {
  STATE.currentSasSemester = Number(semValue);
  sessionStorage.setItem("ERAPOR_PRINT_SAS_SEM", String(semValue));

  const tahunNow = new Date().getFullYear();
  const inpNomor = document.getElementById("input-nomor-piagam");
  const inpEval  = document.getElementById("input-jenis-evaluasi");
  if (inpNomor) {
    inpNomor.value = Number(semValue) === 2
      ? `.../..../D.6/SMPIT-AK/VI/${tahunNow}`
      : `.../..../D.6/SMPIT-AK/XII/${tahunNow}`;
  }
  if (inpEval) {
    inpEval.value = Number(semValue) === 2
      ? "Sumatif Akhir Tahun (SAT)"
      : "Sumatif Akhir Semester (SAS)";
  }

  await initCetakPiagamSAS(true, null);
}

function ubahUkuranKertasPiagam(paperType) {
  const styleEl = document.getElementById("dynamic-page-size-style");
  const inpOffset = document.getElementById("input-top-offset");
  if (styleEl) {
    if (paperType === "A4") {
      styleEl.innerHTML = `@media print { @page { size: A4 portrait; margin: 0mm; } }`;
      if (inpOffset && Number(inpOffset.value) === 64) inpOffset.value = "58";
    } else {
      styleEl.innerHTML = `@media print { @page { size: 215.9mm 330.2mm; margin: 0mm; } }`;
      if (inpOffset && Number(inpOffset.value) === 58) inpOffset.value = "64";
    }
  }
  renderPiagamList();
}

function hitungRataRataSiswaSAS(studentObj) {
  if (!studentObj) return "-";
  if (studentObj.rataSheet !== null && studentObj.rataSheet !== undefined && !isNaN(Number(studentObj.rataSheet))) {
    return Number(studentObj.rataSheet).toFixed(2).replace(".", ",");
  }
  if (studentObj.scores) {
    const vals = Object.values(studentObj.scores)
      .filter(v => v !== null && v !== undefined && v !== "" && !isNaN(Number(v)))
      .map(v => Number(v));
    if (vals.length > 0) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return avg.toFixed(2).replace(".", ",");
    }
  }
  return "-";
}

// Bersihkan nama kelas jika masih berbentuk ID "kls-9A"
function resolveNamaKelasPiagam(rawKelasRank, metaKelas, fallbackKelas) {
  const rk = String(rawKelasRank || "").trim();
  if (rk && !/^kls-/i.test(rk)) return rk;
  if (metaKelas && !/^kls-/i.test(metaKelas)) return metaKelas;
  return (rk || metaKelas || fallbackKelas || "-").replace(/^kls-/i, "").toUpperCase();
}

// Bersihkan nama wali kelas jika masih berbentuk ID "gr_008"
function resolveNamaWalasPiagam(rawWalasRank, metaWalas) {
  const rw = String(rawWalasRank || "").trim();
  if (rw && !/^gr_/i.test(rw)) return rw;
  if (STATE.currentUser?.nama_lengkap) return STATE.currentUser.nama_lengkap;
  if (metaWalas && !/^gr_/i.test(metaWalas)) return metaWalas;
  return rw || metaWalas || "-";
}

async function initCetakPiagamSAS(forceFetch = false, initialIdxParam = null) {
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;
  if (!kelasWalas) {
    alert("Sesi Wali Kelas tidak ditemukan. Silakan buka halaman ini melalui Modul Rapor SAS di Dashboard.");
    return;
  }

  const semActive = STATE.currentSasSemester || 1;
  const cacheKey = `${semActive}_${kelasWalas}`;
  const selectMode = document.getElementById("select-mode-piagam");

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
      return;
    }

    const res = await callGASAPI("getLegerSAS", {
      spreadsheetId: spreadsheetId,
      kelas: kelasWalas
    });

    if (res && res.status === "success") {
      LEGER_SAS_CACHE[cacheKey] = res;
      sessionStorage.setItem(`ERAPOR_LEGER_SAS_${cacheKey}`, JSON.stringify(res));
    } else {
      alert("Gagal mengambil data piagam SAS: " + (res?.message || "Koneksi bermasalah."));
      return;
    }
  }

  CURRENT_LEGER_SAS_DATA = LEGER_SAS_CACHE[cacheKey];
  if (!CURRENT_LEGER_SAS_DATA) return;

  const meta = CURRENT_LEGER_SAS_DATA.meta || {};
  const students = CURRENT_LEGER_SAS_DATA.data || [];
  const rawRankList = meta.rangkingList || [];

  if (rawRankList.length > 0) {
    PIAGAM_WINNERS_LIST = rawRankList.slice(0, 10).map((r, i) => {
      const rNisn = String(r.nisn || "").trim();
      const rKeyAlpha = String(r.nama || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

      const matchedStudent = students.find(st =>
        (rNisn && rNisn !== "-" && String(st.nisn || "").trim() === rNisn) ||
        (rKeyAlpha && st.nama.toUpperCase().replace(/[^A-Z0-9]/g, "") === rKeyAlpha)
      );

      return {
        no: r.no || (i + 1),
        nama: r.nama,
        nisn: r.nisn || matchedStudent?.nisn || "-",
        kelas: resolveNamaKelasPiagam(r.kelas, meta.kelas, kelasWalas),
        rank: r.rank || `PERINGKAT ${i + 1}`,
        rataRata: hitungRataRataSiswaSAS(matchedStudent),
        walas: resolveNamaWalasPiagam(r.walas, meta.walas),
        nipy: r.nipy || STATE.currentUser?.nip_nik || meta.nipyWalas || "",
        tanggal: r.tanggal || meta.tglRapor || "Mukomuko, 18 Desember 2026",
        semester: r.semester || (semActive === 2 ? "II (Genap)" : "I (Ganjil)"),
        tahun: r.tahun || meta.tahunPelajaran || "2026/2027"
      };
    });
  } else {
    PIAGAM_WINNERS_LIST = [...students]
      .filter(s => !isNaN(Number(s.rank)))
      .sort((a, b) => Number(a.rank) - Number(b.rank))
      .slice(0, 10)
      .map((st, i) => ({
        no: i + 1,
        nama: st.nama,
        nisn: st.nisn || "-",
        kelas: resolveNamaKelasPiagam("", meta.kelas, kelasWalas),
        rank: `PERINGKAT ${st.rank}`,
        rataRata: hitungRataRataSiswaSAS(st),
        walas: resolveNamaWalasPiagam("", meta.walas),
        nipy: STATE.currentUser?.nip_nik || meta.nipyWalas || "",
        tanggal: meta.tglRapor || "Mukomuko, 18 Desember 2026",
        semester: semActive === 2 ? "II (Genap)" : "I (Ganjil)",
        tahun: meta.tahunPelajaran || "2026/2027"
      }));
  }

  if (selectMode) {
    selectMode.innerHTML = `<option value="ALL">Semua Peringkat (${PIAGAM_WINNERS_LIST.length} Siswa Sekaligus)</option>`;
    PIAGAM_WINNERS_LIST.forEach((w, idx) => {
      selectMode.innerHTML += `<option value="${idx}">${w.rank} — ${w.nama}</option>`;
    });

    if (initialIdxParam !== null && initialIdxParam !== "" && !isNaN(Number(initialIdxParam))) {
      selectMode.value = String(Number(initialIdxParam));
    } else {
      selectMode.value = "ALL";
    }
  }

  renderPiagamList();
}

function renderPiagamList() {
  const container = document.getElementById("piagam-pages-container");
  if (!container) return;

  if (PIAGAM_WINNERS_LIST.length === 0) {
    container.innerHTML = `
      <div class="max-w-[215.9mm] mx-auto bg-white p-10 rounded-xl border border-gray-200 text-center text-gray-500">
        Belum ada data peringkat pada tab <strong>RANGKING</strong>.
      </div>
    `;
    return;
  }

  const meta = CURRENT_LEGER_SAS_DATA?.meta || {};
  const selectedMode = document.getElementById("select-mode-piagam")?.value || "ALL";
  const paperType = document.getElementById("select-paper-piagam")?.value || "F4";
  const nomorPiagam = document.getElementById("input-nomor-piagam")?.value.trim() || ".../..../D.6/SMPIT-AK/XII/2026";
  const jenisEvaluasi = document.getElementById("input-jenis-evaluasi")?.value.trim() || "Sumatif Akhir Semester (SAS)";
  const topOffsetMm = Number(document.getElementById("input-top-offset")?.value) || 64;

  const kepsekNama = meta.kepsek || "WARTO, S.Pd.I., M.Pd., Gr";
  const kepsekNipy = meta.nipyKepsek
    ? `NIPY.${String(meta.nipyKepsek).replace(/^NIPY\.?\s*/i, "")}`
    : "NIPY.141981071801014";

  const itemsToRender = selectedMode === "ALL"
    ? PIAGAM_WINNERS_LIST
    : [PIAGAM_WINNERS_LIST[Number(selectedMode)]].filter(Boolean);

  const sizeClass = paperType === "A4" ? "size-a4" : "";

  container.innerHTML = itemsToRender.map(item => {
    const walasNipyClean = item.nipy
      ? `NIPY.${String(item.nipy).replace(/^NIPY\.?\s*/i, "")}`
      : "";

    return `
      <div class="piagam-sheet ${sizeClass} mx-auto border border-gray-300 shadow-lg text-black">
        <!-- GAMBAR BLANGKO DESAIN ASLI (OTOMATIS CEK .PNG LALU .JPG) -->
        <img
          src="pictures/template-piagam.png"
          onerror="if(!this.dataset.triedJpg){this.dataset.triedJpg='1';this.src='pictures/template-piagam.jpg';}"
          alt="Template Piagam"
          class="piagam-bg-img"
        >

        <!-- TEKS DINAMIS PIAGAM -->
        <div class="piagam-text-layer" style="padding-top: ${topOffsetMm}mm;">
          <!-- JUDUL & NOMOR -->
          <div class="text-center">
            <h1 class="font-bold text-[22pt] tracking-wider uppercase leading-none">PIAGAM PENGHARGAAN</h1>
            <p class="text-[11.5pt] mt-2">Nomor : ${nomorPiagam}</p>
          </div>

          <!-- KALIMAT PEMBUKA & BIODATA -->
          <div class="px-4 text-[12pt] leading-relaxed">
            <p class="text-justify">
              Yang bertanda tangan di bawah ini, Wali Kelas <strong>${item.kelas}</strong> SMPIT Al-Kautsar Kecamatan Kota Mukomuko, Kabupaten Mukomuko, menerangkan bahwa :
            </p>

            <table class="w-full max-w-[440px] mx-auto my-3 text-[12pt] font-bold leading-[1.75]">
              <tr>
                <td class="w-28">Nama</td>
                <td class="w-4">:</td>
                <td class="uppercase">${item.nama}</td>
              </tr>
              <tr>
                <td>NISN</td>
                <td>:</td>
                <td>${item.nisn}</td>
              </tr>
              <tr>
                <td>Kelas</td>
                <td>:</td>
                <td class="uppercase">${item.kelas}</td>
              </tr>
            </table>
          </div>

          <!-- PERINGKAT & RATA-RATA -->
          <div class="px-4 text-center">
            <p class="text-[12pt] leading-relaxed">
              Berdasarkan hasil ${jenisEvaluasi}, Semester ${item.semester} Tahun Pelajaran ${item.tahun}, siswa tersebut dinyatakan sebagai:
            </p>

            <div class="my-4">
              <div class="inline-block border-b-2 border-black pb-0.5 px-4 font-bold text-[20pt] uppercase tracking-wide">
                ${item.rank}
              </div>
              <p class="font-bold text-[12pt] uppercase mt-2 tracking-wide">
                DI KELAS ${item.kelas} SMPIT AL-KAUTSAR
              </p>
              <p class="font-bold text-[12pt] uppercase mt-0.5 tracking-wide">
                DENGAN RATA-RATA ${item.rataRata}
              </p>
            </div>

            <p class="text-[12pt] leading-relaxed mt-3">
              Semoga piagam penghargaan ini dapat berguna dan menjadi pendorong untuk prestasi yang akan datang. Kami ucapkan selamat dan terima kasih.
            </p>
          </div>

          <!-- PENGESAHAN KEPALA SEKOLAH & WALI KELAS -->
          <div class="px-6 pt-2 pb-2 flex justify-between items-start text-[11.5pt] leading-snug">
            <div class="w-64 text-left">
              <p>Mengetahui,</p>
              <p>Kepala SMPIT Al-Kautsar</p>
              <div class="h-16"></div>
              <p class="font-bold underline uppercase">${kepsekNama}</p>
              <p class="font-bold">${kepsekNipy}</p>
            </div>

            <div class="w-64 text-left">
              <p>${item.tanggal}</p>
              <p>Wali Kelas</p>
              <div class="h-16"></div>
              <p class="font-bold underline">${item.walas}</p>
              <p class="font-bold">${walasNipyClean}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}
