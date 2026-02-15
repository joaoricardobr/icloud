const DB_NAME = "CloudDeskDB";
const DB_VERSION = 1;
const STORE_NAME = "dashboard_cache";

let dbInstance: IDBDatabase | null = null;
let isOpening = false;
const waitingQueue: Array<{ resolve: (db: IDBDatabase) => void, reject: (err: any) => void }> = [];

const openDB = (): Promise<IDBDatabase> => {
    if (dbInstance) return Promise.resolve(dbInstance);

    return new Promise((resolve, reject) => {
        if (isOpening) {
            waitingQueue.push({ resolve, reject });
            return;
        }

        isOpening = true;
        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: "id" });
                }
            };

            request.onsuccess = () => {
                dbInstance = request.result;
                isOpening = false;
                resolve(dbInstance);
                while (waitingQueue.length) {
                    const next = waitingQueue.shift();
                    next?.resolve(dbInstance);
                }
            };

            request.onerror = () => {
                isOpening = false;
                reject(request.error);
                while (waitingQueue.length) {
                    const next = waitingQueue.shift();
                    next?.reject(request.error);
                }
            };
        } catch (err) {
            isOpening = false;
            reject(err);
        }
    });
};

// In-memory fallback for cases where IndexedDB is completely locked
const memoryCache: Record<string, any> = {};

export const setCache = async (id: string, data: any) => {
    memoryCache[id] = { data, timestamp: Date.now() };
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put({ id, data, timestamp: Date.now() });
        return new Promise((resolve) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false); // Silent fail, we have memory fallback
        });
    } catch (err) {
        console.warn("IndexedDB Set Warning (using memory):", err);
    }
};

export const getCache = async (id: string): Promise<any | null> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);

        const result: any = await new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });

        if (result) return result.data;
    } catch (err) {
        console.warn("IndexedDB Get Warning (using memory):", err);
    }

    return memoryCache[id]?.data || null;
};
