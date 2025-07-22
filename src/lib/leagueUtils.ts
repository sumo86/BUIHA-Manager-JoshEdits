// A mapping of tier names to their stats, used for various calculations.
// Note: The 'skater' and 'goalie' average abilities here are now secondary to the precise ranges in abilityRanges.ts for star rating,
// but they can still be useful for other game logic like recruit generation quality estimation.
export const divisionTierStats: { [key: number]: { name: string, skater: number, goalie: number, step: { skater: number, goalie: number } } } = {
    1: { name: "Checking 1", skater: 380, goalie: 175, step: { skater: 25, goalie: 12 } },
    2: { name: "Checking 2", skater: 330, goalie: 150, step: { skater: 20, goalie: 10 } },
    3: { name: "Non-Checking 1", skater: 300, goalie: 135, step: { skater: 20, goalie: 10 } },
    4: { name: "Non-Checking 2", skater: 270, goalie: 120, step: { skater: 20, goalie: 10 } },
    5: { name: "Non-Checking 3", skater: 240, goalie: 110, step: { skater: 20, goalie: 10 } },
    6: { name: "Non-Checking 4", skater: 210, goalie: 100, step: { skater: 15, goalie: 8 } },
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
    if (leagueDivision.startsWith("Non Checking 1")) return "Non-Checking 1";
    if (leagueDivision.startsWith("Non Checking 2")) return "Non-Checking 2";
    if (leagueDivision.startsWith("Non Checking 3")) return "Non-Checking 3";
    if (leagueDivision.startsWith("Non Checking 4")) return "Non-Checking 4";
    return "Unknown";
};

/**
 * Gets the statistical data for a given league division's tier.
 * @param leagueDivision The full name of the league division.
 * @returns The tier statistics object.
 */
export const getTierStats = (leagueDivision: string) => {
    const tierName = getTierName(leagueDivision);
    const tier = Object.values(divisionTierStats).find(t => t.name === tierName);
    // Fallback to the lowest tier if no match is found, to prevent errors.
    return tier || divisionTierStats[6];
};

// --- Promotion & Relegation System ---

// Defines the numerical rank of each tier, where a lower number is a higher rank.
export const tierRanks: { [key: string]: number } = {
    "Checking 1": 1,
    "Checking 2": 2,
    "Non-Checking 1": 3,
    "Non-Checking 2": 4,
    "Non-Checking 3": 5,
    "Non-Checking 4": 6,
};

/**
 * Gets the numerical rank of a league division for easy comparison.
 * @param leagueDivision The full name of the league division.
 * @returns The numerical rank of the division's tier.
 */
export const getDivisionRank = (leagueDivision: string): number => {
    const tierName = getTierName(leagueDivision);
    return tierRanks[tierName] || 99; // Return a high number for unknown/invalid tiers
};

// A definitive map of the league structure for promotions and relegations.
const leagueHierarchy: { [key: string]: { promotionTarget: string | null, relegationTarget: string | null } } = {
    // Checking 1
    "Checking 1 - North": { promotionTarget: null, relegationTarget: "Checking 2 - North" },
    "Checking 1 - South": { promotionTarget: null, relegationTarget: "Checking 2 - South" },
    // Checking 2
    "Checking 2 - North": { promotionTarget: "Checking 1 - North", relegationTarget: "Non Checking 1 - North" },
    "Checking 2 - South": { promotionTarget: "Checking 1 - South", relegationTarget: "Non Checking 1 - South" },
    // Non Checking 1
    "Non Checking 1 - North": { promotionTarget: "Checking 2 - North", relegationTarget: "Non Checking 2 - North" },
    "Non Checking 1 - South": { promotionTarget: "Checking 2 - South", relegationTarget: "Non Checking 2 - South" },
    // Non Checking 2
    "Non Checking 2 - North": { promotionTarget: "Non Checking 1 - North", relegationTarget: "Non Checking 3 - North" },
    "Non Checking 2 - South": { promotionTarget: "Non Checking 1 - South", relegationTarget: "Non Checking 3 - South" },
    // Non Checking 3
    "Non Checking 3 - North": { promotionTarget: "Non Checking 2 - North", relegationTarget: "Non Checking 4 - North" },
    "Non Checking 3 - South": { promotionTarget: "Non Checking 2 - South", relegationTarget: "Non Checking 4 - South" },
    // Non Checking 4
    "Non Checking 4 - North": { promotionTarget: "Non Checking 3 - North", relegationTarget: null },
    "Non Checking 4 - South": { promotionTarget: "Non Checking 3 - South", relegationTarget: null },
};

/**
 * Gets the division a team would be promoted to from their current division.
 * @param leagueDivision The team's current full league division name.
 * @returns The target division name, or null if no promotion is possible.
 */
export const getPromotionTarget = (leagueDivision: string): string | null => {
    return leagueHierarchy[leagueDivision]?.promotionTarget || null;
};

/**
 * Gets the division a team would be relegated to from their current division.
 * @param leagueDivision The team's current full league division name.
 * @returns The target division name, or null if no relegation is possible.
 */
export const getRelegationTarget = (leagueDivision: string): string | null => {
    return leagueHierarchy[leagueDivision]?.relegationTarget || null;
};