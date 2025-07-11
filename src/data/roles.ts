import { SkaterAttributes } from "@/types";

export interface Role {
    name: string;
    description: string;
    positions: ('Forward' | 'Defenceman')[];
    keyAttributes: (keyof SkaterAttributes)[];
    type: 'Offensive' | 'Defensive' | 'Two-Way' | 'Physical' | 'Specialist';
    behavioralModifiers: {
        shootTendency: number;
        passTendency: number;
        hitTendency: number;
        shotBlockTendency: number;
        penaltyTendency: number;
    };
}

export const roles: Role[] = [
    // Forwards
    {
        name: "Offensive Forward",
        description: "A balanced forward expected to contribute offensively.",
        positions: ['Forward'],
        keyAttributes: ['offensiveRead', 'puckhandling', 'shootingAccuracy', 'passing', 'gettingOpen'],
        type: 'Offensive',
        behavioralModifiers: { shootTendency: 1.1, passTendency: 1.1, hitTendency: 0.9, shotBlockTendency: 0.8, penaltyTendency: 1.0 },
    },
    {
        name: "Playmaker",
        description: "Creates scoring chances for teammates.",
        positions: ['Forward'],
        keyAttributes: ['passing', 'offensiveRead', 'puckhandling', 'teamPlayer'],
        type: 'Offensive',
        behavioralModifiers: { shootTendency: 0.7, passTendency: 1.4, hitTendency: 0.8, shotBlockTendency: 0.7, penaltyTendency: 0.9 },
    },
    {
        name: "Goalscorer",
        description: "Gets into position to shoot and score.",
        positions: ['Forward'],
        keyAttributes: ['shootingAccuracy', 'shootingRange', 'gettingOpen', 'offensiveRead'],
        type: 'Offensive',
        behavioralModifiers: { shootTendency: 1.4, passTendency: 0.7, hitTendency: 0.9, shotBlockTendency: 0.7, penaltyTendency: 1.0 },
    },
    {
        name: "Power Forward",
        description: "Uses size and strength to create space and score.",
        positions: ['Forward'],
        keyAttributes: ['strength', 'hitting', 'balance', 'screening', 'aggression'],
        type: 'Offensive',
        behavioralModifiers: { shootTendency: 1.2, passTendency: 0.8, hitTendency: 1.3, shotBlockTendency: 0.9, penaltyTendency: 1.2 },
    },
    {
        name: "Speedy Forward",
        description: "Uses superior skating to fly past opponents.",
        positions: ['Forward'],
        keyAttributes: ['speed', 'acceleration', 'agility', 'puckhandling'],
        type: 'Offensive',
        behavioralModifiers: { shootTendency: 1.1, passTendency: 1.1, hitTendency: 0.7, shotBlockTendency: 0.6, penaltyTendency: 0.9 },
    },
    {
        name: "Two-Way Forward",
        description: "Effective at both ends of the ice.",
        positions: ['Forward'],
        keyAttributes: ['defensiveRead', 'positioning', 'stickchecking', 'offensiveRead', 'passing'],
        type: 'Two-Way',
        behavioralModifiers: { shootTendency: 1.0, passTendency: 1.0, hitTendency: 1.0, shotBlockTendency: 1.1, penaltyTendency: 1.0 },
    },
    {
        name: "Checking Forward",
        description: "Responsibilities are primarily defensive.",
        positions: ['Forward'],
        keyAttributes: ['checking', 'defensiveRead', 'positioning', 'stickchecking', 'determination'],
        type: 'Defensive',
        behavioralModifiers: { shootTendency: 0.8, passTendency: 0.9, hitTendency: 1.2, shotBlockTendency: 1.2, penaltyTendency: 1.1 },
    },
    {
        name: "Grinder",
        description: "A defensive forward with a strong physical tendency.",
        positions: ['Forward'],
        keyAttributes: ['hitting', 'strength', 'stamina', 'determination', 'checking', 'bravery'],
        type: 'Defensive',
        behavioralModifiers: { shootTendency: 0.7, passTendency: 0.8, hitTendency: 1.4, shotBlockTendency: 1.3, penaltyTendency: 1.3 },
    },
    {
        name: "Agitator",
        description: "Antagonizes opponents into taking bad penalties.",
        positions: ['Forward'],
        keyAttributes: ['aggression', 'determination', 'bravery', 'hitting'],
        type: 'Physical',
        behavioralModifiers: { shootTendency: 0.8, passTendency: 0.8, hitTendency: 1.3, shotBlockTendency: 0.9, penaltyTendency: 1.8 },
    },
    {
        name: "Enforcer",
        description: "Primarily on the ice to protect teammates.",
        positions: ['Forward'],
        keyAttributes: ['fighting', 'strength', 'hitting', 'bravery', 'aggression'],
        type: 'Physical',
        behavioralModifiers: { shootTendency: 0.6, passTendency: 0.6, hitTendency: 1.8, shotBlockTendency: 1.0, penaltyTendency: 2.0 },
    },
    // Defencemen
    {
        name: "Offensive Defenceman",
        description: "Primary contribution is expected to be offensive.",
        positions: ['Defenceman'],
        keyAttributes: ['offensiveRead', 'passing', 'shootingRange', 'puckhandling', 'speed'],
        type: 'Offensive',
        behavioralModifiers: { shootTendency: 1.3, passTendency: 1.2, hitTendency: 0.7, shotBlockTendency: 0.7, penaltyTendency: 1.0 },
    },
    {
        name: "Playmaking Defenceman",
        description: "Focuses on setting up teammates and controlling play.",
        positions: ['Defenceman'],
        keyAttributes: ['passing', 'offensiveRead', 'puckhandling', 'agility', 'determination'],
        type: 'Offensive',
        behavioralModifiers: { shootTendency: 0.8, passTendency: 1.4, hitTendency: 0.7, shotBlockTendency: 0.8, penaltyTendency: 0.9 },
    },
    {
        name: "Two-Way Defenceman",
        description: "Effective at both ends of the ice.",
        positions: ['Defenceman'],
        keyAttributes: ['defensiveRead', 'positioning', 'stickchecking', 'passing', 'offensiveRead'],
        type: 'Two-Way',
        behavioralModifiers: { shootTendency: 1.0, passTendency: 1.0, hitTendency: 1.0, shotBlockTendency: 1.0, penaltyTendency: 1.0 },
    },
    {
        name: "Defensive Defenceman",
        description: "A 'stay-at-home' defenceman focused on their own zone.",
        positions: ['Defenceman'],
        keyAttributes: ['defensiveRead', 'positioning', 'shotBlocking', 'stickchecking', 'strength'],
        type: 'Defensive',
        behavioralModifiers: { shootTendency: 0.7, passTendency: 0.8, hitTendency: 1.2, shotBlockTendency: 1.5, penaltyTendency: 1.1 },
    },
];