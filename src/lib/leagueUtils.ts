export const divisionTiers: { [key: string]: { skater: number, goalie: number, step: { skater: number, goalie: number } } } = {
    "Checking 1":       { skater: 420, goalie: 195, step: { skater: 28, goalie: 13 } }, // Avg 15 per attr
    "Checking 2":       { skater: 364, goalie: 169, step: { skater: 28, goalie: 13 } }, // Avg 13 per attr
    "Non-Checking 1":   { skater: 308, goalie: 143, step: { skater: 28, goalie: 13 } }, // Avg 11 per attr
    "Non-Checking 2":   { skater: 252, goalie: 117, step: { skater: 28, goalie: 13 } }, // Avg 9 per attr
    "Non-Checking 3":   { skater: 140, goalie: 65,  step: { skater: 28, goalie: 13 } }, // Avg 5 per attr
};