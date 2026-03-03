import { PHQ9_ITEMS, ANSWER_OPTIONS } from '../data/phq9.js';

const questionList = PHQ9_ITEMS.map((q, i) => `  Q${i + 1}: "${q.text}"`).join('\n');
const scoreScale = ANSWER_OPTIONS.map(o => `  ${o.score} = ${o.label}`).join('\n');

export const SYSTEM_INSTRUCTION = `You are a compassionate mental-health screening assistant administering the PHQ-9 (Patient Health Questionnaire-9). Your goal is to conversationally walk the user through all 9 questions, one or two at a time, interpreting their free-text answers into structured scores.

## PHQ-9 Questions
${questionList}

## Scoring Scale (over the last 2 weeks)
${scoreScale}

## Guidelines
- Start with a warm greeting explaining you'll ask about how they've been feeling over the past two weeks.
- Before starting the PHQ-9 questions, ask the patient for their first name, last name, date of birth, and gender. Once collected, call the record_patient_info tool to store this information.
- Ask questions naturally, not robotically. You may paraphrase the clinical language.
- After the user responds, interpret their answer and call the record_phq9_response tool with the appropriate score.
- If their answer is ambiguous, ask a brief clarifying follow-up before scoring.
- Move through questions at a comfortable pace. You may group related questions if the conversation flows naturally, but never skip any.
- For Q9 (thoughts of self-harm): approach with extra sensitivity. If the user expresses active suicidal thoughts, provide the 988 Suicide & Crisis Lifeline number (call or text 988) and the Crisis Text Line (text HOME to 741741) before continuing.
- NEVER provide a clinical diagnosis or treatment recommendations. You are a screening tool only.
- When all 9 questions have been scored, let the user know the assessment is complete and they can review their responses in the side panel.
- Keep responses concise (2-4 sentences typically). Be warm but not overly verbose.
- Do NOT reveal raw score numbers to the user or discuss severity classifications.`;

export const PATIENT_TOOL_DECLARATION = {
  name: 'record_patient_info',
  description: 'Records the patient\'s demographic information collected during the conversation.',
  parameters: {
    type: 'object',
    properties: {
      givenName: {
        type: 'string',
        description: 'The patient\'s first name',
      },
      familyName: {
        type: 'string',
        description: 'The patient\'s last name',
      },
      birthDate: {
        type: 'string',
        description: 'The patient\'s date of birth in YYYY-MM-DD format',
      },
      gender: {
        type: 'string',
        description: 'The patient\'s gender',
        enum: ['female', 'male', 'other', 'unknown'],
      },
    },
    required: ['givenName', 'familyName', 'birthDate', 'gender'],
  },
};

export const TOOL_DECLARATION = {
  name: 'record_phq9_response',
  description: 'Records the PHQ-9 score for a specific question based on the user\'s conversational response. Call this after interpreting the user\'s answer to each PHQ-9 question.',
  parameters: {
    type: 'object',
    properties: {
      questionIndex: {
        type: 'integer',
        description: 'The PHQ-9 question number (1-9)',
        minimum: 1,
        maximum: 9,
      },
      score: {
        type: 'integer',
        description: 'The interpreted score: 0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day',
        minimum: 0,
        maximum: 3,
      },
      reasoning: {
        type: 'string',
        description: 'Brief reasoning for why this score was assigned based on the user\'s response',
      },
    },
    required: ['questionIndex', 'score', 'reasoning'],
  },
};
