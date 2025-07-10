export const divisionTiers = {
    'Checking 1': { skater: 350, goalie: 160, step: { skater: 20, goalie: 10 } },
    'Checking 2': { skater: 300, goalie: 140, step: { skater: 20, goalie: 10 } },
    'Non Checking 1': { skater: 300, goalie: 140, step: { skater: 20, goalie: 10 } },
    'Non Checking 2': { skater: 250, goalie: 120, step: { skater: 20, goalie: 10 } },
    'Non Checking 3': { skater: 200, goalie: 100, step: { skater: 20, goalie: 10 } },
};

export const getGamesPlayedForDivision = (leagueDivision: string): number => {
    if (leagueDivision.includes('Checking 1')) return 10;
    if (leagueDivision === 'Checking 2 - North') return 6;
    if (leagueDivision === 'Checking 2 - South') return 12;
    if (leagueDivision.includes('Non Checking 1')) return 10;
    if (leagueDivision === 'Non Checking 2 - North') return 6;
    if (leagueDivision === 'Non Checking 2 - South') return 12;
    if (leagueDivision.includes('Non Checking 3')) return 6;
    return 10; // Default for any other case
};