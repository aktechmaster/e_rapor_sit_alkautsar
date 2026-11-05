/* Custom Scrollbar Tabel */
.table-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

/* Perbaikan Tata Letak Navigasi Sidebar */
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
   HAPUS PANAH SPINNER ANGKA BAWAAN BROWSER
   ==================================================== */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
input[type=number] {
  -moz-appearance: textfield;
}

/* ====================================================
   FORMAT SEL TABEL INPUT (PROFESIONAL SPREADSHEET UI)
   ==================================================== */
.cell-input, .sumatif-input {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 38px;
  border: none;
  outline: none;
  background: transparent;
  text-align: center;
  font-weight: 600;
  font-size: 0.8125rem;
  color: #1e293b;
  padding: 0 4px;
  margin: 0;
  box-sizing: border-box;
  transition: background-color 0.15s ease;
}

.cell-input:hover, .sumatif-input:hover {
  background-color: #f8fafc;
}

/* Efek Sorot Sel Saat Fokus (Sama Persis Seperti Google Sheets / Excel) */
.cell-input:focus, .sumatif-input:focus {
  background-color: #ffffff;
  box-shadow: inset 0 0 0 2px #4f46e5;
  outline: none;
  z-index: 2;
}

/* Freeze / Sticky Column Styling */
td.sticky-col, th.sticky-col {
  position: sticky;
  background-color: #ffffff;
  z-index: 5;
}

th.sticky-col {
  background-color: #f1f5f9 !important;
}
