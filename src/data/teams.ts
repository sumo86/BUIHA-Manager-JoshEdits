import { Team, Lineup, TacticsSelection, Player, Position } from "@/types";
import { generateRoster } from "@/lib/playerGenerator";
import { initialFacilityProjects } from './facilities';
import { teamLogos } from './logos';

const teamData = [
    // Checking 1 - North
    { name: "St Andrews Typhoons", leagueDivision: "Checking 1 - North" },
    { name: "Sheffield Bears", leagueDivision: "Checking 1 - North" },
    { name: "Edinburgh Eagles", leagueDivision: "Checking 1 - North" },
    { name: "Nottingham Mavericks", leagueDivision: "Checking 1 - North" },
    { name: "Leeds Gryphons", leagueDivision: "Checking 1 - North" },
    { name: "Nottingham Mavericks B", leagueDivision: "Checking 1 - North" },
    // Checking 1 - South
    { name: "Oxford University Blues", leagueDivision: "Checking 1 - South" },
    { name: "London Dragons", leagueDivision: "Checking 1 - South" },
    { name: "Cambridge Blues", leagueDivision: "Checking 1 - South" },
    { name: "Southampton Spitfires", leagueDivision: "Checking 1 - South" },
    { name: "UCL Yetis", leagueDivision: "Checking 1 - South" },
    // Checking 2 - North
    { name: "Manchester Metros", leagueDivision: "Checking 2 - North" },
    { name: "Northumbria Kings", leagueDivision: "Checking 2 - North" },
    { name: "Sheffield Bears B", leagueDivision: "Checking 2 - North" },
    { name: "Glasgow Stags", leagueDivision: "Checking 2 - North" },
    // Checking 2 - South
    { name: "Imperial Devils", leagueDivision: "Checking 2 - South" },
    { name: "Birmingham Lions", leagueDivision: "Checking 2 - South" },
    { name: "Oxford Vikings", leagueDivision: "Checking 2 - South" },
    { name: "Cardiff Redhawks", leagueDivision: "Checking 2 - South" },
    // Non Checking 1 - North
    { name: "Nottingham Mavericks C", leagueDivision: "Non Checking 1 - North" },
    { name: "Sheffield Bears C", leagueDivision: "Non Checking 1 - North" },
    { name: "Manchester Metros B", leagueDivision: "Non Checking 1 - North" },
    { name: "Leeds Gryphons B", leagueDivision: "Non Checking 1 - North" },
    { name: "Newcastle Wildcats", leagueDivision: "Non Checking 1 - North" },
    { name: "Northumbria Kings B", leagueDivision: "Non Checking 1 - North" },
    // Non Checking 1 - South
    { name: "Oxford Vikings B", leagueDivision: "Non Checking 1 - South" },
    { name: "Southampton Spitfires B", leagueDivision: "Non Checking 1 - South" },
    { name: "Cambridge Huskies", leagueDivision: "Non Checking 1 - South" },
    { name: "Birmingham Lions B", leagueDivision: "Non Checking 1 - South" },
    { name: "UEA Avalanche", leagueDivision: "Non Checking 1 - South" },
    // Non Checking 2 - North
    { name: "Glasgow Stags B", leagueDivision: "Non Checking 2 - North" },
    { name: "Sheffield Bears D", leagueDivision: "Non Checking 2 - North" },
    { name: "Hull Ice Hogs", leagueDivision: "Non Checking 2 - North" },
    { name: "Nottingham Mavericks D", leagueDivision: "Non Checking 2 - North" },
    // Non Checking 2 - South
    { name: "Kent Knights", leagueDivision: "Non Checking 2 - South" },
    { name: "Warwick and Coventry Panthers", leagueDivision: "Non Checking 2 - South" },
    { name: "Southampton Spitfires C", leagueDivision: "Non Checking 2 - South" },
    { name: "Cardiff Redhawks B", leagueDivision: "Non Checking 2 - South" },
    { name: "Oxford Vikings C", leagueDivision: "Non Checking 2 - South" },
    { name: "Imperial Devils B", leagueDivision: "Non Checking 2 - South" },
    { name: "UCL Yetis B", leagueDivision: "Non Checking 2 - South" },
    // Non Checking 3 - North
    { name: "Sheffield Bears E", leagueDivision: "Non Checking 3 - North" },
    { name: "Manchester Metros C", leagueDivision: "Non Checking 3 - North" },
    { name: "Leeds Gryphons C", leagueDivision: "Non Checking 3 - North" },
    { name: "Hull Ice Hogs B", leagueDivision: "Non Checking 3 - North" },
    { name: "Nottingham Mavericks E", leagueDivision: "Non Checking 3 - North" },
    { name: "Northumbria Kings C", leagueDivision: "Non Checking 3 - North" },
    { name: "Glasgow Stags C", leagueDivision: "Non Checking 3 - North" },
    { name: "Newcastle Wildcats B", leagueDivision: "Non Checking 3 - North" },
    // Non Checking 3 - South
    { name: "Birmingham Lions C", leagueDivision: "Non Checking 3 - South" },
    { name: "Southampton Spitfires D", leagueDivision: "Non Checking 3 - South" },
    { name: "Warwick and Coventry Panthers B", leagueDivision: "Non Checking 3 - South" },
    { name: "Birmingham Lions D", leagueDivision: "Non Checking 3 - South" },
    { name: "Bristol Bloodhounds", leagueDivision: "Non Checking 3 - South" },
    { name: "Imperial Devils C", leagueDivision: "Non Checking 3 - South" },
    { name: "UEA Avalanche B", leagueDivision: "Non Checking 3 - South" },
];

