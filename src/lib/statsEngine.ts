import { Team, GameState, Player } from '@/types';

const moraleLevels: Player['morale'][] = ["Angry", "Unhappy", "Content", "Happy"];

const updateMorale = (currentMorale: Player['morale'], change: 1 | -1): Player['morale'] => {
    const currentIndex = moraleLevels.indexOf(currentMorale);
    const newIndex = Math.max(0, Math.min(moraleLevels.length - 1, currentIndex + change));
    return moraleLevels[newIndex];
};

export const processGameResults = (userTeam: Team, opponentTeam: Team, gameState: GameState) => {
    const updatedUserTeam = JSON.parse(JSON.stringify(userTeam));
    const updatedOpponentTeam = JSON.parse(JSON.stringify(opponentTeam));

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

    // Process injuries
    gameState.injuries.forEach(injuryInfo => {
        const teamToUpdate = injuryInfo.teamName === userTeam.name ? updatedUserTeam : updatedOpponentTeam;
        const playerIndex = teamToUpdate.roster.findIndex((p: Player) => p.id === injuryInfo.playerId);
        if (playerIndex !== -1) {
            teamToUpdate.roster[playerIndex].healthStatus = 'Injured';
            teamToUpdate.roster[playerIndex].injury = {
                type: injuryInfo.injuryType,
                duration: injuryInfo.duration,
            };
        }
    });

    // Process morale
    const userWon = gameState.userScore > gameState.opponentScore;
    const opponentWon = gameState.opponentScore > gameState.userScore;

    const applyMoraleChange = (team: Team, change: 1 | -1) => {
        team.roster.forEach((player: Player) => {
            if (Math.random() < 0.3) { // 30% chance for morale change
                player.morale = updateMorale(player.morale, change);
            }
        });
    };

    if (userWon) {
        applyMoraleChange(updatedUserTeam, 1);
        applyMoraleChange(updatedOpponentTeam, -1);
    } else if (opponentWon) {
        applyMoraleChange(updatedUserTeam, -1);
        applyMoraleChange(updatedOpponentTeam, 1);
    }

    return { updatedUserTeam, updatedOpponentTeam };
};