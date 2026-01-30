
import React, { useState, useEffect } from 'react';
import { dataStore } from '../services/dataStore';
import { Team, Player, PlayingPosition } from '../types';
import { POSITIONS } from '../constants';

const AdminTeams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [newPlayerForm, setNewPlayerForm] = useState({
    name: '',
    position: PlayingPosition.FORWARD,
    jerseyNumber: 1,
    mobile: '',
    photo: ''
  });
  const [formData, setFormData] = useState<Partial<Team>>({
    name: '',
    logo: 'https://picsum.photos/seed/team/200',
    captainId: '',
    managerId: '',
    playerIds: []
  });
  // Track players for this team (both new and existing)
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);

  useEffect(() => {
    setTeams(dataStore.getTeams());
    setPlayers(dataStore.getPlayers());
  }, []);

  const resetForm = () => {
    setFormData({ name: '', logo: 'https://picsum.photos/seed/team/200', captainId: '', managerId: '', playerIds: [] });
    setTeamPlayers([]);
    setEditingTeam(null);
    setIsAdding(false);
    setShowAddPlayer(false);
    setNewPlayerForm({ name: '', position: PlayingPosition.FORWARD, jerseyNumber: 1, mobile: '', photo: '' });
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    const existingTeamPlayers = players.filter(p => team.playerIds.includes(p.id));
    setTeamPlayers(existingTeamPlayers);
    setFormData({
      name: team.name,
      logo: team.logo,
      captainId: team.captainId,
      managerId: team.managerId,
      playerIds: [...team.playerIds]
    });
    setIsAdding(true);
  };

  const handleAddPlayerToTeam = () => {
    if (!newPlayerForm.name) return;
    
    const newPlayer: Player = {
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: newPlayerForm.name,
      position: newPlayerForm.position,
      jerseyNumber: newPlayerForm.jerseyNumber || 0,
      mobile: newPlayerForm.mobile || '',
      photo: newPlayerForm.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(newPlayerForm.name)}&background=D6FF32&color=280D62&size=200&bold=true`
    };
    
    setTeamPlayers([...teamPlayers, newPlayer]);
    setNewPlayerForm({ name: '', position: PlayingPosition.FORWARD, jerseyNumber: 1, mobile: '', photo: '' });
    setShowAddPlayer(false);
  };

  const handleRemovePlayerFromTeam = (playerId: string) => {
    setTeamPlayers(teamPlayers.filter(p => p.id !== playerId));
    if (formData.captainId === playerId) setFormData({...formData, captainId: ''});
    if (formData.managerId === playerId) setFormData({...formData, managerId: ''});
  };

  const handleSave = () => {
    if (!formData.name || teamPlayers.length === 0) {
      alert('Please enter team name and add at least one player');
      return;
    }
    
    // Save all new players to the global players list
    const allPlayers = dataStore.getPlayers();
    const existingPlayerIds = allPlayers.map(p => p.id);
    const newPlayersToSave = teamPlayers.filter(p => !existingPlayerIds.includes(p.id));
    
    if (newPlayersToSave.length > 0) {
      const updatedPlayers = [...allPlayers, ...newPlayersToSave];
      dataStore.savePlayers(updatedPlayers);
      setPlayers(updatedPlayers);
    }
    
    const playerIds = teamPlayers.map(p => p.id);
    
    if (editingTeam) {
      const updated = teams.map(t => 
        t.id === editingTeam.id 
          ? { 
              ...t, 
              name: formData.name!, 
              logo: formData.logo || 'https://picsum.photos/200',
              captainId: formData.captainId || playerIds[0],
              managerId: formData.managerId || playerIds[0],
              playerIds: playerIds
            }
          : t
      );
      dataStore.saveTeams(updated);
      setTeams(updated);
    } else {
      const newTeam: Team = {
        id: `t_${Date.now()}`,
        name: formData.name!,
        logo: formData.logo || 'https://picsum.photos/200',
        captainId: formData.captainId || playerIds[0],
        managerId: formData.managerId || playerIds[0],
        playerIds: playerIds
      };
      const updated = [...teams, newTeam];
      dataStore.saveTeams(updated);
      setTeams(updated);
    }
    resetForm();
  };

  const deleteTeam = (id: string) => {
    if (!confirm('Delete this team?')) return;
    const updated = teams.filter(t => t.id !== id);
    dataStore.saveTeams(updated);
    setTeams(updated);
  };

  // Bulk Import Handler for Teams
  const handleBulkImport = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const newTeams: Team[] = [];
    const newPlayers: Player[] = [];
    const errors: string[] = [];
    
    // Check for header - skip only if it looks like a CSV header (contains multiple column names)
    const firstLine = lines[0].toLowerCase();
    const isHeader = (firstLine.includes('team') && firstLine.includes('name') && firstLine.includes('position')) || 
                     (firstLine.includes('player') && firstLine.includes('jersey'));
    const startIndex = isHeader ? 1 : 0;
    
    let currentTeamName = '';
    let currentTeamPlayers: Player[] = [];
    let currentTeamLogo = '';
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        // Empty line = end of current team
        if (currentTeamName && currentTeamPlayers.length > 0) {
          const teamId = `t_${Date.now()}_${newTeams.length}`;
          currentTeamPlayers.forEach(p => p.teamId = teamId);
          newTeams.push({
            id: teamId,
            name: currentTeamName,
            logo: currentTeamLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentTeamName)}&background=280D62&color=D6FF32&size=200&bold=true`,
            captainId: currentTeamPlayers[0]?.id || '',
            managerId: currentTeamPlayers[0]?.id || '',
            playerIds: currentTeamPlayers.map(p => p.id)
          });
          newPlayers.push(...currentTeamPlayers);
        }
        currentTeamName = '';
        currentTeamPlayers = [];
        currentTeamLogo = '';
        continue;
      }
      
      const parts = line.split(',').map(p => p.trim());
      
      // Check if this is a team line (starts with TEAM: or has only 1-2 parts as team name)
      if (parts[0].toUpperCase().startsWith('TEAM:')) {
        // Save previous team if exists
        if (currentTeamName && currentTeamPlayers.length > 0) {
          const teamId = `t_${Date.now()}_${newTeams.length}`;
          currentTeamPlayers.forEach(p => p.teamId = teamId);
          newTeams.push({
            id: teamId,
            name: currentTeamName,
            logo: currentTeamLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentTeamName)}&background=280D62&color=D6FF32&size=200&bold=true`,
            captainId: currentTeamPlayers[0]?.id || '',
            managerId: currentTeamPlayers[0]?.id || '',
            playerIds: currentTeamPlayers.map(p => p.id)
          });
          newPlayers.push(...currentTeamPlayers);
        }
        currentTeamName = parts[0].substring(5).trim();
        currentTeamLogo = parts[1] || '';
        currentTeamPlayers = [];
      } else if (!currentTeamName && parts.length <= 2 && !parts[1]?.match(/^(GK|DEF|MID|FWD|\d+)$/i)) {
        // This is a team name line (simple format)
        if (currentTeamName && currentTeamPlayers.length > 0) {
          const teamId = `t_${Date.now()}_${newTeams.length}`;
          currentTeamPlayers.forEach(p => p.teamId = teamId);
          newTeams.push({
            id: teamId,
            name: currentTeamName,
            logo: currentTeamLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentTeamName)}&background=280D62&color=D6FF32&size=200&bold=true`,
            captainId: currentTeamPlayers[0]?.id || '',
            managerId: currentTeamPlayers[0]?.id || '',
            playerIds: currentTeamPlayers.map(p => p.id)
          });
          newPlayers.push(...currentTeamPlayers);
        }
        currentTeamName = parts[0];
        currentTeamLogo = parts[1] || '';
        currentTeamPlayers = [];
      } else if (currentTeamName) {
        // This is a player line: Name, Position, JerseyNumber, Mobile (optional)
        const [name, posStr, jerseyStr, mobile] = parts;
        if (!name) {
          errors.push(`Line ${i + 1}: Missing player name`);
          continue;
        }
        
        // Parse position
        let position = PlayingPosition.FORWARD;
        if (posStr) {
          const posUpper = posStr.toUpperCase();
          if (posUpper === 'GK' || posUpper === 'GOALKEEPER') position = PlayingPosition.GOALKEEPER;
          else if (posUpper === 'DEF' || posUpper === 'DEFENDER') position = PlayingPosition.DEFENDER;
          else if (posUpper === 'MID' || posUpper === 'MIDFIELDER') position = PlayingPosition.MIDFIELDER;
          else if (posUpper === 'FWD' || posUpper === 'FORWARD') position = PlayingPosition.FORWARD;
        }
        
        const player: Player = {
          id: `p_${Date.now()}_${newPlayers.length + currentTeamPlayers.length}`,
          name: name,
          position: position,
          jerseyNumber: parseInt(jerseyStr) || currentTeamPlayers.length + 1,
          mobile: mobile || '',
          photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=D6FF32&color=280D62&size=200&bold=true`
        };
        currentTeamPlayers.push(player);
      } else {
        errors.push(`Line ${i + 1}: No team defined for player "${parts[0]}"`);
      }
    }
    
    // Save last team
    if (currentTeamName && currentTeamPlayers.length > 0) {
      const teamId = `t_${Date.now()}_${newTeams.length}`;
      currentTeamPlayers.forEach(p => p.teamId = teamId);
      newTeams.push({
        id: teamId,
        name: currentTeamName,
        logo: currentTeamLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentTeamName)}&background=280D62&color=D6FF32&size=200&bold=true`,
        captainId: currentTeamPlayers[0]?.id || '',
        managerId: currentTeamPlayers[0]?.id || '',
        playerIds: currentTeamPlayers.map(p => p.id)
      });
      newPlayers.push(...currentTeamPlayers);
    }
    
    if (newTeams.length > 0) {
      // Save teams
      const updatedTeams = [...teams, ...newTeams];
      dataStore.saveTeams(updatedTeams);
      setTeams(updatedTeams);
      
      // Save players
      const updatedPlayers = [...players, ...newPlayers];
      dataStore.savePlayers(updatedPlayers);
      setPlayers(updatedPlayers);
      
      setShowBulkImport(false);
      const errorMsg = errors.length > 0 ? `\n\nWarnings:\n${errors.slice(0, 5).join('\n')}` : '';
      alert(`Successfully imported ${newTeams.length} teams with ${newPlayers.length} players!${errorMsg}`);
    } else {
      alert(`No teams imported.\n\nExpected format:\nTEAM: Team Name\nPlayer Name, Position, Jersey#, Mobile\nPlayer Name, Position, Jersey#\n\n(blank line between teams)\n\n${errors.length > 0 ? 'Errors:\n' + errors.slice(0, 5).join('\n') : ''}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sports-font font-bold uppercase italic">Team Registration</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowBulkImport(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <i className="fa-solid fa-file-import"></i>
            Import CSV
          </button>
          <button 
            onClick={() => { if (isAdding) resetForm(); else setIsAdding(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <i className={`fa-solid ${isAdding ? 'fa-xmark' : 'fa-plus'}`}></i>
            {isAdding ? 'Cancel' : 'Register Team'}
          </button>
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#D6FF32]">Bulk Import Teams & Players</h3>
              <button onClick={() => setShowBulkImport(false)} className="text-slate-400 hover:text-white">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
              <p className="text-sm text-slate-300 mb-2"><strong>CSV Format:</strong></p>
              <pre className="text-xs bg-slate-900 p-3 rounded-lg overflow-x-auto text-slate-400">
{`TEAM: Red Reign
John Smith, GK, 1, 0501234567
Mike Johnson, DEF, 4
David Lee, MID, 8
Chris Brown, FWD, 9

TEAM: Tech Titans FC
Alex Wilson, GK, 1
Tom Davis, DEF, 2
James Miller, MID, 10
Ryan Taylor, FWD, 11`}
              </pre>
              <p className="text-xs text-slate-500 mt-2">
                • Use "TEAM: Name" to start each team<br/>
                • Players: Name, Position (GK/DEF/MID/FWD), Jersey#, Mobile (optional)<br/>
                • Blank line between teams (optional)
              </p>
            </div>
            
            <textarea
              id="bulkImportText"
              className="w-full h-64 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Paste your CSV data here..."
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  const textarea = document.getElementById('bulkImportText') as HTMLTextAreaElement;
                  if (textarea?.value) handleBulkImport(textarea.value);
                }}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all"
              >
                <i className="fa-solid fa-upload mr-2"></i>
                Import Teams
              </button>
              <button
                onClick={() => setShowBulkImport(false)}
                className="px-6 bg-slate-700 text-white py-3 rounded-xl font-bold hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="glass-card p-6 rounded-3xl animate-in fade-in zoom-in duration-200">
          <h3 className="text-lg font-bold text-[#D6FF32] mb-4">{editingTeam ? 'Edit Team' : 'New Team Registration'}</h3>
          
          {/* Team Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Logo Upload */}
            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium text-slate-400 mb-2">Team Logo</label>
              <div className="relative">
                {formData.logo ? (
                  <div className="w-24 h-24 flex items-center justify-center">
                    <img src={formData.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : formData.name ? (
                  <div className="w-24 h-24 rounded-full bg-[#D6FF32] flex items-center justify-center">
                    <span className="sports-font text-2xl font-black text-[#280D62]">
                      {formData.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-800/30 flex items-center justify-center">
                    <i className="fa-solid fa-shield text-3xl text-slate-600"></i>
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#D6FF32] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#e8ff66] transition-all shadow-lg">
                  <i className="fa-solid fa-camera text-[#280D62] text-sm"></i>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({...formData, logo: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Click to upload</p>
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Team Name *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="E.g. Engineering Titans"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Or paste Logo URL</label>
                <input 
                  type="text" 
                  value={formData.logo?.startsWith('data:') ? '' : formData.logo}
                  onChange={e => setFormData({...formData, logo: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          </div>

          {/* Team Players Section */}
          <div className="border-t border-slate-800 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-users text-[#D6FF32]"></i>
                Team Players ({teamPlayers.length})
              </h4>
              <button
                onClick={() => setShowAddPlayer(!showAddPlayer)}
                className="bg-[#D6FF32] text-[#280D62] px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#e8ff66] transition-all"
              >
                <i className={`fa-solid ${showAddPlayer ? 'fa-xmark' : 'fa-user-plus'}`}></i>
                {showAddPlayer ? 'Cancel' : 'Add Player'}
              </button>
            </div>

            {/* Add Player Form */}
            {showAddPlayer && (
              <div className="bg-slate-800/50 rounded-2xl p-4 mb-4 border border-[#D6FF32]/30">
                <div className="flex gap-4">
                  {/* Player Photo Upload */}
                  <div className="flex flex-col items-center">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Photo</label>
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-slate-700 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden">
                        {newPlayerForm.photo ? (
                          <img src={newPlayerForm.photo} alt="Player" className="w-full h-full object-cover" />
                        ) : (
                          <i className="fa-solid fa-user text-xl text-slate-600"></i>
                        )}
                      </div>
                      <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#D6FF32] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#e8ff66]">
                        <i className="fa-solid fa-camera text-[#280D62] text-[10px]"></i>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setNewPlayerForm({...newPlayerForm, photo: reader.result as string});
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Player Details */}
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Player Name *</label>
                      <input 
                        type="text" 
                        value={newPlayerForm.name}
                        onChange={e => setNewPlayerForm({...newPlayerForm, name: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#D6FF32] outline-none"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Position</label>
                      <select 
                        value={newPlayerForm.position}
                        onChange={e => setNewPlayerForm({...newPlayerForm, position: e.target.value as PlayingPosition})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                      >
                        {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Jersey #</label>
                      <input 
                        type="number" 
                        value={newPlayerForm.jerseyNumber}
                        onChange={e => setNewPlayerForm({...newPlayerForm, jerseyNumber: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                        min="1" max="99"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Mobile</label>
                      <input 
                        type="text" 
                        value={newPlayerForm.mobile}
                        onChange={e => setNewPlayerForm({...newPlayerForm, mobile: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleAddPlayerToTeam}
                  className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition-all w-full"
                >
                  <i className="fa-solid fa-check mr-2"></i>Add to Team
                </button>
              </div>
            )}

            {/* Players List */}
            {teamPlayers.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                <i className="fa-solid fa-user-slash text-3xl mb-2 opacity-30"></i>
                <p className="text-sm">No players added yet</p>
                <p className="text-xs mt-1">Click "Add Player" to register team members</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {teamPlayers.map(player => (
                  <div key={player.id} className="flex items-center gap-3 bg-slate-800/40 rounded-xl p-3 group">
                    <div className="w-10 h-10 rounded-full bg-[#D6FF32] flex items-center justify-center overflow-hidden">
                      <img src={player.photo} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{player.name}</p>
                      <p className="text-xs text-slate-400">{player.position} • #{player.jerseyNumber}</p>
                    </div>
                    <button
                      onClick={() => handleRemovePlayerFromTeam(player.id)}
                      className="text-slate-600 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Captain & Manager Selection */}
          {teamPlayers.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Team Captain</label>
                <select 
                  value={formData.captainId}
                  onChange={e => setFormData({...formData, captainId: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">Select Captain</option>
                  {teamPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Team Manager</label>
                <select 
                  value={formData.managerId}
                  onChange={e => setFormData({...formData, managerId: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">Select Manager</option>
                  {teamPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          )}

          <button 
            onClick={handleSave}
            disabled={!formData.name || teamPlayers.length === 0}
            className="w-full mt-8 bg-green-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-green-700 transition-all uppercase tracking-widest sports-font text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingTeam ? 'Update Team' : 'Register Team'}
          </button>
        </div>
      )}

      {/* Teams List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.length === 0 && !isAdding ? (
          <div className="col-span-full text-center py-12 glass-card rounded-3xl">
            <i className="fa-solid fa-shield text-5xl text-white/10 mb-4"></i>
            <p className="text-white/40 font-medium">No teams registered yet</p>
            <p className="text-white/20 text-sm mt-1">Click "Register Team" to get started</p>
          </div>
        ) : (
          teams.map(team => {
            const teamPlayersList = players.filter(p => team.playerIds.includes(p.id));
            return (
              <div key={team.id} className="glass-card p-5 rounded-3xl border border-slate-800 flex items-start gap-5 relative group">
                {team.logo ? (
                  <img src={team.logo} alt={team.name} className="w-20 h-20 object-contain shadow-lg" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#D6FF32] flex items-center justify-center shadow-lg">
                    <span className="sports-font text-2xl font-black text-[#280D62]">
                      {team.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-white sports-font uppercase italic leading-none mb-2">{team.name}</h3>
                  <div className="space-y-1 text-xs mb-3">
                    <p className="text-slate-400 uppercase tracking-wider">
                      Captain: <span className="text-blue-400 font-bold">{players.find(p => p.id === team.captainId)?.name || '-'}</span>
                    </p>
                    <p className="text-slate-400 uppercase tracking-wider">
                      Players: <span className="text-[#D6FF32] font-bold">{team.playerIds.length}</span>
                    </p>
                  </div>
                  <div className="flex -space-x-2">
                    {teamPlayersList.slice(0, 5).map(p => (
                      <img key={p.id} src={p.photo} className="w-7 h-7 rounded-full border-2 border-slate-900 object-cover" alt="" title={p.name} />
                    ))}
                    {teamPlayersList.length > 5 && (
                      <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        +{teamPlayersList.length - 5}
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => handleEdit(team)} className="text-slate-600 hover:text-blue-500 p-2">
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button onClick={() => deleteTeam(team.id)} className="text-slate-600 hover:text-red-500 p-2">
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminTeams;
