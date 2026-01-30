
import React, { useState, useEffect } from 'react';
import { dataStore } from '../services/dataStore';
import { Tournament, TournamentType, Team } from '../types';
import { TOURNAMENT_TYPES } from '../constants';

const AdminTournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Tournament>>({
    name: '',
    type: TournamentType.LEAGUE,
    logo: 'https://picsum.photos/seed/tourlogo/200',
    banner: 'https://picsum.photos/seed/tourbanner/800/300',
    location: '',
    startDate: '',
    endDate: '',
    teamIds: [],
    isActive: false
  });

  useEffect(() => {
    setTournaments(dataStore.getTournaments());
    setTeams(dataStore.getTeams());
  }, []);

  const handleToggleTeam = (teamId: string) => {
    const current = formData.teamIds || [];
    if (current.includes(teamId)) {
      setFormData({...formData, teamIds: current.filter(id => id !== teamId)});
    } else {
      setFormData({...formData, teamIds: [...current, teamId]});
    }
  };

  const handleSave = () => {
    if (!formData.name || (formData.teamIds || []).length < 2) return;
    const newTournament: Tournament = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name!,
      type: formData.type as TournamentType,
      logo: formData.logo || '',
      banner: formData.banner || '',
      location: formData.location || '',
      startDate: formData.startDate || '',
      endDate: formData.endDate || '',
      teamIds: formData.teamIds || [],
      isActive: tournaments.length === 0 // Make active if it's the first one
    };
    const updated = [...tournaments, newTournament];
    dataStore.saveTournaments(updated);
    setTournaments(updated);
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '', type: TournamentType.LEAGUE, logo: '', banner: '',
      location: '', startDate: '', endDate: '', teamIds: [], isActive: false
    });
  };

  const setActive = (id: string) => {
    const updated = tournaments.map(t => ({
      ...t,
      isActive: t.id === id
    }));
    dataStore.saveTournaments(updated);
    setTournaments(updated);
  };

  const deleteTournament = (id: string) => {
    const updated = tournaments.filter(t => t.id !== id);
    dataStore.saveTournaments(updated);
    setTournaments(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sports-font font-bold uppercase">Tournaments</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"
        >
          <i className={`fa-solid ${isAdding ? 'fa-xmark' : 'fa-plus'}`}></i>
          {isAdding ? 'Cancel' : 'New Tournament'}
        </button>
      </div>

      {isAdding && (
        <div className="glass-card p-6 rounded-3xl space-y-4 animate-in slide-in-from-top duration-200">
          {/* Logo & Banner Upload */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex flex-col items-center">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Logo</label>
              <div className="relative">
                <div className="w-20 h-20 flex items-center justify-center overflow-hidden">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" />
                  ) : formData.name ? (
                    <div className="w-20 h-20 rounded-full bg-[#D6FF32] flex items-center justify-center">
                      <span className="sports-font text-xl font-black text-[#280D62]">
                        {formData.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <i className="fa-solid fa-trophy text-2xl text-slate-600"></i>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-7 h-7 bg-[#D6FF32] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#e8ff66] transition-all shadow-lg">
                  <i className="fa-solid fa-camera text-[#280D62] text-xs"></i>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setFormData({...formData, logo: reader.result as string});
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="flex flex-col flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Banner</label>
              <div className="relative flex-1">
                <div className="h-20 rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden">
                  {formData.banner ? (
                    <img src={formData.banner} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-600 text-xs">Banner Image</span>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-7 h-7 bg-[#D6FF32] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#e8ff66] transition-all shadow-lg">
                  <i className="fa-solid fa-image text-[#280D62] text-xs"></i>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setFormData({...formData, banner: reader.result as string});
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2"
                  placeholder="Corporate Summer League"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as TournamentType})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2"
                  >
                    {TOURNAMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Participating Teams</label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {teams.map(team => (
                  <div 
                    key={team.id}
                    onClick={() => handleToggleTeam(team.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${
                      formData.teamIds?.includes(team.id) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800/30 border-slate-700'
                    }`}
                  >
                    <img src={team.logo} className="w-6 h-6 rounded-md" alt="" />
                    <span className="text-xs font-bold truncate">{team.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button 
            onClick={handleSave}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl sports-font uppercase tracking-widest"
          >
            Launch Tournament
          </button>
        </div>
      )}

      <div className="space-y-4">
        {tournaments.map(tour => (
          <div key={tour.id} className={`glass-card p-5 rounded-3xl border ${tour.isActive ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-800'}`}>
            <div className="flex items-center gap-4">
              <img src={tour.logo} className="w-16 h-16 rounded-2xl object-cover" alt="" />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="sports-font text-2xl font-bold uppercase">{tour.name}</h3>
                  {tour.isActive && (
                    <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Active</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <i className="fa-solid fa-layer-group"></i> {tour.type}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <i className="fa-solid fa-calendar-days"></i> {tour.startDate} to {tour.endDate}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <i className="fa-solid fa-shield"></i> {tour.teamIds.length} Teams
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {!tour.isActive && (
                  <button onClick={() => setActive(tour.id)} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl transition-all">
                    Make Active
                  </button>
                )}
                <button onClick={() => deleteTournament(tour.id)} className="text-slate-600 hover:text-red-500 p-2">
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTournaments;
