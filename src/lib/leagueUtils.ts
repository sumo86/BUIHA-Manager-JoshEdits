import { Team } from '@/types';

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

const orgMap: { [key: string]: string } = {
    'Oxford University Blues': 'Oxford University',
    'Oxford Vikings': 'Oxford University',
    'Cambridge Blues': 'Cambridge University',
    'Cambridge Huskies': 'Cambridge University',
};

export const getOrganizationName = (teamName: string): string => {
    const mappedOrg = Object.keys(orgMap).find(key => teamName.startsWith(key));
    if (mappedOrg) return orgMap[mappedOrg];
    return teamName.replace(/ (B|C|D|E)$/, '').trim();
};

export const getTeamOrganizations = (teams: Team[]) => {
    const organizations: { [key: string]: { name: string, teams: Team[] } } = {};

    teams.forEach(team => {
        const orgName = getOrganizationName(team.name);
        if (!organizations[orgName]) {
            organizations[orgName] = { name: orgName, teams: [] };
        }
        organizations[orgName].teams.push(team);
    });

    Object.values(organizations).forEach(org => {
        org.teams.sort((a, b) => a.name.localeCompare(b.name));
    });

    return Object.values(organizations).sort((a, b) => a.name.localeCompare(b.name));
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
    if (leagueDivision.startsWith("Non-Checking 1")) return "Non-Checking 1";
    if (leagueDivision.startsWith("Non-Checking 2")) return "Non-Checking 2";
    if (leagueDivision.startsWith("Non-Checking 3")) return "Non-Checking 3";
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

export const divisionHierarchy = [
    "Checking 1",
    "Checking 2",
    "Non-Checking 1",
    "Non-Checking 2",
    "Non-Checking 3",
];

export const getAdjacentDivision = (currentDivision: string, direction: 'up' | 'down'): string | null => {
    const parts = currentDivision.split(' - ');
    if (parts.length !== 2) return null;

    const baseDivision = getTierName(currentDivision);
    const region = parts[1];

    const currentIndex = divisionHierarchy.indexOf(baseDivision);

    if (currentIndex === -1) return null;

    if (direction === 'up') {
        if (currentIndex === 0) return null;
        const nextDivisionBase = divisionHierarchy[currentIndex - 1];
        return `${nextDivisionBase} - ${region}`;
    } else {
        if (currentIndex === divisionHierarchy.length - 1) return null;
        const nextDivisionBase = divisionHierarchy[currentIndex + 1];
        return `${nextDivisionBase} - ${region}`;
    }
};