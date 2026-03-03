import { STORES, getAllData } from '../db/indexedDb.js';
import { COLLECTION_META } from '../data/collectionMeta.js';
import { classifySeverity } from '../data/phq9.js';
import { syntaxHighlight } from '../utils/syntaxHighlight.js';

function getResourceSummary(type, resource) {
  switch (type) {
    case 'Patient':
      return `${resource.name?.[0]?.given?.[0] || ''} ${resource.name?.[0]?.family || ''} \u00b7 ${resource.gender || ''}`;
    case 'Questionnaire':
      return resource.title || resource.name;
    case 'QuestionnaireResponse':
      return resource.subject?.display || '';
    case 'RiskAssessment': {
      const ext = resource.extension?.find(e => e.url?.includes('phq9-total-score'));
      const score = ext?.valueInteger ?? '?';
      const band = typeof score === 'number' ? classifySeverity(score) : null;
      const badgeCss = band ? `severity-badge--${band.css}` : '';
      return `${resource.subject?.display || ''} <span class="severity-badge ${badgeCss}">${score}/27 ${band?.severity || ''}</span>`;
    }
    case 'Observation':
      return `Item score: ${resource.valueInteger} \u00b7 ${resource.code?.text?.substring(0, 40) || ''}\u2026`;
    default:
      return '';
  }
}

export async function renderDatabase() {
  const data = await getAllData();
  const statsEl = document.getElementById('db-stats');
  const collectionsEl = document.getElementById('db-collections');

  const totalResources = STORES.reduce((s, name) => s + data[name].length, 0);

  statsEl.innerHTML = `
    <div class="stat-card">
      <div class="stat-card__value">${totalResources}</div>
      <div class="stat-card__label">Total Resources</div>
    </div>
    ${STORES.map(name => `
      <div class="stat-card">
        <div class="stat-card__value">${data[name].length}</div>
        <div class="stat-card__label">${name}</div>
      </div>
    `).join('')}
  `;

  if (totalResources === 0) {
    collectionsEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">\ud83d\uddc4\ufe0f</div>
        <div class="empty-state__text">
          No FHIR resources stored yet.<br>
          Complete the questionnaire to populate the database.
        </div>
      </div>
    `;
    return;
  }

  collectionsEl.innerHTML = STORES.map(name => {
    const meta = COLLECTION_META[name];
    const items = data[name];
    if (items.length === 0) return '';

    return `
      <div class="collection-section" data-collection="${name}">
        <div class="collection-header" data-action="toggle-collection" data-name="${name}">
          <div class="collection-header__icon" style="background:${meta.bg};border:1px solid ${meta.border}">
            ${meta.icon}
          </div>
          <div class="collection-header__name">${name}</div>
          <div class="collection-header__count">${items.length} resource${items.length > 1 ? 's' : ''}</div>
          <div class="collection-header__arrow">\u25bc</div>
        </div>
        <div class="collection-body">
          ${items.map(resource => {
            const display = getResourceSummary(name, resource);
            return `
              <div class="resource-card" data-rid="${resource.id}">
                <div class="resource-card__header" data-action="toggle-resource" data-rid="${resource.id}">
                  <span class="resource-card__id">${resource.id.substring(0, 8)}\u2026</span>
                  <span>${display}</span>
                  <span class="resource-card__meta">${resource._lastUpdated ? new Date(resource._lastUpdated).toLocaleString() : ''}</span>
                </div>
                <div class="resource-card__json">
                  <pre class="json-view">${syntaxHighlight(resource)}</pre>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

export function initDatabaseExplorerEvents() {
  const collectionsEl = document.getElementById('db-collections');
  collectionsEl.addEventListener('click', (e) => {
    const toggleCollection = e.target.closest('[data-action="toggle-collection"]');
    if (toggleCollection) {
      const name = toggleCollection.dataset.name;
      const section = document.querySelector(`.collection-section[data-collection="${name}"]`);
      section.classList.toggle('open');
      return;
    }

    const toggleResource = e.target.closest('[data-action="toggle-resource"]');
    if (toggleResource) {
      const id = toggleResource.dataset.rid;
      const card = document.querySelector(`.resource-card[data-rid="${id}"]`);
      card.classList.toggle('open');
    }
  });
}
