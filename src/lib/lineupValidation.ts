import { Team } from '@/types';

export const validateLineup = (team: Team): string | null => {
  const { roster, lineup } = team;
  let missingPlayers: string[] = [];
  let staffCount = 0;
  let injuredPlayerNames: string[] = [];

  const getPlayerById = (id: string | null) => id ? roster.find(p => p.id === id) : undefined;

  const allAssignedPlayerIds = [
    ...Object.values(lineup.forwards).flat(),
    ...Object.values(lineup.defence).flat(),
    lineup.goalies.starter,
    lineup.goalies.backup,
  ];

  // Check a player and update counts
  const checkAndAddPlayer = (playerId: string | null) => {
    if (playerId) {
      const player = getPlayerById(playerId);
      if (player) {
        if (player.eligibility === 'Staff') {
          staffCount++;
        }
        if (player.healthStatus === 'Injured') {
          injuredPlayerNames.push(player.name);
        }
      }
    }
  };

  // Check all lineup positions
  allAssignedPlayerIds.forEach(checkAndAddPlayer);

  // Check for injured players first
  if (injuredPlayerNames.length > 0) {
    return `Your lineup contains injured players: ${injuredPlayerNames.join(', ')}. Please remove them before playing.`;
  }

  // Check for staff count
  if (staffCount > 2) {
    return `You have ${staffCount} staff members in your lineup. You can only have a maximum of 2.`;
  }

  // Check for incomplete lineup
  const assignedForwards = Object.values(lineup.forwards).flat().filter(Boolean).length;
  const assignedDefense = Object.values(lineup.defence).flat().filter(Boolean).length;
  const assignedGoalies = (lineup.goalies.starter ? 1 : 0) + (lineup.goalies.backup ? 1 : 0);

  if (assignedForwards < 12) missingPlayers.push('12 Forwards');
  if (assignedDefense < 6) missingPlayers.push('6 Defensemen');
  if (assignedGoalies < 2) missingPlayers.push('2 Goalies');

  if (missingPlayers.length > 0) {
    return `Your lineup is incomplete. You need: ${missingPlayers.join(', ')}.`;
  }

  return null; // Lineup is valid
};