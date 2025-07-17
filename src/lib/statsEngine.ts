import { Team, Player, GameState, GameDate, PlayerSeasonStats } from '@/types';
import { getSeasonString } from '@/lib/utils';

export const processGameResults = (
    userTeam: Team,
    opponentTeam: Team,
    gameState: GameState,
    currentDate: GameDate,
    isNationalsGame: boolean = false
) => {
    const updatedUserTeam = { ...userTeam };
    const updatedOpponentTeam = { ...opponentTeam };

    const season = getSeasonString(currentDate);

    // Update team-level stats unless it's a nationals game
    if (!isNationalsGame) {
        if (gameState.userScore > gameState.opponentScore) {
            updatedUserTeam.wins += 1;
            updatedOpponentTeam.losses += 1;
            updatedUserTeam.points += 3;
        } else if (gameState.opponentScore > gameState.userScore) {
            updatedOpponentTeam.wins += 1;
            updatedUserTeam.losses += 1;
            updatedOpponentTeam.points += 3;
        } else {
            updatedUserTeam.draws += 1;
            updatedOpponentTeam.draws += 1;
            updatedUserTeam.points += 1;
            updatedOpponentTeam.points += 1;
        }

        updatedUserTeam.goalsFor += gameState.userScore;
        updatedUserTeam.goalsAgainst += gameState.opponentScore;
        updatedOpponentTeam.goalsFor += gameState.opponentScore;
        updatedOpponentTeam.goalsAgainst += gameState.userScore;
    }

    const processPlayerStats = (team: Team, teamGameState: any) => {
        return team.roster.map(player => {
            const playerStats = teamGameState.playerStats[player.id];
            if (!playerStats) return player;

            let seasonStats: PlayerSeasonStats | undefined = player.currentStats.find(s => s.season === season);

            if (!seasonStats) {
                seasonStats = {
                    season,
                    team: team.name,
                    gamesPlayed: 0,
                    goals: 0,
                    assists: 0,
                    points: 0,
                    penaltyMinutes: 0,
                    shots: 0,
                    shotsOnGoal: 0,
                    hits: 0,
                    faceoffsWon: 0,
                    faceoffsLost: 0,
                    saves: 0,
                    shotsAgainst: 0,
                    goalsAgainst: 0,
                    shutouts: 0,
                    goalsAgainstAverage: 0,
                    savePercentage: 0,
                };
                player.currentStats.push(seasonStats);
            }

            seasonStats.gamesPlayed += 1;

            if (player.positions.includes('G')) {
                seasonStats.saves = (seasonStats.saves || 0) + (playerStats.saves || 0);
                seasonStats.shotsAgainst = (seasonStats.shotsAgainst || 0) + (playerStats.shotsAgainst || 0);
                seasonStats.goalsAgainst = (seasonStats.goalsAgainst || 0) + (playerStats.goalsAgainst || 0);
                if (playerStats.goalsAgainst === 0) {
                    seasonStats.shutouts = (seasonStats.shutouts || 0) + 1;
                }
                
                const totalGamesForGAA = player.history.reduce((acc, s) => acc + (s.gamesPlayed || 0), 0) + seasonStats.gamesPlayed;
                const totalMinutesPlayed = totalGamesForGAA * 60; // Assuming 60 minutes per game
                const totalGoalsAgainst = player.history.reduce((acc, s) => acc + (s.goalsAgainst || 0), 0) + seasonStats.goalsAgainst;
                const totalSaves = player.history.reduce((acc, s) => acc + (s.saves || 0), 0) + seasonStats.saves;
                const totalShotsAgainst = player.history.reduce((acc, s) => acc + (s.shotsAgainst || 0), 0) + seasonStats.shotsAgainst;

                if (totalMinutesPlayed > 0) {
                    seasonStats.goalsAgainstAverage = (totalGoalsAgainst * 60) / totalMinutesPlayed;
                }
                if (totalShotsAgainst > 0) {
                    seasonStats.savePercentage = totalSaves / totalShotsAgainst;
                }

            } else {
                seasonStats.goals = (seasonStats.goals || 0) + (playerStats.goals || 0);
                seasonStats.assists = (seasonStats.assists || 0) + (playerStats.assists || 0);
                seasonStats.points = seasonStats.goals + seasonStats.assists;
                seasonStats.penaltyMinutes = (seasonStats.penaltyMinutes || 0) + (playerStats.penaltyMinutes || 0);
                seasonStats.shots = (seasonStats.shots || 0) + (playerStats.shots || 0);
                seasonStats.shotsOnGoal = (seasonStats.shotsOnGoal || 0) + (playerStats.shotsOnGoal || 0);
                seasonStats.hits = (seasonStats.hits || 0) + (playerStats.hits || 0);
                seasonStats.faceoffsWon = (seasonStats.faceoffsWon || 0) + (playerStats.faceoffsWon || 0);
                seasonStats.faceoffsLost = (seasonStats.faceoffsLost || 0) + (playerStats.faceoffsLost || 0);
            }
            
            const injury = gameState.injuries.find(inj => inj.playerId === player.id);
            if (injury) {
                const updatedPlayer: Player = { ...player, injury: { type: injury.injuryType, duration: injury.duration }, healthStatus: 'Injured' };
                return updatedPlayer;
            }

            return { ...player, currentStats: [...player.currentStats.filter(s => s.season !== season), seasonStats] };
        });
    };

    updatedUserTeam.roster = processPlayerStats(updatedUserTeam, gameState.userTeamStats);
    updatedOpponentTeam.roster = processPlayerStats(updatedOpponentTeam, gameState.opponentTeamStats);

    return { updatedUserTeam, updatedOpponentTeam };
};