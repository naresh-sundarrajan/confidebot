import { clearAllStores } from '../db/indexedDb.js';
import { renderDatabase } from '../ui/databaseExplorer.js';
import { showToast } from '../utils/toast.js';

export async function clearDatabase() {
  if (!confirm('Clear all FHIR resources from IndexedDB? This cannot be undone.')) return;
  await clearAllStores();
  await renderDatabase();
  showToast('Database cleared');
}
