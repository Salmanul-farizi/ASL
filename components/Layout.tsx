
import React, { useState, useEffect } from 'react';
import { dataStore } from '../services/dataStore';

interface LayoutProps {
  children: React.ReactNode;
  isAdmin: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, isAdmin, activeTab, setActiveTab, onLogout }) => {
  const [activeTournament, setActiveTournament] = useState(dataStore.getActiveTournament());

  useEffect(() => {
    setActiveTournament(dataStore.getActiveTournament());
  }, [activeTab]);

  const navItems = isAdmin 
    ? [
        { id: 'dashboard', icon: 'fa-chart-pie', label: 'Stats' },
        { id: 'teams', icon: 'fa-shield-halved', label: 'Teams' },
        { id: 'matches', icon: 'fa-futbol', label: 'Fixtures' },
        { id: 'table', icon: 'fa-list-ol', label: 'Table' },
        { id: 'news', icon: 'fa-square-plus', label: 'Posts' }
      ]
    : [
        { id: 'home', icon: 'fa-house', label: 'Home' },
        { id: 'fixtures', icon: 'fa-futbol', label: 'Matches' },
        { id: 'table', icon: 'fa-list-ol', label: 'Standings' },
        { id: 'news', icon: 'fa-newspaper', label: 'News' }
      ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card px-4 py-4 flex items-center justify-between border-b border-[#D6FF32]/20">
        <div className="flex items-center gap-4">
          <img src="/logos/logo2.svg" alt="ASL Logo" className="h-14 w-auto" />
        </div>
        
        {isAdmin && (
          <button 
            onClick={onLogout}
            className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-28 p-4 max-w-5xl mx-auto w-full relative">
        {!isAdmin && activeTournament && activeTab === 'home' && (
          <div className="mb-8 rounded-[2.5rem] overflow-hidden relative h-48 shadow-2xl border border-[#D6FF32]/20 group">
            <img src={activeTournament.banner || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&h=400&fit=crop&crop=center&auto=format&q=80'} alt="Stadium" className="w-full h-full object-cover brightness-[0.6] group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#280D62] via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-8 right-8 flex items-end gap-6">
              <div className="w-20 h-20 flex items-center justify-center">
                {activeTournament.logo ? (
                  <img src={activeTournament.logo} alt="Logo" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#D6FF32] flex items-center justify-center shadow-2xl">
                    <span className="sports-font text-2xl font-black text-[#280D62]">
                      {activeTournament.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="sports-font text-2xl font-black text-white leading-none drop-shadow-lg tracking-tight">
                  {activeTournament.name}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                   <span className="w-2 h-2 bg-[#D6FF32] rounded-full animate-pulse"></span>
                   <p className="text-[#D6FF32] text-[10px] font-black uppercase tracking-[0.2em]">{activeTournament.location}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {children}
      </main>

      {/* Bottom Navigation - Standard Fixed Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1a0840] border-t border-[#D6FF32]/20 z-50 shadow-2xl">
        <div className="flex justify-around items-center px-4 py-4 max-w-screen-md mx-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'text-[#D6FF32]' 
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <i className={`fa-solid ${item.icon} text-xl`}></i>
              <span className="text-[10px] font-bold uppercase tracking-wide">{item.label}</span>
              {activeTab === item.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#D6FF32] rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
