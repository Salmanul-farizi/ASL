
import React, { useState, useEffect } from 'react';
import { dataStore } from '../services/dataStore';
import { Tournament, Match, Team } from '../types';

interface PublicHomeProps {
  onTeamClick: (id: string) => void;
}

const PublicHome: React.FC<PublicHomeProps> = ({ onTeamClick }) => {
  const [activeTournament, setActiveTournament] = useState<Tournament | undefined>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    setActiveTournament(dataStore.getActiveTournament());
    setMatches(dataStore.getMatches());
    setTeams(dataStore.getTeams());
  }, []);

  const liveMatch = matches.find(m => m.status === 'Live' && m.tournamentId === activeTournament?.id);
  const completedMatches = matches
    .filter(m => m.status === 'Completed' && m.tournamentId === activeTournament?.id)
    .sort((a,b) => b.scheduledAt.localeCompare(a.scheduledAt))
    .slice(0, 2);

  if (!activeTournament) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-[#3e2085]/50 rounded-full flex items-center justify-center mb-8 border border-[#D6FF32]/20">
          <i className="fa-solid fa-trophy text-[#D6FF32] text-5xl"></i>
        </div>
        <h2 className="sports-font text-3xl font-black text-white">Off-Season</h2>
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-4">Scouting in progress. Stay tuned for ASL 2026.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom duration-700">
      {/* Live Match Hero */}
      {liveMatch && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-[#D6FF32] rounded-full animate-ping"></span>
            <h3 className="text-[10px] font-black text-[#D6FF32] uppercase tracking-[0.3em]">Live Broadcast</h3>
          </div>
          <div className="glass-card p-8 rounded-[2.5rem] border-2 border-[#D6FF32]/40 bg-gradient-to-br from-[#3e2085] to-[#280D62] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between gap-4">
              <div className="text-center w-5/12 cursor-pointer group" onClick={() => onTeamClick(liveMatch.teamAId)}>
                <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-full overflow-hidden">
                  {teams.find(t => t.id === liveMatch.teamAId)?.logo ? (
                    <img src={teams.find(t => t.id === liveMatch.teamAId)?.logo} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-all drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" alt="" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#D6FF32] flex items-center justify-center group-hover:scale-110 transition-all shadow-2xl">
                      <span className="sports-font text-3xl font-black text-[#280D62]">
                        {teams.find(t => t.id === liveMatch.teamAId)?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <h4 className="sports-font text-lg font-black text-white leading-tight">{teams.find(t => t.id === liveMatch.teamAId)?.name}</h4>
              </div>
              <div className="text-center w-2/12 flex flex-col items-center">
                <div className="text-4xl sports-font font-black tracking-tighter text-[#D6FF32]">
                  {liveMatch.scoreA}:{liveMatch.scoreB}
                </div>
                <div className="bg-[#D6FF32] text-[#280D62] text-[9px] font-black px-3 py-1 rounded-full uppercase mt-3 inline-block shadow-lg">LIVE</div>
              </div>
              <div className="text-center w-5/12 cursor-pointer group" onClick={() => onTeamClick(liveMatch.teamBId)}>
                <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-full overflow-hidden">
                  {teams.find(t => t.id === liveMatch.teamBId)?.logo ? (
                    <img src={teams.find(t => t.id === liveMatch.teamBId)?.logo} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-all drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" alt="" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#D6FF32] flex items-center justify-center group-hover:scale-110 transition-all shadow-2xl">
                      <span className="sports-font text-3xl font-black text-[#280D62]">
                        {teams.find(t => t.id === liveMatch.teamBId)?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <h4 className="sports-font text-lg font-black text-white leading-tight">{teams.find(t => t.id === liveMatch.teamBId)?.name}</h4>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Results Section */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Latest Results</h3>
        {completedMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedMatches.map(match => (
              <div key={match.id} className="glass-card p-5 rounded-3xl border border-[#D6FF32]/10 hover:border-[#D6FF32]/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 w-5/12 overflow-hidden">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden">
                      {teams.find(t => t.id === match.teamAId)?.logo ? (
                        <img src={teams.find(t => t.id === match.teamAId)?.logo} className="max-w-full max-h-full object-contain" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#D6FF32] flex items-center justify-center">
                          <span className="sports-font text-sm font-black text-[#280D62]">
                            {teams.find(t => t.id === match.teamAId)?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="sports-font text-[10px] text-white/80 truncate">{teams.find(t => t.id === match.teamAId)?.name}</span>
                  </div>
                  <div className="text-xl sports-font font-black text-[#D6FF32] w-2/12 text-center">
                     {match.scoreA}:{match.scoreB}
                  </div>
                  <div className="flex items-center justify-end gap-3 w-5/12 text-right overflow-hidden">
                    <span className="sports-font text-[10px] text-white/80 truncate">{teams.find(t => t.id === match.teamBId)?.name}</span>
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden">
                      {teams.find(t => t.id === match.teamBId)?.logo ? (
                        <img src={teams.find(t => t.id === match.teamBId)?.logo} className="max-w-full max-h-full object-contain" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#D6FF32] flex items-center justify-center">
                          <span className="sports-font text-sm font-black text-[#280D62]">
                            {teams.find(t => t.id === match.teamBId)?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
           <div className="glass-card p-6 rounded-3xl border border-dashed border-white/10 text-center text-white/20 text-[10px] font-bold uppercase tracking-widest">No stats recorded</div>
        )}
      </section>

      {/* Clubs Gallery */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">The Clubs</h3>
          <span className="text-[9px] font-black text-[#D6FF32] uppercase">ASL 2026</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide px-2">
          {activeTournament.teamIds.map(tid => {
            const team = teams.find(t => t.id === tid);
            return (
              <div 
                key={tid} 
                onClick={() => onTeamClick(tid)}
                className="flex-shrink-0 w-36 glass-card p-6 rounded-[2.5rem] border border-white/5 text-center cursor-pointer hover:border-[#D6FF32] transition-all group active:scale-95 shadow-lg flex flex-col items-center"
              >
                <div className="w-20 h-20 mb-4 flex items-center justify-center relative rounded-full overflow-hidden">
                   <div className="absolute inset-0 bg-[#D6FF32] rounded-full blur-xl opacity-0 group-hover:opacity-20 transition-all"></div>
                   {team?.logo ? (
                     <img src={team?.logo} className="max-w-full max-h-full object-contain relative drop-shadow-lg group-hover:scale-110 transition-transform" alt="" />
                   ) : (
                     <div className="w-20 h-20 rounded-full bg-[#D6FF32] flex items-center justify-center relative group-hover:scale-110 transition-transform shadow-lg">
                       <span className="sports-font text-2xl font-black text-[#280D62]">
                         {team?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                       </span>
                     </div>
                   )}
                </div>
                <h4 className="sports-font text-xs text-white truncate w-full">{team?.name}</h4>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default PublicHome;
