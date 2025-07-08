import { FacilityProject } from '@/types';

export const initialFacilityProjects: FacilityProject[] = [
  {
    id: 'merch_store_1',
    name: 'University Merchandise Kiosk',
    description: 'Set up a small kiosk at the rink to sell basic team merchandise like t-shirts and hats.',
    cost: 2500,
    status: 'Not Started',
    benefit: 'Generates a small but steady stream of income from merchandise sales.',
  },
  {
    id: 'training_gym_1',
    name: 'Basic Team Gym',
    description: 'Convert a storage room into a basic gym with free weights and cardio machines for team use.',
    cost: 5000,
    status: 'Not Started',
    benefit: 'Slightly improves player physical attribute development speed.',
  },
  {
    id: 'video_room_1',
    name: 'Video Analysis Room',
    description: 'Equip a room with a projector and software for players to review game footage.',
    cost: 3000,
    status: 'Not Started',
    benefit: 'Slightly improves player mental attribute development speed.',
  },
  {
    id: 'rink_ads_1',
    name: 'Local Sponsor Dasherboard Ads',
    description: 'Sell advertising space on the rink dasherboards to local businesses.',
    cost: 1000,
    status: 'Not Started',
    benefit: 'Provides a lump sum of income at the start of each season.',
  },
];