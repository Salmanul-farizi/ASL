
import React, { useState, useEffect } from 'react';
import { dataStore } from '../services/dataStore';
import { Player, PlayingPosition } from '../types';
import { POSITIONS } from '../constants';

const AdminPlayers: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState<Partial<Player>>({
    name: '',
    position: PlayingPosition.FORWARD,
    jerseyNumber: 1,
    mobile: '',
    photo: 'https://picsum.photos/seed/newplayer/200'
  });

  useEffect(() => {
    setPlayers(dataStore.getPlayers());
  }, []);

  const resetForm = () => {
    setFormData({ name: '', position: PlayingPosition.FORWARD, jerseyNumber: 1, mobile: '', photo: 'https://picsum.photos/seed/newplayer/200' });
    setEditingPlayer(null);
    setIsAdding(false);
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      position: player.position,
      jerseyNumber: player.jerseyNumber,
      mobile: player.mobile,
      photo: player.photo
    });
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!formData.name) return;
    
    if (editingPlayer) {
      // Update existing player
      const updated = players.map(p => 
        p.id === editingPlayer.id 
          ? { ...p, name: formData.name!, position: formData.position as PlayingPosition, jerseyNumber: formData.jerseyNumber || 0, mobile: formData.mobile || '', photo: formData.photo || 'https://picsum.photos/200' }
          : p
      );
      dataStore.savePlayers(updated);
      setPlayers(updated);
    } else {
      // Create new player
      const newPlayer: Player = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name!,
        position: formData.position as PlayingPosition,
        jerseyNumber: formData.jerseyNumber || 0,
        mobile: formData.mobile || '',
        photo: formData.photo || 'https://picsum.photos/200'
      };
      const updated = [...players, newPlayer];
      dataStore.savePlayers(updated);
      setPlayers(updated);
    }
    resetForm();
  };

  const deletePlayer = (id: string) => {
    if (!confirm('Delete this player?')) return;
    const updated = players.filter(p => p.id !== id);
    dataStore.savePlayers(updated);
    setPlayers(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sports-font font-bold">Player Management</h2>
        <button 
          onClick={() => { if (isAdding) resetForm(); else setIsAdding(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700"
        >
          <i className={`fa-solid ${isAdding ? 'fa-xmark' : 'fa-plus'}`}></i>
          {isAdding ? 'Cancel' : 'Add Player'}
        </button>
      </div>

      {isAdding && (
        <div className="glass-card p-6 rounded-2xl animate-in slide-in-from-top duration-300">
          <h3 className="text-lg font-bold text-[#D6FF32] mb-4">{editingPlayer ? 'Edit Player' : 'New Player'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Playing Position</label>
              <select 
                value={formData.position}
                onChange={e => setFormData({...formData, position: e.target.value as PlayingPosition})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Jersey Number</label>
              <input 
                type="number" 
                value={formData.jerseyNumber}
                onChange={e => setFormData({...formData, jerseyNumber: parseInt(e.target.value)})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Mobile Number</label>
              <input 
                type="text" 
                value={formData.mobile}
                onChange={e => setFormData({...formData, mobile: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1">Photo URL</label>
              <input 
                type="text" 
                value={formData.photo}
                onChange={e => setFormData({...formData, photo: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>
          <button 
            onClick={handleSave}
            className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-700 transition-colors"
          >
            {editingPlayer ? 'Update Player' : 'Create Player Profile'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map(player => (
          <div key={player.id} className="glass-card p-4 rounded-2xl flex items-center gap-4 group">
            <img src={player.photo} alt={player.name} className="w-16 h-16 rounded-xl object-cover border border-slate-700" />
            <div className="flex-1">
              <h3 className="font-bold text-white">{player.name}</h3>
              <p className="text-xs text-slate-400 uppercase tracking-wider">{player.position}</p>
              <div className="flex items-center gap-3 mt-1 text-sm">
                <span className="text-blue-400 font-bold">#{player.jerseyNumber}</span>
                <span className="text-slate-500">{player.mobile}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={() => handleEdit(player)}
                className="text-slate-600 hover:text-blue-500 p-2"
              >
                <i className="fa-solid fa-pen"></i>
              </button>
              <button 
                onClick={() => deletePlayer(player.id)}
                className="text-slate-600 hover:text-red-500 p-2"
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPlayers;
