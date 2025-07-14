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

export const generatePlayoffBracket = (groups: NationalsGroup[], date: GameDate): NationalsPlayoffMatch[] => {
    if (groups.length < 2) return [];

    const sortedGroupA = sortStandings(groups[0].standings);
    const sortedGroupB = sortStandings(groups[1].standings);

    const getTeam = (group: NationalsStanding[], index: number) => group[index]?.teamName;

    const playoffs: NationalsPlayoffMatch[] = [];

    // Gold Bracket (Top 3 from each group)
    const a1 = getTeam(sortedGroupA, 0), a2 = getTeam(sortedGroupA, 1), a3 = getTeam(sortedGroupA, 2);
    const b1 = getTeam(sortedGroupB, 0), b2 = getTeam(sortedGroupB, 1), b3 = getTeam(sortedGroupB, 2);

    if (a1 && a2 && a3 && b1 && b2 && b3) {
        const qf1Id = crypto.randomUUID();
        const qf2Id = crypto.randomUUID();
        playoffs.push({ id: qf1Id, round: 'Quarter-Final', bracket: 'Gold', homeTeam: a2, awayTeam: b3, status: 'scheduled', date });
        playoffs.push({ id: qf2Id, round: 'Quarter-Final', bracket: 'Gold', homeTeam: b2, awayTeam: a3, status: 'scheduled', date });
        
        const sf1Id = crypto.randomUUID();
        const sf2Id = crypto.randomUUID();
        playoffs.push({ id: sf1Id, round: 'Semi-Final', bracket: 'Gold', homeTeam: a1, awayTeam: { winnerOf: qf2Id }, status: 'scheduled', date });
        playoffs.push({ id: sf2Id, round: 'Semi-Final', bracket: 'Gold', homeTeam: b1, awayTeam: { winnerOf: qf1Id }, status: 'scheduled', date });
        
        playoffs.push({ id: crypto.randomUUID(), round: 'Final', bracket: 'Gold', homeTeam: { winnerOf: sf1Id }, awayTeam: { winnerOf: sf2Id }, status: 'scheduled', date });
    } else if (a1 && a2 && b1 && b2) { // Fallback for smaller groups (Top 2)
        const sf1Id = crypto.randomUUID();
        const sf2Id = crypto.randomUUID();
        playoffs.push({ id: sf1Id, round: 'Semi-Final', bracket: 'Gold', homeTeam: a1, awayTeam: b2, status: 'scheduled', date });
        playoffs.push({ id: sf2Id, round: 'Semi-Final', bracket: 'Gold', homeTeam: b1, awayTeam: a2, status: 'scheduled', date });
        playoffs.push({ id: crypto.randomUUID(), round: 'Final', bracket: 'Gold', homeTeam: { winnerOf: sf1Id }, awayTeam: { winnerOf: sf2Id }, status: 'scheduled', date });
    }

    // Silver Bracket (Teams ranked 4th to 7th from each group)
    const a4 = getTeam(sortedGroupA, 3), a5 = getTeam(sortedGroupA, 4), a6 = getTeam(sortedGroupA, 5), a7 = getTeam(sortedGroupA, 6);
    const b4 = getTeam(sortedGroupB, 3), b5 = getTeam(sortedGroupB, 4), b6 = getTeam(sortedGroupB, 5), b7 = getTeam(sortedGroupB, 6);

    const silverTeams = [a4, a5, a6, a7, b4, b5, b6, b7].filter(t => !!t);

    if (silverTeams.length >= 4) {
        // This structure is based on the screenshot, assuming two parallel 4-team brackets for Silver semis
        // and the winners meet in a final. This is an interpretation of a slightly ambiguous diagram.
        const silver_sf1_id = crypto.randomUUID();
        const silver_sf2_id = crypto.randomUUID();
        
        if (a4 && b7 && a6 && b5) {
            playoffs.push({ id: silver_sf1_id, round: 'Semi-Final', bracket: 'Silver', homeTeam: a4, awayTeam: b7, status: 'scheduled', date });
            playoffs.push({ id: silver_sf2_id, round: 'Semi-Final', bracket: 'Silver', homeTeam: a6, awayTeam: b5, status: 'scheduled', date });
            playoffs.push({ id: crypto.randomUUID(), round: 'Final', bracket: 'Silver', homeTeam: { winnerOf: silver_sf1_id }, awayTeam: { winnerOf: silver_sf2_id }, status: 'scheduled', date });
        }
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