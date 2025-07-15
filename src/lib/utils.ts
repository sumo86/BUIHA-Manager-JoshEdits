import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Player } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatPlayerEligibility = (player: Player) => {
  if ((player.eligibility === 'Masters' || player.eligibility === 'PhD') && player.yearsLeftInProgram !== undefined && player.yearsLeftInProgram > 0) {
      const yearsText = player.yearsLeftInProgram === 1 ? '1 year left' : `${player.yearsLeftInProgram} years left`;
      return `${player.eligibility} (${yearsText})`;
  }
  return player.eligibility;
};