import React, { useState } from 'react';
import { 
  Clock, 
  FileText, 
  Pill, 
  Activity, 
  Calendar, 
  UserCheck, 
  Search, 
  TrendingUp,
  Eye
} from 'lucide-react';

export const TimelineView = ({ timeline, labTrends, setActiveTab }) => {
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTimeline = timeline.filter(item => {
    const matchesType = filterType === 'All' || item.doc_type.toLowerCase().includes(filterType.toLowerCase());
    const matchesSearch = 
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.doctor_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-mobile-nav">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-teal-600" />
            <span>Continuous Medical History Timeline</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Chronological log of your uploaded records and extracted health parameters.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {['All', 'Prescription', 'Lab Report', 'Discharge'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === type
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Lab Trends Section */}
      {Object.keys(labTrends).length > 0 && (
        <div className="light-card p-5 rounded-2xl space-y-3 border border-sky-200 bg-sky-50/40">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <span>Diagnostic Lab Parameter Trends</span>
            </h3>
            <span className="text-[11px] text-sky-700 font-bold">Tracked from MongoDB</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(labTrends).map(([testName, points]) => (
              <div key={testName} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                <div className="text-xs font-bold text-slate-800 truncate">{testName}</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-extrabold text-slate-900">
                    {points[0]?.value} <span className="text-xs font-normal text-slate-500">{points[0]?.unit}</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    points[0]?.status === 'High' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {points[0]?.status || 'Normal'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Last recorded: {points[0]?.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input 
          type="text"
          placeholder="Search timeline by doctor, condition, or file name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl light-input text-xs shadow-2xs"
        />
      </div>

      {/* Timeline Visual Feed */}
      <div className="relative border-l-2 border-teal-300 ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-6">
        {filteredTimeline.length === 0 ? (
          <div className="light-card p-6 text-center rounded-xl">
            <p className="text-xs text-slate-500 font-medium">No medical records match your selected filter.</p>
          </div>
        ) : (
          filteredTimeline.map((item, index) => (
            <div key={item.id || index} className="relative group">
              {/* Node Indicator Icon */}
              <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 w-8 h-8 rounded-full gradient-teal-emerald flex items-center justify-center text-white ring-4 ring-slate-50 shadow-md">
                {item.doc_type?.includes('Prescription') ? (
                  <Pill className="w-4 h-4" />
                ) : item.doc_type?.includes('Lab') ? (
                  <Activity className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </div>

              {/* Card Container */}
              <div className="light-card p-5 rounded-2xl hover:border-teal-300 transition-all space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200">
                      {item.doc_type}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {item.filename}
                    </h3>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.consultation_date ? item.consultation_date.slice(0, 10) : 'Date recorded'}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {item.summary || 'Extracted medical record summary.'}
                </p>

                {/* Micro Badges */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>{item.doctor_name}</span>
                  </div>

                  {item.medicines_count > 0 && (
                    <div className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                      <Pill className="w-3.5 h-3.5" />
                      <span>{item.medicines_count} Prescribed Meds</span>
                    </div>
                  )}

                  {item.lab_tests_count > 0 && (
                    <div className="flex items-center gap-1 text-sky-700 font-bold text-[11px]">
                      <Activity className="w-3.5 h-3.5" />
                      <span>{item.lab_tests_count} Lab Parameters</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
