// --- Star Rating Ability Thresholds (from refined_current_ability_totals.csv) ---

const skaterAbilityThresholds: Record<string, Record<number, { min: number; max: number }>> = {
    "Checking 1": {
        1: { min: 0, max: 295 }, 1.5: { min: 296, max: 305 }, 2: { min: 306, max: 325 },
        2.5: { min: 326, max: 345 }, 3: { min: 346, max: 365 }, 3.5: { min: 366, max: 385 },
        4: { min: 386, max: 410 }, 4.5: { min: 411, max: 467 }, 5: { min: 468, max: 999 },
    },
    "Checking 2": {
        1: { min: 0, max: 245 }, 1.5: { min: 246, max: 265 }, 2: { min: 266, max: 285 },
        2.5: { min: 286, max: 305 }, 3: { min: 306, max: 325 }, 3.5: { min: 326, max: 345 },
        4: { min: 346, max: 365 }, 4.5: { min: 366, max: 385 }, 5: { min: 386, max: 999 },
    },
    "Non-Checking 1": {
        1: { min: 0, max: 230 }, 1.5: { min: 231, max: 250 }, 2: { min: 251, max: 270 },
        2.5: { min: 271, max: 290 }, 3: { min: 291, max: 310 }, 3.5: { min: 311, max: 330 },
        4: { min: 331, max: 350 }, 4.5: { min: 351, max: 370 }, 5: { min: 371, max: 999 },
    },
    "Non-Checking 2": {
        1: { min: 0, max: 200 }, 1.5: { min: 201, max: 220 }, 2: { min: 221, max: 240 },
        2.5: { min: 241, max: 260 }, 3: { min: 261, max: 280 }, 3.5: { min: 281, max: 300 },
        4: { min: 301, max: 320 }, 4.5: { min: 321, max: 340 }, 5: { min: 341, max: 999 },
    },
    "Non-Checking 3": {
        1: { min: 0, max: 180 }, 1.5: { min: 181, max: 200 }, 2: { min: 201, max: 220 },
        2.5: { min: 221, max: 240 }, 3: { min: 241, max: 260 }, 3.5: { min: 261, max: 280 },
        4: { min: 281, max: 300 }, 4.5: { min: 301, max: 320 }, 5: { min: 321, max: 999 },
    },
};

// Scale skater thresholds for goalies (approx. 0.46 ratio based on max possible ability)
const goalieAbilityThresholds: Record<string, Record<number, { min: number; max: number }>> = {};
for (const division in skaterAbilityThresholds) {
    goalieAbilityThresholds[division] = {};
    for (const star in skaterAbilityThresholds[division]) {
        goalieAbilityThresholds[division][star] = {
            min: Math.round(skaterAbilityThresholds[division][star].min * 0.46),
            max: Math.round(skaterAbilityThresholds[division][star].max * 0.46),
        };
    }
}

// --- Star Rating Distribution (from Star_Rating_Distribution_by_Division.csv) ---

export const starRatingDistribution: Record<string, Record<number, { min: number; max: number }>> = {
    "Checking 1": {
        1: { min: 0.5, max: 1 }, 1.5: { min: 1, max: 2 }, 2: { min: 2, max: 4 },
        2.5: { min: 6, max: 8 }, 3: { min: 15, max: 18 }, 3.5: { min: 20, max: 22 },
        4: { min: 22, max: 24 }, 4.5: { min: 12, max: 15 }, 5: { min: 5, max: 6 },
    },
    "Checking 2": {
        1: { min: 1, max: 2 }, 1.5: { min: 2, max: 3 }, 2: { min: 4, max: 6 },
        2.5: { min: 8, max: 10 }, 3: { min: 18, max: 20 }, 3.5: { min: 22, max: 25 },
        4: { min: 20, max: 22 }, 4.5: { min: 10, max: 12 }, 5: { min: 3, max: 4 },
    },
    "Non-Checking 1": {
        1: { min: 3, max: 5 }, 1.5: { min: 5, max: 7 }, 2: { min: 8, max: 10 },
        2.5: { min: 10, max: 12 }, 3: { min: 20, max: 22 }, 3.5: { min: 18, max: 20 },
        4: { min: 12, max: 14 }, 4.5: { min: 6, max: 8 }, 5: { min: 2, max: 3 },
    },
    "Non-Checking 2": {
        1: { min: 6, max: 8 }, 1.5: { min: 8, max: 10 }, 2: { min: 13, max: 15 },
        2.5: { min: 18, max: 20 }, 3: { min: 20, max: 22 }, 3.5: { min: 14, max: 16 },
        4: { min: 8, max: 10 }, 4.5: { min: 2, max: 4 }, 5: { min: 0.5, max: 1 },
    },
    "Non-Checking 3": {
        1: { min: 8, max: 10 }, 1.5: { min: 10, max: 12 }, 2: { min: 15, max: 18 },
        2.5: { min: 18, max: 22 }, 3: { min: 18, max: 22 }, 3.5: { min: 12, max: 15 },
        4: { min: 6, max: 8 }, 4.5: { min: 2, max: 3 }, 5: { min: 0.5, max: 1 },
    },
};

// --- Helper Functions ---

export const getDivisionBaseName = (leagueDivision: string): string => {
    // Check for more specific names first to avoid incorrect partial matches
    if (leagueDivision.includes("Non-Checking 1")) return "Non-Checking 1";
    if (leagueDivision.includes("Non-Checking 2")) return "Non-Checking 2";
    if (leagueDivision.includes("Non-Checking 3")) return "Non-Checking 3";
    if (leagueDivision.includes("Checking 1")) return "Checking 1";
    if (leagueDivision.includes("Checking 2")) return "Checking 2";
    
    return "Non-Checking 3"; // Default for safety, e.g., for "Unattached" recruits
};

export const getAbilityThresholds = (isSkater: boolean, leagueDivision: string) => {
    const baseName = getDivisionBaseName(leagueDivision);
    return isSkater ? skaterAbilityThresholds[baseName] : goalieAbilityThresholds[baseName];
};

export const calculateStarRating = (currentAbility: number, isSkater: boolean, leagueDivision: string): number => {
    const thresholds = getAbilityThresholds(isSkater, leagueDivision);
    // Iterate from highest star to lowest
    for (const star of [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1]) {
        if (thresholds[star] && currentAbility >= thresholds[star].min) {
            return star;
        }
    }
    return 1;
};