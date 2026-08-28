import React from 'react';
import { 
  UploadCloud, 
  Bot, 
  Clock, 
  FileText, 
  Pill, 
  Activity, 
  Bell, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Globe
} from 'lucide-react';

export const DashboardView = ({ 
  documents, 
  reminders, 
  labTrends, 
  setActiveTab,
  patientName,
  mobileNumber
}) => {
  const medicineCount = reminders.filter(r => r.type === 'medicine').length;
  const labCount = Object.keys(labTrends).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 17) return 'Good Afternoon!';
    return 'Good Evening!';
  };

  return (
    <div className="space-y-6 pb-mobile-nav">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 via-sky-50 to-emerald-50 p-6 sm:p-8 border border-teal-200/80 shadow-sm">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/80 border border-teal-200 text-teal-800 text-xs font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>MongoDB Atlas Active Health Vault</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            {getGreeting()}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 font-medium">
            Upload your prescriptions, blood reports, and discharge summaries. Our AI OCR extracts your recorded medicines, lab results, and follow-ups.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('upload')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl gradient-teal-emerald text-white font-semibold text-xs sm:text-sm shadow-md shadow-teal-500/20 hover:opacity-95 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-teal-700 font-semibold text-xs sm:text-sm border border-slate-300 shadow-xs transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4 text-teal-600" />
              <span>Ask AI Assistant</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100/70 text-indigo-700 font-semibold text-xs sm:text-sm border border-indigo-200 transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Telugu Prescription Help</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveTab('vault')}
          className="light-card p-5 rounded-2xl cursor-pointer hover:border-teal-300 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-semibold">Uploaded Records</span>
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            {documents.length}
          </div>
          <div className="text-xs text-teal-600 flex items-center gap-1 font-semibold">
            <span>View document vault</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('reminders')}
          className="light-card p-5 rounded-2xl cursor-pointer hover:border-emerald-300 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-semibold">Active Medicines</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            {medicineCount}
          </div>
          <div className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
            <span>View dosage schedule</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('vault')}
          className="light-card p-5 rounded-2xl cursor-pointer hover:border-sky-300 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-semibold">Lab Test Parameters</span>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            {labCount}
          </div>
          <div className="text-xs text-sky-600 flex items-center gap-1 font-semibold">
            <span>HbA1c & Blood records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('reminders')}
          className="light-card p-5 rounded-2xl cursor-pointer hover:border-amber-300 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-semibold">Reminders & Follow-ups</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            {reminders.length}
          </div>
          <div className="text-xs text-amber-600 flex items-center gap-1 font-semibold">
            <span>Check appointment dates</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents Feed */}
        <div className="lg:col-span-2 light-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <span>Recent Medical Documents ({documents.length})</span>
            </h3>
            <button 
              onClick={() => setActiveTab('vault')} 
              className="text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
            >
              View Vault &rarr;
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No medical documents uploaded yet.</p>
              <button
                onClick={() => setActiveTab('upload')}
                className="px-4 py-2 rounded-xl gradient-teal-emerald text-white text-xs font-bold shadow-sm"
              >
                Upload First Record
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.slice(0, 3).map((doc) => (
                <div key={doc.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold text-[10px]">
                        {doc.doc_type || 'Prescription'}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{doc.filename}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">{doc.summary}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('vault')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-teal-700 hover:bg-teal-50 shrink-0 cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick AI Prompts */}
        <div className="light-card p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-teal-600" />
            <span>Sample AI Medical Queries</span>
          </h3>

          <div className="space-y-2.5">
            {[
              "Explain my prescribed medicines in Telugu",
              "What is my latest HbA1c test result?",
              "When is my next doctor follow-up appointment?",
              "Summarize my recent discharge summary"
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab('chat')}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 text-xs font-semibold text-slate-800 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span>"{q}"</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
