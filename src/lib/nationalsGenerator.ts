import { Team, NationalsGroup, NationalsTournament, NationalsGame, GameDate, NationalsPlayoffMatch, NationalsStanding } from '@/types';

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

export const generateGroupStageSchedule = (groups: NationalsGroup[], startDate: GameDate): NationalsGame[] => {
    const schedule: NationalsGame[] = [];
    
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
                        group: group.name,
                    });
                }
            }
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

    const totalTeams = groups.reduce((acc, group) => acc + group.teams.length, 0);
    const sortedGroupA = sortStandings(groups[0].standings);
    const sortedGroupB = sortStandings(groups[1].standings);

    const goldQualifiersA: string[] = [];
    const goldQualifiersB: string[] = [];
    
    const numGoldQualifiersPerGroup = totalTeams >= 13 ? 3 : 2;

    sortedGroupA.forEach((standing, i) => {
        if (i < numGoldQualifiersPerGroup) goldQualifiersA.push(standing.teamName);
    });
    sortedGroupB.forEach((standing, i) => {
        if (i < numGoldQualifiersPerGroup) goldQualifiersB.push(standing.teamName);
    });

    const playoffs: NationalsPlayoffMatch[] = [];

    if (goldQualifiersA.length >= 2 && goldQualifiersB.length >= 2) {
        if (totalTeams >= 13 && goldQualifiersA.length >= 3 && goldQualifiersB.length >= 3) {
            const [a1, a2, a3] = goldQualifiersA;
            const [b1, b2, b3] = goldQualifiersB;
            const qf1Id = crypto.randomUUID();
            const qf2Id = crypto.randomUUID();
            playoffs.push({ id: qf1Id, round: 'Quarter-Final', bracket: 'Gold', homeTeam: a2, awayTeam: b3, status: 'scheduled', date });
            playoffs.push({ id: qf2Id, round: 'Quarter-Final', bracket: 'Gold', homeTeam: b2, awayTeam: a3, status: 'scheduled', date });
            const sf1Id = crypto.randomUUID();
            const sf2Id = crypto.randomUUID();
            playoffs.push({ id: sf1Id, round: 'Semi-Final', bracket: 'Gold', homeTeam: a1, awayTeam: { winnerOf: qf2Id }, status: 'scheduled', date });
            playoffs.push({ id: sf2Id, round: 'Semi-Final', bracket: 'Gold', homeTeam: b1, awayTeam: { winnerOf: qf1Id }, status: 'scheduled', date });
            playoffs.push({ id: crypto.randomUUID(), round: 'Final', bracket: 'Gold', homeTeam: { winnerOf: sf1Id }, awayTeam: { winnerOf: sf2Id }, status: 'scheduled', date });
        } else {
            const [a1, a2] = goldQualifiersA;
            const [b1, b2] = goldQualifiersB;
            const sf1Id = crypto.randomUUID();
            const sf2Id = crypto.randomUUID();
            playoffs.push({ id: sf1Id, round: 'Semi-Final', bracket: 'Gold', homeTeam: a1, awayTeam: b2, status: 'scheduled', date });
            playoffs.push({ id: sf2Id, round: 'Semi-Final', bracket: 'Gold', homeTeam: b1, awayTeam: a2, status: 'scheduled', date });
            playoffs.push({ id: crypto.randomUUID(), round: 'Final', bracket: 'Gold', homeTeam: { winnerOf: sf1Id }, awayTeam: { winnerOf: sf2Id }, status: 'scheduled', date });
        }
    }

    const allSilverStandings = [
        ...groups[0].standings.filter(s => !goldQualifiersA.includes(s.teamName)),
        ...groups[1].standings.filter(s => !goldQualifiersB.includes(s.teamName))
    ];
    const sortedSilverStandings = sortStandings(allSilverStandings);
    let silverTeams: (string | { winnerOf: string })[] = sortedSilverStandings.map(s => s.teamName);

    if (silverTeams.length >= 2) {
        let currentContestants = silverTeams;
        while (currentContestants.length > 1) {
            const numTeamsInRound = currentContestants.length;
            const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(numTeamsInRound)));
            
            let roundName: 'Preliminary' | 'Quarter-Final' | 'Semi-Final' | 'Final' = 'Final';
            if (nextPowerOf2 > 8) roundName = 'Preliminary';
            else if (nextPowerOf2 === 8) roundName = 'Quarter-Final';
            else if (nextPowerOf2 === 4) roundName = 'Semi-Final';

            const numByes = nextPowerOf2 - numTeamsInRound;
            
            const teamsWithByes = currentContestants.slice(0, numByes);
            const teamsInMatches = currentContestants.slice(numByes);
            
            const roundMatches: NationalsPlayoffMatch[] = [];
            while (teamsInMatches.length > 0) {
                const home = teamsInMatches.shift()!;
                const away = teamsInMatches.pop()!;
                const matchId = crypto.randomUUID();
                roundMatches.push({ id: matchId, round: roundName, bracket: 'Silver', homeTeam: home, awayTeam: away, status: 'scheduled', date });
            }
            
            playoffs.push(...roundMatches);
            
            currentContestants = [...teamsWithByes, ...roundMatches.map(m => ({ winnerOf: m.id }))];
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