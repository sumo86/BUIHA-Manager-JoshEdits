import { Player, SkaterAttributes, Tactic, TacticSuitability } from "@/types";

const attributeMap: { [key: string]: (keyof SkaterAttributes)[] } = {
    "teamwork": ["teamPlayer"],
    "puckhandling": ["puckhandling"],
    "skating": ["speed", "acceleration", "agility"],
    "offensive awareness": ["offensiveRead", "gettingOpen"],
    "checking": ["checking", "hitting"],
    "positioning": ["positioning"],
    "playmaking": ["passing", "offensiveRead"],
    "strength": ["strength", "balance"],
    "passing": ["passing"],
    "screening": ["screening"],
    "defensive awareness": ["defensiveRead", "positioning"],
    "stickchecking": ["stickchecking"],
    "physical": ["strength", "hitting", "aggression"],
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const calculateTacticSuitability = (tactic: Tactic, roster: Player[]): TacticSuitability => {
    const bestUsedWith = tactic.bestUsedWith.toLowerCase();
    let relevantPlayers = roster.filter(p => !p.positions.includes("G"));
    let relevantAttributes: (keyof SkaterAttributes)[] = [];
    let playerGroup = "players";

    if (bestUsedWith.includes("defencemen")) {
        relevantPlayers = roster.filter(p => p.positions.some(pos => ["LD", "RD"].includes(pos)));
        playerGroup = "defencemen";
    } else if (bestUsedWith.includes("wingers")) {
        relevantPlayers = roster.filter(p => p.positions.some(pos => ["LW", "RW"].includes(pos)));
        playerGroup = "wingers";
    } else if (bestUsedWith.includes("centre")) {
        relevantPlayers = roster.filter(p => p.positions.includes("C"));
        playerGroup = "centres";
    } else if (bestUsedWith.includes("forwards")) {
        relevantPlayers = roster.filter(p => p.positions.some(pos => ["LW", "RW", "C"].includes(pos)));
        playerGroup = "forwards";
    }

    for (const keyword in attributeMap) {
        if (bestUsedWith.includes(keyword)) {
            relevantAttributes.push(...attributeMap[keyword]);
        }
    }
    
    relevantAttributes = [...new Set(relevantAttributes)];

    if (relevantAttributes.length === 0 || relevantPlayers.length === 0) {
        return { score: 3, explanation: "This is a balanced tactic with no specific player requirements." };
    }

    let totalScore = 0;
    let count = 0;
    for (const player of relevantPlayers) {
        const attrs = player.attributes as SkaterAttributes;
        for (const attr of relevantAttributes) {
            if (attrs[attr]) {
                totalScore += attrs[attr];
                count++;
            }
        }
    }

    if (count === 0) {
        return { score: 3, explanation: "Could not determine suitability for this roster." };
    }

    const averageAttribute = totalScore / count;
    const attributeNames = relevantAttributes.map(a => a.replace(/([A-Z])/g, ' $1').toLowerCase()).map(capitalize).join(', ');
    
    let score: number;
    let explanation: string;

    if (averageAttribute > 15) {
        score = 5;
        explanation = `Excellent fit. Your ${playerGroup} have outstanding ${attributeNames}.`;
    } else if (averageAttribute > 13) {
        score = 4;
        explanation = `Good fit. Your ${playerGroup} are strong in ${attributeNames}.`;
    } else if (averageAttribute > 11) {
        score = 3;
        explanation = `Average fit. Your ${playerGroup} are adequate in ${attributeNames}.`;
    } else if (averageAttribute > 9) {
        score = 2;
        explanation = `Poor fit. Your ${playerGroup} lack strength in ${attributeNames}.`;
    } else {
        score = 1;
        explanation = `Very poor fit. Your ${playerGroup} are weak in ${attributeNames}.`;
    }

    return { score, explanation };
};