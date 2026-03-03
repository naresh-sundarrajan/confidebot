const DB_NAME = 'fhir_phq9';
const DB_VERSION = 1;
export const STORES = ['Questionnaire', 'Patient', 'QuestionnaireResponse', 'RiskAssessment', 'Observation'];

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

export async function saveResource(resource) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(resource.resourceType, 'readwrite');
    tx.objectStore(resource.resourceType).put({ ...resource, _lastUpdated: new Date().toISOString() });
    tx.oncomplete = () => resolve(resource);
    tx.onerror = e => reject(e.target.error);
  });
}

export async function getAllFromStore(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e.target.error);
  });
}

export async function clearAllStores() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, 'readwrite');
    for (const name of STORES) tx.objectStore(name).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = e => reject(e.target.error);
  });
}

export async function getAllData() {
  const data = {};
  for (const name of STORES) {
    data[name] = await getAllFromStore(name);
  }
  return data;
}
