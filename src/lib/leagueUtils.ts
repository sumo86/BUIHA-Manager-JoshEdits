import { Team } from "@/types";

// A mapping of tier names to their stats, used for various calculations.
// Note: The 'skater' and 'goalie' average abilities here are now secondary to the precise ranges in abilityRanges.ts for star rating,
// but they can still be useful for other game logic like recruit generation quality estimation.
export const divisionTierStats: { [key: number]: { name: string, skater: number, goalie: number, step: { skater: number, goalie: number }, baseBudget: number } } = {
    1: { name: "Checking 1", skater: 380, goalie: 175, step: { skater: 25, goalie: 12 }, baseBudget: 10000 },
    2: { name: "Checking 2", skater: 330, goalie: 150, step: { skater: 20, goalie: 10 }, baseBudget: 8000 },
    3: { name: "Non-Checking 1", skater: 300, goalie: 135, step: { skater: 20, goalie: 10 }, baseBudget: 6000 },
    4: { name: "Non-Checking 2", skater: 270, goalie: 120, step: { skater: 20, goalie: 10 }, baseBudget: 4000 },
    5: { name: "Non-Checking 3", skater: 240, goalie: 110, step: { skater: 20, goalie: 10 }, baseBudget: 2000 },
};

/**
 * Gets the base tier name (e.g., "Checking 1") from a full league division name (e.g., "Checking 1 - North").
 * This is the centralized function to ensure consistent tier identification.
 * @param leagueDivision The full name of the league division.
 * @returns The base tier name.
 */
export const getTierName = (leagueDivision: string): string => {
    if (leagueDivision.startsWith("Checking 1")) return "Checking 1";
    if (leagueDivision.startsWith("Checking 2")) return "Checking 2";
    if (leagueDivision.startsWith("Non-Checking 1")) return "Non-Checking 1";
    if (leagueDivision.startsWith("Non-Checking 2")) return "Non-Checking 2";
    if (leagueDivision.startsWith("Non-Checking 3")) return "Non-Checking 3";
    return "Unknown";
};

/**
 * Gets the statistical data for a given league division's tier.
 * @param leagueDivision The full name of the league division.
 * @returns The tier statistics object.
 */
export const getTierStats = (leagueDivision: string): { name: string, skater: number, goalie: number, step: { skater: number, goalie: number }, baseBudget: number } => {
    const tierName = getTierName(leagueDivision);
    const tier = Object.values(divisionTierStats).find(t => t.name === tierName);
    // Fallback to the lowest tier if no match is found, to prevent errors.
    return tier || divisionTierStats[5];
};

/**
 * Statically calculates the number of games in a season for a given division.
 * This is based on the typical size of these divisions.
 * @param leagueDivision The full name of the league division.
 * @returns The number of games to be played.
 */
export const getGamesPlayedForDivision = (leagueDivision: string): number => {
    if (leagueDivision.includes('Checking 1')) return 10;
    if (leagueDivision.includes('Checking 2')) return 6;
    if (leagueDivision.includes('Non-Checking 1')) return 10;
    if (leagueDivision.includes('Non-Checking 2 - South')) return 12;
    if (leagueDivision.includes('Non-Checking 2')) return 6;
    if (leagueDivision.includes('Non-Checking 3 - South')) return 12;
    if (leagueDivision.includes('Non-Checking 3')) return 14; // North has 8 teams, so 14 games
    return 10; // Default fallback
};