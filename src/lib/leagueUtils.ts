// This object now serves as a base for known tiers and a template for extrapolating new, lower tiers.
export const divisionTierStats: { [key: number]: { name: string, skater: number, goalie: number, step: { skater: number, goalie: number } } } = {
    1: { name: "Checking 1", skater: 380, goalie: 175, step: { skater: 25, goalie: 12 } },
    2: { name: "Checking 2", skater: 330, goalie: 150, step: { skater: 20, goalie: 10 } },
    3: { name: "Non-Checking 1", skater: 300, goalie: 135, step: { skater: 20, goalie: 10 } },
    4: { name: "Non-Checking 2", skater: 270, goalie: 120, step: { skater: 20, goalie: 10 } },
    5: { name: "Non-Checking 3", skater: 240, goalie: 110, step: { skater: 20, goalie: 10 } },
};

const NON_CHECKING_BASE_RANK = 2;

/**
 * Programmatically gets the base tier name (e.g., "Non-Checking 4") from a full league division name.
 * @param leagueDivision The full name of the league division (e.g., "Non Checking 4 - North").
 * @returns The base tier name.
 */
export const getTierName = (leagueDivision: string): string => {
    if (leagueDivision.startsWith("Checking 1")) return "Checking 1";
    if (leagueDivision.startsWith("Checking 2")) return "Checking 2";
    
    const ncMatch = leagueDivision.match(/Non Checking (\d+)/);
    if (ncMatch && ncMatch[1]) {
        return `Non-Checking ${ncMatch[1]}`;
    }
    
    return "Unknown";
};

/**
 * Programmatically gets the numerical rank of a league division for easy comparison.
 * Lower number = higher rank.
 * Checking 1 = 1
 * Checking 2 = 2
 * Non-Checking 1 = 3
 * Non-Checking 2 = 4
 * ...
 * Non-Checking 10 = 12
 * @param leagueDivision The full name of the league division.
 * @returns The numerical rank of the division's tier.
 */
export const getDivisionRank = (leagueDivision: string): number => {
    if (leagueDivision.startsWith("Checking 1")) return 1;
    if (leagueDivision.startsWith("Checking 2")) return 2;

    const ncMatch = leagueDivision.match(/Non Checking (\d+)/);
    if (ncMatch && ncMatch[1]) {
        return NON_CHECKING_BASE_RANK + parseInt(ncMatch[1], 10);
    }

    return 99; // Return a high number for unknown/invalid tiers
};

/**
 * Gets the statistical data for a given league division's tier.
 * If the tier is below the predefined ones (e.g., Non-Checking 4), it extrapolates the stats.
 * @param leagueDivision The full name of the league division.
 * @returns The tier statistics object.
 */
export const getTierStats = (leagueDivision: string) => {
    const rank = getDivisionRank(leagueDivision);
    const knownRanks = Object.keys(divisionTierStats).map(Number);
    const maxKnownRank = Math.max(...knownRanks);

    if (divisionTierStats[rank]) {
        return divisionTierStats[rank];
    }

    // If rank is unknown or higher than our defined stats, extrapolate
    if (rank > maxKnownRank) {
        const baseStats = divisionTierStats[maxKnownRank];
        const rankDifference = rank - maxKnownRank;
        
        const extrapolatedSkater = baseStats.skater - (baseStats.step.skater * rankDifference);
        const extrapolatedGoalie = baseStats.goalie - (baseStats.step.goalie * rankDifference);

        return {
            name: getTierName(leagueDivision),
            skater: Math.max(50, extrapolatedSkater), // Set a floor value
            goalie: Math.max(20, extrapolatedGoalie), // Set a floor value
            step: baseStats.step, // Use the same step for further extrapolation
        };
    }

    // Fallback to the lowest known tier if something goes wrong
    return divisionTierStats[maxKnownRank];
};

/**
 * Programmatically gets the division a team would be promoted to.
 * @param leagueDivision The team's current full league division name.
 * @returns The target division name, or null if no promotion is possible.
 */
export const getPromotionTarget = (leagueDivision: string): string | null => {
    const regionMatch = leagueDivision.match(/ - (North|South)$/);
    const region = regionMatch ? ` - ${regionMatch[1]}` : '';

    if (leagueDivision.startsWith("Checking 1")) {
        return null;
    }
    if (leagueDivision.startsWith("Checking 2")) {
        return `Checking 1${region}`;
    }
    if (leagueDivision.startsWith("Non Checking 1")) {
        return `Checking 2${region}`;
    }

    const ncMatch = leagueDivision.match(/Non Checking (\d+)/);
    if (ncMatch && ncMatch[1]) {
        const currentTierNum = parseInt(ncMatch[1], 10);
        if (currentTierNum > 1) {
            return `Non Checking ${currentTierNum - 1}${region}`;
        }
    }

    return null;
};

/**
 * Programmatically gets the division a team would be relegated to.
 * This can generate new, lower divisions dynamically.
 * @param leagueDivision The team's current full league division name.
 * @returns The target division name.
 */
export const getRelegationTarget = (leagueDivision: string): string | null => {
    const regionMatch = leagueDivision.match(/ - (North|South)$/);
    const region = regionMatch ? ` - ${regionMatch[1]}` : '';

    if (leagueDivision.startsWith("Checking 1")) {
        return `Checking 2${region}`;
    }
    if (leagueDivision.startsWith("Checking 2")) {
        return `Non Checking 1${region}`;
    }

    const ncMatch = leagueDivision.match(/Non Checking (\d+)/);
    if (ncMatch && ncMatch[1]) {
        const currentTierNum = parseInt(ncMatch[1], 10);
        return `Non Checking ${currentTierNum + 1}${region}`;
    }

    return null;
};