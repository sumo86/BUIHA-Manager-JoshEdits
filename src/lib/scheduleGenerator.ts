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
    const gameWeeks: { month: string, week: number, year: number }[] = [];
    let currentYear = startDate.year;

    // Create a list of all available weeks in the season
    seasonMonths.forEach(month => {
        // Adjust year for months in the next calendar year
        if (["January", "February", "March", "April"].includes(month) && !["January", "February", "March", "April"].includes(startDate.month)) {
            currentYear = startDate.year + 1;
        } else {
            currentYear = startDate.year;
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

    shuffleArray(allMatchups);
    shuffleArray(gameWeeks);

    const schedule: ScheduleEntry[] = [];
    const maxGames = Math.min(allMatchups.length, gameWeeks.length);

    for (let i = 0; i < maxGames; i++) {
        schedule.push({
            id: uuidv4(),
            ...allMatchups[i],
            date: gameWeeks[i],
            status: 'scheduled',
        });
    }

    // Sort schedule by date for readability
    schedule.sort((a, b) => {
        const aMonthIndex = seasonMonths.indexOf(a.date.month);
        const bMonthIndex = seasonMonths.indexOf(b.date.month);
        if (a.date.year !== b.date.year) return a.date.year - b.date.year;
        if (aMonthIndex !== bMonthIndex) return aMonthIndex - bMonthIndex;
        return a.date.week - b.date.week;
    });

    return schedule;
};