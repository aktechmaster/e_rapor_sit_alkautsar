// ====================================================
// MODUL MANAGER 8 SUB-MENU SAS & SISTEM CRUD
// ====================================================
let CURRENT_SAS_SUBTAB = "leger";

const TEMPLATE_CATATAN_OTOMATIS_SAS = [
  "selalu aktif dan berpartisipasi dalam kelas. Tingkatkan prestasinya di kelas!",
  "kamu punya bakat menjadi pemimpin. Kamu punya sikap yang baik dan pandai bergaul.",
  "prestasi akademikmu cukup baik, ditambah dengan sikap yang sopan dan bertanggung jawab. Selamat atas prestasinya!",
  "prestasi akademikmu cukup baik, ditambah dengan sikap yang sopan dan bertanggung jawab. Selamat atas kenaikan kelasnya!",
  "dengan semangat belajar yang tinggi, kamu mencapai hasil yang memuaskan. Selamat naik kelas dan terus berprestasi.",
  "kemajuanmu dalam akademik dan karakter sangat membanggakan. Selamat naik kelas.",
  "selamat kamu menjadi juara kelas. Semoga kamu bisa mempertahankan prestasimu.",
  "kamu harus lebih giat dan lebih rajin belajar. Semoga ke depannya prestasimu bisa semakin meningkat.",
  "kamu adalah siswa yang baik bukan hanya yang berprestasi dan punya nilai tinggi. Tapi juga siswa yang punya karakter dan tanggung jawab terhadap sesama.",
  "kamu perlu meningkatkan kerajinan. Jangan sering absen",
  "dengan semangat belajar yang tinggi, kamu layak untuk mendapatkan kenaikan kelas. Jaga semangat dan jangan pantang menyerah!",
  "meskipun kamu sudah masuk 10 besar, tapi jangan cepat berpuas diri ya. Kamu bisa tingkatkan lagi pencapaianmu ke depannya.",
  "banyak membaca buku pelajaran ya. Manfaatkan waktu luang untuk belajar. Kamu pasti bisa!",
  "tidak apa nilaimu di bidang akademis agak kurang, tapi ustadz/ustadzah yakin kamu punya bakat di bidang yang lainnya. Fokuslah kembangkan prestasi sesuai kemampuan kamu!",
  "perkembangan akademik dan non-akademikmu cukup baik. Teruskan usaha kerasmu di kelas yang baru. Selamat ya!",
  "kamu harus bisa menjadi lebih baik. Lebih aktif belajar, dan lebih banyak bersosialisasi dengan teman-teman.",
  "masa depan ada di tangan orang-orang yang berjuang dan berusaha keras. Tetap optimis dan jangan pernah menyerah!",
  "ada banyak bimbingan belajar, buku latihan, dan akses pelajaran gratis di internet untuk bisa menambah wawasanmu. Jangan patah semangat.",
  "keikutsertaan kamu di paskibra sangat membuat bangga sekolah kami. Semangat terus ya nak! Kemampuanmu di bidang non akademik memang sudah tidak perlu diragukan lagi. Selamat, kamu sudah membawa nama baik sekolah.",
  "jangan kecewakan orang tua dan mereka yang sudah membiayai sekolahmu. Buat mereka bangga di semester depan!",
  "ayo tunjukkan semangat belajarmu agar bisa mengikuti pelajaran dengan baik. Kamu pasti bisa!",
  "sebenarnya kamu punya potensi yang besar untuk mencetak prestasi. Kamu hanya perlu belajar lebih giat dan memperbaiki sikap.",
  "harus lebih fokus belajar ya! Jangan terlalu banyak mengganggu teman-teman yang lain.",
  "tolong ditingkatkan lagi belajarnya ya nak. Kurangi bermainnya. Kamu sudah mau naik SMA!",
  "kamu perlu belajar konsentrasi. Fokus memperhatikan guru ketika menjelaskan di kelas.",
  "jangan berkecil hati. Ustadz/Ustadzah yakin ke depan kamu pasti bisa menjadi lebih baik kalau kamu rajin belajar.",
  "tolong dikurangi main HP dan game nya. Kamu sudah kelas naik kelas 9. Tahun ini kamu harus bisa lulus ujian sekolah."
];

