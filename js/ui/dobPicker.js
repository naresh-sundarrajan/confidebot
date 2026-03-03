/* ================================================================
   Custom DOB Picker
   Replaces native <input type="date"> with a calendar dropdown
   that includes a "Done" button on the month/year selector.
   ================================================================ */

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const instances = new Map();

const currentYear = new Date().getFullYear();
const MIN_YEAR = currentYear - 120;
const MAX_YEAR = currentYear;

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

/**
 * Wrap a hidden <input> with the custom DOB picker UI.
 * Idempotent — safe to call repeatedly for the same id.
 */
export function initDobPicker(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Tear down previous instance if re-rendered (innerHTML rebuild in structuredPanel)
  if (instances.has(inputId)) {
    const prev = instances.get(inputId);
    prev.teardown();
    instances.delete(inputId);
  }

  const inst = createInstance(input);
  instances.set(inputId, inst);
}

/**
 * Reset a DOB picker to its empty/placeholder state.
 */
export function resetDobPicker(inputId) {
  const inst = instances.get(inputId);
  if (inst) inst.reset();
}

// ----------------------------------------------------------------
// Instance factory
// ----------------------------------------------------------------

function createInstance(input) {
  const today = new Date();

  // State
  let viewMonth = today.getMonth();
  let viewYear = today.getFullYear();
  let pendingMonth = viewMonth;
  let pendingYear = viewYear;
  let selectedDate = input.value ? parseYMD(input.value) : null;
  let mode = 'day'; // 'day' | 'monthYear'
  let isOpen = false;
  let longPressTimer = null;
  let longPressInterval = null;

  // If we have a pre-existing value, start the view there
  if (selectedDate) {
    viewMonth = selectedDate.getMonth();
    viewYear = selectedDate.getFullYear();
  }

  // ---- Build DOM ----
  const wrapper = document.createElement('div');
  wrapper.className = 'dob-picker';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'dob-picker__trigger dob-picker__trigger--placeholder';
  trigger.innerHTML = calendarIcon() + '<span class="dob-picker__trigger-text">Select date</span>';

  const backdrop = document.createElement('div');
  backdrop.className = 'dob-picker__backdrop';

  const dropdown = document.createElement('div');
  dropdown.className = 'dob-picker__dropdown';

  wrapper.appendChild(trigger);
  wrapper.appendChild(backdrop);
  wrapper.appendChild(dropdown);

  // Insert wrapper after the hidden input
  input.parentNode.insertBefore(wrapper, input.nextSibling);

  // If there's a pre-set value, display it
  if (selectedDate) updateTriggerText();

  // ---- Render helpers ----

  function render() {
    if (mode === 'day') renderDayView();
    else renderMonthYearView();
  }

  function renderDayView() {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    let daysHtml = '';

    // Empty cells before the 1st
    for (let i = 0; i < firstDay; i++) {
      daysHtml += '<span class="dob-picker__day dob-picker__day--outside"></span>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(viewYear, viewMonth, d);
      const isFuture = dateObj > today;
      const isSelected = selectedDate &&
        selectedDate.getFullYear() === viewYear &&
        selectedDate.getMonth() === viewMonth &&
        selectedDate.getDate() === d;
      const isToday = d === today.getDate() &&
        viewMonth === today.getMonth() &&
        viewYear === today.getFullYear();

      let cls = 'dob-picker__day';
      if (isSelected) cls += ' dob-picker__day--selected';
      else if (isToday) cls += ' dob-picker__day--today';

      daysHtml += `<button type="button" class="${cls}" data-day="${d}"${isFuture ? ' disabled' : ''}>${d}</button>`;
    }

    dropdown.innerHTML = `
      <div class="dob-picker__day-view">
        <div class="dob-picker__nav">
          <button type="button" class="dob-picker__nav-btn" data-action="prev-month" aria-label="Previous month">&lsaquo;</button>
          <button type="button" class="dob-picker__nav-title" data-action="open-my">${MONTH_NAMES[viewMonth]} ${viewYear}</button>
          <button type="button" class="dob-picker__nav-btn" data-action="next-month" aria-label="Next month">&rsaquo;</button>
        </div>
        <div class="dob-picker__weekdays">
          ${WEEKDAYS.map(w => `<span class="dob-picker__weekday">${w}</span>`).join('')}
        </div>
        <div class="dob-picker__days">${daysHtml}</div>
      </div>
    `;

    attachDayViewListeners();
  }

  function renderMonthYearView() {
    const monthsHtml = MONTH_SHORT.map((m, i) => {
      const sel = i === pendingMonth ? ' dob-picker__month--selected' : '';
      return `<button type="button" class="dob-picker__month${sel}" data-month="${i}">${m}</button>`;
    }).join('');

    dropdown.innerHTML = `
      <div class="dob-picker__my-view open">
        <div class="dob-picker__year-nav">
          <button type="button" class="dob-picker__nav-btn" data-action="prev-year" aria-label="Previous year">&lsaquo;</button>
          <span class="dob-picker__year-label">${pendingYear}</span>
          <button type="button" class="dob-picker__nav-btn" data-action="next-year" aria-label="Next year">&rsaquo;</button>
        </div>
        <div class="dob-picker__months">${monthsHtml}</div>
        <div class="dob-picker__actions">
          <button type="button" class="btn btn--outline btn--sm" data-action="my-cancel">Cancel</button>
          <button type="button" class="btn btn--primary btn--sm" data-action="my-done">Done</button>
        </div>
      </div>
    `;

    attachMonthYearListeners();
  }

  // ---- Day-view event wiring ----

  function attachDayViewListeners() {
    dropdown.querySelector('[data-action="prev-month"]').addEventListener('click', () => {
      stepMonth(-1);
    });
    dropdown.querySelector('[data-action="next-month"]').addEventListener('click', () => {
      stepMonth(1);
    });
    dropdown.querySelector('[data-action="open-my"]').addEventListener('click', () => {
      pendingMonth = viewMonth;
      pendingYear = viewYear;
      mode = 'monthYear';
      render();
    });
    dropdown.querySelectorAll('.dob-picker__day[data-day]').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = parseInt(btn.dataset.day, 10);
        selectedDate = new Date(viewYear, viewMonth, d);
        input.value = formatYMD(selectedDate);
        input.dispatchEvent(new Event('change', { bubbles: true }));
        updateTriggerText();
        close();
      });
    });
  }

  // ---- Month/Year-view event wiring ----

  function attachMonthYearListeners() {
    const prevBtn = dropdown.querySelector('[data-action="prev-year"]');
    const nextBtn = dropdown.querySelector('[data-action="next-year"]');

    // Click
    prevBtn.addEventListener('click', () => stepPendingYear(-1));
    nextBtn.addEventListener('click', () => stepPendingYear(1));

    // Long-press acceleration
    setupLongPress(prevBtn, () => stepPendingYear(-1));
    setupLongPress(nextBtn, () => stepPendingYear(1));

    dropdown.querySelectorAll('.dob-picker__month').forEach(btn => {
      btn.addEventListener('click', () => {
        pendingMonth = parseInt(btn.dataset.month, 10);
        // Re-render to update highlight
        renderMonthYearView();
      });
    });

    dropdown.querySelector('[data-action="my-cancel"]').addEventListener('click', () => {
      mode = 'day';
      render();
    });

    dropdown.querySelector('[data-action="my-done"]').addEventListener('click', () => {
      viewMonth = pendingMonth;
      viewYear = pendingYear;
      mode = 'day';
      render();
    });
  }

  // ---- Long-press helpers ----

  function setupLongPress(btn, action) {
    function start(e) {
      e.preventDefault();
      longPressTimer = setTimeout(() => {
        longPressInterval = setInterval(action, 80);
      }, 400);
    }
    function stop() {
      clearTimeout(longPressTimer);
      clearInterval(longPressInterval);
      longPressTimer = null;
      longPressInterval = null;
    }
    btn.addEventListener('mousedown', start);
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);
    btn.addEventListener('touchend', stop);
    btn.addEventListener('touchcancel', stop);
  }

  // ---- Navigation helpers ----

  function stepMonth(delta) {
    viewMonth += delta;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    else if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    viewYear = clampYear(viewYear);
    render();
  }

  function stepPendingYear(delta) {
    pendingYear = clampYear(pendingYear + delta);
    renderMonthYearView();
  }

  function clampYear(y) {
    return Math.max(MIN_YEAR, Math.min(MAX_YEAR, y));
  }

  // ---- Open / Close ----

  function open() {
    if (isOpen) return;
    isOpen = true;
    mode = 'day';
    // If a date is already selected, show that month
    if (selectedDate) {
      viewMonth = selectedDate.getMonth();
      viewYear = selectedDate.getFullYear();
    }
    render();
    dropdown.classList.add('open');
    backdrop.classList.add('open');
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    dropdown.classList.remove('open');
    backdrop.classList.remove('open');
    clearTimeout(longPressTimer);
    clearInterval(longPressInterval);
  }

  // ---- Display helpers ----

  function updateTriggerText() {
    const span = trigger.querySelector('.dob-picker__trigger-text');
    if (selectedDate) {
      span.textContent = formatDisplay(selectedDate);
      trigger.classList.remove('dob-picker__trigger--placeholder');
    } else {
      span.textContent = 'Select date';
      trigger.classList.add('dob-picker__trigger--placeholder');
    }
  }

  // ---- Global listeners ----

  function onDocumentClick(e) {
    if (!isOpen) return;
    if (wrapper.contains(e.target)) return;
    close();
  }

  function onKeydown(e) {
    if (e.key === 'Escape' && isOpen) {
      e.stopPropagation();
      close();
    }
  }

  trigger.addEventListener('click', () => {
    if (isOpen) close();
    else open();
  });

  backdrop.addEventListener('click', close);

  document.addEventListener('click', onDocumentClick, true);
  document.addEventListener('keydown', onKeydown);

  // ---- Teardown (for re-init after innerHTML rebuild) ----

  function teardown() {
    document.removeEventListener('click', onDocumentClick, true);
    document.removeEventListener('keydown', onKeydown);
    clearTimeout(longPressTimer);
    clearInterval(longPressInterval);
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
  }

  // ---- Reset ----

  function reset() {
    selectedDate = null;
    input.value = '';
    viewMonth = today.getMonth();
    viewYear = today.getFullYear();
    updateTriggerText();
    close();
  }

  return { teardown, reset };
}

// ----------------------------------------------------------------
// Utility functions
// ----------------------------------------------------------------

function formatYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseYMD(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplay(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function calendarIcon() {
  return `<svg class="dob-picker__trigger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
}
