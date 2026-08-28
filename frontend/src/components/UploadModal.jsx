import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Pill, 
  Activity, 
  Database
} from 'lucide-react';
import { api } from '../services/api';

export const UploadModal = ({ onUploadSuccess, setActiveTab }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError(null);
      setExtractedData(null);
      if (selected.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selected));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setError(null);
      setExtractedData(null);
      if (selected.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selected));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a medical document to upload.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Direct fast upload & AI extraction
      const result = await api.uploadDocument(file);

      setExtractedData(result.document);
      setLoading(false);
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to process medical document. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-mobile-nav max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-teal-600" />
          <span>AI Medical Document Scanner</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Upload prescriptions, diagnostic lab reports, or discharge summaries for automatic AI extraction into MongoDB Atlas.
        </p>
      </div>

      {/* Upload Box */}
      {!extractedData ? (
        <div className="light-card p-6 sm:p-10 rounded-2xl text-center space-y-6">
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-teal-300 hover:border-teal-500 transition-all rounded-2xl p-8 bg-slate-50/60 hover:bg-teal-50/40 cursor-pointer relative"
          >
            <input 
              type="file" 
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            
            <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-4 border border-teal-200 shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-slate-800 mb-1">
              {file ? file.name : 'Choose a file or drag & drop here'}
            </h3>
            <p className="text-xs text-slate-500 mb-3 font-medium">
              Supports Prescriptions, Lab Reports, Discharge Summaries (PNG, JPG, PDF)
            </p>

            {file && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200">
                <FileText className="w-3.5 h-3.5" />
                <span>Ready to scan ({ (file.size / 1024).toFixed(1) } KB)</span>
              </div>
            )}
          </div>

          {/* Preview image if available */}
          {previewUrl && (
            <div className="max-w-xs mx-auto rounded-xl overflow-hidden border border-slate-200 bg-white p-2 shadow-xs">
              <img src={previewUrl} alt="Document Preview" className="w-full max-h-48 object-contain rounded-lg" />
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 justify-center font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Scan Button & Fast Loading State */}
          <div>
            {loading ? (
              <div className="space-y-3 py-4">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white border border-teal-300 text-teal-800 text-sm font-bold shadow-md">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                  <span>Scanning & Saving to MongoDB Atlas...</span>
                </div>
                <div className="w-48 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 animate-pulse"></div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleUpload}
                disabled={!file}
                className={`px-8 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all ${
                  file
                    ? 'gradient-teal-emerald text-white shadow-teal-500/20 hover:opacity-95 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Scan & Save to MongoDB Atlas
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Extraction Result View */
        <div className="light-card p-6 sm:p-8 rounded-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Extracted Medical Data Preview</h3>
                <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" />
                  <span>Saved to MongoDB Atlas (`healthcare_db`)</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => { setExtractedData(null); setFile(null); }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer"
            >
              Scan Another File
            </button>
          </div>

          {/* Structured Data Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Document Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 md:col-span-2">
              <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">Document Summary</span>
              <p className="text-slate-800 leading-relaxed font-medium">{extractedData.summary}</p>
            </div>

            {/* Doctor Info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">Physician Details</span>
              <div className="text-slate-900 font-bold">{extractedData.extracted_data?.doctor_info?.doctor_name}</div>
              <div className="text-slate-600">{extractedData.extracted_data?.doctor_info?.clinic_name}</div>
              <div className="text-slate-600">Specialty: {extractedData.extracted_data?.doctor_info?.specialty}</div>
            </div>

            {/* Diagnoses */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Recorded Conditions</span>
              {extractedData.extracted_data?.diagnoses?.map((d, i) => (
                <div key={i} className="text-amber-950 font-semibold">
                  • {d.condition_name} ({d.type})
                </div>
              ))}
            </div>

            {/* Medicines Extracted */}
            {extractedData.extracted_data?.medicines?.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2 md:col-span-2">
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider flex items-center gap-1">
                  <Pill className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Prescribed Medicines ({extractedData.extracted_data.medicines.length})</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {extractedData.extracted_data.medicines.map((m, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white border border-emerald-200 text-slate-800 shadow-2xs">
                      <div className="font-bold text-emerald-800">{m.name}</div>
                      <div className="text-[11px] text-slate-600">Dosage: {m.dosage} | {m.timing}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lab Results Extracted */}
            {extractedData.extracted_data?.lab_results?.length > 0 && (
              <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2 md:col-span-2">
                <span className="text-[10px] uppercase font-bold text-sky-800 tracking-wider flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-sky-700" />
                  <span>Lab Test Parameters ({extractedData.extracted_data.lab_results.length})</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {extractedData.extracted_data.lab_results.map((l, i) => (
                    <div key={i} className="text-slate-500 text-[11px] font-medium">{l.test_name}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => setActiveTab('vault')}
              className="px-5 py-2.5 rounded-xl gradient-teal-emerald text-white text-xs font-bold shadow-md shadow-teal-500/20 cursor-pointer"
            >
              View Document Vault &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
