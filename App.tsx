
import React, { useEffect, useState } from 'react';
import { AppView } from './types';
import VendingInterface from './components/VendingInterface';
import AdminDashboard from './components/AdminDashboard';
import MerchandiserPortal from './components/MerchandiserPortal';
import Launcher from './components/Launcher';

const App: React.FC = () => {
  const [view, setView] = useState<AppView | 'LAUNCHER'>('LAUNCHER');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');

    if (mode === 'kiosk') setView('VENDING');
    else if (mode === 'admin') setView('ADMIN');
    else if (mode === 'staff') setView('MERCHANDISER');
    else setView('LAUNCHER');
  }, []);

  // Function to switch modes (updates URL without full refresh for smooth dev experience)
  const navigateTo = (mode: string | null) => {
    const url = new URL(window.location.href);
    if (mode) url.searchParams.set('mode', mode);
    else url.searchParams.delete('mode');
    window.history.pushState({}, '', url);
    
    if (mode === 'kiosk') setView('VENDING');
    else if (mode === 'admin') setView('ADMIN');
    else if (mode === 'staff') setView('MERCHANDISER');
    else setView('LAUNCHER');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Dev Navigation - Subtle floating return to launcher */}
      {view !== 'LAUNCHER' && (
        <button 
          onClick={() => navigateTo(null)}
          className="fixed bottom-4 left-4 z-[9999] bg-white/10 hover:bg-white/20 backdrop-blur-md text-white/40 hover:text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border border-white/5"
        >
          &larr; Exit to Hub
        </button>
      )}

      {view === 'VENDING' && <VendingInterface />}
      {view === 'MERCHANDISER' && <MerchandiserPortal />}
      {view === 'ADMIN' && <AdminDashboard />}
      {view === 'LAUNCHER' && <Launcher onSelect={navigateTo} />}
    </div>
  );
};

export default App;
