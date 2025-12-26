
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Lead, ScanStatus, ScanProgress } from './types';
import { fetchCommercialLeads } from './services/geminiService';
import LeadTable from './components/LeadTable';

const App: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState<ScanStatus>(ScanStatus.IDLE);
  const [targetCount, setTargetCount] = useState<number>(500);
  const [error, setError] = useState<string | null>(null);
  
  const scanInProgress = useRef(false);

  const startScan = async () => {
    if (scanInProgress.current) return;
    
    setStatus(ScanStatus.SCANNING);
    setError(null);
    scanInProgress.current = true;
    
    try {
      await fetchCommercialLeads(20, (newLeads) => {
        setLeads(prev => {
          const combined = [...prev, ...newLeads];
          // Limit to target count
          if (combined.length >= targetCount) {
             scanInProgress.current = false;
             setStatus(ScanStatus.COMPLETED);
             return combined.slice(0, targetCount);
          }
          return combined;
        });
      });
    } catch (err) {
      setError("Failed to complete scan. Please check your connection or API key.");
      setStatus(ScanStatus.ERROR);
    } finally {
      scanInProgress.current = false;
    }
  };

  const exportCSV = () => {
    if (leads.length === 0) return;

    const headers = [
      "Business Name", "Address", "Phone", "Website", "Business Type", 
      "Roof Type", "Estimated Area", "Roof Condition", "Google Maps Link", 
      "Rating", "Review Excerpt", "AI Confidence Score"
    ];

    const rows = leads.map(l => [
      `"${l.businessName.replace(/"/g, '""')}"`,
      `"${l.address.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.website}"`,
      `"${l.businessType}"`,
      `"${l.roofType}"`,
      `"${l.estimatedRoofArea}"`,
      `"${l.roofCondition}"`,
      `"${l.mapsUri}"`,
      l.rating,
      `"${l.reviewSnippet.replace(/"/g, '""')}"`,
      l.confidenceScore
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `RoofMaxx_Leads_Pittsburgh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xl italic shadow-lg shadow-blue-500/20">
              RM
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Lead Commander AI</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Exclusive Commercial Engine</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">Target Location</p>
              <p className="text-sm font-semibold">Pittsburgh, PA</p>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">Scan Goal</p>
              <p className="text-sm font-semibold">{targetCount} Commercial Leads</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero / Controls */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full space-y-8">
        <section className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Commercial Intel Center</h2>
            <p className="text-slate-500 max-w-xl">
              AI-driven roof data extraction. We leverage Google Maps Grounding to scan industrial and commercial districts in Pittsburgh for high-value targets.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button
              onClick={startScan}
              disabled={status === ScanStatus.SCANNING}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                status === ScanStatus.SCANNING 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-500/30'
              }`}
            >
              {status === ScanStatus.SCANNING ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Start Scan
                </>
              )}
            </button>
            
            <button
              onClick={exportCSV}
              disabled={leads.length === 0}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                leads.length === 0 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 text-white hover:bg-black active:scale-95'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </section>

        {/* Status Bar */}
        {(status === ScanStatus.SCANNING || status === ScanStatus.COMPLETED) && (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
             <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-700">
                  {status === ScanStatus.SCANNING ? 'Discovery in Progress' : 'Scan Complete'}
                </span>
                <span className="text-sm text-slate-500 font-mono">
                  {leads.length} / {targetCount} leads identified
                </span>
             </div>
             <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div 
                  className={`h-full transition-all duration-500 ${status === ScanStatus.COMPLETED ? 'bg-green-500' : 'bg-blue-600'}`}
                  style={{ width: `${(leads.length / targetCount) * 100}%` }}
                ></div>
             </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Lead Grid/Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold text-slate-900">Captured Leads</h3>
             <div className="flex items-center gap-2">
               <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
               <span className="text-xs font-semibold text-slate-500 uppercase tracking-tighter">Live Intel Stream</span>
             </div>
          </div>
          <LeadTable leads={leads} />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium">
            © 2024 RoofMaxx Lead Commander AI. Proprietary Tool for Authorized Dealers Only.
          </p>
          <div className="flex items-center gap-4">
             <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-bold text-slate-600">API VERSION: GEMINI-2.5-FLASH</span>
             <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-bold text-slate-600">ENGINE: GOOGLE_MAPS_GROUNDING</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
