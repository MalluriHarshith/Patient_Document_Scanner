import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { UploadModal } from './components/UploadModal';
import { DocumentVault } from './components/DocumentVault';
import { RemindersView } from './components/RemindersView';
import { ChatAssistant } from './components/ChatAssistant';
import { api, localDB } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbStatus, setDbStatus] = useState('Local Mirror');

  const [documents, setDocuments] = useState([]);
  const [labTrends, setLabTrends] = useState({});
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppData = async () => {
    try {
      setLoading(true);
      // Health check & MongoDB Atlas status
      try {
        const health = await api.getHealth();
        if (health.mongodb_atlas === 'Connected') {
          setDbStatus('Connected');
        }
      } catch (err) {
        console.warn("Backend API status:", err);
      }

      // Fetch user medical data directly from MongoDB Atlas
      const [docs, trends, rems] = await Promise.all([
        api.getDocuments().catch(() => []),
        api.getLabTrends().catch(() => ({})),
        api.getReminders().catch(() => [])
      ]);

      setDocuments(docs);
      setLabTrends(trends);
      setReminders(rems);

      // Sync browser IndexedDB cache to remove any documents deleted directly in MongoDB Atlas GUI
      await localDB.syncOfflineCache(docs);
    } catch (error) {
      console.error("Error loading application data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppData();
  }, []);

  const handleDeleteDocument = async (docId) => {
    if (window.confirm("Delete this document and all linked details (medicines, lab values, reminders) across ALL tables in MongoDB Atlas?")) {
      try {
        // 1. Delete from all MongoDB Atlas tables + storage
        await api.deleteDocument(docId);
        
        // 2. Remove offline cache from IndexedDB
        try {
          await localDB.removeOfflineDocument(docId);
        } catch (e) {
          console.warn("IndexedDB cache clear note:", e);
        }

        // 3. Refresh web UI data across all tabs
        fetchAppData();
      } catch (err) {
        alert("Failed to delete document from MongoDB Atlas.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* Top Navbar Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        dbStatus={dbStatus} 
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <DashboardView 
            documents={documents} 
            reminders={reminders} 
            labTrends={labTrends} 
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'upload' && (
          <UploadModal 
            onUploadSuccess={() => {
              fetchAppData();
            }}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'vault' && (
          <DocumentVault 
            documents={documents} 
            onDeleteDocument={handleDeleteDocument} 
            onRefresh={fetchAppData}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersView 
            reminders={reminders} 
            onRefresh={fetchAppData}
          />
        )}

        {activeTab === 'chat' && (
          <ChatAssistant />
        )}
      </main>
    </div>
  );
}
