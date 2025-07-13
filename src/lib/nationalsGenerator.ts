import { Team, NationalsGroup, NationalsTournament, ScheduleEntry, GameDate } from '@/types';

// Fisher-Yates shuffle algorithm
const shuffleArray = <T>(array: T[]): T[] => {
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

  return [
    createGroup("Group A", groupATeams),
    createGroup("Group B", groupBTeams),
  ];
};

export const generateGroupStageSchedule = (groups: NationalsGroup[], date: GameDate): ScheduleEntry[] => {
    const schedule: ScheduleEntry[] = [];
    
    groups.forEach(group => {
        const teams = group.teams;
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                schedule.push({
                    id: crypto.randomUUID(),
                    homeTeam: teams[i],
                    awayTeam: teams[j],
                    date,
                    status: 'scheduled',
                });
            }
        }
    });

    return shuffleArray(schedule);
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
        status: 'pending',
    };
};