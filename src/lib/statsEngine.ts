import { GameState, Team, Player, CurrentSeasonStats } from '@/types';

export const processGameResults = (
    userTeam: Team,
    opponentTeam: Team,
    gameState: GameState
): { updatedUserTeam: Team; updatedOpponentTeam: Team } => {
    const updatedUserTeam = JSON.parse(JSON.stringify(userTeam)) as Team;
    const updatedOpponentTeam = JSON.parse(JSON.stringify(opponentTeam)) as Team;

    // Update team records
    const userWon = gameState.userScore > gameState.opponentScore;
    const isDraw = gameState.userScore === gameState.opponentScore;

    if (isDraw) {
        updatedUserTeam.draws += 1;
        updatedOpponentTeam.draws += 1;
    } else if (userWon) {
        updatedUserTeam.wins += 1;
        updatedOpponentTeam.losses += 1;
    } else {
        updatedUserTeam.losses += 1;
        updatedOpponentTeam.wins += 1;
    }
    updatedUserTeam.goalsFor += gameState.userScore;
    updatedUserTeam.goalsAgainst += gameState.opponentScore;
    updatedOpponentTeam.goalsFor += gameState.opponentScore;
    updatedOpponentTeam.goalsAgainst += gameState.userScore;

    const processTeamStats = (team: Team, isUserTeam: boolean) => {
        const score = isUserTeam ? gameState.userScore : gameState.opponentScore;
        const opponentScore = isUserTeam ? gameState.opponentScore : gameState.userScore;
        const won = score > opponentScore;
        const isDraw = score === opponentScore;

        const lineupIds = new Set([
            ...Object.values(team.lineup.forwards).flat(),
            ...Object.values(team.lineup.defence).flat(),
            team.lineup.goalies.starter,
            team.lineup.goalies.backup,
        ].filter(Boolean));

        team.roster.forEach(player => {
            if (!lineupIds.has(player.id)) return;

            player.currentStats.gamesPlayed += 1;

            // Goalie stats
            if (player.id === team.lineup.goalies.starter) {
                if (won) player.currentStats.wins += 1;
                else if (isDraw) player.currentStats.draws += 1;
                else player.currentStats.losses += 1;
                
                player.currentStats.goalsAgainst += opponentScore;
                if (opponentScore === 0) player.currentStats.shutouts += 1;

                const shootingTeamName = isUserTeam ? opponentTeam.name : userTeam.name;
                const shotsSavedThisGame = gameState.gameLog.filter(e => e.team === shootingTeamName && e.description.includes('saved by')).length;
                
                player.currentStats.saves += shotsSavedThisGame;
                player.currentStats.shotsAgainst += (shotsSavedThisGame + opponentScore);

                if (player.currentStats.gamesPlayed > 0) {
                    // Simplified GAA: Goals Against per Game.
                    player.currentStats.goalsAgainstAverage = player.currentStats.goalsAgainst / player.currentStats.gamesPlayed;
                }

                if (player.currentStats.shotsAgainst > 0) {
                    player.currentStats.savePercentage = player.currentStats.saves / player.currentStats.shotsAgainst;
                }
            }
        });

        gameState.gameLog.forEach(event => {
            if (event.team !== team.name) return;

            if (event.description.startsWith('GOAL!')) {
                const scorerName = event.description.match(/GOAL! (.*?) scores/)?.[1];
                const scorer = team.roster.find(p => p.name === scorerName);
                if (scorer) {
                    scorer.currentStats.goals += 1;
                    scorer.currentStats.points += 1;
                }

                if (event.description.includes('Assists: ')) {
                    const assistsStr = event.description.split('Assists: ')[1];
                    const assisterNames = assistsStr.split(', ');
                    assisterNames.forEach(name => {
                        const assister = team.roster.find(p => p.name === name);
                        if (assister) {
                            assister.currentStats.assists += 1;
                            assister.currentStats.points += 1;
                        }
                    });
                }
            } else if (event.description.startsWith('PENALTY!')) {
                const playerName = event.description.match(/PENALTY! (.*?) gets/)?.[1];
                const player = team.roster.find(p => p.name === playerName);
                if (player) {
                    player.currentStats.penaltyMinutes += 2;
                }
            }
        });
    };

    processTeamStats(updatedUserTeam, true);
    processTeamStats(updatedOpponentTeam, false);

    return { updatedUserTeam, updatedOpponentTeam };
};