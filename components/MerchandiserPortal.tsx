
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_MACHINES } from '../constants';
import { Machine, MachineStatus, Product } from '../types';
import { hardwareService } from '../services/hardwareService';

const MerchandiserPortal: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(MOCK_MACHINES.find(m => m.status === MachineStatus.LOW_STOCK) || MOCK_MACHINES[0]);
  const [serviceLogs, setServiceLogs] = useState<string[]>([]);
  const [localInventory, setLocalInventory] = useState<Product[]>(hardwareService.getInventory());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = hardwareService.subscribe(() => {
      setLocalInventory([...hardwareService.getInventory()]);
    });
    return () => unsubscribe();
  }, []);

  const lowStockMachines = useMemo(() => 
    MOCK_MACHINES.filter(m => m.status === MachineStatus.LOW_STOCK), 
  []);

  const handleUpdateStock = (productId: string, delta: number) => {
    const currentProduct = localInventory.find(p => p.id === productId);
    if (!currentProduct) return;
    
    const newStock = Math.max(0, Math.min(20, currentProduct.stock + delta));
    if (newStock !== currentProduct.stock) {
      hardwareService.updateStock(productId, newStock);
      setServiceLogs(prev => [`Refilled ${currentProduct.name} (New Stock: ${newStock})`, ...prev]);
    }
  };

  const refillAll = () => {
    localInventory.forEach(p => hardwareService.updateStock(p.id, 20));
    setServiceLogs(prev => [`Bulk refill performed on all 60 slots`, ...prev]);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await hardwareService.sendCommand(0x53, [0xFF]); 
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSyncing(false);
    setServiceLogs(prev => [`SUCCESS: Inventory synced with LB-140 board controller`, ...prev]);
  };

  return (
    <div className="h-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Merchandiser Header */}
      <header className="px-10 py-6 bg-slate-800 border-b border-slate-700 flex justify-between items-center shadow-2xl relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-yellow-400/20">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-widest text-white">Service Mode</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-tighter">Merchandiser ID: ST-992</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-700/50 px-6 py-2 rounded-full border border-slate-600 flex items-center gap-3">
             <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
             <span className="text-xs font-bold uppercase text-slate-300">LB-140 Bus: Active</span>
          </div>
          <button onClick={() => window.location.reload()} className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Alerts & Machine Selector */}
        <aside className="w-80 bg-slate-800/50 border-r border-slate-700 flex flex-col overflow-y-auto scrollbar-hide">
          <div className="p-6">
            <h2 className="text-xs font-black uppercase text-yellow-400 mb-6 tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Stock Alerts
            </h2>
            <div className="space-y-3">
              {lowStockMachines.map(machine => (
                <button 
                  key={machine.id}
                  onClick={() => setSelectedMachine(machine)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-300 group ${
                    selectedMachine?.id === machine.id 
                    ? 'bg-yellow-400 border-yellow-400 text-slate-900 shadow-lg' 
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-black">{machine.id}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${selectedMachine?.id === machine.id ? 'bg-slate-900 text-white' : 'bg-red-500/20 text-red-400'}`}>LOW</span>
                  </div>
                  <p className={`text-[10px] ${selectedMachine?.id === machine.id ? 'text-slate-800' : 'text-slate-400'} font-medium truncate`}>{machine.location}</p>
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-6 border-t border-slate-700 mt-auto bg-slate-900/40">
            <h2 className="text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">Service Log</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-[9px] scrollbar-hide">
              {serviceLogs.length > 0 ? serviceLogs.map((log, i) => (
                <div key={i} className="text-slate-400 border-l border-slate-600 pl-2 py-0.5">
                  <span className="text-slate-600 mr-1">[{new Date().toLocaleTimeString([], {hour12:false})}]</span>
                  {log}
                </div>
              )) : (
                <p className="text-slate-600 italic">No activity recorded...</p>
              )}
            </div>
          </div>
        </aside>

        {/* Inventory Control Grid - 60 Slots (6 Columns x 10 Rows) */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-900/50 relative">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight">{selectedMachine?.id} <span className="text-slate-700">/</span> 60-Cell Matrix</h3>
                <p className="text-slate-500 font-medium text-sm mt-1">Configuring all 6 trays (Motors 1-60) for {selectedMachine?.location}</p>
              </div>
              <div className="flex gap-3">
                 <button onClick={refillAll} className="px-5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs hover:bg-slate-700 transition-all flex items-center gap-2">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Refill Machine
                 </button>
                 <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="px-6 py-2.5 bg-yellow-400 text-slate-900 rounded-xl font-black text-xs hover:bg-yellow-300 transition-all shadow-xl shadow-yellow-400/10 disabled:opacity-50 flex items-center gap-2"
                 >
                    {isSyncing ? (
                      <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    )}
                    Sync LB-140
                 </button>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-4">
              {localInventory.map((product, idx) => (
                <div key={idx} className={`bg-slate-800/80 border rounded-2xl p-4 transition-all duration-300 group relative overflow-hidden ${product.stock < 5 ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-slate-700 hover:border-slate-500'}`}>
                  
                  {/* Subtle Background Progress Fill */}
                  <div 
                    className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-in-out pointer-events-none ${
                      product.stock < 5 ? 'bg-red-500/10' : 'bg-yellow-400/5'
                    }`}
                    style={{ height: `${(product.stock / 20) * 100}%` }}
                  />

                  {/* Top Edge Stock Level Bar (Precision Indicator) */}
                  <div className="absolute top-0 left-0 h-1 bg-slate-700 w-full overflow-hidden z-10">
                    <div 
                      className={`h-full transition-all duration-1000 ${product.stock < 5 ? 'bg-red-500' : 'bg-yellow-400'}`} 
                      style={{ width: `${(product.stock / 20) * 100}%` }}
                    ></div>
                  </div>

                  {/* Foreground Content */}
                  <div className="relative z-20">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center font-black text-[10px] text-slate-500 group-hover:text-yellow-400 transition-colors">
                        {idx + 1}
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-black tabular-nums ${product.stock < 5 ? 'text-red-500' : 'text-white'}`}>{product.stock}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-bold text-white text-[11px] line-clamp-1 mb-0.5">{product.name}</h4>
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tight">{product.category}</p>
                    </div>

                    <div className="flex justify-between items-center gap-1.5">
                      <button 
                        onClick={() => handleUpdateStock(product.id, -1)}
                        className="flex-1 py-2 bg-slate-900/80 rounded-lg hover:bg-slate-700 text-slate-400 transition-all border border-slate-700 backdrop-blur-sm"
                      >
                        <svg className="w-3 h-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg>
                      </button>
                      <button 
                        onClick={() => handleUpdateStock(product.id, 1)}
                        className="flex-1 py-2 bg-slate-900/80 rounded-lg hover:bg-slate-700 text-slate-400 transition-all border border-slate-700 backdrop-blur-sm"
                      >
                        <svg className="w-3 h-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                      </button>
                      <button 
                        onClick={() => handleUpdateStock(product.id, 20 - product.stock)}
                        title="Fill to Max"
                        className="w-8 py-2 bg-yellow-400/10 text-yellow-400 rounded-lg hover:bg-yellow-400 hover:text-slate-900 transition-all border border-yellow-400/20 backdrop-blur-sm"
                      >
                        <svg className="w-3 h-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <footer className="h-10 bg-slate-800 border-t border-slate-700 px-10 flex justify-between items-center text-[8px] font-bold uppercase tracking-[0.3em] text-slate-500">
        <div className="flex gap-10">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
            Matrix v1.4.0 (60 Cells Enabled)
          </span>
          <span>Security: TLS 1.3</span>
          <span>Board: LB-140-60S</span>
        </div>
        <div>VendMaster Enterprise</div>
      </footer>
    </div>
  );
};

export default MerchandiserPortal;
