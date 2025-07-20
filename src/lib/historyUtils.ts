import { Player, ScheduleEntry, RecordCategory, TeamRecord } from '@/types';
import { getPlayerLastTeam } from './playerUtils';

const getPlayerCareerStat = (player: Player, stat: 'goals' | 'assists' | 'points' | 'penaltyMinutes' | 'shutouts', teamNames?: Set<string>): number => {
  let allStats = [...player.history, ...player.currentStats];
  if (teamNames) {
    allStats = allStats.filter(s => s.team && teamNames.has(s.team));
  }
  return allStats.reduce((total, season) => total + (season[stat] || 0), 0);
};

export const calculateRecords = (players: Player[], schedule: ScheduleEntry[], managedTeamNames?: string[]) => {
  const careerRecords: { [key in RecordCategory]?: TeamRecord } = {};
  const teamNamesSet = managedTeamNames ? new Set(managedTeamNames) : undefined;

  players.forEach(player => {
    const isSkater = !player.positions.includes('G');
    const season = 'Career'; // For career records, season is not specific
    const lastTeam = getPlayerLastTeam(player);

    if (isSkater) {
      const goals = getPlayerCareerStat(player, 'goals', teamNamesSet);
      if (goals > (careerRecords['Goals']?.value || 0)) {
        careerRecords['Goals'] = { playerName: player.name, teamName: lastTeam, value: goals, season };
      }
      const assists = getPlayerCareerStat(player, 'assists', teamNamesSet);
      if (assists > (careerRecords['Assists']?.value || 0)) {
        careerRecords['Assists'] = { playerName: player.name, teamName: lastTeam, value: assists, season };
      }
      const points = getPlayerCareerStat(player, 'points', teamNamesSet);
      if (points > (careerRecords['Points']?.value || 0)) {
        careerRecords['Points'] = { playerName: player.name, teamName: lastTeam, value: points, season };
      }
      const pims = getPlayerCareerStat(player, 'penaltyMinutes', teamNamesSet);
      if (pims > (careerRecords['PenaltyMinutes']?.value || 0)) {
        careerRecords['PenaltyMinutes'] = { playerName: player.name, teamName: lastTeam, value: pims, season };
      }
    } else { // Goalie
      const shutouts = getPlayerCareerStat(player, 'shutouts', teamNamesSet);
      if (shutouts > (careerRecords['Shutouts']?.value || 0)) {
        careerRecords['Shutouts'] = { playerName: player.name, teamName: lastTeam, value: shutouts, season };
      }
    }
  });

  return { careerRecords };
};