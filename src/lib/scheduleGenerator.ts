import { Team, ScheduleEntry, GameDate } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Helper to shuffle an array
const shuffleArray = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const generateSeasonSchedule = (teams: Team[], startDate: GameDate): ScheduleEntry[] => {
    const seasonMonths = ["September", "October", "November", "December", "January", "February", "March", "April"];
    const gameWeeks: GameDate[] = [];
    
    const seasonYear = startDate.year;
    seasonMonths.forEach(month => {
        for (let week = 1; week <= 4; week++) {
            const displayYear = (["January", "February", "March", "April"].includes(month)) ? seasonYear + 1 : seasonYear;
            gameWeeks.push({ month, week, year: displayYear });
        }
    });

    const teamsByDivision: { [key: string]: Team[] } = {};
    teams.forEach(team => {
        if (!teamsByDivision[team.leagueDivision]) {
            teamsByDivision[team.leagueDivision] = [];
        }
        teamsByDivision[team.leagueDivision].push(team);
    });

    let allMatchups: { homeTeam: string, awayTeam: string }[] = [];

    // Generate round-robin matchups for each division (home and away)
    Object.values(teamsByDivision).forEach(divisionTeams => {
        if (divisionTeams.length < 2) return;

        for (let i = 0; i < divisionTeams.length; i++) {
            for (let j = 0; j < divisionTeams.length; j++) {
                if (i !== j) {
                    allMatchups.push({
                        homeTeam: divisionTeams[i].name,
                        awayTeam: divisionTeams[j].name,
                    });
                }
            }
        }
    });

    // Shuffle all matchups to randomize the season's game order
    const shuffledMatchups = shuffleArray(allMatchups);
    const schedule: ScheduleEntry[] = [];
    
    // Distribute games as evenly as possible across the available weeks
    let weekIndex = 0;
    while (shuffledMatchups.length > 0) {
        const date = gameWeeks[weekIndex % gameWeeks.length];
        const teamsPlayingThisWeek = new Set(
            schedule.filter(g => g.date.month === date.month && g.date.week === date.week && g.date.year === date.year)
                    .flatMap(g => [g.homeTeam, g.awayTeam])
        );

        // Find a game for this week where neither team is already playing
        let gameScheduledThisTurn = false;
        for (let i = shuffledMatchups.length - 1; i >= 0; i--) {
            const matchup = shuffledMatchups[i];
            if (!teamsPlayingThisWeek.has(matchup.homeTeam) && !teamsPlayingThisWeek.has(matchup.awayTeam)) {
                schedule.push({
                    id: uuidv4(),
                    homeTeam: matchup.homeTeam,
                    awayTeam: matchup.awayTeam,
                    date: date,
                    status: 'scheduled',
                });
                shuffledMatchups.splice(i, 1); // Remove the scheduled game
                gameScheduledThisTurn = true;
                break;
            }
        }

        // Move to the next week
        weekIndex++;

        // Safety break to prevent infinite loops if a game can't be scheduled
        if (weekIndex > gameWeeks.length * 3 && shuffledMatchups.length > 0) {
             console.warn(`Could not schedule ${shuffledMatchups.length} games through normal distribution. Forcing them into available slots.`);
             shuffledMatchups.forEach(matchup => {
                // Find the first available week with the fewest games
                let bestWeek = gameWeeks[0];
                let minGames = Infinity;
                gameWeeks.forEach(week => {
                    const gamesInWeek = schedule.filter(g => g.date.month === week.month && g.date.week === week.week).length;
                    if (gamesInWeek < minGames) {
                        minGames = gamesInWeek;
                        bestWeek = week;
                    }
                });
                 schedule.push({
                    id: uuidv4(),
                    homeTeam: matchup.homeTeam,
                    awayTeam: matchup.awayTeam,
                    date: bestWeek,
                    status: 'scheduled',
                });
             });
             shuffledMatchups.length = 0; // Clear the array
        }
    }

    // Sort the final schedule by date to ensure it's chronological
    schedule.sort((a, b) => {
        if (a.date.year !== b.date.year) return a.date.year - b.date.year;
        const aMonthIndex = seasonMonths.indexOf(a.date.month);
        const bMonthIndex = seasonMonths.indexOf(b.date.month);
        if (aMonthIndex !== bMonthIndex) return aMonthIndex - bMonthIndex;
        return a.date.week - b.date.week;
    });

    return schedule;
};