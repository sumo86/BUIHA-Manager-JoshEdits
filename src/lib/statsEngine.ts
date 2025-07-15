import { Team, GameState, Player, SkaterAttributes, GoalieAttributes, PlayerSeasonStats } from '@/types';

const moraleLevels: Player['morale'][] = ["Angry", "Unhappy", "Content", "Happy"];

const updateMorale = (currentMorale: Player['morale'], change: 1 | -1): Player['morale'] => {
    const currentIndex = moraleLevels.indexOf(currentMorale);
    const newIndex = Math.max(0, Math.min(moraleLevels.length - 1, currentIndex + change));
    return moraleLevels[newIndex];
};

const getParticipatingPlayerIds = (team: Team): Set<string> => {
    const ids = new Set<string>();
    Object.values(team.lineup.forwards).flat().forEach(id => id && ids.add(id));
    Object.values(team.lineup.defence).flat().forEach(id => id && ids.add(id));
    if (team.lineup.goalies.starter) ids.add(team.lineup.goalies.starter);
    // Backup goalie is handled separately
    return ids;
};

const findOrCreateStatLine = (player: Player, team: Team, season: string): PlayerSeasonStats => {
    let statLine = player.currentStats.find(s => s.team === team.name && s.season === season);
    if (!statLine) {
        statLine = {
            season,
            team: team.name,
            league: team.leagueDivision,
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
        };
        player.currentStats.push(statLine);
    }
    return statLine;
};

export const processGameResults = (userTeam: Team, opponentTeam: Team, gameState: GameState, isNationalsGame: boolean = false) => {
    const updatedUserTeam = JSON.parse(JSON.stringify(userTeam));
    const updatedOpponentTeam = JSON.parse(JSON.stringify(opponentTeam));
    const season = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

    const processPlayerStats = (team: Team, opponent: Team, teamScore: number, opponentScore: number, teamShots: number) => {
        const participatingIds = getParticipatingPlayerIds(team);
        const allPlayersMap = new Map([...updatedUserTeam.roster, ...updatedOpponentTeam.roster].map(p => [p.name, p]));

        gameState.gameLog.forEach(event => {
            if (event.team === team.name && event.description.startsWith('GOAL!')) {
                const scorerName = event.description.split(' scores.')[0].split('GOAL! ')[1];
                const scorer = allPlayersMap.get(scorerName);
                if (scorer && participatingIds.has(scorer.id)) {
                    const stats = findOrCreateStatLine(scorer, team, season);
                    stats.goals = (stats.goals || 0) + 1;
                    stats.points = (stats.points || 0) + 1;
                }

                if (event.description.includes('Assists: ')) {
                    const assistsString = event.description.split('Assists: ')[1];
                    const assisterNames = assistsString.split(', ');
                    assisterNames.forEach(name => {
                        const assister = allPlayersMap.get(name);
                        if (assister && participatingIds.has(assister.id)) {
                            const stats = findOrCreateStatLine(assister, team, season);
                            stats.assists = (stats.assists || 0) + 1;
                            stats.points = (stats.points || 0) + 1;
                        }
                    });
                }
            }
        });

        team.roster.forEach((player: Player) => {
            if (participatingIds.has(player.id)) {
                const stats = findOrCreateStatLine(player, team, season);
                stats.gamesPlayed += 1;

                if (player.id === team.lineup.goalies.starter) {
                    stats.goalsAgainst = (stats.goalsAgainst || 0) + opponentScore;
                    stats.shotsAgainst = (stats.shotsAgainst || 0) + teamShots;
                    stats.saves = (stats.saves || 0) + (teamShots - opponentScore);
                    if (opponentScore === 0) stats.shutouts = (stats.shutouts || 0) + 1;
                    
                    const totalGames = player.history.reduce((acc, s) => acc + s.gamesPlayed, 0) + stats.gamesPlayed;
                    const totalGoalsAgainst = player.history.reduce((acc, s) => acc + (s.goalsAgainst || 0), 0) + (stats.goalsAgainst || 0);
                    const totalShotsAgainst = player.history.reduce((acc, s) => acc + (s.shotsAgainst || 0), 0) + (stats.shotsAgainst || 0);
                    const totalSaves = player.history.reduce((acc, s) => acc + (s.saves || 0), 0) + (stats.saves || 0);

                    stats.goalsAgainstAverage = totalGames > 0 ? totalGoalsAgainst / totalGames : 0;
                    stats.savePercentage = totalShotsAgainst > 0 ? totalSaves / totalShotsAgainst : 0;
                }
            }
        });

        // Handle backup goalie appearance
        const starterInjured = gameState.injuries.some(i => i.playerId === team.lineup.goalies.starter);
        if (starterInjured && team.lineup.goalies.backup) {
            const backupGoalie = team.roster.find(p => p.id === team.lineup.goalies.backup);
            if (backupGoalie) {
                const stats = findOrCreateStatLine(backupGoalie, team, season);
                stats.gamesPlayed += 1;
            }
        }
    };

    // Only update regular season stats if it's not a nationals game
    if (!isNationalsGame) {
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

        processPlayerStats(updatedUserTeam, updatedOpponentTeam, gameState.userScore, gameState.opponentScore, gameState.opponentShots);
        processPlayerStats(updatedOpponentTeam, updatedUserTeam, gameState.opponentScore, gameState.userScore, gameState.userShots);
    }

    gameState.injuries.forEach(injuryInfo => {
        const teamToUpdate = injuryInfo.teamName === userTeam.name ? updatedUserTeam : updatedOpponentTeam;
        const playerIndex = teamToUpdate.roster.findIndex((p: Player) => p.id === injuryInfo.playerId);
        if (playerIndex !== -1) {
            const player = teamToUpdate.roster[playerIndex];
            player.healthStatus = 'Injured';
            player.injury = { type: injuryInfo.injuryType, duration: injuryInfo.duration };
        }
    });

    const userWon = gameState.userScore > gameState.opponentScore;
    const opponentWon = gameState.opponentScore > gameState.userScore;
    const processTeamMorale = (team: Team, won: boolean) => {
        const leadershipRoster = team.roster.filter(p => (p.attributes as SkaterAttributes).leadership);
        const highestLeadership = leadershipRoster.length > 0 ? Math.max(...leadershipRoster.map(p => (p.attributes as SkaterAttributes).leadership)) : 10;
        const leadershipModifier = (highestLeadership - 10) / 40;
        team.roster.forEach((player: Player) => {
            const handleAttr = won ? player.attributes.handleSuccess : player.attributes.handleFailure;
            const baseChance = 0.3;
            const personalityModifier = (handleAttr - 10) / 50;
            let finalChance = baseChance + personalityModifier + (won ? leadershipModifier : -leadershipModifier);
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