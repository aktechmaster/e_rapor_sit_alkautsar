// ====================================================
// MAIN ENTRY POINT & CONTROLLER ROUTING
// ====================================================
document.addEventListener("DOMContentLoaded", () => {
  if (typeof checkAuthSession === 'function') checkAuthSession();
  if (typeof renderFormatifHeaders === 'function') renderFormatifHeaders();

  const selectMapel = document.getElementById('select-mapel');
  if (selectMapel) {
    selectMapel.addEventListener('change', (e) => {
      updateKelasDropdown(e.target.value);
      loadActiveMenuData();
    });
  }

  const selectKelas = document.getElementById('select-kelas');
  if (selectKelas) {
    selectKelas.addEventListener('change', () => loadActiveMenuData());
  }

  if (typeof attachTableKeyboardNav === 'function') {
    attachTableKeyboardNav('table-formatif-body');
    attachTableKeyboardNav('table-sumatif-body');
  }
});

function switchMenu(viewName, semester = null) {
  if (semester !== null && semester !== undefined) {
    if (viewName === 'leger-sas' || viewName === 'sas-workspace') {
      STATE.currentSasSemester = Number(semester);
    } else {
      STATE.currentStsSemester = Number(semester);
    }
  }

  // Kompatibilitas jika ada pemanggilan lama 'leger-sas'
  const resolvedView = viewName === 'leger-sas' ? 'sas-workspace' : viewName;

  const views = ['dashboard', 'tp', 'sumatif', 'formatif', 'katrol', 'leger', 'sas-workspace', 'arsip'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');

    const navEl = document.getElementById(`nav-${v}`);
    if (navEl) navEl.classList.remove('active');
  });

  // Reset highlight sub-nav STS & SAS
  [
    'nav-leger-sts1', 'nav-cetak-sts1', 'nav-leger-sts2', 'nav-cetak-sts2',
    'nav-sas-sem1', 'nav-sas-sem2',
    'nav-leger-sas1', 'nav-cetak-sas1', 'nav-leger-sas2', 'nav-cetak-sas2'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  // Tampilkan View Target
  const targetView = document.getElementById(`view-${resolvedView}`);
  if (targetView) targetView.classList.remove('hidden');

  // Highlight Sub-Nav Aktif atau Main Nav
  if (resolvedView === 'leger') {
    const activeSubNavId = `nav-leger-sts${STATE.currentStsSemester}`;
    const targetSubNav = document.getElementById(activeSubNavId);
    if (targetSubNav) targetSubNav.classList.add('active');
  } else if (resolvedView === 'sas-workspace') {
    const activeSubNavId = `nav-sas-sem${STATE.currentSasSemester}`;
    const targetSubNav = document.getElementById(activeSubNavId);
    if (targetSubNav) targetSubNav.classList.add('active');
  } else {
    const targetNav = document.getElementById(`nav-${resolvedView}`);
    if (targetNav) targetNav.classList.add('active');
  }

  // KONTROL VISIBILITAS DROPDOWN HEADER MAPEL & KELAS
  const headerSelectMapel = document.getElementById('select-mapel')?.parentElement;
  const headerSelectKelas = document.getElementById('select-kelas')?.parentElement;
  if (resolvedView === 'leger' || resolvedView === 'sas-workspace' || resolvedView === 'arsip') {
    if (headerSelectMapel) headerSelectMapel.classList.add('hidden');
    if (headerSelectKelas) headerSelectKelas.classList.add('hidden');
  } else {
    if (headerSelectMapel) headerSelectMapel.classList.remove('hidden');
    if (headerSelectKelas) headerSelectKelas.classList.remove('hidden');
  }

  if (window.innerWidth < 768) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (overlay) overlay.classList.add('hidden');
  }

  loadActiveMenuData(resolvedView);
}

// BUKA WORKSPACE MODUL RAPOR SAS (8 SUB-MENU)
function openSasWorkspace(semester, initialSubTab = 'leger') {
  STATE.currentSasSemester = Number(semester) || 1;
  if (typeof CURRENT_SAS_SUBTAB !== 'undefined') {
    CURRENT_SAS_SUBTAB = initialSubTab;
  }
  switchMenu('sas-workspace', STATE.currentSasSemester);
}

