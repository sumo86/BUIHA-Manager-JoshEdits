import { Team, GameState, Player, SkaterAttributes, GoalieAttributes } from '@/types';

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
            const player = teamToUpdate.roster[playerIndex];
            player.healthStatus = 'Injured';
            player.injury = {
                type: injuryInfo.injuryType,
                duration: injuryInfo.duration,
            };

            // Stat regression for serious injuries
            const seriousInjuryTypes = ["Broken Arm", "Torn ACL", "Severe Concussion"];
            if (seriousInjuryTypes.includes(injuryInfo.injuryType)) {
                const isSkater = !player.positions.includes('G');
                let affectedAttributes: (keyof SkaterAttributes | keyof GoalieAttributes)[] = [];

                switch (injuryInfo.injuryType) {
                    case "Torn ACL":
                        affectedAttributes = ['speed', 'acceleration', 'agility', 'balance'];
                        break;
                    case "Severe Concussion":
                        affectedAttributes = isSkater ? ['bravery', 'offensiveRead', 'defensiveRead'] : ['mentalToughness', 'reflexes'];
                        break;
                    case "Broken Arm":
                        affectedAttributes = isSkater ? ['puckhandling', 'shootingAccuracy', 'stickchecking', 'strength'] : ['glove', 'blocker'];
                        break;
                }

                // Apply regression to one or two of the affected attributes
                const numAttributesToRegress = Math.random() < 0.7 ? 1 : 2;
                for (let i = 0; i < numAttributesToRegress; i++) {
                    if (affectedAttributes.length > 0) {
                        const attrToRegress = affectedAttributes.splice(Math.floor(Math.random() * affectedAttributes.length), 1)[0];
                        const currentAttrValue = player.attributes[attrToRegress as keyof typeof player.attributes] as number;
                        
                        if (currentAttrValue > 1) {
                            const regression = 0.5 + Math.random(); // Regress by 0.5 to 1.5
                            const newAttrValue = Math.max(1, currentAttrValue - regression);
                            (player.attributes[attrToRegress as keyof typeof player.attributes] as number) = newAttrValue;
                        }
                    }
                }
            }
        }
    });

    // Process morale
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