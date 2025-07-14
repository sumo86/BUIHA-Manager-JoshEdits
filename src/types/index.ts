export type Position = "C" | "LW" | "RW" | "LD" | "RD" | "G";

export type Instruction = "Encourage" | "Discipline" | "Praise" | "Push Harder" | "Calm Down";

export type ActiveInstruction = {
  type: Instruction;
  duration: number; // in game ticks
};

export type PlayerArchetype = {
  position: 'Defenceman' | 'Centre' | 'Winger' | 'Goaltender';
  type: string;
  physicality: string;
  description: string;
};

export type SkaterAttributes = {
  acceleration: number;
  agility: number;
  balance: number;
  fighting: number;
  speed: number;
  stamina: number;
  strength: number;
  hitting: number;
  aggression: number;
  bravery: number;
  determination: number;
  leadership: number;
  professionalism: number;
  teamPlayer: number;
  temperament: number;
  gettingOpen: number;
  offensiveRead: number;
  passing: number;
  puckhandling: number;
  screening: number;
  shootingAccuracy: number;
  shootingRange: number;
  checking: number;
  defensiveRead: number;
  faceoffs: number;
  positioning: number;
  shotBlocking: number;
  stickchecking: number;
  aging: number;
  ambition: number;
  bigGames: number;
  coachability: number;
  controversy: number;
  developmentRate: number;
  greed: number;
  handleFailure: number;
  handleSuccess: number;
  handleCritics: number;
  injuryProneness: number;
  intelligence: number;
  loyalty: number;
  mood: number;
  sportsmanship: number;
  passShootTendency: number;
};

export type GoalieAttributes = {
  blocker: number;
  glove: number;
  lowShots: number;
  positioning: number;
  rebound: number;
  recovery: number;
  reflexes: number;
  passing: number;
  pokeCheck: number;
  puckhandling: number;
  skating: number;
  mentalToughness: number;
  goaltenderStamina: number;
  aging: number;
  ambition: number;
  bigGames: number;
  coachability: number;
  controversy: number;
  developmentRate: number;
  greed: number;
  handleFailure: number;
  handleSuccess: number;
  handleCritics: number;
  injuryProneness: number;
  intelligence: number;
  loyalty: number;
  mood: number;
  sportsmanship: number;
  professionalism: number;
  determination: number;
  leadership: number;
};

export type PlayerSeasonStats = {
  season: string;
  team: string;
  league: string;
  gamesPlayed: number;
  goals?: number;
  assists?: number;
  points?: number;
  penaltyMinutes?: number;
  captaincy?: 'C' | 'A' | null;
  goalsAgainst?: number;
  shotsAgainst?: number;
  saves?: number;
  goalsAgainstAverage?: number;
  savePercentage?: number;
  shutouts?: number;
};

export type TrainingFocus = "Skating" | "Shooting" | "Playmaking" | "Defense" | "Physical" | "Mental" | "Goaltending" | null;

export type Player = {
  id: string;
  jerseyNumber: number;
  name: string;
  age: number;
  nationality: string;
  positions: Position[];
  starRating: number;
  morale: "Content" | "Happy" | "Unhappy" | "Angry";
  healthStatus: "Healthy" | "Injured" | "Suspended";
  injury: { type: string; duration: number } | null;
  eligibility: "UG Year 1" | "UG Year 2" | "UG Year 3" | "UG Year 4" | "Masters" | "PhD" | "Staff";
  archetype: PlayerArchetype;
  attributes: SkaterAttributes | GoalieAttributes;
  currentAbility: number;
  potentialAbility: number;
  role: string | undefined;
  roleSuitability: { [key: string]: number };
  captaincy: 'C' | 'A' | null;
  yearsLeftInProgram?: number;
  history: PlayerSeasonStats[];
  trainingFocus: TrainingFocus;
  currentStats: PlayerSeasonStats[];
  activeInstructions: ActiveInstruction[];
  source?: 'Local' | 'International' | 'Transfer';
  estimatedQuality?: 'Beginner' | 'Moderate' | 'Intermediate' | 'Experienced' | 'Elite';
  recruitmentCost?: number;
  alumniStatus?: 'Retired' | 'Active Elsewhere';
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

export type BudgetCategory = "Travel" | "Equipment" | "Ice Time" | "Recruiting" | "Student Life" | "Facilities";

export type BudgetAllocations = {
  [key in BudgetCategory]: number;
};

export type Financials = {
  totalBudget: number;
  iceTimeCostPerGame: number;
  equipmentCost: number;
  budgetAllocations: BudgetAllocations;
};

export type FacilityProject = {
  id: string;
  name: string;
  description: string;
  cost: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
  benefit: string;
  weeksToComplete?: number;
};

export type Team = {
  id: string;
  name: string;
  logo: string;
  leagueDivision: string;
  nationalsDivision: string;
  roster: Player[];
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  lineup: Lineup;
  tactics: TacticsSelection;
  financials: Financials;
  facilities: FacilityProject[];
};

export type GameEvent = {
  time: string;
  period: number;
  team: string;
  description: string;
};

export type PowerPlayState = {
  isActive: boolean;
  teamOnPowerPlay: string | null;
  timeLeft: number; // in game ticks
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
  injuries: { teamName: string; playerId: string; injuryType: string; duration: number; }[];
  possessionHolder: string | null;
  powerPlayState: PowerPlayState;
};

export type GameDate = {
  year: number;
  month: string;
  week: number;
};

export type ScheduleEntry = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: GameDate;
  status: 'scheduled' | 'completed';
  result?: { homeScore: number; awayScore: number };
  round?: number;
};

export type DevelopmentLog = {
  playerId: string;
  playerName: string;
  attribute: string;
  change: number;
  newRating: number;
  date: GameDate;
};

export type Tactic = {
  phase: string;
  category: string;
  tactic: string;
  description: string;
  bestUsedWith: string;
  strongVs: string;
  weakVs: string;
};

export type TacticSuitability = {
  score: number;
  explanation: string;
};

export type TeamRecord = {
  playerName: string;
  teamName: string;
  value: number;
  season?: string;
};

export type RecordCategory = 'Goals' | 'Assists' | 'Points' | 'PenaltyMinutes' | 'GAA' | 'SavePercentage' | 'Shutouts';

export type LegacyRecord = {
  playerName: string;
  teamName: string;
  category: RecordCategory;
  type: 'season' | 'career';
  value: number;
  season?: string;
};

// Nationals Types
export type NationalsStanding = {
  teamName: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export type NationalsGroup = {
  name: string; // e.g., "Group A"
  teams: string[]; // team names
  standings: NationalsStanding[];
};

export type NationalsPlayoffMatch = {
  id: string;
  round: 'Quarter-Final' | 'Semi-Final' | 'Final';
  bracket: 'Gold' | 'Silver';
  homeTeam: string | { winnerOf: string };
  awayTeam: string | { winnerOf: string };
  winner?: string;
  result?: { homeScore: number; awayScore: number };
  status: 'scheduled' | 'completed';
  date: GameDate;
};

export type NationalsTournament = {
  division: string;
  year: number;
  groups: NationalsGroup[];
  groupStageSchedule: ScheduleEntry[];
  playoffSchedule: NationalsPlayoffMatch[];
  status: 'pending' | 'group-stage' | 'silver-playoffs' | 'gold-playoffs' | 'completed';
  winner?: string;
  currentRound: number | 'Quarter-Final' | 'Semi-Final' | 'Final';
};