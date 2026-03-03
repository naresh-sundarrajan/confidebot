import { renderDatabase } from './databaseExplorer.js';

let chatInitialized = false;

export function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const panel = document.getElementById(`panel-${btn.dataset.tab}`);
      panel.classList.add('active');

      if (btn.dataset.tab === 'database') renderDatabase();
      if (btn.dataset.tab === 'chat' && !chatInitialized) {
        chatInitialized = true;
        const { initChatAssessment } = await import('./chatAssessment.js');
        initChatAssessment();
      }
    });
  });
}
