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

// ====================================================
// MESIN GRID SPREADSHEET UNIVERSAL (BLOK, DELETE, PASTE)
// ====================================================
function attachSpreadsheetGrid(options) {
  const {
    tbody,
    totalRows,
    totalCols,
    onCellChange
  } = options;

  if (!tbody) return;

  // Hentikan listener lama jika tabel dirender ulang
  if (typeof tbody._gridAbortController?.abort === "function") {
    tbody._gridAbortController.abort();
  }
  const controller = new AbortController();
  const { signal } = controller;
  tbody._gridAbortController = controller;

  let isDragging = false;
  let dragMovedOut = false;
  let anchor = null;     // { r, c }
  let focusPos = null;   // { r, c }
  let selRange = null;   // { r1, c1, r2, c2 }

  const SEL_CLASSES = ["ring-2", "ring-inset", "ring-blue-500", "!bg-blue-100"];

  function getCell(r, c) {
    return tbody.querySelector(`input[data-grid-cell="1"][data-vrow="${r}"][data-gcol="${c}"]`);
  }

  function hasMultiSelection() {
    return Boolean(
      selRange &&
      (selRange.r1 !== selRange.r2 || selRange.c1 !== selRange.c2)
    );
  }

  function updateSelectionVisuals() {
    const allCells = tbody.querySelectorAll('input[data-grid-cell="1"]');
    allCells.forEach(inp => inp.classList.remove(...SEL_CLASSES));

    if (!selRange) return;
    const isMulti = hasMultiSelection();

    for (let r = selRange.r1; r <= selRange.r2; r++) {
      for (let c = selRange.c1; c <= selRange.c2; c++) {
        const cell = getCell(r, c);
        if (cell && isMulti) {
          cell.classList.add(...SEL_CLASSES);
        }
      }
    }
  }

  function setSelection(rA, cA, rB, cB) {
    selRange = {
      r1: Math.min(rA, rB),
      c1: Math.min(cA, cB),
      r2: Math.max(rA, rB),
      c2: Math.max(cA, cB)
    };
    updateSelectionVisuals();
  }

  function clearSelection() {
    selRange = null;
    updateSelectionVisuals();
  }

  function sanitizeValueByType(rawVal, ctype, isDeleteAction = false) {
    const str = String(rawVal ?? "");
    if (ctype === "num") {
      const digits = str.replace(/[^0-9]/g, "");
      if (isDeleteAction) return "0";
      return digits;
    }
    if (ctype === "grade") {
      return str.trim().toUpperCase().slice(0, 3);
    }
    return str.trim();
  }

  // 1. KLIK 1X UNTUK EDIT & TAHAN KLIK GESER UNTUK BLOK MULTI-SEL
  tbody.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    const input = e.target.closest('input[data-grid-cell="1"]');
    if (!input) {
      clearSelection();
      return;
    }

    const r = Number(input.dataset.vrow);
    const c = Number(input.dataset.gcol);
    isDragging = true;
    dragMovedOut = false;
    anchor = { r, c };
    focusPos = { r, c };
    setSelection(r, c, r, c);
  }, { signal });

  tbody.addEventListener("mousemove", (e) => {
    if (!isDragging || !anchor) return;
    const input = e.target.closest('input[data-grid-cell="1"]');
    if (!input) return;

    const r = Number(input.dataset.vrow);
    const c = Number(input.dataset.gcol);

    if (r !== anchor.r || c !== anchor.c) {
      dragMovedOut = true;
    }

    if (dragMovedOut) {
      e.preventDefault();
      window.getSelection()?.removeAllRanges();
      focusPos = { r, c };
      setSelection(anchor.r, anchor.c, r, c);
    }
  }, { signal });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    if (dragMovedOut && anchor) {
      const anchorInput = getCell(anchor.r, anchor.c);
      if (anchorInput) {
        anchorInput.focus({ preventScroll: true });
      }
    }
  }, { signal });

  // 2. INPUT LANGSUNG PADA SEL TUNGGAL
  tbody.addEventListener("input", (e) => {
    const input = e.target;
    if (!input.matches('input[data-grid-cell="1"]')) return;

    const ctype = input.dataset.ctype;
    if (ctype === "grade") {
      input.value = input.value.toUpperCase();
    } else if (ctype === "num") {
      input.value = input.value.replace(/[^0-9]/g, "");
    }

    if (typeof onCellChange === "function") {
      onCellChange(input, input.value);
    }
  }, { signal });

  // 3. NAVIGASI PANAH, SHIFT+PANAH BLOK, & HAPUS MASSAL (DELETE / BACKSPACE)
  tbody.addEventListener("keydown", (e) => {
    const input = e.target;
    if (!input.matches('input[data-grid-cell="1"]')) return;

    const vRow = Number(input.dataset.vrow);
    const gCol = Number(input.dataset.gcol);
    const ctype = input.dataset.ctype;

    if (!anchor) anchor = { r: vRow, c: gCol };
    if (!focusPos) focusPos = { r: vRow, c: gCol };

    // A. Hapus Massal jika lebih dari 1 sel sedang terblok
    if ((e.key === "Delete" || e.key === "Backspace") && hasMultiSelection()) {
      e.preventDefault();
      for (let r = selRange.r1; r <= selRange.r2; r++) {
        for (let c = selRange.c1; c <= selRange.c2; c++) {
          const cell = getCell(r, c);
          if (cell) {
            const clearedVal = sanitizeValueByType("", cell.dataset.ctype, true);
            cell.value = clearedVal;
            if (typeof onCellChange === "function") {
              onCellChange(cell, clearedVal);
            }
          }
        }
      }
      return;
    }

    // B. Batal blok dengan Escape
    if (e.key === "Escape" && hasMultiSelection()) {
      e.preventDefault();
      anchor = { r: vRow, c: gCol };
      focusPos = { r: vRow, c: gCol };
      setSelection(vRow, gCol, vRow, gCol);
      return;
    }

    // C. Perluas blok dengan Shift + Panah
    if (e.shiftKey && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      let nextR = focusPos.r;
      let nextC = focusPos.c;
      if (e.key === "ArrowUp" && nextR > 0) nextR--;
      if (e.key === "ArrowDown" && nextR < totalRows - 1) nextR++;
      if (e.key === "ArrowLeft" && nextC > 0) nextC--;
      if (e.key === "ArrowRight" && nextC < totalCols - 1) nextC++;

      focusPos = { r: nextR, c: nextC };
      setSelection(anchor.r, anchor.c, nextR, nextC);
      return;
    }

    // D. Navigasi Panah Normal & Enter
    let targetRow = vRow;
    let targetCol = gCol;
    let shouldMove = false;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (vRow > 0) {
        targetRow = vRow - 1;
        shouldMove = true;
      }
    } else if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      if (vRow < totalRows - 1) {
        targetRow = vRow + 1;
        shouldMove = true;
      }
    } else if (e.key === "ArrowLeft") {
      const atStartOrAllSelected =
        ctype !== "text" ||
        (input.selectionStart === 0 && input.selectionEnd === 0) ||
        (input.selectionStart === 0 && input.selectionEnd === input.value.length);

      if (atStartOrAllSelected) {
        e.preventDefault();
        if (gCol > 0) {
          targetCol = gCol - 1;
          shouldMove = true;
        } else if (vRow > 0) {
          targetRow = vRow - 1;
          targetCol = totalCols - 1;
          shouldMove = true;
        }
      }
    } else if (e.key === "ArrowRight") {
      const len = input.value.length;
      const atEndOrAllSelected =
        ctype !== "text" ||
        (input.selectionStart === len && input.selectionEnd === len) ||
        (input.selectionStart === 0 && input.selectionEnd === len);

      if (atEndOrAllSelected) {
        e.preventDefault();
        if (gCol < totalCols - 1) {
          targetCol = gCol + 1;
          shouldMove = true;
        } else if (vRow < totalRows - 1) {
          targetRow = vRow + 1;
          targetCol = 0;
          shouldMove = true;
        }
      }
    }

    if (shouldMove) {
      const nextInput = getCell(targetRow, targetCol);
      if (nextInput) {
        anchor = { r: targetRow, c: targetCol };
        focusPos = { r: targetRow, c: targetCol };
        setSelection(targetRow, targetCol, targetRow, targetCol);
        nextInput.focus();
        nextInput.select();
      }
    }
  }, { signal });

  // 4. COPY BLOK SEL KE EXCEL / CLIPBOARD (Ctrl + C)
  tbody.addEventListener("copy", (e) => {
    if (!hasMultiSelection()) return;
    e.preventDefault();

    const lines = [];
    for (let r = selRange.r1; r <= selRange.r2; r++) {
      const rowVals = [];
      for (let c = selRange.c1; c <= selRange.c2; c++) {
        const cell = getCell(r, c);
        rowVals.push(cell ? cell.value : "");
      }
      lines.push(rowVals.join("\t"));
    }

    if (e.clipboardData) {
      e.clipboardData.setData("text/plain", lines.join("\n"));
    }
  }, { signal });

  // 5. PASTE DARI EXCEL / GOOGLE SHEETS (Ctrl + V)
  tbody.addEventListener("paste", (e) => {
    const input = e.target;
    if (!input.matches('input[data-grid-cell="1"]')) return;

    const rawClip = e.clipboardData?.getData("text/plain");
    if (!rawClip) return;

    const cleanClip = rawClip.replace(/\r?\n$/, "");
    const matrix = cleanClip.split(/\r?\n/).map(line => line.split("\t"));

    // Jika hanya 1 sel teks biasa tanpa tab/baris baru pada kolom teks, biarkan paste teks normal
    if (matrix.length === 1 && matrix[0].length === 1 && input.dataset.ctype === "text") {
      return;
    }

    e.preventDefault();

    const startR = selRange ? selRange.r1 : Number(input.dataset.vrow);
    const startC = selRange ? selRange.c1 : Number(input.dataset.gcol);

    let maxFilledR = startR;
    let maxFilledC = startC;

    matrix.forEach((rowArr, rOffset) => {
      const targetR = startR + rOffset;
      if (targetR >= totalRows) return;

      rowArr.forEach((cellVal, cOffset) => {
        const targetC = startC + cOffset;
        if (targetC >= totalCols) return;

        const targetInput = getCell(targetR, targetC);
        if (!targetInput) return;

        const ctype = targetInput.dataset.ctype;
        let formatted = sanitizeValueByType(cellVal, ctype, false);
        if (ctype === "num" && formatted === "") {
          formatted = "0";
        }

        targetInput.value = formatted;
        if (typeof onCellChange === "function") {
          onCellChange(targetInput, formatted);
        }

        if (targetR > maxFilledR) maxFilledR = targetR;
        if (targetC > maxFilledC) maxFilledC = targetC;
      });
    });

    anchor = { r: startR, c: startC };
    focusPos = { r: maxFilledR, c: maxFilledC };
    setSelection(startR, startC, maxFilledR, maxFilledC);
  }, { signal });
}
