// Tier definitions (1 is highest, 5 is lowest)
export const divisionTierStats = {
  1: { name: "Checking 1", skater: 335, goalie: 155, step: { skater: 40, goalie: 20 } },
  2: { name: "Checking 2", skater: 285, goalie: 135, step: { skater: 35, goalie: 18 } },
  3: { name: "Non-Checking 1", skater: 244, goalie: 113, step: { skater: 30, goalie: 15 } },
  4: { name: "Non-Checking 2", skater: 222, goalie: 103, step: { skater: 25, goalie: 12 } },
  5: { name: "Non-Checking 3", skater: 200, goalie: 90,  step: { skater: 20, goalie: 10 } },
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