// BUKA HALAMAN CETAK COVER SAS (3 LEMBAR) DI TAB BARU
function bukaCetakCoverSAS(semester) {
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;
  if (!kelasWalas) {
    alert("Akun Anda tidak terdaftar sebagai Wali Kelas!");
    return;
  }

  const sem = Number(semester) || STATE.currentSasSemester || 1;
  STATE.currentSasSemester = sem;

  sessionStorage.setItem("ERAPOR_PRINT_USER", JSON.stringify(STATE.currentUser));
  sessionStorage.setItem("ERAPOR_PRINT_SAS_SEM", String(sem));

  const cacheKey = `${sem}_${kelasWalas}`;
  if (typeof LEGER_SAS_CACHE !== "undefined" && LEGER_SAS_CACHE[cacheKey]) {
    sessionStorage.setItem(`ERAPOR_LEGER_SAS_${cacheKey}`, JSON.stringify(LEGER_SAS_CACHE[cacheKey]));
  }

  window.open(`cetak-cover-sas.html?sem=${sem}`, "_blank");
}

// BUKA HALAMAN CETAK RAPOR STS DI TAB BARU (cetak-sts.html)
function bukaCetakSTS(semester) {
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;
  if (!kelasWalas) {
    alert("Akun Anda tidak terdaftar sebagai Wali Kelas!");
    return;
  }

  const sem = Number(semester) || 1;
  STATE.currentStsSemester = sem;

  sessionStorage.setItem("ERAPOR_PRINT_USER", JSON.stringify(STATE.currentUser));
  sessionStorage.setItem("ERAPOR_PRINT_SEM", String(sem));

  const cacheKey = `${sem}_${kelasWalas}`;
  if (typeof LEGER_STS_CACHE !== "undefined" && LEGER_STS_CACHE[cacheKey]) {
    sessionStorage.setItem(`ERAPOR_LEGER_${cacheKey}`, JSON.stringify(LEGER_STS_CACHE[cacheKey]));
  }

  window.open(`cetak-sts.html?sem=${sem}`, "_blank");
}

// TOGGLE SUBMENU RAPOR STS
function toggleStsSubmenu() {
  const submenu = document.getElementById('sts-submenu');
  const arrow = document.getElementById('sts-arrow');
  if (submenu) {
    submenu.classList.toggle('hidden');
    if (arrow) arrow.classList.toggle('rotate-180');
  }
}

// BUKA HALAMAN CETAK RAPOR SAS DI TAB BARU (cetak-sas.html)
function bukaCetakSAS(semester) {
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;
  if (!kelasWalas) {
    alert("Akun Anda tidak terdaftar sebagai Wali Kelas!");
    return;
  }

  const sem = Number(semester) || 1;
  STATE.currentSasSemester = sem;

  sessionStorage.setItem("ERAPOR_PRINT_USER", JSON.stringify(STATE.currentUser));
  sessionStorage.setItem("ERAPOR_PRINT_SAS_SEM", String(sem));

  const cacheKey = `${sem}_${kelasWalas}`;
  if (typeof LEGER_SAS_CACHE !== "undefined" && LEGER_SAS_CACHE[cacheKey]) {
    sessionStorage.setItem(`ERAPOR_LEGER_SAS_${cacheKey}`, JSON.stringify(LEGER_SAS_CACHE[cacheKey]));
  }

  window.open(`cetak-sas.html?sem=${sem}`, "_blank");
}

// TOGGLE SUBMENU RAPOR SAS
function toggleSasSubmenu() {
  const submenu = document.getElementById('sas-submenu');
  const arrow = document.getElementById('sas-arrow');
  if (submenu) {
    submenu.classList.toggle('hidden');
    if (arrow) arrow.classList.toggle('rotate-180');
  }
}

