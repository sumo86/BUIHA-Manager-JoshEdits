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

    const remainingMatchups = shuffleArray(allMatchups);
    const schedule: ScheduleEntry[] = [];
    const teamLastPlayedWeek: { [teamName: string]: number } = {}; // Stores the index of the last week a team played

    gameWeeks.forEach((date, weekIndex) => {
        const teamsPlayingThisWeek = new Set<string>();
        const matchupsScheduledInThisIteration: { homeTeam: string, awayTeam: string }[] = [];

        // Pass 1: Prioritize scheduling teams that had a break last week
        // Iterate backwards to safely remove elements
        for (let i = remainingMatchups.length - 1; i >= 0; i--) {
            const matchup = remainingMatchups[i];
            const homeTeam = matchup.homeTeam;
            const awayTeam = matchup.awayTeam;

            const homeLastPlayed = teamLastPlayedWeek[homeTeam] || -2; // -2 ensures they can play in week 0
            const awayLastPlayed = teamLastPlayedWeek[awayTeam] || -2;

            // Check if both teams are available this week AND had a break last week
            if (
                !teamsPlayingThisWeek.has(homeTeam) &&
                !teamsPlayingThisWeek.has(awayTeam) &&
                homeLastPlayed < weekIndex - 1 && // Played before last week (i.e., at least one week ago)
                awayLastPlayed < weekIndex - 1
            ) {
                matchupsScheduledInThisIteration.push(matchup);
                teamsPlayingThisWeek.add(homeTeam);
                teamsPlayingThisWeek.add(awayTeam);
                remainingMatchups.splice(i, 1); // Remove from the pool of remaining matchups
            }
        }

        // Pass 2: Fill remaining slots with any available team, even if they played last week
        // Iterate backwards again over the *new* remainingMatchups (after Pass 1 removals)
        for (let i = remainingMatchups.length - 1; i >= 0; i--) {
            const matchup = remainingMatchups[i];
            const homeTeam = matchup.homeTeam;
            const awayTeam = matchup.awayTeam;

            if (
                !teamsPlayingThisWeek.has(homeTeam) &&
                !teamsPlayingThisWeek.has(awayTeam)
            ) {
                matchupsScheduledInThisIteration.push(matchup);
                teamsPlayingThisWeek.add(homeTeam);
                teamsPlayingThisWeek.add(awayTeam);
                remainingMatchups.splice(i, 1); // Remove from the pool of remaining matchups
            }
        }

        // Add the scheduled games for this week to the main schedule and update last played week
        matchupsScheduledInThisIteration.forEach(matchup => {
            schedule.push({
                id: uuidv4(),
                homeTeam: matchup.homeTeam,
                awayTeam: matchup.awayTeam,
                date: date,
                status: 'scheduled',
            });
            teamLastPlayedWeek[matchup.homeTeam] = weekIndex;
            teamLastPlayedWeek[matchup.awayTeam] = weekIndex;
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