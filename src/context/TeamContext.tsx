import { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Team, Player, BudgetAllocations, SkaterAttributes, GoalieAttributes, DevelopmentLog, TrainingFocus, GameState, FacilityProject, BudgetCategory, Financials, ScheduleEntry, GameDate, PlayerSeasonStats, RecordCategory, TeamRecord, NationalsPlayoffMatch, SeasonHistory, TeamSeasonHistory, SaveGameSlot } from '@/types';
import { teams as initialTeams, getTeamOrganizations, getOrganizationName } from '@/data/teams';
import { generateRecruits, generatePlayer, calculateStarRating } from '@/lib/playerGenerator';
import { toast } from 'sonner';
import { calculateCurrentAbility } from '@/lib/playerGenerator';
import { trainingFocusesMap } from '@/data/trainingFocuses';
import { skaterFocuses, goalieFocuses } from '@/data/trainingFocuses';
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

    // New state for current season's best performances
    const [currentSeasonStatsAccumulator, setCurrentSeasonStatsAccumulator] = useState<{ [key in RecordCategory]?: TeamRecord }>(() => {
        try { const saved = localStorage.getItem('currentSeasonStatsAccumulator'); return saved ? JSON.parse(saved) : {}; } catch (error) { return {}; }
    });

    useEffect(() => { localStorage.setItem('currentSeasonStatsAccumulator', JSON.stringify(currentSeasonStatsAccumulator)); }, [currentSeasonStatsAccumulator]);


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

    const updateGameRecords = (
        homeTeam: Team, 
        awayTeam: Team, 
        currentSeasonAccumulator: { [key in RecordCategory]?: TeamRecord }, 
        careerRecordsAccumulator: { [key in RecordCategory]?: TeamRecord }
    ) => {
        const allPlayers = [...homeTeam.roster, ...awayTeam.roster];
        
        allPlayers.forEach(player => {
            const isSkater = !player.positions.includes('G');
            const season = `${currentDate.year}-${currentDate.year + 1}`;

            const playerCurrentSeasonStats = player.currentStats.find(s => s.season === season && s.team === (homeTeam.roster.some(p => p.id === player.id) ? homeTeam.name : awayTeam.name));
            if (!playerCurrentSeasonStats) return; 

            if (isSkater) {
                if ((playerCurrentSeasonStats.goals || 0) > (currentSeasonAccumulator['Goals']?.value || 0)) {
                    currentSeasonAccumulator['Goals'] = { playerName: player.name, teamName: playerCurrentSeasonStats.team, value: playerCurrentSeasonStats.goals || 0, season, gamesPlayed: playerCurrentSeasonStats.gamesPlayed };
                }
                if ((playerCurrentSeasonStats.assists || 0) > (currentSeasonAccumulator['Assists']?.value || 0)) {
                    currentSeasonAccumulator['Assists'] = { playerName: player.name, teamName: playerCurrentSeasonStats.team, value: playerCurrentSeasonStats.assists || 0, season, gamesPlayed: playerCurrentSeasonStats.gamesPlayed };
                }
                if ((playerCurrentSeasonStats.points || 0) > (currentSeasonAccumulator['Points']?.value || 0)) {
                    currentSeasonAccumulator['Points'] = { playerName: player.name, teamName: playerCurrentSeasonStats.team, value: playerCurrentSeasonStats.points || 0, season, gamesPlayed: playerCurrentSeasonStats.gamesPlayed };
                }
                if ((playerCurrentSeasonStats.penaltyMinutes || 0) > (currentSeasonAccumulator['PenaltyMinutes']?.value || 0)) {
                    currentSeasonAccumulator['PenaltyMinutes'] = { playerName: player.name, teamName: playerCurrentSeasonStats.team, value: playerCurrentSeasonStats.penaltyMinutes || 0, season, gamesPlayed: playerCurrentSeasonStats.gamesPlayed };
                }
            } else { // Goalie stats
                if (playerCurrentSeasonStats.gamesPlayed >= 5) {
                    if (!currentSeasonAccumulator['GAA'] || ((playerCurrentSeasonStats.goalsAgainstAverage || 99) < (currentSeasonAccumulator['GAA']?.value || 99) && (playerCurrentSeasonStats.goalsAgainstAverage || 99) > 0)) {
                        currentSeasonAccumulator['GAA'] = { playerName: player.name, teamName: playerCurrentSeasonStats.team, value: playerCurrentSeasonStats.goalsAgainstAverage || 99, season, gamesPlayed: playerCurrentSeasonStats.gamesPlayed };
                    }
                    if ((playerCurrentSeasonStats.savePercentage || 0) > (currentSeasonAccumulator['SavePercentage']?.value || 0)) {
                        currentSeasonAccumulator['SavePercentage'] = { playerName: player.name, teamName: playerCurrentSeasonStats.team, value: playerCurrentSeasonStats.savePercentage || 0, season, gamesPlayed: playerCurrentSeasonStats.gamesPlayed };
                    }
                }
                if ((playerCurrentSeasonStats.shutouts || 0) > (currentSeasonAccumulator['Shutouts']?.value || 0)) {
                    currentSeasonAccumulator['Shutouts'] = { playerName: player.name, teamName: playerCurrentSeasonStats.team, value: playerCurrentSeasonStats.shutouts || 0, season, gamesPlayed: playerCurrentSeasonStats.gamesPlayed };
                }
            }
            
            const careerGoals = (player.history?.reduce((acc, s) => acc + (s.goals || 0), 0) || 0) + (playerCurrentSeasonStats.goals || 0);
            if (careerGoals > (careerRecordsAccumulator['Goals']?.value || 0)) careerRecordsAccumulator['Goals'] = { playerName: player.name, teamName: playerCurrentSeasonStats.team, value: careerGoals };
            const careerAssists = (player.history?.reduce((acc, s) => acc + (s.assists || 0), 0) || 0) + (playerCurrentSeasonStats.assists || 0);
            if (careerAssists > (careerRecordsAccumulator['Assists']?.value || 0)) careerRecordsAccumulator['Assists'] = { playerName: player.name, teamName: playerCurrentSeasonStats.team, value: careerAssists };
            const careerPoints = (player.history?.reduce((acc, s) => acc + (s.points || 0), 0) || 0) + (playerCurrentSeasonStats.points || 0);
            if (careerPoints > (careerRecordsAccumulator['Points']?.value || 0)) careerRecordsAccumulator['Points'] = { playerName: player.name, teamName: playerCurrentSeasonStats.team, value: careerPoints };
            const careerPims = (player.history?.reduce((acc, s) => acc + (s.penaltyMinutes || 0), 0) || 0) + (playerCurrentSeasonStats.penaltyMinutes || 0);
            if (careerPims > (careerRecordsAccumulator['PenaltyMinutes']?.value || 0)) careerRecordsAccumulator['PenaltyMinutes'] = { playerName: player.name, teamName: playerCurrentSeasonStats.team, value: careerPims };
            const careerShutouts = (player.history?.reduce((acc, s) => acc + (s.shutouts || 0), 0) || 0) + (playerCurrentSeasonStats.shutouts || 0);
            if (careerShutouts > (careerRecordsAccumulator['Shutouts']?.value || 0)) careerRecordsAccumulator['Shutouts'] = { playerName: player.name, teamName: playerCurrentSeasonStats.team, value: careerShutouts };
        });
    };

    const _runNationalsRoundSimulation = (
        tournamentToUpdate: NationalsTournament,
        teamsToUpdate: Team[],
        currentSeasonAccumulator: { [key in RecordCategory]?: TeamRecord },
        careerRecordsAccumulator: { [key in RecordCategory]?: TeamRecord },
        userGameResult?: { homeTeamName: string, awayTeamName: string, homeScore: number, awayScore: number, gameId: string }
    ) => {
        let tournament = tournamentToUpdate;
        let tempTeams = teamsToUpdate;

        if (tournament.status === 'group-stage') {
            const gamesToSim = tournament.groupStageSchedule.filter((g: ScheduleEntry) => g.round === tournament.currentRound && g.status === 'scheduled');
            
            if (userGameResult) {
                const userGame = gamesToSim.find(g => g.id === userGameResult.gameId);
                if (userGame) {
                    userGame.status = 'completed';
                    userGame.result = { homeScore: userGameResult.homeScore, awayScore: userGameResult.awayScore };
                }
            }

            gamesToSim.forEach((game: ScheduleEntry) => {
                if (game.status === 'completed') return;
                const homeTeam = tempTeams.find((t: Team) => t.name === game.homeTeam);
                const awayTeam = tempTeams.find((t: Team) => t.name === game.awayTeam);

                if (homeTeam && awayTeam) {
                    const finalGameState = simulateFullGame(homeTeam, awayTeam, true);
                    const season = `${tournament.year}-${tournament.year + 1}`; // Use tournament year for season
                    const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, season, true);
                    tempTeams = tempTeams.map((t: Team) => {
                        if (t.name === homeTeam.name) return updatedHomeTeam;
                        if (t.name === awayTeam.name) return updatedAwayTeam;
                        return t;
                    });
                    game.status = 'completed';
                    game.result = { homeScore: finalGameState.userScore, awayScore: finalGameState.opponentScore };
                    updateGameRecords(updatedHomeTeam, updatedAwayTeam, currentSeasonAccumulator, careerRecordsAccumulator);
                }
            });
    
            tournament.groups.forEach((group: any) => {
                group.standings.forEach((standing: any) => {
                    const teamGames = tournament.groupStageSchedule.filter((g: ScheduleEntry) => (g.homeTeam === standing.teamName || g.awayTeam === standing.teamName) && g.round === tournament.currentRound && g.result);
                    teamGames.forEach((game: ScheduleEntry) => {
                        standing.played++;
                        const isHome = game.homeTeam === standing.teamName;
                        const homeScore = game.result!.homeScore;
                        const awayScore = game.result!.awayScore;
                        standing.goalsFor += isHome ? homeScore : awayScore;
                        standing.goalsAgainst += isHome ? awayScore : homeScore;
                        if (homeScore === awayScore) { standing.draws++; standing.points++; }
                        else if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) { standing.wins++; standing.points += 3; }
                        else { standing.losses++; }
                    });
                });
            });
    
            const allGamesInCurrentRoundCompleted = tournament.groupStageSchedule
                .filter(g => g.round === tournament.currentRound)
                .every(g => g.status === 'completed');

            if (allGamesInCurrentRoundCompleted) {
                // Ensure currentRound is treated as a number for incrementing in group stage
                if (typeof tournament.currentRound === 'number') {
                    tournament.currentRound += 1;
                } else {
                    // This branch indicates an inconsistent state:
                    // status is 'group-stage' but currentRound is a string literal.
                    // Log a warning and reset to a valid numeric round.
                    console.warn(`Inconsistent state: Tournament ${tournament.division} (Year ${tournament.year}) is in group-stage but currentRound is '${tournament.currentRound}'. Resetting to 1.`);
                    tournament.currentRound = 1; // Reset to a valid numeric round
                    tournament.currentRound += 1; // Then increment
                }
                toast.info(`Round ${typeof tournament.currentRound === 'number' ? tournament.currentRound - 1 : 'N/A'} of group stage completed for ${tournament.division}. Advancing to Round ${tournament.currentRound}.`);
            }
            
            const allGroupGamesCompletedOverall = tournament.groupStageSchedule.every((g: ScheduleEntry) => g.status === 'completed');
            if (allGroupGamesCompletedOverall) {
                toast.success(`Group stage for ${tournament.division} has concluded!`, { description: "Playoff matchups will now be generated." });
                tournament.playoffSchedule = generatePlayoffBracket(tournament.groups, tournament.groupStageSchedule[0].date);
                
                const silverPlayoffExists = tournament.playoffSchedule.some((m: NationalsPlayoffMatch) => m.bracket === 'Silver');

                if (silverPlayoffExists) {
                    tournament.status = 'silver-playoffs';
                    const firstSilverRound = tournament.playoffSchedule.find((m: NationalsPlayoffMatch) => m.bracket === 'Silver')?.round || 'Final';
                    tournament.currentRound = firstSilverRound as 'Preliminary' | 'Quarter-Final' | 'Semi-Final' | 'Final';
                    toast.info(`The ${tournament.division} Silver Playoffs will now begin.`);
                } else {
                    tournament.status = 'gold-playoffs';
                    const firstGoldRound = tournament.playoffSchedule.find((m: NationalsPlayoffMatch) => m.bracket === 'Gold')?.round || 'Final';
                    tournament.currentRound = firstGoldRound as 'Preliminary' | 'Quarter-Final' | 'Semi-Final' | 'Final';
                    toast.info(`The ${tournament.division} Gold Playoffs will now begin.`);
                }

                if (tournament.playoffSchedule.length === 0) {
                    tournament.status = 'completed';
                    toast.info(`${tournament.division} tournament has concluded as no playoffs could be generated.`);
                }
            }
        } else if (tournament.status === 'silver-playoffs' || tournament.status === 'gold-playoffs') {
            const currentBracket = tournament.status === 'silver-playoffs' ? 'Silver' : 'Gold';

            const getWinner = (match: NationalsPlayoffMatch): string | undefined => {
                if (!match.result) return undefined;
                if (match.result.homeScore > match.result.awayScore) return typeof match.homeTeam === 'string' ? match.homeTeam : undefined;
                if (match.result.awayScore > match.result.homeScore) return typeof match.awayTeam === 'string' ? match.awayTeam : undefined;
                return Math.random() > 0.5 ? (typeof match.homeTeam === 'string' ? match.homeTeam : undefined) : (typeof match.awayTeam === 'string' ? match.awayTeam : undefined);
            };

            const allPlayoffGames = tournament.playoffSchedule as NationalsPlayoffMatch[];
            
            allPlayoffGames.forEach((game: NationalsPlayoffMatch) => {
                if (game.bracket === currentBracket && game.round === tournament.currentRound && game.status === 'scheduled') {
                    if (typeof game.homeTeam !== 'string') {
                        const feederMatch = allPlayoffGames.find(m => m.id === (game.homeTeam as { winnerOf: string }).winnerOf);
                        if (feederMatch && feederMatch.status === 'completed') {
                            game.homeTeam = getWinner(feederMatch) || 'TBD';
                        }
                    }
                    if (typeof game.awayTeam !== 'string') {
                        const feederMatch = allPlayoffGames.find(m => m.id === (game.awayTeam as { winnerOf: string }).winnerOf);
                        if (feederMatch && feederMatch.status === 'completed') {
                            game.awayTeam = getWinner(feederMatch) || 'TBD';
                        }
                    }
                }
            });

            const gamesToSim = allPlayoffGames.filter((g: NationalsPlayoffMatch) => g.bracket === currentBracket && g.round === tournament.currentRound && g.status === 'scheduled');

            if (userGameResult) {
                const userGame = gamesToSim.find(g => g.id === userGameResult.gameId);
                if (userGame) {
                    userGame.status = 'completed';
                    userGame.result = { homeScore: userGameResult.homeScore, awayScore: userGameResult.awayScore };
                    userGame.winner = getWinner(userGame);
                }
            }

            gamesToSim.forEach((game: NationalsPlayoffMatch) => {
                if (game.status === 'completed') return; // Already completed by userGameResult
                
                const homeTeamName = typeof game.homeTeam === 'string' ? game.homeTeam : undefined;
                const awayTeamName = typeof game.awayTeam === 'string' ? game.awayTeam : undefined;

                if (homeTeamName && awayTeamName) {
                    const homeTeam = tempTeams.find((t: Team) => t.name === homeTeamName);
                    const awayTeam = tempTeams.find((t: Team) => t.name === awayTeamName);

                    if (homeTeam && awayTeam) {
                        const finalGameState = simulateFullGame(homeTeam, awayTeam, true); // isNationals = true
                        const season = `${tournament.year}-${tournament.year + 1}`; // Use tournament year for season
                        const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, season, true);
                        
                        tempTeams = tempTeams.map((t: Team) => {
                            if (t.name === homeTeam.name) return updatedHomeTeam;
                            if (t.name === awayTeam.name) return updatedAwayTeam;
                            return t;
                        });
                        game.status = 'completed';
                        game.result = { homeScore: finalGameState.userScore, awayScore: finalGameState.opponentScore };
                        game.winner = getWinner(game);
                        updateGameRecords(updatedHomeTeam, updatedAwayTeam, currentSeasonAccumulator, careerRecordsAccumulator);
                    }
                }
            });

            const allGamesInCurrentPlayoffRoundCompleted = allPlayoffGames
                .filter(g => g.bracket === currentBracket && g.round === tournament.currentRound)
                .every(g => g.status === 'completed');

            if (allGamesInCurrentPlayoffRoundCompleted) {
                const currentRoundIndex = ['Preliminary', 'Quarter-Final', 'Semi-Final', 'Final'].indexOf(tournament.currentRound as string);
                if (currentRoundIndex !== -1 && currentRoundIndex < 3) { // Not the Final
                    tournament.currentRound = ['Preliminary', 'Quarter-Final', 'Semi-Final', 'Final'][currentRoundIndex + 1] as 'Preliminary' | 'Quarter-Final' | 'Semi-Final' | 'Final';
                    toast.info(`Round ${currentRoundIndex + 1} of ${currentBracket} playoffs completed for ${tournament.division}. Advancing to ${tournament.currentRound}.`);
                } else { // Final round completed
                    tournament.status = 'completed';
                    const finalGame = allPlayoffGames.find(g => g.bracket === currentBracket && g.round === 'Final');
                    if (finalGame && finalGame.winner) {
                        tournament.winner = finalGame.winner;
                        toast.success(`${tournament.division} ${currentBracket} Playoffs concluded! ${finalGame.winner} are the champions!`);
                    } else {
                        toast.info(`${tournament.division} ${currentBracket} Playoffs concluded.`);
                    }

                    if (currentBracket === 'Silver' && tournament.playoffSchedule.some(m => m.bracket === 'Gold')) {
                        tournament.status = 'gold-playoffs';
                        const firstGoldRound = tournament.playoffSchedule.find((m: NationalsPlayoffMatch) => m.bracket === 'Gold')?.round || 'Final';
                        tournament.currentRound = firstGoldRound as 'Preliminary' | 'Quarter-Final' | 'Semi-Final' | 'Final';
                        toast.info(`The ${tournament.division} Gold Playoffs will now begin.`);
                    }
                }
            }
        }
        return { updatedTournament: tournament, updatedTeams: tempTeams };
    };

    const playNationalsRound = (division: string, userGameResult?: { homeTeamName: string, awayTeamName: string, homeScore: number, awayScore: number, gameId: string }) => {
        let tempCurrentSeasonStats = JSON.parse(JSON.stringify(currentSeasonStatsAccumulator));
        let tempCareerStats = JSON.parse(JSON.stringify(careerRecords));
        
        setNationalsData(prevData => {
            const currentYear = currentDate.year;
            const newNationalsData = { ...prevData };
            if (!newNationalsData[currentYear] || !newNationalsData[currentYear][division]) {
                toast.error("Nationals tournament not found for this division and year.");
                return prevData;
            }

            let tournament = { ...newNationalsData[currentYear][division] };
            let tempTeams = [...teams];

            const { updatedTournament, updatedTeams } = _runNationalsRoundSimulation(tournament, tempTeams, tempCurrentSeasonStats, tempCareerStats, userGameResult);

            newNationalsData[currentYear][division] = updatedTournament;
            setTeams(updatedTeams);
            return newNationalsData;
        });

        setCurrentSeasonStatsAccumulator(tempCurrentSeasonStats);
        setCareerRecords(tempCareerStats);
    };

    const autoSimulateUserNationalsGame = (division: string, gameId: string) => {
        if (!userTeam) return;
        const currentYearNationals = nationalsData[currentDate.year];
        if (!currentYearNationals || !currentYearNationals[division]) return;

        const tournament = currentYearNationals[division];
        const gamesToCheck = tournament.status === 'group-stage' 
            ? tournament.groupStageSchedule 
            : tournament.playoffSchedule;

        const userGame = gamesToCheck.find(g => g.id === gameId);

        if (userGame) {
            const homeTeamName = typeof userGame.homeTeam === 'string' ? userGame.homeTeam : (userGame.homeTeam as { winnerOf: string }).winnerOf;
            const awayTeamName = typeof userGame.awayTeam === 'string' ? userGame.awayTeam : (userGame.awayTeam as { winnerOf: string }).winnerOf;

            const homeTeam = teams.find(t => t.name === homeTeamName);
            const awayTeam = teams.find(t => t.name === awayTeamName);

            if (homeTeam && awayTeam) {
                const finalGameState = simulateFullGame(homeTeam, awayTeam, true);
                toast.info("Nationals Game Auto-Simulated", { description: `${homeTeam.name} ${finalGameState.userScore} - ${awayTeam.name} ${finalGameState.opponentScore}` });
                
                const completedGame = {
                    gameId: gameId, 
                    homeScore: finalGameState.userScore,
                    awayScore: finalGameState.opponentScore,
                    homeTeamName: homeTeam.name,
                    awayTeamName: awayTeam.name,
                };
                playNationalsRound(division, completedGame);
            }
        }
    };

    const simulateSingleNationalsGame = (division: string, gameId: string) => {
        let tempCurrentSeasonStats = JSON.parse(JSON.stringify(currentSeasonStatsAccumulator));
        let tempCareerStats = JSON.parse(JSON.stringify(careerRecords));

        setNationalsData(prevData => {
            const currentYear = currentDate.year;
            const newNationalsData = { ...prevData };
            if (!newNationalsData[currentYear] || !newNationalsData[currentYear][division]) {
                toast.error("Nationals tournament not found for this division and year.");
                return prevData;
            }

            let tournament = { ...newNationalsData[currentYear][division] };
            let tempTeams = [...teams];

            const gamesToCheck = tournament.status === 'group-stage' 
                ? tournament.groupStageSchedule 
                : tournament.playoffSchedule;

            const gameToSim = gamesToCheck.find(g => g.id === gameId);

            if (gameToSim && gameToSim.status === 'scheduled') {
                const homeTeamName = typeof gameToSim.homeTeam === 'string' ? gameToSim.homeTeam : (gameToSim.homeTeam as { winnerOf: string }).winnerOf;
                const awayTeamName = typeof gameToSim.awayTeam === 'string' ? gameToSim.awayTeam : (gameToSim.awayTeam as { winnerOf: string }).winnerOf;

                const homeTeam = tempTeams.find(t => t.name === homeTeamName);
                const awayTeam = tempTeams.find(t => t.name === awayTeamName);

                if (homeTeam && awayTeam) {
                    const finalGameState = simulateFullGame(homeTeam, awayTeam, true);
                    const season = `${tournament.year}-${tournament.year + 1}`;
                    const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, season, true);
                    
                    tempTeams = tempTeams.map((t: Team) => {
                        if (t.name === homeTeam.name) return updatedHomeTeam;
                        if (t.name === awayTeam.name) return updatedAwayTeam;
                        return t;
                    });
                    gameToSim.status = 'completed';
                    gameToSim.result = { homeScore: finalGameState.userScore, awayScore: finalGameState.opponentScore };
                    if ('winner' in gameToSim) { // For playoff matches
                        (gameToSim as NationalsPlayoffMatch).winner = (finalGameState.userScore > finalGameState.opponentScore ? homeTeamName : awayTeamName);
                    }
                    setTeams(tempTeams);
                    updateGameRecords(updatedHomeTeam, updatedAwayTeam, tempCurrentSeasonStats, tempCareerStats);
                    toast.info("Game Simulated", { description: `${homeTeam.name} ${finalGameState.userScore} - ${awayTeam.name} ${finalGameState.opponentScore}` });
                }
            }
            newNationalsData[currentYear][division] = tournament;
            return newNationalsData;
        });

        setCurrentSeasonStatsAccumulator(tempCurrentSeasonStats);
        setCareerRecords(tempCareerStats);
    };

    const simulateFullNationalsTournament = (division: string) => {
        let tempCurrentSeasonStats = JSON.parse(JSON.stringify(currentSeasonStatsAccumulator));
        let tempCareerStats = JSON.parse(JSON.stringify(careerRecords));

        setNationalsData(prevData => {
            const currentYear = currentDate.year;
            const newNationalsData = { ...prevData };
            if (!newNationalsData[currentYear] || !newNationalsData[currentYear][division]) {
                toast.error("Nationals tournament not found for this division and year.");
                return prevData;
            }

            let tournament = { ...newNationalsData[currentYear][division] };
            let tempTeams = [...teams];

            while (tournament.status !== 'completed') {
                const { updatedTournament, updatedTeams } = _runNationalsRoundSimulation(tournament, tempTeams, tempCurrentSeasonStats, tempCareerStats);
                tournament = updatedTournament;
                tempTeams = updatedTeams;
            }
            newNationalsData[currentYear][division] = tournament;
            setTeams(tempTeams);
            toast.success(`Full Nationals Tournament for ${division} simulated!`);
            return newNationalsData;
        });

        setCurrentSeasonStatsAccumulator(tempCurrentSeasonStats);
        setCareerRecords(tempCareerStats);
    };

    const simulateAllNationalsTournaments = () => {
        let tempCurrentSeasonStats = JSON.parse(JSON.stringify(currentSeasonStatsAccumulator));
        let tempCareerStats = JSON.parse(JSON.stringify(careerRecords));

        setNationalsData(prevData => {
            const currentYear = currentDate.year;
            const newNationalsData = { ...prevData };
            if (!newNationalsData[currentYear]) {
                toast.error("No Nationals tournaments found for the current year.");
                return prevData;
            }

            let tempTeams = [...teams];
            for (const division in newNationalsData[currentYear]) {
                let tournament = { ...newNationalsData[currentYear][division] };
                while (tournament.status !== 'completed') {
                    const { updatedTournament, updatedTeams } = _runNationalsRoundSimulation(tournament, tempTeams, tempCurrentSeasonStats, tempCareerStats);
                    tournament = updatedTournament;
                    tempTeams = updatedTeams;
                }
                newNationalsData[currentYear][division] = tournament;
            }
            setTeams(tempTeams);
            toast.success("All Nationals Tournaments simulated!");
            return newNationalsData;
        });

        setCurrentSeasonStatsAccumulator(tempCurrentSeasonStats);
        setCareerRecords(tempCareerStats);
    };

    // Helper function to compare and update all-time season records
    const compareAndSetSeasonRecords = (
        currentSeasonBests: { [key in RecordCategory]?: TeamRecord },
        allTimeRecords: { [key in RecordCategory]?: TeamRecord }
    ): { [key in RecordCategory]?: TeamRecord } => {
        const updatedRecords = { ...allTimeRecords };

        for (const category in currentSeasonBests) {
            const cat = category as RecordCategory;
            const currentBest = currentSeasonBests[cat];
            const allTimeBest = allTimeRecords[cat];

            if (!currentBest) continue;

            let isNewRecord = false;
            if (cat === 'GAA') {
                if (!allTimeBest || (currentBest.value < allTimeBest.value && currentBest.value > 0 && currentBest.gamesPlayed && currentBest.gamesPlayed >= 5)) {
                    isNewRecord = true;
                }
            } else if (cat === 'SavePercentage') {
                if (!allTimeBest || (currentBest.value > allTimeBest.value && currentBest.gamesPlayed && currentBest.gamesPlayed >= 5)) {
                    isNewRecord = true;
                }
            } else {
                if (!allTimeBest || currentBest.value > allTimeBest.value) {
                    isNewRecord = true;
                }
            }

            if (isNewRecord) {
                updatedRecords[cat] = currentBest;
                toast.success("NEW SEASON RECORD!", {
                    description: `${currentBest.playerName} (${currentBest.teamName}) set a new season record for ${cat} with ${currentBest.value} in ${currentBest.season}!`
                });
            }
        }
        return updatedRecords;
    };

    const advanceWeek = () => {
        // Lineup check for game weeks
        if (gameForCurrentWeek && userTeam) {
            const validationError = validateLineup(userTeam);
            if (validationError) {
                toast.error("Cannot Advance Week: Invalid Lineup", {
                    description: validationError,
                });
                return;
            }
        }

        let tempTeams = JSON.parse(JSON.stringify(teams)) as Team[];
        
        const allOrgs = getTeamOrganizations();
        const aiOrgs = allOrgs.filter(org => org.name !== managedOrganization);

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

        let tempCareerRecords = JSON.parse(JSON.stringify(careerRecords)) as { [key in RecordCategory]?: TeamRecord };
        let tempNationalsData = JSON.parse(JSON.stringify(nationalsData)) as { [year: number]: { [division: string]: NationalsTournament } };
        let tempCurrentSeasonStatsAccumulator = JSON.parse(JSON.stringify(currentSeasonStatsAccumulator)) as { [key in RecordCategory]?: TeamRecord };
        let tempSeasonRecords = JSON.parse(JSON.stringify(seasonRecords));


        if (currentDate.month === 'May' && currentDate.week === 4) {
            const allTournamentsCompleted = Object.values(tempNationalsData[currentYear] || {}).every(t => t.status === 'completed');
            if (!allTournamentsCompleted) {
                toast.error("Nationals In Progress", { description: "You must complete the National Championships before advancing the week." });
                return;
            }
        }

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

                const season = `${currentDate.year}-${currentDate.year + 1}`;
                const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, season, false);
                tempTeams[homeTeamIndex] = updatedHomeTeam;
                tempTeams[awayTeamIndex] = updatedAwayTeam;
                updateGameRecords(updatedHomeTeam, updatedAwayTeam, tempCurrentSeasonStatsAccumulator, tempCareerRecords); // Pass accumulators
            });
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

                    const regression = (Math.random() * 0.1) + 0.02; 
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
                    const paGap = player.potentialAbility - player.currentAbility;
                    if (player.age < 33 && paGap > 0 && (player as Player).morale !== 'Angry') {
                        const devRate = (player.attributes.developmentRate || 10);
                        const professionalism = (player.attributes.professionalism || 10);
                        const determination = (player.attributes.determination || 10);
                        const coachability = (player.attributes.coachability || 10);
                        const baseDevChance = 0.2;
                        const paBonus = Math.max(0, paGap / 50);
                        const workEthicBonus = (professionalism + determination - 20) / 100;
                        const coachabilityBonus = (coachability - 10) / 100;
                        const devChance = baseDevChance + paBonus + workEthicBonus + coachabilityBonus;
                        if (Math.random() < devChance) {
                            let attributesToDevelop: (keyof SkaterAttributes | keyof GoalieAttributes)[] = [];
                            if ((player as Player).trainingFocus && trainingFocusesMap[(player as Player).trainingFocus]) {
                                attributesToDevelop = trainingFocusesMap[(player as Player).trainingFocus];
                            } else {
                                const allAttrs = Object.keys(player.attributes).filter(attr => !['aging', 'injuryProneness', 'passShootTendency', 'mood', 'controversy', 'greed', 'loyalty', 'handleCritics', 'handleFailure', 'handleSuccess', 'sportsmanship', 'ambition', 'bigGames', 'coachability', 'intelligence'].includes(attr)) as (keyof typeof player.attributes)[];
                                if (allAttrs.length > 0) attributesToDevelop.push(getRandomItem(allAttrs));
                            }
                            if (attributesToDevelop.length > 0) {
                                const attrToImprove = getRandomItem(attributesToDevelop);
                                const currentAttrValue = player.attributes[attrToImprove as keyof typeof player.attributes] as number;
                                if (currentAttrValue < 20) {
                                    let moraleModifier = 1.0;
                                    if ((player as Player).morale === 'Happy') moraleModifier = 1.2;
                                    else if ((player as Player).morale === 'Unhappy') moraleModifier = 0.5;
                                    const improvement = ((Math.random() * 0.2) + (devRate / 100)) * moraleModifier;
                                    const newAttrValue = Math.min(20, currentAttrValue - improvement);
                                    (player.attributes[attrToImprove as keyof typeof player.attributes] as number) = newAttrValue;
                                    playerChanged = true;
                                    if (isUserManagedTeam) newDevelopmentLogs.push({ playerId: player.id, playerName: player.name, attribute: attrToImprove.toString(), change: improvement, newRating: newAttrValue, date: currentDate });
                                }
                            }
                        }
                    }
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
                    if ((player as Player).morale === 'Happy') return { ...player, morale: 'Content' as 'Content' };
                    if ((player as Player).morale === 'Unhappy') return { ...player, morale: 'Content' as 'Content' };
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

        let newDate;
        try {
            newDate = ((prevDate) => {
                let { month, week, year } = prevDate;
                const monthIndex = months.indexOf(month);
                
                week += 1; 

                if (week > 4) { 
                    week = 1;
                    let nextMonthIndex = (monthIndex + 1) % months.length;
                    if (month === "July" && months[nextMonthIndex] === "August") {
                        year += 1;
                        toast.info("Season Ended", { description: `The ${prevDate.year}-${prevDate.year + 1} season has concluded. Stats are being archived.` });
                        
                        const seasonToArchive = `${prevDate.year}-${prevDate.year + 1}`;
                        const newSeason = `${year}-${year + 1}`;
                        const standingsForYear: TeamSeasonHistory[] = tempTeams.map(t => ({
                            teamName: t.name,
                            leagueDivision: t.leagueDivision,
                            nationalsDivision: t.nationalsDivision,
                            wins: t.wins,
                            losses: t.losses,
                            draws: t.draws,
                            points: t.points,
                            goalsFor: t.goalsFor,
                            goalsAgainst: t.goalsAgainst,
                        }));
                        setSeasonHistory(prev => ({ ...prev, [seasonToArchive]: standingsForYear }));

                        // Update all-time season records with the bests from the just-concluded season
                        tempSeasonRecords = compareAndSetSeasonRecords(tempCurrentSeasonStatsAccumulator, tempSeasonRecords);
                        
                        // Reset current season accumulator for the new season
                        tempCurrentSeasonStatsAccumulator = {}; 
                        
                        const newAlumni: Player[] = [];
                        const allTransferPlayers: Player[] = [];
                        const allOrganizations = getTeamOrganizations(); // Get the base organization structure

                        tempTeams = tempTeams.map(team => {
                            const graduatingPlayers: Player[] = [];
                            const remainingPlayers = team.roster.filter(player => {
                                // Age the player first
                                player.age += 1;

                                // Archive stats for everyone at the end of the season
                                if (player.currentStats.length > 0) {
                                    player.history.push(...player.currentStats);
                                    player.currentStats = [];
                                }

                                // Handle Masters/PhD players
                                if (player.eligibility === 'Masters' || player.eligibility === 'PhD') {
                                    player.yearsLeftInProgram = (player.yearsLeftInProgram || 1) - 1;
                                    if (player.yearsLeftInProgram <= 0) {
                                        graduatingPlayers.push(player);
                                        return false; // Player leaves
                                    }
                                    return true; // Player stays for another year
                                }

                                // Handle Staff players (retirement logic)
                                if (player.eligibility === 'Staff') {
                                    if (player.age >= STAFF_RETIREMENT_MIN_AGE) {
                                        let retirementChance = (player.age - STAFF_RETIREMENT_MIN_AGE + 1) * STAFF_RETIREMENT_CHANCE_PER_YEAR_INCREASE;
                                        retirementChance = Math.min(retirementChance, 1.0); // Cap at 100%

                                        if (Math.random() < retirementChance) {
                                            player.alumniStatus = 'Retired';
                                            graduatingPlayers.push(player);
                                            return false; // Staff player retires
                                        }
                                    }
                                    return true; // Staff player stays
                                }

                                // Handle Undergraduate players
                                if (player.eligibility.startsWith('UG Year')) {
                                    const currentYear = parseInt(player.eligibility.replace('UG Year ', ''), 10);
                                    if (currentYear < 4) {
                                        player.eligibility = `UG Year ${currentYear + 1}` as Player['eligibility'];
                                        return true; // UG player advances
                                    } else { // UG Year 4
                                        graduatingPlayers.push(player);
                                        return false; // UG Year 4 graduates
                                    }
                                }

                                // Fallback for any other unexpected eligibility (shouldn't happen if types are exhaustive)
                                return true;
                            });

                            // Create new season stat lines for players who are staying
                            remainingPlayers.forEach(player => {
                                player.currentStats = [{
                                    season: newSeason,
                                    team: team.name,
                                    league: team.leagueDivision,
                                    gamesPlayed: 0,
                                    goals: 0,
                                    assists: 0,
                                    points: 0,
                                    penaltyMinutes: 0,
                                    captaincy: null,
                                    goalsAgainst: 0,
                                    shotsAgainst: 0,
                                    saves: 0,
                                    goalsAgainstAverage: 0,
                                    savePercentage: 0,
                                    shutouts: 0,
                                }];
                            });

                            graduatingPlayers.forEach(player => {
                                const isManaged = managedTeamNames.includes(team.name);
                                const ambition = player.attributes.ambition || 10;
                                const loyalty = player.attributes.loyalty || 10;
                                const roll = Math.random();
                                const continueChance = 0.15 + (loyalty - 10) / 100;
                                const transferChance = 0.40 + (ambition - 10) / 100;

                                if (player.alumniStatus === 'Retired') { // Already marked as retired by staff logic
                                    newAlumni.push(player);
                                    if (isManaged) {
                                        // No toast for staff retirement as per user request
                                    }
                                } else if (roll < continueChance) {
                                    player.eligibility = player.eligibility === 'UG Year 4' ? 'Masters' : 'PhD';
                                    player.yearsLeftInProgram = player.eligibility === 'Masters' ? 2 : 4;
                                    player.isContinuingEducation = true;
                                    remainingPlayers.push(player);
                                    if (isManaged) {
                                        toast.info(`${player.name} has graduated and enrolled in a ${player.eligibility} program to stay with the team!`);
                                    }
                                } else if (roll < continueChance + transferChance) {
                                    // Player becomes a transfer prospect
                                    player.alumniStatus = 'Active Elsewhere'; // Mark as active elsewhere
                                    newAlumni.push(player); // Add to alumni list

                                    const transferProspect: Player = {
                                        ...player, // Use the original player as base
                                        source: 'Transfer',
                                        jerseyNumber: 0, // Reset jersey number for transfer
                                        morale: 'Content', // Reset morale for transfer
                                        eligibility: 'Masters', // Default eligibility for transfers
                                        yearsLeftInProgram: 2, // Default years for transfers
                                        recruitmentCost: 0, // Free for user, cost for AI is based on quality
                                        captaincy: null, // Reset captaincy
                                        currentStats: [], // Clear current stats for new season
                                        isContinuingEducation: false, // Not continuing education
                                    };
                                    allTransferPlayers.push(transferProspect);
                                    if (isManaged) {
                                        toast.info(`${player.name} has graduated and is seeking opportunities at other universities.`);
                                    }
                                } else {
                                    player.alumniStatus = 'Retired';
                                    newAlumni.push(player);
                                    if (isManaged) {
                                        toast.info(`${player.name} has retired from university hockey.`);
                                    }
                                }
                            });

                            team.roster = remainingPlayers;

                            // --- NEW BUDGET LOGIC START ---
                            const currentSpentFunds = Object.values(team.financials.budgetAllocations).reduce((sum, val) => sum + val, 0);
                            const unspentFunds = team.financials.totalBudget - currentSpentFunds;

                            const orgName = getOrganizationName(team.name);
                            const organization = allOrganizations.find(org => org.name === orgName);

                            let newBaseBudget = 15000; // Default for single-team orgs
                            if (organization && organization.teams.length > 1) {
                                // Replicate the multi-team organization budget calculation
                                const orgTotalBudget = 10000 + (organization.teams.length * 7500);
                                newBaseBudget = orgTotalBudget / organization.teams.length;
                            }

                            const newTotalBudget = newBaseBudget + unspentFunds;
                            const resetAllocations = { Travel: 0, Equipment: 0, "Ice Time": 0, Recruiting: 0, "Student Life": 0, Facilities: 0 };
                            // --- NEW BUDGET LOGIC END ---

                            return {
                                ...team,
                                roster: team.roster, // Already updated above
                                financials: {
                                    ...team.financials,
                                    totalBudget: newTotalBudget,
                                    budgetAllocations: resetAllocations,
                                },
                                wins: 0, losses: 0, draws: 0, points: 0, goalsFor: 0, goalsAgainst: 0 // existing reset
                            };
                        });

                        // Post-graduation lineup check
                        const updatedUserTeamForValidation = tempTeams.find(t => t.name === activeTeamName);
                        if (updatedUserTeamForValidation) {
                            const validationError = validateLineup(updatedUserTeamForValidation);
                            if (validationError) {
                                throw new Error(`VALIDATION_ERROR:${validationError}`);
                            }
                        }

                        setTransferPool([]);
                        setScoutingPool([]);
                        setRecruitedPool([]);
                        setFairHosted(false);

                        if (allTransferPlayers.length > 0) {
                            for (let i = allTransferPlayers.length - 1; i > 0; i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [allTransferPlayers[i], allTransferPlayers[j]] = [allTransferPlayers[j], allTransferPlayers[i]];
                            }

                            const maxUserTransfers = 3;
                            const userPlayerCount = Math.min(maxUserTransfers, allTransferPlayers.length);

                            const userTransfers = allTransferPlayers.slice(0, userPlayerCount);
                            const aiTransfers = allTransferPlayers.slice(userPlayerCount);
                            const aiTeams = tempTeams.filter(t => !managedTeamNames.includes(t.name));

                            if (aiTransfers.length > 0 && aiTeams.length > 0) {
                                aiTransfers.forEach((player) => {
                                    const targetTeam = getRandomItem(aiTeams);
                                    const teamToUpdateIndex = tempTeams.findIndex(t => t.name === targetTeam.name);
                                    if (teamToUpdateIndex !== -1) {
                                        const teamToUpdate = tempTeams[teamToUpdateIndex];
                                        const usedJerseyNumbers = new Set(teamToUpdate.roster.map(p => p.jerseyNumber));
                                        
                                        let newJerseyNumber = 1;
                                        while (usedJerseyNumbers.has(newJerseyNumber)) { newJerseyNumber++; }
                                        player.jerseyNumber = newJerseyNumber;
                                        
                                        const isSkater = player.positions[0] !== 'G';
                                        player.starRating = calculateStarRating(player.currentAbility, isSkater, teamToUpdate.leagueDivision);
                                        
                                        tempTeams[teamToUpdateIndex].roster.push(player);
                                    }
                                });
                                toast.info("AI teams have recruited new players for the upcoming season.");
                            }
                            
                            if (userTransfers.length > 0) {
                                setTransferPool(userTransfers);
                                toast.info("Exclusive Transfer Offers", { description: `Your program's prestige has attracted ${userTransfers.length} transfer players. Find them in the Transfer Portal tab.` });
                            }
                        }

                        if (newAlumni.length > 0) {
                            setAlumni(prev => [...prev, ...newAlumni]);
                        }
                    }
                    month = months[nextMonthIndex];
                }
                return { month, week, year };
            })(currentDate);
        } catch (e) {
            if (e instanceof Error && e.message.startsWith('VALIDATION_ERROR:')) {
                const errorMessage = e.message.replace('VALIDATION_ERROR:', '');
                toast.error("Invalid Lineup for New Season", {
                    description: `Your lineup is invalid after player graduation: ${errorMessage}. Please fix your lineup before advancing.`
                });
                return; // Abort the function
            } else {
                // Re-throw other errors
                throw e;
            }
        }

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
        setCurrentSeasonStatsAccumulator(tempCurrentSeasonStatsAccumulator);
        setCareerRecords(tempCareerRecords);
        setSeasonRecords(tempSeasonRecords);
    };

    const saveGame = (saveName: string) => {
        if (!userTeam) {
            toast.error("Cannot save game", { description: "No active team to save." });
            return;
        }

        const gameState = {
            teams,
            alumni,
            seasonHistory,
            activeTeamName,
            managedOrganization,
            isManagingOrg,
            schedule,
            nationalsData,
            seasonRecords,
            careerRecords,
            scoutingPool,
            recruitedPool,
            fairHosted,
            transferPool,
            currentDate,
            developmentHistory,
            currentSeasonStatsAccumulator, // Save the new state variable
        };

        localStorage.setItem(`savegame_${saveName}`, JSON.stringify(gameState));

        const newSaveSlot: SaveGameSlot = {
            saveName,
            savedAt: new Date().toISOString(),
            userTeamName: userTeam.name,
            currentDate: currentDate,
        };

        setSavedGames(prev => {
            const existingIndex = prev.findIndex(s => s.saveName === saveName);
            let newSaves;
            if (existingIndex > -1) {
                newSaves = [...prev];
                newSaves[existingIndex] = newSaveSlot;
            } else {
                newSaves = [...prev, newSaveSlot];
            }
            localStorage.setItem('savedGamesList', JSON.stringify(newSaves));
            return newSaves;
        });

        toast.success("Game Saved!", { description: `Your progress has been saved as "${saveName}".` });
    };

    const loadGame = (saveName: string) => {
        const savedStateJSON = localStorage.getItem(`savegame_${saveName}`);
        if (!savedStateJSON) {
            toast.error("Load failed", { description: "Save game data not found." });
            return;
        }

        try {
            const savedState = JSON.parse(savedStateJSON);

            setTeams(savedState.teams);
            setAlumni(savedState.alumni || []);
            setSeasonHistory(savedState.seasonHistory || {});
            setActiveTeamName(savedState.activeTeamName);
            setManagedOrganization(savedState.managedOrganization);
            setIsManagingOrg(savedState.isManagingOrg);
            setSchedule(savedState.schedule || []);
            setNationalsData(savedState.nationalsData || {});
            setSeasonRecords(savedState.seasonRecords || {});
            setCareerRecords(savedState.careerRecords || {});
            setScoutingPool(savedState.scoutingPool || []);
            setRecruitedPool(savedState.recruitedPool || []);
            setFairHosted(savedState.fairHosted || false);
            setTransferPool(savedState.transferPool || []);
            setCurrentDate(savedState.currentDate);
            setDevelopmentHistory(savedState.developmentHistory || []);
            setCurrentSeasonStatsAccumulator(savedState.currentSeasonStatsAccumulator || {}); // Load the new state variable

            toast.success("Game Loaded!", { description: `Successfully loaded "${saveName}".` });
        } catch (error) {
            console.error("Failed to load game:", error);
            toast.error("Load failed", { description: "The save file appears to be corrupted." });
        }
    };

    const deleteGame = (saveName: string) => {
        localStorage.removeItem(`savegame_${saveName}`);
        setSavedGames(prev => {
            const newSaves = prev.filter(s => s.saveName !== saveName);
            localStorage.setItem('savedGamesList', JSON.stringify(newSaves));
            return newSaves;
        });
        toast.info("Save Deleted", { description: `The save file "${saveName}" has been deleted.` });
    };

    const exitToMainMenu = () => {
        const keysToRemove = [
            'teams', 'alumni', 'seasonHistory', 'activeTeamName', 'managedOrganization',
            'isManagingOrg', 'schedule', 'nationalsData', 'seasonRecords', 'careerRecords',
            'scoutingPool', 'recruitedPool', 'fairHosted', 'transferPool', 'currentDate',
            'developmentHistory', 'currentSeasonStatsAccumulator' // Clear the new state variable
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));

        setTeams(initialTeams);
        setAlumni([]);
        setSeasonHistory({});
        setActiveTeamName(null);
        setManagedOrganization(null);
        setIsManagingOrg(false);
        setSchedule([]);
        setNationalsData({});
        setSeasonRecords({});
        setCareerRecords({});
        setScoutingPool([]);
        setRecruitedPool([]);
        setFairHosted(false);
        setCurrentDate({ month: 'August', week: 1, year: new Date().getFullYear() });
        setDevelopmentHistory([]);
        setTransferPool([]); // Ensure transfer pool is also cleared
        setCurrentSeasonStatsAccumulator({}); // Clear the new state variable

        toast.info("Exited to Main Menu");
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

        // New logic for transfer success chance
        const baseSuccessChance = 0.65; // Increased base chance
        const loyaltyModifier = (player.attributes.loyalty - 10) / 15; // Increased impact
        const ambitionModifier = (player.attributes.ambition - 10) / 15; // Increased impact
        const starRatingPenalty = (player.starRating / 5) * 0.4; // Reduced impact

        let successChance = baseSuccessChance - starRatingPenalty - loyaltyModifier + ambitionModifier;
        successChance = Math.max(0, Math.min(1, successChance)); // Clamp between 0 and 1

        if (Math.random() < successChance) {
            toast.success("Transfer Approved!", {
                description: `${player.name} has agreed to the move and their coach has approved the transfer.`
            });
            movePlayer(playerId, fromTeamName, toTeamName);
        } else {
            let reasonText: string;
            const playerLoyalty = player.attributes.loyalty || 10;
            const playerAmbition = player.attributes.ambition || 10;
            const playerStarRating = player.starRating;

            const managerBlockChance = 0.3; // 30% chance manager blocks it
            if (Math.random() < managerBlockChance) {
                reasonText = `The manager of ${fromTeamName} has blocked the transfer, wanting to keep the player.`;
            } else if (playerLoyalty > 15 && Math.random() < 0.7) { // High loyalty
                reasonText = `${player.name} has declined the offer to move to ${toTeamName}, citing strong loyalty to their current team.`;
            } else if (playerStarRating > 3.5 && Math.random() < 0.6) { // High star player, happy where they are
                reasonText = `${player.name} is happy where they are and does not wish to move at this time, citing personal comfort and team fit.`;
            } else if (playerAmbition < 5 && Math.random() < 0.5) { // Low ambition
                reasonText = `${player.name} prefers stability and is not looking for a change at this time.`;
            } else {
                reasonText = `${player.name} has declined the offer to move to ${toTeamName}.`; // Generic player refusal
            }
            toast.error("Transfer Denied", { description: reasonText });
        }
    };

    const markGameAsCompleted = (gameId: string, homeScore: number, awayScore: number) => {
        setSchedule(prevSchedule =>
            prevSchedule.map(game =>
                game.id === gameId
                    ? { ...game, status: 'completed', result: { homeScore, awayScore } }
                    : game
            )
        );
    };

    const processGameResults = (userTeam: Team, opponentTeam: Team, gameState: GameState, isNationalsGame: boolean = false, nationalsDivision?: string, gameId?: string) => {
        const season = `${currentDate.year}-${currentDate.year + 1}`;
        const { updatedUserTeam: updatedUserTeamResult, updatedOpponentTeam: updatedOpponentTeamResult } = processGameResultsEngine(userTeam, opponentTeam, gameState, season, isNationalsGame);
        
        setTeams(currentTeams =>
            currentTeams.map(t => {
                if (t.name === updatedUserTeamResult.name) return updatedUserTeamResult;
                if (t.name === updatedOpponentTeamResult.name) return updatedOpponentTeamResult;
                return t;
            })
        );

        if (isNationalsGame && nationalsDivision && gameId) {
            const completedGame = {
                gameId: gameId, 
                homeScore: gameState.userScore,
                awayScore: gameState.opponentScore,
                homeTeamName: userTeam.name,
                awayTeamName: opponentTeam.name,
            };
            playNationalsRound(nationalsDivision, completedGame);
        } else if (gameId) { 
            markGameAsCompleted(gameId, gameState.userScore, gameState.opponentScore);
        }
    };

    const autoAssignTrainingFocuses = () => {
        if (!userTeam) return;

        const updatedRoster = userTeam.roster.map(player => {
            if (player.trainingFocus) return player; // Don't change if already assigned

            const isSkater = !player.positions.includes('G');
            let newFocus: TrainingFocus = null;

            if (isSkater) {
                const bestSkaterFocus: { focus: TrainingFocus, avg: number } = skaterFocuses.reduce((best, focus) => {
                    const focusAttrs = trainingFocusesMap[focus];
                    const avgAttr = focusAttrs.reduce((sum, attr) => sum + (player.attributes[attr as keyof SkaterAttributes] || 0), 0) / focusAttrs.length;
                    if (avgAttr > best.avg) {
                        return { focus, avg: avgAttr };
                    }
                    return best;
                }, { focus: 'Skating', avg: 0 }); // Default to Skating if no better found
                newFocus = bestSkaterFocus.focus;
            } else { // Goalie
                const bestGoalieFocus: { focus: TrainingFocus, avg: number } = goalieFocuses.reduce((best, focus) => {
                    const focusAttrs = trainingFocusesMap[focus];
                    const avgAttr = focusAttrs.reduce((sum, attr) => sum + (player.attributes[attr as keyof GoalieAttributes] || 0), 0) / focusAttrs.length;
                    if (avgAttr > best.avg) {
                        return { focus, avg: avgAttr };
                    }
                    return best;
                }, { focus: 'Goaltending', avg: 0 }); // Default to Goaltending
                newFocus = bestGoalieFocus.focus;
            }
            return { ...player, trainingFocus: newFocus };
        });

        updateTeam({ ...userTeam, roster: updatedRoster });
        toast.success("Training focuses auto-assigned!");
    };

    const updatePlayerTrainingFocus = (playerId: string, focus: TrainingFocus) => {
        if (!userTeam) return;
        const updatedRoster = userTeam.roster.map(player =>
            player.id === playerId ? { ...player, trainingFocus: focus } : player
        );
        updateTeam({ ...userTeam, roster: updatedRoster });
        toast.success("Training focus updated!");
    };

    const updateBudgetAllocations = (newAllocations: BudgetAllocations) => {
        if (!userTeam) return;
        const updatedFinancials = {
            ...userTeam.financials,
            budgetAllocations: newAllocations,
        };
        updateTeam({ ...userTeam, financials: updatedFinancials });
        toast.success("Budget allocations updated!");
    };

    const runStudentLifeInitiative = () => {
        if (!userTeam) return;
        const cost = 5000; // Example cost
        if (userTeam.financials.totalBudget < cost) {
            toast.error("Not enough budget", { description: "You need 5,000 to run a student life initiative." });
            return;
        }

        const updatedFinancials = {
            ...userTeam.financials,
            totalBudget: userTeam.financials.totalBudget - cost,
        };

        const updatedRoster = userTeam.roster.map(player => ({
            ...player,
            morale: updateMorale(player.morale, 1),
        }));

        updateTeam({ ...userTeam, financials: updatedFinancials, roster: updatedRoster });
        toast.success("Student Life Initiative complete!", { description: "Team morale has improved." });
    };

    const startFacilityProject = (projectId: string) => {
        if (!userTeam) return;
        const project = initialFacilityProjects.find(p => p.id === projectId);
        if (!project) {
            toast.error("Project not found.");
            return;
        }
        if (userTeam.facilities.some(f => f.id === projectId && (f.status === 'In Progress' || f.status === 'Completed'))) {
            toast.info("Project already started or completed.", { description: `${project.name} is already in progress or finished.` });
            return;
        }
        if (userTeam.financials.totalBudget < project.cost) {
            toast.error("Not enough budget", { description: `You need ${project.cost} to start ${project.name}.` });
            return;
        }

        const updatedFinancials = {
            ...userTeam.financials,
            totalBudget: userTeam.financials.totalBudget - project.cost,
        };

        const newProject: FacilityProject = {
            ...project,
            status: 'In Progress',
            weeksToComplete: project.weeksToComplete || 4, // Default to 4 weeks if not specified
        };

        updateTeam({
            ...userTeam,
            financials: updatedFinancials,
            facilities: [...userTeam.facilities, newProject],
        });
        toast.success("Facility project started!", { description: `${project.name} is now in progress.` });
    };

    const generateScoutingPool = () => {
        if (!userTeam) {
            toast.error("Cannot generate scouting pool", { description: "Please select a team first." });
            return;
        }
        const userLeagueDivision = userTeam.leagueDivision;
        const allTeamNames = teams.map(t => t.name);
        const newPool = generateRecruits(userLeagueDivision, allTeamNames);
        setScoutingPool(newPool);
        toast.success("New scouting pool generated!");
    };

    const recruitPlayer = (playerId: string) => {
        if (!userTeam) return;

        let playerToRecruit = scoutingPool.find(p => p.id === playerId);
        let sourcePool = 'scouting';

        if (!playerToRecruit) {
            playerToRecruit = transferPool.find(p => p.id === playerId);
            sourcePool = 'transfer';
        }

        if (!playerToRecruit) {
            toast.error("Player not found.");
            return;
        }
        
        if (userTeam.roster.length >= 25) {
            toast.error("Roster full", { description: "Your roster is at its maximum capacity (25 players)." });
            return;
        }
        if (playerToRecruit.recruitmentCost && userTeam.financials.budgetAllocations.Recruiting < playerToRecruit.recruitmentCost) {
            toast.error("Not enough recruiting budget", { description: `You need ${playerToRecruit.recruitmentCost} in recruiting budget to sign ${playerToRecruit.name}.` });
            return;
        }

        const updatedRecruitingBudget = userTeam.financials.budgetAllocations.Recruiting - (playerToRecruit.recruitmentCost || 0);
        const updatedFinancials = {
            ...userTeam.financials,
            budgetAllocations: {
                ...userTeam.financials.budgetAllocations,
                Recruiting: updatedRecruitingBudget,
            },
        };

        const updatedPlayer: Player = {
            ...playerToRecruit,
            jerseyNumber: 0, // Will be assigned later
            morale: 'Content',
            healthStatus: 'Healthy',
            injury: null,
            trainingFocus: null,
            currentStats: [],
            activeInstructions: [],
            history: [],
            captaincy: null,
            isContinuingEducation: false,
        };

        setRecruitedPool(prev => [...prev, updatedPlayer]);
        
        if (sourcePool === 'scouting') {
            setScoutingPool(prev => prev.filter(p => p.id !== playerId));
        } else {
            setTransferPool(prev => prev.filter(p => p.id !== playerId));
        }

        updateTeam({ ...userTeam, financials: updatedFinancials });
        toast.success(`${playerToRecruit.name} has been recruited!`, { description: "Assign them a jersey number in the Roster tab." });
    };

    const assignPlayerToRoster = (playerId: string) => {
        if (!userTeam) return;
        const playerToAssign = recruitedPool.find(p => p.id === playerId);
        if (!playerToAssign) {
            toast.error("Player not found in recruited pool.");
            return;
        }
        if (userTeam.roster.length >= 25) {
            toast.error("Roster full", { description: "Your roster is at its maximum capacity (25 players)." });
            return;
        }

        const usedJerseyNumbers = new Set(userTeam.roster.map(p => p.jerseyNumber));
        let newJerseyNumber = 1;
        while (usedJerseyNumbers.has(newJerseyNumber)) {
            newJerseyNumber++;
        }

        const updatedPlayer: Player = {
            ...playerToAssign,
            jerseyNumber: newJerseyNumber,
            currentStats: [{
                season: `${currentDate.year}-${currentDate.year + 1}`,
                team: userTeam.name,
                league: userTeam.leagueDivision,
                gamesPlayed: 0,
                goals: 0,
                assists: 0,
                points: 0,
                penaltyMinutes: 0,
                captaincy: null,
                goalsAgainst: 0,
                shotsAgainst: 0,
                saves: 0,
                goalsAgainstAverage: 0,
                savePercentage: 0,
                shutouts: 0,
            }],
        };

        updateTeam({ ...userTeam, roster: [...userTeam.roster, updatedPlayer] });
        setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
        toast.success(`${playerToAssign.name} has been assigned jersey #${newJerseyNumber} and added to the roster!`);
    };

    const discardRecruit = (playerId: string) => {
        setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
        toast.info("Recruit discarded.");
    };

    return (
        <TeamContext.Provider
            value={{
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
            }}
        >
            {children}
        </TeamContext.Provider>
    );
};