
import React, { useState } from 'react';
import { AppView } from './types';
import VendingInterface from './components/VendingInterface';
import AdminDashboard from './components/AdminDashboard';
import MerchandiserPortal from './components/MerchandiserPortal';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('ADMIN');

  return (
    <div className="min-h-screen">
      {/* Dev Navigation Toggle - Typically hidden in production */}
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] opacity-30 hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex gap-4">
        <button 
          onClick={() => setView('VENDING')}
          className={`text-xs font-bold uppercase tracking-widest ${view === 'VENDING' ? 'text-blue-400' : 'text-white'}`}
        >
          User UI
        </button>
        <div className="w-px h-4 bg-white/20"></div>
        <button 
          onClick={() => setView('MERCHANDISER')}
          className={`text-xs font-bold uppercase tracking-widest ${view === 'MERCHANDISER' ? 'text-yellow-400' : 'text-white'}`}
        >
          Merchandiser
        </button>
        <div className="w-px h-4 bg-white/20"></div>
        <button 
          onClick={() => setView('ADMIN')}
          className={`text-xs font-bold uppercase tracking-widest ${view === 'ADMIN' ? 'text-blue-400' : 'text-white'}`}
        >
          Admin
        </button>
      </div>

      {view === 'VENDING' ? (
        <VendingInterface />
      ) : view === 'MERCHANDISER' ? (
        <MerchandiserPortal />
      ) : (
        <AdminDashboard />
      )}
    </div>
  );
};

export default App;
