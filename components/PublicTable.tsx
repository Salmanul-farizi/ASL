
import React, { useState, useEffect } from 'react';
import { dataStore } from '../services/dataStore';
import { Tournament, Team, Match, PointsTableRow, TournamentType, Player, Goal } from '../types';

const PublicTable: React.FC = () => {
  const [activeTournament, setActiveTournament] = useState<Tournament | undefined>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    setActiveTournament(dataStore.getActiveTournament());
    setTeams(dataStore.getTeams());
    setMatches(dataStore.getMatches());
    setPlayers(dataStore.getPlayers());
    setGoals(dataStore.getGoals());
  }, []);

  if (!activeTournament || activeTournament.type !== TournamentType.LEAGUE) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
        <i className="fa-solid fa-circle-exclamation text-4xl mb-4 text-[#D6FF32]"></i>
        <p className="sports-font text-white/50">Standings unavailable for this format.</p>
      </div>
    );
  }

  const calculateTable = (): PointsTableRow[] => {
    const table: Record<string, PointsTableRow> = {};
    activeTournament.teamIds.forEach(tid => {
      table[tid] = {
        teamId: tid, played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
      };
    });

    const completedMatches = matches.filter(m => m.tournamentId === activeTournament.id && m.status === 'Completed');
    completedMatches.forEach(m => {
      const rowA = table[m.teamAId];
      const rowB = table[m.teamBId];
      if (!rowA || !rowB) return;
      rowA.played++; rowB.played++;
      rowA.goalsFor += m.scoreA; rowA.goalsAgainst += m.scoreB;
      rowB.goalsFor += m.scoreB; rowB.goalsAgainst += m.scoreA;
      if (m.scoreA > m.scoreB) { rowA.won++; rowA.points += 3; rowB.lost++; }
      else if (m.scoreA < m.scoreB) { rowB.won++; rowB.points += 3; rowA.lost++; }
      else { rowA.drawn++; rowA.points += 1; rowB.drawn++; rowB.points += 1; }
    });

    return Object.values(table).map(r => ({ ...r, goalDifference: r.goalsFor - r.goalsAgainst }))
      .sort((a,b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });
  };

  const tableData = calculateTable();

  // Scorer logic
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
    .sort((a,b) => b.goals - a.goals)
    .slice(0, 5);

  return (
    <div className="space-y-12">
      <div className="glass-card rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
        <div className="bg-[#3e2085]/50 p-6 border-b border-white/5">
          <h3 className="sports-font text-xl font-black text-[#D6FF32]">Standings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#280D62] text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                <th className="px-6 py-4 w-12 text-center">Pos</th>
                <th className="px-6 py-4">Club</th>
                <th className="px-6 py-4 text-center">P</th>
                <th className="px-6 py-4 text-center">GD</th>
                <th className="px-6 py-4 text-center">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tableData.map((row, i) => {
                const team = teams.find(t => t.id === row.teamId);
                return (
                  <tr key={row.teamId} className={`${i === 0 ? 'bg-[#D6FF32]/5' : ''} hover:bg-white/5 transition-colors`}>
                    <td className="px-6 py-5 text-center font-black sports-font text-white/20">
                      {i + 1}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 flex items-center justify-center overflow-visible">
                          <img src={team?.logo} className="max-w-full max-h-full object-contain" alt="" />
                        </div>
                        <span className="font-black text-[11px] sports-font text-white/90 truncate">{team?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center font-black text-white/50 text-xs">{row.played}</td>
                    <td className="px-6 py-5 text-center font-black text-white/50 text-xs">
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </td>
                    <td className="px-6 py-5 text-center font-black text-[#D6FF32] text-xl sports-font">{row.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Scorers Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 px-2">
           <h3 className="sports-font text-lg font-black text-[#D6FF32]">Top Scorers</h3>
           <div className="h-[1px] flex-1 bg-white/10"></div>
        </div>
        <div className="space-y-3">
          {sortedScorers.length > 0 ? sortedScorers.map((s, i) => (
            <div key={s.player?.id} className="glass-card p-4 rounded-3xl border border-white/5 flex items-center gap-4 relative overflow-hidden group">
               <div className="w-8 sports-font font-black text-xl text-white/10">{i + 1}</div>
               <img src={s.player?.photo} className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-lg" alt="" />
               <div className="flex-1">
                  <h4 className="font-black text-sm text-white sports-font">{s.player?.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                     <img src={s.team?.logo} className="w-3 h-3 rounded-full" alt="" />
                     <span className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">{s.team?.name}</span>
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-2xl sports-font font-black italic text-[#D6FF32]">{s.goals}</div>
                  <div className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">Goals</div>
               </div>
            </div>
          )) : (
            <div className="text-center py-10 opacity-30 italic text-xs uppercase font-bold tracking-widest">Awaiting match statistics</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PublicTable;
