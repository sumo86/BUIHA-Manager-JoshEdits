export const divisionTiers: { [key: string]: { skater: number, goalie: number, step: { skater: number, goalie: number } } } = {
    "Checking 1":       { skater: 420, goalie: 195, step: { skater: 210, goalie: 98 } }, // Avg 15 per attr, step ~avg/2
    "Checking 2":       { skater: 364, goalie: 169, step: { skater: 182, goalie: 85 } }, // Avg 13 per attr, step ~avg/2
    "Non-Checking 1":   { skater: 280, goalie: 130, step: { skater: 140, goalie: 65 } }, // Avg 10 per attr, step ~avg/2
    "Non-Checking 2":   { skater: 196, goalie: 91,  step: { skater: 98, goalie: 46 } }, // Avg 7 per attr, step ~avg/2
    "Non-Checking 3":   { skater: 112, goalie: 52,  step: { skater: 56, goalie: 26 } }, // Avg 4 per attr, step ~avg/2
};