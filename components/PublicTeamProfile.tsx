
import React, { useState, useEffect } from 'react';
import { dataStore } from '../services/dataStore';
import { Team, Player } from '../types';

interface TeamProfileProps {
  teamId: string;
  onBack: () => void;
}

const PublicTeamProfile: React.FC<TeamProfileProps> = ({ teamId, onBack }) => {
  const [team, setTeam] = useState<Team | undefined>();
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const teams = dataStore.getTeams();
    const foundTeam = teams.find(t => t.id === teamId);
    setTeam(foundTeam);
    setPlayers(dataStore.getPlayers());
  }, [teamId]);

  if (!team) return null;

  const teamPlayers = players.filter(p => team.playerIds.includes(p.id));
  const captain = players.find(p => p.id === team.captainId);
  const manager = players.find(p => p.id === team.managerId);

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-300 pb-10">
      <button onClick={onBack} className="flex items-center gap-2 text-[#D6FF32] hover:brightness-125 transition-colors text-[10px] font-black uppercase tracking-[0.2em] italic">
        <i className="fa-solid fa-arrow-left"></i> Back to Home
      </button>

      <div className="flex flex-col items-center text-center">
        <div className="relative mb-8 flex items-center justify-center p-6 bg-white/5 rounded-[3rem] border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-[#D6FF32]/10 rounded-full blur-[60px] opacity-30"></div>
          <img src={team.logo} className="w-40 h-40 relative object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]" alt={team.name} />
        </div>
        <h2 className="sports-font text-5xl font-black uppercase italic text-white tracking-tighter mb-4 leading-none">{team.name}</h2>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <div className="glass-card px-6 py-3 rounded-[1.5rem] border border-white/10">
            <span className="block text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Club Captain</span>
            <span className="text-xs font-black text-[#D6FF32] uppercase italic">{captain?.name || 'Unassigned'}</span>
          </div>
          <div className="glass-card px-6 py-3 rounded-[1.5rem] border border-white/10">
            <span className="block text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Head Manager</span>
            <span className="text-xs font-black text-white/70 uppercase italic">{manager?.name || 'Technical Staff'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h3 className="sports-font text-2xl font-black uppercase italic text-[#D6FF32]">Squad Roster</h3>
          <div className="h-[1px] flex-1 bg-white/5"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teamPlayers.length > 0 ? teamPlayers.map(p => (
            <div key={p.id} className="glass-card p-5 rounded-[2rem] border border-white/5 flex items-center gap-4 group hover:border-[#D6FF32]/30 transition-all">
              <div className="relative">
                <img src={p.photo} className="w-16 h-16 rounded-[1.5rem] object-cover border border-white/10 group-hover:scale-105 transition-transform" alt="" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#D6FF32] rounded-lg flex items-center justify-center shadow-lg">
                   <span className="text-[#280D62] font-black sports-font text-sm">#{p.jerseyNumber}</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-black text-white uppercase italic group-hover:text-[#D6FF32] transition-colors">{p.name}</h4>
                <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mt-1">{p.position}</p>
              </div>
            </div>
          )) : (
             <div className="col-span-full py-20 text-center opacity-20 italic font-black uppercase tracking-widest">No players registered for this club</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicTeamProfile;
