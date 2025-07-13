import { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Team, Player, BudgetAllocations, SkaterAttributes, GoalieAttributes, DevelopmentLog, TrainingFocus, GameState, FacilityProject, BudgetCategory, Financials, ScheduleEntry, GameDate, PlayerSeasonStats, RecordCategory, TeamRecord, NationalsPlayoffMatch } from '@/types';
import { teams as initialTeams, getTeamOrganizations, getOrganizationName } from '@/data/teams';
import { generateRecruits, generatePlayer } from '@/lib/playerGenerator';
import { toast } from 'sonner';
import { calculateCurrentAbility, calculateStarRating } from '@/lib/playerGenerator';
import { trainingFocusesMap } from '@/data/trainingFocuses';
import { skaterFocuses, goalieFocuses } from '@/data/trainingFocuses';
import { processGameResults as processGameResultsEngine } from '@/lib/statsEngine';
import { generateSeasonSchedule } from '@/lib/scheduleGenerator';
import { simulateFullGame } from '@/lib/gameEngine';
import { validateLineup } from '@/lib/lineupValidation';
import { createNationalsTournament, generatePlayoffBracket, advanceDate } from '@/lib/nationalsGenerator';
import { NationalsTournament } from '@/types';
import { isRivalryGame } from '@/lib/rivalries';

const months = ["August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June", "July"];
const moraleLevels: Player['morale'][] = ["Angry", "Unhappy", "Content", "Happy"];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const updateMorale = (currentMorale: Player['morale'], change: 1 | -1): Player['morale'] => {
    const currentIndex = moraleLevels.indexOf(currentMorale);
    const newIndex = Math.max(0, Math.min(moraleLevels.length - 1, currentIndex + change));
    return moraleLevels[newIndex];
};

