
import React, { useState, useEffect } from 'react';
import { dataStore } from '../services/dataStore';
import { Tournament, TournamentType, Team, Match } from '../types';

const TOURNAMENT_TYPES = Object.values(TournamentType);

const AdminDashboard: React.FC = () => {
  const [players, setPlayers] = useState(dataStore.getPlayers());
  const [teams, setTeams] = useState<Team[]>(dataStore.getTeams());
  const [tournaments, setTournaments] = useState<Tournament[]>(dataStore.getTournaments());
  const [activeTournament, setActiveTournament] = useState(dataStore.getActiveTournament());
  const [matches, setMatches] = useState<Match[]>(dataStore.getMatches());
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: TournamentType.LEAGUE,
    startDate: '',
    endDate: '',
    location: '',
    logo: '/logos/favicon.svg',
    banner: '/images/football.jpg',
    teamIds: [] as string[]
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setPlayers(dataStore.getPlayers());
    setTeams(dataStore.getTeams());
    setTournaments(dataStore.getTournaments());
    setActiveTournament(dataStore.getActiveTournament());
    setMatches(dataStore.getMatches());
  };

  const liveMatch = matches.find(m => m.status === 'Live');

  const stats = [
    { label: 'Players', value: players.length, icon: 'fa-users', color: '#D6FF32' },
    { label: 'Teams', value: teams.length, icon: 'fa-shield-halved', color: '#D6FF32' },
    { label: 'Tournaments', value: tournaments.length, icon: 'fa-trophy', color: '#D6FF32' },
    { label: 'Live', value: liveMatch ? 'ACTIVE' : 'NONE', icon: 'fa-tower-broadcast', color: liveMatch ? '#ff4d4d' : '#D6FF32' }
  ];

  const resetForm = () => {
    setFormData({ name: '', type: TournamentType.LEAGUE, startDate: '', endDate: '', location: '', logo: '/logos/favicon.svg', banner: '/images/football.jpg', teamIds: [] });
    setShowTournamentForm(false);
    setEditingTournament(null);
  };

  const handleEditTournament = (t: Tournament) => {
    setEditingTournament(t);
    setFormData({
      name: t.name,
      type: t.type,
      startDate: t.startDate,
      endDate: t.endDate,
      location: t.location,
      logo: t.logo,
      banner: t.banner,
      teamIds: t.teamIds
    });
    setShowTournamentForm(true);
  };

  const handleToggleTeam = (teamId: string) => {
    setFormData(prev => ({
      ...prev,
      teamIds: prev.teamIds.includes(teamId)
        ? prev.teamIds.filter(id => id !== teamId)
        : [...prev.teamIds, teamId]
    }));
  };

  const handleSaveTournament = () => {
    if (!formData.name.trim()) return alert('Tournament name is required');

    if (editingTournament) {
      const updated = tournaments.map(t =>
        t.id === editingTournament.id
          ? { ...t, ...formData }
          : t
      );
      dataStore.saveTournaments(updated);
      setTournaments(updated);
    } else {
      const newTournament: Tournament = {
        id: `t${Date.now()}`,
        ...formData,
        isActive: tournaments.length === 0
      };
      const updated = [...tournaments, newTournament];
      dataStore.saveTournaments(updated);
      setTournaments(updated);
    }
    resetForm();
    refreshData();
  };

  const handleActivate = (id: string) => {
    const updated = tournaments.map(t => ({ ...t, isActive: t.id === id }));
    dataStore.saveTournaments(updated);
    setTournaments(updated);
    setActiveTournament(updated.find(t => t.id === id));
    // Refresh all data to ensure consistency
    refreshData();
  };

  const handleDeleteTournament = (id: string) => {
    if (!confirm('Delete this tournament? All related matches will be removed.')) return;
    const updatedTournaments = tournaments.filter(t => t.id !== id);
    const updatedMatches = matches.filter(m => m.tournamentId !== id);
    dataStore.saveTournaments(updatedTournaments);
    dataStore.saveMatches(updatedMatches);
    setTournaments(updatedTournaments);
    setMatches(updatedMatches);
    refreshData();
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl sports-font font-black uppercase italic text-white leading-none">Management</h2>
          <p className="text-[#D6FF32]/50 text-xs font-bold uppercase tracking-[0.3em] mt-2 ml-1">ASL System Administration</p>
        </div>
        {activeTournament && (
          <div className="bg-[#D6FF32]/10 border border-[#D6FF32]/30 px-6 py-2 rounded-full flex items-center gap-3">
            <span className="w-2 h-2 bg-[#D6FF32] rounded-full animate-pulse shadow-[0_0_10px_#D6FF32]"></span>
            <span className="text-[10px] font-black text-[#D6FF32] uppercase tracking-widest">{activeTournament.name}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-4 rounded-2xl hover:border-[#D6FF32]/40 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
              <i className={`fa-solid ${stat.icon} text-4xl`}></i>
            </div>
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center mb-3">
              <i className={`fa-solid ${stat.icon} text-sm`} style={{ color: stat.color }}></i>
            </div>
            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl sports-font font-black text-white italic">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tournament Management Section */}
      <div className="glass-card p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="sports-font text-lg font-black flex items-center gap-2 text-[#D6FF32]">
            <i className="fa-solid fa-trophy"></i>
            Tournaments
          </h3>
          <button
            onClick={() => {
              if (showTournamentForm) {
                resetForm();
              } else {
                setShowTournamentForm(true);
                setEditingTournament(null);
                setFormData({ name: '', type: TournamentType.LEAGUE, startDate: '', endDate: '', location: '', logo: '', banner: '/images/football.jpg', teamIds: [] });
              }
            }}
            className="bg-[#D6FF32] text-[#280D62] px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 text-xs hover:bg-[#e8ff66] transition-colors"
          >
            <i className={`fa-solid ${showTournamentForm ? 'fa-xmark' : 'fa-plus'}`}></i> {showTournamentForm ? 'Cancel' : 'New'}
          </button>
        </div>

        {showTournamentForm && (
          <div className="mb-4 p-4 bg-slate-800/50 rounded-xl border border-[#D6FF32]/20 space-y-3">
            {/* Logo & Banner Upload */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <label className="text-[9px] font-bold text-slate-500 uppercase mb-1">Logo</label>
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-slate-700 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden">
                    {formData.logo ? (
                      <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <i className="fa-solid fa-trophy text-lg text-slate-600"></i>
                    )}
                  </div>

                  {/* Upload Button */}
                  <label className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#D6FF32] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#e8ff66]">
                    <i className="fa-solid fa-camera text-[#280D62] text-[8px]"></i>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setFormData({ ...formData, logo: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  {/* Remove Button - only show when there's an image */}
                  {formData.logo && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: '/logos/favicon.svg' })}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 text-white shadow-lg"
                      title="Reset to default logo"
                    >
                      <i className="fa-solid fa-xmark text-[8px]"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase mb-1">Banner</label>
                <div className="relative flex-1">
                  <div className="h-14 rounded-xl bg-slate-700 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden">
                    {formData.banner ? (
                      <img src={formData.banner} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-600 text-xs">Banner</span>
                    )}
                  </div>

                  {/* Upload Button */}
                  <label className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#D6FF32] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#e8ff66]">
                    <i className="fa-solid fa-image text-[#280D62] text-[8px]"></i>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setFormData({ ...formData, banner: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  {/* Remove Button - only show when there's an image */}
                  {formData.banner && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, banner: '/images/football.jpg' })}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 text-white shadow-lg"
                      title="Reset to default banner"
                    >
                      <i className="fa-solid fa-xmark text-[8px]"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>


            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Tournament Name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs"
                />
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as TournamentType })}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs"
                >
                  {TOURNAMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <input
                type="text"
                placeholder="Location"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">Select Teams ({formData.teamIds.length})</p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {teams.map(team => (
                  <button
                    type="button"
                    key={team.id}
                    onClick={() => handleToggleTeam(team.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${formData.teamIds.includes(team.id) ? 'bg-[#D6FF32] text-[#280D62]' : 'bg-slate-700 text-white/60 hover:bg-slate-600'
                      }`}
                  >
                    {team.logo && <img src={team.logo} className="w-3 h-3 rounded" alt="" />}
                    {team.name}
                  </button>
                ))}
                {teams.length === 0 && <p className="text-white/30 text-xs">No teams yet</p>}
              </div>
            </div>

            <button
              onClick={handleSaveTournament}
              className="w-full bg-[#D6FF32] text-[#280D62] py-2 rounded-lg font-bold text-sm hover:bg-[#e8ff66] transition-colors"
            >
              {editingTournament ? 'Update' : 'Create Tournament'}
            </button>
          </div>
        )}

        {tournaments.length === 0 ? (
          <div className="text-center py-6 text-white/40">
            <i className="fa-solid fa-trophy text-3xl mb-2 opacity-20"></i>
            <p className="text-xs">No tournaments. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tournaments.map(t => (
              <div key={t.id} className={`flex items-center justify-between p-3 rounded-xl transition-all ${t.isActive ? 'bg-[#D6FF32]/10 border border-[#D6FF32]/30' : 'bg-slate-800/30 border border-white/5 hover:border-white/10'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 p-1.5 flex items-center justify-center">
                    {t.logo ? <img src={t.logo} className="max-w-full max-h-full object-contain" alt="" /> : <i className="fa-solid fa-trophy text-[#D6FF32] text-sm"></i>}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{t.name}</h4>
                    <p className="text-[9px] text-white/40 uppercase">{t.type} • {t.teamIds.length} teams</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {t.isActive ? (
                    <span className="px-2 py-1 bg-[#D6FF32] text-[#280D62] text-[9px] font-black rounded-md uppercase">Active</span>
                  ) : (
                    <button
                      onClick={() => handleActivate(t.id)}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-md"
                    >
                      Activate
                    </button>
                  )}
                  <button onClick={() => handleEditTournament(t)} className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded-lg text-[10px]">
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button onClick={() => handleDeleteTournament(t.id)} className="w-7 h-7 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-[10px] transition-colors">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Matches */}
      <div className="glass-card p-5 rounded-2xl">
        <h3 className="sports-font text-lg font-black mb-4 flex items-center gap-2 text-[#D6FF32]">
          <i className="fa-solid fa-bolt-lightning"></i>
          Recent Matches
        </h3>
        <div className="space-y-2">
          {matches.slice(0, 5).map(match => {
            const teamA = teams.find(t => t.id === match.teamAId);
            const teamB = teams.find(t => t.id === match.teamBId);
            return (
              <div key={match.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-white/5 p-1 flex items-center justify-center">
                      {teamA?.logo ? <img src={teamA.logo} className="max-w-full max-h-full object-contain" alt="" /> : <i className="fa-solid fa-shield text-[10px] text-slate-500"></i>}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/5 p-1 flex items-center justify-center border border-[#280D62]">
                      {teamB?.logo ? <img src={teamB.logo} className="max-w-full max-h-full object-contain" alt="" /> : <i className="fa-solid fa-shield text-[10px] text-slate-500"></i>}
                    </div>
                  </div>
                  <span className="text-xs font-bold truncate max-w-[180px]">{teamA?.name || '?'} v {teamB?.name || '?'}</span>
                </div>
                <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${match.status === 'Completed' ? 'bg-white/5 text-white/40' :
                  match.status === 'Live' ? 'bg-red-500 text-white animate-pulse' :
                    'bg-[#D6FF32]/10 text-[#D6FF32]'
                  }`}>
                  {match.status === 'Completed' ? `${match.scoreA}-${match.scoreB}` : match.status}
                </span>
              </div>
            );
          })}
          {matches.length === 0 && (
            <p className="text-center text-white/30 text-xs py-4">No matches scheduled</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
