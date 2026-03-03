import { PHQ9_ITEMS, ANSWER_OPTIONS } from '../data/phq9.js';

export function renderQuestions() {
  const container = document.getElementById('questions-container');
  container.innerHTML = '';

  PHQ9_ITEMS.forEach((item, qIdx) => {
    const div = document.createElement('div');
    div.className = 'q-item';
    div.id = `q-item-${qIdx}`;

    div.innerHTML = `
      <div class="q-item__number">Question ${qIdx + 1} of 9 \u00b7 ${item.linkId}</div>
      <div class="q-item__text">${item.text}</div>
      <div class="q-options">
        ${ANSWER_OPTIONS.map(opt => `
          <label class="q-option">
            <input type="radio" name="q${qIdx}" value="${opt.score}" data-q="${qIdx}">
            <div class="q-option__label">
              <span class="q-option__score">${opt.score}</span>
              ${opt.label}
            </div>
          </label>
        `).join('')}
      </div>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', onAnswerChange);
  });
}

function onAnswerChange(e) {
  const qIdx = parseInt(e.target.dataset.q);
  document.getElementById(`q-item-${qIdx}`).classList.add('answered');
  updateProgress();
}

export function getAnswers() {
  const answers = [];
  for (let i = 0; i < 9; i++) {
    const checked = document.querySelector(`input[name="q${i}"]:checked`);
    answers.push(checked ? parseInt(checked.value) : null);
  }
  return answers;
}

export function updateProgress() {
  const answers = getAnswers();
  const answered = answers.filter(a => a !== null).length;
  const total = answers.reduce((s, v) => s + (v || 0), 0);
  const pct = Math.round((answered / 9) * 100);

  document.getElementById('progress-text').textContent = `${answered} of 9 answered`;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  document.getElementById('running-total').textContent = total;
  document.getElementById('btn-submit').disabled = answered < 9;
}
