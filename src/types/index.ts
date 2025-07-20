import { type LucideIcon } from 'lucide-react';

export type PlayerArchetype = {
  position: 'Defenceman' | 'Centre' | 'Winger' | 'Goaltender';
  type: string;
  physicality: string;
  description: string;
};

export type Player = {
  id: string;
  name: string;
  age: number;
  nationality: string;
  positions: Position[];
  jerseyNumber: number;
  attributes: SkaterAttributes | GoalieAttributes;
  currentAbility: number;
  potentialAbility: number;
  starRating: number;
  healthStatus: 'Healthy' | 'Injured';
  injury: { type: string; duration: number; } | null;
  eligibility: 'UG Year 1' | 'UG Year 2' | 'UG Year 3' | 'UG Year 4' | 'Masters' | 'PhD' | 'Staff';
  isContinuingEducation?: boolean;
  continuingEducationStartSeason?: string;
  yearsLeftInProgram?: number;
  morale: 'Angry' | 'Unhappy' | 'Content' | 'Happy';
  trainingFocus: TrainingFocus | null;
  captaincy: 'C' | 'A' | null;
  role: string | null;
  roleSuitability: { [key: string]: number };
  currentStats: PlayerSeasonStats[];
  history: PlayerSeasonStats[];
  alumniStatus?: 'Retired' | 'Transfer Listed';
  recruitmentCost?: number;
  estimatedQuality?: 'Beginner' | 'Moderate' | 'Intermediate' | 'Experienced' | 'Elite';
  source?: string;
  archetype?: PlayerArchetype;
  activeInstructions?: { type: Instruction; duration: number }[];
};

export type Position = 'C' | 'LW' | 'RW' | 'LD' | 'RD' | 'G';

export type SkaterAttributes = {
  skating: number;
  shootingAccuracy: number;
  shootingRange: number;
  passing: number;
  puckHandling: number;
  checking: number;
  hitting: number;
  strength: number;
  stamina: number;
  speed: number;
  acceleration: number;
  agility: number;
  balance: number;
  offensiveRead: number;
  defensiveRead: number;
  professionalism: number;
  determination: number;
  leadership: number;
  aggressiveness: number;
  bravery: number;
  teamwork: number;
  flair: number;
  consistency: number;
  developmentRate: number;
  injuryProneness: number;
  passShootTendency: number;
  mood: number;
  controversy: number;
  greed: number;
  loyalty: number;
  handleCritics: number;
  handleFailure: number;
  handleSuccess: number;
  sportsmanship: number;
  ambition: number;
  bigGames: number;
  coachability: number;
  intelligence: number;
  // Added missing attributes
  gettingOpen: number;
  teamPlayer: number;
  temperament: number;
  screening: number;
  aggression: number;
  fighting: number;
  positioning: number;
  stickchecking: number;
  shotBlocking: number;
  faceoffs: number;
  aging: number;
};

export type GoalieAttributes = {
  skating: number;
  glove: number;
  stick: number;
  positioning: number;
  reboundControl: number;
  recovery: number;
  goaltenderStamina: number;
  reflexes: number;
  puckHandling: number;
  passing: number;
  breakaway: number;
  fiveHole: number;
  screen: number;
  professionalism: number;
  determination: number;
  leadership: number;
  aggressiveness: number;
  bravery: number;
  teamwork: number;
  flair: number;
  consistency: number;
  developmentRate: number;
  injuryProneness: number;
  mood: number;
  controversy: number;
  greed: number;
  loyalty: number;
  handleCritics: number;
  handleFailure: number;
  handleSuccess: number;
  sportsmanship: number;
  ambition: number;
  bigGames: number;
  coachability: number;
  intelligence: number;
  // Added missing attributes
  blocker: number;
  lowShots: number;
  rebound: number;
  pokeCheck: number;
  mentalToughness: number;
  aging: number;
};

export type Team = {
  id: string;
  name: string;
  logo?: string;
  leagueDivision: string;
  nationalsDivision: string | null;
  roster: Player[];
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  financials: Financials;
  facilities: FacilityProject[];
  lineup: Lineup;
  tactics: TacticsSelection;
};

export type Financials = {
  totalBudget: number;
  discretionaryBudget: number;
  equipmentCost: number;
  iceTimeCostPerGame: number;
};

export type FacilityProject = {
  id: string;
  name: string;
  description: string;
  cost: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
  benefit: string;
  category: string;
  weeksToComplete?: number;
};

export type Lineup = {
  forwards: {
    lw: (string | null)[];
    c: (string | null)[];
    rw: (string | null)[];
  };
  defence: {
    ld: (string | null)[];
    rd: (string | null)[];
  };
  goalies: {
    starter: string | null;
    backup: string | null;
  };
};

