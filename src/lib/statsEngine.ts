import { Player, Team, GameState, PlayerSeasonStats } from '@/types';
import { calculateCurrentAbility, calculateStarRating } from './playerGenerator';

export const processGameResults = (
  userTeam: Team,
  opponentTeam: Team,
  gameState: GameState,
  seasonString: string,
  isNationalsGame: boolean
) => {
  const updatedUserTeam = { ...userTeam, roster: [...userTeam.roster] };
  const updatedOpponentTeam = { ...opponentTeam, roster: [...opponentTeam.roster] };

  const updatePlayerStats = (player: Player, teamName: string, isHomeTeam: boolean) => {
    const leagueIdentifier = isNationalsGame ? 'Nationals' : (teamName === userTeam.name ? userTeam.leagueDivision : opponentTeam.leagueDivision);
    let currentSeasonStat = player.currentStats.find(s => s.season === seasonString && s.team === teamName && s.league === leagueIdentifier);

    if (!currentSeasonStat) {
      currentSeasonStat = {
        season: seasonString,
        team: teamName,
        league: leagueIdentifier,
        gamesPlayed: 0,
        goals: 0,
        assists: 0,
        points: 0,
        penaltyMinutes: 0,
        goalsAgainst: 0,
        shotsAgainst: 0,
        saves: 0,
        goalsAgainstAverage: 0,
        savePercentage: 0,
        shutouts: 0,
        captaincy: player.captaincy, // Include captaincy here
      };
      player.currentStats.push(currentSeasonStat);
    }

    currentSeasonStat.gamesPlayed = (currentSeasonStat.gamesPlayed || 0) + 1;

    if (!player.positions.includes('G')) { // Skater stats
      const skaterStats = gameState.skaterStats.find(s => s.playerId === player.id);
      if (skaterStats) {
        currentSeasonStat.goals = (currentSeasonStat.goals || 0) + skaterStats.goals;
        currentSeasonStat.assists = (currentSeasonStat.assists || 0) + skaterStats.assists;
        currentSeasonStat.points = (currentSeasonStat.points || 0) + skaterStats.points;
        currentSeasonStat.penaltyMinutes = (currentSeasonStat.penaltyMinutes || 0) + skaterStats.penaltyMinutes;
      }
    } else { // Goalie stats
      const goalieStats = gameState.goalieStats.find(s => s.playerId === player.id);
      if (goalieStats) {
        currentSeasonStat.goalsAgainst = (currentSeasonStat.goalsAgainst || 0) + goalieStats.goalsAgainst;
        currentSeasonStat.shotsAgainst = (currentSeasonStat.shotsAgainst || 0) + goalieStats.shotsAgainst;
        currentSeasonStat.saves = (currentSeasonStat.saves || 0) + goalieStats.saves;
        currentSeasonStat.shutouts = (currentSeasonStat.shutouts || 0) + (goalieStats.shutout ? 1 : 0);

        if (currentSeasonStat.gamesPlayed > 0) {
          currentSeasonStat.goalsAgainstAverage = currentSeasonStat.goalsAgainst / currentSeasonStat.gamesPlayed;
        }
        if (currentSeasonStat.shotsAgainst > 0) {
          currentSeasonStat.savePercentage = currentSeasonStat.saves / currentSeasonStat.shotsAgainst;
        }
      }
    }
  };

  // Update user team players
  updatedUserTeam.roster = updatedUserTeam.roster.map(player => {
    const newPlayer = { ...player };
    updatePlayerStats(newPlayer, updatedUserTeam.name, true);
    return newPlayer;
  });

  // Update opponent team players
  updatedOpponentTeam.roster = updatedOpponentTeam.roster.map(player => {
    const newPlayer = { ...player };
    updatePlayerStats(newPlayer, updatedOpponentTeam.name, false);
    return newPlayer;
  });

  // Update team records, but only for league games
  if (!isNationalsGame) {
    if (gameState.userScore > gameState.opponentScore) {
      updatedUserTeam.wins = (updatedUserTeam.wins || 0) + 1;
      updatedOpponentTeam.losses = (updatedOpponentTeam.losses || 0) + 1;
    } else if (gameState.userScore < gameState.opponentScore) {
      updatedUserTeam.losses = (updatedUserTeam.losses || 0) + 1;
      updatedOpponentTeam.wins = (updatedOpponentTeam.wins || 0) + 1;
    } else {
      updatedUserTeam.draws = (updatedUserTeam.draws || 0) + 1;
      updatedOpponentTeam.draws = (updatedOpponentTeam.draws || 0) + 1;
    }

    updatedUserTeam.goalsFor = (updatedUserTeam.goalsFor || 0) + gameState.userScore;
    updatedUserTeam.goalsAgainst = (updatedUserTeam.goalsAgainst || 0) + gameState.opponentScore;
    updatedOpponentTeam.goalsFor = (updatedOpponentTeam.goalsFor || 0) + gameState.opponentScore;
    updatedOpponentTeam.goalsAgainst = (updatedOpponentTeam.goalsAgainst || 0) + gameState.userScore;

    updatedUserTeam.points = (updatedUserTeam.wins * 2) + updatedUserTeam.draws;
    updatedOpponentTeam.points = (updatedOpponentTeam.wins * 2) + updatedOpponentTeam.draws;
  }

  // Process injuries
  gameState.injuries.forEach(injury => {
    const targetTeam = injury.teamName === updatedUserTeam.name ? updatedUserTeam : updatedOpponentTeam;
    const injuredPlayerIndex = targetTeam.roster.findIndex(p => p.id === injury.playerId);
    if (injuredPlayerIndex !== -1) {
      targetTeam.roster[injuredPlayerIndex].injury = { type: injury.injuryType, duration: injury.duration };
      targetTeam.roster[injuredPlayerIndex].healthStatus = 'Injured';
    }
  });

  return { updatedUserTeam, updatedOpponentTeam };
};