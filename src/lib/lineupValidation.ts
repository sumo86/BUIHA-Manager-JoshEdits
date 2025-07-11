import { Team } from '@/types';

export const validateLineup = (team: Team): string | null => {
  const { roster, lineup } = team;
  let missingPlayers: string[] = [];
  let staffCount = 0;
  let injuredPlayerNames: string[] = [];

  const getPlayerById = (id: string | null) => id ? roster.find(p => p.id === id) : undefined;

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
  lineup.forwards.lw.forEach(checkAndAddPlayer);
  lineup.forwards.c.forEach(checkAndAddPlayer);
  lineup.forwards.rw.forEach(checkAndAddPlayer);
  lineup.defence.ld.forEach(checkAndAddPlayer);
  lineup.defence.rd.forEach(checkAndAddPlayer);
  checkAndAddPlayer(lineup.goalies.starter);
  checkAndAddPlayer(lineup.goalies.backup);

  // Check for injured players first
  if (injuredPlayerNames.length > 0) {
    return `Your lineup contains injured players: ${injuredPlayerNames.join(', ')}. Please remove them before playing.`;
  }

  // Check for staff count
  if (staffCount > 2) {
    return `You have ${staffCount} staff members in your lineup. You can only have a maximum of 2.`;
  }

  // Check for incomplete lineup
  const assignedForwards = lineup.forwards.lw.filter(Boolean).length +
                           lineup.forwards.c.filter(Boolean).length +
                           lineup.forwards.rw.filter(Boolean).length;
  const assignedDefense = lineup.defence.ld.filter(Boolean).length +
                            lineup.defence.rd.filter(Boolean).length;
  const assignedGoalies = (lineup.goalies.starter ? 1 : 0) + (lineup.goalies.backup ? 1 : 0);

  if (assignedForwards < 9) missingPlayers.push('9 Forwards');
  if (assignedDefense < 6) missingPlayers.push('6 Defensemen');
  if (assignedGoalies < 2) missingPlayers.push('2 Goalies');

  if (missingPlayers.length > 0) {
    return `Your lineup is incomplete. You need: ${missingPlayers.join(', ')}.`;
  }

  return null; // Lineup is valid
};