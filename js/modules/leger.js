// ====================================================
// MODUL 5: LEGER STS (KHUSUS KELAS WALI - INLINE GRID CRUD)
// ====================================================
let LEGER_STS_ORIGINAL_SNAPSHOT = {};
let LEGER_STS_DIRTY_ROWS = new Set();

const STS_EDITABLE_COLS = [
  { key: "pra",     sheetIdx: 18, type: "grade" },
  { key: "ibd",     sheetIdx: 19, type: "grade" },
  { key: "sos",     sheetIdx: 20, type: "grade" },
  { key: "mdr",     sheetIdx: 21, type: "grade" },
  { key: "akh",     sheetIdx: 22, type: "grade" },
  { key: "kpb",     sheetIdx: 23, type: "grade" },
  { key: "s",       sheetIdx: 24, type: "num"   },
  { key: "i",       sheetIdx: 25, type: "num"   },
  { key: "a",       sheetIdx: 26, type: "num"   },
  { key: "catatan", sheetIdx: 31, type: "text"  }
];

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

  const tbody = document.getElementById("table-leger-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="31" class="p-8 text-center text-gray-500 font-medium italic">
          <i class="fa-solid fa-spinner fa-spin text-indigo-600 text-xl mb-2 block"></i>
          Sedang mengambil data Leger STS ${semActive} Kelas ${kelasWalas}...
        </td>
      </tr>
    `;
  }

  if (!forceRefresh && LEGER_STS_CACHE[cacheKey] && LEGER_STS_CACHE[cacheKey].status === "success") {
    CURRENT_LEGER_DATA = LEGER_STS_CACHE[cacheKey];
    renderLegerTable();
    return;
  }

  const res = await callGASAPI("getLegerSTS", {
    spreadsheetId: spreadsheetId,
    kelas: kelasWalas
  });

  if (res && res.status === "success") {
    LEGER_STS_CACHE[cacheKey] = res;
    CURRENT_LEGER_DATA = res;
    renderLegerTable();
  } else {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="31" class="p-6 text-center text-rose-600 font-semibold bg-rose-50 border border-rose-200 rounded-lg">
            <i class="fa-solid fa-triangle-exclamation text-lg mb-1 block"></i>
            Gagal memuat data: ${res?.message || "Terjadi kesalahan koneksi ke server."}
          </td>
        </tr>
      `;
    }
  }
}

