import { renderQuestions, updateProgress } from './ui/questionnaire.js';
import { renderDatabase, initDatabaseExplorerEvents } from './ui/databaseExplorer.js';
import { initTabs } from './ui/tabs.js';
import { submitQuestionnaire } from './actions/submit.js';
import { downloadDatabase } from './actions/download.js';
import { clearDatabase } from './actions/clear.js';
import { resetForm } from './actions/reset.js';

// Tabs
initTabs();

// Database explorer event delegation
initDatabaseExplorerEvents();

// Button bindings
document.getElementById('btn-submit').addEventListener('click', submitQuestionnaire);
document.getElementById('btn-refresh').addEventListener('click', renderDatabase);
document.getElementById('btn-download').addEventListener('click', downloadDatabase);
document.getElementById('btn-clear').addEventListener('click', clearDatabase);

// Modal close — composed here to avoid circular deps between modal.js and reset.js
document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('result-modal').classList.remove('active');
  resetForm();
});

// Init
renderQuestions();
updateProgress();
