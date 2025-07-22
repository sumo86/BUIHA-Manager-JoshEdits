// A mapping of tier names to their stats, used for various calculations.
// Note: The 'skater' and 'goalie' average abilities here are now secondary to the precise ranges in abilityRanges.ts for star rating,
// but they can still be useful for other game logic like recruit generation quality estimation.
export const divisionTierStats: { [key: number]: { name: string, skater: number, goalie: number, step: { skater: number, goalie: number } } } = {
    1: { name: "Checking 1", skater: 380, goalie: 175, step: { skater: 25, goalie: 12 } },
    2: { name: "Checking 2", skater: 330, goalie: 150, step: { skater: 20, goalie: 10 } },
    3: { name: "Non-Checking 1", skater: 300, goalie: 135, step: { skater: 20, goalie: 10 } },
    4: { name: "Non-Checking 2", skater: 270, goalie: 120, step: { skater: 20, goalie: 10 } },
    5: { name: "Non-Checking 3", skater: 240, goalie: 110, step: { skater: 20, goalie: 10 } },
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
    if (leagueDivision.startsWith("Non-Checking 1") || leagueDivision.startsWith("Non Checking 1")) return "Non-Checking 1";
    if (leagueDivision.startsWith("Non-Checking 2") || leagueDivision.startsWith("Non Checking 2")) return "Non-Checking 2";
    if (leagueDivision.startsWith("Non-Checking 3") || leagueDivision.startsWith("Non Checking 3")) return "Non-Checking 3";
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
    return tier || divisionTierStats[5];
};

const tierOrder: string[] = [
    "Checking 1",
    "Checking 2",
    "Non-Checking 1",
    "Non-Checking 2",
    "Non-Checking 3",
];

const extractRegion = (leagueDivision: string, tierName: string): string => {
    // Handle both "Non-Checking" and "Non Checking" when replacing
    const tierNameWithoutHyphen = tierName.replace('-', ' ');
    if (leagueDivision.startsWith(tierName)) {
        return leagueDivision.replace(tierName, '').trim();
    }
    if (leagueDivision.startsWith(tierNameWithoutHyphen)) {
        return leagueDivision.replace(tierNameWithoutHyphen, '').trim();
    }
    return '';
};

export const getPromotionDivision = (leagueDivision: string): string | null => {
    const currentTierName = getTierName(leagueDivision);
    if (currentTierName === "Unknown" || currentTierName === "Checking 1") {
        return null; // Cannot be promoted from the top tier or an unknown tier
    }

    const currentIndex = tierOrder.indexOf(currentTierName);
    if (currentIndex === -1 || currentIndex === 0) {
        return null; // Should be caught by the check above, but for safety
    }

    const newTierName = tierOrder[currentIndex - 1];
    const region = extractRegion(leagueDivision, currentTierName);

    return region ? `${newTierName} ${region}` : newTierName;
};

export const getRelegationDivision = (leagueDivision: string): string | null => {
    const currentTierName = getTierName(leagueDivision);
    if (currentTierName === "Unknown" || currentTierName === "Non-Checking 3") {
        return null; // Cannot be relegated from the bottom tier or an unknown tier
    }

    const currentIndex = tierOrder.indexOf(currentTierName);
    if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
        return null; // Should be caught by the check above, but for safety
    }

    const newTierName = tierOrder[currentIndex + 1];
    const region = extractRegion(leagueDivision, currentTierName);

    return region ? `${newTierName} ${region}` : newTierName;
};