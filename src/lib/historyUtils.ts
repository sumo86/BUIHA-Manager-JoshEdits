import { Player, RecordCategory, TeamRecord, ScheduleEntry } from '@/types';
import { getAggregatedCurrentStats } from './statsUtils';

type Records = { [key in RecordCategory]?: TeamRecord };

export const calculateRecords = (players: Player[], schedule: ScheduleEntry[]) => {
  const seasonRecords: Records = {};
  const careerRecords: Records = {};

  const teamGamesPlayed: { [teamName: string]: number } = {};
  schedule.forEach(game => {
    teamGamesPlayed[game.homeTeam] = (teamGamesPlayed[game.homeTeam] || 0) + 1;
    teamGamesPlayed[game.awayTeam] = (teamGamesPlayed[game.awayTeam] || 0) + 1;
  });

  players.forEach(player => {
    const isSkater = !player.positions.includes('G');
    const currentStats = getAggregatedCurrentStats(player);
    const currentTeamName = currentStats.team || 'Unknown';
    const season = currentStats.season || 'N/A';

    // Season Records
    if (isSkater) {
      if ((currentStats.goals || 0) > (seasonRecords['Goals']?.value || 0)) seasonRecords['Goals'] = { playerName: player.name, teamName: currentTeamName, value: currentStats.goals, season };
      if ((currentStats.assists || 0) > (seasonRecords['Assists']?.value || 0)) seasonRecords['Assists'] = { playerName: player.name, teamName: currentTeamName, value: currentStats.assists, season };
      if ((currentStats.points || 0) > (seasonRecords['Points']?.value || 0)) seasonRecords['Points'] = { playerName: player.name, teamName: currentTeamName, value: currentStats.points, season };
      if ((currentStats.penaltyMinutes || 0) > (seasonRecords['PenaltyMinutes']?.value || 0)) seasonRecords['PenaltyMinutes'] = { playerName: player.name, teamName: currentTeamName, value: currentStats.penaltyMinutes, season };
    } else { // Goalie
      const totalLeagueGames = teamGamesPlayed[currentTeamName] || 0;
      if (currentStats.gamesPlayed >= totalLeagueGames / 2) {
        if (!seasonRecords['GAA'] || (currentStats.goalsAgainstAverage < seasonRecords['GAA'].value)) seasonRecords['GAA'] = { playerName: player.name, teamName: currentTeamName, value: currentStats.goalsAgainstAverage, season };
        if (currentStats.savePercentage > (seasonRecords['SavePercentage']?.value || 0)) seasonRecords['SavePercentage'] = { playerName: player.name, teamName: currentTeamName, value: currentStats.savePercentage, season };
      }
      if ((currentStats.shutouts || 0) > (seasonRecords['Shutouts']?.value || 0)) seasonRecords['Shutouts'] = { playerName: player.name, teamName: currentTeamName, value: currentStats.shutouts, season };
    }

    // Career Records
    const careerGoals = player.history.reduce((acc, s) => acc + (s.goals || 0), 0) + (currentStats.goals || 0);
    const careerAssists = player.history.reduce((acc, s) => acc + (s.assists || 0), 0) + (currentStats.assists || 0);
    const careerPoints = player.history.reduce((acc, s) => acc + (s.points || 0), 0) + (currentStats.points || 0);
    const careerPims = player.history.reduce((acc, s) => acc + (s.penaltyMinutes || 0), 0) + (currentStats.penaltyMinutes || 0);
    
    if (careerGoals > (careerRecords['Goals']?.value || 0)) careerRecords['Goals'] = { playerName: player.name, teamName: currentTeamName, value: careerGoals };
    if (careerAssists > (careerRecords['Assists']?.value || 0)) careerRecords['Assists'] = { playerName: player.name, teamName: currentTeamName, value: careerAssists };
    if (careerPoints > (careerRecords['Points']?.value || 0)) careerRecords['Points'] = { playerName: player.name, teamName: currentTeamName, value: careerPoints };
    if (careerPims > (careerRecords['PenaltyMinutes']?.value || 0)) careerRecords['PenaltyMinutes'] = { playerName: player.name, teamName: currentTeamName, value: careerPims };
  });

  return { seasonRecords, careerRecords };
};