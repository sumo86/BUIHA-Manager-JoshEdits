export const divisionTiers: { [key: string]: { skater: number, goalie: number, step: { skater: number, goalie: number } } } = {
    "Checking 1":       { skater: 420, goalie: 195, step: { skater: 42, goalie: 20 } }, // Avg 15 per attr
    "Checking 2":       { skater: 364, goalie: 169, step: { skater: 42, goalie: 20 } }, // Avg 13 per attr
    "Non-Checking 1":   { skater: 280, goalie: 130, step: { skater: 42, goalie: 20 } }, // Avg 10 per attr
    "Non-Checking 2":   { skater: 196, goalie: 91,  step: { skater: 42, goalie: 20 } }, // Avg 7 per attr
    "Non-Checking 3":   { skater: 112, goalie: 52,  step: { skater: 42, goalie: 20 } }, // Avg 4 per attr
};