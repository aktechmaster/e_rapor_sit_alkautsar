// ====================================================
// MAIN ENTRY POINT & CONTROLLER ROUTING
// ====================================================
document.addEventListener("DOMContentLoaded", () => {
  checkAuthSession();
  renderFormatifHeaders();

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

  attachTableKeyboardNav('table-formatif-body');
  attachTableKeyboardNav('table-sumatif-body');
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
  if (resolvedView === 'leger' || resolvedView === 'sas-workspace') {
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
    loadSettingTP();
  } else if (viewId === 'view-sumatif') {
    loadNilaiSumatif();
  } else if (viewId === 'view-formatif') {
    loadDataKelas();
  } else if (viewId === 'view-katrol') {
    loadKatrol();
  } else if (viewId === 'view-leger') {
    if (typeof loadLegerSTS === 'function') {
      loadLegerSTS();
    }
  } else if (viewId === 'view-sas-workspace') {
    if (typeof initSasWorkspace === 'function') {
      initSasWorkspace();
    } else if (typeof loadLegerSAS === 'function') {
      loadLegerSAS();
    }
  } else if (viewId === 'view-arsip') {
    // TAMBAHKAN BARIS INI
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

  // TAMBAHAN: KONTROL MENU ARSIP
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

async function loadDataArsip() {
  const tbody = document.getElementById('table-arsip-body');
  const metaInfo = document.getElementById('arsip-meta-info');

  if (!STATE.currentUser || !STATE.currentUser.walas_kelas) return;

  const kelasWalas = STATE.currentUser.walas_kelas;
  const semester = STATE.currentSasSemester || 1; 
  
  metaInfo.textContent = `Kelas: ${kelasWalas} | Semester: ${semester}`;
  tbody.innerHTML = '<tr><td colspan="5" class="text-center p-6"><i class="fa-solid fa-circle-notch animate-spin text-indigo-500 mr-2"></i> Mengambil data siswa asli dari server...</td></tr>';

  try {
    // KODE MENGAMBIL DATA ASLI
    // Sesuaikan ini dengan fungsi API Anda (misal: mengambil daftar siswa berdasarkan kelas)
    // Jika Anda punya LEGER_SAS_CACHE, Anda juga bisa mengambilnya dari sana
    const response = await fetch(`${CONFIG.API_URL}?action=getSiswaByKelas&kelas=${kelasWalas}`);
    const dataSiswa = await response.json();

    if (!dataSiswa || dataSiswa.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">Belum ada data siswa di kelas ini.</td></tr>';
      return;
    }

    let html = '';
    dataSiswa.forEach((siswa, index) => {
      html += `
        <tr class="hover:bg-slate-50 transition" id="row-arsip-${siswa.nisn}">
          <td class="p-3 border-r text-center">${index + 1}</td>
          <td class="p-3 border-r text-center">${siswa.nisn}</td>
          <td class="p-3 border-r font-medium">${siswa.nama}</td>
          <td class="p-3 border-r text-center" id="status-arsip-${siswa.nisn}">
            <span class="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] rounded-md font-bold">Belum Diarsipkan</span>
          </td>
          <td class="p-3 text-center">
            <button onclick="prosesArsipRaporAsli('${siswa.nisn}')" class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded text-xs font-semibold border border-blue-200 transition">
              <i class="fa-solid fa-cloud-arrow-up mr-1"></i> Arsipkan
            </button>
          </td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
  } catch (error) {
    console.error("Error API:", error);
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-red-500">Gagal terhubung ke database.</td></tr>';
  }
}

// 1. FUNGSI PEMBUATAN EXCEL (LEGER KELAS)
function arsipLegerKelas() {
  console.log("Memproses Leger Excel...");
  
  // Contoh data siswa (Nantinya diganti dengan variabel data dari database Anda)
  const dataLeger = [
    { NO: 1, NISN: "0012345678", NAMA: "Ahmad Fulan", PAI: 85, B_INDO: 90, MTK: 88, TOTAL: 263, RATA_RATA: 87.67 },
    { NO: 2, NISN: "0012345679", NAMA: "Siti Fulanah", PAI: 92, B_INDO: 88, MTK: 95, TOTAL: 275, RATA_RATA: 91.67 }
  ];

  // Membuat Worksheet dan Workbook baru
  const worksheet = XLSX.utils.json_to_sheet(dataLeger);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leger Kelas");

  // Menyimpan file Excel
  const kelas = STATE.currentUser?.walas_kelas || "Unknown";
  XLSX.writeFile(workbook, `Leger_Kelas_${kelas}.xlsx`);
}

// 2. FUNGSI PEMBUATAN PDF (PER SISWA)
function generateRaporPDF(nisn) {
  console.log("Memproses Rapor PDF untuk NISN: " + nisn);
  
  // Inisialisasi jsPDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4'); // Kertas A4, orientasi Portrait

  // Mengambil nama siswa dari tabel (mencari baris yang sesuai dengan NISN)
  // Dalam praktiknya, Anda mengambil ini dari database
  let namaSiswa = "Siswa";
  if (nisn === "0012345678") namaSiswa = "Ahmad Fulan";
  if (nisn === "0012345679") namaSiswa = "Siti Fulanah";

  // Desain Template Rapor Dasar PDF
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("LAPORAN HASIL BELAJAR (RAPOR)", 105, 20, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Nama Siswa  : ${namaSiswa}`, 20, 40);
  doc.text(`NISN        : ${nisn}`, 20, 47);
  doc.text(`Kelas       : ${STATE.currentUser?.walas_kelas || "-"}`, 130, 40);
  doc.text(`Semester    : ${STATE.currentSasSemester || "1"}`, 130, 47);

  // Tabel Nilai di dalam PDF
  doc.autoTable({
    startY: 55,
    head: [['No', 'Mata Pelajaran', 'Nilai Akhir', 'Capaian Kompetensi']],
    body: [
      ['1', 'Pendidikan Agama Islam', '85', 'Sangat Baik dalam memahami materi.'],
      ['2', 'Bahasa Indonesia', '90', 'Baik dalam komunikasi lisan dan tulisan.'],
      ['3', 'Matematika', '88', 'Memiliki kemampuan logika yang baik.']
    ],
    theme: 'grid',
    headStyles: { fillColor: [44, 62, 80] }
  });

  // Tanda Tangan
  const finalY = doc.lastAutoTable.finalY + 30;
  doc.text("Mengetahui,", 140, finalY);
  doc.text("Wali Kelas,", 140, finalY + 5);
  doc.text(STATE.currentUser?.nama || "Guru", 140, finalY + 30);

  // Unduh File PDF
  doc.save(`Rapor_${nisn}_${namaSiswa.replace(/ /g, "_")}.pdf`);
}

// 3. FUNGSI PEMBUATAN PDF (MASSAL / SEMUA SISWA)
function arsipRaporSekelas() {
  alert("Proses ini akan mengunduh PDF seluruh siswa secara berurutan. (Fungsi loop sedang diaktifkan)");
  // Contoh loop berdasarkan data dummy
  const daftarNISN = ["0012345678", "0012345679"];
  
  daftarNISN.forEach((nisn, index) => {
    // Menambahkan jeda waktu agar browser tidak crash saat generate banyak PDF
    setTimeout(() => {
      generateRaporPDF(nisn);
    }, index * 1000); // Jeda 1 detik antar siswa
  });
}

async function prosesArsipRaporAsli(nisn, namaSiswa) {
  const statusCell = document.getElementById(`status-arsip-${nisn}`);
  statusCell.innerHTML = `<span class="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] rounded-md font-bold"><i class="fa-solid fa-spinner animate-spin"></i> Merender HTML...</span>`;

  try {
    // 1. BUAT IFRAME TERSEMBUNYI UNTUK MEMUAT TEMPLATE CETAK-SAS.HTML
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '210mm'; // Lebar kertas A4
    iframe.style.height = '297mm';
    iframe.style.left = '-9999px'; // Sembunyikan dari layar
    
    // Asumsi URL cetak Anda bisa menerima parameter NISN, misal: cetak-sas.html?nisn=12345
    iframe.src = `cetak-sas.html?nisn=${nisn}`; 
    document.body.appendChild(iframe);

    // 2. TUNGGU IFRAME SELESAI DIMUAT
    iframe.onload = async function() {
      // Ambil elemen HTML asli dari dalam cetak-sas.html (asumsi ID bungkus utamanya adalah 'rapor-container')
      // Pastikan di cetak-sas.html Anda ada elemen <div id="rapor-container"> yang membungkus seluruh desain rapor
      const raporElement = iframe.contentDocument.getElementById('rapor-container');
      
      if (!raporElement) {
        statusCell.innerHTML = `<span class="text-red-500 text-[10px]">Error: Container rapor tidak ditemukan</span>`;
        document.body.removeChild(iframe);
        return;
      }

      statusCell.innerHTML = `<span class="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[10px] rounded-md font-bold"><i class="fa-solid fa-spinner animate-spin"></i> Generate PDF...</span>`;

      // 3. UBAH HTML MENJADI PDF (BASE64) MENGGUNAKAN HTML2PDF
      const opt = {
        margin:       0,
        filename:     `Rapor_${nisn}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true }, // scale 2 agar teks tajam
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Generate base64 alih-alih mengunduh langsung
      const pdfBase64 = await html2pdf().set(opt).from(raporElement).outputPdf('datauristring');
      
      // Hapus iframe karena sudah tidak dipakai
      document.body.removeChild(iframe);

      statusCell.innerHTML = `<span class="px-2.5 py-1 bg-blue-100 text-blue-700 text-[10px] rounded-md font-bold"><i class="fa-solid fa-cloud-arrow-up animate-pulse"></i> Mengirim ke Drive...</span>`;

      // 4. KIRIM PDF (BASE64) KE GOOGLE APPS SCRIPT
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: "uploadPDFArsip",
          fileName: `Rapor_SAS_${STATE.currentUser.walas_kelas}_${namaSiswa.replace(/ /g, "_")}.pdf`,
          base64: pdfBase64
        })
      });

      const result = await response.json();

      if (result.status === "success") {
        statusCell.innerHTML = `<span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] rounded-md font-bold"><i class="fa-solid fa-check"></i> Tersimpan di Drive</span>`;
      } else {
        throw new Error(result.message);
      }
    };
  } catch (error) {
    console.error("Error Arsip:", error);
    statusCell.innerHTML = `<span class="px-2.5 py-1 bg-red-100 text-red-700 text-[10px] rounded-md font-bold">Gagal Menyimpan</span>`;
  }
}