function loadActiveMenuData(targetViewName = null) {
  let viewId = targetViewName ? `view-${targetViewName}` : null;

  if (!viewId) {
    const activeView = document.querySelector('[id^="view-"]:not(.hidden)');
    if (activeView) viewId = activeView.id;
  }

  if (!viewId) return;

  if (viewId === 'view-tp') {
    if (typeof loadSettingTP === 'function') loadSettingTP();
  } else if (viewId === 'view-sumatif') {
    if (typeof loadNilaiSumatif === 'function') loadNilaiSumatif();
  } else if (viewId === 'view-formatif') {
    if (typeof loadDataKelas === 'function') loadDataKelas();
  } else if (viewId === 'view-katrol') {
    if (typeof loadKatrol === 'function') loadKatrol();
  } else if (viewId === 'view-leger') {
    if (typeof loadLegerSTS === 'function') loadLegerSTS();
  } else if (viewId === 'view-sas-workspace') {
    if (typeof initSasWorkspace === 'function') {
      initSasWorkspace();
    } else if (typeof loadLegerSAS === 'function') {
      loadLegerSAS();
    }
  } else if (viewId === 'view-arsip') {
    if (typeof loadDataArsip === 'function') {
      loadDataArsip();
    }
  }
}

function populateDropdowns(user) {
  const selectMapel = document.getElementById('select-mapel');
  const selectKelas = document.getElementById('select-kelas');
  if (!selectMapel || !selectKelas) return;

  selectMapel.innerHTML = '<option value="">-- Pilih Mapel --</option>';
  selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';

  MAPEL_KELAS_MAPPING = {};
  const hakAksesString = user.hak_akses_mengajar || user.mapel_diajar;
  if (hakAksesString) {
    const mapelGroups = hakAksesString.split('|').map(s => s.trim());
    mapelGroups.forEach(group => {
      if (!group) return;
      const [mpId, kelasStr] = group.split(':');
      if (mpId && kelasStr) {
        const cleanMpId = mpId.trim();
        MAPEL_KELAS_MAPPING[cleanMpId] = kelasStr.split(',').map(k => k.trim());
        const mapelInfo = CONFIG.MAPEL_DB[cleanMpId];
        if (mapelInfo) {
          selectMapel.innerHTML += `<option value="${cleanMpId}">${mapelInfo.nama}</option>`;
        }
      }
    });
  }

  if (selectMapel.options.length === 2) {
    selectMapel.selectedIndex = 1;
    updateKelasDropdown(selectMapel.value);
  }

  // KONTROL MENU KHUSUS WALI KELAS
  const navStsGroup = document.getElementById('nav-sts-group');
  if (navStsGroup) {
    if (user && user.walas_kelas) {
      navStsGroup.classList.remove('hidden');
    } else {
      navStsGroup.classList.add('hidden');
    }
  }

  const navSasGroup = document.getElementById('nav-sas-group');
  if (navSasGroup) {
    if (user && user.walas_kelas) {
      navSasGroup.classList.remove('hidden');
    } else {
      navSasGroup.classList.add('hidden');
    }
  }

  // KONTROL MENU ARSIP
  const navArsipGroup = document.getElementById('nav-arsip-group');
  if (navArsipGroup) {
    if (user && user.walas_kelas) {
      navArsipGroup.classList.remove('hidden');
    } else {
      navArsipGroup.classList.add('hidden');
    }
  }
}

function updateKelasDropdown(selectedMapel) {
  const selectKelas = document.getElementById('select-kelas');
  if (!selectKelas) return;

  selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';

  if (!selectedMapel || !MAPEL_KELAS_MAPPING[selectedMapel]) return;

  const kelasList = MAPEL_KELAS_MAPPING[selectedMapel];
  kelasList.forEach(kls => {
    const formattedKls = kls.replace(/^kls-/i, '').toUpperCase();
    selectKelas.innerHTML += `<option value="${formattedKls}">${formattedKls}</option>`;
  });
}

function getTingkatKelas() {
  const selectKelas = document.getElementById('select-kelas');
  if (!selectKelas || !selectKelas.value) return null;
  const match = selectKelas.value.match(/\d+/);
  return match ? match[0] : null;
}