function escapeHtmlAttrSAS(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function initSasWorkspace(forceRefresh = false) {
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;
  if (!kelasWalas) {
    alert("Akun Anda tidak terdaftar sebagai Wali Kelas!");
    return;
  }

  const semActive = STATE.currentSasSemester || 1;
  const selectSem = document.getElementById("sas-workspace-semester");
  if (selectSem) selectSem.value = String(semActive);

  const badgeKelas = document.getElementById("sas-workspace-kelas-badge");
  if (badgeKelas) badgeKelas.innerText = `Kelas: ${kelasWalas}`;

  await loadLegerSAS(forceRefresh);

  // Sinkronkan sessionStorage agar tab cetak Cover & Rapor langsung siap
  const cacheKey = `${semActive}_${kelasWalas}`;
  if (LEGER_SAS_CACHE[cacheKey]) {
    sessionStorage.setItem(`ERAPOR_LEGER_SAS_${cacheKey}`, JSON.stringify(LEGER_SAS_CACHE[cacheKey]));
  }

  switchSasSubTab(CURRENT_SAS_SUBTAB || "leger");
}

async function changeSasWorkspaceSemester(semValue) {
  STATE.currentSasSemester = Number(semValue) || 1;
  [1, 2].forEach(s => {
    const el = document.getElementById(`nav-sas-sem${s}`);
    if (el) el.classList.toggle("active", s === STATE.currentSasSemester);
  });
  await initSasWorkspace(false);
}

async function refreshSasWorkspaceData() {
  await initSasWorkspace(true);
}

function switchSasSubTab(tabName) {
  // Jika memilih Cover atau Rapor, langsung buka halaman cetak di tab baru
  if (tabName === "cover") {
    bukaCetakCoverSAS(STATE.currentSasSemester || 1);
    return;
  }
  if (tabName === "rapor") {
    bukaCetakSAS(STATE.currentSasSemester || 1);
    return;
  }

  CURRENT_SAS_SUBTAB = tabName;

  const panelNames = ["id-sekolah", "ekstra", "note", "deskripsi", "leger", "ranking"];
  panelNames.forEach(p => {
    const panelEl = document.getElementById(`sas-panel-${p}`);
    if (panelEl) {
      if (p === tabName) {
        panelEl.classList.remove("hidden");
      } else {
        panelEl.classList.add("hidden");
      }
    }

    const btnEl = document.getElementById(`sas-tab-btn-${p}`);
    if (btnEl) {
      if (p === tabName) {
        btnEl.className = "sas-subtab-btn px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap border transition flex items-center space-x-1.5 bg-emerald-600 text-white border-emerald-600 shadow-sm";
      } else {
        btnEl.className = "sas-subtab-btn px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap border transition flex items-center space-x-1.5 bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50";
      }
    }
  });

  if (tabName === "id-sekolah") renderSasIdSekolahPanel();
  if (tabName === "ekstra") renderSasEkstraPanel();
  if (tabName === "note") renderSasNotePanel();
  if (tabName === "deskripsi") renderSasDeskripsiPanel();
  if (tabName === "leger") renderLegerSASTable();
  if (tabName === "ranking") renderSasRankingPanel();
}

// ====================================================
// SUB-MENU 1: ID SEKOLAH (CRUD)
// ====================================================
function renderSasIdSekolahPanel() {
  const meta = CURRENT_LEGER_SAS_DATA?.meta || {};
  const kelasWalas = STATE.currentUser?.walas_kelas || meta.kelas || "-";
  const namaWalas = STATE.currentUser?.nama_lengkap || meta.walas || "-";

  const elTapel = document.getElementById("sas-id-tapel");
  const elTgl = document.getElementById("sas-id-tgl");
  const elKepsek = document.getElementById("sas-id-kepsek");
  const elNipyKepsek = document.getElementById("sas-id-nipy-kepsek");

  if (elTapel) elTapel.value = meta.tahunPelajaran || "";
  if (elTgl) elTgl.value = meta.tglRapor || "";
  if (elKepsek) elKepsek.value = meta.kepsek || "";
  if (elNipyKepsek) elNipyKepsek.value = meta.nipyKepsek || "";

  const roWalas = document.getElementById("sas-id-readonly-walas");
  const roKelas = document.getElementById("sas-id-readonly-kelas");
  const roFase = document.getElementById("sas-id-readonly-fase");
  const roSem = document.getElementById("sas-id-readonly-sem");

  if (roWalas) roWalas.innerText = namaWalas;
  if (roKelas) roKelas.innerText = meta.kelas || kelasWalas;
  if (roFase) roFase.innerText = meta.fase || "D";
  if (roSem) roSem.innerText = meta.semester || ((STATE.currentSasSemester === 2) ? "II" : "I");

  const container = document.getElementById("sas-id-ekstra-container");
  if (!container) return;

  const masterList = meta.ekstraMasterList || [];
  let html = "";
  for (let i = 0; i < 15; i++) {
    const val = masterList[i] || "";
    html += `
      <div class="flex items-center space-x-2">
        <span class="w-7 text-center text-xs font-bold text-gray-500 bg-slate-100 py-1.5 rounded border border-gray-200">${i + 1}</span>
        <input type="text" class="sas-master-ekstra-input flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Nama Ekstrakurikuler ${i + 1}..." value="${escapeHtmlAttrSAS(val)}">
      </div>
    `;
  }
  container.innerHTML = html;
}

async function simpanIdSekolahSAS() {
  const kelasWalas = STATE.currentUser?.walas_kelas;
  const semActive = STATE.currentSasSemester || 1;
  const spreadsheetId = CONFIG.RAPOR_SAS_DB?.[semActive]?.[kelasWalas];

  if (!spreadsheetId) {
    alert("ID Spreadsheet SAS belum diatur di config.js!");
    return;
  }

  const tahunPelajaran = document.getElementById("sas-id-tapel")?.value.trim() || "";
  const tglRapor = document.getElementById("sas-id-tgl")?.value.trim() || "";
  const kepsek = document.getElementById("sas-id-kepsek")?.value.trim() || "";
  const nipyKepsek = document.getElementById("sas-id-nipy-kepsek")?.value.trim() || "";

  const ekstraInputs = document.querySelectorAll(".sas-master-ekstra-input");
  const ekstraMasterList = Array.from(ekstraInputs).map(inp => inp.value.trim());

  const res = await callGASAPI("updateIdSekolahSAS", {
    spreadsheetId: spreadsheetId,
    data: {
      tahunPelajaran,
      tglRapor,
      kepsek,
      nipyKepsek,
      ekstraMasterList
    }
  });

  if (res && res.status === "success") {
    // Perbarui cache sesi otomatis
    const cacheKey = `${semActive}_${kelasWalas}`;
    if (LEGER_SAS_CACHE[cacheKey] && LEGER_SAS_CACHE[cacheKey].meta) {
      LEGER_SAS_CACHE[cacheKey].meta.tahunPelajaran = tahunPelajaran;
      LEGER_SAS_CACHE[cacheKey].meta.tglRapor = tglRapor;
      LEGER_SAS_CACHE[cacheKey].meta.kepsek = kepsek;
      LEGER_SAS_CACHE[cacheKey].meta.nipyKepsek = nipyKepsek;
      LEGER_SAS_CACHE[cacheKey].meta.ekstraMasterList = ekstraMasterList.filter(Boolean);
      CURRENT_LEGER_SAS_DATA = LEGER_SAS_CACHE[cacheKey];
      sessionStorage.setItem(`ERAPOR_LEGER_SAS_${cacheKey}`, JSON.stringify(LEGER_SAS_CACHE[cacheKey]));
    }
    alert(res.message || "ID Sekolah berhasil disimpan!");
  } else {
    alert("Gagal menyimpan ID Sekolah: " + (res?.message || "Terjadi kesalahan."));
  }
}

// ====================================================
// SUB-MENU 3: EKSTRAKURIKULER (CRUD MASSAL)
// ====================================================
function renderSasEkstraPanel() {
  const tbody = document.getElementById("sas-ekstra-tbody");
  if (!tbody || !CURRENT_LEGER_SAS_DATA) return;

  const students = CURRENT_LEGER_SAS_DATA.data || [];
  const masterEkstra = CURRENT_LEGER_SAS_DATA.meta?.ekstraMasterList || [
    "Pramuka", "Panahan", "Paskibra", "Karate", "Voli", "Futsal", "Renang", "Bulutangkis"
  ];

  const predikatOptions = ["Sangat Baik", "Baik", "Cukup", "Kurang"];

  let rowsHtml = "";
  students.forEach((student, sIdx) => {
    const ekstraArr = student.ekstra || [];
    let slotsHtml = "";

    for (let slot = 0; slot < 3; slot++) {
      const item = ekstraArr[slot] || { nama: "", predikat: "Baik", keterangan: "" };
      const currentNama = item.nama || "";
      const currentPred = (item.predikat && item.predikat !== "-") ? item.predikat : "Baik";
      const currentKet = (item.keterangan && item.keterangan !== "-") ? item.keterangan : "";

      // Gabungkan opsi master + nilai lama jika ada yang belum masuk master
      const optionSet = new Set(masterEkstra);
      if (currentNama) optionSet.add(currentNama);

      let selectEkstraOpts = `<option value="">-- Tidak Ada --</option>`;
      optionSet.forEach(opt => {
        const selected = opt.toLowerCase() === currentNama.toLowerCase() ? "selected" : "";
        selectEkstraOpts += `<option value="${escapeHtmlAttrSAS(opt)}" ${selected}>${opt}</option>`;
      });

      let selectPredOpts = "";
      predikatOptions.forEach(pr => {
        const selected = pr.toLowerCase() === currentPred.toLowerCase() ? "selected" : "";
        selectPredOpts += `<option value="${pr}" ${selected}>${pr}</option>`;
      });

      const slotBg = slot === 0 ? "bg-emerald-50/20" : slot === 1 ? "bg-blue-50/20" : "bg-amber-50/20";

      slotsHtml += `
        <td class="p-2 border-r align-top ${slotBg}">
          <div class="space-y-1.5">
            <div class="flex gap-1.5">
              <select data-sidx="${sIdx}" data-slot="${slot}" class="sas-ekstra-nama flex-1 border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-emerald-500">
                ${selectEkstraOpts}
              </select>
              <select data-sidx="${sIdx}" data-slot="${slot}" class="sas-ekstra-pred w-24 border border-gray-300 rounded px-1.5 py-1 text-xs bg-white focus:ring-1 focus:ring-emerald-500">
                ${selectPredOpts}
              </select>
            </div>
            <input type="text" data-sidx="${sIdx}" data-slot="${slot}" class="sas-ekstra-ket w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-emerald-500" placeholder="Keterangan kegiatan..." value="${escapeHtmlAttrSAS(currentKet)}">
          </div>
        </td>
      `;
    }

    rowsHtml += `
      <tr class="hover:bg-slate-50">
        <td class="p-2 border-r text-center font-semibold text-gray-500 align-top">${sIdx + 1}</td>
        <td class="p-2 border-r font-semibold text-gray-800 align-top">${student.nama}</td>
        ${slotsHtml}
      </tr>
    `;
  });

  tbody.innerHTML = rowsHtml;
}

async function simpanEkstraSAS() {
  const kelasWalas = STATE.currentUser?.walas_kelas;
  const semActive = STATE.currentSasSemester || 1;
  const spreadsheetId = CONFIG.RAPOR_SAS_DB?.[semActive]?.[kelasWalas];

  if (!spreadsheetId || !CURRENT_LEGER_SAS_DATA) {
    alert("Data SAS belum dimuat.");
    return;
  }

  const students = CURRENT_LEGER_SAS_DATA.data || [];
  const payloadStudents = students.map((student, sIdx) => {
    const ekstraList = [];
    for (let slot = 0; slot < 3; slot++) {
      const namaEl = document.querySelector(`.sas-ekstra-nama[data-sidx="${sIdx}"][data-slot="${slot}"]`);
      const predEl = document.querySelector(`.sas-ekstra-pred[data-sidx="${sIdx}"][data-slot="${slot}"]`);
      const ketEl  = document.querySelector(`.sas-ekstra-ket[data-sidx="${sIdx}"][data-slot="${slot}"]`);

      const keg = namaEl ? namaEl.value.trim() : "";
      if (keg) {
        ekstraList.push({
          nama: keg,
          predikat: predEl ? predEl.value.trim() : "Baik",
          keterangan: ketEl ? ketEl.value.trim() : ""
        });
      }
    }
    return {
      nama: student.nama,
      ekstra: ekstraList
    };
  });

  const res = await callGASAPI("saveEkstraSAS", {
    spreadsheetId: spreadsheetId,
    data: { students: payloadStudents }
  });

  if (res && res.status === "success") {
    // Perbarui cache sesi otomatis
    const cacheKey = `${semActive}_${kelasWalas}`;
    if (LEGER_SAS_CACHE[cacheKey]) {
      LEGER_SAS_CACHE[cacheKey].data.forEach((st, idx) => {
        st.ekstra = payloadStudents[idx].ekstra.map(e => ({
          nama: e.nama,
          predikat: e.predikat || "-",
          keterangan: e.keterangan || "-"
        }));
      });
      CURRENT_LEGER_SAS_DATA = LEGER_SAS_CACHE[cacheKey];
      sessionStorage.setItem(`ERAPOR_LEGER_SAS_${cacheKey}`, JSON.stringify(LEGER_SAS_CACHE[cacheKey]));
    }
    alert(res.message || "Data Ekstrakurikuler berhasil disimpan!");
  } else {
    alert("Gagal menyimpan Ekstrakurikuler: " + (res?.message || "Terjadi kesalahan."));
  }
}

// ====================================================
// SUB-MENU 4: NOTE / CATATAN WALI KELAS (CRUD MASSAL)
// ====================================================
function renderSasNotePanel() {
  const tbody = document.getElementById("sas-note-tbody");
  if (!tbody || !CURRENT_LEGER_SAS_DATA) return;

  const students = CURRENT_LEGER_SAS_DATA.data || [];
  let rowsHtml = "";

  students.forEach((student, sIdx) => {
    const noteDetail = student.noteDetail || { mode: "auto", autoNote: "", manualNote: "" };
    const isManual = noteDetail.mode === "manual";
    const currentAuto = noteDetail.autoNote || TEMPLATE_CATATAN_OTOMATIS_SAS[0];
    const currentManual = noteDetail.manualNote || "";

    // Bangun dropdown 27 template otomatis
    const autoSet = new Set(TEMPLATE_CATATAN_OTOMATIS_SAS);
    if (currentAuto) autoSet.add(currentAuto);

    let autoOptionsHtml = "";
    autoSet.forEach(tpl => {
      const selected = tpl === currentAuto ? "selected" : "";
      autoOptionsHtml += `<option value="${escapeHtmlAttrSAS(tpl)}" ${selected}>${tpl}</option>`;
    });

    rowsHtml += `
      <tr class="hover:bg-slate-50">
        <td class="p-2.5 border-r text-center font-semibold text-gray-500 align-top">${sIdx + 1}</td>
        <td class="p-2.5 border-r font-semibold text-gray-800 align-top">
          <div>${student.nama}</div>
          <div class="text-[11px] font-normal text-gray-400 mt-0.5">S: ${student.sakit ?? 0} | I: ${student.izin ?? 0} | A: ${student.alpa ?? 0}</div>
        </td>
        <td class="p-2.5 border-r align-top text-center">
          <div class="inline-flex rounded-lg border border-gray-300 overflow-hidden bg-gray-100 p-0.5">
            <button type="button" onclick="toggleSasNoteMode(${sIdx}, 'auto')" id="btn-note-auto-${sIdx}" class="px-2.5 py-1 text-[11px] font-bold rounded-md transition ${!isManual ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}">
              Otomatis
            </button>
            <button type="button" onclick="toggleSasNoteMode(${sIdx}, 'manual')" id="btn-note-manual-${sIdx}" class="px-2.5 py-1 text-[11px] font-bold rounded-md transition ${isManual ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}">
              Manual
            </button>
          </div>
          <input type="hidden" id="sas-note-mode-${sIdx}" value="${isManual ? 'manual' : 'auto'}">
        </td>
        <td class="p-2.5 align-top">
          <div id="sas-note-box-auto-${sIdx}" class="${isManual ? 'hidden' : ''}">
            <select id="sas-note-auto-val-${sIdx}" class="w-full border border-emerald-300 bg-emerald-50/40 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              ${autoOptionsHtml}
            </select>
            <p class="text-[11px] text-gray-400 mt-1">Pratinjau Rapor: <em>"${student.nama}, <span id="sas-note-preview-${sIdx}">${currentAuto}</span>"</em></p>
          </div>
          <div id="sas-note-box-manual-${sIdx}" class="${!isManual ? 'hidden' : ''}">
            <textarea id="sas-note-manual-val-${sIdx}" rows="2" class="w-full border border-amber-300 bg-amber-50/30 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none" placeholder="Ketik catatan khusus untuk ${student.nama} (tanpa mengulang nama siswa di depan)...">${currentManual}</textarea>
            <p class="text-[11px] text-amber-700 mt-0.5">Catatan akan diawali otomatis dengan: <strong>${student.nama}, ...</strong></p>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = rowsHtml;

  // Pasang listener live preview untuk dropdown otomatis
  students.forEach((student, sIdx) => {
    const selEl = document.getElementById(`sas-note-auto-val-${sIdx}`);
    const prevEl = document.getElementById(`sas-note-preview-${sIdx}`);
    if (selEl && prevEl) {
      selEl.addEventListener("change", () => {
        prevEl.innerText = selEl.value;
      });
    }
  });
}

function toggleSasNoteMode(sIdx, mode) {
  const modeInput = document.getElementById(`sas-note-mode-${sIdx}`);
  const btnAuto   = document.getElementById(`btn-note-auto-${sIdx}`);
  const btnManual = document.getElementById(`btn-note-manual-${sIdx}`);
  const boxAuto   = document.getElementById(`sas-note-box-auto-${sIdx}`);
  const boxManual = document.getElementById(`sas-note-box-manual-${sIdx}`);

  if (modeInput) modeInput.value = mode;

  if (mode === "manual") {
    if (btnAuto) btnAuto.className = "px-2.5 py-1 text-[11px] font-bold rounded-md transition text-gray-600 hover:text-gray-900";
    if (btnManual) btnManual.className = "px-2.5 py-1 text-[11px] font-bold rounded-md transition bg-amber-600 text-white shadow-sm";
    if (boxAuto) boxAuto.classList.add("hidden");
    if (boxManual) boxManual.classList.remove("hidden");
  } else {
    if (btnAuto) btnAuto.className = "px-2.5 py-1 text-[11px] font-bold rounded-md transition bg-emerald-600 text-white shadow-sm";
    if (btnManual) btnManual.className = "px-2.5 py-1 text-[11px] font-bold rounded-md transition text-gray-600 hover:text-gray-900";
    if (boxAuto) boxAuto.classList.remove("hidden");
    if (boxManual) boxManual.classList.add("hidden");
  }
}

async function simpanNoteSAS() {
  const kelasWalas = STATE.currentUser?.walas_kelas;
  const semActive = STATE.currentSasSemester || 1;
  const spreadsheetId = CONFIG.RAPOR_SAS_DB?.[semActive]?.[kelasWalas];

  if (!spreadsheetId || !CURRENT_LEGER_SAS_DATA) {
    alert("Data SAS belum dimuat.");
    return;
  }

  const students = CURRENT_LEGER_SAS_DATA.data || [];
  const payloadStudents = students.map((student, sIdx) => {
    const mode = document.getElementById(`sas-note-mode-${sIdx}`)?.value || "auto";
    const autoNote = document.getElementById(`sas-note-auto-val-${sIdx}`)?.value.trim() || "";
    const manualNote = document.getElementById(`sas-note-manual-val-${sIdx}`)?.value.trim() || "";

    return {
      nama: student.nama,
      mode: mode,
      autoNote: autoNote,
      manualNote: manualNote
    };
  });

  const res = await callGASAPI("saveNoteSAS", {
    spreadsheetId: spreadsheetId,
    data: { students: payloadStudents }
  });

  if (res && res.status === "success") {
    // Perbarui cache sesi otomatis
    const cacheKey = `${semActive}_${kelasWalas}`;
    if (LEGER_SAS_CACHE[cacheKey]) {
      LEGER_SAS_CACHE[cacheKey].data.forEach((st, idx) => {
        const item = payloadStudents[idx];
        const chosen = item.mode === "manual" ? (item.manualNote || item.autoNote) : item.autoNote;
        st.catatan = chosen ? `${st.nama}, ${chosen}` : "-";
        st.noteDetail = {
          mode: item.mode,
          autoNote: item.autoNote,
          manualNote: item.mode === "manual" ? item.manualNote : "",
          finalNote: st.catatan
        };
      });
      CURRENT_LEGER_SAS_DATA = LEGER_SAS_CACHE[cacheKey];
      sessionStorage.setItem(`ERAPOR_LEGER_SAS_${cacheKey}`, JSON.stringify(LEGER_SAS_CACHE[cacheKey]));
    }
    alert(res.message || "Catatan Wali Kelas berhasil disimpan!");
  } else {
    alert("Gagal menyimpan Catatan: " + (res?.message || "Terjadi kesalahan."));
  }
}

// ====================================================
// SUB-MENU 5: DESKRIPSI (MONITORING - NO CRUD)
// ====================================================
function renderSasDeskripsiPanel() {
  const thead = document.getElementById("sas-deskripsi-thead");
  const tbody = document.getElementById("sas-deskripsi-tbody");
  const filterSelect = document.getElementById("sas-deskripsi-filter-mapel");
  if (!thead || !tbody || !CURRENT_LEGER_SAS_DATA) return;

  const kelasWalas = STATE.currentUser?.walas_kelas || CURRENT_LEGER_SAS_DATA.meta?.kelas || "";
  const raporMapels = getSASMapelByKelas(kelasWalas, "rapor");

  // Isi opsi dropdown filter mapel sekali saja jika masih 1 opsi
  if (filterSelect && filterSelect.options.length <= 1) {
    raporMapels.forEach(mp => {
      filterSelect.innerHTML += `<option value="${mp.key}">${mp.nama} (${mp.short})</option>`;
    });
  }

  const selectedFilter = filterSelect ? filterSelect.value : "ALL";
  const students = CURRENT_LEGER_SAS_DATA.data || [];

  if (selectedFilter === "ALL") {
    // Mode Matriks Ringkas Status Kelengkapan Semua Mapel
    let thHtml = `
      <tr>
        <th class="p-2 border-r w-10 text-center">NO</th>
        <th class="p-2 border-r w-48">NAMA SISWA</th>
    `;
    raporMapels.forEach(mp => {
      thHtml += `<th class="p-2 border-r w-14 text-center" title="${mp.nama}">${mp.short}</th>`;
    });
    thHtml += `</tr>`;
    thead.innerHTML = thHtml;

    let tbHtml = "";
    students.forEach((st, idx) => {
      let tds = `
        <td class="p-2 border-r text-center font-semibold text-gray-500">${idx + 1}</td>
        <td class="p-2 border-r font-medium text-gray-800 whitespace-nowrap">${st.nama}</td>
      `;
      raporMapels.forEach(mp => {
        const desc = st.deskripsi ? st.deskripsi[mp.key] : "";
        const isFilled = desc && desc !== "-" && desc.trim().length > 2;
        if (isFilled) {
          tds += `<td class="p-2 border-r text-center bg-emerald-50 text-emerald-700 font-bold" title="${escapeHtmlAttrSAS(desc)}"><i class="fa-solid fa-circle-check"></i></td>`;
        } else {
          tds += `<td class="p-2 border-r text-center bg-rose-50 text-rose-600 font-bold" title="Deskripsi belum terisi"><i class="fa-solid fa-circle-xmark"></i></td>`;
        }
      });
      tbHtml += `<tr class="hover:bg-slate-50">${tds}</tr>`;
    });
    tbody.innerHTML = tbHtml;
  } else {
    // Mode Detail Teks Deskripsi Satu Mata Pelajaran
    const mpObj = raporMapels.find(m => m.key === selectedFilter) || { nama: selectedFilter };
    thead.innerHTML = `
      <tr>
        <th class="p-2.5 border-r w-10 text-center">NO</th>
        <th class="p-2.5 border-r w-52">NAMA SISWA</th>
        <th class="p-2.5 border-r w-20 text-center">NILAI</th>
        <th class="p-2.5">DESKRIPSI CAPAIAN KOMPETENSI (${mpObj.nama})</th>
      </tr>
    `;

    let tbHtml = "";
    students.forEach((st, idx) => {
      const score = st.scores ? st.scores[selectedFilter] : "-";
      const desc = (st.deskripsi && st.deskripsi[selectedFilter]) ? st.deskripsi[selectedFilter] : "-";
      const isEmpty = !desc || desc === "-";

      tbHtml += `
        <tr class="hover:bg-slate-50">
          <td class="p-2.5 border-r text-center font-semibold text-gray-500">${idx + 1}</td>
          <td class="p-2.5 border-r font-medium text-gray-800">${st.nama}</td>
          <td class="p-2.5 border-r text-center font-bold text-indigo-700">${score ?? "-"}</td>
          <td class="p-2.5 ${isEmpty ? 'text-rose-500 italic bg-rose-50/40' : 'text-gray-700'}">${desc}</td>
        </tr>
      `;
    });
    tbody.innerHTML = tbHtml;
  }
}

// ====================================================
// SUB-MENU 8: RANKING & PIAGAM (KERANGKA AWAL)
// ====================================================
function renderSasRankingPanel() {
  const tbody = document.getElementById("sas-ranking-tbody");
  if (!tbody || !CURRENT_LEGER_SAS_DATA) return;

  const meta = CURRENT_LEGER_SAS_DATA.meta || {};
  const rankSheetList = meta.rangkingList || [];

  if (rankSheetList.length > 0) {
    tbody.innerHTML = rankSheetList.map((r, i) => `
      <tr class="hover:bg-slate-50">
        <td class="p-2.5 border-r text-center font-semibold text-gray-500">${r.no || (i + 1)}</td>
        <td class="p-2.5 border-r font-bold text-gray-800">${r.nama}</td>
        <td class="p-2.5 border-r text-center text-gray-600">${r.nisn || "-"}</td>
        <td class="p-2.5 border-r text-center text-gray-600">${r.kelas || meta.kelas || "-"}</td>
        <td class="p-2.5 border-r text-center font-extrabold bg-amber-50 text-amber-800">${r.rank}</td>
        <td class="p-2.5 text-center text-gray-400 italic">Menunggu Desain Piagam</td>
      </tr>
    `).join("");
    return;
  }

  // Fallback jika tab RANGKING kosong: urutkan top 10 dari data siswa
  const sorted = [...(CURRENT_LEGER_SAS_DATA.data || [])]
    .filter(s => !isNaN(Number(s.rank)))
    .sort((a, b) => Number(a.rank) - Number(b.rank))
    .slice(0, 10);

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-400">Belum ada data peringkat pada tab RANGKING.</td></tr>`;
    return;
  }

  tbody.innerHTML = sorted.map((st, i) => `
    <tr class="hover:bg-slate-50">
      <td class="p-2.5 border-r text-center font-semibold text-gray-500">${i + 1}</td>
      <td class="p-2.5 border-r font-bold text-gray-800">${st.nama}</td>
      <td class="p-2.5 border-r text-center text-gray-600">${st.nisn || "-"}</td>
      <td class="p-2.5 border-r text-center text-gray-600">${meta.kelas || "-"}</td>
      <td class="p-2.5 border-r text-center font-extrabold bg-amber-50 text-amber-800">PERINGKAT ${st.rank}</td>
      <td class="p-2.5 text-center text-gray-400 italic">Menunggu Desain Piagam</td>
    </tr>
  `).join("");
}
