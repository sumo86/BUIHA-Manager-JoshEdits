import { Team, GameState, Player, SkaterAttributes, GoalieAttributes } from '@/types';

const moraleLevels: Player['morale'][] = ["Angry", "Unhappy", "Content", "Happy"];

const updateMorale = (currentMorale: Player['morale'], change: 1 | -1): Player['morale'] => {
    const currentIndex = moraleLevels.indexOf(currentMorale);
    const newIndex = Math.max(0, Math.min(moraleLevels.length - 1, currentIndex + change));
    return moraleLevels[newIndex];
};

export const processGameResults = (userTeam: Team, opponentTeam: Team, gameState: GameState, isNationalsGame: boolean = false) => {
    const updatedUserTeam = JSON.parse(JSON.stringify(userTeam));
    const updatedOpponentTeam = JSON.parse(JSON.stringify(opponentTeam));

    // Only update regular season stats if it's not a nationals game
    if (!isNationalsGame) {
        // Update team records
        if (gameState.userScore > gameState.opponentScore) {
            updatedUserTeam.wins += 1;
            updatedOpponentTeam.losses += 1;
        } else if (gameState.opponentScore > gameState.userScore) {
            updatedOpponentTeam.wins += 1;
            updatedUserTeam.losses += 1;
        } else {
            updatedUserTeam.draws += 1;
            updatedOpponentTeam.draws += 1;
        }

        updatedUserTeam.goalsFor += gameState.userScore;
        updatedUserTeam.goalsAgainst += gameState.opponentScore;
        updatedOpponentTeam.goalsFor += gameState.opponentScore;
        updatedOpponentTeam.goalsAgainst += gameState.userScore;

        // Process player stats from game log
        const allPlayers = [...updatedUserTeam.roster, ...updatedOpponentTeam.roster];
        gameState.gameLog.forEach(event => {
            if (event.description.startsWith('GOAL!')) {
                const scorerName = event.description.split(' scores.')[0].split('GOAL! ')[1];
                const scorer = allPlayers.find(p => p.name === scorerName);
                if (scorer) {
                    scorer.currentStats.goals += 1;
                    scorer.currentStats.points += 1;
                }

                if (event.description.includes('Assists: ')) {
                    const assistsString = event.description.split('Assists: ')[1];
                    const assisterNames = assistsString.split(', ');
                    assisterNames.forEach(name => {
                        const assister = allPlayers.find(p => p.name === name);
                        if (assister) {
                            assister.currentStats.assists += 1;
                            assister.currentStats.points += 1;
                        }
                    });
                }
            }
        });

        // Update games played for all players in the game
        updatedUserTeam.roster.forEach((p: Player) => { p.currentStats.gamesPlayed += 1; });
        updatedOpponentTeam.roster.forEach((p: Player) => { p.currentStats.gamesPlayed += 1; });

        // Update goalie stats
        const userGoalie = updatedUserTeam.roster.find((p: Player) => p.id === updatedUserTeam.lineup.goalies.starter);
        if (userGoalie) {
            userGoalie.currentStats.goalsAgainst += gameState.opponentScore;
            userGoalie.currentStats.shotsAgainst += gameState.opponentShots;
            userGoalie.currentStats.saves += (gameState.opponentShots - gameState.opponentScore);
            if (gameState.opponentScore === 0) userGoalie.currentStats.shutouts += 1;
            userGoalie.currentStats.savePercentage = userGoalie.currentStats.shotsAgainst > 0 ? userGoalie.currentStats.saves / userGoalie.currentStats.shotsAgainst : 0;
            userGoalie.currentStats.goalsAgainstAverage = userGoalie.currentStats.gamesPlayed > 0 ? userGoalie.currentStats.goalsAgainst / userGoalie.currentStats.gamesPlayed : 0;
        }

        const opponentGoalie = updatedOpponentTeam.roster.find((p: Player) => p.id === updatedOpponentTeam.lineup.goalies.starter);
        if (opponentGoalie) {
            opponentGoalie.currentStats.goalsAgainst += gameState.userScore;
            opponentGoalie.currentStats.shotsAgainst += gameState.userShots;
            opponentGoalie.currentStats.saves += (gameState.userShots - gameState.userScore);
            if (gameState.userScore === 0) opponentGoalie.currentStats.shutouts += 1;
            opponentGoalie.currentStats.savePercentage = opponentGoalie.currentStats.shotsAgainst > 0 ? opponentGoalie.currentStats.saves / opponentGoalie.currentStats.shotsAgainst : 0;
            opponentGoalie.currentStats.goalsAgainstAverage = opponentGoalie.currentStats.gamesPlayed > 0 ? opponentGoalie.currentStats.goalsAgainst / opponentGoalie.currentStats.gamesPlayed : 0;
        }
    }

    // Process injuries for all games
    gameState.injuries.forEach(injuryInfo => {
        const teamToUpdate = injuryInfo.teamName === userTeam.name ? updatedUserTeam : updatedOpponentTeam;
        const playerIndex = teamToUpdate.roster.findIndex((p: Player) => p.id === injuryInfo.playerId);
        if (playerIndex !== -1) {
            const player = teamToUpdate.roster[playerIndex];
            player.healthStatus = 'Injured';
            player.injury = {
                type: injuryInfo.injuryType,
                duration: injuryInfo.duration,
            };
        }
    });

    // Process morale for all games
    const userWon = gameState.userScore > gameState.opponentScore;
    const opponentWon = gameState.opponentScore > gameState.userScore;

    const processTeamMorale = (team: Team, won: boolean) => {
        const leadershipRoster = team.roster.filter(p => (p.attributes as SkaterAttributes).leadership);
        const highestLeadership = leadershipRoster.length > 0 
            ? Math.max(...leadershipRoster.map(p => (p.attributes as SkaterAttributes).leadership)) 
            : 10;
        
        const leadershipModifier = (highestLeadership - 10) / 40; // +/- 25%

        team.roster.forEach((player: Player) => {
            const handleAttr = won ? player.attributes.handleSuccess : player.attributes.handleFailure;
            const baseChance = 0.3;
            const personalityModifier = (handleAttr - 10) / 50; // +/- 20%
            
            let finalChance = baseChance + personalityModifier;
            if (won) {
                finalChance += leadershipModifier;
            } else {
                finalChance -= leadershipModifier;
            }

            if (Math.random() < finalChance) {
                player.morale = updateMorale(player.morale, won ? 1 : -1);
            }
        });
    };

    if (userWon) {
        processTeamMorale(updatedUserTeam, true);
        processTeamMorale(updatedOpponentTeam, false);
    } else if (opponentWon) {
        processTeamMorale(updatedUserTeam, false);
        processTeamMorale(updatedOpponentTeam, true);
    }

    return { updatedUserTeam, updatedOpponentTeam };
};