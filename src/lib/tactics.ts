import { Player, SkaterAttributes, Tactic } from "@/types";

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

export const calculateTacticSuitability = (tactic: Tactic, roster: Player[]): number => {
    const bestUsedWith = tactic.bestUsedWith.toLowerCase();
    let relevantPlayers = roster.filter(p => !p.positions.includes("G"));
    let relevantAttributes: (keyof SkaterAttributes)[] = [];

    if (bestUsedWith.includes("defencemen")) {
        relevantPlayers = roster.filter(p => p.positions.some(pos => ["LD", "RD"].includes(pos)));
    } else if (bestUsedWith.includes("wingers")) {
        relevantPlayers = roster.filter(p => p.positions.some(pos => ["LW", "RW"].includes(pos)));
    } else if (bestUsedWith.includes("centre")) {
        relevantPlayers = roster.filter(p => p.positions.includes("C"));
    } else if (bestUsedWith.includes("forwards")) {
        relevantPlayers = roster.filter(p => p.positions.some(pos => ["LW", "RW", "C"].includes(pos)));
    }

    for (const keyword in attributeMap) {
        if (bestUsedWith.includes(keyword)) {
            relevantAttributes.push(...attributeMap[keyword]);
        }
    }
    
    relevantAttributes = [...new Set(relevantAttributes)];

    if (relevantAttributes.length === 0 || relevantPlayers.length === 0) {
        return 3;
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

    if (count === 0) return 3;

    const averageAttribute = totalScore / count;

    if (averageAttribute > 15) return 5;
    if (averageAttribute > 13) return 4;
    if (averageAttribute > 11) return 3;
    if (averageAttribute > 9) return 2;
    return 1;
};