// ====================================================
// MODUL 6: CETAK RAPOR STS (KHUSUS KELAS WALI)
// ====================================================
async function loadCetakRaporSTS() {
  const kelasWalas = STATE.currentUser ? STATE.currentUser.walas_kelas : null;
  if (!kelasWalas) {
    alert("Akun Anda tidak terdaftar sebagai Wali Kelas!");
    return;
  }
  if (!LEGER_STS_CACHE[kelasWalas]) {
    await loadLegerSTS();
  } else {
    CURRENT_LEGER_DATA = LEGER_STS_CACHE[kelasWalas];
  }
  if (!CURRENT_LEGER_DATA) return;
  const selectSiswa = document.getElementById('select-siswa-rapor');
  selectSiswa.innerHTML = '';
  
  const dataSiswa = CURRENT_LEGER_DATA.data.slice(1);
  dataSiswa.forEach((row, idx) => {
    if (row[2]) {
      selectSiswa.innerHTML += `<option value="${idx}">${row[0]}. ${row[2]}</option>`;
    }
  });
  if (dataSiswa.length > 0) {
    CURRENT_SISWA_INDEX = 0;
    selectSiswa.value = "0";
    renderLembarRapor(0);
  }
}

function prevSiswaRapor() {
  const selectSiswa = document.getElementById('select-siswa-rapor');
  if (CURRENT_SISWA_INDEX > 0) {
    CURRENT_SISWA_INDEX--;
    selectSiswa.value = CURRENT_SISWA_INDEX;
    renderLembarRapor(CURRENT_SISWA_INDEX);
  }
}

function nextSiswaRapor() {
  const selectSiswa = document.getElementById('select-siswa-rapor');
  const max = selectSiswa.options.length - 1;
  if (CURRENT_SISWA_INDEX < max) {
    CURRENT_SISWA_INDEX++;
    selectSiswa.value = CURRENT_SISWA_INDEX;
    renderLembarRapor(CURRENT_SISWA_INDEX);
  }
}

