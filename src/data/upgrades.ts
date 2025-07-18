import { Upgrade } from '@/types';

export const initialUpgrades: Upgrade[] = [
    {
        id: 'financial_boost_1',
        name: 'Sponsorship Deals',
        category: 'Financial',
        description: 'Increases weekly income through new sponsorship agreements.',
        maxLevel: 3,
        levels: [
            {
                level: 1,
                cost: 5000,
                effects: [{ type: 'weekly_income', value: 100 }],
                description: 'Secures minor local sponsorships, providing a small weekly income boost.'
            },
            {
                level: 2,
                cost: 15000,
                effects: [{ type: 'weekly_income', value: 300 }],
                description: 'Expands sponsorship portfolio, bringing in more significant weekly funds.'
            },
            {
                level: 3,
                cost: 30000,
                effects: [{ type: 'weekly_income', value: 700 }],
                description: 'Attracts major corporate sponsors, substantially increasing weekly income.'
            }
        ]
    },
    {
        id: 'player_dev_1',
        name: 'Advanced Coaching Staff',
        category: 'Player Development',
        description: 'Enhances player development rate through specialized coaching.',
        maxLevel: 3,
        levels: [
            {
                level: 1,
                cost: 7500,
                effects: [{ type: 'development_boost', value: 0.1, scope: 'all' }],
                description: 'Hires an additional assistant coach, slightly improving overall player development.'
            },
            {
                level: 2,
                cost: 20000,
                effects: [{ type: 'development_boost', value: 0.25, scope: 'all' }],
                description: 'Invests in a dedicated skills coach, leading to noticeable improvements in player attributes.'
            },
            {
                level: 3,
                cost: 40000,
                effects: [{ type: 'development_boost', value: 0.5, scope: 'all' }],
                description: 'Establishes a comprehensive development program with elite coaches, significantly boosting player potential.'
            }
        ]
    },
    {
        id: 'health_wellness_1',
        name: 'Sports Medicine Team',
        category: 'Health & Wellness',
        description: 'Accelerates injury recovery and reduces injury proneness.',
        maxLevel: 2,
        levels: [
            {
                level: 1,
                cost: 10000,
                effects: [{ type: 'injury_recovery_boost', value: 1.2 }, { type: 'injury_prevention', value: 0.05 }],
                description: 'Adds a part-time physiotherapist, speeding up recovery and slightly reducing injuries.'
            },
            {
                level: 2,
                cost: 25000,
                effects: [{ type: 'injury_recovery_boost', value: 1.5 }, { type: 'injury_prevention', value: 0.1 }],
                description: 'Establishes a full-time sports medicine department, ensuring rapid recovery and robust injury prevention.'
            }
        ]
    },
    {
        id: 'recruitment_boost_1',
        name: 'Scouting Network Expansion',
        category: 'Recruitment',
        description: 'Increases the quality and quantity of available recruits.',
        maxLevel: 2,
        levels: [
            {
                level: 1,
                cost: 6000,
                effects: [{ type: 'recruitment_boost', value: 0.1 }],
                description: 'Expands scouting to regional areas, bringing in a wider pool of talent.'
            },
            {
                level: 2,
                cost: 18000,
                effects: [{ type: 'recruitment_boost', value: 0.25 }],
                description: 'Develops an international scouting network, attracting top prospects from around the globe.'
            }
        ]
    },
    {
        id: 'morale_boost_1',
        name: 'Team Psychologist',
        category: 'Player Development',
        description: 'Improves team morale and mental resilience.',
        maxLevel: 1,
        levels: [
            {
                level: 1,
                cost: 8000,
                effects: [{ type: 'morale_boost', value: 1 }],
                description: 'Hires a dedicated team psychologist to support player mental well-being and boost morale.'
            }
        ]
    }
];