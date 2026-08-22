import { StoredAppState } from '../types';

const DB_NAME = 'guf-renamer';
const DB_VERSION = 1;
const STORE_META = 'meta';
const STORE_BLOBS = 'blobs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves app metadata and file blobs into IndexedDB
 */
export async function saveAppStateToDB(
  state: StoredAppState,
  blobsMap: Map<string, Blob | File>
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_META, STORE_BLOBS], 'readwrite');
    const metaStore = tx.objectStore(STORE_META);
    const blobStore = tx.objectStore(STORE_BLOBS);

    // Save meta
    metaStore.put(state, 'current_state');

    // Collect all active file IDs across all packages
    const currentIds = new Set<string>();
    if (state.packages && state.packages.length > 0) {
      state.packages.forEach((pkg) => {
        pkg.filesMeta.forEach((f) => currentIds.add(f.id));
      });
    } else if (state.filesMeta) {
      state.filesMeta.forEach((f) => currentIds.add(f.id));
    }

    // Clean up orphaned blobs
    const allKeysReq = blobStore.getAllKeys();

    allKeysReq.onsuccess = () => {
      const allKeys = allKeysReq.result as string[];
      for (const key of allKeys) {
        if (!currentIds.has(key)) {
          blobStore.delete(key);
        }
      }
    };

    // Save active blobs
    for (const [id, blob] of blobsMap.entries()) {
      blobStore.put(blob, id);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('Failed to save to IndexedDB:', error);
  }
}

/**
 * Loads app state and blobs from IndexedDB
 */
export async function loadAppStateFromDB(): Promise<{
  state: StoredAppState | null;
  blobs: Map<string, Blob>;
}> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_META, STORE_BLOBS], 'readonly');
    const metaStore = tx.objectStore(STORE_META);
    const blobStore = tx.objectStore(STORE_BLOBS);

    const metaReq = metaStore.get('current_state');

    return new Promise((resolve) => {
      metaReq.onsuccess = () => {
        const state = (metaReq.result as StoredAppState) || null;
        if (!state) {
          resolve({ state: null, blobs: new Map() });
          return;
        }

        // Collect all file IDs needed across packages or legacy filesMeta
        const fileIds: string[] = [];
        if (state.packages && state.packages.length > 0) {
          state.packages.forEach((pkg) => {
            pkg.filesMeta.forEach((f) => fileIds.push(f.id));
          });
        } else if (state.filesMeta && state.filesMeta.length > 0) {
          state.filesMeta.forEach((f) => fileIds.push(f.id));
        }

        if (fileIds.length === 0) {
          resolve({ state, blobs: new Map() });
          return;
        }

        const blobs = new Map<string, Blob>();
        let loadedCount = 0;
        const totalFiles = fileIds.length;

        fileIds.forEach((id) => {
          const blobReq = blobStore.get(id);
          blobReq.onsuccess = () => {
            if (blobReq.result) {
              blobs.set(id, blobReq.result as Blob);
            }
            loadedCount++;
            if (loadedCount === totalFiles) {
              resolve({ state, blobs });
            }
          };
          blobReq.onerror = () => {
            loadedCount++;
            if (loadedCount === totalFiles) {
              resolve({ state, blobs });
            }
          };
        });
      };

      metaReq.onerror = () => {
        resolve({ state: null, blobs: new Map() });
      };
    });
  } catch (error) {
    console.warn('Failed to load from IndexedDB:', error);
    return { state: null, blobs: new Map() };
  }
}

/**
 * Clears saved state from IndexedDB
 */
export async function clearAppStateDB(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_META, STORE_BLOBS], 'readwrite');
    tx.objectStore(STORE_META).clear();
    tx.objectStore(STORE_BLOBS).clear();

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('Failed to clear IndexedDB:', error);
  }
}
