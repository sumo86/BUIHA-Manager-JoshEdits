import { Team, NationalsGroup, NationalsTournament, ScheduleEntry, GameDate, NationalsPlayoffMatch } from '@/types';

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

    const { year, month } = startDate;
    const startWeek = startDate.week;
    const gamesPerWeek = 4; // Max 4 games per tournament per week

    shuffledMatches.forEach((match, index) => {
        const weekOffset = Math.floor(index / gamesPerWeek);
        const gameWeek = startWeek + weekOffset;

        // Note: This simple logic assumes nationals finish within May.
        schedule.push({
            id: crypto.randomUUID(),
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            date: { year, month, week: gameWeek },
            status: 'scheduled',
        });
    });

    return schedule;
};

export const generatePlayoffBracket = (groups: NationalsGroup[], date: GameDate): NationalsPlayoffMatch[] => {
    // This is a placeholder for future implementation.
    // It would analyze group standings and create knockout matches.
    console.log("Generating playoff bracket for", date);
    return [];
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