import { Team, Lineup, TacticsSelection, Player } from "@/types";
import { generateRoster, getGamesPlayedForDivision } from "@/lib/playerGenerator";
import { initialFacilityProjects } from './facilities';
import { teamLogos } from './logos';
import { getTierName as getNationalsDivision, getOrganizationName } from '@/lib/leagueUtils';
import { populateLineup } from '@/lib/lineupUtils';

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

const defaultTactics: TacticsSelection = {
    "Breakout": "Flexible Reaction",
    "Neutral Zone Offence": "Balanced Attack",
    "Attacking Zone Offence": "Lane Positioning",
    "Forechecking": "1-2-2",
    "Neutral Zone Coverage": "1-2-2 Retreat",
    "Defensive Zone Coverage": "Strict Zonal",
};

const organizations: { [key: string]: { name: string, teamsData: any[] } } = {};
teamData.forEach(team => {
    const orgName = getOrganizationName(team.name);
    if (!organizations[orgName]) {
        organizations[orgName] = { name: orgName, teamsData: [] };
    }
    organizations[orgName].teamsData.push(team);
});

export const teams: Team[] = Object.values(organizations).flatMap(org => {
    const isMultiTeamOrg = org.teamsData.length > 1;
    const orgTotalBudget = 10000 + (org.teamsData.length * 7500);

    return org.teamsData.map(teamInfo => {
        const roster = generateRoster(teamInfo.leagueDivision, teamInfo.name);
        const lineup = populateLineup(roster);
        const teamBudget = isMultiTeamOrg ? orgTotalBudget / org.teamsData.length : 15000;
        const equipmentCost = Math.floor(Math.random() * (2500 - 1500 + 1)) + 1500;

        const totalGames = getGamesPlayedForDivision(teamInfo.leagueDivision);
        const numberOfHomeGames = Math.floor(totalGames / 2);
        const numberOfAwayGames = Math.ceil(totalGames / 2);
        const iceTimeCost = numberOfHomeGames * 350;
        const travelCost = numberOfAwayGames * 500;
        const initialFixedCosts = iceTimeCost + travelCost + equipmentCost;

        return {
            id: crypto.randomUUID(),
            ...teamInfo,
            nationalsDivision: getNationalsDivision(teamInfo.leagueDivision),
            roster: roster,
            lineup: lineup,
            tactics: defaultTactics,
            wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0,
            points: 0,
            logo: teamLogos[org.name],
            financials: {
                totalBudget: teamBudget,
                discretionaryBudget: teamBudget - initialFixedCosts, // Initialize discretionaryBudget
                iceTimeCostPerGame: 350,
                equipmentCost: equipmentCost,
            },
            facilities: initialFacilityProjects.map(p => ({ ...p })),
        };
    });
});