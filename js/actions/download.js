import { STORES, getAllData } from '../db/indexedDb.js';
import { uuidv4 } from '../utils/uuid.js';
import { showToast } from '../utils/toast.js';

export async function downloadDatabase() {
  const data = await getAllData();
  const totalResources = STORES.reduce((s, name) => s + data[name].length, 0);

  if (totalResources === 0) {
    showToast('Database is empty \u2014 nothing to download.', 'error');
    return;
  }

  const bundle = {
    resourceType: 'Bundle',
    id: uuidv4(),
    type: 'collection',
    timestamp: new Date().toISOString(),
    total: totalResources,
    entry: []
  };

  for (const storeName of STORES) {
    for (const resource of data[storeName]) {
      const cleaned = { ...resource };
      delete cleaned._lastUpdated;
      bundle.entry.push({
        fullUrl: `urn:uuid:${resource.id}`,
        resource: cleaned
      });
    }
  }

  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/fhir+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `phq9-fhir-bundle-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Downloaded FHIR Bundle with ${totalResources} resources`);
}
