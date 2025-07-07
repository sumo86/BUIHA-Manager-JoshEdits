export type Position = "C" | "LW" | "RW" | "LD" | "RD" | "G";

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
}

export interface Team {
  name: string;
  leagueDivision: string;
  nationalsDivision: string;
  roster: Player[];
}