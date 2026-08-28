import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Pill, 
  Calendar, 
  Clock, 
  CheckSquare,
  Square,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';

export const RemindersView = ({ reminders = [], onRefresh }) => {
  const [items, setItems] = useState(reminders);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    setItems(reminders);
  }, [reminders]);

  const handleRemoveReminder = async (id, e) => {
    if (e) e.stopPropagation();
    if (!id) return;
    try {
      // 1. Delete from MongoDB Atlas
      await api.deleteReminder(id);
      
      // 2. Remove completely from local state
      setItems((prev) => prev.filter((r) => r.id !== id && r._id !== id));
      
      // 3. Trigger parent refresh if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to delete reminder:", err);
      alert("Failed to delete item from MongoDB Atlas.");
    }
  };

  const handleToggleNotifications = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          setNotificationsEnabled(true);
        } else {
          alert("Browser notification permission denied.");
        }
      });
    } else {
      alert("Browser does not support notifications.");
    }
  };

  const medicineReminders = items.filter(r => r.type === 'medicine');
  const appointmentReminders = items.filter(r => r.type === 'appointment');

  return (
    <div className="space-y-6 pb-mobile-nav max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-600" />
            <span>Medicine & Appointment Reminders</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Click checkmark or delete icon to permanently remove active prescription medicines or appointment alerts from MongoDB.
          </p>
        </div>

        <button
          onClick={handleToggleNotifications}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
            notificationsEnabled
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-amber-500 text-white hover:bg-amber-600 cursor-pointer'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>{notificationsEnabled ? 'Reminders Enabled' : 'Enable Smartphone Alerts'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medicine Dosage Schedule */}
        <div className="light-card p-6 rounded-2xl space-y-4 border border-emerald-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-600" />
              <span>Daily Prescription Schedule</span>
            </h3>
            <span className="text-xs text-emerald-800 font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200">
              {medicineReminders.length} Active
            </span>
          </div>

          {medicineReminders.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs font-medium">
              No active prescription dosages. Upload a prescription to populate your dosage schedule.
            </div>
          ) : (
            <div className="space-y-3">
              {medicineReminders.map((item) => {
                const targetId = item.id || item._id;
                return (
                  <div
                    key={targetId}
                    onClick={(e) => handleRemoveReminder(targetId, e)}
                    title="Click to completely remove medicine from MongoDB Atlas"
                    className="p-3.5 rounded-xl border bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-start gap-3 shadow-2xs group"
                  >
                    <div className="mt-0.5 text-slate-400 group-hover:text-emerald-600 transition-colors">
                      <Square className="w-5 h-5 group-hover:hidden" />
                      <CheckSquare className="w-5 h-5 hidden group-hover:block text-emerald-600" />
                    </div>

                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-950 flex items-center justify-between">
                        <span>{item.title}</span>
                        <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
                      </div>
                      <div className="text-xs text-slate-600 font-medium mt-0.5">
                        {item.details}
                      </div>
                      <div className="text-[10px] text-teal-700 mt-1 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Source: {item.source_filename}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Appointment Follow-ups */}
        <div className="light-card p-6 rounded-2xl space-y-4 border border-amber-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span>Doctor Follow-up Appointments</span>
            </h3>
            <span className="text-xs text-amber-800 font-bold px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-200">
              {appointmentReminders.length} Scheduled
            </span>
          </div>

          {appointmentReminders.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs font-medium">
              No doctor follow-up dates recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {appointmentReminders.map((item) => {
                const targetId = item.id || item._id;
                return (
                  <div 
                    key={targetId} 
                    className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs flex items-start justify-between gap-2"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900">{item.title}</span>
                        <span className="text-[11px] font-bold text-slate-700 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {item.timing_or_date}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{item.details}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Document: {item.source_filename}</p>
                    </div>

                    <button
                      onClick={(e) => handleRemoveReminder(targetId, e)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                      title="Remove follow-up appointment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
