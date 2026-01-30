
export enum PlayingPosition {
  GOALKEEPER = 'Goalkeeper',
  DEFENDER = 'Defender',
  MIDFIELDER = 'Midfielder',
  FORWARD = 'Forward'
}

export enum TournamentType {
  LEAGUE = 'League',
  KNOCKOUT = 'Knockout',
  WEEKLY = 'Weekly Match'
}

export enum MatchStatus {
  UPCOMING = 'Upcoming',
  LIVE = 'Live',
  COMPLETED = 'Completed'
}

export interface Player {
  id: string;
  name: string;
  position: PlayingPosition;
  jerseyNumber: number;
  mobile: string;
  photo: string;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  captainId: string;
  managerId: string;
  playerIds: string[];
}

export interface Goal {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string;
  minute: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
  status: MatchStatus;
  scheduledAt: string;
  playerOfTheMatch?: string;
}

export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  logo: string;
  banner: string;
  location: string;
  startDate: string;
  endDate: string;
  teamIds: string[];
  isActive: boolean;
}

export interface PointsTableRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface NewsPost {
  id: string;
  image: string;
  caption: string;
  createdAt: string;
  likes: number;
}

export interface MediaStory {
  id: string;
  type: 'image' | 'video';
  mediaUrl: string;  // Base64 data URL
  thumbnail?: string;  // For videos
  duration?: number;  // Video duration in seconds
  caption?: string;
  uploader: string;  // 'admin' or username
  createdAt: string;
  expiresAt: string;  // ISO string for 24h expiry
  matchId?: string;  // Optional link to match
}
