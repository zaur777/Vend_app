
import React from 'react';

interface LauncherProps {
  onSelect: (mode: string) => void;
}

const Launcher: React.FC<LauncherProps> = ({ onSelect }) => {
  const apps = [
    {
      id: 'kiosk',
      name: 'User UI',
      target: 'Raspberry Pi 4',
      description: 'High-fidelity customer interface for 32" touchscreens.',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 21h6l-.75-4M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-blue-600',
      shadow: 'shadow-blue-600/20'
    },
    {
      id: 'admin',
      name: 'Admin Console',
      target: 'Cloud Web',
      description: 'Fleet-wide telemetry, revenue tracking, and AI diagnostics.',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'bg-indigo-600',
      shadow: 'shadow-indigo-600/20'
    },
    {
      id: 'staff',
      name: 'Merchandiser',
      target: 'Mobile Web',
      description: 'Inventory management and hardware sync for service staff.',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'bg-yellow-500',
      shadow: 'shadow-yellow-500/20'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-950 text-white">
      <div className="max-w-6xl w-full">
        <header className="text-center mb-20 animate-fade-up">
          <h1 className="text-6xl font-black tracking-tighter italic mb-4">
            VENDMASTER <span className="text-blue-500 underline underline-offset-8 decoration-4">PRO</span>
          </h1>
          <p className="text-slate-400 text-xl font-medium">Enterprise Vending Infrastructure • v1.4.0</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {apps.map((app, i) => (
            <button
              key={app.id}
              onClick={() => onSelect(app.id)}
              className={`group relative bg-slate-900 border border-slate-800 p-10 rounded-[3rem] text-left transition-all duration-500 hover:scale-[1.02] hover:bg-slate-800/50 hover:border-slate-600 animate-fade-up stagger-${i + 1}`}
            >
              <div className={`w-20 h-20 ${app.color} rounded-3xl flex items-center justify-center mb-8 shadow-2xl ${app.shadow} group-hover:scale-110 transition-transform duration-500`}>
                {app.icon}
              </div>
              <div className="mb-2 flex items-center gap-3">
                <h2 className="text-3xl font-black tracking-tight">{app.name}</h2>
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md text-slate-500">{app.target}</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-lg mb-10">{app.description}</p>
              
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm group-hover:gap-4 transition-all uppercase tracking-widest">
                Launch System
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        <footer className="mt-32 text-center text-slate-600 text-xs font-bold uppercase tracking-[0.5em]">
          Secure Hardware Handshake: Active (LB-140 v1.4.0)
        </footer>
      </div>
    </div>
  );
};

export default Launcher;
