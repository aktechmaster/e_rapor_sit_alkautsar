// ====================================================
// MODUL KHUSUS HALAMAN CETAK RAPOR SAS (cetak-sas.html)
// ====================================================
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

  const selectSem = document.getElementById("select-semester-sas");
  if (selectSem) selectSem.value = String(semParam);

  await initCetakRaporSAS();
});

async function gantiSemesterSAS(semValue) {
  STATE.currentSasSemester = Number(semValue);
  sessionStorage.setItem("ERAPOR_PRINT_SAS_SEM", String(semValue));
  await initCetakRaporSAS(true);
}

async function initCetakRaporSAS(forceFetch = false) {
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;
  if (!kelasWalas) {
    alert("Sesi Wali Kelas tidak ditemukan. Silakan buka halaman ini melalui menu Cetak Rapor SAS di Dashboard.");
    return;
  }

  const semActive = STATE.currentSasSemester || 1;
  const cacheKey = `${semActive}_${kelasWalas}`;
  const selectSiswa = document.getElementById("select-siswa-sas");

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
      alert("Gagal mengambil data rapor SAS: " + (res?.message || "Koneksi bermasalah."));
      return;
    }
  }

  CURRENT_LEGER_SAS_DATA = LEGER_SAS_CACHE[cacheKey];
  if (!CURRENT_LEGER_SAS_DATA || !selectSiswa) return;

  selectSiswa.innerHTML = "";
  const dataSiswa = CURRENT_LEGER_SAS_DATA.data || [];

  dataSiswa.forEach((student, idx) => {
    selectSiswa.innerHTML += `<option value="${idx}">${student.no || idx + 1}. ${student.nama}</option>`;
  });

  if (dataSiswa.length > 0) {
    CURRENT_SAS_SISWA_INDEX = 0;
    selectSiswa.value = "0";
    renderLembarRaporSAS(0);
  }
}

function prevSiswaSAS() {
  const selectSiswa = document.getElementById("select-siswa-sas");
  if (selectSiswa && selectSiswa.selectedIndex > 0) {
    selectSiswa.selectedIndex--;
    renderLembarRaporSAS(selectSiswa.value);
  }
}

function nextSiswaSAS() {
  const selectSiswa = document.getElementById("select-siswa-sas");
  if (selectSiswa && selectSiswa.selectedIndex < selectSiswa.options.length - 1) {
    selectSiswa.selectedIndex++;
    renderLembarRaporSAS(selectSiswa.value);
  }
}

