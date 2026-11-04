/* Styling Navigasi */
.menu-item {
  display: flex;
  align-items: center;
  padding: 0.625rem 1rem;
  color: #94a3b8;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background-color: #1e293b;
  color: #ffffff;
}

.menu-item.active {
  background-color: #4f46e5;
  color: #ffffff;
}

/* Format Tabel Nilai */
.table-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

/* Sel Input Nilai */
.cell-input {
  width: 100%;
  height: 100%;
  text-align: center;
  background: transparent;
  outline: none;
  font-weight: 600;
  font-size: 0.75rem;
  padding: 0.25rem;
}

.cell-input:focus {
  background-color: #e0e7ff;
  box-shadow: inset 0 0 0 2px #6366f1;
}

/* Freeze First Columns */
td.sticky-col, th.sticky-col {
  position: sticky;
  background-color: #ffffff;
  z-index: 5;
}
