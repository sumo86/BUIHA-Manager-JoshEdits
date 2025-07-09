export type Position = "C" | "LW" | "RW" | "LD" | "RD" | "G";
export type TrainingFocus = "Skating" | "Shooting" | "Playmaking" | "Defense" | "Physical" | "Mental" | "Goaltending" | null;

export interface SkaterAttributes {
  // Physical
  acceleration: number;
  agility: number;
  balance: number;
  fighting: number;
  speed: number;
  stamina: number;
  strength: number;
  hitting: number;
  // Mental
  aggression: number;
  bravery: number;
  determination: number;
  leadership: number;
  professionalism: number;
  teamPlayer: number;
  temperament: number;
  // Offensive
  gettingOpen: number;
  offensiveRead: number;
  passing: number;
  puckhandling: number;
  screening: number;
  shootingAccuracy: number;
  shootingRange: number;
  // Defensive
  checking: number;
  defensiveRead: number;
  faceoffs: number;
  positioning: number;
  shotBlocking: number;
  stickchecking: number;
  // Hidden
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
  passShootTendency: number;
  sportsmanship: number;
}

export interface GoalieAttributes {
  // Goaltender
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
  // Hidden
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
  leadership: number;
  loyalty: number;
  mood: number;
  professionalism: number;
  sportsmanship: number;
  determination: number;
}

export interface PlayerArchetype {
  position: 'Defenceman' | 'Centre' | 'Winger' | 'Goaltender';
  type: string;
  physicality?: 'Physical' | 'Non-Physical' | 'Puckhandler' | '';
  description: string;
}

export interface PlayerSeasonStats {
  season: string;
  team: string;
  league: string;
  gamesPlayed: number;
  // Skater stats
  goals?: number;
  assists?: number;
  points?: number;
  penaltyMinutes?: number;
  // Goalie stats
  goalsAgainstAverage?: number;
  savePercentage?: number;
  shutouts?: number;
  // Common
  captaincy?: 'C' | 'A' | null;
}

export interface Player {
  id: string;
  jerseyNumber: number;
  name: string;
  age: number;
  nationality: string;
  positions: Position[];
  starRating: number;
  morale: "Ecstatic" | "Happy" | "Content" | "Unhappy" | "Angry";
  healthStatus: "Healthy" | "Minor Injury" | "Major Injury";
  eligibility: "UG Year 1" | "UG Year 2" | "UG Year 3" | "UG Year 4" | "Masters" | "PhD" | "Staff";
  archetype: PlayerArchetype;
  attributes: SkaterAttributes | GoalieAttributes;
  currentAbility: number;
  potentialAbility: number;
  role?: string;
  roleSuitability: { [key: string]: number };
  captaincy?: 'C' | 'A' | null;
  yearsLeftInProgram?: number;
  history?: PlayerSeasonStats[];
  source?: 'Local' | 'Transfer' | 'International';
  estimatedQuality?: 'Beginner' | 'Moderate' | 'Intermediate' | 'Experienced' | 'Elite';
  recruitmentCost?: number;
  trainingFocus?: TrainingFocus;
}

export interface Tactic {
  phase: string;
  category: string;
  tactic: string;
  description: string;
  bestUsedWith: string;
  strongVs: string;
  weakVs:string;
}

export interface TacticSuitability {
    score: number; // 1-5
    explanation: string;
}

export interface Lineup {
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
}

export type TacticsSelection = {
  [category: string]: string;
};

export type BudgetCategory = "Travel" | "Equipment" | "Ice Time" | "Recruiting" | "Student Life" | "Facilities";

export interface BudgetAllocations {
  Travel: number;
  Equipment: number;
  "Ice Time": number;
  Recruiting: number;
  "Student Life": number;
  Facilities: number;
}

export interface Financials {
  totalBudget: number;
  budgetAllocations: BudgetAllocations;
  iceTimeCostPerGame: number;
  equipmentCost: number;
}

export interface FacilityProject {
  id: string;
  name: string;
  description: string;
  cost: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
  benefit: string;
}

export interface Team {
  name: string;
  leagueDivision: string;
  nationalsDivision: string;
  roster: Player[];
  lineup: Lineup;
  tactics: TacticsSelection;
  wins: number;
  losses: number;
  otLosses: number;
  goalsFor: number;
  goalsAgainst: number;
  financials: Financials;
  facilities: FacilityProject[];
}

export interface GameEvent {
  time: string;
  period: number;
  team?: string;
  description: string;
}

export interface GameState {
  userScore: number;
  opponentScore: number;
  period: number;
  time: number;
  gameLog: GameEvent[];
  isGameOver: boolean;
  isPaused: boolean;
}

export interface DevelopmentLog {
  playerId: string;
  playerName: string;
  attribute: string;
  change: number;
  newRating: number;
  date: {
    month: string;
    week: number;
    year: number;
  };
}