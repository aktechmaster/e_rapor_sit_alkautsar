async function callGASAPI(action, payload = {}) {
  const fullPayload = {
    action: action,
    masterSpreadsheetId: CONFIG.MASTER_SPREADSHEET_ID,
    ...payload
  };

  try {
    const response = await fetch(CONFIG.GAS_API_URL, {
      method: "POST",
      // Menggunakan text/plain agar tidak memicu CORS Preflight pada GAS
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(fullPayload)
    });

    const result = await response.json();
    if (result.status === "error") {
      throw new Error(result.message);
    }
    return result;
  } catch (err) {
    console.error("API Error:", err);
    alert("Gagal terhubung ke Server Backend: " + err.message);
    return null;
  }
}
