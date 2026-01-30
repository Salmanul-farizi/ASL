
import React, { useState, useEffect } from 'react';
import { dataStore } from '../services/dataStore';
import { Match, MatchStatus, Tournament, Team, Player, Goal } from '../types';

const AdminMatches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTournament, setActiveTournament] = useState<Tournament | undefined>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [liveControlMatch, setLiveControlMatch] = useState<Match | null>(null);
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showFormation, setShowFormation] = useState<Match | null>(null);
  const [formation, setFormation] = useState<{teamALineup: string[], teamBLineup: string[]}>({ teamALineup: [], teamBLineup: [] });
  const [matchForm, setMatchForm] = useState({
    teamAId: '',
    teamBId: '',
    scheduledAt: '',
    scheduledTime: '19:00'
  });

  useEffect(() => {
    setActiveTournament(dataStore.getActiveTournament());
    setMatches(dataStore.getMatches());
    setTeams(dataStore.getTeams());
    setPlayers(dataStore.getPlayers());
  }, []);

  const resetMatchForm = () => {
    setMatchForm({ teamAId: '', teamBId: '', scheduledAt: '', scheduledTime: '19:00' });
    setIsAddingMatch(false);
    setEditingMatch(null);
  };

  const handleEditMatch = (match: Match) => {
    const date = new Date(match.scheduledAt);
    setEditingMatch(match);
    setMatchForm({
      teamAId: match.teamAId,
      teamBId: match.teamBId,
      scheduledAt: date.toISOString().split('T')[0],
      scheduledTime: date.toTimeString().slice(0, 5)
    });
    setIsAddingMatch(true);
  };

  const handleSaveMatch = () => {
    if (!activeTournament || !matchForm.teamAId || !matchForm.teamBId || !matchForm.scheduledAt) return;
    if (matchForm.teamAId === matchForm.teamBId) return alert('Select different teams');

    const scheduledAt = new Date(`${matchForm.scheduledAt}T${matchForm.scheduledTime}:00`).toISOString();

    if (editingMatch) {
      const updated = matches.map(m => 
        m.id === editingMatch.id 
          ? { ...m, teamAId: matchForm.teamAId, teamBId: matchForm.teamBId, scheduledAt }
          : m
      );
      dataStore.saveMatches(updated);
      setMatches(updated);
    } else {
      const newMatch: Match = {
        id: Math.random().toString(36).substr(2, 9),
        tournamentId: activeTournament.id,
        teamAId: matchForm.teamAId,
        teamBId: matchForm.teamBId,
        scoreA: 0,
        scoreB: 0,
        status: MatchStatus.UPCOMING,
        scheduledAt
      };
      const updated = [...matches, newMatch];
      dataStore.saveMatches(updated);
      setMatches(updated);
    }
    resetMatchForm();
  };

  const deleteMatch = (id: string) => {
    if (!confirm('Delete this match?')) return;
    const updated = matches.filter(m => m.id !== id);
    dataStore.saveMatches(updated);
    setMatches(updated);
  };

  const generateFixtures = () => {
    if (!activeTournament) return;
    const teamIds = activeTournament.teamIds;
    const newMatches: Match[] = [];
    
    // Simple Round Robin generator for demo
    let dayOffset = 0;
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        const matchDate = new Date();
        matchDate.setDate(matchDate.getDate() + dayOffset);
        matchDate.setHours(19, 0, 0, 0);
        dayOffset += 3; // Space matches 3 days apart
        
        newMatches.push({
          id: Math.random().toString(36).substr(2, 9),
          tournamentId: activeTournament.id,
          teamAId: teamIds[i],
          teamBId: teamIds[j],
          scoreA: 0,
          scoreB: 0,
          status: MatchStatus.UPCOMING,
          scheduledAt: matchDate.toISOString()
        });
      }
    }
    const updated = [...matches, ...newMatches];
    dataStore.saveMatches(updated);
    setMatches(updated);
  };

  const updateMatchStatus = (id: string, status: MatchStatus) => {
    const updated = matches.map(m => m.id === id ? { ...m, status } : m);
    dataStore.saveMatches(updated);
    setMatches(updated);
    if (status === MatchStatus.LIVE) {
      setLiveControlMatch(updated.find(m => m.id === id) || null);
    }
  };

  const addGoal = (matchId: string, teamId: string, playerId: string) => {
    const updated = matches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          scoreA: m.teamAId === teamId ? m.scoreA + 1 : m.scoreA,
          scoreB: m.teamBId === teamId ? m.scoreB + 1 : m.scoreB
        };
      }
      return m;
    });
    dataStore.saveMatches(updated);
    setMatches(updated);
    
    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      matchId,
      teamId,
      playerId,
      minute: Math.floor(Math.random() * 90)
    };
    const goals = dataStore.getGoals();
    dataStore.saveGoals([...goals, newGoal]);
    
    setLiveControlMatch(updated.find(m => m.id === matchId) || null);
  };

  const setPlayerOfTheMatch = (matchId: string, playerId: string) => {
    const updated = matches.map(m => 
      m.id === matchId ? { ...m, playerOfTheMatch: playerId } : m
    );
    dataStore.saveMatches(updated);
    setMatches(updated);
    setLiveControlMatch(updated.find(m => m.id === matchId) || null);
  };

  const endMatch = (matchId: string) => {
    updateMatchStatus(matchId, MatchStatus.COMPLETED);
    setLiveControlMatch(null);
  };

  // Bulk Import Handler
  const handleBulkImport = (csvText: string) => {
    if (!activeTournament) return;
    
    const lines = csvText.trim().split('\n');
    const newMatches: Match[] = [];
    const errors: string[] = [];
    
    // Skip header if present
    const startIndex = lines[0].toLowerCase().includes('team') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 2) {
        errors.push(`Line ${i + 1}: Not enough fields`);
        continue;
      }
      
      const [teamAName, teamBName, dateStr, timeStr] = parts;
      const teamA = teams.find(t => t.name.toLowerCase() === teamAName.toLowerCase());
      const teamB = teams.find(t => t.name.toLowerCase() === teamBName.toLowerCase());
      
      if (!teamA) {
        errors.push(`Line ${i + 1}: Team "${teamAName}" not found`);
        continue;
      }
      if (!teamB) {
        errors.push(`Line ${i + 1}: Team "${teamBName}" not found`);
        continue;
      }
      
      let scheduledAt: string;
      try {
        // Parse date - handle various formats
        let date: Date;
        if (dateStr) {
          date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            // Try alternate format DD-MM-YYYY
            const dateParts = dateStr.split(/[-\/]/);
            if (dateParts.length === 3) {
              date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
            }
          }
        } else {
          date = new Date();
          date.setDate(date.getDate() + newMatches.length * 3); // Space matches 3 days apart
        }
        
        if (isNaN(date.getTime())) {
          errors.push(`Line ${i + 1}: Invalid date "${dateStr}"`);
          continue;
        }
        
        if (timeStr) {
          const [hours, minutes] = timeStr.split(':');
          date.setHours(parseInt(hours) || 19, parseInt(minutes) || 0, 0, 0);
        } else {
          date.setHours(19, 0, 0, 0);
        }
        scheduledAt = date.toISOString();
      } catch {
        errors.push(`Line ${i + 1}: Date parsing error`);
        continue;
      }
      
      newMatches.push({
        id: Math.random().toString(36).substr(2, 9),
        tournamentId: activeTournament.id,
        teamAId: teamA.id,
        teamBId: teamB.id,
        scoreA: 0,
        scoreB: 0,
        status: MatchStatus.UPCOMING,
        scheduledAt
      });
    }
    
    if (newMatches.length > 0) {
      const updated = [...matches, ...newMatches];
      dataStore.saveMatches(updated);
      setMatches(updated);
      setShowBulkImport(false);
      const errorMsg = errors.length > 0 ? `\n\nWarnings:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n...and ${errors.length - 5} more` : ''}` : '';
      alert(`Successfully imported ${newMatches.length} matches!${errorMsg}`);
    } else {
      const availableTeams = teams.map(t => t.name).join(', ');
      const errorDetails = errors.length > 0 ? `\n\nErrors:\n${errors.slice(0, 10).join('\n')}` : '';
      alert(`No valid matches imported.\n\nAvailable teams: ${availableTeams || 'None (add teams first)'}${errorDetails}`);
    }
  };

  // Formation Save Handler
  const handleSaveFormation = (matchId: string) => {
    const lineups = JSON.parse(localStorage.getItem('asl_lineups') || '{}');
    lineups[matchId] = formation;
    localStorage.setItem('asl_lineups', JSON.stringify(lineups));
    setShowFormation(null);
    alert('Lineup saved!');
  };

  // Load Formation for a match
  const loadFormation = (match: Match) => {
    const lineups = JSON.parse(localStorage.getItem('asl_lineups') || '{}');
    if (lineups[match.id]) {
      setFormation(lineups[match.id]);
    } else {
      setFormation({ teamALineup: [], teamBLineup: [] });
    }
    setShowFormation(match);
  };

  const tournamentMatches = matches.filter(m => m.tournamentId === activeTournament?.id);
  const tournamentTeams = teams.filter(t => activeTournament?.teamIds.includes(t.id));

  if (!activeTournament) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <i className="fa-solid fa-trophy text-slate-600 text-4xl"></i>
        </div>
        <h3 className="sports-font text-2xl font-bold text-slate-400">No Active Tournament</h3>
        <p className="text-slate-500 mt-2 mb-6">Create and activate a tournament to manage fixtures.</p>
        <p className="text-xs text-[#D6FF32]"><i className="fa-solid fa-arrow-left mr-2"></i>Go to Stats tab to create a tournament</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {liveControlMatch ? (
        <div className="glass-card p-6 rounded-3xl border-2 border-red-500 animate-pulse-slow">
          <div className="flex items-center justify-between mb-8">
            <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase italic animate-pulse">Live Control</span>
            <button onClick={() => setLiveControlMatch(null)} className="text-slate-400"><i className="fa-solid fa-xmark"></i></button>
          </div>
          
          <div className="flex items-center justify-between mb-12">
            <div className="text-center w-1/3">
              {teams.find(t => t.id === liveControlMatch.teamAId)?.logo ? (
                <div className="w-20 h-20 rounded-full bg-[#3e2085] flex items-center justify-center mx-auto mb-4 shadow-xl overflow-hidden">
                  <img src={teams.find(t => t.id === liveControlMatch.teamAId)?.logo} className="w-full h-full object-cover" alt="" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#D6FF32] flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <span className="sports-font text-2xl font-black text-[#280D62]">
                    {teams.find(t => t.id === liveControlMatch.teamAId)?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <h4 className="sports-font text-xl font-bold uppercase truncate">{teams.find(t => t.id === liveControlMatch.teamAId)?.name}</h4>
            </div>
            <div className="text-center w-1/3">
              <div className="text-6xl sports-font font-black italic tracking-tighter text-white">
                {liveControlMatch.scoreA} : {liveControlMatch.scoreB}
              </div>
            </div>
            <div className="text-center w-1/3">
              {teams.find(t => t.id === liveControlMatch.teamBId)?.logo ? (
                <div className="w-20 h-20 rounded-full bg-[#3e2085] flex items-center justify-center mx-auto mb-4 shadow-xl overflow-hidden">
                  <img src={teams.find(t => t.id === liveControlMatch.teamBId)?.logo} className="w-full h-full object-cover" alt="" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#D6FF32] flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <span className="sports-font text-2xl font-black text-[#280D62]">
                    {teams.find(t => t.id === liveControlMatch.teamBId)?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <h4 className="sports-font text-xl font-bold uppercase truncate">{teams.find(t => t.id === liveControlMatch.teamBId)?.name}</h4>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-2">Log Goal For Team A</p>
              <div className="grid grid-cols-1 gap-2">
                {teams.find(t => t.id === liveControlMatch.teamAId)?.playerIds.map(pid => {
                  const p = players.find(player => player.id === pid);
                  return (
                    <button 
                      key={pid}
                      onClick={() => addGoal(liveControlMatch.id, liveControlMatch.teamAId, pid)}
                      className="bg-slate-800 hover:bg-blue-600 text-xs font-bold py-2 rounded-xl transition-all"
                    >
                      {p?.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-2">Log Goal For Team B</p>
              <div className="grid grid-cols-1 gap-2">
                {teams.find(t => t.id === liveControlMatch.teamBId)?.playerIds.map(pid => {
                  const p = players.find(player => player.id === pid);
                  return (
                    <button 
                      key={pid}
                      onClick={() => addGoal(liveControlMatch.id, liveControlMatch.teamBId, pid)}
                      className="bg-slate-800 hover:bg-emerald-600 text-xs font-bold py-2 rounded-xl transition-all"
                    >
                      {p?.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Player of the Match Selection */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[10px] font-bold text-[#D6FF32] uppercase tracking-widest text-center mb-4">
              <i className="fa-solid fa-star mr-2"></i>Player of the Match
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[...new Set([
                ...(teams.find(t => t.id === liveControlMatch.teamAId)?.playerIds || []),
                ...(teams.find(t => t.id === liveControlMatch.teamBId)?.playerIds || [])
              ])].map(pid => {
                const p = players.find(player => player.id === pid);
                const isSelected = liveControlMatch.playerOfTheMatch === pid;
                return (
                  <button 
                    key={pid}
                    onClick={() => setPlayerOfTheMatch(liveControlMatch.id, pid)}
                    className={`text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                      isSelected 
                        ? 'bg-[#D6FF32] text-[#280D62]' 
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {isSelected && <i className="fa-solid fa-star"></i>}
                    {p?.name}
                  </button>
                );
              })}
            </div>
            {liveControlMatch.playerOfTheMatch && (
              <p className="text-center mt-3 text-sm text-[#D6FF32]">
                <i className="fa-solid fa-trophy mr-2"></i>
                {players.find(p => p.id === liveControlMatch.playerOfTheMatch)?.name} selected as POTM
              </p>
            )}
          </div>
          
          <button 
            onClick={() => endMatch(liveControlMatch.id)}
            className="w-full mt-10 bg-slate-100 text-slate-900 font-bold py-4 rounded-2xl sports-font uppercase tracking-widest hover:bg-white"
          >
            End & Complete Match
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl sports-font font-bold uppercase italic">Fixtures & Live</h2>
            <div className="flex gap-2 flex-wrap">
              {tournamentMatches.length === 0 && (
                <button 
                  onClick={generateFixtures}
                  className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm"
                >
                  <i className="fa-solid fa-wand-magic-sparkles"></i> Auto Generate
                </button>
              )}
              <button 
                onClick={() => setShowBulkImport(!showBulkImport)}
                className="bg-amber-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm"
              >
                <i className="fa-solid fa-file-import"></i> Import CSV
              </button>
              <button 
                onClick={() => { if (isAddingMatch) resetMatchForm(); else setIsAddingMatch(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm"
              >
                <i className={`fa-solid ${isAddingMatch ? 'fa-xmark' : 'fa-plus'}`}></i>
                {isAddingMatch ? 'Cancel' : 'Add Match'}
              </button>
            </div>
          </div>

          {/* Bulk Import Section */}
          {showBulkImport && (
            <div className="glass-card p-6 rounded-3xl border border-amber-500/30 animate-in slide-in-from-top duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  <i className="fa-solid fa-file-csv"></i> Bulk Import Fixtures
                </h3>
                <button onClick={() => setShowBulkImport(false)} className="text-slate-400 hover:text-white">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                <p className="text-xs text-white/60 mb-2">CSV Format (one match per line):</p>
                <code className="text-[11px] text-[#D6FF32] block bg-slate-900 rounded-lg p-3">
                  Team A Name, Team B Name, Date (YYYY-MM-DD), Time (HH:MM)<br/>
                  Engineering, Marketing, 2026-02-01, 19:00<br/>
                  Sales, HR, 2026-02-03, 18:30
                </code>
              </div>
              <textarea 
                id="csvInput"
                placeholder="Paste your CSV data here..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono h-32 resize-none"
              />
              <button 
                onClick={() => {
                  const textarea = document.getElementById('csvInput') as HTMLTextAreaElement;
                  handleBulkImport(textarea.value);
                }}
                className="w-full mt-4 bg-amber-600 text-white font-bold py-3 rounded-xl hover:bg-amber-500 transition-colors uppercase tracking-widest"
              >
                <i className="fa-solid fa-upload mr-2"></i>Import Matches
              </button>
            </div>
          )}

          {/* Add/Edit Match Form */}
          {isAddingMatch && (
            <div className="glass-card p-6 rounded-3xl animate-in slide-in-from-top duration-200">
              <h3 className="text-lg font-bold text-[#D6FF32] mb-4">{editingMatch ? 'Edit Match' : 'Schedule New Match'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Home Team</label>
                  <select 
                    value={matchForm.teamAId}
                    onChange={e => setMatchForm({...matchForm, teamAId: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3"
                  >
                    <option value="">Select Team</option>
                    {tournamentTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Away Team</label>
                  <select 
                    value={matchForm.teamBId}
                    onChange={e => setMatchForm({...matchForm, teamBId: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3"
                  >
                    <option value="">Select Team</option>
                    {tournamentTeams.filter(t => t.id !== matchForm.teamAId).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Match Date</label>
                  <input 
                    type="date"
                    value={matchForm.scheduledAt}
                    onChange={e => setMatchForm({...matchForm, scheduledAt: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Kick-off Time</label>
                  <input 
                    type="time"
                    value={matchForm.scheduledTime}
                    onChange={e => setMatchForm({...matchForm, scheduledTime: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3"
                  />
                </div>
              </div>
              <button 
                onClick={handleSaveMatch}
                className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors uppercase tracking-widest"
              >
                {editingMatch ? 'Update Match' : 'Schedule Match'}
              </button>
            </div>
          )}

          <div className="space-y-4">
            {tournamentMatches.map(match => {
              const teamA = teams.find(t => t.id === match.teamAId);
              const teamB = teams.find(t => t.id === match.teamBId);
              const potm = match.playerOfTheMatch ? players.find(p => p.id === match.playerOfTheMatch) : null;
              return (
                <div key={match.id} className="glass-card p-4 rounded-3xl border border-slate-800 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 w-1/3">
                      <img src={teamA?.logo} className="w-10 h-10 rounded-xl" alt="" />
                      <span className="font-bold text-sm uppercase truncate">{teamA?.name}</span>
                    </div>
                    <div className="text-center w-1/3">
                      <div className="text-xl font-black sports-font italic">
                        {match.status === MatchStatus.UPCOMING ? 'VS' : `${match.scoreA} : ${match.scoreB}`}
                      </div>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                        match.status === 'Live' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {match.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-4 w-1/3">
                      <span className="font-bold text-sm uppercase truncate text-right">{teamB?.name}</span>
                      <img src={teamB?.logo} className="w-10 h-10 rounded-xl" alt="" />
                    </div>
                  </div>
                  
                  {/* POTM Display */}
                  {match.status === MatchStatus.COMPLETED && potm && (
                    <div className="mt-3 pt-3 border-t border-slate-800/50 text-center">
                      <span className="text-[10px] text-[#D6FF32] font-bold uppercase tracking-widest">
                        <i className="fa-solid fa-star mr-1"></i>POTM: {potm.name}
                      </span>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-center items-center gap-3 flex-wrap">
                    {match.status === MatchStatus.UPCOMING && (
                      <>
                        <button 
                          onClick={() => updateMatchStatus(match.id, MatchStatus.LIVE)}
                          className="bg-red-600 hover:bg-red-700 text-[10px] font-bold px-4 py-1.5 rounded-lg text-white uppercase tracking-widest"
                        >
                          Start Live
                        </button>
                        <button 
                          onClick={() => loadFormation(match)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold px-4 py-1.5 rounded-lg text-white uppercase tracking-widest"
                        >
                          <i className="fa-solid fa-users-line mr-1"></i>Lineup
                        </button>
                        <button 
                          onClick={() => handleEditMatch(match)}
                          className="bg-slate-700 hover:bg-slate-600 text-[10px] font-bold px-4 py-1.5 rounded-lg text-white uppercase tracking-widest"
                        >
                          <i className="fa-solid fa-pen mr-1"></i>Edit
                        </button>
                        <button 
                          onClick={() => deleteMatch(match.id)}
                          className="bg-slate-800 hover:bg-red-600 text-[10px] font-bold px-4 py-1.5 rounded-lg text-slate-400 hover:text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </>
                    )}
                    {match.status === MatchStatus.LIVE && (
                      <>
                        <button 
                          onClick={() => setLiveControlMatch(match)}
                          className="bg-blue-600 hover:bg-blue-700 text-[10px] font-bold px-4 py-1.5 rounded-lg text-white uppercase tracking-widest"
                        >
                          Control Score
                        </button>
                        <button 
                          onClick={() => loadFormation(match)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold px-4 py-1.5 rounded-lg text-white uppercase tracking-widest"
                        >
                          <i className="fa-solid fa-users-line mr-1"></i>Lineup
                        </button>
                      </>
                    )}
                    <span className="text-[10px] text-slate-500 font-medium">
                      <i className="fa-solid fa-clock mr-1"></i>
                      {new Date(match.scheduledAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {tournamentMatches.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <i className="fa-solid fa-calendar-xmark text-4xl mb-4 opacity-30"></i>
                <p className="font-medium">No matches scheduled yet</p>
                <p className="text-sm mt-1">Use "Auto Generate" or "Add Match" to create fixtures</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Formation Builder Modal */}
      {showFormation && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#D6FF32] flex items-center gap-2">
                <i className="fa-solid fa-users-line"></i> Match Lineup
              </h3>
              <button onClick={() => setShowFormation(null)} className="text-slate-400 hover:text-white text-xl">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team A Lineup */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <img src={teams.find(t => t.id === showFormation.teamAId)?.logo} className="w-10 h-10 rounded-xl" alt="" />
                  <h4 className="font-bold uppercase">{teams.find(t => t.id === showFormation.teamAId)?.name}</h4>
                </div>
                
                {/* Football Pitch Visual */}
                <div className="bg-emerald-900/40 rounded-2xl p-4 border-2 border-emerald-700/50 relative min-h-[300px]">
                  <div className="absolute inset-4 border-2 border-white/20 rounded-lg">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-12 border-2 border-t-0 border-white/20"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-12 border-2 border-b-0 border-white/20"></div>
                    <div className="absolute top-1/2 left-0 right-0 border-t border-white/20"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/20 rounded-full"></div>
                  </div>
                  
                  {/* Selected Players Display */}
                  <div className="relative z-10 flex flex-wrap justify-center gap-2 pt-8">
                    {formation.teamALineup.map(playerId => {
                      const player = players.find(p => p.id === playerId);
                      return player ? (
                        <div key={playerId} className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center overflow-hidden">
                            <img src={player.photo} alt="" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[9px] font-bold mt-1 text-white">{player.name.split(' ')[0]}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Player Selection */}
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-bold uppercase">Select Starting XI:</p>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {teams.find(t => t.id === showFormation.teamAId)?.playerIds.map(pid => {
                      const player = players.find(p => p.id === pid);
                      const isSelected = formation.teamALineup.includes(pid);
                      return player ? (
                        <button
                          key={pid}
                          onClick={() => {
                            if (isSelected) {
                              setFormation({ ...formation, teamALineup: formation.teamALineup.filter(id => id !== pid) });
                            } else if (formation.teamALineup.length < 11) {
                              setFormation({ ...formation, teamALineup: [...formation.teamALineup, pid] });
                            }
                          }}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-all ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white/60 hover:bg-slate-700'
                          }`}
                        >
                          <img src={player.photo} alt="" className="w-6 h-6 rounded-full object-cover" />
                          <span className="truncate">{player.name}</span>
                          <span className="ml-auto text-[10px] opacity-60">#{player.jerseyNumber}</span>
                        </button>
                      ) : null;
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500">{formation.teamALineup.length}/11 selected</p>
                </div>
              </div>

              {/* Team B Lineup */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <img src={teams.find(t => t.id === showFormation.teamBId)?.logo} className="w-10 h-10 rounded-xl" alt="" />
                  <h4 className="font-bold uppercase">{teams.find(t => t.id === showFormation.teamBId)?.name}</h4>
                </div>
                
                {/* Football Pitch Visual */}
                <div className="bg-emerald-900/40 rounded-2xl p-4 border-2 border-emerald-700/50 relative min-h-[300px]">
                  <div className="absolute inset-4 border-2 border-white/20 rounded-lg">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-12 border-2 border-t-0 border-white/20"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-12 border-2 border-b-0 border-white/20"></div>
                    <div className="absolute top-1/2 left-0 right-0 border-t border-white/20"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/20 rounded-full"></div>
                  </div>
                  
                  {/* Selected Players Display */}
                  <div className="relative z-10 flex flex-wrap justify-center gap-2 pt-8">
                    {formation.teamBLineup.map(playerId => {
                      const player = players.find(p => p.id === playerId);
                      return player ? (
                        <div key={playerId} className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-red-600 border-2 border-white flex items-center justify-center overflow-hidden">
                            <img src={player.photo} alt="" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[9px] font-bold mt-1 text-white">{player.name.split(' ')[0]}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Player Selection */}
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-bold uppercase">Select Starting XI:</p>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {teams.find(t => t.id === showFormation.teamBId)?.playerIds.map(pid => {
                      const player = players.find(p => p.id === pid);
                      const isSelected = formation.teamBLineup.includes(pid);
                      return player ? (
                        <button
                          key={pid}
                          onClick={() => {
                            if (isSelected) {
                              setFormation({ ...formation, teamBLineup: formation.teamBLineup.filter(id => id !== pid) });
                            } else if (formation.teamBLineup.length < 11) {
                              setFormation({ ...formation, teamBLineup: [...formation.teamBLineup, pid] });
                            }
                          }}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-all ${
                            isSelected ? 'bg-red-600 text-white' : 'bg-slate-800 text-white/60 hover:bg-slate-700'
                          }`}
                        >
                          <img src={player.photo} alt="" className="w-6 h-6 rounded-full object-cover" />
                          <span className="truncate">{player.name}</span>
                          <span className="ml-auto text-[10px] opacity-60">#{player.jerseyNumber}</span>
                        </button>
                      ) : null;
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500">{formation.teamBLineup.length}/11 selected</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => handleSaveFormation(showFormation.id)}
              className="w-full mt-6 bg-[#D6FF32] text-[#280D62] font-bold py-3 rounded-xl hover:bg-[#e8ff66] transition-colors uppercase tracking-widest"
            >
              <i className="fa-solid fa-save mr-2"></i>Save Lineup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMatches;
