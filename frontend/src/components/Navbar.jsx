import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FolderSearch, 
  Bell, 
  Bot, 
  Activity
} from 'lucide-react';

export const Navbar = ({ 
  activeTab, 
  setActiveTab 
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'upload', label: 'Scan Doc', icon: UploadCloud, highlight: true },
    { id: 'vault', label: 'Vault', icon: FolderSearch },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'chat', label: 'AI Chat', icon: Bot },
  ];

  return (
    <>
      {/* Desktop Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-teal-emerald flex items-center justify-center shadow-md shadow-teal-500/20 text-white shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight gradient-text-light">HealthPulse AI</h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">Smart Medical Record & RAG Assistant</p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Mobile Bottom Navigation Bar (Optimized for Smartphones) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-teal-700 bg-teal-50 font-bold scale-105 border border-teal-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${item.highlight && !isActive ? 'text-teal-600 animate-pulse' : ''}`} />
              <span className="text-[10px] mt-1 tracking-tight font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
