// Tier definitions (1 is highest, 5 is lowest)
export const divisionTierStats = {
  1: { name: "Checking 1", skater: 350, goalie: 160, step: { skater: 45, goalie: 22 } }, // Highest skill, largest step
  2: { name: "Checking 2", skater: 290, goalie: 130, step: { skater: 40, goalie: 20 } },
  3: { name: "Non-Checking 1", skater: 230, goalie: 100, step: { skater: 35, goalie: 17 } },
  4: { name: "Non-Checking 2", skater: 170, goalie: 70, step: { skater: 30, goalie: 15 } },
  5: { name: "Non-Checking 3", skater: 110, goalie: 40,  step: { skater: 25, goalie: 12 } }, // Lowest skill, smallest step
};

// Mapping from full division names in the data to a tier ID
export const divisionToTierMap: { [key: string]: number } = {
    "BUIHA Checking 1": 1,
    "BUIHA Checking 2": 2,
    "BUIHA Non-Checking 1": 3,
    "BUIHA Non-Checking 2 - North": 4,
    "BUIHA Non-Checking 2 - South": 4,
    "BUIHA Non-Checking 3": 5,
};

// Helper function to get tier stats from a full division name
export const getTierStats = (leagueDivision: string) => {
    const tierId = divisionToTierMap[leagueDivision] || 5; // Default to lowest tier
    return divisionTierStats[tierId as keyof typeof divisionTierStats];
};