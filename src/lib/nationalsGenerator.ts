import { Team, NationalsGroup, NationalsTournament, ScheduleEntry, GameDate, NationalsPlayoffMatch, NationalsStanding } from '@/types';

const months = ["August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June", "July"];

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const generateNationalsGroups = (allTeamsInDivision: Team[]): NationalsGroup[] => {
  const shuffledTeams = shuffleArray(allTeamsInDivision);
  const midPoint = Math.ceil(shuffledTeams.length / 2);
  const groupATeams = shuffledTeams.slice(0, midPoint);
  const groupBTeams = shuffledTeams.slice(midPoint);

  const createGroup = (name: string, teams: Team[]): NationalsGroup => ({
    name,
    teams: teams.map(t => t.name),
    standings: teams.map(t => ({
      teamName: t.name,
      played: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    })),
  });

  const groups = [];
  if (groupATeams.length > 0) groups.push(createGroup("Group A", groupATeams));
  if (groupBTeams.length > 0) groups.push(createGroup("Group B", groupBTeams));
  
  return groups;
};

export const advanceDate = (date: GameDate): GameDate => {
    let { year, month, week } = date;
    week++;
    if (week > 4) {
        week = 1;
        const monthIndex = months.indexOf(month);
        let nextMonthIndex = (monthIndex + 1) % months.length;
        month = months[nextMonthIndex];
        if (month === 'August') {
            year++;
        }
    }
    return { year, month, week };
};

export const generateGroupStageSchedule = (groups: NationalsGroup[], startDate: GameDate): ScheduleEntry[] => {
    const schedule: ScheduleEntry[] = [];
    const allMatches: { homeTeam: string, awayTeam: string }[] = [];

    groups.forEach(group => {
        const teams = group.teams;
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                allMatches.push({ homeTeam: teams[i], awayTeam: teams[j] });
            }
        }
    });

    const shuffledMatches = shuffleArray(allMatches);
    let currentDate = { ...startDate };

    shuffledMatches.forEach((match) => {
        schedule.push({
            id: crypto.randomUUID(),
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            date: { ...currentDate },
            status: 'scheduled',
        });
        currentDate = advanceDate(currentDate);
    });

    return schedule;
};

const sortStandings = (standings: NationalsStanding[]): NationalsStanding[] => {
    return [...standings].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const goalDiffA = a.goalsFor - a.goalsAgainst;
        const goalDiffB = b.goalsFor - b.goalsAgainst;
        if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
        return b.goalsFor - a.goalsFor;
    });
};

export const generatePlayoffBracket = (groups: NationalsGroup[], date: GameDate): NationalsPlayoffMatch[] => {
    if (groups.length < 2 || groups[0].teams.length < 2 || groups[1].teams.length < 2) {
        return []; // Not enough teams for playoffs
    }

    const sortedGroupA = sortStandings(groups[0].standings);
    const sortedGroupB = sortStandings(groups[1].standings);

    const a1 = sortedGroupA[0].teamName;
    const a2 = sortedGroupA[1].teamName;
    const b1 = sortedGroupB[0].teamName;
    const b2 = sortedGroupB[1].teamName;

    const semiFinal1Id = crypto.randomUUID();
    const semiFinal2Id = crypto.randomUUID();
    
    let currentDate = { ...date };

    const semiFinals: NationalsPlayoffMatch[] = [
        { id: semiFinal1Id, round: 'Semi-Final', bracket: 'Gold', homeTeam: a1, awayTeam: b2, status: 'scheduled', date: currentDate },
        { id: semiFinal2Id, round: 'Semi-Final', bracket: 'Gold', homeTeam: b1, awayTeam: a2, status: 'scheduled', date: currentDate },
    ];

    currentDate = advanceDate(currentDate);

    const finals: NationalsPlayoffMatch[] = [
        { id: crypto.randomUUID(), round: 'Final', bracket: 'Gold', homeTeam: { winnerOf: semiFinal1Id }, awayTeam: { winnerOf: semiFinal2Id }, status: 'scheduled', date: currentDate },
    ];

    return [...semiFinals, ...finals];
};

export const createNationalsTournament = (division: string, teams: Team[], year: number, week: number): NationalsTournament => {
    const groups = generateNationalsGroups(teams);
    const date: GameDate = { year, month: 'May', week };
    const groupStageSchedule = generateGroupStageSchedule(groups, date);

    return {
        division,
        year,
        groups,
        groupStageSchedule,
        playoffSchedule: [],
        status: 'group-stage',
    };
};