// ====================================================
// FUNGSI ARSIP RAPOR PDF & LEGER EXCEL (DATA ASLI)
// ====================================================

// ID Folder Google Drive tujuan penyimpanan arsip PDF (menggunakan huruf l kecil: -l0-Vn)
const ARSIP_DRIVE_FOLDER_ID = "1YjuyK0MB8_6B0e396JkEjCaMbR-l0-Vn";

async function loadDataArsip(forceRefresh = false) {
  const tbody = document.getElementById('table-arsip-body');
  const metaInfo = document.getElementById('arsip-meta-info');

  if (!STATE.currentUser || !STATE.currentUser.walas_kelas) return;

  const kelasWalas = STATE.currentUser.walas_kelas;
  const semester = STATE.currentSasSemester || 1;
  const spreadsheetId = CONFIG.RAPOR_SAS_DB?.[semester]?.[kelasWalas];

  if (metaInfo) metaInfo.textContent = `Kelas: ${kelasWalas} | Semester: ${semester}`;

  if (!spreadsheetId) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-amber-600 font-medium">ID Spreadsheet SAS ${semester} untuk Kelas ${kelasWalas} belum diisi di config.js.</td></tr>`;
    }
    return;
  }

  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-6"><i class="fa-solid fa-circle-notch animate-spin text-indigo-500 mr-2"></i> Mengambil data siswa asli dari server...</td></tr>';
  }

  try {
    const cacheKey = `${semester}_${kelasWalas}`;
    let res = (!forceRefresh && typeof LEGER_SAS_CACHE !== 'undefined') ? LEGER_SAS_CACHE[cacheKey] : null;

    if (!res || res.status !== 'success') {
      res = await callGASAPI("getLegerSAS", {
        spreadsheetId: spreadsheetId,
        kelas: kelasWalas
      });
      if (res && res.status === 'success' && typeof LEGER_SAS_CACHE !== 'undefined') {
        LEGER_SAS_CACHE[cacheKey] = res;
      }
    }

    if (!res || res.status !== 'success') {
      throw new Error(res?.message || "Gagal mengambil data siswa dari Google Apps Script.");
    }

    const dataSiswa = res.data || [];

    if (dataSiswa.length === 0) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">Belum ada data siswa di kelas ini.</td></tr>';
      return;
    }

    let html = '';
    dataSiswa.forEach((siswa, index) => {
      const namaEscaped = String(siswa.nama || '').replace(/'/g, "\\'");
      html += `
        <tr class="hover:bg-slate-50 transition" id="row-arsip-${index}">
          <td class="p-3 border-r text-center">${index + 1}</td>
          <td class="p-3 border-r text-center">${siswa.nisn || '-'}</td>
          <td class="p-3 border-r font-medium">${siswa.nama}</td>
          <td class="p-3 border-r text-center" id="status-arsip-${index}">
            <span class="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] rounded-md font-bold">Belum Diarsipkan</span>
          </td>
          <td class="p-3 text-center">
            <button onclick="prosesArsipRaporAsli(${index}, '${namaEscaped}')" class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded text-xs font-semibold border border-blue-200 transition">
              <i class="fa-solid fa-cloud-arrow-up mr-1"></i> Arsipkan
            </button>
          </td>
        </tr>
      `;
    });

    if (tbody) tbody.innerHTML = html;
  } catch (error) {
    console.error("Error API Arsip:", error);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-red-500">Gagal terhubung ke database: ${error.message}</td></tr>`;
    }
  }
}

