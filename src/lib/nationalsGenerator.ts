import { Team, NationalsGroup, NationalsTournament, ScheduleEntry, GameDate, NationalsStanding } from '@/types';
import { simulateFullGame } from './gameEngine';

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

const updateStandings = (
  standings: NationalsStanding[],
  homeTeamName: string,
  awayTeamName:string,
  homeScore: number,
  awayScore: number
): NationalsStanding[] => {
  const newStandings = [...standings];
  const homeTeamIndex = newStandings.findIndex(s => s.teamName === homeTeamName);
  const awayTeamIndex = newStandings.findIndex(s => s.teamName === awayTeamName);

  if (homeTeamIndex === -1 || awayTeamIndex === -1) return standings;

  const homeStanding = { ...newStandings[homeTeamIndex] };
  const awayStanding = { ...newStandings[awayTeamIndex] };

  homeStanding.played += 1;
  awayStanding.played += 1;
  homeStanding.goalsFor += homeScore;
  awayStanding.goalsFor += awayScore;
  homeStanding.goalsAgainst += awayScore;
  awayStanding.goalsAgainst += homeScore;

  if (homeScore > awayScore) {
    homeStanding.wins += 1;
    homeStanding.points += 3;
    awayStanding.losses += 1;
  } else if (awayScore > homeScore) {
    awayStanding.wins += 1;
    awayStanding.points += 3;
    homeStanding.losses += 1;
  } else {
    homeStanding.draws += 1;
    awayStanding.draws += 1;
    homeStanding.points += 1;
    awayStanding.points += 1;
  }

  newStandings[homeTeamIndex] = homeStanding;
  newStandings[awayTeamIndex] = awayStanding;

  return newStandings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const goalDiffA = a.goalsFor - a.goalsAgainst;
    const goalDiffB = b.goalsFor - b.goalsAgainst;
    if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });
};

export const simulateNationalsGroupStage = (
  tournament: NationalsTournament,
  allTeams: Team[]
): { updatedTournament: NationalsTournament; updatedTeams: Team[] } => {
  let tempTeams = JSON.parse(JSON.stringify(allTeams)) as Team[];
  const updatedTournament = JSON.parse(JSON.stringify(tournament)) as NationalsTournament;

  updatedTournament.status = 'group-stage';

  updatedTournament.groupStageSchedule.forEach(game => {
    if (game.status === 'scheduled') {
      const homeTeam = tempTeams.find(t => t.name === game.homeTeam);
      const awayTeam = tempTeams.find(t => t.name === game.awayTeam);

      if (homeTeam && awayTeam) {
        const finalGameState = simulateFullGame(homeTeam, awayTeam, true); // Nationals are always big games

        // Update standings
        updatedTournament.groups.forEach(group => {
          if (group.teams.includes(homeTeam.name) && group.teams.includes(awayTeam.name)) {
            group.standings = updateStandings(
              group.standings,
              homeTeam.name,
              awayTeam.name,
              finalGameState.userScore,
              finalGameState.opponentScore
            );
          }
        });

        // Mark game as completed
        game.status = 'completed';
        game.result = { homeScore: finalGameState.userScore, awayScore: finalGameState.opponentScore };

        // Apply injuries
        finalGameState.injuries.forEach(injury => {
          const teamToUpdate = tempTeams.find(t => t.name === injury.teamName);
          if (teamToUpdate) {
            const playerIndex = teamToUpdate.roster.findIndex(p => p.id === injury.playerId);
            if (playerIndex !== -1) {
              teamToUpdate.roster[playerIndex].injury = { type: injury.injuryType, duration: injury.duration };
              teamToUpdate.roster[playerIndex].healthStatus = 'Injured';
            }
          }
        });
      }
    }
  });

  const allGroupGamesCompleted = updatedTournament.groupStageSchedule.every(g => g.status === 'completed');
  if (allGroupGamesCompleted) {
    updatedTournament.status = 'playoffs';
  }

  return { updatedTournament, updatedTeams: tempTeams };
};