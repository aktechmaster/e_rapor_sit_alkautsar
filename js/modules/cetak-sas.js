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

// Kalkulasi ulang pembagian baris halaman setelah seluruh gambar kop selesai dimuat
window.addEventListener("load", () => {
  if (CURRENT_LEGER_SAS_DATA) {
    renderLembarRaporSAS(CURRENT_SAS_SISWA_INDEX || 0);
  }
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
    selectSiswa.innerHTML += `<option value="${idx}">${idx + 1}. ${student.nama}</option>`;
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
  document.getElementById("lbl-sas-tapel").innerText = meta.tahunPelajaran || "2026/2027";

  // 2. TABEL NILAI & CAPAIAN KOMPETENSI (KOTAK SERAGAM MIN-H-62PX, MELAR JIKA PANJANG, PINDAH UTUH KE HALAMAN 2)
  const raporMapels = getSASMapelByKelas(kelasWalas, "rapor");
  const tbodyP1 = document.getElementById("sas-tbody-nilai-p1");
  const tbodyP2 = document.getElementById("sas-tbody-nilai-p2");
  const theadP2 = document.getElementById("sas-thead-nilai-p2");

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

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="border border-black py-1.5 px-1.5 w-8 align-middle">
        <div class="min-h-[62px] flex items-center justify-center">${noUrut}</div>
      </td>
      <td class="border border-black py-1.5 px-2 w-48 align-middle">
        <div class="min-h-[62px] flex items-center">${mp.nama}</div>
      </td>
      <td class="border border-black py-1.5 px-1.5 w-16 align-middle">
        <div class="min-h-[62px] flex items-center justify-center font-bold">${val !== null ? val : "-"}</div>
      </td>
      <td class="border border-black py-1.5 px-2 align-middle">
        <div class="min-h-[62px] flex items-center text-justify text-[10px] leading-snug">${deskText}</div>
      </td>
    `;
    tbodyP1.appendChild(tr);
  });

  // Ukur tinggi aktual Halaman 1; pindahkan baris terbawah secara UTUH ke Halaman 2 jika melewati batas 282mm
  const rulerEl = document.getElementById("sas-mm-ruler");
  const page1InnerEl = document.getElementById("sas-page-1-inner");
  const maxContentHeightPx = rulerEl ? rulerEl.offsetHeight : 1065;

  while (
    page1InnerEl &&
    page1InnerEl.offsetHeight > maxContentHeightPx &&
    tbodyP1.children.length > 1
  ) {
    const lastRow = tbodyP1.lastElementChild;
    tbodyP2.insertBefore(lastRow, tbodyP2.firstChild);
  }

  // Tampilkan header tabel di Halaman 2 jika ada sisa mapel yang pindah ke Halaman 2
  if (theadP2) {
    if (tbodyP2.children.length > 0) {
      theadP2.classList.remove("hidden");
    } else {
      theadP2.classList.add("hidden");
    }
  }

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
        <td class="border border-black p-1.5 text-[10px]">${item.keterangan || "-"}</td>
      </tr>
    `;
  }

  // 5. KETIDAKHADIRAN & CATATAN WALI KELAS
  document.getElementById("sas-abs-s").innerText = `${student.sakit ?? 0} hari`;
  document.getElementById("sas-abs-i").innerText = `${student.izin ?? 0} hari`;
  document.getElementById("sas-abs-a").innerText = `${student.alpa ?? 0} hari`;
  document.getElementById("sas-catatan-walas").innerText = student.catatan || "-";

  // 6. KOTAK KEPUTUSAN KENAIKAN KELAS / KELULUSAN (KHUSUS SEMESTER 2 / GENAP)
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

  document.getElementById("sas-ttd-tgl").innerText = meta.tglRapor || "Mukomuko, 18 Desember 2026";
  document.getElementById("sas-ttd-kepsek").innerText = meta.kepsek || "Warto, S.Pd.I., M.Pd., Gr.";
  document.getElementById("sas-ttd-kepsek-nipy").innerText = meta.nipyKepsek
    ? `NIPY. ${String(meta.nipyKepsek).replace(/^NIPY\.?\s*/i, "")}`
    : "NIPY. 141981071801014";
}