export type TacticsSelection = {
  [key: string]: string;
};

export type GameDate = {
  month: string;
  week: number;
  year: number;
};

export type GameEvent = {
  time: string;
  period: number;
  team: string;
  description: string;
};

export type GameState = {
  userScore: number;
  opponentScore: number;
  userShots: number;
  opponentShots: number;
  period: number;
  time: number;
  gameLog: GameEvent[];
  isGameOver: boolean;
  isPaused: boolean;
  injuries: { playerId: string; teamName: string; injuryType: string; duration: number; }[];
  possessionHolder: string | null;
  powerPlayState: {
    isActive: boolean;
    teamOnPowerPlay: string | null;
    timeLeft: number;
  };
  skaterStats: { playerId: string; goals: number; assists: number; points: number; penaltyMinutes: number; }[];
  goalieStats: { playerId: string; shotsAgainst: number; saves: number; goalsAgainst: number; shutout: boolean; }[];
};

export type PlayerSeasonStats = {
  season: string;
  team: string;
  league: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  penaltyMinutes: number;
  shotsAgainst: number;
  saves: number;
  shutouts: number;
  goalsAgainst: number;
  savePercentage: number;
  goalsAgainstAverage: number;
  captaincy: 'C' | 'A' | null;
};

export type DevelopmentLog = {
  playerId: string;
  playerName: string;
  attribute: string;
  change: number;
  newRating: number;
  date: GameDate;
};

export type TrainingFocus = 'Skating' | 'Shooting' | 'Playmaking' | 'Defense' | 'Physical' | 'Mental' | 'Goaltending' | 'Rebound Control' | 'Puck Handling (G)' | 'Breakaway Saves' | null;

export type ScheduleEntry = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: GameDate;
  status: 'scheduled' | 'completed';
  result?: { homeScore: number; awayScore: number; };
  round?: number;
};

export type RecordCategory = 'Goals' | 'Assists' | 'Points' | 'PenaltyMinutes' | 'GAA' | 'SavePercentage' | 'Shutouts';

export type TeamRecord = {
  playerName: string;
  teamName: string;
  value: number;
  season?: string;
};

export type NationalsStanding = {
  teamName: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type NationalsGroup = {
  name: string;
  teams: string[];
  standings: NationalsStanding[];
};

export type NationalsTournament = {
  year: number;
  division: string;
  status: 'group-stage' | 'silver-playoffs' | 'gold-playoffs' | 'completed';
  currentRound: number | string;
  groupStageSchedule: NationalsGame[];
  playoffSchedule: NationalsPlayoffMatch[];
  groups: NationalsGroup[];
  winner?: string;
};

export type NationalsGame = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: GameDate;
  status: 'scheduled' | 'completed';
  result?: { homeScore: number; awayScore: number; };
  round: number;
  group: string;
};

export type NationalsPlayoffMatch = {
  id: string;
  homeTeam: string | { winnerOf: string };
  awayTeam: string | { winnerOf: string };
  date: GameDate;
  status: 'scheduled' | 'completed';
  result?: { homeScore: number; awayScore: number; };
  round: string;
  bracket: 'Gold' | 'Silver';
  nextGameId?: string;
  winner?: string;
};

export type Achievement = {
  type: 'Division Title' | 'Nationals Gold' | 'Nationals Silver';
  season: string;
  division: string;
};

export type TeamAchievements = {
  [teamName: string]: Achievement[];
};

export type SeasonHistory = {
  [season: string]: TeamSeasonHistory[];
};

export type TeamSeasonHistory = {
  teamName: string;
  leagueDivision: string;
  nationalsDivision: string | null;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type SaveGameSlot = {
  saveName: string;
  userTeamName: string;
  currentDate: GameDate;
  savedAt: string;
};

export type TeamOrganization = {
  name: string;
  teams: { name: string; division: string; logo?: string; }[];
};

export type Tactic = {
  tactic: string;
  description: string;
  bestUsedWith: string;
  phase: string;
  category: string;
  strongVs?: string;
  weakVs?: string;
};

export type Role = {
  name: string;
  description: string;
  positions: ('Forward' | 'Defenceman')[];
  keyAttributes: (keyof SkaterAttributes)[];
  type: 'Offensive' | 'Defensive' | 'Two-Way' | 'Physical' | 'Specialist';
  behavioralModifiers: {
      shootTendency: number;
      passTendency: number;
      hitTendency: number;
      shotBlockTendency: number;
      penaltyTendency: number;
  };
};

export type TacticSuitability = {
  score: number;
  explanation: string;
};

export type Instruction = "Encourage" | "Discipline" | "Praise" | "Push Harder" | "Calm Down";