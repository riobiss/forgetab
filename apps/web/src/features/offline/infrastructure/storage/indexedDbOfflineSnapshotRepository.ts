import type { OfflineSnapshotRepository } from "@/features/offline/application/contracts/OfflineSnapshotRepository"
import type { OfflineSnapshotDto } from "@forgetab/world-contracts/offline"

const DATABASE_NAME = "forgetab-pwa"
const DATABASE_VERSION = 1
const STORE_NAME = "offline-snapshots"
const CURRENT_SNAPSHOT_KEY = "current"

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const database = await openDatabase()

  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode)
      const request = operation(transaction.objectStore(STORE_NAME))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      transaction.onerror = () => reject(transaction.error)
    })
  } finally {
    database.close()
  }
}

export const indexedDbOfflineSnapshotRepository: OfflineSnapshotRepository = {
  async load() {
    if (typeof indexedDB === "undefined") return null
    const snapshot = await runTransaction<OfflineSnapshotDto | undefined>(
      "readonly",
      (store) => store.get(CURRENT_SNAPSHOT_KEY)
    )
    return snapshot ?? null
  },

  async save(snapshot) {
    if (typeof indexedDB === "undefined") return
    await runTransaction<IDBValidKey>("readwrite", (store) =>
      store.put(snapshot, CURRENT_SNAPSHOT_KEY)
    )
  },

  async clear() {
    if (typeof indexedDB === "undefined") return
    await runTransaction<undefined>("readwrite", (store) =>
      store.delete(CURRENT_SNAPSHOT_KEY)
    )
    if (typeof caches !== "undefined") {
      await caches.delete("forgetab-user-assets-v1")
    }
    navigator.serviceWorker?.controller?.postMessage({
      type: "CLEAR_USER_DATA"
    })
  }
}
