
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_MACHINES } from '../constants';
import { Machine, MachineStatus, HardwareLog } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getMaintenanceAdvice, getSystemProvisioningScript } from '../services/geminiService';
import { hardwareService, LB140_COMMANDS } from '../services/hardwareService';

type AdminTab = 'DASHBOARD' | 'PROVISIONING' | 'SETUP_GUIDE';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
  const [machines, setMachines] = useState<Machine[]>(MOCK_MACHINES);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MachineStatus | 'ALL'>('ALL');
  const [aiInsight, setAiInsight] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [hwLogs, setHwLogs] = useState<HardwareLog[]>([]);

  // Provisioning States
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setHwLogs([...hardwareService.getLogs()]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredMachines = useMemo(() => {
    return machines.filter(m => 
      (filter === 'ALL' || m.status === filter) &&
      (m.id.toLowerCase().includes(search.toLowerCase()) || m.location.toLowerCase().includes(search.toLowerCase()))
    );
  }, [machines, search, filter]);

  const stats = useMemo(() => {
    const totalRev = machines.reduce((acc, m) => acc + m.revenue24h, 0);
    const online = machines.filter(m => m.status === MachineStatus.ONLINE).length;
    const errors = machines.filter(m => m.status === MachineStatus.OFFLINE || m.status === MachineStatus.MAINTENANCE).length;
    return { totalRev, online, errors };
  }, [machines]);

  const chartData = [
    { name: 'Mon', revenue: 4200 },
    { name: 'Tue', revenue: 4800 },
    { name: 'Wed', revenue: 3900 },
    { name: 'Thu', revenue: 5600 },
    { name: 'Fri', revenue: 7200 },
    { name: 'Sat', revenue: 8100 },
    { name: 'Sun', revenue: 6400 },
  ];

  const handleGetInsight = async (machine: Machine) => {
    setLoadingAI(true);
    try {
      const res = await getMaintenanceAdvice({
        ...machine,
        hardwareLogs: hardwareService.getLogs().slice(0, 5)
      });
      setAiInsight(res || 'No specific insights available.');
    } catch (err) {
      setAiInsight('Failed to connect to AI engine.');
    }
    setLoadingAI(false);
  };

  const handleStartBuild = async () => {
    setIsBuilding(true);
    setBuildProgress(0);
    setBuildLogs(["[INIT] System Image Builder starting...", "[INFO] Target: Raspberry Pi 4B"]);
    setGeneratedScript(null);
    const steps = [
      { msg: "[FETCH] Downloading Base RPi OS...", p: 15 },
      { msg: "[MOD] Injecting LB-140 Serial Drivers...", p: 40 },
      { msg: "[CONF] Setting Kiosk Autostart...", p: 70 },
      { msg: "[FINAL] Compiling SquashFS...", p: 100 },
    ];
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 800));
      setBuildLogs(prev => [...prev, step.msg]);
      setBuildProgress(step.p);
    }
    const script = await getSystemProvisioningScript({ machineId: 'VM-NEW', display: '32-inch' });
    setGeneratedScript(script);
    setIsBuilding(false);
  };

  const runHardwareTest = (cmd: number) => hardwareService.sendCommand(cmd, [0x01]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-black tracking-tighter italic">VENDMASTER <span className="text-blue-500 underline underline-offset-4 decoration-2">PRO</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('DASHBOARD')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'DASHBOARD' ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Dashboard
          </button>
          <button onClick={() => setActiveTab('PROVISIONING')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'PROVISIONING' ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Provisioning
          </button>
          <button onClick={() => setActiveTab('SETUP_GUIDE')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'SETUP_GUIDE' ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Setup Guide
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 border-b border-slate-200 bg-white flex items-center justify-between px-8 shadow-sm relative z-20">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {activeTab === 'DASHBOARD' ? 'Fleet Control' : activeTab === 'PROVISIONING' ? 'OS Builder' : 'System Setup Instructions'}
          </h2>
          <div className="flex items-center gap-6">
             <div className="relative">
                <input type="text" placeholder="Search machines..." className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
                <svg className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">AD</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {activeTab === 'DASHBOARD' && (
            <div className="space-y-8 animate-fade-up">
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: 'Revenue 24h', value: `$${stats.totalRev.toLocaleString()}`, color: 'blue' },
                  { label: 'Uptime', value: '99.8%', color: 'green' },
                  { label: 'Active RPI4s', value: stats.online, color: 'indigo' },
                  { label: 'System Errors', value: stats.errors, color: 'orange' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl transition-all cursor-default">
                    <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">{stat.label}</p>
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 12l3-3 3 3 4-4" /></svg>
                    Network Sales Performance
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                        <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-800 flex flex-col">
                   <h3 className="text-white font-black mb-6 flex items-center gap-3">
                     <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
                     Live UART Bus (LB-140)
                   </h3>
                   <div className="flex-1 font-mono text-[10px] space-y-3 overflow-y-auto max-h-[300px] pr-4 scrollbar-hide">
                     {hwLogs.length > 0 ? hwLogs.map((log, i) => (
                       <div key={i} className={`p-3 rounded-2xl border border-white/5 transition-all ${log.direction === 'OUT' ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
                         <div className="flex justify-between items-center mb-1">
                           <span className={`font-black ${log.direction === 'OUT' ? 'text-blue-400' : 'text-green-400'}`}>{log.direction} &raquo; {log.description}</span>
                           <span className="text-white/20 text-[8px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                         </div>
                         <code className="text-white/40 block break-all leading-tight">{log.payload}</code>
                       </div>
                     )) : (
                       <div className="h-full flex items-center justify-center text-slate-600 italic text-center">Awaiting serial communication...</div>
                     )}
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'PROVISIONING' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <h3 className="text-3xl font-black mb-4 tracking-tighter">New Machine Deployment</h3>
                <p className="text-slate-500 mb-10 leading-relaxed text-lg">Generate a custom OS image for Raspberry Pi 4 equipped with 32" touchscreens and LB-140 board serial drivers.</p>
                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="space-y-6">
                    <label className="block">
                      <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Target ID</span>
                      <input type="text" placeholder="VM-999" className="mt-2 block w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Screen Orientation</span>
                      <select className="mt-2 block w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold">
                        <option>32-inch Portrait (Touch)</option>
                        <option>32-inch Landscape (Touch)</option>
                      </select>
                    </label>
                  </div>
                  <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100 flex flex-col justify-center">
                    <p className="text-sm font-bold text-blue-700 leading-relaxed">
                      Our Provisioning Engine builds a security-hardened Raspberry Pi image with MDB Serial bridge support pre-configured for the LB-140 board.
                    </p>
                  </div>
                </div>
                <button onClick={handleStartBuild} disabled={isBuilding} className={`w-full py-6 rounded-3xl font-black text-xl transition-all shadow-2xl flex items-center justify-center gap-4 ${isBuilding ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}>
                  {isBuilding ? <span className="w-6 h-6 border-3 border-slate-400 border-t-transparent rounded-full animate-spin"></span> : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>}
                  {isBuilding ? `BUILDING IMAGE (${buildProgress}%)` : 'GENERATE PRODUCTION IMAGE'}
                </button>
              </div>
              {buildLogs.length > 0 && (
                <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl border border-slate-800">
                  <h4 className="text-xs font-black uppercase text-blue-400 mb-6 tracking-widest">Build Terminal Output</h4>
                  <div className="font-mono text-[11px] text-slate-400 space-y-2 max-h-60 overflow-y-auto pr-4 scrollbar-hide">
                    {buildLogs.map((log, i) => <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300"> <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span> {log} </div>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'SETUP_GUIDE' && (
            <div className="max-w-5xl mx-auto space-y-12 animate-fade-up">
              <section className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tight text-slate-900">Hardware Integration</h3>
                    <p className="text-slate-500 font-medium">Connecting Raspberry Pi 4 to the LB-140 Control Board</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Wiring Diagram (UART)</h4>
                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 font-mono text-sm space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                        <span className="font-bold text-slate-400">RPI4 Pin 8 (TXD)</span>
                        <span className="text-blue-500">&rarr;</span>
                        <span className="font-bold text-slate-800">LB-140 J5 Pin 2 (RX)</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                        <span className="font-bold text-slate-400">RPI4 Pin 10 (RXD)</span>
                        <span className="text-blue-500">&rarr;</span>
                        <span className="font-bold text-slate-800">LB-140 J5 Pin 3 (TX)</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                        <span className="font-bold text-slate-400">RPI4 Pin 6 (GND)</span>
                        <span className="text-blue-500">&rarr;</span>
                        <span className="font-bold text-slate-800">LB-140 J5 Pin 5 (GND)</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed italic">
                      Note: The LB-140 board uses 5V logic for UART. A level shifter (5V to 3.3V) is mandatory for Pin 10 (RXD) to avoid damaging the Raspberry Pi GPIO.
                    </p>
                  </div>
                  <div className="space-y-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Pin Layout Description</h4>
                    <ul className="space-y-4">
                      {[
                        { title: 'UART Speed', desc: 'Configure serial port for 9600 baud, 8-N-1.' },
                        { title: 'Input Power', desc: 'LB-140 requires 24V DC from MDB PSU.' },
                        { title: 'Touch USB', desc: 'Connect 32" Display touch controller to RPI4 USB 3.0 port.' }
                      ].map((item, i) => (
                        <li key={i} className="flex gap-4">
                           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                           <div>
                             <p className="font-bold text-slate-800 text-sm">{item.title}</p>
                             <p className="text-slate-500 text-xs">{item.desc}</p>
                           </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section className="bg-slate-900 p-12 rounded-[3rem] shadow-2xl border border-slate-800 text-white">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tight">Software Environment</h3>
                    <p className="text-slate-400 font-medium">OS Setup & Production Server Config</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12">
                   <div className="space-y-8">
                      <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">1. OS Configuration</h4>
                      <div className="bg-black/50 p-6 rounded-[2rem] border border-white/5 font-mono text-[11px] leading-relaxed text-slate-400">
                        <p># Disable Serial Console in /boot/cmdline.txt</p>
                        <p># Enable UART in /boot/config.txt</p>
                        <code className="text-blue-400 block my-2">enable_uart=1</code>
                        <p># Install Node.js (v18+) and Chromium</p>
                        <code className="text-green-400 block my-2">curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -</code>
                        <code className="text-green-400 block">sudo apt-get install -y nodejs chromium-browser x11-xserver-utils</code>
                      </div>
                   </div>
                   <div className="space-y-8">
                      <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">2. Kiosk Autostart</h4>
                      <div className="bg-black/50 p-6 rounded-[2rem] border border-white/5 font-mono text-[11px] leading-relaxed text-slate-400">
                        <p># Add to ~/.config/lxsession/LXDE-pi/autostart</p>
                        <code className="text-blue-400 block my-2">@xset s off</code>
                        <code className="text-blue-400 block my-2">@xset -dpms</code>
                        <code className="text-blue-400 block my-2">@xset s noblank</code>
                        <code className="text-blue-400 block">@chromium-browser --kiosk --incognito http://localhost:3000</code>
                      </div>
                   </div>
                </div>
              </section>

              <section className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-16 h-16 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tight text-slate-900">Database & Persistence</h3>
                    <p className="text-slate-500 font-medium">Relational Schema for Fleet Management</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 space-y-10">
                   <div className="grid grid-cols-2 gap-10">
                      <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Schema Definition (PostgreSQL)</h4>
                        <div className="font-mono text-[10px] text-slate-600 bg-white p-6 rounded-2xl border border-slate-200">
                          <pre className="whitespace-pre-wrap">
{`CREATE TABLE machines (
  id VARCHAR(20) PRIMARY KEY,
  location TEXT NOT NULL,
  status VARCHAR(20),
  last_sync TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  machine_id VARCHAR(20) REFERENCES machines(id),
  slot_number INT CHECK (slot_number BETWEEN 1 AND 60),
  product_name TEXT,
  stock_level INT DEFAULT 0,
  max_stock INT DEFAULT 20
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id VARCHAR(20) REFERENCES machines(id),
  product_name TEXT,
  amount NUMERIC(10,2),
  payment_method VARCHAR(20),
  timestamp TIMESTAMP DEFAULT NOW()
);`}
                          </pre>
                        </div>
                      </div>
                      <div className="space-y-8">
                         <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <h5 className="font-black text-slate-800 text-sm mb-2">Edge Persistence</h5>
                            <p className="text-xs text-slate-500 leading-relaxed">
                               For local kiosk data, use <strong>SQLite</strong>. For fleet-wide synchronization, deploy a centralized <strong>PostgreSQL</strong> or <strong>Redis</strong> instance with a Node.js REST API layer using WebSockets for real-time status updates.
                            </p>
                         </div>
                         <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <h5 className="font-black text-slate-800 text-sm mb-2">API Security</h5>
                            <p className="text-xs text-slate-500 leading-relaxed">
                               Encrypt the <code>process.env.API_KEY</code> on the server-side. Do not expose the Google GenAI key directly to client browsers; route AI requests through a secure proxy endpoint on your backend to prevent key exhaustion.
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      {selectedMachine && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-8">
          <div className="bg-white w-full max-w-6xl rounded-[3rem] overflow-hidden shadow-3xl flex h-[85vh] animate-in zoom-in duration-300">
            <div className="flex-[1.5] flex flex-col p-12 border-r border-slate-100 overflow-y-auto">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{selectedMachine.id}</h2>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Firmware: v1.4.0-LB140-60S</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => runHardwareTest(LB140_COMMANDS.RESET)} className="px-6 py-2 bg-red-50 text-red-600 rounded-2xl text-xs font-black border border-red-100 hover:bg-red-600 hover:text-white transition-all flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Hard Reboot
                  </button>
                  <button onClick={() => {setSelectedMachine(null); setAiInsight('');}} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                   <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">LB-140 Low-Level Debug</h4>
                   <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => runHardwareTest(LB140_COMMANDS.STATUS)} className="bg-white p-3 rounded-2xl text-xs font-black border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all">Bus Status</button>
                     <button onClick={() => runHardwareTest(LB140_COMMANDS.TEMP)} className="bg-white p-3 rounded-2xl text-xs font-black border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all">Read Sensors</button>
                     <button onClick={() => runHardwareTest(LB140_COMMANDS.MOTOR_TEST)} className="bg-white p-3 rounded-2xl text-xs font-black border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all col-span-2">Cycle 60 Motors</button>
                   </div>
                </div>
                <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100">
                   <h4 className="text-[10px] font-black uppercase text-blue-400 mb-6 tracking-widest">RPI4 Environment</h4>
                   <div className="space-y-3 text-xs">
                     <div className="flex justify-between font-mono"> <span className="text-slate-400">LOAD:</span> <span className="text-blue-700 font-black">0.45 0.32</span> </div>
                     <div className="flex justify-between font-mono"> <span className="text-slate-400">MEM:</span> <span className="text-blue-700 font-black">1.2GB / 4GB</span> </div>
                     <div className="flex justify-between font-mono"> <span className="text-slate-400">BUS:</span> <span className="text-green-600 font-black">CONNECTED (60S)</span> </div>
                   </div>
                </div>
              </div>
              <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Motor / Coil Matrix</h4>
              <div className="grid grid-cols-10 gap-3 overflow-y-auto pr-2 pb-8 scrollbar-hide">
                {Array.from({ length: 60 }).map((_, i) => (
                  <button key={i} onClick={() => hardwareService.dispenseItem(i + 1)} className="aspect-square bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center group hover:bg-blue-600 hover:border-blue-600 transition-all shadow-sm hover:shadow-blue-600/20">
                    <span className="text-[8px] font-black text-slate-400 group-hover:text-blue-200">{i + 1}</span>
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-white mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 bg-slate-900 text-white p-12 flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-4 mb-10 relative z-10">
                 <div className="w-12 h-12 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 </div>
                 <h3 className="text-2xl font-black tracking-tight">AI Fleet Insight</h3>
              </div>
              <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 overflow-y-auto mb-10 text-slate-300 leading-relaxed italic text-sm scrollbar-hide">
                {loadingAI ? (
                  <div className="flex flex-col items-center justify-center h-full gap-6 text-slate-500">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-bold tracking-widest uppercase text-[10px] animate-pulse">Consulting Gemini Neural Engine...</p>
                  </div>
                ) : aiInsight ? (
                  <div className="whitespace-pre-wrap font-medium">{aiInsight}</div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-40 px-10">
                    <svg className="w-20 h-20 mb-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    <p className="text-lg">Run smart diagnostics to generate predictive maintenance reports based on UART bus telemetry.</p>
                  </div>
                )}
              </div>
              <button onClick={() => handleGetInsight(selectedMachine)} disabled={loadingAI} className="w-full py-6 bg-blue-600 hover:bg-blue-500 rounded-3xl text-xl font-black transition-all shadow-2xl shadow-blue-600/20 active:scale-95 disabled:opacity-50">
                {loadingAI ? 'PROCESSING...' : 'ANALYZE TELEMETRY'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
