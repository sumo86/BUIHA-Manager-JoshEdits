import { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Team, Player, BudgetAllocations, SkaterAttributes, GoalieAttributes, DevelopmentLog, TrainingFocus, GameState, FacilityProject, BudgetCategory, Financials, ScheduleEntry, GameDate, PlayerSeasonStats, RecordCategory, TeamRecord, NationalsPlayoffMatch, SeasonHistory, TeamSeasonHistory, SaveGameSlot } from '@/types';
import { teams as initialTeams, getTeamOrganizations, getOrganizationName } from '@/data/teams';
import { generateRecruits, generatePlayer, calculateStarRating } from '@/lib/playerGenerator';
import { toast } from 'sonner';
import { calculateCurrentAbility } from '@/lib/playerGenerator';
import { trainingFocusesMap } from '@/data/trainingFocuses';
import { skaterFocuses, goalieFocuses } from '@/data/trainingFocuses'; // Keep these for auto-assigning random focuses
import { processGameResults as processGameResultsEngine } from '@/lib/statsEngine';
import { generateSeasonSchedule } from '@/lib/scheduleGenerator';
import { simulateFullGame } from '@/lib/gameEngine';
import { validateLineup } from '@/lib/lineupValidation';
import { createNationalsTournament, generatePlayoffBracket } from '@/lib/nationalsGenerator';
import { NationalsTournament } from '@/types';
import { isRivalryGame } from '@/lib/rivalries';
import { rebalanceOrganizationRosters } from '@/lib/aiManager';
import { initialFacilityProjects } from '@/data/facilities';

const months = ["August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June", "July"];
const moraleLevels: Player['morale'][] = ["Angry", "Unhappy", "Content", "Happy"];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomValueInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

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
    transferPool: Player[];
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
    processGameResults: (userTeam: Team, opponentTeam: Team, gameState: GameState, isNationalsGame?: boolean, nationalsDivision?: string, gameId?: string) => void;
    movePlayer: (playerId: string, fromTeamName: string, toTeamName: string) => void;
    requestPlayerTransfer: (playerId: string, fromTeamName: string, toTeamName: string) => void;
    managedOrganization: string | null;
    isManagingOrg: boolean;
    managedTeams: Team[];
    selectOrganization: (orgName: string | null) => void;
    setActiveTeam: (teamName: string) => void;
    schedule: ScheduleEntry[];
    gameForCurrentWeek: { id: string; opponent: string; date: GameDate; isNationals: boolean; homeTeam: string | { winnerOf: string }; awayTeam: string | { winnerOf: { winnerOf: string } | string }; } | null;
    nationalsData: { [year: number]: { [division: string]: NationalsTournament } };
    markGameAsCompleted: (gameId: string, homeScore: number, awayScore: number) => void;
    seasonRecords: { [key in RecordCategory]?: TeamRecord };
    careerRecords: { [key in RecordCategory]?: TeamRecord };
    alumni: Player[];
    playNationalsRound: (division: string, userGameResult?: { homeTeamName: string, awayTeamName: string, homeScore: number, awayScore: number, gameId: string }) => void;
    autoSimulateUserNationalsGame: (division: string, gameId: string) => void;
    seasonHistory: SeasonHistory;
    simulateFullNationalsTournament: (division: string) => void;
    simulateSingleNationalsGame: (division: string, gameId: string) => void;
    simulateAllNationalsTournaments: () => void;
    saveGame: (saveName: string) => void;
    loadGame: (saveName: string) => void;
    deleteGame: (saveName: string) => void;
    exitToMainMenu: () => void;
    savedGames: SaveGameSlot[];
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const useTeam = () => {
    const context = useContext(TeamContext);
    if (context === undefined) {
        throw new Error('useTeam must be used within a TeamProvider');
    }
    return context;
};