function prosesArsipRaporAsli(siswaIndex, namaSiswa) {
  return new Promise((resolve) => {
    siswaIndex = Number(siswaIndex);
    const statusCell = document.getElementById(`status-arsip-${siswaIndex}`);

    if (!ARSIP_DRIVE_FOLDER_ID) {
      if (statusCell) {
        statusCell.innerHTML = `<span class="px-2.5 py-1 bg-red-100 text-red-700 text-[10px] rounded-md font-bold">ID Folder Drive kosong</span>`;
      }
      resolve(false);
      return;
    }

    if (statusCell) {
      statusCell.innerHTML = `<span class="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] rounded-md font-bold"><i class="fa-solid fa-spinner animate-spin"></i> Merender HTML...</span>`;
    }

    const kelasWalas = STATE.currentUser?.walas_kelas || "";
    const sem = STATE.currentSasSemester || 1;
    const cacheKey = `${sem}_${kelasWalas}`;

    // Siapkan sessionStorage agar cetak-sas.html langsung memakai data kelas tanpa fetch ulang
    sessionStorage.setItem("ERAPOR_PRINT_USER", JSON.stringify(STATE.currentUser));
    sessionStorage.setItem("ERAPOR_PRINT_SAS_SEM", String(sem));
    if (typeof LEGER_SAS_CACHE !== "undefined" && LEGER_SAS_CACHE[cacheKey]) {
      sessionStorage.setItem(`ERAPOR_LEGER_SAS_${cacheKey}`, JSON.stringify(LEGER_SAS_CACHE[cacheKey]));
    }

    // Tempatkan iframe di dalam viewport di belakang layer utama agar browser me-render CSS & gambar secara penuh
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '0';
    iframe.style.top = '0';
    iframe.style.width = '820px';
    iframe.style.height = '1260px';
    iframe.style.zIndex = '-9999';
    iframe.style.border = 'none';
    iframe.style.pointerEvents = 'none';
    iframe.src = `cetak-sas.html?sem=${sem}`;
    document.body.appendChild(iframe);

    iframe.onerror = () => {
      if (statusCell) {
        statusCell.innerHTML = `<span class="px-2.5 py-1 bg-red-100 text-red-700 text-[10px] rounded-md font-bold">Gagal memuat cetak-sas.html</span>`;
      }
      if (iframe.parentNode) document.body.removeChild(iframe);
      resolve(false);
    };

    iframe.onload = async function() {
      try {
        const win = iframe.contentWindow;
        const doc = iframe.contentDocument;

        // Tunggu sampai cetak-sas.js selesai inisialisasi daftar siswa
        let retries = 0;
        while (
          (typeof win.renderLembarRaporSAS !== 'function' ||
           !doc.getElementById('select-siswa-sas') ||
           doc.getElementById('select-siswa-sas').options.length === 0) &&
          retries < 50
        ) {
          await new Promise(r => setTimeout(r, 100));
          retries++;
        }

        const page1 = doc.getElementById('sas-page-1');
        const page2 = doc.getElementById('sas-page-2');

        if (!page1 || !page2 || typeof win.renderLembarRaporSAS !== 'function') {
          if (statusCell) {
            statusCell.innerHTML = `<span class="text-red-500 text-[10px]">Error: Halaman cetak-sas.html gagal diinisialisasi</span>`;
          }
          if (iframe.parentNode) document.body.removeChild(iframe);
          resolve(false);
          return;
        }

        // Render rapor khusus untuk siswaIndex yang dipilih
        win.renderLembarRaporSAS(siswaIndex);

        // Muat html2pdf langsung di dalam context iframe agar seluruh CSS cetak-sas.html ikut ter-render
        if (typeof win.html2pdf !== 'function') {
          await new Promise((resScript, rejScript) => {
            const sc = doc.createElement('script');
            sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            sc.onload = resScript;
            sc.onerror = rejScript;
            doc.head.appendChild(sc);
          });
        }

        // Tunggu seluruh gambar (kop & watermark) selesai dimuat
        const imgs = Array.from(doc.querySelectorAll('img'));
        await Promise.all(imgs.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(r => {
            img.onload = r;
            img.onerror = r;
          });
        }));
        await new Promise(r => setTimeout(r, 300));

        // Sembunyikan toolbar navigasi cetak
        doc.querySelectorAll('.no-print, #sas-mm-ruler').forEach(el => {
          el.style.display = 'none';
        });

        doc.body.style.background = '#ffffff';
        doc.body.style.padding = '0';
        doc.body.style.margin = '0';

        // Atur ukuran penuh kertas F4 (215.9mm x 329mm) dengan padding margin cetak (12mm atas/bawah, 13mm kiri/kanan)
        [page1, page2].forEach(pg => {
          pg.style.border = 'none';
          pg.style.boxShadow = 'none';
          pg.style.boxSizing = 'border-box';
          pg.style.width = '215.9mm';
          pg.style.height = '329mm';
          pg.style.minHeight = '329mm';
          pg.style.maxHeight = '329mm';
          pg.style.padding = '12mm 13mm';
          pg.style.margin = '0';
          pg.style.backgroundColor = '#ffffff';
          pg.style.overflow = 'hidden';
        });

        // Bungkus halaman 1 dan halaman 2 menjadi 2 halaman F4
        const exportWrapper = doc.createElement('div');
        exportWrapper.style.width = '215.9mm';
        exportWrapper.style.backgroundColor = '#ffffff';
        exportWrapper.style.margin = '0';
        exportWrapper.style.padding = '0';

        exportWrapper.appendChild(page1);
        exportWrapper.appendChild(page2);
        doc.body.appendChild(exportWrapper);

        if (statusCell) {
          statusCell.innerHTML = `<span class="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[10px] rounded-md font-bold"><i class="fa-solid fa-spinner animate-spin"></i> Generate PDF...</span>`;
        }

        // Gunakan margin: 0 (angka tunggal) agar tidak terkena pengecekan instanceof Array lintas-window
        const opt = {
          margin:      0,
          filename:    `Rapor_SAS_${sem}_${kelasWalas}_${String(namaSiswa).replace(/ /g, "_")}.pdf`,
          image:       { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0, backgroundColor: '#ffffff' },
          jsPDF:       { unit: 'mm', format: [215.9, 330.2], orientation: 'portrait' },
          pagebreak:   { after: '#sas-page-1' }
        };

        const pdfDataUri = await win.html2pdf().set(opt).from(exportWrapper).outputPdf('datauristring');
        const base64DataClean = pdfDataUri.split(',')[1];

        if (iframe.parentNode) document.body.removeChild(iframe);

        if (statusCell) {
          statusCell.innerHTML = `<span class="px-2.5 py-1 bg-blue-100 text-blue-700 text-[10px] rounded-md font-bold"><i class="fa-solid fa-cloud-arrow-up animate-pulse"></i> Mengirim ke Drive...</span>`;
        }

        const result = await callGASAPI("uploadPDF", {
          folderId: ARSIP_DRIVE_FOLDER_ID,
          fileName: `Rapor_SAS_${sem}_${kelasWalas}_${String(namaSiswa).replace(/ /g, "_")}.pdf`,
          base64Data: base64DataClean
        });

        if (result && result.status === "success") {
          if (statusCell) {
            statusCell.innerHTML = `<span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] rounded-md font-bold"><i class="fa-solid fa-check"></i> Tersimpan di <a href="${result.fileUrl}" target="_blank" class="underline">Drive</a></span>`;
          }
          resolve(true);
        } else {
          throw new Error(result?.message || "Gagal upload ke Google Drive.");
        }
      } catch (error) {
        console.error("Error Arsip:", error);
        if (iframe.parentNode) document.body.removeChild(iframe);
        if (statusCell) {
          statusCell.innerHTML = `<span class="px-2.5 py-1 bg-red-100 text-red-700 text-[10px] rounded-md font-bold" title="${error.message}">Gagal Menyimpan</span>`;
        }
        resolve(false);
      }
    };
  });
}

