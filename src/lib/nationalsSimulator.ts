import { Team, NationalsTournament, NationalsPlayoffMatch, ScheduleEntry, NationalsGame } from '@/types';
import { simulateFullGame, simulateOvertime } from './gameEngine';
import { processGameResults as processGameResultsEngine } from './statsEngine';
import { generatePlayoffBracket } from './nationalsGenerator';
import { toast } from 'sonner';

const getWinner = (match: NationalsPlayoffMatch): string | undefined => {
    if (!match.result) return undefined;
    if (match.result.homeScore > match.result.awayScore) return typeof match.homeTeam === 'string' ? match.homeTeam : undefined;
    if (match.result.awayScore > match.result.homeScore) return typeof match.awayTeam === 'string' ? match.awayTeam : undefined;
    return undefined;
};

export const processNationalsRound = (
    division: string,
    teams: Team[],
    nationalsData: { [year: number]: { [division: string]: NationalsTournament } },
    currentYear: number,
    userGameResult?: { homeTeamName: string, awayTeamName: string, homeScore: number, awayScore: number, gameId: string }
): { updatedTeams: Team[], updatedNationalsData: any, newAchievements: { teamName: string, achievement: any }[] } => {
    const tempNationalsData = JSON.parse(JSON.stringify(nationalsData));
    const tournament = tempNationalsData[currentYear]?.[division];
    if (!tournament || tournament.status === 'completed') {
        return { updatedTeams: teams, updatedNationalsData: nationalsData, newAchievements: [] };
    }

    let tempTeams = JSON.parse(JSON.stringify(teams)) as Team[];
    const newAchievements: { teamName: string, achievement: any }[] = [];
    
    if (tournament.status === 'group-stage') {
        const gamesToSim = tournament.groupStageSchedule.filter((g: NationalsGame) => g.round === tournament.currentRound && g.status === 'scheduled');
        
        if (userGameResult) {
            const userGame = gamesToSim.find(g => g.id === userGameResult.gameId);
            if (userGame) {
                userGame.status = 'completed';
                userGame.result = { homeScore: userGameResult.homeScore, awayScore: userGameResult.awayScore };
            }
        }

        gamesToSim.forEach((game: NationalsGame) => {
            if (game.status === 'completed') return;
            const homeTeam = tempTeams.find((t: Team) => t.name === game.homeTeam);
            const awayTeam = tempTeams.find((t: Team) => t.name === game.awayTeam);

            if (homeTeam && awayTeam) {
                const finalGameState = simulateFullGame(homeTeam, awayTeam, true);
                const currentSeasonString = `${currentYear}-${currentYear + 1}`;
                const { updatedUserTeam, updatedOpponentTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, currentSeasonString, true);
                tempTeams = tempTeams.map((t: Team) => {
                    if (t.name === homeTeam.name) return updatedUserTeam;
                    if (t.name === awayTeam.name) return updatedOpponentTeam;
                    return t;
                });
                game.status = 'completed';
                game.result = { homeScore: finalGameState.userScore, awayScore: finalGameState.opponentScore };
            }
        });

        tournament.groups.forEach((group: any) => {
            group.standings.forEach((standing: any) => {
                const teamGames = tournament.groupStageSchedule.filter((g: NationalsGame) => (g.homeTeam === standing.teamName || g.awayTeam === standing.teamName) && g.round === tournament.currentRound && g.result);
                teamGames.forEach((game: NationalsGame) => {
                    standing.played++;
                    const isHome = game.homeTeam === standing.teamName;
                    const homeScore = game.result!.homeScore;
                    const awayScore = game.result!.awayScore;
                    standing.goalsFor += isHome ? homeScore : awayScore;
                    standing.goalsAgainst += isHome ? awayScore : homeScore;
                    if (homeScore === awayScore) { standing.draws++; standing.points++; }
                    else if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) { standing.wins++; standing.points += 3; }
                    else { standing.losses++; }
                });
            });
        });

        tournament.currentRound = (tournament.currentRound as number) + 1;
        
        const allGroupGamesPlayed = tournament.groupStageSchedule.every((g: NationalsGame) => g.status === 'completed');
        if (allGroupGamesPlayed) {
            toast.success(`Group stage for ${division} has concluded!`, { description: "Playoff matchups will now be generated." });
            tournament.playoffSchedule = generatePlayoffBracket(tournament.groups, tournament.groupStageSchedule[0].date);
            
            const silverPlayoffExists = tournament.playoffSchedule.some((m: NationalsPlayoffMatch) => m.bracket === 'Silver');

            if (silverPlayoffExists) {
                tournament.status = 'silver-playoffs';
                const firstSilverRound = tournament.playoffSchedule.find((m: NationalsPlayoffMatch) => m.bracket === 'Silver')?.round || 'Final';
                tournament.currentRound = firstSilverRound;
            } else {
                tournament.status = 'gold-playoffs';
                const firstGoldRound = tournament.playoffSchedule.find((m: NationalsPlayoffMatch) => m.bracket === 'Gold')?.round || 'Final';
                tournament.currentRound = firstGoldRound;
            }

            if (tournament.playoffSchedule.length === 0) {
                tournament.status = 'completed';
            }
        }
    } else if (tournament.status === 'silver-playoffs' || tournament.status === 'gold-playoffs') {
        const currentBracket = tournament.status === 'silver-playoffs' ? 'Silver' : 'Gold';
        const allPlayoffGames = tournament.playoffSchedule as NationalsPlayoffMatch[];
        
        allPlayoffGames.forEach((game: NationalsPlayoffMatch) => {
            if (game.bracket === currentBracket && game.round === tournament.currentRound && game.status === 'scheduled') {
                if (typeof game.homeTeam !== 'string') {
                    const feederMatch = allPlayoffGames.find(m => m.id === (game.homeTeam as { winnerOf: string }).winnerOf);
                    if (feederMatch && feederMatch.status === 'completed') {
                        game.homeTeam = getWinner(feederMatch) || 'TBD';
                    }
                }
                if (typeof game.awayTeam !== 'string') {
                    const feederMatch = allPlayoffGames.find(m => m.id === (game.awayTeam as { winnerOf: string }).winnerOf);
                    if (feederMatch && feederMatch.status === 'completed') {
                        game.awayTeam = getWinner(feederMatch) || 'TBD';
                    }
                }
            }
        });

        const gamesToSimThisRound = allPlayoffGames.filter(g => g.bracket === currentBracket && g.round === tournament.currentRound && g.status === 'scheduled' && typeof g.homeTeam === 'string' && typeof g.awayTeam === 'string');
        
        if (userGameResult) {
            const userGame = gamesToSimThisRound.find(g => g.id === userGameResult.gameId);
            if (userGame) {
                userGame.status = 'completed';
                userGame.result = { homeScore: userGameResult.homeScore, awayScore: userGameResult.awayScore };
            }
        }

        gamesToSimThisRound.forEach(game => {
            if (game.status === 'completed') return;
            const homeTeam = tempTeams.find(t => t.name === game.homeTeam);
            const awayTeam = tempTeams.find(t => t.name === game.awayTeam);
            if (homeTeam && awayTeam) {
                let finalGameState = simulateFullGame(homeTeam, awayTeam, true);
                if (finalGameState.userScore === finalGameState.opponentScore) {
                    finalGameState = simulateOvertime(finalGameState, homeTeam, awayTeam, true);
                }
                const currentSeasonString = `${currentYear}-${currentYear + 1}`;
                const { updatedUserTeam, updatedOpponentTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, currentSeasonString, true);
                tempTeams = tempTeams.map(t => t.name === homeTeam.name ? updatedUserTeam : t.name === awayTeam.name ? updatedOpponentTeam : t);
                game.status = 'completed';
                game.result = { homeScore: finalGameState.userScore, awayScore: finalGameState.opponentScore };
                game.winner = getWinner(game);
            }
        });

        const roundIsComplete = allPlayoffGames.filter(g => g.bracket === currentBracket && g.round === tournament.currentRound).every(g => g.status === 'completed');
        if (roundIsComplete) {
            const nextRound = allPlayoffGames.find(g => g.bracket === currentBracket && g.status === 'scheduled');
            if (nextRound) {
                tournament.currentRound = nextRound.round;
            } else {
                if (currentBracket === 'Silver') {
                    const goldPlayoffExists = allPlayoffGames.some(g => g.bracket === 'Gold');
                    if (goldPlayoffExists) {
                        tournament.status = 'gold-playoffs';
                        tournament.currentRound = allPlayoffGames.find(g => g.bracket === 'Gold')?.round || 'Final';
                    } else {
                        tournament.status = 'completed';
                    }
                } else {
                    tournament.status = 'completed';
                }
            }
        }
    }

    if (tournament.status === 'completed') {
        const seasonString = `${currentYear}-${currentYear + 1}`;
        const goldFinal = tournament.playoffSchedule.find(m => m.bracket === 'Gold' && m.round === 'Final');
        if (goldFinal && goldFinal.winner) {
            newAchievements.push({ teamName: goldFinal.winner, achievement: { type: 'Nationals Gold', season: seasonString, division } });
        }
        const silverFinal = tournament.playoffSchedule.find(m => m.bracket === 'Silver' && m.round === 'Final');
        if (silverFinal && silverFinal.winner) {
            newAchievements.push({ teamName: silverFinal.winner, achievement: { type: 'Nationals Silver', season: seasonString, division } });
        }
    }

    tempNationalsData[currentYear][division] = tournament;
    return { updatedTeams: tempTeams, updatedNationalsData: tempNationalsData, newAchievements };
};