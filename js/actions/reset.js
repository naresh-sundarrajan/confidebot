import { updateProgress } from '../ui/questionnaire.js';
import { resetDobPicker } from '../ui/dobPicker.js';

export function resetForm() {
  document.getElementById('given-name').value = '';
  document.getElementById('family-name').value = '';
  document.getElementById('birth-date').value = '';
  resetDobPicker('birth-date');
  document.getElementById('gender').value = 'female';
  document.querySelectorAll('#questions-container input[type="radio"]').forEach(r => r.checked = false);
  document.querySelectorAll('.q-item').forEach(q => q.classList.remove('answered'));
  updateProgress();
}
