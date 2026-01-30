
import React, { useState, useEffect } from 'react';
import { dataStore } from '../services/dataStore';
import { Tournament, Team, Match, PointsTableRow, TournamentType } from '../types';

interface ManualTableRow extends PointsTableRow {
  isEditing?: boolean;
}

const AdminTable: React.FC = () => {
  const [activeTournament, setActiveTournament] = useState<Tournament | undefined>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tableData, setTableData] = useState<ManualTableRow[]>([]);
  const [useManualTable, setUseManualTable] = useState(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);

  useEffect(() => {
    const tournament = dataStore.getActiveTournament();
    setActiveTournament(tournament);
    setTeams(dataStore.getTeams());
    setMatches(dataStore.getMatches());
    
    // Load manual table if exists
    const savedTable = localStorage.getItem('asl_manual_table');
    if (savedTable && tournament) {
      const parsed = JSON.parse(savedTable);
      if (parsed.tournamentId === tournament.id) {
        setTableData(parsed.data);
        setUseManualTable(true);
      } else {
        calculateAutoTable(tournament);
      }
    } else if (tournament) {
      calculateAutoTable(tournament);
    }
  }, []);

  const calculateAutoTable = (tournament: Tournament) => {
    const table: Record<string, PointsTableRow> = {};
    
    // Debug log
    console.log('Tournament:', tournament.name, 'Team IDs:', tournament.teamIds);
    console.log('Available teams:', teams.map(t => ({ id: t.id, name: t.name })));
    
    tournament.teamIds.forEach(tid => {
      table[tid] = {
        teamId: tid, played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
      };
    });

    const allMatches = dataStore.getMatches();
    const completedMatches = allMatches.filter(m => m.tournamentId === tournament.id && m.status === 'Completed');
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

    const sorted = Object.values(table).map(r => ({ ...r, goalDifference: r.goalsFor - r.goalsAgainst }))
      .sort((a,b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });
    setTableData(sorted);
  };

  const saveManualTable = (data: ManualTableRow[]) => {
    if (activeTournament) {
      localStorage.setItem('asl_manual_table', JSON.stringify({ 
        tournamentId: activeTournament.id, 
        data 
      }));
    }
  };

  const handleEditRow = (teamId: string) => {
    setEditingRow(teamId);
  };

  const handleSaveRow = (teamId: string, updates: Partial<PointsTableRow>) => {
    const updated = tableData.map(row => {
      if (row.teamId === teamId) {
        return {
          ...row,
          ...updates,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst
        };
      }
      return row;
    });
    
    // Re-sort by points
    const sorted = updated.sort((a,b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
    
    setTableData(sorted);
    setUseManualTable(true);
    saveManualTable(sorted);
    setEditingRow(null);
  };

  const resetToAuto = () => {
    if (confirm('Reset table to auto-calculated values from match results?')) {
      localStorage.removeItem('asl_manual_table');
      setUseManualTable(false);
      if (activeTournament) {
        calculateAutoTable(activeTournament);
      }
    }
  };

  if (!activeTournament) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <i className="fa-solid fa-list-ol text-slate-600 text-4xl"></i>
        </div>
        <h3 className="sports-font text-2xl font-bold text-slate-400">No Active Tournament</h3>
        <p className="text-slate-500 mt-2 mb-6">Create and activate a tournament to view the table.</p>
        <p className="text-xs text-[#D6FF32]"><i className="fa-solid fa-arrow-left mr-2"></i>Go to Stats tab to create a tournament</p>
      </div>
    );
  }

  if (activeTournament.type !== TournamentType.LEAGUE) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <i className="fa-solid fa-circle-exclamation text-amber-500 text-4xl"></i>
        </div>
        <h3 className="sports-font text-2xl font-bold text-slate-400">League Table N/A</h3>
        <p className="text-slate-500 mt-2">Points table is only available for League format tournaments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sports-font font-bold uppercase">Points Table</h2>
          <p className="text-xs text-white/40 mt-1">
            {useManualTable ? (
              <span className="text-amber-400"><i className="fa-solid fa-pen mr-1"></i> Manual Mode</span>
            ) : (
              <span className="text-emerald-400"><i className="fa-solid fa-wand-magic-sparkles mr-1"></i> Auto-calculated</span>
            )}
          </p>
        </div>
        {useManualTable && (
          <button 
            onClick={resetToAuto}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm"
          >
            <i className="fa-solid fa-rotate"></i> Reset to Auto
          </button>
        )}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {tableData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <i className="fa-solid fa-users text-slate-600 text-2xl"></i>
            </div>
            <h3 className="sports-font text-xl font-bold text-slate-400">No Teams in Tournament</h3>
            <p className="text-slate-500 mt-2 mb-4">Add teams to "{activeTournament.name}" to view the table.</p>
            <p className="text-xs text-[#D6FF32]">
              <i className="fa-solid fa-arrow-left mr-2"></i>
              Go to Stats → Edit Tournament → Select Teams
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-white/40">
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3 text-center">P</th>
                <th className="px-4 py-3 text-center">W</th>
                <th className="px-4 py-3 text-center">D</th>
                <th className="px-4 py-3 text-center">L</th>
                <th className="px-4 py-3 text-center">GD</th>
                <th className="px-4 py-3 text-center">Pts</th>
                <th className="px-4 py-3 text-center w-20">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tableData.map((row, i) => {
                const team = teams.find(t => t.id === row.teamId);
                const isEditing = editingRow === row.teamId;
                
                return (
                  <EditableRow
                    key={row.teamId}
                    row={row}
                    team={team}
                    position={i + 1}
                    isEditing={isEditing}
                    onEdit={() => handleEditRow(row.teamId)}
                    onSave={(updates) => handleSaveRow(row.teamId, updates)}
                    onCancel={() => setEditingRow(null)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <div className="glass-card p-4 rounded-xl border border-white/10">
        <p className="text-xs text-white/40">
          <i className="fa-solid fa-info-circle mr-2 text-[#D6FF32]"></i>
          Click the edit button to manually adjust a team's stats. Changes will override auto-calculations.
        </p>
      </div>
    </div>
  );
};

// Editable Row Component
interface EditableRowProps {
  row: ManualTableRow;
  team: Team | undefined;
  position: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<PointsTableRow>) => void;
  onCancel: () => void;
}

const EditableRow: React.FC<EditableRowProps> = ({ row, team, position, isEditing, onEdit, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalDifference: row.goalDifference,
    points: row.points
  });

  useEffect(() => {
    setFormData({
      played: row.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      goalDifference: row.goalDifference,
      points: row.points
    });
  }, [row]);

  const handleInputChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isEditing) {
    return (
      <tr className="bg-[#D6FF32]/10">
        <td className="px-4 py-3 text-center font-black text-white/40">{position}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            {team?.logo ? (
              <img src={team.logo} className="w-8 h-8 rounded-lg object-cover" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                <i className="fa-solid fa-shield-halved text-slate-500"></i>
              </div>
            )}
            <span className="font-bold text-sm">{team?.name}</span>
          </div>
        </td>
        <td className="px-2 py-2 text-center">
          <input type="number" value={formData.played} onChange={e => handleInputChange('played', +e.target.value)} 
            className="w-12 bg-slate-800 border border-slate-600 rounded px-1 py-1 text-center text-xs" />
        </td>
        <td className="px-2 py-2 text-center">
          <input type="number" value={formData.won} onChange={e => handleInputChange('won', +e.target.value)} 
            className="w-12 bg-slate-800 border border-slate-600 rounded px-1 py-1 text-center text-xs" />
        </td>
        <td className="px-2 py-2 text-center">
          <input type="number" value={formData.drawn} onChange={e => handleInputChange('drawn', +e.target.value)} 
            className="w-12 bg-slate-800 border border-slate-600 rounded px-1 py-1 text-center text-xs" />
        </td>
        <td className="px-2 py-2 text-center">
          <input type="number" value={formData.lost} onChange={e => handleInputChange('lost', +e.target.value)} 
            className="w-12 bg-slate-800 border border-slate-600 rounded px-1 py-1 text-center text-xs" />
        </td>
        <td className="px-2 py-2 text-center">
          <input type="number" value={formData.goalDifference} onChange={e => handleInputChange('goalDifference', +e.target.value)} 
            className="w-12 bg-slate-800 border border-slate-600 rounded px-1 py-1 text-center text-xs" />
        </td>
        <td className="px-2 py-2 text-center">
          <input type="number" value={formData.points} onChange={e => handleInputChange('points', +e.target.value)} 
            className="w-14 bg-slate-800 border border-[#D6FF32] rounded px-1 py-1 text-center text-xs font-bold text-[#D6FF32]" />
        </td>
        <td className="px-2 py-3 text-center">
          <div className="flex gap-1 justify-center">
            <button onClick={() => onSave(formData)} className="w-7 h-7 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-xs">
              <i className="fa-solid fa-check"></i>
            </button>
            <button onClick={onCancel} className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`${position <= 1 ? 'bg-[#D6FF32]/5' : ''} hover:bg-white/5 transition-colors`}>
      <td className="px-4 py-3 text-center font-black text-white/40">{position}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {team?.logo ? (
            <img src={team.logo} className="w-8 h-8 rounded-lg object-cover" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
              <i className="fa-solid fa-shield-halved text-slate-500"></i>
            </div>
          )}
          <span className="font-bold text-sm">{team?.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center text-white/60">{row.played}</td>
      <td className="px-4 py-3 text-center text-emerald-400">{row.won}</td>
      <td className="px-4 py-3 text-center text-white/40">{row.drawn}</td>
      <td className="px-4 py-3 text-center text-red-400">{row.lost}</td>
      <td className="px-4 py-3 text-center font-bold text-white/80">{row.goalDifference > 0 ? '+' : ''}{row.goalDifference}</td>
      <td className="px-4 py-3 text-center font-black text-[#D6FF32] text-lg">{row.points}</td>
      <td className="px-4 py-3 text-center">
        <button onClick={onEdit} className="w-8 h-8 bg-slate-800 hover:bg-[#D6FF32] hover:text-[#280D62] rounded-lg transition-all text-xs">
          <i className="fa-solid fa-pen"></i>
        </button>
      </td>
    </tr>
  );
};

export default AdminTable;
