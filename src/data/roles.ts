import { SkaterAttributes } from "@/types";

export interface Role {
    name: string;
    description: string;
    positions: ('Forward' | 'Defenceman')[];
    keyAttributes: (keyof SkaterAttributes)[];
}

export const roles: Role[] = [
    // Forwards
    {
        name: "Offensive Forward",
        description: "A balanced forward expected to contribute offensively.",
        positions: ['Forward'],
        keyAttributes: ['offensiveRead', 'puckhandling', 'shootingAccuracy', 'passing', 'gettingOpen'],
    },
    {
        name: "Playmaker",
        description: "Creates scoring chances for teammates.",
        positions: ['Forward'],
        keyAttributes: ['passing', 'offensiveRead', 'puckhandling', 'teamPlayer'],
    },
    {
        name: "Goalscorer",
        description: "Gets into position to shoot and score.",
        positions: ['Forward'],
        keyAttributes: ['shootingAccuracy', 'shootingRange', 'gettingOpen', 'offensiveRead'],
    },
    {
        name: "Power Forward",
        description: "Uses size and strength to create space and score.",
        positions: ['Forward'],
        keyAttributes: ['strength', 'hitting', 'balance', 'screening', 'aggression'],
    },
    {
        name: "Speedy Forward",
        description: "Uses superior skating to fly past opponents.",
        positions: ['Forward'],
        keyAttributes: ['speed', 'acceleration', 'agility', 'puckhandling'],
    },
    {
        name: "Two-Way Forward",
        description: "Effective at both ends of the ice.",
        positions: ['Forward'],
        keyAttributes: ['defensiveRead', 'positioning', 'stickchecking', 'offensiveRead', 'passing'],
    },
    {
        name: "Checking Forward",
        description: "Responsibilities are primarily defensive.",
        positions: ['Forward'],
        keyAttributes: ['checking', 'defensiveRead', 'positioning', 'stickchecking', 'determination'],
    },
    {
        name: "Grinder",
        description: "A defensive forward with a strong physical tendency.",
        positions: ['Forward'],
        keyAttributes: ['hitting', 'strength', 'stamina', 'determination', 'checking', 'bravery'],
    },
    {
        name: "Agitator",
        description: "Antagonizes opponents into taking bad penalties.",
        positions: ['Forward'],
        keyAttributes: ['aggression', 'determination', 'bravery', 'hitting'],
    },
    {
        name: "Enforcer",
        description: "Primarily on the ice to protect teammates.",
        positions: ['Forward'],
        keyAttributes: ['fighting', 'strength', 'hitting', 'bravery', 'aggression'],
    },
    // Defencemen
    {
        name: "Offensive Defenceman",
        description: "Primary contribution is expected to be offensive.",
        positions: ['Defenceman'],
        keyAttributes: ['offensiveRead', 'passing', 'shootingRange', 'puckhandling', 'speed'],
    },
    {
        name: "Playmaking Defenceman",
        description: "Focuses on setting up teammates and controlling play.",
        positions: ['Defenceman'],
        keyAttributes: ['passing', 'offensiveRead', 'puckhandling', 'agility', 'determination'],
    },
    {
        name: "Two-Way Defenceman",
        description: "Effective at both ends of the ice.",
        positions: ['Defenceman'],
        keyAttributes: ['defensiveRead', 'positioning', 'stickchecking', 'passing', 'offensiveRead'],
    },
    {
        name: "Defensive Defenceman",
        description: "A 'stay-at-home' defenceman focused on their own zone.",
        positions: ['Defenceman'],
        keyAttributes: ['defensiveRead', 'positioning', 'shotBlocking', 'stickchecking', 'strength'],
    },
];