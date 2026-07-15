/**
 * Core cricket data types for CrickPro
 * Comprehensive types covering all entities: users, players, teams,
 * matches, innings, balls, statistics, leagues, and achievements
 */

// ============= USER & PLAYER TYPES =============
export type UserRole = 'player' | 'scorer' | 'organizer' | 'umpire' | 'fan';
export type PlayerRole = 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
export type BattingStyle = 'right-handed' | 'left-handed';
export type BowlingStyle =
  | 'right-arm-fast'
  | 'right-arm-fast-medium'
  | 'right-arm-medium'
  | 'right-arm-off-spin'
  | 'right-arm-leg-spin'
  | 'left-arm-fast'
  | 'left-arm-fast-medium'
  | 'left-arm-medium'
  | 'left-arm-orthodox-spin'
  | 'left-arm-chinaman';

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  photoUrl?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  userId: string;
  role: PlayerRole;
  battingStyle: BattingStyle;
  bowlingStyle?: BowlingStyle;
  battingOrder?: number;
  captain: boolean;
  wicketKeeper: boolean;
  city: string;
  jerseyNumber?: number;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============= TEAM TYPES =============
export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  homeGround?: string;
  teamColor: string;
  captainId: string;
  viceCaptainId?: string;
  coach?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  playerId: string;
  role: 'captain' | 'vice-captain' | 'player' | 'substitute';
  joinedAt: Date;
}

// ============= LEAGUE & TOURNAMENT TYPES =============
export type TournamentFormat = 'round-robin' | 'knockout' | 'league' | 'group-knockout';
export type MatchFormat = 'Test' | 'ODI' | 'T20' | 'T10' | 'TheHundred' | 'custom';

export interface League {
  id: string;
  name: string;
  format: TournamentFormat;
  matchFormat: MatchFormat;
  numberOfTeams: number;
  organizerId: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  rules?: string;
  venue?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeagueTeam {
  id: string;
  leagueId: string;
  teamId: string;
  group?: string;
  joinedAt: Date;
}

export interface LeagueStanding {
  id: string;
  leagueId: string;
  teamId: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  nrr: number; // Net Run Rate
  runsFor: number;
  ballsFor: number;
  runsAgainst: number;
  ballsAgainst: number;
}

// ============= MATCH TYPES =============
export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'abandoned' | 'drawn';
export type DismissalType =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'stumped'
  | 'run-out'
  | 'hit-wicket'
  | 'handled-ball'
  | 'obstructing-field'
  | 'hit-ball-twice'
  | 'timed-out'
  | 'retired-hurt';
export type ExtraType = 'wide' | 'no-ball' | 'bye' | 'leg-bye' | 'penalty';
export type TossDecision = 'bat' | 'bowl';

export interface Match {
  id: string;
  leagueId?: string;
  team1Id: string;
  team2Id: string;
  format: MatchFormat;
  status: MatchStatus;
  tossWinner?: string;
  tossDecision?: TossDecision;
  venue?: string;
  umpireId?: string;
  umpire2Id?: string;
  scorerId?: string;
  referee?: string;
  matchNumber?: number;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: string;
  playerOfTheMatch?: string;
  oversPerSide: number;
  ballsPerOver: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============= INNINGS TYPES =============
export interface Innings {
  id: string;
  matchId: string;
  teamId: string;
  inningsNumber: number;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  totalBalls: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalty: number;
    total: number;
  };
  status: 'in-progress' | 'completed' | 'declared';
  target?: number;
  isSuperOver: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ball {
  id: string;
  inningsId: string;
  overNumber: number;
  ballNumber: number;
  ballIndex: number;
  batsmanId: string;
  bowlerId: string;
  runs: number;
  extras: number;
  extraType?: ExtraType;
  totalRuns: number;
  isWicket: boolean;
  dismissalType?: DismissalType;
  dismissedPlayerId?: string;
  fielderId?: string;
  isFreeHit: boolean;
  isLegal: boolean;
  createdAt: Date;
}

export interface BatsmanScore {
  id: string;
  inningsId: string;
  playerId: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  dismissalType?: DismissalType;
  dismissedByBowler?: string;
  fielderId?: string;
  status: 'batting' | 'out' | 'did-not-bat' | 'not-out';
  battingOrder: number;
}

export interface BowlerStats {
  id: string;
  inningsId: string;
  playerId: string;
  name: string;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
  economyRate: number;
  wides: number;
  noBalls: number;
}

export interface FallOfWicket {
  wicketNumber: number;
  playerId: string;
  name: string;
  runs: number;
  overs: number;
  balls: number;
  dismissalType: DismissalType;
}

export interface ExtrasBreakdown {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penalty: number;
  total: number;
}

// ============= SCORECARD TYPES =============
export interface Scorecard {
  id: string;
  matchId: string;
  team1Innings: InningsDetail;
  team2Innings: InningsDetail;
  result: 'team1-won' | 'team2-won' | 'tied' | 'no-result' | 'drawn';
  winMargin?: string;
  playerOfTheMatch?: string;
  manOfTheSeries?: string;
  createdAt: Date;
}

export interface InningsDetail {
  teamId: string;
  teamName: string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  totalBalls: number;
  runRate: number;
  batsmanScores: BatsmanScore[];
  bowlerStats: BowlerStats[];
  fallOfWickets: FallOfWicket[];
  extras: ExtrasBreakdown;
  byes: number;
  legByes: number;
  wides: number;
  noBalls: number;
  penalty: number;
  fours: number;
  sixes: number;
}

// ============= STATISTICS TYPES =============
export interface PlayerCareerStats {
  playerId: string;
  name: string;
  format: MatchFormat;
  
