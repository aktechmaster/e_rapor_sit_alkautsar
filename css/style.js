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

/* Format Sel Tabel Input */
.cell-input {
  width: 100%;
  height: 100%;
  text-align: center;
  background: transparent;
  outline: none;
  font-weight: 600;
  font-size: 0.75rem;
  padding: 0.35rem;
}

.cell-input:focus {
  background-color: #e0e7ff;
  box-shadow: inset 0 0 0 2px #6366f1;
}

/* Freeze Status Kolom Utama */
td.sticky-col, th.sticky-col {
  position: sticky;
  background-color: #ffffff;
  z-index: 5;
}
