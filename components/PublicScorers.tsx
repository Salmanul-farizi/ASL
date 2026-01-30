
import React, { useState, useEffect } from 'react';
import { dataStore } from '../services/dataStore';
import { Player, Team, Goal, Tournament } from '../types';

const PublicScorers: React.FC = () => {
  const [activeTournament, setActiveTournament] = useState<Tournament | undefined>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    setActiveTournament(dataStore.getActiveTournament());
    setPlayers(dataStore.getPlayers());
    setTeams(dataStore.getTeams());
    setGoals(dataStore.getGoals());
  }, []);

  if (!activeTournament) return null;

  // Process top scorers
  const scorerMap: Record<string, number> = {};
  goals.forEach(g => {
    scorerMap[g.playerId] = (scorerMap[g.playerId] || 0) + 1;
  });

  const sortedScorers = Object.entries(scorerMap)
    .map(([pid, count]) => ({
      player: players.find(p => p.id === pid),
      goals: count,
      team: teams.find(t => t.playerIds.includes(pid))
    }))
    .filter(s => s.player)
    .sort((a,b) => b.goals - a.goals);

  return (
    <div className="space-y-6">
       <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
             <i className="fa-solid fa-futbol text-2xl text-blue-500"></i>
          </div>
          <h2 className="sports-font text-3xl font-bold uppercase text-white">Golden Boot</h2>
          <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Top Goal Scorers</p>
       </div>

       <div className="space-y-3">
         {sortedScorers.length > 0 ? sortedScorers.map((s, i) => (
           <div key={s.player?.id} className="glass-card p-4 rounded-3xl border border-slate-800 flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-8 sports-font font-black text-2xl text-slate-700">{i + 1}</div>
              <img src={s.player?.photo} className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-lg" alt="" />
              <div className="flex-1">
                 <h4 className="font-bold text-white uppercase">{s.player?.name}</h4>
                 <div className="flex items-center gap-2 mt-0.5">
                    <img src={s.team?.logo} className="w-3 h-3 rounded-full" alt="" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{s.team?.name}</span>
                 </div>
              </div>
              <div className="text-right">
                 <div className="text-3xl sports-font font-black text-blue-500">{s.goals}</div>
                 <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Goals</div>
              </div>
           </div>
         )) : (
           <div className="text-center py-20 opacity-30">No goals recorded yet.</div>
         )}
       </div>
    </div>
  );
};

export default PublicScorers;
