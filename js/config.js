const CONFIG = {
  // Web App Executable URL dari Standalone GAS Deploy
  GAS_API_URL: "https://script.google.com/macros/s/AKfycbxB-2-_I2lhQz6hMPdMl3OEKpXXjpnmHJK6pg0N2kX9kC0PRh5_N9_ga4vkxnnrCU6hTw/exec",
  
  // ID Spreadsheet Master (Tempat Tab Dist_Mengajar & Kelas)
  MASTER_SPREADSHEET_ID: "1IfRkDX_S3f2db6Pu4Oejbnr9k8CPrZlPWeVNFh9lGPM",

  // Pemetaan ID Spreadsheet Rapor STS per Semester
  RAPOR_STS_DB: {
    1: { // STS 1 (Ganjil)
      "7A":  "1p6NsioqsTxuSFLaGyGX-A4gF33BmK7vDtsq94wmnqVQ",
      "7B":  "18XvWtyMQx2CUn1va0pBXuIvZu1upgzlvFDStElE3z8M",
      "7C":  "1uLE8R5D09F7HmG1ESKwZUfPQUORkL9ixPckH0a87pxQ",
      "8A":  "1bUpd4BTruXNEU3BG2a6c-Xczq0VoRNnpoMzb45Cbnsc",
      "8B":  "1pHYBtUHxKZua3PxW_J1lzPBoqzKo4SIT5MRMuhqDVRo",
      "8C":  "1VDvgLA4XkqXYdFR9_8KXuiccDlT8QlBOpHRhE8DCKwE",
      "9A":  "1xHiNApSQx4BaNGpz6v_jz1s3SKWiKy7TNnjsPyPTaus",
      "9B":  "1U9CJPzJtI3wv1q8Wx0RykxiUlR8DxBRgeOw_DG8X2q8",
      "9C1": "1i4woCiBeeuRaiZoMMNNduLtrlf--igod9VrCmRgkDa0",
      "9C2": "1nto0PhxX0-uTfuX3NqYntvh60SIQiANZ0313T3bbLOc"
    },
    2: { // STS 2 (Genap)
      "7A":  "",
      "7B":  "",
      "7C":  "",
      "8A":  "",
      "8B":  "",
      "8C":  "",
      "9A":  "",
      "9B":  "",
      "9C1": "",
      "9C2": ""
    }
  },

  // Pemetaan ID Mapel ke Spreadsheet ID Spesifik
  MAPEL_DB: {
    "mp-001":  { kode: "PAI",  nama: "Pendidikan Agama Islam",                id: "1RL0TOteydA_iKjG_oGu2qsdG8c7mvx8kEjVBydC5kuQ" },
    "mp-002":  { kode: "PKN",  nama: "Pendidikan Kewarganegaraan",            id: "1Rl9lH0KWBGdmW2oqFctd1jBRpHIHWmcFyv1qO54sNOY" },
    "mp-003":  { kode: "IND",  nama: "Bahasa Indonesia",                      id: "1LFlQSFpAiF6NpRK21C5x7dysllGc0Xyf_dd2UKgm80U" },
    "mp-004":  { kode: "MTK",  nama: "Matematika",                            id: "1hXh_O2UuaD4MbY7Hw8TOB8TS9SoWoy1zWxjGlgUZwyk" },
    "mp-005":  { kode: "IPA",  nama: "Ilmu Pengetahuan Alam",                 id: "1XOyiAblo--xqdSbFlpy0itWrr78-YVbr3-6kjENTd0A" },
    "mp-006":  { kode: "IPS",  nama: "Ilmu Pengetahuan Sosial",               id: "1aMoxT3MOzxqYhq1inNrXGV1ejBGH0470Mj_KsobqEZs" },
    "mp-007":  { kode: "ING",  nama: "Bahasa Inggris",                        id: "1r3NfQjRrQoyU7RJPzb0WJ36gu28S9VyMrPL2h9BlPnQ" },
    "mp-008":  { kode: "PJOK", nama: "Pendidikan Jasmani Olahraga dan Kesehatan", id: "19T0d5wYPYSJhJeTYNfj-jS1b5acFHl6cevv9zK0UM-Y" },
    "mp-009":  { kode: "TIK",  nama: "Teknologi Informasi dan Komunikasi",    id: "1JyvD9Tr1EZJq0-gjMSTAR3wLgQsRZsDRaZ2EvXK2MnA" },
    "mp-010":  { kode: "SBK",  nama: "Seni Budaya dan Keterampilan",          id: "1E3XCqh0p-0JhohccC4J3_liQmfWckUUnV6RjwBtt6Lo" },
    "mp-011":  { kode: "ARAB", nama: "Bahasa Arab",                           id: "1By3iq25nEtTmYVSLpRz9J8Npj8BChCyVMnaoJ6S6vIg" },
    "mp-012":  { kode: "T2Q",  nama: "Tahsin dan Tahfidz Qur'an",             id: "1STGtd_X41g7HyvMzaaT26KgQRi_DD-zhzsNHrUfR4QI" },
    "mp-013":  { kode: "BPI",  nama: "Bina Pribadi Islam",                    id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" },
    "mp-014":  { kode: "TJM",  nama: "Tarjim",                                id: "1lMl_7g_kD6v6k25A5VzM_pjyAnoeyGj5PfAPu3DIr0E" },
    "mp-015":  { kode: "COD",  nama: "Koding",                                id: "1tqyreofDzfM3pfCRhsh4cVbIc0YOiaJd5ZZu6rQ04iI" },
    "eks-016": { kode: "PRA",  nama: "Pramuka",                               id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" },
    "snm-017": { kode: "SNM",  nama: "Senam Kebugaran Jasmani",               id: "1eRovev0irskowR3XvoVwjPLUcDumgJKZrrmnea9djrw" }
  }
};

// Application State
const STATE = {
  currentUser: null,
  currentMapelId: null,
  currentKelas: null,
  currentStsSemester: 1, // Default ke STS 1 (Ganjil)
  distribuasiMengajar: []
};

// HELPER KONEKSI APIS GAS (Tanpa re-deklarasi LEGER_STS_CACHE)
async function callGASAPI(action, payload = {}) {
  try {
    const response = await fetch(CONFIG.GAS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload })
    });
    return await response.json();
  } catch (err) {
    console.error(`Error callGASAPI [${action}]:`, err);
    return { status: "error", message: err.message };
  }
}
