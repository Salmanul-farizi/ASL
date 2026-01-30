
import React, { useState, useEffect } from 'react';
import { dataStore } from '../services/dataStore';
import { Match, Team, Tournament } from '../types';

const PublicFixtures: React.FC = () => {
  const [activeTournament, setActiveTournament] = useState<Tournament | undefined>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [filter, setFilter] = useState<'all' | 'live' | 'completed' | 'upcoming'>('all');

  useEffect(() => {
    setActiveTournament(dataStore.getActiveTournament());
    setMatches(dataStore.getMatches());
    setTeams(dataStore.getTeams());
  }, []);

  const tourMatches = matches.filter(m => m.tournamentId === activeTournament?.id);
  const filteredMatches = tourMatches.filter(m => {
    if (filter === 'all') return true;
    return m.status.toLowerCase() === filter;
  }).sort((a,b) => b.scheduledAt.localeCompare(a.scheduledAt));

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'live', label: 'Live' },
    { id: 'completed', label: 'Results' },
    { id: 'upcoming', label: 'Upcoming' }
  ];

  if (!activeTournament) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`flex-shrink-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f.id ? 'bg-[#D6FF32] text-[#280D62] shadow-lg shadow-[#D6FF32]/20' : 'bg-[#3e2085] text-white/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredMatches.length > 0 ? filteredMatches.map(match => {
          const teamA = teams.find(t => t.id === match.teamAId);
          const teamB = teams.find(t => t.id === match.teamBId);
          return (
            <div key={match.id} className={`glass-card p-6 rounded-[2rem] border border-white/5 ${match.status === 'Live' ? 'border-[#D6FF32]/40' : ''}`}>
              <div className="text-center mb-5">
                 <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] bg-[#280D62] px-4 py-1.5 rounded-full border border-white/5">
                    {new Date(match.scheduledAt).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })} • {new Date(match.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col items-center gap-3 w-5/12 overflow-hidden">
                  <div className="w-14 h-14 flex items-center justify-center">
                    <img src={teamA?.logo} className="max-w-full max-h-full object-contain drop-shadow-lg" alt="" />
                  </div>
                  <span className="font-black text-[11px] uppercase italic text-white/90 truncate w-full text-center">{teamA?.name}</span>
                </div>
                <div className="w-2/12 text-center">
                  <div className="text-3xl sports-font font-black italic text-white">
                    {match.status === 'Upcoming' ? 'VS' : `${match.scoreA}:${match.scoreB}`}
                  </div>
                  {match.status === 'Live' && (
                     <div className="bg-[#D6FF32] text-[#280D62] text-[8px] font-black px-2 py-0.5 rounded uppercase italic mt-1 animate-pulse">Live</div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-3 w-5/12 overflow-hidden">
                  <div className="w-14 h-14 flex items-center justify-center">
                    <img src={teamB?.logo} className="max-w-full max-h-full object-contain drop-shadow-lg" alt="" />
                  </div>
                  <span className="font-black text-[11px] uppercase italic text-white/90 truncate w-full text-center">{teamB?.name}</span>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-20 opacity-30 italic font-black uppercase tracking-widest text-xs">No entries in this category</div>
        )}
      </div>
    </div>
  );
};

export default PublicFixtures;
