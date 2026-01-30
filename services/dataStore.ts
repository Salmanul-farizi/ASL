
import { Player, Team, Tournament, Match, Goal, MatchStatus, PlayingPosition, TournamentType, NewsPost } from '../types';

const STORAGE_KEYS = {
  PLAYERS: 'asl_players',
  TEAMS: 'asl_teams',
  TOURNAMENTS: 'asl_tournaments',
  MATCHES: 'asl_matches',
  GOALS: 'asl_goals',
  ADMIN_AUTH: 'asl_admin_auth',
  NEWS: 'asl_news'
};

export const dataStore = {
  getPlayers: (): Player[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYERS) || '[]'),
  savePlayers: (players: Player[]) => localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players)),
  
  getTeams: (): Team[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]'),
  saveTeams: (teams: Team[]) => localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams)),
  
  getTournaments: (): Tournament[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.TOURNAMENTS) || '[]'),
  saveTournaments: (tournaments: Tournament[]) => localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(tournaments)),
  
  getMatches: (): Match[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES) || '[]'),
  saveMatches: (matches: Match[]) => localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches)),

  getGoals: (): Goal[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS) || '[]'),
  saveGoals: (goals: Goal[]) => localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)),

  getNews: (): NewsPost[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.NEWS) || '[]'),
  saveNews: (news: NewsPost[]) => localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(news)),

  getActiveTournament: (): Tournament | undefined => {
    const tournaments = dataStore.getTournaments();
    return tournaments.find(t => t.isActive);
  },

  isAdminLoggedIn: (): boolean => localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true',
  loginAdmin: () => localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true'),
  logoutAdmin: () => localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH),

  // Clear all data - useful for fresh start
  clearAllData: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },

  seedInitialData: () => {
    // No seed data - start fresh
  }
};