export const TeamProvider = ({ children }: { children: ReactNode }): JSX.Element => {
    const [teams, setTeams] = useState<Team[]>(() => {
        let loadedTeams: Team[] = initialTeams; // Initialize with fallback
        try {
            const savedTeams = localStorage.getItem('teams');
            if (savedTeams) {
                const parsedTeams = JSON.parse(savedTeams);
                if (Array.isArray(parsedTeams)) {
                    loadedTeams = parsedTeams;
                }
            }
        } catch (error) {
            console.error("Failed to load teams from localStorage:", error);
        }
        localStorage.setItem('teams', JSON.stringify(loadedTeams)); // Save the determined state
        return loadedTeams;
    });

    useEffect(() => {
        localStorage.setItem('teams', JSON.stringify(teams));
    }, [teams]);

    const [savedGames, setSavedGames] = useState<SaveGameSlot[]>(() => {
        try {
            const saved = localStorage.getItem('savedGamesList');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            return [];
        }
    });

    const [alumni, setAlumni] = useState<Player[]>(() => {
        try {
            const saved = localStorage.getItem('alumni');
            return saved ? JSON.parse(saved) : [];
        } catch (error) { return []; }
    });

    useEffect(() => {
        localStorage.setItem('alumni', JSON.stringify(alumni));
    }, [alumni]);

    const [seasonHistory, setSeasonHistory] = useState<SeasonHistory>(() => {
        try {
            const saved = localStorage.getItem('seasonHistory');
            return saved ? JSON.parse(saved) : {};
        } catch (error) { return {}; }
    });

    useEffect(() => {
        localStorage.setItem('seasonHistory', JSON.stringify(seasonHistory));
    }, [seasonHistory]);

    const [activeTeamName, setActiveTeamName] = useState<string | null>(() => localStorage.getItem('activeTeamName') || null);
    const [managedOrganization, setManagedOrganization] = useState<string | null>(() => localStorage.getItem('managedOrganization') || null);
    const [isManagingOrg, setIsManagingOrg] = useState<boolean>(() => localStorage.getItem('isManagingOrg') === 'true');
    
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

    const organizationFacilities = useMemo((): FacilityProject[] | null => {
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
            
            const { status: oldStatus, ...restOfProject } = project;
            return { ...restOfProject, status: newStatus };
        });
    }, [managedOrganization, managedTeams]);

    const selectTeam = (teamName: string | null) => {
        if (teamName) {
            const team = teams.find(t => t.name === teamName);
            if (team) {
                const orgName = getOrganizationName(team.name);
                localStorage.setItem('activeTeamName', teamName);
                localStorage.setItem('managedOrganization', orgName);
                localStorage.setItem('isManagingOrg', 'false');
                setActiveTeamName(teamName);
                setManagedOrganization(orgName);
                setIsManagingOrg(false);
            }
        } else {
            localStorage.removeItem('activeTeamName');
            localStorage.removeItem('managedOrganization');
            localStorage.removeItem('isManagingOrg');
            setActiveTeamName(null);
            setManagedOrganization(null);
            setIsManagingOrg(false);
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
                localStorage.setItem('isManagingOrg', 'true');
                setManagedOrganization(orgName);
                setActiveTeamName(mainTeam.name);
                setIsManagingOrg(true);
            }
        } else {
            localStorage.removeItem('managedOrganization');
            localStorage.removeItem('activeTeamName');
            localStorage.removeItem('isManagingOrg');
            setManagedOrganization(null);
            setActiveTeamName(null);
            setIsManagingOrg(false);
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

    const [transferPool, setTransferPool] = useState<Player[]>(() => {
        try {
            const saved = localStorage.getItem('transferPool');
            return saved ? JSON.parse(saved) : [];
        } catch (error) { return []; }
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
    useEffect(() => { localStorage.setItem('transferPool', JSON.stringify(transferPool)); }, [transferPool]);
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

        const currentYearNationals = nationalsData[currentDate.year];
        if (currentYearNationals && userTeam.nationalsDivision) {
            const tournament = currentYearNationals[userTeam.nationalsDivision];
            if (tournament && (tournament.status === 'group-stage' || tournament.status === 'silver-playoffs' || tournament.status === 'gold-playoffs')) {
                const gamesToCheck = tournament.status === 'group-stage' 
                    ? tournament.groupStageSchedule 
                    : tournament.playoffSchedule;

                const userGame = gamesToCheck.find(g => {
                    if (g.status !== 'scheduled') return false;
                    
                    const isUserGame = (typeof g.homeTeam === 'string' && g.homeTeam === userTeam.name) || 
                                     (typeof g.awayTeam === 'string' && g.awayTeam === userTeam.name);

                    if (!isUserGame) return false;

                    if (tournament.status === 'group-stage') {
                        return g.round === tournament.currentRound;
                    }
                    if (tournament.status === 'silver-playoffs' || tournament.status === 'gold-playoffs') {
                        const currentBracket = tournament.status === 'silver-playoffs' ? 'Silver' : 'Gold';
                        return (g as NationalsPlayoffMatch).round === tournament.currentRound && (g as NationalsPlayoffMatch).bracket === currentBracket;
                    }
                    return false;
                });

                if (userGame) {
                    const opponentName = (typeof userGame.homeTeam === 'string' && userGame.homeTeam === userTeam.name)
                        ? (typeof userGame.awayTeam === 'string' ? userGame.awayTeam : 'TBD')
                        : (typeof userGame.homeTeam === 'string' ? userGame.homeTeam : 'TBD');
                    
                    return {
                        id: userGame.id,
                        opponent: opponentName,
                        date: userGame.date,
                        isNationals: true,
                        homeTeam: userGame.homeTeam,
                        awayTeam: userGame.awayTeam as string | { winnerOf: string }, 
                    };
                }
            }
        }

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

        return null;
    }, [userTeam, schedule, currentDate, nationalsData]);

    const updateTeam = (updatedTeam: Team) => {
        setTeams(currentTeams =>
            currentTeams.map(t => (t.name === updatedTeam.name ? updatedTeam : t))
        );
    };

    // Constants for staff retirement logic
    const STAFF_RETIREMENT_MIN_AGE = 36; // Changed from 25 to 36
    const STAFF_RETIREMENT_MAX_AGE = 37;
    const STAFF_RETIREMENT_CHANCE_PER_YEAR_INCREASE = 0.08; // 8% increase per year after min age

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
        
        const allOrganizations = getTeamOrganizations(); // Renamed to avoid conflict with 'allOrgs' later
        const aiOrgs = allOrganizations.filter(org => org.name !== managedOrganization);

        aiOrgs.forEach(org => {
            const orgTeamNames = org.teams.map(t => t.name);
            const teamsForRebalancing = tempTeams.filter(t => orgTeamNames.includes(t.name));
            if (teamsForRebalancing.length > 1) {
                const rebalancedTeams = rebalanceOrganizationRosters(teamsForRebalancing);
                rebalancedTeams.forEach(rebalancedTeam => {
                    const index = tempTeams.findIndex(t => t.name === rebalancedTeam.name);
                    if (index !== -1) {
                        tempTeams[index] = rebalancedTeam;
                    }
                });
            }
        });

        let tempSchedule = JSON.parse(JSON.stringify(schedule)) as ScheduleEntry[];
        let newDevelopmentLogs: DevelopmentLog[] = [];
        const managedTeamNames = managedTeams.map(t => t.name);

        const currentYear = currentDate.year;

        let tempNationalsData = JSON.parse(JSON.stringify(nationalsData)) as { [year: number]: { [division: string]: NationalsTournament } };
        let tempSeasonRecords = JSON.parse(JSON.stringify(seasonRecords)) as { [key in RecordCategory]?: TeamRecord };
        let tempCareerRecords = JSON.parse(JSON.stringify(careerRecords)) as { [key in RecordCategory]?: TeamRecord };

        if (currentDate.month === 'May' && currentDate.week === 4) {
            const allTournamentsCompleted = Object.values(tempNationalsData[currentYear] || {}).every(t => t.status === 'completed');
            if (!allTournamentsCompleted) {
                toast.error("Nationals In Progress", { description: "You must complete the National Championships before advancing the week." });
                return;
            }
        }

        const updateGameRecords = (homeTeam: Team, awayTeam: Team) => {
            const allPlayers = [...homeTeam.roster, ...awayTeam.roster];
            const teamsMap = { [homeTeam.name]: homeTeam, [awayTeam.name]: awayTeam };
        
            allPlayers.forEach(player => {
                const team = teamsMap[player.history[player.history.length - 1]?.team || homeTeam.name];
                if (!team) return;

                const isSkater = !player.positions.includes('G');
                const season = `${currentDate.year}-${currentDate.year + 1}`;
        
                if (isSkater) {
                    const stats = player.currentStats[player.currentStats.length - 1];
                    if (!stats) return;
                    if ((stats.goals || 0) > (tempSeasonRecords['Goals']?.value || 0)) tempSeasonRecords['Goals'] = { playerName: player.name, teamName: team.name, value: stats.goals || 0, season };
                    if ((stats.assists || 0) > (tempSeasonRecords['Assists']?.value || 0)) tempSeasonRecords['Assists'] = { playerName: player.name, teamName: team.name, value: stats.assists || 0, season };
                    if ((stats.points || 0) > (tempSeasonRecords['Points']?.value || 0)) tempSeasonRecords['Points'] = { playerName: player.name, teamName: team.name, value: stats.points || 0, season };
                    if ((stats.penaltyMinutes || 0) > (tempSeasonRecords['PenaltyMinutes']?.value || 0)) tempSeasonRecords['PenaltyMinutes'] = { playerName: player.name, teamName: team.name, value: stats.penaltyMinutes || 0, season };
                    
                    const careerGoals = (player.history?.reduce((acc, s) => acc + (s.goals || 0), 0) || 0) + (stats.goals || 0);
                    if (careerGoals > (tempCareerRecords['Goals']?.value || 0)) tempCareerRecords['Goals'] = { playerName: player.name, teamName: team.name, value: careerGoals };
                    const careerAssists = (player.history?.reduce((acc, s) => acc + (s.assists || 0), 0) || 0) + (stats.assists || 0);
                    if (careerAssists > (tempCareerRecords['Assists']?.value || 0)) tempCareerRecords['Assists'] = { playerName: player.name, teamName: team.name, value: careerAssists };
                    const careerPoints = (player.history?.reduce((acc, s) => acc + (s.points || 0), 0) || 0) + (stats.points || 0);
                    if (careerPoints > (tempCareerRecords['Points']?.value || 0)) tempCareerRecords['Points'] = { playerName: player.name, teamName: team.name, value: careerPoints };
                    const careerPims = (player.history?.reduce((acc, s) => acc + (s.penaltyMinutes || 0), 0) || 0) + (stats.penaltyMinutes || 0);
                    if (careerPims > (tempCareerRecords['PenaltyMinutes']?.value || 0)) tempCareerRecords['PenaltyMinutes'] = { playerName: player.name, teamName: team.name, value: careerPims };

                } else { 
                    const stats = player.currentStats[player.currentStats.length - 1];
                    if (!stats) return;
                    if (stats.gamesPlayed >= 5) { 
                        if (!tempSeasonRecords['GAA'] || ((stats.goalsAgainstAverage || 99) < tempSeasonRecords['GAA'].value)) tempSeasonRecords['GAA'] = { playerName: player.name, teamName: team.name, value: stats.goalsAgainstAverage || 99, season };
                        if ((stats.savePercentage || 0) > (tempSeasonRecords['SavePercentage']?.value || 0)) tempSeasonRecords['SavePercentage'] = { playerName: player.name, teamName: team.name, value: stats.savePercentage || 0, season };
                    }
                    if ((stats.shutouts || 0) > (tempSeasonRecords['Shutouts']?.value || 0)) tempSeasonRecords['Shutouts'] = { playerName: player.name, teamName: team.name, value: stats.shutouts || 0, season };
                    
                    const careerShutouts = (player.history?.reduce((acc, s) => acc + (s.shutouts || 0), 0) || 0) + (stats.shutouts || 0);
                    if (careerShutouts > (tempCareerRecords['Shutouts']?.value || 0)) tempCareerRecords['Shutouts'] = { playerName: player.name, teamName: team.name, value: careerShutouts };
                }
            });
        };

        const gamesThisWeek = schedule.filter(game =>
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

                if (game.homeTeam === userTeam?.name || game.awayTeam === userTeam?.name) {
                    toast.info("Game Auto-Simulated", { description: `${homeTeam.name} ${finalGameState.userScore} - ${awayTeam.name} ${finalGameState.opponentScore}` });
                }
            });
        }

        tempTeams = tempTeams.map(team => {
            let newRoster = [...team.roster];
            let newFacilities = [...team.facilities];
            const isUserManagedTeam = team.name === userTeam?.name || managedTeamNames.includes(team.name);

            // --- NEW FACILITY BENEFIT LOGIC ---
            // 1. Weekly Income
            let weeklyIncome = 0;
            const hasMerchKiosk = team.facilities.some(f => f.id === 'merch_store_1' && f.status === 'Completed');
            const hasSocialMedia = team.facilities.some(f => f.id === 'social_media_1' && f.status === 'Completed');

            if (hasMerchKiosk) {
                let merchIncome = 150; // Base income
                if (hasSocialMedia) {
                    merchIncome *= 1.2; // Social media boosts merch sales by 20%
                }
                weeklyIncome += merchIncome;
            }
            if (hasSocialMedia) {
                weeklyIncome += 50; // Base income from social media itself
            }

            if (weeklyIncome > 0) {
                team.financials.totalBudget += Math.round(weeklyIncome); // Add to unallocated funds
            }

            // 2. Development Boost Modifiers
            const hasGym = team.facilities.some(f => f.id === 'training_gym_1' && f.status === 'Completed');
            const hasVideoRoom = team.facilities.some(f => f.id === 'video_room_1' && f.status === 'Completed');
            const physicalAttrs: (keyof SkaterAttributes)[] = ['acceleration', 'agility', 'balance', 'speed', 'stamina', 'strength', 'hitting'];
            const mentalAttrs: (keyof SkaterAttributes)[] = ['aggression', 'bravery', 'determination', 'leadership', 'teamPlayer', 'gettingOpen', 'offensiveRead', 'defensiveRead', 'positioning'];
            // --- END NEW FACILITY BENEFIT LOGIC ---

            newRoster = newRoster.map(player => {
                let playerChanged = false;
                const isSkater = !player.positions.includes('G');

                // Apply injury recovery
                if (player.healthStatus === 'Injured' && player.injury) {
                    player.injury.duration--;
                    // Physiotherapy Office benefit
                    if (team.facilities.some(f => f.id === 'physio_office_1' && f.status === 'Completed')) {
                        player.injury.duration--; // Reduce by an additional week
                    }
                    if (player.injury.duration <= 0) {
                        player.healthStatus = 'Healthy';
                        player.injury = null;
                        toast.info("Player Recovered!", { description: `${player.name} has recovered from injury.` });
                    }
                    playerChanged = true;
                }

                // Player development
                if (player.potentialAbility > player.currentAbility) {
                    const paGap = player.potentialAbility - player.currentAbility;
                    const devRate = player.attributes.developmentRate || 1; // Default to 1 if not set
                    const coachability = player.attributes.coachability || 10; // Default to 10 if not set
                    const professionalism = player.attributes.professionalism || 10; // Default to 10 if not set

                    const baseDevChance = 0.05 * (devRate / 20); // Base chance, scaled by devRate (max 20)
                    const paBonus = paGap > 0 ? Math.min(0.1, paGap / 100) : 0; // Max 10% bonus for PA gap
                    const workEthicBonus = (professionalism - 10) / 100; // Scale professionalism (1-20) to -0.09 to 0.1
                    const coachabilityBonus = (coachability - 10) / 100;
                    const devChance = baseDevChance + paBonus + workEthicBonus + coachabilityBonus;

                    if (Math.random() < devChance) {
                        let attributesToDevelop: (keyof SkaterAttributes | keyof GoalieAttributes)[] = [];

                        if (player.trainingFocus) {
                            // Use trainingFocusesMap to get the correct attributes array
                            attributesToDevelop = trainingFocusesMap[player.trainingFocus] as (keyof SkaterAttributes | keyof GoalieAttributes)[];
                        } else {
                            // If no focus, pick a random attribute
                            const allAttrs = Object.keys(player.attributes) as (keyof SkaterAttributes | keyof GoalieAttributes)[];
                            attributesToDevelop = [getRandomItem(allAttrs.filter(attr => typeof player.attributes[attr] === 'number'))];
                        }

                        if (attributesToDevelop.length > 0) {
                            const attrToImprove = getRandomItem(attributesToDevelop);
                            const currentAttrValue = player.attributes[attrToImprove as keyof typeof player.attributes] as number;
                            if (currentAttrValue < 20) {
                                let moraleModifier = 1.0;
                                if ((player as Player).morale === 'Happy') moraleModifier = 1.2;
                                else if ((player as Player).morale === 'Unhappy') moraleModifier = 0.5;
                                let improvement = ((Math.random() * 0.2) + (devRate / 100)) * moraleModifier;

                                // --- APPLY DEV BOOST ---
                                if (hasGym && physicalAttrs.includes(attrToImprove as any)) {
                                    improvement *= 1.15; // 15% boost for physical attributes
                                }
                                if (hasVideoRoom && mentalAttrs.includes(attrToImprove as any)) {
                                    improvement *= 1.15; // 15% boost for mental attributes
                                }
                                // --- END APPLY DEV BOOST ---

                                const newAttrValue = Math.min(20, currentAttrValue + improvement);
                                (player.attributes[attrToImprove as keyof typeof player.attributes] as number) = newAttrValue;
                                playerChanged = true;
                                newDevelopmentLogs.push({
                                    playerId: player.id,
                                    playerName: player.name,
                                    attribute: String(attrToImprove),
                                    change: newAttrValue - currentAttrValue,
                                    newRating: newAttrValue,
                                    date: currentDate,
                                });
                            }
                        }
                    }
                }
                return player;
            });
            team.roster = newRoster; // Update team roster with modified players

            // Check for facility project completion
            newFacilities = newFacilities.map(project => {
                if (project.status === 'In Progress' && project.weeksToComplete !== undefined && project.weeksToComplete > 0) {
                    project.weeksToComplete--;
                    if (project.weeksToComplete <= 0) {
                        project.status = 'Completed';
                        toast.success("Facility Completed!", { description: `${project.name} is now operational!` });
                        // Apply one-time benefits here if any
                        if (project.id === 'locker_room_1') {
                            team.roster = team.roster.map(p => ({ ...p, morale: updateMorale(p.morale, 1) }));
                            toast.info("Team Morale Boost!", { description: "Locker Room Refurbishment improved team morale!" });
                        }
                    }
                }
                return project;
            });
            team.facilities = newFacilities;

            // Staff retirement logic (if applicable)
            // ... (existing staff retirement logic if any)

            return team;
        });

        setDevelopmentHistory(prev => [...prev, ...newDevelopmentLogs]);

        // Advance date
        let nextMonthIndex = months.indexOf(currentDate.month) + 1;
        let nextWeek = currentDate.week + 1;
        let nextMonth = currentDate.month;
        let nextYear = currentDate.year;

        if (nextWeek > 4) { // Assuming 4 weeks per month
            nextWeek = 1;
            if (nextMonthIndex >= months.length) {
                nextMonthIndex = 0; // Reset to August
                nextYear++;
                // End of season processing
                tempTeams = tempTeams.map(team => {
                    // Handle graduating players
                    const graduatingPlayers = team.roster.filter(p => p.eligibility === 'UG Year 4' || p.eligibility === 'Masters' || p.eligibility === 'PhD');
                    const remainingPlayers = team.roster.filter(p => p.eligibility !== 'UG Year 4' && p.eligibility !== 'Masters' && p.eligibility !== 'PhD');

                    graduatingPlayers.forEach(player => {
                        if (player.currentStats.length > 0) {
                            player.history.push(...player.currentStats);
                            player.currentStats = [];
                        }
                        // Decide if player continues education or becomes alumni
                        if (Math.random() < 0.3) { // 30% chance to continue education
                            player.isContinuingEducation = true;
                            player.eligibility = player.eligibility === 'UG Year 4' ? 'Masters' : 'PhD';
                            remainingPlayers.push(player); // Keep in roster
                        } else {
                            setAlumni(prev => [...prev, { ...player, alumniStatus: 'Retired' }]);
                        }
                    });

                    team.roster = remainingPlayers;

                    // --- REVISED BUDGET LOGIC START ---
                    // Calculate bonus income from end-of-year facilities
                    let facilityBonusIncome = 0;
                    if (team.facilities.some(f => f.id === 'rink_ads_1' && f.status === 'Completed')) {
                        facilityBonusIncome += 5000; // Lump sum from ads
                    }
                    if (team.facilities.some(f => f.id === 'team_bus_1' && f.status === 'Completed')) {
                        const travelCostPerSeason = 13 * 200; // 13 away games * £200 (example base travel cost)
                        facilityBonusIncome += travelCostPerSeason * 0.25; // 25% rebate
                    }

                    const orgName = getOrganizationName(team.name);
                    const organization = allOrganizations.find(org => org.name === orgName);

                    let newBaseBudget = 15000; // Default for single-team orgs
                    if (organization && organization.teams.length > 1) {
                        // Replicate the multi-team organization budget calculation
                        const orgTotalBudget = 10000 + (organization.teams.length * 7500);
                        newBaseBudget = orgTotalBudget / organization.teams.length;
                    }

                    // The new totalBudget (unallocated funds) is the new base budget + facility bonus income
                    // The allocated pots are reset to 0 at the start of a new season
                    const resetAllocations = { Travel: 0, Equipment: 0, "Ice Time": 0, Recruiting: 0, "Student Life": 0, Facilities: 0 } as BudgetAllocations;

                    return {
                        ...team,
                        roster: team.roster, // Already updated above
                        financials: {
                            ...team.financials,
                            totalBudget: Math.round(newBaseBudget + facilityBonusIncome), // New unallocated funds
                            budgetAllocations: resetAllocations, // Reset pots
                        },
                        wins: 0, losses: 0, draws: 0, points: 0, goalsFor: 0, goalsAgainst: 0 // existing reset
                    };
                });

                setTransferPool([]);
                setScoutingPool([]); // Clear scouting pool at end of season
                setRecruitedPool([]); // Clear recruited pool at end of season
                setFairHosted(false); // Reset fair hosted status

                // Generate new schedule for the next season
                const newSchedule = generateSeasonSchedule(tempTeams, { month: 'August', week: 1, year: nextYear });
                setSchedule(newSchedule);

                // Generate new recruits for the next season
                generateScoutingPool();

                // Reset season records
                setSeasonRecords({});

                // Save season history
                setSeasonHistory(prev => ({
                    ...prev,
                    [currentYear]: tempTeams.map(t => ({
                        teamName: t.name,
                        leagueDivision: t.leagueDivision,
                        nationalsDivision: t.nationalsDivision,
                        wins: t.wins,
                        losses: t.losses,
                        draws: t.draws,
                        points: t.points,
                        goalsFor: t.goalsFor,
                        goalsAgainst: t.goalsAgainst,
                    }))
                }));

                toast.success("New Season!", { description: `Welcome to the ${nextYear}-${nextYear + 1} season!` });
            }
            nextMonth = months[nextMonthIndex];
        }

        setCurrentDate({ month: nextMonth, week: nextWeek, year: nextYear });
        setTeams(tempTeams);
    };

    const generateScoutingPool = () => {
        const newPool = generateRecruits(10); // Generate 10 new recruits
        setScoutingPool(newPool);
        setFairHosted(true);
        toast.success("Recruitment Fair Hosted!", { description: "A new pool of potential recruits is available." });
    };

    const recruitPlayer = (playerId: string) => {
        const playerToRecruit = scoutingPool.find(p => p.id === playerId);
        if (!playerToRecruit) {
            toast.error("Player not found in scouting pool.");
            return;
        }
        if (!userTeam) {
            toast.error("No active team selected.");
            return;
        }

        const cost = playerToRecruit.recruitmentCost || 0;
        if (userTeam.financials.budgetAllocations.Recruiting < cost) {
            toast.error("Insufficient Recruiting Budget", { description: `You need £${cost.toLocaleString()} in recruiting budget to sign ${playerToRecruit.name}.` });
            return;
        }

        setTeams(prevTeams => prevTeams.map(team => {
            if (team.name === userTeam.name) {
                return {
                    ...team,
                    financials: {
                        ...team.financials,
                        budgetAllocations: {
                            ...team.financials.budgetAllocations,
                            Recruiting: team.financials.budgetAllocations.Recruiting - cost
                        }
                    }
                };
            }
            return team;
        }));

        setRecruitedPool(prev => [...prev, playerToRecruit]);
        setScoutingPool(prev => prev.filter(p => p.id !== playerId));
        toast.success("Player Recruited!", { description: `${playerToRecruit.name} has been successfully recruited.` });
    };

    const assignPlayerToRoster = (playerId: string) => {
        if (!userTeam) {
            toast.error("No active team selected.");
            return;
        }
        const playerToAssign = recruitedPool.find(p => p.id === playerId);
        if (!playerToAssign) {
            toast.error("Player not found in recruited pool.");
            return;
        }

        setTeams(prevTeams => prevTeams.map(team => {
            if (team.name === userTeam.name) {
                // Check if roster is full (e.g., max 25 players)
                if (team.roster.length >= 25) {
                    toast.error("Roster Full", { description: "Your roster is full. You need to cut a player before assigning a new one." });
                    return team;
                }
                return {
                    ...team,
                    roster: [...team.roster, { ...playerToAssign, currentStats: [{ season: `${currentDate.year}-${currentDate.year + 1}`, team: team.name, league: team.leagueDivision, gamesPlayed: 0 }] }]
                };
            }
            return team;
        }));
        setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
        toast.success("Player Assigned!", { description: `${playerToAssign.name} has been added to your roster.` });
    };

    const discardRecruit = (playerId: string) => {
        setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
        toast.info("Recruit Discarded", { description: "Player removed from consideration." });
    };

    const updateBudgetAllocations = (newAllocations: BudgetAllocations) => {
        if (!userTeam) {
            toast.error("No active team selected.");
            return;
        }
        setTeams(prevTeams => prevTeams.map(team => {
            if (team.name === userTeam.name) {
                // Calculate total wealth before this change
                const currentAllocated = Object.values(team.financials.budgetAllocations).reduce((sum, val) => sum + val, 0);
                const totalWealth = team.financials.totalBudget + currentAllocated;

                // Calculate the sum of the new allocations
                const newlyAllocated = Object.values(newAllocations).reduce((sum, val) => sum + val, 0);

                if (newlyAllocated > totalWealth) {
                    toast.error("Cannot allocate more than your total wealth.");
                    return team; // Return original team state
                }

                // The new unallocated budget is the total wealth minus the new allocations
                const newUnallocatedBudget = totalWealth - newlyAllocated;

                return {
                    ...team,
                    financials: {
                        ...team.financials,
                        budgetAllocations: newAllocations,
                        totalBudget: newUnallocatedBudget, // totalBudget is now Unallocated Funds
                    }
                };
            }
            return team;
        }));
        toast.success("Budget Updated!", { description: "Your budget allocations have been saved." });
    };

    const runStudentLifeInitiative = () => {
        if (!userTeam) {
            toast.error("No active team selected.");
            return;
        }
        const cost = 500; // Example cost
        if (userTeam.financials.budgetAllocations["Student Life"] < cost) {
            toast.error("Insufficient Student Life Budget", { description: `You need £${cost.toLocaleString()} in student life budget to run an initiative.` });
            return;
        }

        setTeams(prevTeams => prevTeams.map(team => {
            if (team.name === userTeam.name) {
                const updatedRoster = team.roster.map(player => ({
                    ...player,
                    morale: updateMorale(player.morale, 1)
                }));
                return {
                    ...team,
                    roster: updatedRoster,
                    financials: {
                        ...team.financials,
                        budgetAllocations: {
                            ...team.financials.budgetAllocations,
                            "Student Life": team.financials.budgetAllocations["Student Life"] - cost
                        }
                    }
                };
            }
            return team;
        }));
        toast.success("Student Life Initiative!", { description: "Team morale has improved!" });
    };

    const startFacilityProject = (projectId: string) => {
        if (!userTeam) {
            toast.error("No active team selected.");
            return;
        }
        const project = initialFacilityProjects.find(p => p.id === projectId);
        if (!project) {
            toast.error("Project not found.");
            return;
        }
        if (userTeam.facilities.some(f => f.id === projectId && (f.status === 'In Progress' || f.status === 'Completed'))) {
            toast.info("Project already started or completed.");
            return;
        }
        if (userTeam.financials.budgetAllocations.Facilities < project.cost) {
            toast.error("Insufficient Facilities Budget", { description: `You need £${project.cost.toLocaleString()} in facilities budget to start this project.` });
            return;
        }

        setTeams(prevTeams => prevTeams.map(team => {
            if (team.name === userTeam.name) {
                const existingProjectIndex = team.facilities.findIndex(f => f.id === projectId);
                let updatedFacilities = [...team.facilities];

                if (existingProjectIndex !== -1) {
                    updatedFacilities[existingProjectIndex] = { ...updatedFacilities[existingProjectIndex], status: 'In Progress', weeksToComplete: project.weeksToComplete || 4 };
                } else {
                    updatedFacilities.push({ ...project, status: 'In Progress', weeksToComplete: project.weeksToComplete || 4 });
                }
                
                return {
                    ...team,
                    facilities: updatedFacilities,
                    financials: {
                        ...team.financials,
                        budgetAllocations: {
                            ...team.financials.budgetAllocations,
                            Facilities: team.financials.budgetAllocations.Facilities - project.cost
                        }
                    }
                };
            }
            return team;
        }));
        toast.success("Project Started!", { description: `${project.name} is now under construction.` });
    };

    const updatePlayerTrainingFocus = (playerId: string, focus: TrainingFocus) => {
        if (!userTeam) {
            toast.error("No active team selected.");
            return;
        }
        setTeams(prevTeams => prevTeams.map(team => {
            if (team.name === userTeam.name) {
                return {
                    ...team,
                    roster: team.roster.map(player =>
                        player.id === playerId ? { ...player, trainingFocus: focus } : player
                    )
                };
            }
            return team;
        }));
        toast.success("Training Focus Updated!", { description: "Player's training focus has been updated." });
    };

    const autoAssignTrainingFocuses = () => {
        if (!userTeam) {
            toast.error("No active team selected.");
            return;
        }
        setTeams(prevTeams => prevTeams.map(team => {
            if (team.name === userTeam.name) {
                const updatedRoster = team.roster.map(player => {
                    if (!player.trainingFocus) {
                        const availableFocuses = player.positions.includes('G') ? Object.keys(goalieFocuses) : Object.keys(skaterFocuses);
                        const randomFocus = getRandomItem(availableFocuses) as TrainingFocus;
                        return { ...player, trainingFocus: randomFocus };
                    }
                    return player;
                });
                return { ...team, roster: updatedRoster };
            }
            return team;
        }));
        toast.success("Auto-Assigned Training Focuses!", { description: "Players without a focus have been assigned one." });
    };

    const processGameResults = (userTeam: Team, opponentTeam: Team, gameState: GameState, isNationalsGame: boolean = false, nationalsDivision?: string, gameId?: string) => {
        const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(userTeam, opponentTeam, gameState, isNationalsGame);

        setTeams(prevTeams => prevTeams.map(team => {
            if (team.name === updatedHomeTeam.name) return updatedHomeTeam;
            if (team.name === updatedAwayTeam.name) return updatedAwayTeam;
            return team;
        }));

        if (gameId) {
            markGameAsCompleted(gameId, gameState.userScore, gameState.opponentScore, isNationalsGame, nationalsDivision);
        }
    };

    const markGameAsCompleted = (gameId: string, homeScore: number, awayScore: number, isNationals: boolean = false, nationalsDivision?: string) => {
        if (isNationals && nationalsDivision) {
            setNationalsData(prevData => {
                const newData = { ...prevData };
                if (newData[currentDate.year] && newData[currentDate.year][nationalsDivision]) {
                    const tournament = newData[currentDate.year][nationalsDivision];
                    if (tournament.status === 'group-stage') {
                        const gameIndex = tournament.groupStageSchedule.findIndex(g => g.id === gameId);
                        if (gameIndex !== -1) {
                            tournament.groupStageSchedule[gameIndex] = {
                                ...tournament.groupStageSchedule[gameIndex],
                                status: 'completed',
                                result: { homeScore, awayScore }
                            };
                        }
                    } else if (tournament.status === 'silver-playoffs' || tournament.status === 'gold-playoffs') {
                        const gameIndex = tournament.playoffSchedule.findIndex(g => g.id === gameId);
                        if (gameIndex !== -1) {
                            tournament.playoffSchedule[gameIndex] = {
                                ...tournament.playoffSchedule[gameIndex],
                                status: 'completed',
                                result: { homeScore, awayScore }
                            };
                            // Update winner for playoff bracket
                            const game = tournament.playoffSchedule[gameIndex];
                            if (game) {
                                game.winner = homeScore > awayScore ? (typeof game.homeTeam === 'string' ? game.homeTeam : 'TBD') : (typeof game.awayTeam === 'string' ? game.awayTeam : 'TBD');
                            }
                        }
                    }
                }
                return newData;
            });
        } else {
            setSchedule(prevSchedule => prevSchedule.map(game =>
                game.id === gameId
                    ? { ...game, status: 'completed', result: { homeScore, awayScore } }
                    : game
            ));
        }
    };

    const movePlayer = (playerId: string, fromTeamName: string, toTeamName: string) => {
        setTeams(prevTeams => {
            const updatedTeams = prevTeams.map(team => {
                if (team.name === fromTeamName) {
                    return { ...team, roster: team.roster.filter(p => p.id !== playerId) };
                }
                return team;
            });

            const playerToMove = prevTeams.find(team => team.name === fromTeamName)?.roster.find(p => p.id === playerId);
            if (playerToMove) {
                return updatedTeams.map(team => {
                    if (team.name === toTeamName) {
                        return { ...team, roster: [...team.roster, playerToMove] };
                    }
                    return team;
                });
            }
            return updatedTeams;
        });
        toast.success("Player Moved!", { description: `Player ${playerId} moved from ${fromTeamName} to ${toTeamName}.` });
    };

    const requestPlayerTransfer = (playerId: string, fromTeamName: string, toTeamName: string) => {
        const player = teams.find(t => t.name === fromTeamName)?.roster.find(p => p.id === playerId);
        if (player) {
            setTransferPool(prev => [...prev, player]);
            toast.info("Transfer Requested", { description: `${player.name} from ${fromTeamName} is now in the transfer pool.` });
        }
    };

    const playNationalsRound = (division: string, userGameResult?: { homeTeamName: string, awayTeamName: string, homeScore: number, awayScore: number, gameId: string }) => {
        setNationalsData(prevData => {
            const newData = { ...prevData };
            const tournament = newData[currentDate.year]?.[division];
            if (!tournament) return newData;

            if (tournament.status === 'group-stage') {
                // Simulate all group stage games for the current round
                const gamesToSimulate = tournament.groupStageSchedule.filter(g =>
                    g.round === tournament.currentRound && g.status === 'scheduled'
                );

                gamesToSimulate.forEach(game => {
                    const homeTeam = teams.find(t => t.name === game.homeTeam);
                    const awayTeam = teams.find(t => t.name === game.awayTeam);

                    if (homeTeam && awayTeam) {
                        const finalGameState = simulateFullGame(homeTeam, awayTeam, false);
                        markGameAsCompleted(game.id, finalGameState.userScore, finalGameState.opponentScore, true, division);
                        // Update team stats for nationals
                        setTeams(prevTeams => prevTeams.map(t => {
                            if (t.name === homeTeam.name) return processGameResultsEngine(homeTeam, awayTeam, finalGameState, true).updatedUserTeam;
                            if (t.name === awayTeam.name) return processGameResultsEngine(awayTeam, homeTeam, { ...finalGameState, userScore: finalGameState.opponentScore, opponentScore: finalGameState.userScore }, true).updatedUserTeam;
                            return t;
                        }));
                    }
                });

                // Update standings after all games in the round
                const allTeamNamesInTournament = tournament.groups.flatMap(group => group.teams);
                const updatedTournament = createNationalsTournament(division, allTeamNamesInTournament, currentDate.year, tournament.groupStageSchedule);
                newData[currentDate.year][division].groups = updatedTournament.groups;

                // Advance round or transition to playoffs
                if (typeof tournament.currentRound === 'number' && tournament.currentRound < 3) { // Assuming 3 group stage rounds
                    newData[currentDate.year][division].currentRound = (tournament.currentRound as number) + 1;
                    toast.info(`Nationals Group Stage: Round ${newData[currentDate.year][division].currentRound} started for ${division}.`);
                } else {
                    // Transition to playoffs
                    const playoffBracket = generatePlayoffBracket(tournament.groups, currentDate);
                    newData[currentDate.year][division].playoffSchedule = playoffBracket.playoffSchedule;
                    newData[currentDate.year][division].status = 'gold-playoffs'; // Start with Gold playoffs
                    newData[currentDate.year][division].currentRound = 'Quarter-Final';
                    toast.success(`Nationals Group Stage Completed for ${division}! Playoffs begin!`);
                }
            } else if (tournament.status === 'silver-playoffs' || tournament.status === 'gold-playoffs') {
                const currentBracket = tournament.status === 'silver-playoffs' ? 'Silver' : 'Gold';
                const gamesToSimulate = tournament.playoffSchedule.filter(g =>
                    g.round === tournament.currentRound && g.bracket === currentBracket && g.status === 'scheduled'
                );

                gamesToSimulate.forEach(game => {
                    if (userGameResult && userGameResult.gameId === game.id) {
                        // User played this game, use their result
                        markGameAsCompleted(game.id, userGameResult.homeScore, userGameResult.awayScore, true, division);
                        const homeTeam = teams.find(t => t.name === userGameResult.homeTeamName);
                        const awayTeam = teams.find(t => t.name === userGameResult.awayTeamName);
                        if (homeTeam && awayTeam) {
                            const finalGameState: GameState = { userScore: userGameResult.homeScore, opponentScore: userGameResult.awayScore, userShots: 0, opponentShots: 0, gameLog: [], injuries: [], isGameOver: true, isPaused: false, period: 3, possessionHolder: null, powerPlayState: { isActive: false, teamOnPowerPlay: null, timeLeft: 0 }, time: 0 };
                            setTeams(prevTeams => prevTeams.map(t => {
                                if (t.name === homeTeam.name) return processGameResultsEngine(homeTeam, awayTeam, finalGameState, true).updatedUserTeam;
                                if (t.name === awayTeam.name) return processGameResultsEngine(awayTeam, homeTeam, { ...finalGameState, userScore: finalGameState.opponentScore, opponentScore: finalGameState.userScore }, true).updatedUserTeam;
                                return t;
                            }));
                        }
                    } else {
                        // Simulate AI vs AI games or user's game if not played manually
                        const homeTeamName = typeof game.homeTeam === 'string' ? game.homeTeam : game.homeTeam.winnerOf;
                        const awayTeamName = typeof game.awayTeam === 'string' ? game.awayTeam : game.awayTeam.winnerOf;

                        const homeTeam = teams.find(t => t.name === homeTeamName);
                        const awayTeam = teams.find(t => t.name === awayTeamName);

                        if (homeTeam && awayTeam) {
                            const finalGameState = simulateFullGame(homeTeam, awayTeam, false);
                            markGameAsCompleted(game.id, finalGameState.userScore, finalGameState.opponentScore, true, division);
                            setTeams(prevTeams => prevTeams.map(t => {
                                if (t.name === homeTeam.name) return processGameResultsEngine(homeTeam, awayTeam, finalGameState, true).updatedUserTeam;
                                if (t.name === awayTeam.name) return processGameResultsEngine(awayTeam, homeTeam, { ...finalGameState, userScore: finalGameState.opponentScore, opponentScore: finalGameState.userScore }, true).updatedUserTeam;
                                return t;
                            }));
                        }
                    }
                });

                // Determine next round or winner
                const allGamesCompletedInRound = gamesToSimulate.every(g => g.status === 'completed');
                if (allGamesCompletedInRound) {
                    if (tournament.currentRound === 'Quarter-Final') {
                        newData[currentDate.year][division].currentRound = 'Semi-Final';
                        toast.info(`Nationals ${currentBracket} Playoffs: Semi-Finals started for ${division}.`);
                    } else if (tournament.currentRound === 'Semi-Final') {
                        newData[currentDate.year][division].currentRound = 'Final';
                        toast.info(`Nationals ${currentBracket} Playoffs: Finals started for ${division}.`);
                    } else if (tournament.currentRound === 'Final') {
                        // Tournament completed for this bracket
                        const finalGame = gamesToSimulate[0]; // Should only be one final game
                        if (finalGame && finalGame.winner) {
                            if (currentBracket === 'Gold') {
                                newData[currentDate.year][division].winner = finalGame.winner;
                                newData[currentDate.year][division].status = 'completed';
                                toast.success(`Nationals ${division} Gold Champion: ${finalGame.winner}!`);
                            } else {
                                // Silver bracket completed, now check if Gold is done or if we need to transition
                                const goldTournament = newData[currentDate.year]?.[division];
                                if (goldTournament && goldTournament.status === 'gold-playoffs' && goldTournament.playoffSchedule.filter(g => g.bracket === 'Gold').every(g => g.status === 'completed')) {
                                    newData[currentDate.year][division].status = 'completed';
                                    toast.success(`Nationals ${division} Silver Champion: ${finalGame.winner}!`);
                                } else {
                                    // If Gold is not done, stay in gold-playoffs status
                                    toast.success(`Nationals ${division} Silver Champion: ${finalGame.winner}!`);
                                }
                            }
                        }
                    }
                }
            }
            return newData;
        });
    };

    const autoSimulateUserNationalsGame = (division: string, gameId: string) => {
        const tournament = nationalsData[currentDate.year]?.[division];
        if (!tournament) return;

        const game = tournament.playoffSchedule.find(g => g.id === gameId);
        if (!game) return;

        const homeTeamName = typeof game.homeTeam === 'string' ? game.homeTeam : game.homeTeam.winnerOf;
        const awayTeamName = typeof game.awayTeam === 'string' ? game.awayTeam : game.awayTeam.winnerOf;

        const homeTeam = teams.find(t => t.name === homeTeamName);
        const awayTeam = teams.find(t => t.name === awayTeamName);

        if (homeTeam && awayTeam) {
            const finalGameState = simulateFullGame(homeTeam, awayTeam, false);
            playNationalsRound(division, { homeTeamName: homeTeam.name, awayTeamName: awayTeam.name, homeScore: finalGameState.userScore, awayScore: finalGameState.opponentScore, gameId });
            toast.info("Nationals Game Auto-Simulated", { description: `${homeTeam.name} ${finalGameState.userScore} - ${awayTeam.name} ${finalGameState.opponentScore}` });
        }
    };

    const simulateSingleNationalsGame = (division: string, gameId: string) => {
        const tournament = nationalsData[currentDate.year]?.[division];
        if (!tournament) return;

        const game = tournament.playoffSchedule.find(g => g.id === gameId);
        if (!game) return;

        const homeTeamName = typeof game.homeTeam === 'string' ? game.homeTeam : game.homeTeam.winnerOf;
        const awayTeamName = typeof game.awayTeam === 'string' ? game.awayTeam : game.awayTeam.winnerOf;

        const homeTeam = teams.find(t => t.name === homeTeamName);
        const awayTeam = teams.find(t => t.name === awayTeamName);

        if (homeTeam && awayTeam) {
            const finalGameState = simulateFullGame(homeTeam, awayTeam, false);
            markGameAsCompleted(game.id, finalGameState.userScore, finalGameState.opponentScore, true, division);
            setTeams(prevTeams => prevTeams.map(t => {
                if (t.name === homeTeam.name) return processGameResultsEngine(homeTeam, awayTeam, finalGameState, true).updatedUserTeam;
                if (t.name === awayTeam.name) return processGameResultsEngine(awayTeam, homeTeam, { ...finalGameState, userScore: finalGameState.opponentScore, opponentScore: finalGameState.userScore }, true).updatedUserTeam;
                return t;
            }));
            toast.info("Nationals Game Simulated", { description: `${homeTeam.name} ${finalGameState.userScore} - ${awayTeam.name} ${finalGameState.opponentScore}` });
        }
    };

    const simulateFullNationalsTournament = (division: string) => {
        setNationalsData(prevData => {
            const newData = { ...prevData };
            const tournament = newData[currentDate.year]?.[division];
            if (!tournament) return newData;

            // Simulate group stage
            if (tournament.status === 'group-stage') {
                for (let round = typeof tournament.currentRound === 'number' ? tournament.currentRound : 1; round <= 3; round++) {
                    const gamesToSimulate = tournament.groupStageSchedule.filter(g =>
                        g.round === round && g.status === 'scheduled'
                    );
                    gamesToSimulate.forEach(game => {
                        const homeTeam = teams.find(t => t.name === game.homeTeam);
                        const awayTeam = teams.find(t => t.name === game.awayTeam);
                        if (homeTeam && awayTeam) {
                            const finalGameState = simulateFullGame(homeTeam, awayTeam, false);
                            markGameAsCompleted(game.id, finalGameState.userScore, finalGameState.opponentScore, true, division);
                            setTeams(prevTeams => prevTeams.map(t => {
                                if (t.name === homeTeam.name) return processGameResultsEngine(homeTeam, awayTeam, finalGameState, true).updatedUserTeam;
                                if (t.name === awayTeam.name) return processGameResultsEngine(awayTeam, homeTeam, { ...finalGameState, userScore: finalGameState.opponentScore, opponentScore: finalGameState.userScore }, true).updatedUserTeam;
                                return t;
                            }));
                        }
                    });
                    const allTeamNamesInTournament = tournament.groups.flatMap(group => group.teams);
                    const updatedTournament = createNationalsTournament(division, allTeamNamesInTournament, currentDate.year, tournament.groupStageSchedule);
                    newData[currentDate.year][division].groups = updatedTournament.groups;
                    newData[currentDate.year][division].currentRound = (round as number) + 1;
                }
                // Transition to playoffs
                const playoffBracket = generatePlayoffBracket(tournament.groups, currentDate);
                newData[currentDate.year][division].playoffSchedule = playoffBracket.playoffSchedule;
                newData[currentDate.year][division].status = 'gold-playoffs';
                newData[currentDate.year][division].currentRound = 'Quarter-Final';
            }

            // Simulate playoffs (Gold and Silver)
            const playoffRounds: ('Quarter-Final' | 'Semi-Final' | 'Final')[] = ['Quarter-Final', 'Semi-Final', 'Final'];
            const brackets: ('Gold' | 'Silver')[] = ['Gold', 'Silver'];

            for (const bracket of brackets) {
                for (const round of playoffRounds) {
                    const gamesToSimulate = newData[currentDate.year][division].playoffSchedule.filter(g =>
                        g.round === round && g.bracket === bracket && g.status === 'scheduled'
                    );
                    gamesToSimulate.forEach(game => {
                        const homeTeamName = typeof game.homeTeam === 'string' ? game.homeTeam : game.homeTeam.winnerOf;
                        const awayTeamName = typeof game.awayTeam === 'string' ? game.awayTeam : game.awayTeam.winnerOf;

                        const homeTeam = teams.find(t => t.name === homeTeamName);
                        const awayTeam = teams.find(t => t.name === awayTeamName);

                        if (homeTeam && awayTeam) {
                            const finalGameState = simulateFullGame(homeTeam, awayTeam, false);
                            markGameAsCompleted(game.id, finalGameState.userScore, finalGameState.opponentScore, true, division);
                            setTeams(prevTeams => prevTeams.map(t => {
                                if (t.name === homeTeam.name) return processGameResultsEngine(homeTeam, awayTeam, finalGameState, true).updatedUserTeam;
                                if (t.name === awayTeam.name) return processGameResultsEngine(awayTeam, homeTeam, { ...finalGameState, userScore: finalGameState.opponentScore, opponentScore: finalGameState.userScore }, true).updatedUserTeam;
                                return t;
                            }));
                        }
                    });
                    newData[currentDate.year][division].currentRound = round; // Update current round for display
                }
            }
            newData[currentDate.year][division].status = 'completed';
            return newData;
        });
        toast.success(`Nationals ${division} Tournament Simulated!`);
    };

    const simulateAllNationalsTournaments = () => {
        const currentYearNationals = nationalsData[currentDate.year];
        if (currentYearNationals) {
            Object.keys(currentYearNationals).forEach(division => {
                simulateFullNationalsTournament(division);
            });
        }
        toast.success("All Nationals Tournaments Simulated!");
    };

    const saveGame = (saveName: string) => {
        const saveSlot: SaveGameSlot = {
            saveName,
            savedAt: new Date().toLocaleString(),
            userTeamName: activeTeamName || 'No Team Selected',
            currentDate: currentDate,
        };

        localStorage.setItem(`save_${saveName}`, JSON.stringify({
            teams,
            scoutingPool,
            recruitedPool,
            fairHosted,
            transferPool,
            currentDate,
            developmentHistory,
            activeTeamName,
            managedOrganization,
            isManagingOrg,
            schedule,
            nationalsData,
            seasonRecords,
            careerRecords,
            alumni,
            seasonHistory,
        }));

        setSavedGames(prev => {
            const existingIndex = prev.findIndex(s => s.saveName === saveName);
            if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = saveSlot;
                localStorage.setItem('savedGamesList', JSON.stringify(updated));
                return updated;
            } else {
                const updated = [...prev, saveSlot];
                localStorage.setItem('savedGamesList', JSON.stringify(updated));
                return updated;
            }
        });
        toast.success(`Game "${saveName}" saved!`);
    };

    const loadGame = (saveName: string) => {
        try {
            const savedData = localStorage.getItem(`save_${saveName}`);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                setTeams(parsedData.teams);
                setScoutingPool(parsedData.scoutingPool);
                setRecruitedPool(parsedData.recruitedPool);
                setFairHosted(parsedData.fairHosted);
                setTransferPool(parsedData.transferPool);
                setCurrentDate(parsedData.currentDate);
                setDevelopmentHistory(parsedData.developmentHistory);
                setActiveTeamName(parsedData.activeTeamName);
                setManagedOrganization(parsedData.managedOrganization);
                setIsManagingOrg(parsedData.isManagingOrg);
                setSchedule(parsedData.schedule);
                setNationalsData(parsedData.nationalsData);
                setSeasonRecords(parsedData.seasonRecords);
                setCareerRecords(parsedData.careerRecords);
                setAlumni(parsedData.alumni);
                setSeasonHistory(parsedData.seasonHistory);
                toast.success(`Game "${saveName}" loaded successfully!`);
            } else {
                toast.error(`Save game "${saveName}" not found.`);
            }
        } catch (error) {
            console.error("Failed to load game:", error);
            toast.error("Failed to load game. Data might be corrupted.");
        }
    };

    const deleteGame = (saveName: string) => {
        localStorage.removeItem(`save_${saveName}`);
        setSavedGames(prev => {
            const updated = prev.filter(s => s.saveName !== saveName);
            localStorage.setItem('savedGamesList', JSON.stringify(updated));
            return updated;
        });
        toast.success(`Game "${saveName}" deleted.`);
    };

    const exitToMainMenu = () => {
        // Clear all game-specific local storage items
        localStorage.removeItem('teams');
        localStorage.removeItem('scoutingPool');
        localStorage.removeItem('recruitedPool');
        localStorage.removeItem('fairHosted');
        localStorage.removeItem('transferPool');
        localStorage.removeItem('currentDate');
        localStorage.removeItem('developmentHistory');
        localStorage.removeItem('activeTeamName');
        localStorage.removeItem('managedOrganization');
        localStorage.removeItem('isManagingOrg');
        localStorage.removeItem('schedule');
        localStorage.removeItem('nationalsData');
        localStorage.removeItem('seasonRecords');
        localStorage.removeItem('careerRecords');
        localStorage.removeItem('alumni');
        localStorage.removeItem('seasonHistory');
        // Do NOT remove 'savedGamesList' as it tracks all save slots

        // Reset all state variables to initial values
        setTeams(initialTeams);
        setScoutingPool([]);
        setRecruitedPool([]);
        setFairHosted(false);
        setTransferPool([]);
        setCurrentDate({ month: 'August', week: 1, year: new Date().getFullYear() });
        setDevelopmentHistory([]);
        setActiveTeamName(null);
        setManagedOrganization(null);
        setIsManagingOrg(false);
        setSchedule([]);
        setNationalsData({});
        setSeasonRecords({});
        setCareerRecords({});
        setAlumni([]);
        setSeasonHistory({});

        toast.info("Exited to Main Menu.");
    };

    return (
        <TeamContext.Provider value={{
            teams,
            updateTeam,
            userTeam,
            organizationFinancials,
            organizationFacilities,
            selectTeam,
            scoutingPool,
            recruitedPool,
            transferPool,
            fairHosted,
            generateScoutingPool,
            recruitPlayer,
            assignPlayerToRoster,
            discardRecruit,
            updateBudgetAllocations,
            runStudentLifeInitiative,
            startFacilityProject,
            currentDate,
            advanceWeek,
            developmentHistory,
            updatePlayerTrainingFocus,
            autoAssignTrainingFocuses,
            processGameResults,
            movePlayer,
            requestPlayerTransfer,
            managedOrganization,
            isManagingOrg,
            managedTeams,
            selectOrganization,
            setActiveTeam,
            schedule,
            gameForCurrentWeek,
            nationalsData,
            markGameAsCompleted,
            seasonRecords,
            careerRecords,
            alumni,
            playNationalsRound,
            autoSimulateUserNationalsGame,
            seasonHistory,
            simulateFullNationalsTournament,
            simulateSingleNationalsGame,
            simulateAllNationalsTournaments,
            saveGame,
            loadGame,
            deleteGame,
            exitToMainMenu,
            savedGames,
        }}>
            {children}
        </TeamContext.Provider>
    );
};