import React, { useState, useEffect } from 'react';
import { 
  FolderSearch, 
  Search, 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  HardDriveDownload, 
  X,
  Pill,
  Activity,
  UserCheck,
  Calendar
} from 'lucide-react';
import { localDB, getFileUrl } from '../services/api';

export const DocumentVault = ({ documents, onDeleteDocument, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [offlineDocIds, setOfflineDocIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'raw'

  useEffect(() => {
    // Check which documents are cached offline in IndexedDB
    const checkOfflineStatus = async () => {
      try {
        const cached = await localDB.getOfflineDocuments();
        const ids = new Set(cached.map(c => c.id));
        setOfflineDocIds(ids);
      } catch (err) {
        console.error("IndexedDB error:", err);
      }
    };
    checkOfflineStatus();
  }, [documents]);

  const toggleOfflineSave = async (doc, e) => {
    e.stopPropagation();
    try {
      if (offlineDocIds.has(doc.id)) {
        await localDB.removeOfflineDocument(doc.id);
        const updated = new Set(offlineDocIds);
        updated.delete(doc.id);
        setOfflineDocIds(updated);
      } else {
        await localDB.saveDocumentOffline(doc);
        const updated = new Set(offlineDocIds);
        updated.add(doc.id);
        setOfflineDocIds(updated);
      }
    } catch (err) {
      console.error("Failed to toggle offline save:", err);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.doc_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-mobile-nav">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderSearch className="w-6 h-6 text-teal-600" />
            <span>Medical Document Vault & Local Storage</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Stored in MongoDB Atlas + Local file storage with smartphone offline cache option.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input 
            type="text"
            placeholder="Search vault documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl light-input text-xs shadow-2xs"
          />
        </div>
      </div>

      {/* Grid of Documents */}
      {filteredDocs.length === 0 ? (
        <div className="light-card p-10 text-center rounded-2xl border border-dashed border-slate-300">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">No medical records found in vault</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const isSavedOffline = offlineDocIds.has(doc.id);
            const ext = doc.extracted_data || {};
            const doctorName = ext.doctor_info?.doctor_name || 'Recorded Doctor';

            return (
              <div 
                key={doc.id}
                className="light-card p-5 rounded-2xl hover:border-teal-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      {doc.doc_type || 'Prescription'}
                    </span>

                    {/* Offline Toggle Button */}
                    <button
                      onClick={(e) => toggleOfflineSave(doc, e)}
                      title={isSavedOffline ? "Saved to local device offline storage" : "Save copy to local device"}
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                        isSavedOffline
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <HardDriveDownload className="w-3 h-3" />
                      <span>{isSavedOffline ? 'Offline Saved' : 'Save Offline'}</span>
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                    {doc.filename}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-3 font-medium">
                    {doc.summary || 'Uploaded document processed with AI.'}
                  </p>

                  <div className="space-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-medium">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                      <span>{doctorName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Uploaded: {doc.upload_date ? doc.upload_date.slice(0, 10) : 'Recent'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-all border border-teal-200"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Record</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href={getFileUrl(doc.file_url || `/uploads/${doc.saved_filename}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                      title="Download original document"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                      title="Delete document record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Details Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 border border-teal-200">
                  {selectedDoc.doc_type}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedDoc.filename}</h3>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  activeTab === 'summary' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Structured Summary
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  activeTab === 'raw' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Raw OCR Text
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'summary' ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-teal-700 block mb-1">AI Document Summary:</span>
                  <p className="text-slate-800 leading-relaxed font-medium">{selectedDoc.summary}</p>
                </div>

                {selectedDoc.extracted_data?.medicines?.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      <Pill className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Recorded Medicines</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedDoc.extracted_data.medicines.map((m, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-slate-800">
                          <div className="font-bold text-emerald-900">{m.name}</div>
                          <div className="text-[11px] text-slate-600">Dosage: {m.dosage} ({m.timing})</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDoc.extracted_data?.lab_results?.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-sky-800 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-sky-700" />
                      <span>Recorded Test Results</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedDoc.extracted_data.lab_results.map((l, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-sky-50/60 border border-sky-200 text-slate-800">
                          <div className="text-slate-600 text-[11px] font-medium">{l.test_name}</div>
                          <div className="font-bold text-slate-900">{l.value} {l.unit} ({l.status})</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900 font-mono text-[11px] text-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto border border-slate-800">
                {selectedDoc.extracted_data?.raw_extracted_text || 'No raw text available.'}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <a
                href={getFileUrl(selectedDoc.file_url || `/uploads/${selectedDoc.saved_filename}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl gradient-teal-emerald text-white text-xs font-bold flex items-center gap-2 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Open Original File</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
