import { Player, PlayerSeasonStats } from '@/types';

export const getAggregatedCurrentStats = (player: Player): PlayerSeasonStats => {
  const aggregated = player.currentStats.reduce(
    (acc, stat) => {
      acc.gamesPlayed += stat.gamesPlayed || 0;
      acc.goals += stat.goals || 0;
      acc.assists += stat.assists || 0;
      acc.points += stat.points || 0;
      acc.penaltyMinutes += stat.penaltyMinutes || 0;
      acc.shotsAgainst += stat.shotsAgainst || 0;
      acc.saves += stat.saves || 0;
      acc.shutouts += stat.shutouts || 0;
      acc.goalsAgainst += stat.goalsAgainst || 0;
      return acc;
    },
    {
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      points: 0,
      penaltyMinutes: 0,
      shotsAgainst: 0,
      saves: 0,
      shutouts: 0,
      goalsAgainst: 0,
      savePercentage: 0,
      goalsAgainstAverage: 0,
      captaincy: player.captaincy || null, // Ensure captaincy is included
    }
  );

  // Add team, season, and league from the first currentStats entry if available
  // Assuming currentStats typically has one entry for the current season/team in this context
  const firstStat = player.currentStats[0];
  return {
    ...aggregated,
    team: firstStat?.team || 'N/A',
    season: firstStat?.season || 'N/A',
    league: firstStat?.league || 'N/A',
  };
};

export const getAggregatedCareerStats = (player: Player) => {
  const allStats = [...player.history, ...player.currentStats];
  return allStats.reduce(
    (acc, stat) => {
      acc.gamesPlayed += stat.gamesPlayed || 0;
      acc.goals += stat.goals || 0;
      acc.assists += stat.assists || 0;
      acc.points += stat.points || 0;
      acc.penaltyMinutes += stat.penaltyMinutes || 0;
      acc.shotsAgainst += stat.shotsAgainst || 0;
      acc.saves += stat.saves || 0;
      acc.shutouts += stat.shutouts || 0;
      acc.goalsAgainst += stat.goalsAgainst || 0;
      return acc;
    },
    {
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      points: 0,
      penaltyMinutes: 0,
      shotsAgainst: 0,
      saves: 0,
      shutouts: 0,
      goalsAgainst: 0,
      savePercentage: 0,
      goalsAgainstAverage: 0,
      captaincy: player.captaincy || null, // Ensure captaincy is included
    }
  );
};

export const getDivisionAggregatedStats = (player: Player, division: string): PlayerSeasonStats => {
  const divisionStats = player.currentStats.filter(stat => stat.league === division);
  
  const aggregated = divisionStats.reduce(
    (acc, stat) => {
      acc.gamesPlayed += stat.gamesPlayed || 0;
      acc.goals += stat.goals || 0;
      acc.assists += stat.assists || 0;
      acc.points += stat.points || 0;
      acc.penaltyMinutes += stat.penaltyMinutes || 0;
      acc.shotsAgainst += stat.shotsAgainst || 0;
      acc.saves += stat.saves || 0;
      acc.shutouts += stat.shutouts || 0;
      acc.goalsAgainst += stat.goalsAgainst || 0;
      return acc;
    },
    {
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      points: 0,
      penaltyMinutes: 0,
      shotsAgainst: 0,
      saves: 0,
      shutouts: 0,
      goalsAgainst: 0,
      savePercentage: 0,
      goalsAgainstAverage: 0,
      captaincy: player.captaincy || null, // Ensure captaincy is included
    }
  );

  // Add team, season, and league from the first relevant stat entry if available
  const firstStat = divisionStats[0];
  return {
    ...aggregated,
    team: firstStat?.team || 'N/A',
    season: firstStat?.season || 'N/A',
    league: firstStat?.league || division, // Ensure league is set to the division
  };
};