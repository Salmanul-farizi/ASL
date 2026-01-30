
import { Player, Team, Tournament, Match, Goal, MatchStatus, PlayingPosition, TournamentType, NewsPost, MediaStory } from '../types';

const STORAGE_KEYS = {
  PLAYERS: 'asl_players',
  TEAMS: 'asl_teams',
  TOURNAMENTS: 'asl_tournaments',
  MATCHES: 'asl_matches',
  GOALS: 'asl_goals',
  ADMIN_AUTH: 'asl_admin_auth',
  NEWS: 'asl_news',
  MEDIA_STORIES: 'asl_media_stories'
};

// Safe localStorage setter with error handling
const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.error('localStorage quota exceeded!');
      throw new Error('Storage full! Delete some posts/stories to free space.');
    }
    throw e;
  }
};

// Get localStorage usage info
export const getStorageInfo = () => {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
    }
  }
  return {
    used: total,
    usedMB: (total / (1024 * 1024)).toFixed(2),
    limit: '5-10MB (browser dependent)'
  };
};

export const dataStore = {
  getPlayers: (): Player[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYERS) || '[]'),
  savePlayers: (players: Player[]) => safeSetItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players)),
  
  getTeams: (): Team[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]'),
  saveTeams: (teams: Team[]) => safeSetItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams)),
  
  getTournaments: (): Tournament[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.TOURNAMENTS) || '[]'),
  saveTournaments: (tournaments: Tournament[]) => safeSetItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(tournaments)),
  
  getMatches: (): Match[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES) || '[]'),
  saveMatches: (matches: Match[]) => safeSetItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches)),

  getGoals: (): Goal[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS) || '[]'),
  saveGoals: (goals: Goal[]) => safeSetItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)),

  getNews: (): NewsPost[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.NEWS) || '[]'),
  saveNews: (news: NewsPost[]) => safeSetItem(STORAGE_KEYS.NEWS, JSON.stringify(news)),

  getMediaStories: (): MediaStory[] => {
    const stories = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDIA_STORIES) || '[]') as MediaStory[];
    const now = new Date();
    // Filter out expired stories
    return stories.filter(s => new Date(s.expiresAt) > now);
  },
  saveMediaStories: (stories: MediaStory[]) => safeSetItem(STORAGE_KEYS.MEDIA_STORIES, JSON.stringify(stories)),
  addMediaStory: (story: MediaStory) => {
    const stories = dataStore.getMediaStories();
    stories.unshift(story); // Add to beginning
    dataStore.saveMediaStories(stories);
  },

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