function renderLembarRaporSAS(siswaIndex) {
  siswaIndex = Number(siswaIndex);
  CURRENT_SAS_SISWA_INDEX = siswaIndex;
  if (!CURRENT_LEGER_SAS_DATA) return;

  const meta = CURRENT_LEGER_SAS_DATA.meta || {};
  const student = CURRENT_LEGER_SAS_DATA.data[siswaIndex];
  if (!student) return;

  const kelasWalas = STATE.currentUser?.walas_kelas || meta.kelas || "";
  const semActive = STATE.currentSasSemester || 1;
  const tingkat = getTingkatNumberSAS(kelasWalas);

  // 1. IDENTITAS PESERTA DIDIK
  const nisNisnStr = (student.nis && student.nis !== "-" && student.nisn && student.nisn !== "-")
    ? `${student.nis} / ${student.nisn}`
    : (student.nisn || "-");

  document.getElementById("lbl-sas-nama").innerText = student.nama || "-";
  document.getElementById("lbl-sas-nisn").innerText = nisNisnStr;
  document.getElementById("lbl-sas-sekolah").innerText = meta.namaSekolah || "SMP IT AL-KAUTSAR";
  document.getElementById("lbl-sas-alamat").innerText = meta.alamatSekolah || "Jalan Kuku Besi Sukarame";
  document.getElementById("lbl-sas-kelas").innerText = meta.kelas || kelasWalas || "-";
  document.getElementById("lbl-sas-fase").innerText = meta.fase || "D";
  document.getElementById("lbl-sas-semester").innerText = semActive === 2 ? "II (Genap)" : "I (Ganjil)";
  document.getElementById("lbl-sas-tapel").innerText = meta.tahunPelajaran || "2025/2026";

  // 2. TABEL NILAI & CAPAIAN KOMPETENSI (BPI DIKECUALIKAN DARI RAPOR)
  const raporMapels = getSASMapelByKelas(kelasWalas, "rapor");
  // Split halaman: Halaman 1 memuat 9 mapel (Kelas 8 & 9) atau 10 mapel (Kelas 7)
  const splitCount = raporMapels.length >= 14 ? 10 : 9;

  const tbodyP1 = document.getElementById("sas-tbody-nilai-p1");
  const tbodyP2 = document.getElementById("sas-tbody-nilai-p2");
  tbodyP1.innerHTML = "";
  tbodyP2.innerHTML = "";

  let totalNilai = 0;
  let jumlahMapelDinilai = 0;

  raporMapels.forEach((mp, idx) => {
    const noUrut = idx + 1;
    const rawScore = student.scores ? student.scores[mp.key] : null;
    const val = (rawScore !== null && rawScore !== undefined && !isNaN(Number(rawScore)))
      ? Math.round(Number(rawScore))
      : null;

    if (val !== null) {
      totalNilai += val;
      jumlahMapelDinilai++;
    }

    const deskText = (student.deskripsi && student.deskripsi[mp.key]) ? student.deskripsi[mp.key] : "-";

    const rowHtml = `
      <tr>
        <td class="border border-black p-1.5 text-center align-middle">${noUrut}</td>
        <td class="border border-black p-1.5 align-middle">${mp.nama}</td>
        <td class="border border-black p-1.5 text-center font-bold align-middle">${val !== null ? val : "-"}</td>
        <td class="border border-black p-1.5 text-justify align-middle text-[10.5px] leading-snug">${deskText}</td>
      </tr>
    `;

    if (idx < splitCount) {
      tbodyP1.innerHTML += rowHtml;
    } else {
      tbodyP2.innerHTML += rowHtml;
    }
  });

  // 3. JUMLAH & RATA-RATA (HANYA DARI MAPEL RAPOR, TANPA BPI)
  document.getElementById("sas-total-val").innerText =
    jumlahMapelDinilai > 0 ? totalNilai.toLocaleString("id-ID") : "-";
  document.getElementById("sas-avg-val").innerText =
    jumlahMapelDinilai > 0 ? (totalNilai / jumlahMapelDinilai).toFixed(2).replace(".", ",") : "-";

  // 4. EKSTRAKURIKULER (3 BARIS)
  const tbodyEkstra = document.getElementById("sas-tbody-ekstra");
  tbodyEkstra.innerHTML = "";
  const ekstraList = student.ekstra || [];
  for (let i = 0; i < 3; i++) {
    const item = ekstraList[i] || { nama: "", predikat: "", keterangan: "" };
    tbodyEkstra.innerHTML += `
      <tr>
        <td class="border border-black p-1.5 text-center">${i + 1}</td>
        <td class="border border-black p-1.5">${item.nama || "-"}</td>
        <td class="border border-black p-1.5 text-center font-semibold">${item.predikat || "-"}</td>
        <td class="border border-black p-1.5 text-[10.5px]">${item.keterangan || "-"}</td>
      </tr>
    `;
  }

  // 5. KETIDAKHADIRAN & CATATAN WALI KELAS
  document.getElementById("sas-abs-s").innerText = `${student.sakit ?? 0} hari`;
  document.getElementById("sas-abs-i").innerText = `${student.izin ?? 0} hari`;
  document.getElementById("sas-abs-a").innerText = `${student.alpa ?? 0} hari`;
  document.getElementById("sas-catatan-walas").innerText = student.catatan || "-";

  // 6. KOTAK KEPUTUSAN NAIK KELAS / KELULUSAN (KHUSUS SEMESTER 2 / GENAP)
  const boxKeputusan = document.getElementById("sas-keputusan-box");
  const txtKeputusan = document.getElementById("sas-keputusan-text");
  if (semActive === 2) {
    boxKeputusan.classList.remove("hidden");
    if (tingkat === 9) {
      txtKeputusan.innerHTML = `Berdasarkan pencapaian seluruh kompetensi pada Semester I dan Semester II, peserta didik dinyatakan: <strong>LULUS</strong> dari Satuan Pendidikan.`;
    } else if (tingkat === 8) {
      txtKeputusan.innerHTML = `Berdasarkan pencapaian seluruh kompetensi pada Semester I dan Semester II, peserta didik ditetapkan: <strong>Naik ke Kelas IX (Sembilan)</strong>.`;
    } else {
      txtKeputusan.innerHTML = `Berdasarkan pencapaian seluruh kompetensi pada Semester I dan Semester II, peserta didik ditetapkan: <strong>Naik ke Kelas VIII (Delapan)</strong>.`;
    }
  } else {
    boxKeputusan.classList.add("hidden");
  }

  // 7. TANDA TANGAN (ORANG TUA, WALI KELAS, KEPALA SEKOLAH)
  const elOrtu = document.getElementById("sas-ttd-ortu");
  if (elOrtu) {
    elOrtu.innerText = student.ortu ? `( ${student.ortu} )` : "( .................................... )";
  }

  const namaWalasResmi = (STATE.currentUser && STATE.currentUser.nama_lengkap)
    ? STATE.currentUser.nama_lengkap
    : (meta.walas || "( Wali Kelas )");
  document.getElementById("sas-ttd-walas").innerText = namaWalasResmi;

  const nipVal = (STATE.currentUser && STATE.currentUser.nip_nik)
    ? STATE.currentUser.nip_nik
    : meta.nipyWalas;
  document.getElementById("sas-ttd-walas-nipy").innerText = nipVal
    ? `NIPY. ${String(nipVal).replace(/^NIPY\.?\s*/i, "")}`
    : "";

  document.getElementById("sas-ttd-tgl").innerText = meta.tglRapor || "Mukomuko, 19 Desember 2025";
  document.getElementById("sas-ttd-kepsek").innerText = meta.kepsek || "Warto, S.Pd.I., M.Pd., Gr.";
  document.getElementById("sas-ttd-kepsek-nipy").innerText = meta.nipyKepsek
    ? `NIPY. ${String(meta.nipyKepsek).replace(/^NIPY\.?\s*/i, "")}`
    : "NIPY. 141981071801014";
}