// 1. FUNGSI PEMBUATAN EXCEL (LEGER KELAS DARI DATA ASLI)
function arsipLegerKelas() {
  const kelasWalas = STATE.currentUser?.walas_kelas;
  const sem = STATE.currentSasSemester || 1;
  const cacheKey = `${sem}_${kelasWalas}`;
  const legerObj = (typeof LEGER_SAS_CACHE !== 'undefined') ? LEGER_SAS_CACHE[cacheKey] : null;

  if (!legerObj || legerObj.status !== 'success' || !Array.isArray(legerObj.data)) {
    alert("Data siswa belum dimuat. Silakan tunggu hingga daftar siswa muncul terlebih dahulu.");
    return;
  }

  if (typeof XLSX === 'undefined') {
    alert("Library XLSX belum dimuat. Tidak bisa mencetak leger.");
    return;
  }

  const activeMapels = (typeof getSASMapelByKelas === 'function')
    ? getSASMapelByKelas(kelasWalas, "leger")
    : [];

  const rowsExcel = legerObj.data.map((student, idx) => {
    const row = {
      NO: idx + 1,
      NISN: student.nisn || "-",
      NAMA: student.nama
    };

    let sumNilai = 0;
    let countNilai = 0;

    activeMapels.forEach(mp => {
      const rawScore = student.scores ? student.scores[mp.key] : null;
      const val = (rawScore !== null && rawScore !== undefined && !isNaN(Number(rawScore)))
        ? Math.round(Number(rawScore))
        : "";
      row[mp.short] = val;
      if (val !== "") {
        sumNilai += val;
        countNilai++;
      }
    });

    row.TOTAL = countNilai > 0 ? sumNilai : (student.jumlahSheet ?? "");
    row.RATA_RATA = countNilai > 0 ? Number((sumNilai / countNilai).toFixed(2)) : (student.rataSheet ?? "");
    row.RANK = student.rank ?? "";
    row.SAKIT = student.sakit ?? 0;
    row.IZIN = student.izin ?? 0;
    row.ALPA = student.alpa ?? 0;

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rowsExcel);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Leger_SAS_${sem}_${kelasWalas}`);
  XLSX.writeFile(workbook, `Leger_SAS_${sem}_Kelas_${kelasWalas}.xlsx`);
}

// 2. FUNGSI GENERATE & ARSIP RAPOR PDF MASSAL (1 KELAS BERURUTAN)
async function arsipRaporSekelas() {
  const kelasWalas = STATE.currentUser?.walas_kelas;
  const sem = STATE.currentSasSemester || 1;
  const cacheKey = `${sem}_${kelasWalas}`;
  const legerObj = (typeof LEGER_SAS_CACHE !== 'undefined') ? LEGER_SAS_CACHE[cacheKey] : null;

  if (!legerObj || legerObj.status !== 'success' || !Array.isArray(legerObj.data) || legerObj.data.length === 0) {
    alert("Data siswa belum dimuat. Silakan tunggu hingga daftar siswa muncul terlebih dahulu.");
    return;
  }

  if (!ARSIP_DRIVE_FOLDER_ID) {
    alert("ID Folder Google Drive belum diisi di file js/app.js.");
    return;
  }

  const daftarSiswa = legerObj.data;
  if (!confirm(`Proses ini akan membuat dan mengarsipkan ${daftarSiswa.length} file PDF Rapor SAS ${sem} Kelas ${kelasWalas} ke Google Drive secara berurutan. Lanjutkan?`)) {
    return;
  }

  const progressContainer = document.getElementById('arsip-progress-container');
  const progressText = document.getElementById('arsip-progress-text');
  const progressPercent = document.getElementById('arsip-progress-percent');
  const progressBar = document.getElementById('arsip-progress-bar');

  if (progressContainer) progressContainer.classList.remove('hidden');

  const total = daftarSiswa.length;
  for (let i = 0; i < total; i++) {
    const siswa = daftarSiswa[i];

    if (progressText) progressText.textContent = `Memproses Rapor: ${i + 1} / ${total} Siswa (${siswa.nama})`;
    await prosesArsipRaporAsli(i, siswa.nama);

    const pct = Math.round(((i + 1) / total) * 100);
    if (progressPercent) progressPercent.textContent = `${pct}%`;
    if (progressBar) progressBar.style.width = `${pct}%`;
  }

  if (progressText) progressText.textContent = `Selesai memproses ${total} / ${total} Siswa.`;
}
