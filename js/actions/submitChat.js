import { getState, totalScore } from '../chat/chatState.js';
import { saveResource } from '../db/indexedDb.js';
import {
  buildQuestionnaire, buildPatient, buildQuestionnaireResponse,
  buildRiskAssessment, buildObservations
} from '../fhir/builders.js';
import { classifySeverity } from '../data/phq9.js';
import { showToast } from '../utils/toast.js';
import { showResultModal } from '../ui/modal.js';

export async function submitChatAssessment() {
  const state = getState();

  if (!state.complete) {
    showToast('Please complete all 9 questions first.', 'error');
    return;
  }

  const pat = state.patient;
  const givenName  = document.getElementById('chat-given-name')?.value.trim() || pat.givenName || 'Anonymous';
  const familyName = document.getElementById('chat-family-name')?.value.trim() || pat.familyName || 'Patient';
  const birthDate  = document.getElementById('chat-birth-date')?.value || pat.birthDate || '2000-01-01';
  const gender     = document.getElementById('chat-gender')?.value || pat.gender || 'unknown';

  try {
    const questionnaire = buildQuestionnaire();
    await saveResource(questionnaire);

    const patient = buildPatient({ givenName, familyName, birthDate, gender });
    await saveResource(patient);

    const answers = state.scores;
    const qr = buildQuestionnaireResponse(questionnaire, patient, answers);
    await saveResource(qr);

    const risk = buildRiskAssessment(patient, qr, answers);
    await saveResource(risk);

    const observations = buildObservations(patient, qr, questionnaire, answers);
    for (const obs of observations) await saveResource(obs);

    const count = 4 + observations.length; // Q + P + QR + RA + 9 Obs
    const total = totalScore();
    const band = classifySeverity(total);

    showResultModal(total, band, count);
    showToast(`${count} FHIR resources saved to IndexedDB`);
  } catch (err) {
    console.error(err);
    showToast('Error saving data: ' + err.message, 'error');
  }
}
