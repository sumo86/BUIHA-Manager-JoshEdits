import { TierInfo } from "@/context/TeamContext";

// This object is now keyed by a stable ID, not rank.
export const divisionTierStats: { [key: string]: { skater: number, goalie: number, step: { skater: number, goalie: number } } } = {
    'c1': { skater: 380, goalie: 175, step: { skater: 25, goalie: 12 } },
    'c2': { skater: 330, goalie: 150, step: { skater: 20, goalie: 10 } },
    'nc1': { skater: 300, goalie: 135, step: { skater: 20, goalie: 10 } },
    'nc2': { skater: 270, goalie: 120, step: { skater: 20, goalie: 10 } },
    'nc3': { skater: 240, goalie: 110, step: { skater: 20, goalie: 10 } },
};

/**
 * Gets the base tier name (e.g., "Checking 1") from a full league division name (e.g., "Checking 1 - North").
 */
export const getTierName = (leagueDivision: string): string => {
    const match = leagueDivision.match(/^(.*?)(\s*-\s*(North|South))?$/);
    return match ? match[1] : "Unknown";
};

/**
 * Gets the rank of a tier from the hierarchy. Rank is 1-based index.
 * @param tierName The name of the tier.
 * @param tierHierarchy The current league hierarchy.
 * @returns The numerical rank.
 */
export const getTierRank = (tierName: string, tierHierarchy: TierInfo[]): number => {
    const index = tierHierarchy.findIndex(t => t.name === tierName);
    return index !== -1 ? index + 1 : 99;
};

/**
 * Gets the numerical rank of a league division for easy comparison.
 * @param leagueDivision The full name of the league division.
 * @param tierHierarchy The current league hierarchy.
 * @returns The numerical rank of the division's tier.
 */
export const getDivisionRank = (leagueDivision: string, tierHierarchy: TierInfo[]): number => {
    const tierName = getTierName(leagueDivision);
    return getTierRank(tierName, tierHierarchy);
};

/**
 * Gets the statistical data for a given league division's tier.
 * @param leagueDivision The full name of the league division.
 * @param tierHierarchy The current league hierarchy.
 * @returns The tier statistics object.
 */
export const getTierStats = (leagueDivision: string, tierHierarchy: TierInfo[]) => {
    const tierName = getTierName(leagueDivision);
    const tierInfo = tierHierarchy.find(t => t.name === tierName);
    const fallbackStats = { skater: 100, goalie: 50, step: { skater: 10, goalie: 5 } };

    if (!tierInfo) return fallbackStats;

    const stats = divisionTierStats[tierInfo.id];
    if (stats) return stats;

    // Extrapolate for user-created tiers
    const currentIndex = tierHierarchy.findIndex(t => t.id === tierInfo.id);
    if (currentIndex > 0) {
        const tierAboveInfo = tierHierarchy[currentIndex - 1];
        const statsAbove = getTierStats(`${tierAboveInfo.name} - North`, tierHierarchy); // Recursive call to find nearest stats
        if (statsAbove) {
            return {
                skater: Math.max(50, statsAbove.skater - statsAbove.step.skater),
                goalie: Math.max(20, statsAbove.goalie - statsAbove.step.goalie),
                step: statsAbove.step
            };
        }
    }
    return fallbackStats;
};

/**
 * Gets the division a team would be promoted to from their current division.
 * @param leagueDivision The team's current full league division name.
 * @param tierHierarchy The current league hierarchy.
 * @returns The target division name, or null if no promotion is possible.
 */
export const getPromotionTarget = (leagueDivision: string, tierHierarchy: TierInfo[]): string | null => {
    const regionMatch = leagueDivision.match(/ - (North|South)$/);
    const region = regionMatch ? ` - ${regionMatch[1]}` : '';
    const currentTierName = getTierName(leagueDivision);
    const currentIndex = tierHierarchy.findIndex(t => t.name === currentTierName);

    if (currentIndex <= 0) return null;

    const promotionTier = tierHierarchy[currentIndex - 1];
    return promotionTier ? `${promotionTier.name}${region}` : null;
};

/**
 * Gets the division a team would be relegated to from their current division.
 * @param leagueDivision The team's current full league division name.
 * @param tierHierarchy The current league hierarchy.
 * @returns The target division name, or null if no relegation is possible.
 */
export const getRelegationTarget = (leagueDivision: string, tierHierarchy: TierInfo[]): string | null => {
    const regionMatch = leagueDivision.match(/ - (North|South)$/);
    const region = regionMatch ? ` - ${regionMatch[1]}` : '';
    const currentTierName = getTierName(leagueDivision);
    const currentIndex = tierHierarchy.findIndex(t => t.name === currentTierName);

    if (currentIndex === -1 || currentIndex >= tierHierarchy.length - 1) return null;

    const relegationTier = tierHierarchy[currentIndex + 1];
    return relegationTier ? `${relegationTier.name}${region}` : null;
};