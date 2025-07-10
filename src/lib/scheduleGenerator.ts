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
    // Season runs from September to April
    const seasonMonths = ["September", "October", "November", "December", "January", "February", "March", "April"];
    const gameWeeks: GameDate[] = [];
    
    // Create an ordered list of all available weeks in the season
    seasonMonths.forEach(month => {
        let currentYear = startDate.year;
        // Handle year rollover for the second half of the season
        if (["January", "February", "March", "April"].includes(month)) {
            currentYear = startDate.year + 1;
        }
        for (let week = 1; week <= 4; week++) {
            gameWeeks.push({ month, week, year: currentYear });
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

    // Generate all home-and-away matchups for each division
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

    // Shuffle matchups to randomize the schedule
    const remainingMatchups = shuffleArray(allMatchups);
    const schedule: ScheduleEntry[] = [];

    // Iterate through each week and schedule as many games as possible
    gameWeeks.forEach(date => {
        const teamsPlayingThisWeek = new Set<string>();
        const matchupsToScheduleThisWeek = [];

        // Iterate backwards to safely remove items from the array
        for (let i = remainingMatchups.length - 1; i >= 0; i--) {
            const matchup = remainingMatchups[i];
            // If neither team is already playing this week, schedule the game
            if (!teamsPlayingThisWeek.has(matchup.homeTeam) && !teamsPlayingThisWeek.has(matchup.awayTeam)) {
                matchupsToScheduleThisWeek.push(matchup);
                teamsPlayingThisWeek.add(matchup.homeTeam);
                teamsPlayingThisWeek.add(matchup.awayTeam);
                remainingMatchups.splice(i, 1); // Remove scheduled matchup
            }
        }

        // Add the scheduled games for this week to the main schedule
        matchupsToScheduleThisWeek.forEach(matchup => {
            schedule.push({
                id: uuidv4(),
                homeTeam: matchup.homeTeam,
                awayTeam: matchup.awayTeam,
                date: date,
                status: 'scheduled',
            });
        });
    });

    if (remainingMatchups.length > 0) {
        console.warn(`Could not schedule ${remainingMatchups.length} games. Consider extending the season.`);
    }

    // Sort the final schedule by date to ensure it's chronological
    schedule.sort((a, b) => {
        const aMonthIndex = seasonMonths.indexOf(a.date.month);
        const bMonthIndex = seasonMonths.indexOf(b.date.month);
        if (a.date.year !== b.date.year) return a.date.year - b.date.year;
        if (aMonthIndex !== bMonthIndex) return aMonthIndex - bMonthIndex;
        return a.date.week - b.date.week;
    });

    return schedule;
};