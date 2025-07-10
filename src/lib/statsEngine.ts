import { Team, GameState } from '@/types';

const parseGoalEvent = (description: string): { scorer: string, assisters: string[] } => {
    const scorerMatch = description.match(/GOAL! (.*?) scores./);
    const scorer = scorerMatch ? scorerMatch[1] : '';

    const assisters: string[] = [];
    const assistMatch = description.match(/Assists: (.*)/);
    if (assistMatch && assistMatch[1] !== 'Unassisted') {
        assisters.push(...assistMatch[1].split(', '));
    }

    return { scorer, assisters };
};

export const processGameResults = (
    homeTeam: Team,
    awayTeam: Team,
    gameState: GameState
): { updatedUserTeam: Team, updatedOpponentTeam: Team } => {
    const updatedHomeTeam = JSON.parse(JSON.stringify(homeTeam)) as Team;
    const updatedAwayTeam = JSON.parse(JSON.stringify(awayTeam)) as Team;

    // 1. Increment games played for all players on both rosters
    updatedHomeTeam.roster.forEach(p => { p.currentStats.gamesPlayed += 1; });
    updatedAwayTeam.roster.forEach(p => { p.currentStats.gamesPlayed += 1; });

    // 2. Update team-level stats
    if (gameState.userScore > gameState.opponentScore) {
        updatedHomeTeam.wins += 1;
        updatedAwayTeam.losses += 1;
    } else if (gameState.opponentScore > gameState.userScore) {
        updatedAwayTeam.wins += 1;
        updatedHomeTeam.losses += 1;
    } else {
        updatedHomeTeam.draws += 1;
        updatedAwayTeam.draws += 1;
    }
    updatedHomeTeam.goalsFor += gameState.userScore;
    updatedHomeTeam.goalsAgainst += gameState.opponentScore;
    updatedAwayTeam.goalsFor += gameState.opponentScore;
    updatedAwayTeam.goalsAgainst += gameState.userScore;

    // 3. Process game log for individual player stats
    gameState.gameLog.forEach(event => {
        if (event.description.startsWith('GOAL!')) {
            const { scorer, assisters } = parseGoalEvent(event.description);
            const scoringTeamRoster = event.team === updatedHomeTeam.name 
                ? updatedHomeTeam.roster 
                : updatedAwayTeam.roster;

            const scorerPlayer = scoringTeamRoster.find(p => p.name === scorer);
            if (scorerPlayer && !scorerPlayer.positions.includes('G')) {
                scorerPlayer.currentStats.goals += 1;
                scorerPlayer.currentStats.points += 1;
            }

            assisters.forEach(assistName => {
                const assisterPlayer = scoringTeamRoster.find(p => p.name === assistName);
                if (assisterPlayer && !assisterPlayer.positions.includes('G')) {
                    assisterPlayer.currentStats.assists += 1;
                    assisterPlayer.currentStats.points += 1;
                }
            });
        }
    });
    
    // 4. Update goalie stats
    const homeGoalie = updatedHomeTeam.roster.find(p => p.id === updatedHomeTeam.lineup.goalies.starter);
    if (homeGoalie) {
        if (gameState.userScore > gameState.opponentScore) homeGoalie.currentStats.wins += 1;
        else if (gameState.opponentScore > gameState.userScore) homeGoalie.currentStats.losses += 1;
        else homeGoalie.currentStats.draws += 1;
        homeGoalie.currentStats.goalsAgainst += gameState.opponentScore;
    }

    const awayGoalie = updatedAwayTeam.roster.find(p => p.id === updatedAwayTeam.lineup.goalies.starter);
    if (awayGoalie) {
        if (gameState.opponentScore > gameState.userScore) awayGoalie.currentStats.wins += 1;
        else if (gameState.userScore > gameState.opponentScore) awayGoalie.currentStats.losses += 1;
        else awayGoalie.currentStats.draws += 1;
        awayGoalie.currentStats.goalsAgainst += gameState.userScore;
    }

    return { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam };
};