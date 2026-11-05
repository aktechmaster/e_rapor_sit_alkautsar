// Fungsi Pembantu Tampilan Loading
function showGlobalLoading(message = "Memproses data...") {
  const loadingEl = document.getElementById('global-loading');
  const textEl = document.getElementById('loading-text');
  if (textEl) textEl.innerText = message;
  if (loadingEl) loadingEl.classList.remove('hidden');
}

function hideGlobalLoading() {
  const loadingEl = document.getElementById('global-loading');
  if (loadingEl) loadingEl.classList.add('hidden');
}

async function callGASAPI(action, payload = {}, showLoading = true) {
  if (showLoading) showGlobalLoading();

  const fullPayload = {
    action: action,
    masterSpreadsheetId: CONFIG.MASTER_SPREADSHEET_ID,
    ...payload
  };

  try {
    const response = await fetch(CONFIG.GAS_API_URL, {
      method: "POST",
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
  } finally {
    if (showLoading) hideGlobalLoading();
  }
}