function renderLembarRapor(siswaIndex) {
  siswaIndex = Number(siswaIndex);
  CURRENT_SISWA_INDEX = siswaIndex;
  if (!CURRENT_LEGER_DATA) return;
  const meta = CURRENT_LEGER_DATA.meta || {};
  const row = CURRENT_LEGER_DATA.data[siswaIndex + 1];
  if (!row) return;

  const namaSiswa = row[2] || '-';
  const nisnVal = `314519${1000 + Number(row[0])}`;

  document.getElementById('lbl-rapor-nama').innerText = namaSiswa;
  document.getElementById('lbl-rapor-kelas').innerText = meta.kelas || '-';
  document.getElementById('lbl-rapor-nisn').innerText = nisnVal;
  
  // Update Tanda Tangan & Meta Data Dinamis dari Spreadsheet (LEGER, RAPOR, DASIS)
  const ortuMap = meta.ortuMap || {};
  const namaOrtu = ortuMap[namaSiswa.trim().toUpperCase()] || ortuMap[nisnVal] || '';
  
  const elOrtu = document.getElementById('rapor-ttd-ortu');
  if (elOrtu) {
    elOrtu.innerText = namaOrtu ? `( ${namaOrtu} )` : '( .................................... )';
  }

  const elWalas = document.getElementById('rapor-ttd-walas');
  if (elWalas) {
    elWalas.innerText = meta.walas || '( Wali Kelas )';
  }

  const elWalasNipy = document.getElementById('rapor-ttd-walas-nipy');
  if (elWalasNipy) {
    elWalasNipy.innerText = meta.nipyWalas ? (meta.nipyWalas.startsWith('NIPY') ? meta.nipyWalas : `NIPY. ${meta.nipyWalas}`) : '';
  }

  const elTgl = document.getElementById('rapor-ttd-tgl');
  if (elTgl) {
    elTgl.innerText = `Mukomuko, ${meta.tglRapor || '9 Oktober 2026'}`;
  }

  const elKepsek = document.getElementById('rapor-ttd-kepsek');
  if (elKepsek) {
    elKepsek.innerText = meta.kepsek || 'Warto, S.Pd.I., M.Pd.Gr';
  }

  const elKepsekNipy = document.getElementById('rapor-ttd-kepsek-nipy');
  if (elKepsekNipy) {
    elKepsekNipy.innerText = meta.nipyKepsek || 'NIPY. 141981071801014';
  }

  const mapelList = [
    { no: 1, nama: "Pendidikan Agama Islam", col: 3, grp: "A" },
    { no: 2, nama: "Pendidikan Kewarganegaraan", col: 4, grp: "A" },
    { no: 3, nama: "Bahasa Indonesia", col: 5, grp: "A" },
    { no: 4, nama: "Matematika", col: 6, grp: "A" },
    { no: 5, nama: "Ilmu Pengetahuan Alam", col: 7, grp: "A" },
    { no: 6, nama: "Ilmu Pengetahuan Sosial", col: 8, grp: "A" },
    { no: 7, nama: "Bahasa Inggris", col: 9, grp: "A" },
    { no: 8, nama: "Pendidikan Jasmani Olahraga dan Kesehatan", col: 10, grp: "B" },
    { no: 9, nama: "Teknologi Informasi dan Komunikasi", col: 11, grp: "B" },
    { no: 10, nama: "Seni Budaya dan Keterampilan", col: 12, grp: "B" },
    { no: 11, nama: "Bahasa Arab", col: 13, grp: "B" },
    { no: 12, nama: "Tarjim", col: 16, grp: "B" },
    { no: 13, nama: "Koding", col: 17, grp: "B" },
    { no: 14, nama: "Tahsin dan Tahfidzul Qur'an", col: 14, grp: "B" }
  ];
  const tbody = document.getElementById('rapor-tbody-nilai');
  tbody.innerHTML = '';
  const getHuruf = (val) => {
    if (val >= 90) return 'A';
    if (val >= 80) return 'B';
    if (val >= 75) return 'C';
    if (val >= 60) return 'D';
    return 'E';
  };
  tbody.innerHTML += `<tr class="bg-gray-100 font-bold"><td colspan="6" class="border border-black p-1">Kelompok A :</td></tr>`;
  mapelList.filter(m => m.grp === "A").forEach(m => {
    const val = row[m.col] !== "" ? Number(row[m.col]) : "-";
    const huruf = typeof val === 'number' ? getHuruf(val) : "-";
    const desk = val >= 75 ? "Terlampaui" : "Belum Tercapai";
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
  tbody.innerHTML += `<tr class="bg-gray-100 font-bold"><td colspan="6" class="border border-black p-1">Kelompok B :</td></tr>`;
  mapelList.filter(m => m.grp === "B").forEach(m => {
    const val = row[m.col] !== "" ? Number(row[m.col]) : "-";
    const huruf = typeof val === 'number' ? getHuruf(val) : "-";
    const desk = val >= 75 ? "Terlampaui" : "Belum Tercapai";
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
  document.getElementById('rapor-ekstra-pramuka-nilai').innerText = row[18] || 'B';
  document.getElementById('rapor-sikap-ibadah').innerText = row[19] || 'B';
  document.getElementById('rapor-sikap-sosial').innerText = row[20] || 'A';
  document.getElementById('rapor-sikap-mandiri').innerText = row[21] || 'B';
  document.getElementById('rapor-akh-val').innerText = row[22] || 'B';
  document.getElementById('rapor-kpb-val').innerText = row[23] || 'B';
  document.getElementById('rapor-abs-s').innerText = `${row[24] !== "" ? row[24] : 0} Hari`;
  document.getElementById('rapor-abs-i').innerText = `${row[25] !== "" ? row[25] : 0} Hari`;
  document.getElementById('rapor-abs-a').innerText = `${row[26] !== "" ? row[26] : 0} Hari`;
  document.getElementById('rapor-total-val').innerText = row[27] !== "" ? Number(row[27]).toLocaleString('id-ID') : '-';
  document.getElementById('rapor-avg-val').innerText = row[28] !== "" ? Number(row[28]).toFixed(2).replace('.', ',') : '-';
}
