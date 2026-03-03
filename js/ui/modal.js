export function showResultModal(score, band, resourceCount) {
  document.getElementById('modal-score').textContent = score;
  document.getElementById('modal-severity-badge').innerHTML =
    `<span class="severity-badge severity-badge--${band.css}">${band.severity}</span>`;
  document.getElementById('modal-message').textContent =
    `This score of ${score}/27 falls in the "${band.severity}" range (${band.min}\u2013${band.max}).`;
  document.getElementById('modal-fhir-note').textContent =
    `${resourceCount} FHIR R4 resources were created and stored in IndexedDB: Questionnaire, Patient, QuestionnaireResponse, RiskAssessment, and 9 Observation resources.`;
  document.getElementById('result-modal').classList.add('active');
}
