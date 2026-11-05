const CONFIG = {
  // Web App Executable URL dari Standalone GAS Deploy
  GAS_API_URL: "https://script.google.com/macros/s/AKfycbxB-2-_I2lhQz6hMPdMl3OEKpXXjpnmHJK6pg0N2kX9kC0PRh5_N9_ga4vkxnnrCU6hTw/exec",
  
  // ID Spreadsheet Master (Tempat Tab Dist_Mengajar) ==> DB_Administrasi_Sekolah_Master
  MASTER_SPREADSHEET_ID: "1IfRkDX_S3f2db6Pu4Oejbnr9k8CPrZlPWeVNFh9lGPM",

  // Pemetaan ID Mapel ke Spreadsheet ID Spesifik
  MAPEL_DB: {
    "mp-001":  { kode: "PAI",  nama: "Pendidikan Agama Islam",                id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" },
    "mp-002":  { kode: "PKN",  nama: "Pendidikan Kewarganegaraan",            id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" },
    "mp-003":  { kode: "IND",  nama: "Bahasa Indonesia",                      id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" },
    "mp-004":  { kode: "MTK",  nama: "Matematika",                            id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" },
    "mp-005":  { kode: "IPA",  nama: "Ilmu Pengetahuan Alam",                 id: "1XOyiAblo--xqdSbFlpy0itWrr78-YVbr3-6kjENTd0A" },
    "mp-006":  { kode: "IPS",  nama: "Ilmu Pengetahuan Sosial",               id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" },
    "mp-007":  { kode: "ING",  nama: "Bahasa Inggris",                        id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" },
    "mp-008":  { kode: "PJOK", nama: "Pendidikan Jasmani Olahraga dan Kesehatan", id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" },
    "mp-009":  { kode: "TIK",  nama: "Teknologi Informasi dan Komunikasi",    id: "1JyvD9Tr1EZJq0-gjMSTAR3wLgQsRZsDRaZ2EvXK2MnA" },
    "mp-010":  { kode: "SBK",  nama: "Seni Budaya dan Keterampilan",          id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" },
    "mp-011":  { kode: "ARAB", nama: "Bahasa Arab",                           id: "1By3iq25nEtTmYVSLpRz9J8Npj8BChCyVMnaoJ6S6vIg" },
    "mp-012":  { kode: "T2Q",  nama: "Tahsin dan Tahfidz Qur'an",             id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" },
    "mp-013":  { kode: "BPI",  nama: "Bina Pribadi Islam",                    id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" },
    "mp-014":  { kode: "TJM",  nama: "Tarjim",                                id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" },
    "mp-015":  { kode: "COD",  nama: "Koding",                                id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" },
    "eks-016": { kode: "PRA",  nama: "Pramuka",                               id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" },
    "snm-017": { kode: "SNM",  nama: "Senam Kebugaran Jasmani",               id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" }
  }
};

// Application State
const STATE = {
  currentUser: null,
  currentMapelId: null,
  currentKelas: null,
  distribuasiMengajar: []
};
