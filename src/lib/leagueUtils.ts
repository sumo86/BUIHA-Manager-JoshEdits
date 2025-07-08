export const divisionTiers: { [key: string]: { skater: number, goalie: number, step: { skater: number, goalie: number } } } = {
    'Checking 1': { skater: 450, goalie: 205, step: { skater: 25, goalie: 12 } }, // Narrower steps for higher stars
    'Checking 2': { skater: 390, goalie: 175, step: { skater: 25, goalie: 12 } }, // Narrower steps for higher stars
    'Non-Checking 1': { skater: 350, goalie: 155, step: { skater: 28, goalie: 13 } }, 
    'Non-Checking 2': { skater: 310, goalie: 135, step: { skater: 30, goalie: 15 } }, // Wider steps for lower stars
    'Non-Checking 3': { skater: 270, goalie: 115, step: { skater: 35, goalie: 18 } }, // Much wider steps for lowest stars
};