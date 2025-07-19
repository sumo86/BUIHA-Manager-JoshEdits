import { FacilityProject } from '@/types';

export const initialFacilityProjects: FacilityProject[] = [
  // Financial
  {
    id: 'merch_kiosk_1',
    name: 'Merchandise Kiosk',
    description: 'A small kiosk selling basic team apparel. Generates a small weekly income.',
    cost: 2500,
    status: 'Not Started',
    benefit: '+£100 weekly income.',
    category: 'Financial',
  },
  {
    id: 'rink_ads_1',
    name: 'Local Dasherboard Ads',
    description: 'Sell advertising space on the rink dasherboards to local businesses.',
    cost: 1000,
    status: 'Not Started',
    benefit: '+£150 weekly income.',
    category: 'Financial',
  },
  {
    id: 'social_media_1',
    name: 'Social Media Intern',
    description: 'Hire an intern to boost social media, increasing ticket and merch sales.',
    cost: 1500,
    status: 'Not Started',
    benefit: '+£200 weekly income.',
    category: 'Financial',
  },

  // Player Development
  {
    id: 'video_room_1',
    name: 'Video Analysis Room',
    description: 'A room with a projector for reviewing game footage.',
    cost: 3000,
    status: 'Not Started',
    benefit: 'Slightly improves player mental attribute development.',
    category: 'Player Development',
  },
  {
    id: 'basic_gym_1',
    name: 'Basic Team Gym',
    description: 'Convert a storage room into a basic gym with free weights.',
    cost: 5000,
    status: 'Not Started',
    benefit: 'Slightly improves player physical attribute development.',
    category: 'Player Development',
  },
  {
    id: 'shooting_pads_1',
    name: 'Shooting Pads Area',
    description: 'Install synthetic ice shooting pads for players to practice their shot.',
    cost: 4000,
    status: 'Not Started',
    benefit: 'Slightly improves player shooting attribute development.',
    category: 'Player Development',
  },

  // Player Welfare
  {
    id: 'locker_room_1',
    name: 'Locker Room Refurbishment',
    description: 'Update the team locker room with new stalls and better amenities.',
    cost: 7500,
    status: 'Not Started',
    benefit: 'Provides a one-time team-wide morale boost upon completion.',
    category: 'Player Welfare',
  },
  {
    id: 'physio_office_1',
    name: 'Basic Physiotherapy Office',
    description: 'A dedicated space for a part-time physiotherapist.',
    cost: 6000,
    status: 'Not Started',
    benefit: 'Slightly reduces recovery time from minor injuries.',
    category: 'Player Welfare',
  },
  {
    id: 'nutrition_plan_1',
    name: 'Basic Nutrition Plan',
    description: 'Provide players with basic nutritional guidance and subsidized supplements.',
    cost: 2000,
    status: 'Not Started',
    benefit: 'Slightly reduces chance of injury during games and training.',
    category: 'Player Welfare',
  },

  // Recruitment
  {
    id: 'scouting_database_1',
    name: 'Local Scouting Database',
    description: 'Develop a database to track local talent from schools and junior clubs.',
    cost: 3500,
    status: 'Not Started',
    benefit: 'Slightly increases the quality of players found at the student fair.',
    category: 'Recruitment',
  },
  {
    id: 'campus_posters_1',
    name: 'Campus Recruitment Drive',
    description: 'Run a poster and flyer campaign across campus before the student fair.',
    cost: 1000,
    status: 'Not Started',
    benefit: 'Slightly increases the quantity of players found at the student fair.',
    category: 'Recruitment',
  },
];