const getNationalsDivision = (leagueDivision: string): string => {
    if (leagueDivision.startsWith("Checking 1")) return "Checking 1";
    if (leagueDivision.startsWith("Checking 2")) return "Checking 2";
    if (leagueDivision.startsWith("Non Checking 1")) return "Non-Checking 1";
    if (leagueDivision.startsWith("Non Checking 2")) return "Non-Checking 2";
    if (leagueDivision.startsWith("Non Checking 3")) return "Non-Checking 3";
    return "Unknown";
}

const defaultTactics: TacticsSelection = {
    "Breakout": "Flexible Reaction",
    "Neutral Zone Offence": "Balanced Attack",
    "Attacking Zone Offence": "Lane Positioning",
    "Forechecking": "1-2-2",
    "Neutral Zone Coverage": "1-2-2 Retreat",
    "Defensive Zone Coverage": "Strict Zonal",
};

const populateLineup = (roster: Player[]): Lineup => {
    const lineup: Lineup = {
        forwards: { lw: Array(3).fill(null), c: Array(3).fill(null), rw: Array(3).fill(null) },
        defence: { ld: Array(3).fill(null), rd: Array(3).fill(null) },
        goalies: { starter: null, backup: null },
    };

    const playerPool = [...roster];

    const assignPlayer = (position: Position) => {
        let bestPlayerIndex = playerPool.findIndex(p => p.positions[0] === position);
        if (bestPlayerIndex === -1) {
            bestPlayerIndex = playerPool.findIndex(p => p.positions.includes(position));
        }
        if (bestPlayerIndex !== -1) {
            return playerPool.splice(bestPlayerIndex, 1)[0].id;
        }
        return null;
    };

    for (let i = 0; i < 3; i++) {
        lineup.forwards.lw[i] = assignPlayer('LW');
        lineup.forwards.c[i] = assignPlayer('C');
        lineup.forwards.rw[i] = assignPlayer('RW');
    }
    for (let i = 0; i < 3; i++) {
        lineup.defence.ld[i] = assignPlayer('LD');
        lineup.defence.rd[i] = assignPlayer('RD');
    }
    lineup.goalies.starter = assignPlayer('G');
    lineup.goalies.backup = assignPlayer('G');

    return lineup;
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

export const teams: Team[] = teamData.map(team => {
    const roster = generateRoster(team.leagueDivision, team.name);
    const lineup = populateLineup(roster);
    const orgName = getOrganizationName(team.name);
    return {
        ...team,
        nationalsDivision: getNationalsDivision(team.leagueDivision),
        roster: roster,
        lineup: lineup,
        tactics: defaultTactics,
        wins: 0, losses: 0, otLosses: 0, goalsFor: 0, goalsAgainst: 0,
        logo: teamLogos[orgName],
        financials: {
            totalBudget: 15000,
            iceTimeCostPerGame: 350,
            equipmentCost: Math.floor(Math.random() * (2500 - 1500 + 1)) + 1500,
            budgetAllocations: { Travel: 0, Equipment: 0, "Ice Time": 0, Recruiting: 0, "Student Life": 0, Facilities: 0 },
        },
        facilities: initialFacilityProjects.map(p => ({ ...p })),
    };
});

export const getTeamOrganizations = () => {
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