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
    const seasonMonths = ["September", "October", "November", "December", "January", "February", "March"];
    const gameWeeks: GameDate[] = [];
    
    const seasonYear = startDate.year;
    seasonMonths.forEach(month => {
        for (let week = 1; week <= 4; week++) {
            const displayYear = (["January", "February", "March"].includes(month)) ? seasonYear + 1 : seasonYear;
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

    const schedule: ScheduleEntry[] = [];
    const matchupsToSchedule = shuffleArray(allMatchups);
    const matchupsPerWeek = Math.ceil(matchupsToSchedule.length / gameWeeks.length);

    // Distribute games by iterating through weeks
    gameWeeks.forEach(date => {
        const teamsPlayingThisWeek = new Set<string>();
        let gamesScheduledThisWeek = 0;

        for (let i = matchupsToSchedule.length - 1; i >= 0; i--) {
            // Stop adding games to this week if we've hit our quota
            if (gamesScheduledThisWeek >= matchupsPerWeek) {
                break;
            }

            const matchup = matchupsToSchedule[i];
            if (!teamsPlayingThisWeek.has(matchup.homeTeam) && !teamsPlayingThisWeek.has(matchup.awayTeam)) {
                schedule.push({
                    id: uuidv4(),
                    homeTeam: matchup.homeTeam,
                    awayTeam: matchup.awayTeam,
                    date: date,
                    status: 'scheduled',
                });
                
                teamsPlayingThisWeek.add(matchup.homeTeam);
                teamsPlayingThisWeek.add(matchup.awayTeam);
                matchupsToSchedule.splice(i, 1); // Remove the scheduled game
                gamesScheduledThisWeek++;
            }
        }
    });

    // If any matchups are left (e.g., due to weekly team conflicts), force them into the schedule
    if (matchupsToSchedule.length > 0) {
        console.warn(`Could not schedule ${matchupsToSchedule.length} games through normal distribution. Forcing them into available slots.`);
        matchupsToSchedule.forEach(matchup => {
            let scheduled = false;
            for (const week of gameWeeks) {
                const teamsInWeek = new Set(schedule.filter(g => g.date.year === week.year && g.date.month === week.month && g.date.week === week.week).flatMap(g => [g.homeTeam, g.awayTeam]));
                if (!teamsInWeek.has(matchup.homeTeam) && !teamsInWeek.has(matchup.awayTeam)) {
                    schedule.push({
                        id: uuidv4(),
                        homeTeam: matchup.homeTeam,
                        awayTeam: matchup.awayTeam,
                        date: week,
                        status: 'scheduled',
                    });
                    scheduled = true;
                    break;
                }
            }
            if (!scheduled) {
                // As a last resort, add to the first week. This should be very rare.
                schedule.push({
                    id: uuidv4(),
                    homeTeam: matchup.homeTeam,
                    awayTeam: matchup.awayTeam,
                    date: gameWeeks[0],
                    status: 'scheduled',
                });
            }
        });
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