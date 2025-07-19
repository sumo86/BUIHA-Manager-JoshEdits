import { Player, PlayerSeasonStats } from '@/types';

export const getAggregatedCurrentStats = (player: Player): PlayerSeasonStats => {
  if (!player.currentStats || player.currentStats.length === 0) {
    return {
      season: '', team: '', league: '', gamesPlayed: 0, goals: 0, assists: 0, points: 0, penaltyMinutes: 0,
      goalsAgainst: 0, shotsAgainst: 0, saves: 0, goalsAgainstAverage: 0, savePercentage: 0, shutouts: 0,
      captaincy: player.captaincy, // Include captaincy here
    };
  }

  const aggregated = player.currentStats.reduce((acc, stat) => {
    acc.gamesPlayed += stat.gamesPlayed || 0;
    acc.goals += stat.goals || 0;
    acc.assists += stat.assists || 0;
    acc.points += stat.points || 0;
    acc.penaltyMinutes += stat.penaltyMinutes || 0;
    acc.shutouts += stat.shutouts || 0;
    acc.goalsAgainst += stat.goalsAgainst || 0;
    acc.shotsAgainst += stat.shotsAgainst || 0;
    acc.saves += stat.saves || 0;
    return acc;
  }, {
    gamesPlayed: 0, goals: 0, assists: 0, points: 0, penaltyMinutes: 0,
    shutouts: 0, goalsAgainst: 0, shotsAgainst: 0, saves: 0,
  });

  const gaa = aggregated.gamesPlayed > 0 ? aggregated.goalsAgainst / aggregated.gamesPlayed : 0;
  const svp = aggregated.shotsAgainst > 0 ? aggregated.saves / aggregated.shotsAgainst : 0;

  return {
    ...aggregated,
    season: player.currentStats[0].season,
    team: player.currentStats.map(s => s.team).join(' / '), // Show all teams
    league: player.currentStats[0].league,
    goalsAgainstAverage: gaa,
    savePercentage: svp,
    captaincy: player.captaincy, // Include captaincy here
  };
};

export const getDivisionAggregatedStats = (player: Player, division: string): PlayerSeasonStats => {
  const divisionStats = player.currentStats.filter(s => s.league === division);

  if (!divisionStats || divisionStats.length === 0) {
    return {
      season: '', team: '', league: division, gamesPlayed: 0, goals: 0, assists: 0, points: 0, penaltyMinutes: 0,
      goalsAgainst: 0, shotsAgainst: 0, saves: 0, goalsAgainstAverage: 0, savePercentage: 0, shutouts: 0,
      captaincy: player.captaincy, // Include captaincy here
    };
  }

  const aggregated = divisionStats.reduce((acc, stat) => {
    acc.gamesPlayed += stat.gamesPlayed || 0;
    acc.goals += stat.goals || 0;
    acc.assists += stat.assists || 0;
    acc.points += stat.points || 0;
    acc.penaltyMinutes += stat.penaltyMinutes || 0;
    acc.shutouts += stat.shutouts || 0;
    acc.goalsAgainst += stat.goalsAgainst || 0;
    acc.shotsAgainst += stat.shotsAgainst || 0;
    acc.saves += stat.saves || 0;
    return acc;
  }, {
    gamesPlayed: 0, goals: 0, assists: 0, points: 0, penaltyMinutes: 0,
    shutouts: 0, goalsAgainst: 0, shotsAgainst: 0, saves: 0,
  });

  const gaa = aggregated.gamesPlayed > 0 ? aggregated.goalsAgainst / aggregated.gamesPlayed : 0;
  const svp = aggregated.shotsAgainst > 0 ? aggregated.saves / aggregated.shotsAgainst : 0;

  return {
    ...aggregated,
    season: divisionStats[0].season,
    team: divisionStats.map(s => s.team).join(' / '),
    league: division,
    goalsAgainstAverage: gaa,
    savePercentage: svp,
    captaincy: player.captaincy, // Include captaincy here
  };
};