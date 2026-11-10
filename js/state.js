// ====================================================
// STATE & GLOBAL CACHE LAYER
// ====================================================
let CURRENT_KELAS_DATA = null;
const KELAS_DATA_CACHE = {};  
const TP_DATA_CACHE = {};      
const KATROL_DATA_CACHE = {}; 
const LEGER_STS_CACHE = {};
let MAPEL_KELAS_MAPPING = {}; 
let CURRENT_LEGER_DATA = null;
let CURRENT_SISWA_INDEX = 0;

function checkAuthSession() {
  const userSession = sessionStorage.getItem("eRaporUser");
  if (!userSession) {
    window.location.href = "login.html";
    return;
  }
  const user = JSON.parse(userSession);
  STATE.currentUser = user;
  document.getElementById('user-name').innerText = user.nama_lengkap;
  document.getElementById('user-avatar').innerText = user.nama_lengkap.charAt(0);
  
  // Tampilkan Peran Wali Kelas pada Sidebar jika terdaftar
  const userRoleEl = document.getElementById('user-role');
  if (user.walas_kelas) {
    userRoleEl.innerText = `Wali Kelas ${user.walas_kelas}`;
  } else {
    userRoleEl.innerText = `Guru Mata Pelajaran`;
  }
  updateWalasMenuVisibility(user);
  populateDropdowns(user);
}

function updateWalasMenuVisibility(user) {
  const navLeger = document.getElementById('nav-leger');
  const navCetak = document.getElementById('nav-cetak-sts');
  
  if (user && user.walas_kelas) {
    if (navLeger) navLeger.classList.remove('hidden');
    if (navCetak) navCetak.classList.remove('hidden');
  } else {
    if (navLeger) navLeger.classList.add('hidden');
    if (navCetak) navCetak.classList.add('hidden');
  }
}

function logout() {
  sessionStorage.clear();
  window.location.href = "login.html";
}
