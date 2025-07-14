import { Team, NationalsGroup, NationalsTournament, ScheduleEntry, GameDate, NationalsPlayoffMatch, NationalsStanding } from '@/types';

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
    
    groups.forEach(group => {
        const teams = [...group.teams];
        if (teams.length % 2 !== 0) {
            teams.push("BYE");
        }
        const numRounds = teams.length - 1;
        const half = teams.length / 2;

        for (let round = 0; round < numRounds; round++) {
            for (let i = 0; i < half; i++) {
                const home = teams[i];
                const away = teams[teams.length - 1 - i];
                if (home !== "BYE" && away !== "BYE") {
                    schedule.push({
                        id: crypto.randomUUID(),
                        homeTeam: home,
                        awayTeam: away,
                        date: { ...startDate },
                        status: 'scheduled',
                        round: round + 1,
                    });
                }
            }
            // Rotate teams
            const lastTeam = teams.pop();
            if (lastTeam) {
                teams.splice(1, 0, lastTeam);
            }
        }
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

export const generatePlayoffBracket = (groups: NationalsGroup[], date: GameDate, startRound: number): NationalsPlayoffMatch[] => {
    if (groups.length < 2 || groups[0].teams.length < 2 || groups[1].teams.length < 2) {
        return []; // Not enough teams for playoffs
    }

    const sortedGroupA = sortStandings(groups[0].standings);
    const sortedGroupB = sortStandings(groups[1].standings);

    const a1 = sortedGroupA[0]?.teamName;
    const a2 = sortedGroupA[1]?.teamName;
    const a3 = sortedGroupA[2]?.teamName;
    const a4 = sortedGroupA[3]?.teamName;
    const b1 = sortedGroupB[0]?.teamName;
    const b2 = sortedGroupB[1]?.teamName;
    const b3 = sortedGroupB[2]?.teamName;
    const b4 = sortedGroupB[3]?.teamName;

    const playoffs: NationalsPlayoffMatch[] = [];

    // Gold Bracket
    if (a1 && b2 && b1 && a2) {
        const goldSemi1Id = crypto.randomUUID();
        const goldSemi2Id = crypto.randomUUID();
        playoffs.push({ id: goldSemi1Id, round: 'Semi-Final', bracket: 'Gold', homeTeam: a1, awayTeam: b2, status: 'scheduled', date });
        playoffs.push({ id: goldSemi2Id, round: 'Semi-Final', bracket: 'Gold', homeTeam: b1, awayTeam: a2, status: 'scheduled', date });
        playoffs.push({ id: crypto.randomUUID(), round: 'Final', bracket: 'Gold', homeTeam: { winnerOf: goldSemi1Id }, awayTeam: { winnerOf: goldSemi2Id }, status: 'scheduled', date });
    }

    // Silver Bracket
    if (a3 && b4 && b3 && a4) {
        const silverSemi1Id = crypto.randomUUID();
        const silverSemi2Id = crypto.randomUUID();
        playoffs.push({ id: silverSemi1Id, round: 'Semi-Final', bracket: 'Silver', homeTeam: a3, awayTeam: b4, status: 'scheduled', date });
        playoffs.push({ id: silverSemi2Id, round: 'Semi-Final', bracket: 'Silver', homeTeam: b3, awayTeam: a4, status: 'scheduled', date });
        playoffs.push({ id: crypto.randomUUID(), round: 'Final', bracket: 'Silver', homeTeam: { winnerOf: silverSemi1Id }, awayTeam: { winnerOf: silverSemi2Id }, status: 'scheduled', date });
    }

    return playoffs;
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
        currentRound: 1,
    };
};