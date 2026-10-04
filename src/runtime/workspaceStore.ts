const DB_NAME = 'typst-quiz-presenter';
const DB_VERSION = 1;
const STORE_NAME = 'workspace-handles';
const LAST_WORKSPACE_KEY = 'last-workspace';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Không mở được IndexedDB.'));
  });
}

export async function saveWorkspaceHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(handle, LAST_WORKSPACE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Không lưu được workspace handle.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Lưu workspace handle bị hủy.'));
    });
  } finally {
    db.close();
  }
}

export async function loadWorkspaceHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  const db = await openDatabase();
  try {
    return await new Promise<FileSystemDirectoryHandle | undefined>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(LAST_WORKSPACE_KEY);
      request.onsuccess = () => resolve(request.result as FileSystemDirectoryHandle | undefined);
      request.onerror = () => reject(request.error ?? new Error('Không đọc được workspace handle.'));
    });
  } finally {
    db.close();
  }
}

export async function forgetWorkspaceHandle(): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(LAST_WORKSPACE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Không xóa được workspace handle.'));
    });
  } finally {
    db.close();
  }
}

export function supportsDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function pickWorkspaceDirectory(): Promise<FileSystemDirectoryHandle> {
  const picker = (window as typeof window & {
    showDirectoryPicker?: (options?: { mode?: 'read'; id?: string }) => Promise<FileSystemDirectoryHandle>;
  }).showDirectoryPicker;

  if (!picker) {
    throw new Error('Trình duyệt chưa hỗ trợ chọn workspace. Hãy dùng Chrome hoặc Edge mới trên HTTPS/localhost.');
  }

  return picker({ mode: 'read', id: 'biensoantypst-workspace' });
}
