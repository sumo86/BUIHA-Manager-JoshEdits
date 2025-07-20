import { Player } from '@/types';

export const getPlayerLastTeam = (player: Player): string => {
  if (!player.history || player.history.length === 0) {
    return 'N/A';
  }
  
  // Sort history by season descending to find the most recent entry
  const sortedHistory = [...player.history].sort((a, b) => b.season.localeCompare(a.season));
  
  return sortedHistory[0]?.team || 'N/A';
};