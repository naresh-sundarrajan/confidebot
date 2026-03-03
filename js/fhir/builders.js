import { uuidv4 } from '../utils/uuid.js';
import { PHQ9_ITEMS, ANSWER_OPTIONS, classifySeverity } from '../data/phq9.js';

export function buildQuestionnaire() {
  const answerOption = ANSWER_OPTIONS.map(opt => ({
    valueCoding: { system: 'http://loinc.org', code: opt.code, display: opt.label },
    extension: [{ url: 'http://hl7.org/fhir/StructureDefinition/ordinalValue', valueDecimal: opt.score }]
  }));

  return {
    resourceType: 'Questionnaire',
    id: uuidv4(),
    url: 'http://loinc.org/vs/LL358-3',
    identifier: [{ system: 'http://loinc.org', value: '44249-1' }],
    name: 'PHQ9',
    title: 'Patient Health Questionnaire-9 (PHQ-9)',
    status: 'active',
    date: new Date().toISOString(),
    publisher: 'Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke',
    description: 'The PHQ-9 is a multipurpose instrument for screening, diagnosing, monitoring and measuring the severity of depression.',
    code: [{ system: 'http://loinc.org', code: '44249-1', display: 'PHQ-9 quick depression assessment panel' }],
    item: PHQ9_ITEMS.map(q => ({
      linkId: q.linkId,
      text: q.text,
      type: 'choice',
      required: true,
      answerOption
    }))
  };
}

export function buildPatient({ givenName, familyName, birthDate, gender }) {
  return {
    resourceType: 'Patient',
    id: uuidv4(),
    active: true,
    name: [{ use: 'official', family: familyName, given: [givenName] }],
    gender,
    birthDate
  };
}

export function buildQuestionnaireResponse(questionnaire, patient, answers) {
  return {
    resourceType: 'QuestionnaireResponse',
    id: uuidv4(),
    questionnaire: `Questionnaire/${questionnaire.id}`,
    status: 'completed',
    subject: {
      reference: `Patient/${patient.id}`,
      display: `${patient.name[0].given[0]} ${patient.name[0].family}`
    },
    authored: new Date().toISOString(),
    item: questionnaire.item.map((qItem, idx) => ({
      linkId: qItem.linkId,
      text: qItem.text,
      answer: [{
        valueCoding: {
          system: 'http://loinc.org',
          code: ANSWER_OPTIONS[answers[idx]].code,
          display: ANSWER_OPTIONS[answers[idx]].label
        }
      }]
    }))
  };
}

export function buildRiskAssessment(patient, qr, answers) {
  const total = answers.reduce((s, v) => s + v, 0);
  const band = classifySeverity(total);

  return {
    resourceType: 'RiskAssessment',
    id: uuidv4(),
    status: 'final',
    subject: {
      reference: `Patient/${patient.id}`,
      display: `${patient.name[0].given[0]} ${patient.name[0].family}`
    },
    occurrenceDateTime: new Date().toISOString(),
    basis: [{ reference: `QuestionnaireResponse/${qr.id}` }],
    method: {
      coding: [{ system: 'http://loinc.org', code: '44261-6', display: 'PHQ-9 total score' }]
    },
    prediction: [{
      outcome: {
        coding: [{ system: 'http://snomed.info/sct', code: '35489007', display: 'Depressive disorder' }],
        text: `Depression severity: ${band.severity} (score ${total}/27)`
      },
      qualitativeRisk: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/risk-probability', code: band.key, display: band.severity }]
      }
    }],
    extension: [{
      url: 'http://example.org/fhir/StructureDefinition/phq9-total-score',
      valueInteger: total
    }]
  };
}

export function buildObservations(patient, qr, questionnaire, answers) {
  return answers.map((value, idx) => ({
    resourceType: 'Observation',
    id: uuidv4(),
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey', display: 'Survey' }] }],
    code: {
      coding: [{ system: 'http://loinc.org', code: '44249-1', display: questionnaire.item[idx].text }],
      text: questionnaire.item[idx].text
    },
    subject: { reference: `Patient/${patient.id}` },
    effectiveDateTime: new Date().toISOString(),
    valueInteger: value,
    derivedFrom: [{ reference: `QuestionnaireResponse/${qr.id}` }]
  }));
}
