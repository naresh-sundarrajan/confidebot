import { getAnswers } from '../ui/questionnaire.js';
import { saveResource } from '../db/indexedDb.js';
import { buildQuestionnaire, buildPatient, buildQuestionnaireResponse, buildRiskAssessment, buildObservations } from '../fhir/builders.js';
import { classifySeverity } from '../data/phq9.js';
import { showToast } from '../utils/toast.js';
import { showResultModal } from '../ui/modal.js';

export async function submitQuestionnaire() {
  const givenName  = document.getElementById('given-name').value.trim() || 'Anonymous';
  const familyName = document.getElementById('family-name').value.trim() || 'Patient';
  const birthDate  = document.getElementById('birth-date').value || '2000-01-01';
  const gender     = document.getElementById('gender').value;
  const answers    = getAnswers();

  if (answers.includes(null)) {
    showToast('Please answer all 9 questions.', 'error');
    return;
  }

  try {
    const questionnaire = buildQuestionnaire();
    await saveResource(questionnaire);

    const patient = buildPatient({ givenName, familyName, birthDate, gender });
    await saveResource(patient);

    const qr = buildQuestionnaireResponse(questionnaire, patient, answers);
    await saveResource(qr);

    const risk = buildRiskAssessment(patient, qr, answers);
    await saveResource(risk);

    const observations = buildObservations(patient, qr, questionnaire, answers);
    for (const obs of observations) await saveResource(obs);

    const count = 1 + 1 + 1 + 1 + observations.length;
    const total = answers.reduce((s, v) => s + v, 0);
    const band = classifySeverity(total);

    showResultModal(total, band, count);
    showToast(`${count} FHIR resources saved to IndexedDB`);
  } catch (err) {
    console.error(err);
    showToast('Error saving data: ' + err.message, 'error');
  }
}
