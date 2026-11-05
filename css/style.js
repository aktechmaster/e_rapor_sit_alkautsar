/* Custom Scrollbar Tabel */
.table-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

/* Navigasi Sidebar */
nav {
  display: flex !important;
  flex-direction: column !important;
  gap: 0.5rem !important;
}

.menu-item {
  display: flex !important;
  align-items: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  gap: 0.75rem !important;
  padding: 0.75rem 1rem !important;
  color: #94a3b8 !important;
  font-size: 0.875rem !important;
  font-weight: 500 !important;
  border-radius: 0.5rem !important;
  transition: all 0.2s ease !important;
  text-decoration: none !important;
  white-space: nowrap !important;
}

.menu-item:hover {
  background-color: #1e293b !important;
  color: #ffffff !important;
}

.menu-item.active {
  background-color: #4f46e5 !important;
  color: #ffffff !important;
}

/* ====================================================
   PAKSA HAPUS SPINNER ANGKA CHROMIUM & FIREFOX
   ==================================================== */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none !important; 
  margin: 0 !important; 
}
input[type=number] {
  -moz-appearance: textfield !important;
}

/* ====================================================
   FORMAT INPUT SEL TABEL SPREADSHEET (FULL BLEED 100%)
   ==================================================== */
.cell-input, .sumatif-input {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  min-height: 36px !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
  text-align: center !important;
  font-weight: 600 !important;
  font-size: 0.8125rem !important;
  color: #1e293b !important;
  padding: 0 !important;
  margin: 0 !important;
  box-sizing: border-box !important;
  border-radius: 0 !important;
  appearance: none !important;
}

.cell-input:hover, .sumatif-input:hover {
  background-color: #f1f5f9 !important;
}

/* FOKUS SEL SEPERTI GOOGLE SHEETS / EXCEL */
.cell-input:focus, .sumatif-input:focus {
  background-color: #ffffff !important;
  box-shadow: inset 0 0 0 2px #4f46e5 !important;
  outline: none !important;
  border: none !important;
}

/* STICKY COLUMN STYLING */
td.sticky-col, th.sticky-col {
  position: sticky !important;
  background-color: #ffffff !important;
  z-index: 5 !important;
}

th.sticky-col {
  background-color: #f1f5f9 !important;
}
