import { Upgrade } from '@/types';

export const initialUpgrades: Upgrade[] = [
  // Financial
  {
    id: 'sponsorship_deal_1',
    name: 'Local Business Sponsorship',
    category: 'Financial',
    description: 'Secure a sponsorship deal with a local business for a steady weekly income.',
    maxLevel: 5,
    levels: [
      { level: 1, cost: 5000, effects: [{ type: 'weekly_income', value: 250 }], description: 'Provides £250 weekly income.' },
      { level: 2, cost: 7500, effects: [{ type: 'weekly_income', value: 500 }], description: 'Increases weekly income to £500.' },
      { level: 3, cost: 10000, effects: [{ type: 'weekly_income', value: 750 }], description: 'Increases weekly income to £750.' },
      { level: 4, cost: 15000, effects: [{ type: 'weekly_income', value: 1000 }], description: 'Increases weekly income to £1,000.' },
      { level: 5, cost: 20000, effects: [{ type: 'weekly_income', value: 1500 }], description: 'Increases weekly income to £1,500.' },
    ],
  },
  // Player Development
  {
    id: 'video_analysis_room',
    name: 'Video Analysis Room',
    category: 'Player Development',
    description: 'Utilize video playback to boost player development in specific areas.',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 8000, effects: [{ type: 'development_boost', value: 0.05, scope: 'all' }], description: '+5% to all player development.' },
      { level: 2, cost: 12000, effects: [{ type: 'development_boost', value: 0.10, scope: 'all' }], description: '+10% to all player development.' },
      { level: 3, cost: 16000, effects: [{ type: 'development_boost', value: 0.15, scope: 'all' }], description: '+15% to all player development.' },
    ],
  },
  // Health & Wellness
  {
    id: 'improved_physio',
    name: 'Improved Physio Department',
    category: 'Health & Wellness',
    description: 'Better medical staff and equipment to speed up injury recovery.',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 10000, effects: [{ type: 'injury_recovery_boost', value: 1.1 }], description: '10% faster injury recovery.' },
      { level: 2, cost: 15000, effects: [{ type: 'injury_recovery_boost', value: 1.2 }], description: '20% faster injury recovery.' },
      { level: 3, cost: 20000, effects: [{ type: 'injury_recovery_boost', value: 1.3 }], description: '30% faster injury recovery.' },
    ],
  },
  {
    id: 'strength_conditioning',
    name: 'Strength & Conditioning Program',
    category: 'Health & Wellness',
    description: 'A dedicated program to make players more resilient to injuries.',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 7000, effects: [{ type: 'injury_prevention', value: 0.05 }], description: '5% lower chance of injury.' },
      { level: 2, cost: 11000, effects: [{ type: 'injury_prevention', value: 0.10 }], description: '10% lower chance of injury.' },
      { level: 3, cost: 15000, effects: [{ type: 'injury_prevention', value: 0.15 }], description: '15% lower chance of injury.' },
    ],
  },
  {
    id: 'team_lounge',
    name: 'Player Team Lounge',
    category: 'Health & Wellness',
    description: 'A dedicated space for players to relax and bond, improving morale.',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 5000, effects: [{ type: 'morale_boost', value: 1 }], description: 'Provides a periodic small morale boost.' },
      { level: 2, cost: 8000, effects: [{ type: 'morale_boost', value: 2 }], description: 'Provides a more frequent/potent morale boost.' },
      { level: 3, cost: 12000, effects: [{ type: 'morale_boost', value: 3 }], description: 'Provides a significant and frequent morale boost.' },
    ],
  },
  // Recruitment
  {
    id: 'scouting_network',
    name: 'Expanded Scouting Network',
    category: 'Recruitment',
    description: 'Improve your scouting reach to find higher quality prospects.',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 6000, effects: [{ type: 'recruitment_boost', value: 1 }], description: 'Slightly better chance of finding high-potential recruits.' },
      { level: 2, cost: 10000, effects: [{ type: 'recruitment_boost', value: 2 }], description: 'Moderately better chance of finding high-potential recruits.' },
      { level: 3, cost: 14000, effects: [{ type: 'recruitment_boost', value: 3 }], description: 'Significantly better chance of finding high-potential recruits.' },
    ],
  },
];