  // Batting stats
  matchesPlayed: number;
  innings: number;
  runsScored: number;
  highestScore: number;
  highestScoreNotOut: boolean;
  average: number;
  strikeRate: number;
  centuries: number;
  halfCenturies: number;
  fours: number;
  sixes: number;
  ducks: number;
  notOuts: number;
  
  // Bowling stats
  ballsBowled: number;
  runsConceded: number;
  wicketsTaken: number;
  economyRate: number;
  bowlingAverage: number;
  strikeRateBowling: number;
  fiveWicketHauls: number;
  tenWicketHauls: number;
  bestFigures: string;
  bestFiguresMatch?: string;
  
  // Fielding stats
  catches: number;
  stumpings: number;
  runOuts: number;
  
  // Other
  playerOfMatch: number;
  updatedAt: Date;
}

export interface TeamStats {
  teamId: string;
  format: MatchFormat;
  matchesPlayed: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  highestScore: number;
  lowestScore: number;
  largestWinRuns: number;
  largestWinWickets: number;
  runsFor: number;
  runsAgainst: number;
  netRunRate: number;
  updatedAt: Date;
}

// ============= COMMENTARY =============
export interface Commentary {
  id: string;
  ballId: string;
  overNumber: number;
  ballNumber: number;
  text: string;
  isHighlight: boolean;
  createdAt: Date;
}

// ============= GROUND & OFFICIALS =============
export interface Ground {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity?: number;
  established?: number;
  floodlights: boolean;
  imageUrl?: string;
}

export interface Umpire {
  id: string;
  name: string;
  country: string;
  role: 'on-field' | 'third' | 'match-referee';
  experience?: number;
}

// ============= ACHIEVEMENTS =============
export interface Achievement {
  id: string;
  playerId: string;
  type: 'century' | 'half-century' | 'five-wickets' | 'hat-trick' | 'duck' |
        'milestone-runs' | 'milestone-wickets' | 'milestone-catches' | 'man-of-the-match';
  title: string;
  description: string;
  matchId?: string;
  format?: MatchFormat;
  earnedAt: Date;
}

export interface Milestone {
  type: 'runs' | 'wickets' | 'catches' | 'stumpings' | 'matches';
  value: number;
  description: string;
  achieved: boolean;
  achievedAt?: Date;
}

// ============= TOURNAMENT PROGRESSION =============
export interface TournamentKnockoutMatch {
  round: number;
  roundName: string;
  matchId: string;
  team1Id: string;
  team2Id: string;
  winnerId?: string;
  scheduledDate: Date;
  status: MatchStatus;
}

export interface GroupStandings {
  groupName: string;
  teams: LeagueStanding[];
}

// ============= API RESPONSE TYPES =============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
