export type Position = "C" | "LW" | "RW" | "LD" | "RD" | "G";

export interface SkaterAttributes {
  skating: number;
  shooting: number;
  passing: number;
  puckControl: number;
  defensiveAwareness: number;
  stickChecking: number;
  bodyChecking: number;
  strength: number;
  aggressiveness: number;
  hockeyIQ: number;
}

export interface GoalieAttributes {
  gloveHigh: number;
  gloveLow: number;
  stickHigh: number;
  stickLow: number;
  fiveHole: number;
  positioning: number;
  reboundControl: number;
  puckHandling: number;
}

export interface PlayerArchetype {
  position: 'Defenceman' | 'Centre' | 'Winger' | 'Goaltender';
  type: string;
  physicality?: 'Physical' | 'Non-Physical' | 'Puckhandler' | ''; // Added 'Puckhandler'
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
}

export interface Team {
  name: string;
  leagueDivision: string;
  nationalsDivision: string;
  roster: Player[];
}