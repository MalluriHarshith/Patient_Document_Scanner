import axios from 'axios';
export const API_BASE = import.meta.env.VITE_API_URL || '';

export const getFileUrl = (urlOrPath) => {
  if (!urlOrPath) return '#';
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath;
  }
  const cleanBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const cleanPath = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  return `${cleanBase}${cleanPath}`;
};

// Axios Client instance
export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Helper Functions
export const api = {
  // Check API health status
  getHealth: async () => {
    const res = await apiClient.get('/api/');
    return res.data;
  },

  // Upload Document
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // Get Documents
  getDocuments: async () => {
    const res = await apiClient.get('/api/documents');
    return res.data;
  },

  // Get Single Document
  getDocumentById: async (docId) => {
    const res = await apiClient.get(`/api/documents/${docId}`);
    return res.data;
  },

  // Delete Document
  deleteDocument: async (docId) => {
    const res = await apiClient.delete(`/api/documents/${docId}`);
    return res.data;
  },

  // Get Timeline History
  getTimeline: async () => {
    const res = await apiClient.get('/api/history/timeline');
    return res.data;
  },

  // Get Lab Test Trends
  getLabTrends: async () => {
    const res = await apiClient.get('/api/history/lab-trends');
    return res.data;
  },

  // Get Active Reminders
  getReminders: async () => {
    const res = await apiClient.get('/api/reminders');
    return res.data;
  },

  // Delete Reminder / Medicine Item
  deleteReminder: async (reminderId) => {
    const res = await apiClient.delete(`/api/reminders/${reminderId}`);
    return res.data;
  },

  // RAG Chat Query
  sendChatQuery: async (query, language = 'English', chatHistory = []) => {
    const res = await apiClient.post('/api/chat', {
      query,
      language,
      chat_history: chatHistory,
    });
    return res.data;
  },
};

// IndexedDB Helper for Local Device Storage
const DB_NAME = 'HealthPulseLocalDB';
const DB_VERSION = 1;

export const localDB = {
  open: () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('offline_documents')) {
          db.createObjectStore('offline_documents', { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  },

  saveDocumentOffline: async (doc) => {
    const db = await localDB.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline_documents', 'readwrite');
      const store = tx.objectStore('offline_documents');
      const req = store.put({ ...doc, savedOfflineAt: new Date().toISOString() });
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  },

  getOfflineDocuments: async () => {
    const db = await localDB.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline_documents', 'readonly');
      const store = tx.objectStore('offline_documents');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  },

  removeOfflineDocument: async (id) => {
    const db = await localDB.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline_documents', 'readwrite');
      const store = tx.objectStore('offline_documents');
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  },

  syncOfflineCache: async (serverDocs = []) => {
    try {
      const db = await localDB.open();
      const serverIds = new Set(serverDocs.map(d => d.id));
      const cached = await localDB.getOfflineDocuments();
      for (const item of cached) {
        if (!serverIds.has(item.id)) {
          await localDB.removeOfflineDocument(item.id);
        }
      }
    } catch (e) {
      console.warn("IndexedDB sync error:", e);
    }
  }
};
