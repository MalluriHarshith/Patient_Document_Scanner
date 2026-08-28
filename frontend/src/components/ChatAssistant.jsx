import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Loader2, 
  Languages, 
  Volume2, 
  VolumeX, 
  FileText, 
  CheckCircle2, 
  Globe,
  Pill,
  Activity
} from 'lucide-react';
import { api } from '../services/api';

export const ChatAssistant = ({ mobileNumber = '9876543210' }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: (
        "Hello! I am your personalized AI Healthcare Assistant connected to your MongoDB Atlas medical records.\n\n" +
        "Ask me anything about your recorded medicines, HbA1c lab tests, doctor instructions, or ask me to **explain your prescription in Telugu**!"
      ),
      sources: []
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState('English');
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (overrideQuery = null) => {
    const query = overrideQuery || inputQuery;
    if (!query.trim() || loading) return;

    const userMsg = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!overrideQuery) setInputQuery('');
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : ''
      }));

      const res = await api.sendChatQuery(query, selectedLang, historyPayload, mobileNumber);

      const assistantMsg = {
        role: 'assistant',
        content: res.answer,
        sources: res.sources || [],
        disclaimer: res.non_diagnostic_disclaimer
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I encountered an issue retrieving your records. Please try again.",
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text, idx) => {
    if ('speechSynthesis' in window) {
      if (speakingIdx === idx) {
        window.speechSynthesis.cancel();
        setSpeakingIdx(null);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedLang === 'Telugu') utterance.lang = 'te-IN';
      else if (selectedLang === 'Hindi') utterance.lang = 'hi-IN';
      else utterance.lang = 'en-US';

      utterance.onend = () => setSpeakingIdx(null);
      utterance.onerror = () => setSpeakingIdx(null);

      setSpeakingIdx(idx);
      window.speechSynthesis.speak(utterance);
    }
  };

  const languagesList = [
    { name: 'English', flag: '🇬🇧' },
    { name: 'Telugu', flag: '🇮🇳 (తెలుగు)' },
    { name: 'Hindi', flag: '🇮🇳 (हिंदी)' },
    { name: 'Spanish', flag: '🇪🇸 (Español)' },
    { name: 'Tamil', flag: '🇮🇳 (தமிழ்)' }
  ];

  return (
    <div className="space-y-6 pb-mobile-nav max-w-4xl mx-auto">
      {/* Assistant Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-teal-600" />
            <span>AI Healthcare Assistant & Telugu Translator</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            RAG Chatbot querying your official medical records in MongoDB Atlas.
          </p>
        </div>

        {/* Language Selector Dropdown */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
          <Globe className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-semibold text-slate-600">Response Language:</span>
          <select 
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-teal-800 focus:outline-none focus:border-teal-500"
          >
            {languagesList.map(l => (
              <option key={l.name} value={l.name}>{l.flag} {l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Window Container */}
      <div className="light-card rounded-2xl flex flex-col h-[560px] overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div 
              key={idx}
              className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar Icon */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                msg.role === 'user'
                  ? 'bg-slate-800 text-white'
                  : 'gradient-teal-emerald text-white'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div className={`space-y-2 text-xs leading-relaxed ${
                msg.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                <div className={`p-4 rounded-2xl inline-block ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white font-medium rounded-tr-none shadow-sm'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-2xs font-medium'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Speech Audio Reader Button for Assistant responses */}
                  {msg.role === 'assistant' && typeof msg.content === 'string' && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => speakText(msg.content, idx)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold transition-all border border-teal-200 cursor-pointer"
                      >
                        {speakingIdx === idx ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                            <span>Stop Reading</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                            <span>Read Aloud ({selectedLang})</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* MongoDB Record Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="p-3 bg-white border border-teal-200 rounded-xl text-[11px] text-slate-700 space-y-1 shadow-2xs">
                    <span className="font-bold text-teal-800 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-teal-600" />
                      <span>MongoDB Atlas Source Citations:</span>
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 font-medium">
                      {msg.sources.map((src, sIdx) => (
                        <li key={sIdx}>
                          <strong>{src.filename}</strong> ({src.doc_type}) - <em>"{src.relevant_snippet}"</em>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-teal-700 bg-white p-3.5 rounded-xl border border-teal-200 w-max shadow-2xs">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              <span className="text-xs font-bold">Querying MongoDB Atlas medical context...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2 bg-white border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-bold px-2 shrink-0">Quick Prompts:</span>
          {[
            "Explain my medicines in Telugu",
            "What is my HbA1c test result?",
            "Show my follow-up appointment date"
          ].map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 font-semibold border border-slate-200 shrink-0 transition-all cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Query Input Footer Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={`Ask about your medical records in ${selectedLang}...`}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl light-input text-xs font-medium focus:outline-none focus:border-teal-500"
          />

          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className={`p-2.5 rounded-xl text-white font-bold transition-all ${
              inputQuery.trim() && !loading
                ? 'gradient-teal-emerald shadow-md shadow-teal-500/20 hover:opacity-95 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
