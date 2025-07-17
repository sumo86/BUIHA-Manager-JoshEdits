import { Upgrade } from '@/types';

export const allUpgrades: Upgrade[] = [
  // Financial
  {
    id: 'financial_1',
    name: 'Alumni Booster Club',
    description: 'Establishes a booster club with wealthy alumni, providing a steady income stream.',
    cost: 10000,
    type: 'Financial',
    benefitValue: 125, // Weekly income
    benefitDescription: '+£125 weekly income.',
  },
  {
    id: 'financial_2',
    name: 'Local Business Sponsorships',
    description: 'Secure sponsorship deals with local businesses for jersey patches and rink ads.',
    cost: 20000,
    type: 'Financial',
    benefitValue: 300, // Weekly income
    benefitDescription: '+£300 weekly income.',
  },
  // Development
  {
    id: 'development_1',
    name: 'Advanced Video Analysis Software',
    description: 'Utilize cutting-edge software to break down game film, accelerating player learning.',
    cost: 15000,
    type: 'Development',
    benefitValue: 0.05, // 5% boost
    benefitDescription: '+5% player development speed.',
  },
  {
    id: 'development_2',
    name: 'Pro-Level Training Equipment',
    description: 'Upgrade your gym with state-of-the-art equipment used by professional teams.',
    cost: 25000,
    type: 'Development',
    benefitValue: 0.10, // 10% boost
    benefitDescription: '+10% player development speed.',
  },
  // Medical
  {
    id: 'medical_1',
    name: 'Team Doctor on Retainer',
    description: 'Have a dedicated sports doctor available for immediate consultation and treatment.',
    cost: 12000,
    type: 'Medical',
    benefitValue: 0.15, // 15% reduction in injury chance
    benefitDescription: '15% lower chance of in-game injury.',
  },
  {
    id: 'medical_2',
    name: 'Advanced Cryotherapy Chamber',
    description: 'Install a cryotherapy chamber to drastically improve player recovery.',
    cost: 22000,
    type: 'Medical',
    benefitValue: 1, // Extra week of recovery
    benefitDescription: 'Injured players recover 1 extra week faster.',
  },
  // Morale
  {
    id: 'morale_1',
    name: 'Team Social Lounge',
    description: 'A dedicated space for players to relax and bond, with games and comfortable seating.',
    cost: 8000,
    type: 'Morale',
    benefitValue: 0.1, // 10% chance each week for morale boost
    benefitDescription: 'Chance to passively boost team morale each week.',
  },
  // Recruiting
  {
    id: 'recruiting_1',
    name: 'Expanded Scouting Network',
    description: 'Increase your scouting reach to find higher quality, hidden gem recruits.',
    cost: 18000,
    type: 'Recruiting',
    benefitValue: 0.1, // 10% boost to recruit quality
    benefitDescription: 'Improves the quality of players at the recruitment fair.',
  },
];