export type Position = "C" | "LW" | "RW" | "LD" | "RD" | "G";

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
  eligibility: "UG Year 1" | "UG Year 2" | "UG Year 3" | "UG Year 4 (Masters)" | "PhD" | "Alumni";
  archetype: PlayerArchetype;
  attributes: SkaterAttributes | GoalieAttributes;
  currentAbility: number;
  potentialAbility: number;
  role?: string;
  roleSuitability: { [key: string]: number };
}

export interface Team {
  name: string;
  leagueDivision: string;
  nationalsDivision: string;
  roster: Player[];
}