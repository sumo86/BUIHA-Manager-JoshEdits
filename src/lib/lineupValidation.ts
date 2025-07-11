import { Team } from '@/types';

export const validateLineup = (team: Team): string | null => {
  const { roster, lineup } = team;
  let staffCount = 0;
  const injuredPlayerNames: string[] = [];

  const allPlayerIdsInLineup = [
    ...lineup.forwards.lw,
    ...lineup.forwards.c,
    ...lineup.forwards.rw,
    ...lineup.defence.ld,
    ...lineup.defence.rd,
    lineup.goalies.starter,
    lineup.goalies.backup,
  ].filter((id): id is string => id !== null);

  const uniquePlayerIds = [...new Set(allPlayerIdsInLineup)];

  uniquePlayerIds.forEach(playerId => {
    const player = roster.find(p => p.id === playerId);
    if (player) {
      if (player.eligibility === 'Staff') {
        staffCount++;
      }
      if (player.healthStatus === 'Injured') {
        injuredPlayerNames.push(player.name);
      }
    }
  });

  if (injuredPlayerNames.length > 0) {
    return `Your lineup contains injured players: ${injuredPlayerNames.join(', ')}. Please remove them before playing.`;
  }

  if (staffCount > 2) {
    return `You have ${staffCount} staff members in your lineup. You can only have a maximum of 2.`;
  }

  const requiredForwards = 9;
  const requiredDefence = 6;
  const requiredGoalies = 2;

  const assignedForwards = lineup.forwards.lw.filter(Boolean).length +
                           lineup.forwards.c.filter(Boolean).length +
                           lineup.forwards.rw.filter(Boolean).length;
  const assignedDefense = lineup.defence.ld.filter(Boolean).length +
                            lineup.defence.rd.filter(Boolean).length;
  const assignedGoalies = (lineup.goalies.starter ? 1 : 0) + (lineup.goalies.backup ? 1 : 0);

  const missingPlayers: string[] = [];
  if (assignedForwards < requiredForwards) missingPlayers.push(`${requiredForwards - assignedForwards} more Forward(s)`);
  if (assignedDefense < requiredDefence) missingPlayers.push(`${requiredDefence - assignedDefense} more Defenseman/men`);
  if (assignedGoalies < requiredGoalies) missingPlayers.push(`${requiredGoalies - assignedGoalies} more Goalie(s)`);

  if (missingPlayers.length > 0) {
    return `Your lineup is incomplete. You need: ${missingPlayers.join(', ')}.`;
  }

  return null; // Lineup is valid
};