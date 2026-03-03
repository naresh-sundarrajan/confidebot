export const PHQ9_ITEMS = [
  { linkId: 'phq9-q1', text: 'Little interest or pleasure in doing things' },
  { linkId: 'phq9-q2', text: 'Feeling down, depressed, or hopeless' },
  { linkId: 'phq9-q3', text: 'Trouble falling or staying asleep, or sleeping too much' },
  { linkId: 'phq9-q4', text: 'Feeling tired or having little energy' },
  { linkId: 'phq9-q5', text: 'Poor appetite or overeating' },
  { linkId: 'phq9-q6', text: 'Feeling bad about yourself \u2014 or that you are a failure or have let yourself or your family down' },
  { linkId: 'phq9-q7', text: 'Trouble concentrating on things, such as reading the newspaper or watching television' },
  { linkId: 'phq9-q8', text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite \u2014 being so fidgety or restless that you have been moving around a lot more than usual' },
  { linkId: 'phq9-q9', text: 'Thoughts that you would be better off dead or of hurting yourself in some way' },
];

export const ANSWER_OPTIONS = [
  { score: 0, label: 'Not at all',            code: 'LA6568-5' },
  { score: 1, label: 'Several days',           code: 'LA6569-3' },
  { score: 2, label: 'More than half the days', code: 'LA6570-1' },
  { score: 3, label: 'Nearly every day',       code: 'LA6571-9' },
];

export const SEVERITY_BANDS = [
  { min: 0,  max: 4,  severity: 'Minimal',            key: 'minimal',    css: 'minimal' },
  { min: 5,  max: 9,  severity: 'Mild',               key: 'mild',       css: 'mild' },
  { min: 10, max: 14, severity: 'Moderate',            key: 'moderate',   css: 'moderate' },
  { min: 15, max: 19, severity: 'Moderately Severe',   key: 'mod-severe', css: 'mod-severe' },
  { min: 20, max: 27, severity: 'Severe',              key: 'severe',     css: 'severe' },
];

export function classifySeverity(score) {
  return SEVERITY_BANDS.find(b => score >= b.min && score <= b.max);
}
