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
    console.log("generateSeasonSchedule called with teams:", teams.length, "teams. First team:", teams[0]?.name);
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

    Object.values(teamsByDivision).forEach(divisionTeams => {
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

    const remainingMatchups = shuffleArray(allMatchups);
    const schedule: ScheduleEntry[] = [];
    
    // Calculate a target for games per week to ensure even distribution
    const totalGamesToSchedule = remainingMatchups.length;
    const totalWeeksAvailable = gameWeeks.length;
    // This will be the maximum number of games to schedule in any given week
    const gamesPerWeekTarget = Math.ceil(totalGamesToSchedule / totalWeeksAvailable);

    let teamsThatPlayedLastWeek = new Set<string>();

    gameWeeks.forEach(date => {
        const teamsPlayingThisWeek = new Set<string>();
        const matchupsThisWeek = [];
        
        // Pass 1: Prioritize scheduling teams that had a break last week
        for (let i = remainingMatchups.length - 1; i >= 0; i--) {
            if (matchupsThisWeek.length >= gamesPerWeekTarget) break;

            const matchup = remainingMatchups[i];
            if (
                !teamsPlayingThisWeek.has(matchup.homeTeam) &&
                !teamsPlayingThisWeek.has(matchup.awayTeam) &&
                !teamsThatPlayedLastWeek.has(matchup.homeTeam) &&
                !teamsThatPlayedLastWeek.has(matchup.awayTeam)
            ) {
                matchupsThisWeek.push(matchup);
                teamsPlayingThisWeek.add(matchup.homeTeam);
                teamsPlayingThisWeek.add(matchup.awayTeam);
                remainingMatchups.splice(i, 1);
            }
        }

        // Pass 2: Fill remaining slots up to the weekly target, if needed
        for (let i = remainingMatchups.length - 1; i >= 0; i--) {
            if (matchupsThisWeek.length >= gamesPerWeekTarget) break;

            const matchup = remainingMatchups[i];
            if (
                !teamsPlayingThisWeek.has(matchup.homeTeam) &&
                !teamsPlayingThisWeek.has(matchup.awayTeam)
            ) {
                matchupsThisWeek.push(matchup);
                teamsPlayingThisWeek.add(matchup.homeTeam);
                teamsPlayingThisWeek.add(matchup.awayTeam);
                remainingMatchups.splice(i, 1);
            }
        }

        // Add the scheduled games for this week to the main schedule
        matchupsThisWeek.forEach(matchup => {
            schedule.push({
                id: uuidv4(),
                homeTeam: matchup.homeTeam,
                awayTeam: matchup.awayTeam,
                date: date,
                status: 'scheduled',
            });
        });

        teamsThatPlayedLastWeek = teamsPlayingThisWeek;
    });

    // After the main loop, some games might be left over due to scheduling constraints.
    // Distribute these remaining games into weeks that have capacity.
    if (remainingMatchups.length > 0) {
        for (let i = remainingMatchups.length - 1; i >= 0; i--) {
            const matchupToSchedule = remainingMatchups[i];
            let scheduled = false;

            for (const date of gameWeeks) {
                const teamsPlayingThatWeek = new Set(
                    schedule.filter(g => g.date.month === date.month && g.date.week === date.week && g.date.year === date.year)
                            .flatMap(g => [g.homeTeam, g.awayTeam])
                );

                if (!teamsPlayingThatWeek.has(matchupToSchedule.homeTeam) && !teamsPlayingThatWeek.has(matchupToSchedule.awayTeam)) {
                    schedule.push({
                        id: uuidv4(),
                        homeTeam: matchupToSchedule.homeTeam,
                        awayTeam: matchupToSchedule.awayTeam,
                        date: date,
                        status: 'scheduled',
                    });
                    scheduled = true;
                    break; // Move to the next matchup
                }
            }
            if (scheduled) {
                remainingMatchups.splice(i, 1);
            }
        }
    }

    if (remainingMatchups.length > 0) {
        console.warn(`Could not schedule ${remainingMatchups.length} games. Consider extending the season.`);
    }

    // Sort the final schedule by date to ensure it's chronological
    schedule.sort((a, b) => {
        if (a.date.year !== b.date.year) return a.date.year - b.date.year;
        const aMonthIndex = seasonMonths.indexOf(a.date.month);
        const bMonthIndex = seasonMonths.indexOf(b.date.month);
        if (aMonthIndex !== bMonthIndex) return aMonthIndex - bMonthIndex;
        return a.date.week - b.date.week;
    });

    console.log("Generated schedule length:", schedule.length);
    return schedule;
};