interface TeamContextType {
    teams: Team[];
    updateTeam: (updatedTeam: Team) => void;
    userTeam: Team | null;
    organizationFinancials: Financials | null;
    organizationFacilities: FacilityProject[] | null;
    selectTeam: (teamName: string | null) => void;
    scoutingPool: Player[];
    recruitedPool: Player[];
    fairHosted: boolean;
    generateScoutingPool: () => void;
    recruitPlayer: (playerId: string) => void;
    assignPlayerToRoster: (playerId: string) => void;
    discardRecruit: (playerId: string) => void;
    updateBudgetAllocations: (newAllocations: BudgetAllocations) => void;
    runStudentLifeInitiative: () => void;
    startFacilityProject: (projectId: string) => void;
    currentDate: GameDate;
    advanceWeek: () => void;
    developmentHistory: DevelopmentLog[];
    updatePlayerTrainingFocus: (playerId: string, focus: TrainingFocus) => void;
    autoAssignTrainingFocuses: () => void;
    processGameResults: (userTeam: Team, opponentTeam: Team, gameState: GameState) => void;
    movePlayer: (playerId: string, fromTeamName: string, toTeamName: string) => void;
    requestPlayerTransfer: (playerId: string, fromTeamName: string, toTeamName: string) => void;
    managedOrganization: string | null;
    managedTeams: Team[];
    selectOrganization: (orgName: string | null) => void;
    setActiveTeam: (teamName: string) => void;
    schedule: ScheduleEntry[];
    gameForCurrentWeek: { id: string; opponent: string; date: GameDate; isNationals: boolean; homeTeam: string | { winnerOf: string }; awayTeam: string | { winnerOf: string }; } | null;
    nationalsData: { [year: number]: { [division: string]: NationalsTournament } };
    markGameAsCompleted: (gameId: string, homeScore: number, awayScore: number) => void;
    seasonRecords: { [key in RecordCategory]?: TeamRecord };
    careerRecords: { [key in RecordCategory]?: TeamRecord };
    alumni: Player[];
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider = ({ children }: { children: ReactNode }): JSX.Element => {
    const [teams, setTeams] = useState<Team[]>(() => {
        try {
            const savedTeams = localStorage.getItem('teams');
            if (savedTeams) {
                return JSON.parse(savedTeams);
            }
        } catch (error) {
            console.error("Failed to load teams from localStorage:", error);
        }
        localStorage.setItem('teams', JSON.stringify(initialTeams));
        return initialTeams;
    });

    useEffect(() => {
        localStorage.setItem('teams', JSON.stringify(teams));
    }, [teams]);

    const [alumni, setAlumni] = useState<Player[]>(() => {
        try {
            const saved = localStorage.getItem('alumni');
            return saved ? JSON.parse(saved) : [];
        } catch (error) { return []; }
    });

    useEffect(() => {
        localStorage.setItem('alumni', JSON.stringify(alumni));
    }, [alumni]);

    const [activeTeamName, setActiveTeamName] = useState<string | null>(() => localStorage.getItem('activeTeamName') || null);
    const [managedOrganization, setManagedOrganization] = useState<string | null>(() => localStorage.getItem('managedOrganization') || null);
    
    const [schedule, setSchedule] = useState<ScheduleEntry[]>(() => {
        try {
            const saved = localStorage.getItem('schedule');
            return saved ? JSON.parse(saved) : [];
        } catch (error) { return []; }
    });

    useEffect(() => {
        localStorage.setItem('schedule', JSON.stringify(schedule));
    }, [schedule]);

    const [nationalsData, setNationalsData] = useState<{ [year: number]: { [division: string]: NationalsTournament } }>(() => {
        try {
            const saved = localStorage.getItem('nationalsData');
            return saved ? JSON.parse(saved) : {};
        } catch (error) { return {}; }
    });

    useEffect(() => {
        localStorage.setItem('nationalsData', JSON.stringify(nationalsData));
    }, [nationalsData]);

    const [seasonRecords, setSeasonRecords] = useState<{ [key in RecordCategory]?: TeamRecord }>(() => {
        try { const saved = localStorage.getItem('seasonRecords'); return saved ? JSON.parse(saved) : {}; } catch (error) { return {}; }
    });
    const [careerRecords, setCareerRecords] = useState<{ [key in RecordCategory]?: TeamRecord }>(() => {
        try { const saved = localStorage.getItem('careerRecords'); return saved ? JSON.parse(saved) : {}; } catch (error) { return {}; }
    });

    useEffect(() => { localStorage.setItem('seasonRecords', JSON.stringify(seasonRecords)); }, [seasonRecords]);
    useEffect(() => { localStorage.setItem('careerRecords', JSON.stringify(careerRecords)); }, [careerRecords]);

    const managedTeams = useMemo(() => {
        if (!managedOrganization) return [];
        const organizations = getTeamOrganizations();
        const org = organizations.find(o => o.name === managedOrganization);
        if (!org) return [];
        const orgTeamNames = org.teams.map(t => t.name);
        return teams.filter(t => orgTeamNames.includes(t.name));
    }, [managedOrganization, teams]);

    const userTeam = useMemo(() => {
        if (!activeTeamName) return null;
        return teams.find(t => t.name === activeTeamName) || null;
    }, [activeTeamName, teams]);

    const organizationFinancials = useMemo(() => {
        if (!managedOrganization || managedTeams.length === 0) return null;
        return {
            totalBudget: managedTeams.reduce((sum, t) => sum + t.financials.totalBudget, 0),
            budgetAllocations: managedTeams.reduce((acc, t) => {
                (Object.keys(t.financials.budgetAllocations) as BudgetCategory[]).forEach(key => {
                    acc[key] = Math.round((acc[key] || 0) + t.financials.budgetAllocations[key]);
                });
                return acc;
            }, { Travel: 0, Equipment: 0, "Ice Time": 0, Recruiting: 0, "Student Life": 0, Facilities: 0 } as BudgetAllocations),
            iceTimeCostPerGame: managedTeams.reduce((sum, t) => sum + t.financials.iceTimeCostPerGame, 0),
            equipmentCost: managedTeams.reduce((sum, t) => sum + t.financials.equipmentCost, 0),
        };
    }, [managedOrganization, managedTeams]);

    const organizationFacilities = useMemo(() => {
        if (!managedOrganization || managedTeams.length === 0) return null;
        const uniqueFacilities = managedTeams.reduce((acc, team) => {
            team.facilities.forEach(project => {
                if (!acc.some(p => p.id === project.id)) {
                    acc.push({ ...project });
                }
            });
            return acc;
        }, [] as FacilityProject[]);

        return uniqueFacilities.map(project => {
            const allVersions = managedTeams.flatMap(t => t.facilities).filter(p => p.id === project.id);
            const completed = allVersions.find(p => p.status === 'Completed');
            const inProgress = allVersions.find(p => p.status === 'In Progress');
            
            const newStatus = (completed?.status || inProgress?.status || 'Not Started') as 'Not Started' | 'In Progress' | 'Completed';
            return { ...project, status: newStatus };
        });
    }, [managedOrganization, managedTeams]);

    const selectTeam = (teamName: string | null) => {
        if (teamName) {
            const team = teams.find(t => t.name === teamName);
            if (team) {
                const orgName = getOrganizationName(team.name);
                localStorage.setItem('activeTeamName', teamName);
                localStorage.setItem('managedOrganization', orgName); // Set managedOrganization even for single teams
                setActiveTeamName(teamName);
                setManagedOrganization(orgName);
            }
        } else {
            localStorage.removeItem('activeTeamName');
            localStorage.removeItem('managedOrganization');
            setActiveTeamName(null);
            setManagedOrganization(null);
        }
    };

    const selectOrganization = (orgName: string | null) => {
        if (orgName) {
            const organizations = getTeamOrganizations();
            const org = organizations.find(o => o.name === orgName);
            if (org && org.teams.length > 0) {
                const mainTeam = org.teams[0];
                localStorage.setItem('managedOrganization', orgName);
                localStorage.setItem('activeTeamName', mainTeam.name);
                setManagedOrganization(orgName);
                setActiveTeamName(mainTeam.name);
            }
        } else {
            localStorage.removeItem('managedOrganization');
            localStorage.removeItem('activeTeamName');
            setManagedOrganization(null);
            setActiveTeamName(null);
        }
    };

    const setActiveTeam = (teamName: string) => {
        const teamExistsInOrg = managedTeams.some(t => t.name === teamName);
        if (managedOrganization && teamExistsInOrg) {
            localStorage.setItem('activeTeamName', teamName);
            setActiveTeamName(teamName);
        }
    };

    const [scoutingPool, setScoutingPool] = useState<Player[]>(() => {
        try {
            const saved = localStorage.getItem('scoutingPool');
            return saved ? JSON.parse(saved) : [];
        } catch (error) { return []; }
    });

    const [recruitedPool, setRecruitedPool] = useState<Player[]>(() => {
        try {
            const saved = localStorage.getItem('recruitedPool');
            return saved ? JSON.parse(saved) : [];
        } catch (error) { return []; }
    });

    const [fairHosted, setFairHosted] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem('fairHosted');
            return saved ? JSON.parse(saved) : false;
        } catch (error) { return false; }
    });

    const [currentDate, setCurrentDate] = useState<GameDate>(() => {
        try {
            const saved = localStorage.getItem('currentDate');
            return saved ? JSON.parse(saved) : { month: 'August', week: 1, year: new Date().getFullYear() };
        } catch (error) { return { month: 'August', week: 1, year: new Date().getFullYear() }; }
    });

    const [developmentHistory, setDevelopmentHistory] = useState<DevelopmentLog[]>(() => {
        try {
            const saved = localStorage.getItem('developmentHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (error) { return []; }
    });

    useEffect(() => { localStorage.setItem('scoutingPool', JSON.stringify(scoutingPool)); }, [scoutingPool]);
    useEffect(() => { localStorage.setItem('recruitedPool', JSON.stringify(recruitedPool)); }, [recruitedPool]);
    useEffect(() => { localStorage.setItem('fairHosted', JSON.stringify(fairHosted)); }, [fairHosted]);
    useEffect(() => { localStorage.setItem('currentDate', JSON.stringify(currentDate)); }, [currentDate]);
    useEffect(() => { localStorage.setItem('developmentHistory', JSON.stringify(developmentHistory)); }, [developmentHistory]);
    useEffect(() => {
        if (managedOrganization) {
            localStorage.setItem('managedOrganization', managedOrganization);
        } else {
            localStorage.removeItem('managedOrganization');
        }
    }, [managedOrganization]);

    const gameForCurrentWeek = useMemo(() => {
        if (!userTeam) return null;

        // Check for regular season game
        const regularGame = schedule.find(game =>
            (game.homeTeam === userTeam.name || game.awayTeam === userTeam.name) &&
            game.date.month === currentDate.month &&
            game.date.week === currentDate.week &&
            game.status === 'scheduled'
        );

        if (regularGame) {
            const opponent = regularGame.homeTeam === userTeam.name ? regularGame.awayTeam : regularGame.homeTeam;
            return { ...regularGame, opponent, isNationals: false };
        }

        // Check for Nationals game
        const currentYearNationals = nationalsData[currentDate.year];
        if (currentYearNationals) {
            for (const division in currentYearNationals) {
                const tournament = currentYearNationals[division];
                const nationalsGame = [...tournament.groupStageSchedule, ...tournament.playoffSchedule].find(game =>
                    ((typeof game.homeTeam === 'string' && game.homeTeam === userTeam.name) || (typeof game.awayTeam === 'string' && game.awayTeam === userTeam.name)) &&
                    game.date.month === currentDate.month &&
                    game.date.week === currentDate.week &&
                    game.status === 'scheduled'
                );

                if (nationalsGame) {
                    let opponentName: string;
                    if (typeof nationalsGame.homeTeam === 'string' && typeof nationalsGame.awayTeam === 'string') {
                        opponentName = nationalsGame.homeTeam === userTeam.name ? nationalsGame.awayTeam : nationalsGame.homeTeam;
                    } else if (typeof nationalsGame.homeTeam === 'object' && nationalsGame.homeTeam.winnerOf) {
                        opponentName = "TBD"; // Or some other placeholder for playoff matches
                    } else if (typeof nationalsGame.awayTeam === 'object' && nationalsGame.awayTeam.winnerOf) {
                        opponentName = "TBD"; // Or some other placeholder for playoff matches
                    } else {
                        opponentName = "Unknown Opponent"; // Fallback
                    }
                    return { ...nationalsGame, opponent: opponentName, isNationals: true };
                }
            }
        }

        return null;
    }, [userTeam, schedule, nationalsData, currentDate]);

    const updateTeam = (updatedTeam: Team) => {
        setTeams(currentTeams =>
            currentTeams.map(t => (t.name === updatedTeam.name ? updatedTeam : t))
        );
    };

    const advanceWeek = () => {
        if (gameForCurrentWeek && userTeam) {
            const validationError = validateLineup(userTeam);
            if (validationError) {
                toast.error("Cannot Advance Week", {
                    description: `Your lineup is invalid: ${validationError}`,
                });
                return;
            }
        }

        let tempTeams = JSON.parse(JSON.stringify(teams)) as Team[];
        let tempSchedule = JSON.parse(JSON.stringify(schedule)) as ScheduleEntry[];
        let newDevelopmentLogs: DevelopmentLog[] = [];
        const managedTeamNames = managedTeams.map(t => t.name);

        let tempNationalsData = JSON.parse(JSON.stringify(nationalsData)) as typeof nationalsData;
        let tempSeasonRecords = JSON.parse(JSON.stringify(seasonRecords));
        let tempCareerRecords = JSON.parse(JSON.stringify(careerRecords));

        const currentYear = currentDate.year;

        const updateGameRecords = (homeTeam: Team, awayTeam: Team) => {
            const allPlayers = [...homeTeam.roster, ...awayTeam.roster];
            const teamsMap = { [homeTeam.name]: homeTeam, [awayTeam.name]: awayTeam };
        
            allPlayers.forEach(player => {
                const lastStat = player.stats[player.stats.length - 1];
                const team = teamsMap[lastStat?.team || homeTeam.name];
                if (!team) return;

                const isSkater = !player.positions.includes('G');
                const season = `${currentDate.year}-${currentDate.year + 1}`;
        
                if (isSkater) {
                    const stats = lastStat;
                    if ((stats.goals || 0) > (tempSeasonRecords['Goals']?.value || 0)) tempSeasonRecords['Goals'] = { playerName: player.name, teamName: team.name, value: stats.goals, season };
                    if ((stats.assists || 0) > (tempSeasonRecords['Assists']?.value || 0)) tempSeasonRecords['Assists'] = { playerName: player.name, teamName: team.name, value: stats.assists, season };
                    if ((stats.points || 0) > (tempSeasonRecords['Points']?.value || 0)) tempSeasonRecords['Points'] = { playerName: player.name, teamName: team.name, value: stats.points, season };
                    if ((stats.penaltyMinutes || 0) > (tempSeasonRecords['PenaltyMinutes']?.value || 0)) tempSeasonRecords['PenaltyMinutes'] = { playerName: player.name, teamName: team.name, value: stats.penaltyMinutes, season };
                    
                    const careerGoals = player.stats.reduce((acc, s) => acc + (s.goals || 0), 0);
                    if (careerGoals > (tempCareerRecords['Goals']?.value || 0)) tempCareerRecords['Goals'] = { playerName: player.name, teamName: team.name, value: careerGoals };
                    const careerAssists = player.stats.reduce((acc, s) => acc + (s.assists || 0), 0);
                    if (careerAssists > (tempCareerRecords['Assists']?.value || 0)) tempCareerRecords['Assists'] = { playerName: player.name, teamName: team.name, value: careerAssists };
                    const careerPoints = player.stats.reduce((acc, s) => acc + (s.points || 0), 0);
                    if (careerPoints > (tempCareerRecords['Points']?.value || 0)) tempCareerRecords['Points'] = { playerName: player.name, teamName: team.name, value: careerPoints };
                    const careerPims = player.stats.reduce((acc, s) => acc + (s.penaltyMinutes || 0), 0);
                    if (careerPims > (tempCareerRecords['PenaltyMinutes']?.value || 0)) tempCareerRecords['PenaltyMinutes'] = { playerName: player.name, teamName: team.name, value: careerPims };

                } else { // Goalie
                    const stats = lastStat;
                    if (stats.gamesPlayed >= 5) { // Goalie eligibility for in-season records
                        if (!tempSeasonRecords['GAA'] || (stats.goalsAgainstAverage < tempSeasonRecords['GAA'].value)) tempSeasonRecords['GAA'] = { playerName: player.name, teamName: team.name, value: stats.goalsAgainstAverage, season };
                        if (stats.savePercentage > (tempSeasonRecords['SavePercentage']?.value || 0)) tempSeasonRecords['SavePercentage'] = { playerName: player.name, teamName: team.name, value: stats.savePercentage, season };
                    }
                    if ((stats.shutouts || 0) > (tempSeasonRecords['Shutouts']?.value || 0)) tempSeasonRecords['Shutouts'] = { playerName: player.name, teamName: team.name, value: stats.shutouts, season };
                    
                    const careerShutouts = player.stats.reduce((acc, s) => acc + (s.shutouts || 0), 0);
                    if (careerShutouts > (tempCareerRecords['Shutouts']?.value || 0)) tempCareerRecords['Shutouts'] = { playerName: player.name, teamName: team.name, value: careerShutouts };
                }
            });
        };

        if (tempNationalsData[currentYear] && (currentDate.month === 'May' || currentDate.month === 'June' || currentDate.month === 'July')) {
            const tournamentsThisYear = tempNationalsData[currentYear];
            for (const division in tournamentsThisYear) {
                const tournament = tournamentsThisYear[division];
                if (tournament.status === 'completed') continue;

                const gamesThisWeek = [...tournament.groupStageSchedule, ...tournament.playoffSchedule].filter(game =>
                    game.date.month === currentDate.month && game.date.week === currentDate.week && game.status === 'scheduled'
                );

                if (gamesThisWeek.length > 0) {
                    gamesThisWeek.forEach(game => {
                        // Resolve playoff TBD teams
                        let actualHomeTeamName: string | null = null;
                        let actualAwayTeamName: string | null = null;

                        if ('round' in game) { // It's a playoff match
                            if (typeof game.homeTeam === 'object' && game.homeTeam.winnerOf) {
                                const prevMatch = tournament.playoffSchedule.find(m => m.id === game.homeTeam.winnerOf);
                                actualHomeTeamName = prevMatch?.winner || null;
                            } else if (typeof game.homeTeam === 'string') {
                                actualHomeTeamName = game.homeTeam;
                            }

                            if (typeof game.awayTeam === 'object' && game.awayTeam.winnerOf) {
                                const prevMatch = tournament.playoffSchedule.find(m => m.id === game.awayTeam.winnerOf);
                                actualAwayTeamName = prevMatch?.winner || null;
                            } else if (typeof game.awayTeam === 'string') {
                                actualAwayTeamName = game.awayTeam;
                            }
                        } else { // It's a group stage match (ScheduleEntry)
                            actualHomeTeamName = game.homeTeam;
                            actualAwayTeamName = game.awayTeam;
                        }

                        if (!actualHomeTeamName || !actualAwayTeamName) {
                            // Cannot simulate if teams are TBD and not resolved
                            return;
                        }

                        const homeTeamIndex = tempTeams.findIndex(t => t.name === actualHomeTeamName);
                        const awayTeamIndex = tempTeams.findIndex(t => t.name === actualAwayTeamName);
                        if (homeTeamIndex === -1 || awayTeamIndex === -1) return;

                        const homeTeam = tempTeams[homeTeamIndex];
                        const awayTeam = tempTeams[awayTeamIndex];
                        const finalGameState = simulateFullGame(homeTeam, awayTeam, true);

                        const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, true);
                        tempTeams[homeTeamIndex] = updatedHomeTeam;
                        tempTeams[awayTeamIndex] = updatedAwayTeam;

                        // Update game status and result in the correct schedule (group or playoff)
                        let gameInTournament: ScheduleEntry | NationalsPlayoffMatch | undefined;
                        if ('round' in game) { // It's a playoff match
                            gameInTournament = tournament.playoffSchedule.find(g => g.id === game.id);
                        } else { // It's a group stage match
                            gameInTournament = tournament.groupStageSchedule.find(g => g.id === game.id);
                        }
                        
                        if (gameInTournament) {
                            gameInTournament.status = 'completed';
                            gameInTournament.result = { homeScore: finalGameState.userScore, awayScore: finalGameState.opponentScore };
                            if ('winner' in gameInTournament) { // For playoff matches, set winner
                                gameInTournament.winner = finalGameState.userScore > finalGameState.opponentScore ? actualHomeTeamName : actualAwayTeamName;
                            }
                        }

                        // Update Nationals group standings if it's a group stage game
                        if (!('round' in game)) { // Only for group stage games
                            tournament.groups.forEach(group => {
                                const homeStanding = group.standings.find(s => s.teamName === actualHomeTeamName);
                                const awayStanding = group.standings.find(s => s.teamName === actualAwayTeamName);
                                if (homeStanding) {
                                    homeStanding.played++; homeStanding.goalsFor += finalGameState.userScore; homeStanding.goalsAgainst += finalGameState.opponentScore;
                                    if (finalGameState.userScore > finalGameState.opponentScore) { homeStanding.wins++; homeStanding.points += 3; }
                                    else if (finalGameState.userScore < finalGameState.opponentScore) { homeStanding.losses++; }
                                    else { homeStanding.draws++; homeStanding.points += 1; }
                                }
                                if (awayStanding) {
                                    awayStanding.played++; awayStanding.goalsFor += finalGameState.opponentScore; awayStanding.goalsAgainst += finalGameState.userScore;
                                    if (finalGameState.opponentScore > finalGameState.userScore) { awayStanding.wins++; awayStanding.points += 3; }
                                    else if (finalGameState.opponentScore < finalGameState.userScore) { awayStanding.losses++; }
                                    else { awayStanding.draws++; awayStanding.points += 1; }
                                }
                            });
                        }

                        if (actualHomeTeamName === userTeam?.name || actualAwayTeamName === userTeam?.name) {
                            toast.info("Nationals Game Result", { description: `${actualHomeTeamName} ${finalGameState.userScore} - ${actualAwayTeamName} ${finalGameState.opponentScore}` });
                        }
                    });
                }

                // Check if group stage is completed and generate playoffs
                const allGroupGamesPlayed = tournament.groupStageSchedule.every(g => g.status === 'completed');
                if (allGroupGamesPlayed && tournament.status === 'group-stage') {
                    toast.success(`Group stage for ${division} has concluded!`, { description: "Playoff matchups will now be generated." });
                    const lastGameDate = tournament.groupStageSchedule[tournament.groupStageSchedule.length - 1]?.date || currentDate;
                    const playoffDate = advanceDate(lastGameDate);
                    tournament.playoffSchedule = generatePlayoffBracket(tournament.groups, playoffDate);
                    tournament.status = 'playoffs';
                    if (tournament.playoffSchedule.length === 0) tournament.status = 'completed';
                }
                // Check if playoffs are completed
                const allPlayoffGamesPlayed = tournament.playoffSchedule.every(g => g.status === 'completed');
                if (allPlayoffGamesPlayed && tournament.status === 'playoffs') {
                    const finalMatch = tournament.playoffSchedule.find(m => m.round === 'Final' && m.bracket === 'Gold');
                    if (finalMatch?.winner) {
                        tournament.winner = finalMatch.winner;
                        toast.success(`Nationals ${division} Champion: ${finalMatch.winner}!`);
                    }
                    tournament.status = 'completed';
                }
            }
        } else {
            const gamesThisWeek = tempSchedule.filter(game =>
                game.date.month === currentDate.month && game.date.week === currentDate.week && game.status === 'scheduled'
            );

            if (gamesThisWeek.length > 0) {
                gamesThisWeek.forEach(game => {
                    if (schedule.find(s => s.id === game.id)?.status === 'completed') return;

                    const homeTeamIndex = tempTeams.findIndex(t => t.name === game.homeTeam);
                    const awayTeamIndex = tempTeams.findIndex(t => t.name === game.awayTeam);
                    if (homeTeamIndex === -1 || awayTeamIndex === -1) return;

                    const homeTeam = tempTeams[homeTeamIndex];
                    const awayTeam = tempTeams[awayTeamIndex];
                    const isBigGame = isRivalryGame(homeTeam.name, awayTeam.name);

                    if (isBigGame && (homeTeam.name === userTeam?.name || awayTeam.name === userTeam?.name)) {
                        toast.info("It's a Rivalry Game!", { description: `The atmosphere is electric for ${homeTeam.name} vs ${awayTeam.name}. Players' performance may be affected by the pressure!` });
                    }

                    const finalGameState = simulateFullGame(homeTeam, awayTeam, isBigGame);

                    if (userTeam) {
                        finalGameState.injuries.forEach(injury => {
                            if (injury.teamName === userTeam.name) {
                                const injuredPlayer = userTeam.roster.find(p => p.id === injury.playerId);
                                if (injuredPlayer) {
                                    toast.warning("Player Injured!", { description: `${injuredPlayer.name} was injured during the game. (${injury.injuryType}, out for ${injury.duration} weeks)` });
                                }
                            }
                        });
                    }

                    const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, false);
                    tempTeams[homeTeamIndex] = updatedHomeTeam;
                    tempTeams[awayTeamIndex] = updatedAwayTeam;
                    updateGameRecords(updatedHomeTeam, updatedAwayTeam);

                    const scheduleGameIndex = tempSchedule.findIndex(g => g.id === game.id);
                    if (scheduleGameIndex !== -1) {
                        tempSchedule[scheduleGameIndex].status = 'completed';
                        tempSchedule[scheduleGameIndex].result = { homeScore: finalGameState.userScore, awayScore: finalGameState.opponentScore };
                    }
                    
                    if (game.homeTeam === userTeam?.name || game.awayTeam === userTeam?.name) {
                        toast.info("Game Auto-Simulated", { description: `${homeTeam.name} ${finalGameState.userScore} - ${awayTeam.name} ${finalGameState.opponentScore}` });
                    }
                });
            }
        }

        tempTeams = tempTeams.map(team => {
            let newRoster = [...team.roster];
            let newFacilities = [...team.facilities];
            const isUserManagedTeam = team.name === userTeam?.name || managedTeamNames.includes(team.name);

            newRoster = newRoster.map(player => {
                let playerChanged = false;
                const isSkater = !player.positions.includes('G');

                if (player.injury && player.injury.duration > 0) {
                    const hasPhysio = team.facilities.some(f => f.id === 'physio_office_1' && f.status === 'Completed');
                    player.injury.duration -= (hasPhysio ? 2 : 1);

                    const regression = (Math.random() * 0.1) + 0.02; // Defined here
                    if (Math.random() < regression) {
                        let attrsToRegress: (keyof SkaterAttributes | keyof GoalieAttributes)[] = isSkater
                            ? ['speed', 'acceleration', 'agility', 'balance', 'stamina', 'strength']
                            : ['skating', 'goaltenderStamina', 'reflexes', 'recovery'];
                        
                        const attrToRegress = getRandomItem(attrsToRegress);
                        const currentAttrValue = player.attributes[attrToRegress as keyof typeof player.attributes] as number;
                        
                        if (currentAttrValue > 1) {
                            const newAttrValue = Math.max(1, currentAttrValue - regression);
                            (player.attributes[attrToRegress as keyof typeof player.attributes] as number) = newAttrValue;
                            playerChanged = true;
                            if (isUserManagedTeam) {
                                newDevelopmentLogs.push({ playerId: player.id, playerName: player.name, attribute: attrToRegress.toString(), change: -regression, newRating: newAttrValue, date: currentDate });
                            }
                        }
                    }

                    if (player.injury.duration <= 0) {
                        if (team.name === userTeam?.name) toast.success("Player Recovered", { description: `${player.name} has recovered from their injury.` });
                        player.injury = null;
                        player.healthStatus = 'Healthy';
                    }
                } else {
                    // Development for healthy players
                    const paGap = player.potentialAbility - player.currentAbility;
                    if (player.age < 33 && paGap > 0 && player.morale !== 'Angry') {
                        const devRate = (player.attributes as SkaterAttributes | GoalieAttributes).developmentRate || 10;
                        const professionalism = (player.attributes as SkaterAttributes | GoalieAttributes).professionalism || 10;
                        const determination = (player.attributes as SkaterAttributes | GoalieAttributes).determination || 10;
                        const coachability = (player.attributes as SkaterAttributes | GoalieAttributes).coachability || 10;
                        const baseDevChance = 0.2;
                        const paBonus = Math.max(0, paGap / 50);
                        const workEthicBonus = (professionalism + determination - 20) / 100;
                        const coachabilityBonus = (coachability - 10) / 100;
                        const devChance = baseDevChance + paBonus + workEthicBonus + coachabilityBonus;
                        if (Math.random() < devChance) {
                            let attributesToDevelop: (keyof SkaterAttributes | keyof GoalieAttributes)[] = [];
                            if (player.trainingFocus && trainingFocusesMap[player.trainingFocus]) {
                                attributesToDevelop = trainingFocusesMap[player.trainingFocus];
                            } else {
                                const allAttrs = Object.keys(player.attributes).filter(attr => !['aging', 'injuryProneness', 'passShootTendency', 'mood', 'controversy', 'greed', 'loyalty', 'handleCritics', 'handleFailure', 'handleSuccess', 'sportsmanship', 'ambition', 'bigGames', 'coachability', 'intelligence'].includes(attr)) as (keyof typeof player.attributes)[];
                                if (allAttrs.length > 0) attributesToDevelop.push(getRandomItem(allAttrs));
                            }
                            if (attributesToDevelop.length > 0) {
                                const attrToImprove = getRandomItem(attributesToDevelop);
                                const currentAttrValue = player.attributes[attrToImprove as keyof typeof player.attributes] as number;
                                if (currentAttrValue < 20) {
                                    let moraleModifier = 1.0;
                                    if (player.morale === 'Happy') moraleModifier = 1.2;
                                    else if (player.morale === 'Unhappy') moraleModifier = 0.5;
                                    const improvement = ((Math.random() * 0.2) + (devRate / 100)) * moraleModifier;
                                    const newAttrValue = Math.min(20, currentAttrValue + improvement);
                                    (player.attributes[attrToImprove as keyof typeof player.attributes] as number) = newAttrValue;
                                    playerChanged = true;
                                    if (isUserManagedTeam) newDevelopmentLogs.push({ playerId: player.id, playerName: player.name, attribute: attrToImprove.toString(), change: improvement, newRating: newAttrValue, date: currentDate });
                                }
                            }
                        }
                    }
                    // Age-related decline
                    if (player.age > 28) {
                        const baseDeclineChance = 0.05;
                        const agePenalty = (player.age - 28) / 80;
                        const declineChance = baseDeclineChance + agePenalty;
                        if (Math.random() < declineChance) {
                            let attrsToDecline: (keyof SkaterAttributes | keyof GoalieAttributes)[] = isSkater
                                ? ['acceleration', 'agility', 'balance', 'speed', 'stamina', 'strength']
                                : ['skating', 'goaltenderStamina', 'reflexes', 'recovery'];
                            const attrToDecline = getRandomItem(attrsToDecline);
                            const currentAttrValue = player.attributes[attrToDecline as keyof typeof player.attributes] as number;
                            if (currentAttrValue > 1) {
                                const decline = (Math.random() * 0.15) + 0.05;
                                const newAttrValue = Math.max(1, currentAttrValue - decline);
                                (player.attributes[attrToDecline as keyof typeof player.attributes] as number) = newAttrValue;
                                playerChanged = true;
                                if (isUserManagedTeam) newDevelopmentLogs.push({ playerId: player.id, playerName: player.name, attribute: attrToDecline.toString(), change: -decline, newRating: newAttrValue, date: currentDate });
                            }
                        }
                    }
                }

                if (playerChanged) {
                    const newCurrentAbility = calculateCurrentAbility(player.attributes, isSkater);
                    const newStarRating = calculateStarRating(newCurrentAbility, isSkater, team.leagueDivision);
                    player.currentAbility = newCurrentAbility;
                    player.starRating = newStarRating;
                }

                return player;
            });

            newFacilities = newFacilities.map(project => {
                if (project.status === 'In Progress' && project.weeksToComplete) {
                    project.weeksToComplete -= 1;
                    if (project.weeksToComplete <= 0) {
                        project.status = 'Completed';
                        if (team.name === userTeam?.name) toast.info("Facility Project Completed", { description: `${project.name} is now complete.` });
                        if (project.id === 'locker_room_1') {
                            newRoster = newRoster.map(p => ({ ...p, morale: updateMorale(p.morale, 1) }));
                            if (team.name === userTeam?.name) toast.success("Morale Boost!", { description: "The new locker room has boosted team morale." });
                        }
                    }
                }
                return project;
            });

            newRoster = newRoster.map(player => {
                if (Math.random() < 0.1) {
                    if (player.morale === 'Happy') return { ...player, morale: 'Content' as 'Content' };
                    if (player.morale === 'Unhappy') return { ...player, morale: 'Content' as 'Content' };
                }
                if (isUserManagedTeam) {
                    const controversyChance = ((player.attributes.controversy || 10) - 10) / 200;
                    if (Math.random() < controversyChance) {
                        toast.warning("Team Controversy!", { description: `${player.name} has caused a stir with off-ice antics, slightly affecting team morale.` });
                        newRoster = newRoster.map(p => ({ ...p, morale: updateMorale(p.morale, -1) }));
                    }
                    const sportsmanship = (player.attributes.sportsmanship || 10);
                    const controversy = (player.attributes.controversy || 10);
                    const positiveEventChance = ((sportsmanship - 1) / 200) + ((20 - controversy) / 200);
                    if (Math.random() < positiveEventChance) {
                        const positiveDescriptions = [ `${player.name} organized a successful team-building event, boosting team cohesion and morale.`, `${player.name} was recognized for their outstanding sportsmanship, setting a positive example for the team.`, `${player.name}'s positive attitude and professionalism are rubbing off on the team, improving overall morale.`, `${player.name} resolved a minor locker room dispute, fostering a more harmonious team environment.`, `${player.name} led a community initiative, bringing positive attention and good vibes to the team.` ];
                        toast.success("Team Harmony!", { description: getRandomItem(positiveDescriptions) });
                        newRoster = newRoster.map(p => ({ ...p, morale: updateMorale(p.morale, 1) }));
                    }
                }
                return player;
            });

            return { ...team, roster: newRoster, facilities: newFacilities };
        });

        const newDate = ((prevDate) => {
            let { month, week, year } = prevDate;
            
            week += 1;

            if (week > 4) {
                week = 1;
                const monthIndex = months.indexOf(month);
                let nextMonthIndex = (monthIndex + 1) % months.length;
                month = months[nextMonthIndex];
                if (month === 'August') {
                    year += 1;
                }
            }
            return { year, month, week };
        })(currentDate);

        if (newDevelopmentLogs.length > 0) setDevelopmentHistory(prev => [...newDevelopmentLogs, ...prev].slice(0, 200));
        if (newDate.month === 'August' && newDate.week === 2 && !(currentDate.month === 'August' && currentDate.week === 2)) {
            tempSchedule = generateSeasonSchedule(tempTeams, newDate);
            toast.success(`New season schedule generated for ${newDate.year}-${newDate.year + 1}!`);
        }

        if (newDate.month === 'May' && newDate.week === 1 && !(currentDate.month === 'May' && currentDate.week === 1)) {
            toast.info("Nationals Draws Being Made", { description: "Groups for the BUIHA National Championships are being generated." });
            const allNationalsDivisions = [...new Set(tempTeams.map(t => t.nationalsDivision))];
            const newNationalsDataForYear: { [division: string]: NationalsTournament } = {};
            allNationalsDivisions.forEach(division => {
                const teamsInDivision = tempTeams.filter(t => t.nationalsDivision === division);
                if (teamsInDivision.length >= 2) {
                    const tournament = createNationalsTournament(division, teamsInDivision, newDate.year, newDate.week);
                    newNationalsDataForYear[division] = tournament;
                }
            });
            tempNationalsData[newDate.year] = newNationalsDataForYear;
        }
        
        setNationalsData(tempNationalsData);
        setTeams(tempTeams);
        setSchedule(tempSchedule);
        setCurrentDate(newDate);
        setSeasonRecords(tempSeasonRecords);
        setCareerRecords(tempCareerRecords);
    };

    const movePlayer = (playerId: string, fromTeamName: string, toTeamName: string) => {
        setTeams(currentTeams => {
            const fromTeam = currentTeams.find(t => t.name === fromTeamName);
            const toTeam = currentTeams.find(t => t.name === toTeamName);
            const player = fromTeam?.roster.find(p => p.id === playerId);

            if (!fromTeam || !toTeam || !player) {
                toast.error("Could not move player. Team or player not found.");
                return currentTeams;
            }

            const newFromRoster = fromTeam.roster.filter(p => p.id !== playerId);

            const toTeamJerseyNumbers = new Set(toTeam.roster.map(p => p.jerseyNumber));
            if (toTeamJerseyNumbers.has(player.jerseyNumber)) {
                let newJerseyNumber = 1;
                while (toTeamJerseyNumbers.has(newJerseyNumber)) { newJerseyNumber++; }
                toast.warning(`${player.name}'s jersey #${player.jerseyNumber} was taken.`, {
                    description: `They have been assigned #${newJerseyNumber}.`
                });
                player.jerseyNumber = newJerseyNumber;
            }
            
            const isSkater = player.positions[0] !== 'G';
            const updatedPlayer = {
                ...player,
                starRating: calculateStarRating(player.currentAbility, isSkater, toTeam.leagueDivision)
            };

            const newToRoster = [...toTeam.roster, updatedPlayer].sort((a, b) => a.jerseyNumber - b.jerseyNumber);

            const updatedFromTeam = { ...fromTeam, roster: newFromRoster };
            const updatedToTeam = { ...toTeam, roster: newToRoster };

            return currentTeams.map(t => {
                if (t.name === fromTeamName) return updatedFromTeam;
                if (t.name === toTeamName) return updatedToTeam;
                return t;
            });
        });
    };

    const requestPlayerTransfer = (playerId: string, fromTeamName: string, toTeamName: string) => {
        const fromTeam = teams.find(t => t.name === fromTeamName);
        const toTeam = teams.find(t => t.name === toTeamName);
        const player = fromTeam?.roster.find(p => p.id === playerId);

        if (!fromTeam || !toTeam || !player) {
                toast.error("Could not request player. Team or player not found.");
                return;
            }

        const isInternalTransfer = managedOrganization &&
            managedTeams.some(t => t.name === fromTeamName) &&
            managedTeams.some(t => t.name === toTeamName);

        if (isInternalTransfer) {
            movePlayer(playerId, fromTeamName, toTeamName);
            toast.success(`${player.name} moved to ${toTeamName}.`);
            return;
        }

        const baseSuccessChance = 0.3;
        const loyaltyModifier = (player.attributes.loyalty - 10) / 25; // +/- 40%
        const ambitionModifier = (player.attributes.ambition - 10) / 25; // +/- 40%
        
        const successChance = baseSuccessChance - loyaltyModifier + ambitionModifier;

        if (Math.random() < successChance) {
            toast.success("Transfer Approved!", {
                description: `${player.name} has agreed to the move and their coach has approved the transfer.`
            });
            movePlayer(playerId, fromTeamName, toTeamName);
        } else {
            const reasonRoll = Math.random();
            let reasonText: string;
            if (reasonRoll < 0.4) reasonText = `The manager of ${fromTeamName} has blocked the transfer, wanting to keep the player.`;
            else if (reasonRoll < 0.8) reasonText = `${player.name} has declined the offer to move to ${toTeamName}, citing loyalty to their current team.`;
            else reasonText = `${player.name} is happy where they are and does not wish to move at this time.`;
            toast.error("Transfer Denied", { description: reasonText });
        }
    };

    const processGameResults = (userTeam: Team, opponentTeam: Team, gameState: GameState) => {
        const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(userTeam, opponentTeam, gameState);
        updateTeam(updatedHomeTeam);
        updateTeam(updatedAwayTeam);
    };

    const runStudentLifeInitiative = () => {
        if (!userTeam) return;
        const cost = 500;
        const budgetCategory = "Student Life";
        const currentBudget = userTeam.financials.budgetAllocations[budgetCategory];

        if (currentBudget < cost) {
            toast.error("Insufficient Student Life Budget", {
                description: `You need £${cost.toLocaleString()} but only have £${currentBudget.toLocaleString()} available.`,
            });
            return;
        }

        const newBudgetAllocations = {
            ...userTeam.financials.budgetAllocations,
            [budgetCategory]: currentBudget - cost,
        };
        
        const newRoster = userTeam.roster.map(player => ({
            ...player,
            morale: updateMorale(player.morale, 1)
        }));

        updateTeam({ ...userTeam, roster: newRoster, financials: { ...userTeam.financials, budgetAllocations: newBudgetAllocations } });
        toast.success("Student Life Initiative Successful!", {
            description: `Cost: £${cost.toLocaleString()}.`,
        });
    };

    const updatePlayerTrainingFocus = (playerId: string, focus: TrainingFocus) => {
        if (!userTeam) return;
        const newRoster = userTeam.roster.map(p => p.id === playerId ? { ...p, trainingFocus: focus } : p);
        updateTeam({ ...userTeam, roster: newRoster });
    };

    const autoAssignTrainingFocuses = () => {
        if (!userTeam) return;
        const newRoster = userTeam.roster.map(player => {
            const isSkater = !player.positions.includes('G');
            const applicableFocuses = isSkater ? skaterFocuses : goalieFocuses;
            
            let weakestFocus: TrainingFocus = null;
            let lowestAverage = Infinity;

            for (const focus of applicableFocuses) {
                if (!focus) continue;
                const focusAttributes = trainingFocusesMap[focus];
                const relevantPlayerAttributes = focusAttributes.filter(attr => player.attributes.hasOwnProperty(attr));
                if (relevantPlayerAttributes.length === 0) continue;
                const totalValue = relevantPlayerAttributes.reduce((sum, attr) => sum + (player.attributes[attr as keyof typeof player.attributes] as number), 0);
                const averageValue = totalValue / relevantPlayerAttributes.length;
                if (averageValue < lowestAverage) {
                    lowestAverage = averageValue;
                    weakestFocus = focus;
                }
            }
            return { ...player, trainingFocus: weakestFocus };
        });

        updateTeam({ ...userTeam, roster: newRoster });
        toast.success("Training focuses have been auto-assigned based on players' weakest areas.");
    };

    const generateScoutingPool = () => {
        if (!userTeam) return;
        const allTeamNames = teams.map(t => t.name).filter(name => name !== userTeam.name);
        const newRecruits = generateRecruits(userTeam.leagueDivision, allTeamNames);
        setScoutingPool(newRecruits);
        setFairHosted(true);
    };

    const recruitPlayer = (playerId: string) => {
        if (!userTeam) return;
        const playerToRecruit = scoutingPool.find(p => p.id === playerId);
        if (!playerToRecruit) return;

        const cost = playerToRecruit.recruitmentCost || 0;
        const currentBudget = userTeam.financials.budgetAllocations.Recruiting;

        if (currentBudget < cost) {
            toast.error("Insufficient Recruiting Budget", {
                description: `You need £${cost.toLocaleString()} but only have £${currentBudget.toLocaleString()} available.`,
            });
            return;
        }

        const newBudgetAllocations = {
            ...userTeam.financials.budgetAllocations,
            Recruiting: Math.round(currentBudget - cost),
        };
        
        updateBudgetAllocations(newBudgetAllocations);
        setScoutingPool(prev => prev.filter(p => p.id !== playerId));
        setRecruitedPool(prev => [...prev, playerToRecruit]);
        toast.success(`${playerToRecruit.name} recruited!`, {
            description: `Cost: £${cost.toLocaleString()}. Remaining budget: £${(currentBudget - cost).toLocaleString()}`,
        });
    };

    const assignPlayerToRoster = (playerId: string) => {
        if (!userTeam) return;
        const playerToAssign = recruitedPool.find(p => p.id === playerId);
        if (playerToAssign) {
            const usedJerseyNumbers = new Set(userTeam.roster.map(p => p.jerseyNumber));
            let newJerseyNumber = 1;
            while (usedJerseyNumbers.has(newJerseyNumber)) {
                newJerseyNumber++;
            }
            playerToAssign.jerseyNumber = newJerseyNumber;

            const newRoster = [...userTeam.roster, playerToAssign].sort((a, b) => a.jerseyNumber - b.jerseyNumber);
            updateTeam({ ...userTeam, roster: newRoster });
            setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
            toast.success(`${playerToAssign.name} has been added to the roster.`);
        }
    };

    const discardRecruit = (playerId: string) => {
        const player = recruitedPool.find(p => p.id === playerId);
        if (player) {
            setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
            toast.info(`${player.name} has been discarded.`);
        }
    };

    const updateBudgetAllocations = (newAllocations: BudgetAllocations) => {
        if (!userTeam) return;

        if (managedOrganization) {
            const oldOrgAllocations = managedTeams.reduce((acc, t) => {
                (Object.keys(t.financials.budgetAllocations) as BudgetCategory[]).forEach(key => {
                    acc[key] = (acc[key] || 0) + t.financials.budgetAllocations[key];
                });
                return acc;
            }, { Travel: 0, Equipment: 0, "Ice Time": 0, Recruiting: 0, "Student Life": 0, Facilities: 0 } as BudgetAllocations);

            const allocationChanges: Partial<BudgetAllocations> = {};
            (Object.keys(newAllocations) as (keyof BudgetAllocations)[]).forEach(key => {
                allocationChanges[key] = newAllocations[key] - oldOrgAllocations[key];
            });

            setTeams(currentTeams => {
                const primaryTeam = managedTeams[0];
                const teamIndex = currentTeams.findIndex(t => t.name === primaryTeam.name);
                if (teamIndex === -1) return currentTeams;

                const newTeams = [...currentTeams];
                const teamToUpdate = { ...newTeams[teamIndex] };
                const updatedAllocations = { ...teamToUpdate.financials.budgetAllocations };

                (Object.keys(allocationChanges) as (keyof BudgetAllocations)[]).forEach(key => {
                    updatedAllocations[key] = Math.round(updatedAllocations[key] + allocationChanges[key]!);
                });

                teamToUpdate.financials = { ...teamToUpdate.financials, budgetAllocations: updatedAllocations };
                newTeams[teamIndex] = teamToUpdate;
                return newTeams;
            });
        } else {
            const updatedTeam = { ...userTeam, financials: { ...userTeam.financials, budgetAllocations: newAllocations } };
            const roundedNewAllocations: BudgetAllocations = Object.fromEntries(
                Object.entries(newAllocations).map(([key, value]) => [key, Math.round(value)])
            ) as unknown as BudgetAllocations;

            updateTeam({ ...userTeam, financials: { ...userTeam.financials, budgetAllocations: roundedNewAllocations } });
        }
    };

    const startFacilityProject = (projectId: string) => {
        if (!userTeam) return;

        if (managedOrganization) {
            const project = userTeam.facilities.find(p => p.id === projectId);
            if (!project) return;

            const cost = project.cost;
            const currentBudget = organizationFinancials?.budgetAllocations.Facilities || 0;

            if (currentBudget < cost) {
                toast.error("Insufficient Facilities Budget", {
                    description: `You need £${cost.toLocaleString()} but only have £${(currentBudget).toLocaleString()} available in the organization's budget.`,
                });
                return;
            }

            const newBudgetAllocations = {
                ...(organizationFinancials?.budgetAllocations || {}),
                Facilities: Math.round(currentBudget - cost),
            } as BudgetAllocations;
            updateBudgetAllocations(newBudgetAllocations);

            setTeams(currentTeams => {
                return currentTeams.map(team => {
                    if (managedTeams.some(mt => mt.name === team.name)) {
                        const newFacilities = team.facilities.map(p => 
                            p.id === projectId ? { ...p, status: 'In Progress' as 'In Progress', weeksToComplete: 12 } : p
                        );
                        return { ...team, facilities: newFacilities };
                    }
                    return team;
                });
            });

            toast.success(`${project.name} project has started!`, {
                description: `Cost: £${cost.toLocaleString()}.`,
            });

        } else {
            const project = userTeam.facilities.find(p => p.id === projectId);
            if (!project) return;

            const cost = project.cost;
            const currentBudget = userTeam.financials.budgetAllocations.Facilities;

            if (currentBudget < cost) {
                toast.error("Insufficient Facilities Budget", {
                    description: `You need £${cost.toLocaleString()} but only have £${currentBudget.toLocaleString()} available.`,
                });
                return;
            }

            const newBudgetAllocations = {
                ...userTeam.financials.budgetAllocations,
                Facilities: Math.round(currentBudget - cost),
            };
            const newFacilities = userTeam.facilities.map(p =>
                p.id === projectId ? { ...p, status: 'In Progress' as 'In Progress', weeksToComplete: 12 } : p
            );
            const updatedTeam = {
                ...userTeam,
                financials: { ...userTeam.financials, budgetAllocations: newBudgetAllocations },
                facilities: newFacilities,
            };
            updateTeam(updatedTeam);
            toast.success(`${project.name} project has started!`, {
                description: `Cost: £${cost.toLocaleString()}.`,
            });
        }
    };

    const markGameAsCompleted = (gameId: string, homeScore: number, awayScore: number) => {
        setSchedule(prevSchedule =>
            prevSchedule.map(entry =>
                entry.id === gameId
                    ? { ...entry, status: 'completed', result: { homeScore, awayScore } }
                    : entry
            )
        );
    };

    return (
        <TeamContext.Provider value={{ 
            teams, updateTeam, userTeam, 
            organizationFinancials, organizationFacilities,
            selectTeam, scoutingPool, recruitedPool, fairHosted,
            generateScoutingPool, recruitPlayer, assignPlayerToRoster, discardRecruit,
            updateBudgetAllocations, runStudentLifeInitiative, startFacilityProject,
            currentDate, advanceWeek, developmentHistory, updatePlayerTrainingFocus,
            autoAssignTrainingFocuses, processGameResults, movePlayer, requestPlayerTransfer,
            managedOrganization, managedTeams, selectOrganization, setActiveTeam,
            schedule, gameForCurrentWeek, nationalsData,
            markGameAsCompleted, seasonRecords, careerRecords, alumni
        }}>
            {children}
        </TeamContext.Provider>
    );
};

export const useTeam = () => {
    const context = useContext(TeamContext);
    if (context === undefined) {
        throw new Error('useTeam must be used within a TeamProvider');
    }
    return context;
};