function escapeHtmlAttrSTS(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function updateSaveBadgeSTS() {
  const lbl = document.getElementById("lbl-btn-save-sts");
  const btn = document.getElementById("btn-save-all-leger-sts");
  if (!lbl || !btn) return;

  const count = LEGER_STS_DIRTY_ROWS.size;
  if (count > 0) {
    lbl.innerText = `Simpan Perubahan (${count} Siswa)`;
    btn.classList.remove("bg-emerald-600", "hover:bg-emerald-700");
    btn.classList.add("bg-amber-600", "hover:bg-amber-700", "ring-2", "ring-amber-300");
  } else {
    lbl.innerText = "Simpan Perubahan";
    btn.classList.remove("bg-amber-600", "hover:bg-amber-700", "ring-2", "ring-amber-300");
    btn.classList.add("bg-emerald-600", "hover:bg-emerald-700");
  }
}

function renderLegerTable() {
  if (!CURRENT_LEGER_DATA || CURRENT_LEGER_DATA.status !== "success") return;
  const { meta, data } = CURRENT_LEGER_DATA;

  LEGER_STS_ORIGINAL_SNAPSHOT = {};
  LEGER_STS_DIRTY_ROWS.clear();
  updateSaveBadgeSTS();

  const namaWalasResmi = (STATE.currentUser && STATE.currentUser.nama_lengkap)
    ? STATE.currentUser.nama_lengkap
    : (meta?.walas || "-");

  const elMeta = document.getElementById("leger-meta-info");
  if (elMeta) {
    elMeta.innerText = `Kelas: ${meta?.kelas || "-"} | Wali Kelas: ${namaWalasResmi}`;
  }

  const tbody = document.getElementById("table-leger-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!data || !Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="31" class="p-4 text-center text-gray-400">Tidak ada data siswa ditemukan.</td></tr>`;
    return;
  }

  let visualRowIdx = 0;

  data.forEach((row, dataIdx) => {
    const no = row[0];
    const kelasStr = row[1];
    const namaSiswa = row[2];

    if (!namaSiswa || namaSiswa === "NAMA SISWA" || namaSiswa === "NAMA" || no === "NO") return;

    const currentVisualRow = visualRowIdx++;

    const snap = {};
    STS_EDITABLE_COLS.forEach(col => {
      const rawVal = row[col.sheetIdx];
      snap[col.key] = col.type === "num"
        ? (rawVal !== "" && rawVal !== undefined && rawVal !== null ? String(rawVal) : "0")
        : String(rawVal ?? "");
    });
    LEGER_STS_ORIGINAL_SNAPSHOT[dataIdx] = snap;

    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 border-b border-gray-200 h-8 text-xs";

    let html = `
      <td class="p-1.5 border-r text-center sticky-col left-0 font-semibold text-gray-600 bg-white">${no}</td>
      <td class="p-1.5 border-r text-center sticky-col left-10 text-gray-700 bg-white">${kelasStr}</td>
      <td class="p-1.5 border-r sticky-col left-[136px] font-medium text-gray-800 truncate bg-white" title="${escapeHtmlAttrSTS(namaSiswa)}">${namaSiswa}</td>
    `;

    // Nilai Mapel (Kolom D - R / indeks 3 - 17) -> Read-only
    for (let c = 3; c <= 17; c++) {
      const val = row[c] !== "" && row[c] !== undefined ? Math.round(Number(row[c])) : "-";
      html += `<td class="p-1.5 border-r text-center">${isNaN(val) ? (row[c] || "-") : val}</td>`;
    }

    // Sikap (Kolom S - X / indeks 18 - 23 -> gridCol 0 - 5) -> Editable
    for (let gCol = 0; gCol <= 5; gCol++) {
      const colCfg = STS_EDITABLE_COLS[gCol];
      const val = escapeHtmlAttrSTS(row[colCfg.sheetIdx] ?? "");
      html += `
        <td class="p-0 border-r bg-amber-50/40">
          <input type="text"
            value="${val}"
            maxlength="3"
            data-grid-cell="1"
            data-vrow="${currentVisualRow}"
            data-gcol="${gCol}"
            data-didx="${dataIdx}"
            data-sidx="${colCfg.sheetIdx}"
            data-key="${colCfg.key}"
            data-ctype="grade"
            class="w-full h-8 px-1 text-center font-semibold text-amber-800 uppercase bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
          />
        </td>
      `;
    }

    // Absensi S, I, A (Kolom Y - AA / indeks 24 - 26 -> gridCol 6 - 8) -> Editable
    for (let gCol = 6; gCol <= 8; gCol++) {
      const colCfg = STS_EDITABLE_COLS[gCol];
      const rawAbs = row[colCfg.sheetIdx];
      const val = escapeHtmlAttrSTS(rawAbs !== "" && rawAbs !== undefined && rawAbs !== null ? rawAbs : "0");
      html += `
        <td class="p-0 border-r bg-rose-50/40">
          <input type="text"
            inputmode="numeric"
            value="${val}"
            maxlength="3"
            data-grid-cell="1"
            data-vrow="${currentVisualRow}"
            data-gcol="${gCol}"
            data-didx="${dataIdx}"
            data-sidx="${colCfg.sheetIdx}"
            data-key="${colCfg.key}"
            data-ctype="num"
            class="w-full h-8 px-1 text-center font-medium text-rose-900 bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
          />
        </td>
      `;
    }

    // Rekap Rumus (Total, Rata, Rank) -> Read-only
    const total = row[27] !== "" && row[27] !== undefined ? Number(row[27]).toLocaleString("id-ID") : "-";
    const avg = row[28] !== "" && row[28] !== undefined ? Number(row[28]).toFixed(2).replace(".", ",") : "-";
    const rank = row[29] !== "" && row[29] !== undefined ? row[29] : "-";

    // Catatan / Surat Hafalan T2Q (Kolom AF / indeks 31 -> gridCol 9) -> Editable
    const catatanCfg = STS_EDITABLE_COLS[9];
    const suratVal = escapeHtmlAttrSTS(row[31] ?? "");

    html += `
      <td class="p-1.5 border-r text-center font-bold bg-emerald-50 text-emerald-900">${total}</td>
      <td class="p-1.5 border-r text-center font-bold bg-emerald-50 text-emerald-900">${avg}</td>
      <td class="p-1.5 border-r text-center font-extrabold bg-amber-100 text-amber-900">${rank}</td>
      <td class="p-0 border-r bg-indigo-50/20">
        <input type="text"
          value="${suratVal}"
          placeholder="Isi catatan / surat hafalan..."
          data-grid-cell="1"
          data-vrow="${currentVisualRow}"
          data-gcol="9"
          data-didx="${dataIdx}"
          data-sidx="${catatanCfg.sheetIdx}"
          data-key="${catatanCfg.key}"
          data-ctype="text"
          class="w-full h-8 px-2 text-left text-gray-800 bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
        />
      </td>
    `;

    tr.innerHTML = html;
    tbody.appendChild(tr);
  });

  // Aktifkan Mesin Grid Spreadsheet (Blok multi-sel, Delete massal, Paste Excel, Navigasi Panah)
  attachSpreadsheetGrid({
    tbody: tbody,
    totalRows: visualRowIdx,
    totalCols: STS_EDITABLE_COLS.length,
    onCellChange: (input, newVal) => {
      const dataIdx = Number(input.dataset.didx);
      const sheetIdx = Number(input.dataset.sidx);
      const key = input.dataset.key;

      CURRENT_LEGER_DATA.data[dataIdx][sheetIdx] = newVal;

      const origVal = LEGER_STS_ORIGINAL_SNAPSHOT[dataIdx]?.[key] ?? "";
      if (newVal !== origVal) {
        input.classList.add("bg-yellow-100");
      } else {
        input.classList.remove("bg-yellow-100");
      }

      const rowInputs = tbody.querySelectorAll(`input[data-didx="${dataIdx}"]`);
      let rowModified = false;
      rowInputs.forEach(inp => {
        const k = inp.dataset.key;
        if (inp.value !== (LEGER_STS_ORIGINAL_SNAPSHOT[dataIdx]?.[k] ?? "")) {
          rowModified = true;
        }
      });

      if (rowModified) {
        LEGER_STS_DIRTY_ROWS.add(dataIdx);
      } else {
        LEGER_STS_DIRTY_ROWS.delete(dataIdx);
      }
      updateSaveBadgeSTS();
    }
  });
}

async function saveAllLegerSTS() {
  if (!CURRENT_LEGER_DATA || !CURRENT_LEGER_DATA.data) return;

  const kelasWalas = STATE.currentUser?.walas_kelas;
  const semActive = STATE.currentStsSemester || 1;
  const spreadsheetId = CONFIG.RAPOR_STS_DB?.[semActive]?.[kelasWalas];

  if (!spreadsheetId) {
    alert(`ID Spreadsheet STS untuk Kelas ${kelasWalas} belum diatur di config.js!`);
    return;
  }

  const indicesToSave = LEGER_STS_DIRTY_ROWS.size > 0
    ? Array.from(LEGER_STS_DIRTY_ROWS)
    : CURRENT_LEGER_DATA.data
        .map((r, i) => (r[2] && r[2] !== "NAMA SISWA" && r[2] !== "NAMA" && r[0] !== "NO" ? i : -1))
        .filter(i => i !== -1);

  const payloadList = indicesToSave.map(idx => {
    const row = CURRENT_LEGER_DATA.data[idx];
    return {
      rowIndex: idx,
      no: row[0],
      nama: row[2],
      pra: String(row[18] ?? "").trim().toUpperCase(),
      ibd: String(row[19] ?? "").trim().toUpperCase(),
      sos: String(row[20] ?? "").trim().toUpperCase(),
      mdr: String(row[21] ?? "").trim().toUpperCase(),
      akh: String(row[22] ?? "").trim().toUpperCase(),
      kpb: String(row[23] ?? "").trim().toUpperCase(),
      s: row[24] !== "" && row[24] !== undefined && row[24] !== null ? Number(row[24]) : 0,
      i: row[25] !== "" && row[25] !== undefined && row[25] !== null ? Number(row[25]) : 0,
      a: row[26] !== "" && row[26] !== undefined && row[26] !== null ? Number(row[26]) : 0,
      catatan: String(row[31] ?? "").trim()
    };
  });

  if (payloadList.length === 0) {
    alert("Tidak ada data siswa untuk disimpan.");
    return;
  }

  const btn = document.getElementById("btn-save-all-leger-sts");
  const lbl = document.getElementById("lbl-btn-save-sts");
  const oldText = lbl ? lbl.innerText : "Simpan Perubahan";
  if (btn) btn.disabled = true;
  if (lbl) lbl.innerText = "Menyimpan...";

  const res = await callGASAPI("updateLegerSTS", {
    spreadsheetId: spreadsheetId,
    sheetName: `LEGER ${kelasWalas}`,
    data: payloadList
  });

  if (btn) btn.disabled = false;

  if (res && res.status === "success") {
    const cacheKey = `${semActive}_${kelasWalas}`;
    LEGER_STS_CACHE[cacheKey] = CURRENT_LEGER_DATA;
    renderLegerTable();
    alert(res.message || "Seluruh perubahan Leger STS berhasil disimpan!");
  } else {
    if (lbl) lbl.innerText = oldText;
    alert("Gagal menyimpan Leger STS: " + (res?.message || "Kesalahan jaringan."));
  }
}
