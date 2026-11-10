// ====================================================
// UI HELPERS & SPREADSHEET NAVIGATIONAL UTILITIES
// ====================================================
function attachTableKeyboardNav(tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  // Hindari pendaftaran event listener ganda
  if (tbody._hasKeyboardNav) return;
  tbody._hasKeyboardNav = true;

  tbody.addEventListener('keydown', (e) => {
    const input = e.target;
    if (!input || input.tagName !== 'INPUT') return;
    if (!input.classList.contains('cell-input') && !input.classList.contains('sumatif-input')) return;

    const td = input.closest('td');
    if (!td) return;
    const tr = td.closest('tr');
    if (!tr) return;

    const cellIndex = td.cellIndex;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const rowIndex = rows.indexOf(tr);

    // Mencegah perilaku bawaan browser pada input type="number" (mengubah nilai angka)
    if (['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
      e.preventDefault();
    }

    // Panah Atas -> Pindah ke sel atasnya
    if (e.key === 'ArrowUp' && rowIndex > 0) {
      const targetInput = rows[rowIndex - 1]?.children[cellIndex]?.querySelector('input');
      if (targetInput) {
        targetInput.focus();
        targetInput.select();
      }
    } 
    // Panah Bawah / Enter -> Pindah ke sel bawahnya
    else if ((e.key === 'ArrowDown' || e.key === 'Enter') && rowIndex < rows.length - 1) {
      const targetInput = rows[rowIndex + 1]?.children[cellIndex]?.querySelector('input');
      if (targetInput) {
        targetInput.focus();
        targetInput.select();
      }
    } 
    // Panah Kiri -> Pindah ke sel kirinya (aman untuk input type="number")
    else if (e.key === 'ArrowLeft') {
      let isAtStart = true;
      try {
        if (input.type !== 'number' && input.selectionStart !== null) {
          isAtStart = (input.selectionStart === 0);
        }
      } catch (err) {
        isAtStart = true;
      }
      if (isAtStart) {
        let prevTd = td.previousElementSibling;
        while (prevTd && !prevTd.querySelector('input')) {
          prevTd = prevTd.previousElementSibling;
        }
        const targetInput = prevTd?.querySelector('input');
        if (targetInput) {
          e.preventDefault();
          targetInput.focus();
          targetInput.select();
        }
      }
    } 
    // Panah Kanan -> Pindah ke sel kanannya (aman untuk input type="number")
    else if (e.key === 'ArrowRight') {
      let isAtEnd = true;
      try {
        if (input.type !== 'number' && input.selectionEnd !== null) {
          isAtEnd = (input.selectionEnd === input.value.length);
        }
      } catch (err) {
        isAtEnd = true;
      }
      if (isAtEnd) {
        let nextTd = td.nextElementSibling;
        while (nextTd && !nextTd.querySelector('input')) {
          nextTd = nextTd.nextElementSibling;
        }
        const targetInput = nextTd?.querySelector('input');
        if (targetInput) {
          e.preventDefault();
          targetInput.focus();
          targetInput.select();
        }
      }
    }
  });

  // Mencegah scroll wheel mouse mengubah nilai angka saat hover/focus
  tbody.addEventListener('wheel', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type === 'number') {
      e.target.blur();
    }
  }, { passive: true });

  tbody.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'INPUT') {
      e.target.select();
    }
  });
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (!sidebar) return;
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    sidebar.classList.toggle('-translate-x-full');
    if (overlay) overlay.classList.toggle('hidden');
  } else {
    sidebar.classList.toggle('hidden');
  }
}
