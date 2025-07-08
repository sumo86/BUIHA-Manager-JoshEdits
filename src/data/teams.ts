import { Team, Lineup, TacticsSelection } from "@/types";
import { generateRoster } from "@/lib/playerGenerator";

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

const defaultLineup: Lineup = {
    forwards: {
        lw: [null, null, null],
        c: [null, null, null],
        rw: [null, null, null],
    },
    defence: {
        ld: [null, null, null],
        rd: [null, null, null],
    },
    goalies: {
        starter: null,
        backup: null,
    },
};

const defaultTactics: TacticsSelection = {
    "Breakout": "Flexible Reaction",
    "Neutral Zone Offence": "Balanced Attack",
    "Attacking Zone Offence": "Lane Positioning",
    "Forechecking": "1-2-2",
    "Neutral Zone Coverage": "1-2-2 Retreat",
    "Defensive Zone Coverage": "Strict Zonal",
};

export const teams: Team[] = teamData.map(team => ({
    ...team,
    nationalsDivision: getNationalsDivision(team.leagueDivision),
    roster: generateRoster(team.leagueDivision),
    lineup: defaultLineup,
    tactics: defaultTactics,
}));