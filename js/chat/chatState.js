const listeners = new Set();

const state = {
  scores: Array(9).fill(null),
  overrides: new Set(),
  messages: [],
  panelOpen: false,
  complete: false,
  patient: { givenName: '', familyName: '', birthDate: '', gender: '' },
};

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  state.complete = state.scores.every(s => s !== null);
  for (const fn of listeners) fn(state);
}

export function setScore(index, score, fromTool = false) {
  if (index < 0 || index > 8) return;
  if (fromTool && state.overrides.has(index)) return; // respect manual overrides
  state.scores[index] = score;
  notify();
}

export function overrideScore(index, score) {
  state.scores[index] = score;
  state.overrides.add(index);
  notify();
}

export function clearOverride(index) {
  state.overrides.delete(index);
  notify();
}

export function addMessage(role, text) {
  state.messages.push({ role, text, ts: Date.now() });
  notify();
}

export function togglePanel() {
  state.panelOpen = !state.panelOpen;
  notify();
}

export function setPatientInfo(info) {
  Object.assign(state.patient, info);
  notify();
}

export function openPanel() {
  state.panelOpen = true;
  notify();
}

export function answeredCount() {
  return state.scores.filter(s => s !== null).length;
}

export function totalScore() {
  return state.scores.reduce((sum, s) => sum + (s ?? 0), 0);
}
