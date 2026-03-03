import { PHQ9_ITEMS, ANSWER_OPTIONS, classifySeverity } from '../data/phq9.js';
import { getState, overrideScore, subscribe, answeredCount, totalScore, openPanel } from './chatState.js';
import { initDobPicker } from '../ui/dobPicker.js';

let panelEl = null;
let hasAutoOpened = false;

export function initStructuredPanel() {
  panelEl = document.getElementById('chat-structured-panel');
  renderPanel();
  subscribe(onStateChange);
}

function onStateChange(state) {
  renderPanel();

  // Update badge on toggle button
  const badge = document.getElementById('panel-badge');
  if (badge) badge.textContent = `${answeredCount()}/9`;

  // Pulse badge on first capture
  if (answeredCount() === 1 && !badge.classList.contains('pulse-once')) {
    badge.classList.add('pulse-once');
  }

  // Toggle panel visibility
  const drawer = document.getElementById('chat-drawer');
  if (drawer) {
    drawer.classList.toggle('open', state.panelOpen);
  }

  // Auto-open when all 9 captured
  if (state.complete && !hasAutoOpened) {
    hasAutoOpened = true;
    openPanel();
  }
}

function renderPanel() {
  if (!panelEl) return;
  const state = getState();
  const count = answeredCount();
  const score = totalScore();

  // Save current patient form values before re-render (preserves manual edits)
  const savedForm = {};
  for (const id of ['chat-given-name', 'chat-family-name', 'chat-birth-date', 'chat-gender']) {
    const el = document.getElementById(id);
    if (el) savedForm[id] = el.value;
  }

  panelEl.innerHTML = `
    <div class="sp-header">
      <h3 class="sp-title">Assessment Progress</h3>
      <span class="sp-count">${count}/9</span>
    </div>

    <div class="sp-questions">
      ${PHQ9_ITEMS.map((q, i) => renderQuestion(q, i, state)).join('')}
    </div>

    ${state.complete ? renderCompletionSection(score, state) : ''}
  `;

  // Restore patient form values: prefer user-edited values, fall back to state
  const pat = state.patient;
  const defaults = {
    'chat-given-name': pat.givenName,
    'chat-family-name': pat.familyName,
    'chat-birth-date': pat.birthDate,
    'chat-gender': pat.gender,
  };
  for (const [id, stateVal] of Object.entries(defaults)) {
    const el = document.getElementById(id);
    if (!el) continue;
    const saved = savedForm[id];
    if (saved) {
      el.value = saved;
    } else if (stateVal) {
      el.value = stateVal;
    }
  }

  // Init custom DOB picker for the chat panel
  initDobPicker('chat-birth-date');

  // Attach override listeners
  panelEl.querySelectorAll('.sp-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val)) {
        overrideScore(idx, val);
      }
    });
  });
}

function renderQuestion(q, index, state) {
  const score = state.scores[index];
  const isOverridden = state.overrides.has(index);
  const isPending = score === null;

  let statusClass = 'pending';
  let badgeHtml = '';
  if (!isPending && isOverridden) {
    statusClass = 'overridden';
    badgeHtml = '<span class="sp-badge sp-badge--manual">manual</span>';
  } else if (!isPending) {
    statusClass = 'captured';
    badgeHtml = '<span class="sp-badge sp-badge--auto">auto</span>';
  }

  return `
    <div class="sp-question sp-question--${statusClass}">
      <div class="sp-question__header">
        <span class="sp-question__num">Q${index + 1}</span>
        ${badgeHtml}
      </div>
      <p class="sp-question__text">${q.text}</p>
      <select class="sp-select" data-index="${index}">
        <option value="" ${isPending ? 'selected' : ''}>--</option>
        ${ANSWER_OPTIONS.map(opt => `
          <option value="${opt.score}" ${score === opt.score ? 'selected' : ''}>
            ${opt.score} - ${opt.label}
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

function renderCompletionSection(score, state) {
  const band = classifySeverity(score);
  return `
    <div class="sp-completion">
      <div class="sp-score-display">
        <span class="sp-score-number">${score}</span>
        <span class="sp-score-max">/ 27</span>
      </div>
      <span class="severity-badge severity-badge--${band.css}">${band.severity}</span>

      <div class="sp-patient-form">
        <h4 class="sp-form-title">Patient Information</h4>
        <div class="sp-form-field">
          <label for="chat-given-name">First Name</label>
          <input type="text" id="chat-given-name" placeholder="Jane" autocomplete="given-name">
        </div>
        <div class="sp-form-field">
          <label for="chat-family-name">Last Name</label>
          <input type="text" id="chat-family-name" placeholder="Doe" autocomplete="family-name">
        </div>
        <div class="sp-form-field">
          <label for="chat-birth-date">Date of Birth</label>
          <input type="hidden" id="chat-birth-date">
        </div>
        <div class="sp-form-field">
          <label for="chat-gender">Gender</label>
          <select id="chat-gender">
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      <button class="btn btn--primary sp-submit-btn" id="chat-submit-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Submit &amp; Store in FHIR
      </button>
    </div>
  `;
}
