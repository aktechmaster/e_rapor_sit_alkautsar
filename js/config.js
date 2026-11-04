const CONFIG = {
  // Web App Executable URL dari Standalone GAS Deploy
  GAS_API_URL: "https://script.google.com/macros/s/AKfycbxB-2-_I2lhQz6hMPdMl3OEKpXXjpnmHJK6pg0N2kX9kC0PRh5_N9_ga4vkxnnrCU6hTw/exec",
  
  // ID Spreadsheet Master (Tempat Tab Dist_Mengajar) ==> DB_Administrasi_Sekolah_Master
  MASTER_SPREADSHEET_ID: "1IfRkDX_S3f2db6Pu4Oejbnr9k8CPrZlPWeVNFh9lGPM",

  // Pemetaan ID Mapel ke Spreadsheet ID Spesifik
  MAPEL_DB: {
    "mp-011": { nama: "Bahasa Arab", id: "1By3iq25nEtTmYVSLpRz9J8Npj8BChCyVMnaoJ6S6vIg" }
    // Tambahkan Mapel lainnya di sini
  }
};

// Application State
const STATE = {
  currentUser: null,
  currentMapelId: null,
  currentKelas: null,
  distribuasiMengajar: []
};
