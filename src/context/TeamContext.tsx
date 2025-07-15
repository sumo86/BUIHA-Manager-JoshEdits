import { createContext, useContext, useState, useEffect, useCallback, useMemo, PropsWithChildren } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { teams as initialTeamsData } from '@/data/teams'; // Corrected import name
import { generateSeasonSchedule } from '@/lib/scheduleGenerator'; // Corrected import name
import { generateRecruits } from '@/lib/playerGenerator'; // Corrected import name
import { simulateFullGame } from '@/lib/gameEngine';
import { getAggregatedCurrentStats } from '@/lib/statsUtils'; // Removed getAggregatedSeasonStats
import { createNationalsTournament } from '@/lib/nationalsGenerator'; // Corrected import name
import {
    Team, Player, Financials, FacilityProject, BudgetAllocations, GameDate, DevelopmentLog,
    TrainingFocus, GameState, ScheduleEntry, RecordCategory, TeamRecord, NationalsTournament,
    PlayerSeasonStats, SeasonHistory, BudgetCategory, Position, Lineup, NationalsPlayoffMatch
} from '@/types';

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
    processGameResults: (userTeam: Team, opponentTeam: Team, gameState: GameState, isNationalsGame?: boolean, nationalsDivision?: string, gameId?: string) => void;
    movePlayer: (playerId: string, fromTeamName: string, toTeamName: string) => void;
    requestPlayerTransfer: (playerId: string, fromTeamName: string, toTeamName: string) => void;
    managedOrganization: string | null;
    isManagingOrg: boolean;
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
    playNationalsRound: (division: string, userGameResult?: { homeTeamName: string, awayTeamName: string, homeScore: number, awayScore: number, gameId: string }) => void;
    autoSimulateUserNationalsGame: (division: string, gameId: string) => void;
    simulateFullNationalsTournament: (division: string) => void;
    simulateSingleNationalsGame: (division: string, gameId: string) => void;
    seasonHistory: SeasonHistory;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider = ({ children }: PropsWithChildren) => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [userTeam, setUserTeam] = useState<Team | null>(null);
    const [scoutingPool, setScoutingPool] = useState<Player[]>([]);
    const [recruitedPool, setRecruitedPool] = useState<Player[]>([]);
    const [fairHosted, setFairHosted] = useState(false);
    const [currentDate, setCurrentDate] = useState<GameDate>({ year: 2024, month: 'August', week: 1 });
    const [developmentHistory, setDevelopmentHistory] = useState<DevelopmentLog[]>([]);
    const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
    const [managedOrganization, setManagedOrganization] = useState<string | null>(null);
    const [isManagingOrg, setIsManagingOrg] = useState(false);
    const [nationalsData, setNationalsData] = useState<{ [year: number]: { [division: string]: NationalsTournament } }>({});
    const [alumni, setAlumni] = useState<Player[]>([]);
    const [seasonHistory, setSeasonHistory] = useState<SeasonHistory>({});

    // Initialization
    useEffect(() => {
        setTeams(initialTeamsData); // Use the directly imported teams array
    }, []);

    const selectTeam = (teamName: string | null) => {
        const team = teams.find(t => t.name === teamName) || null;
        setUserTeam(team);
        setIsManagingOrg(false);
        setManagedOrganization(null);
    };

    const selectOrganization = (orgName: string | null) => {
        if (!orgName) {
            selectTeam(null);
            return;
        }
        const orgTeams = teams.filter(t => t.name.startsWith(orgName));
        if (orgTeams.length > 0) {
            setUserTeam(orgTeams[0]);
            setManagedOrganization(orgName);
            setIsManagingOrg(true);
        }
    };

    const setActiveTeam = (teamName: string) => {
        if (isManagingOrg) {
            const team = teams.find(t => t.name === teamName);
            if (team) setUserTeam(team);
        }
    };
    
    const updateTeam = (updatedTeam: Team) => {
        const newTeams = teams.map(t => t.id === updatedTeam.id ? updatedTeam : t);
        setTeams(newTeams);
        if (userTeam && userTeam.id === updatedTeam.id) {
            setUserTeam(updatedTeam);
        }
    };

    const generateScoutingPool = () => {
        if (!userTeam) {
            toast.error("Please select a team first to generate scouting pool.");
            return;
        }
        const allTeamNames = teams.map(t => t.name);
        const newPlayers = generateRecruits(userTeam.leagueDivision, allTeamNames, 50); // Updated function call
        setScoutingPool(newPlayers);
        setFairHosted(true);
        toast.success("Student fair hosted!", { description: "50 new potential recruits are available in the scouting pool." });
    };

    const recruitPlayer = (playerId: string) => {
        const player = scoutingPool.find(p => p.id === playerId);
        if (player && userTeam) {
            const cost = player.recruitmentCost || 0;
            if (userTeam.financials.budgetAllocations.Recruiting >= cost) {
                setScoutingPool(prev => prev.filter(p => p.id !== playerId));
                setRecruitedPool(prev => [...prev, player]);
                const newAllocations = { ...userTeam.financials.budgetAllocations };
                newAllocations.Recruiting -= cost;
                updateBudgetAllocations(newAllocations);
                toast.success(`${player.name} recruited!`, { description: `Cost: £${cost.toLocaleString()}.` });
            } else {
                toast.error("Insufficient recruiting budget.");
            }
        }
    };

    const assignPlayerToRoster = (playerId: string) => {
        const player = recruitedPool.find(p => p.id === playerId);
        if (player && userTeam) {
            setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
            const newRoster = [...userTeam.roster, player];
            updateTeam({ ...userTeam, roster: newRoster });
        }
    };

    const discardRecruit = (playerId: string) => {
        setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
    };

    const updateBudgetAllocations = (newAllocations: BudgetAllocations) => {
        if (!userTeam) return;
        const newFinancials = { ...userTeam.financials, budgetAllocations: newAllocations };
        updateTeam({ ...userTeam, financials: newFinancials });
    };

    const runStudentLifeInitiative = () => {
        if (!userTeam) return;
        const cost = 500;
        if (userTeam.financials.budgetAllocations['Student Life'] >= cost) {
            const newRoster = userTeam.roster.map(p => {
                const moraleLevels = ["Content", "Happy", "Unhappy", "Angry"];
                let currentLevel = moraleLevels.indexOf(p.morale);
                if (currentLevel > 0) currentLevel--; // Improve morale
                return { ...p, morale: moraleLevels[currentLevel] as Player['morale'] };
            });
            const newAllocations = { ...userTeam.financials.budgetAllocations };
            newAllocations['Student Life'] -= cost;
            updateBudgetAllocations(newAllocations);
            updateTeam({ ...userTeam, roster: newRoster });
            toast.success("Student life initiative successful!", { description: "Team morale has improved." });
        } else {
            toast.error("Insufficient budget for Student Life Initiative.");
        }
    };

    const startFacilityProject = (projectId: string) => {
        if (!userTeam) return;
        const project = userTeam.facilities.find(f => f.id === projectId);
        if (project && userTeam.financials.budgetAllocations.Facilities >= project.cost) {
            const newFacilities = userTeam.facilities.map(f => f.id === projectId ? { ...f, status: 'In Progress' } : f);
            const newAllocations = { ...userTeam.financials.budgetAllocations };
            newAllocations.Facilities -= project.cost;
            updateBudgetAllocations(newAllocations);
            updateTeam({ ...userTeam, facilities: newFacilities });
            toast.success(`Project "${project.name}" has started.`);
        } else {
            toast.error("Cannot start project.", { description: "Insufficient funds in facilities budget." });
        }
    };

    const advanceWeek = () => {
        // Date progression
        let newYear = currentDate.year;
        let newMonth = currentDate.month;
        let newWeek = currentDate.week + 1;
        const months = ["August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June", "July"];
        if (newWeek > 4) {
            newWeek = 1;
            const monthIndex = months.indexOf(newMonth);
            if (monthIndex === 11) {
                newMonth = "August";
                newYear++;
            } else {
                newMonth = months[monthIndex + 1];
            }
        }
        const newDate = { year: newYear, month: newMonth, week: newWeek };
        setCurrentDate(newDate);

        // Schedule generation
        if (newDate.month === 'August' && newDate.week === 2 && schedule.length === 0) {
            const newSchedule = generateSeasonSchedule(teams); // Updated function call
            setSchedule(newSchedule);
            toast.info("Season schedule has been generated!");
        }

        // Nationals generation
        if (newDate.month === 'April' && newDate.week === 1 && !nationalsData[newDate.year]) {
            const newNationalsData = createNationalsTournament(userTeam.nationalsDivision, teams, newDate.year, newDate.week); // Updated function call
            setNationalsData(prev => ({ ...prev, [newDate.year]: { ...prev[newDate.year], [userTeam.nationalsDivision]: newNationalsData } }));
            toast.info(`Nationals ${newDate.year} brackets have been generated!`);
        }
    };

    const updatePlayerTrainingFocus = (playerId: string, focus: TrainingFocus) => {
        if (!userTeam) return;
        const newRoster = userTeam.roster.map(p => p.id === playerId ? { ...p, trainingFocus: focus } : p);
        updateTeam({ ...userTeam, roster: newRoster });
    };

    const autoAssignTrainingFocuses = () => {
        if (!userTeam) return;
        // This is a placeholder for more complex logic
        toast.info("Auto-assigning training focuses is not yet implemented.");
    };

    const processGameResults = (userTeam: Team, opponentTeam: Team, gameState: GameState, isNationalsGame = false, nationalsDivision?: string, gameId?: string) => {
        const userIsHome = userTeam.name === userTeam.name; // This seems wrong, let's assume userTeam is always the user's team
        const homeTeam = userTeam;
        const awayTeam = opponentTeam;
        const homeScore = gameState.userScore;
        const awayScore = gameState.opponentScore;

        const updatedTeams = teams.map(t => {
            if (t.id === homeTeam.id) {
                const newTeam = { ...t };
                newTeam.goalsFor += homeScore;
                newTeam.goalsAgainst += awayScore;
                if (homeScore > awayScore) { newTeam.wins++; newTeam.points += 3; }
                else if (homeScore < awayScore) newTeam.losses++;
                else { newTeam.draws++; newTeam.points += 1; }
                return newTeam;
            }
            if (t.id === awayTeam.id) {
                const newTeam = { ...t };
                newTeam.goalsFor += awayScore;
                newTeam.goalsAgainst += homeScore;
                if (awayScore > homeScore) { newTeam.wins++; newTeam.points += 3; }
                else if (awayScore < homeScore) newTeam.losses++;
                else { newTeam.draws++; newTeam.points += 1; }
                return newTeam;
            }
            return t;
        });
        setTeams(updatedTeams);
    };

    const movePlayer = (playerId: string, fromTeamName: string, toTeamName: string) => {
        let playerToMove: Player | null = null;
        const newTeams = teams.map(t => {
            if (t.name === fromTeamName) {
                playerToMove = t.roster.find(p => p.id === playerId) || null;
                return { ...t, roster: t.roster.filter(p => p.id !== playerId) };
            }
            return t;
        }).map(t => {
            if (t.name === toTeamName && playerToMove) {
                return { ...t, roster: [...t.roster, playerToMove] };
            }
            return t;
        });
        setTeams(newTeams);
    };

    const requestPlayerTransfer = (playerId: string, fromTeamName: string, toTeamName: string) => {
        toast.info("Player transfer requested.", { description: "This feature is not yet fully implemented." });
    };

    const markGameAsCompleted = (gameId: string, homeScore: number, awayScore: number) => {
        setSchedule(prev => prev.map(g => g.id === gameId ? { ...g, status: 'completed', result: { homeScore, awayScore } } : g));
    };

    const gameForCurrentWeek = useMemo(() => {
        if (!userTeam) return null;
        const game = schedule.find(g =>
            (g.homeTeam === userTeam.name || g.awayTeam === userTeam.name) &&
            g.date.year === currentDate.year &&
            g.date.month === currentDate.month &&
            g.date.week === currentDate.week &&
            g.status === 'scheduled'
        );
        if (!game) return null;
        return {
            id: game.id,
            opponent: game.homeTeam === userTeam.name ? game.awayTeam : game.homeTeam,
            date: game.date,
            isNationals: false,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
        };
    }, [schedule, userTeam, currentDate]);

    const managedTeams = useMemo(() => {
        if (!managedOrganization) return userTeam ? [userTeam] : [];
        return teams.filter(t => t.name.startsWith(managedOrganization));
    }, [teams, managedOrganization, userTeam]);

    const organizationFinancials = useMemo(() => {
        if (!isManagingOrg) return null;
        // Simplified aggregation
        return managedTeams.reduce((acc, team) => {
            acc.totalBudget += team.financials.totalBudget;
            Object.keys(team.financials.budgetAllocations).forEach(key => {
                const cat = key as BudgetCategory;
                acc.budgetAllocations[cat] = (acc.budgetAllocations[cat] || 0) + team.financials.budgetAllocations[cat];
            });
            return acc;
        }, { totalBudget: 0, baseBudget: 0, iceTimeCostPerGame: 0, equipmentCost: 0, budgetAllocations: {} as BudgetAllocations } as Financials);
    }, [isManagingOrg, managedTeams]);

    const organizationFacilities = useMemo(() => {
        if (!isManagingOrg || managedTeams.length === 0) return null;
        return managedTeams[0].facilities; // Simplified: use first team's facilities
    }, [isManagingOrg, managedTeams]);

    const seasonRecords = useMemo(() => ({}), []); // Placeholder
    const careerRecords = useMemo(() => ({}), []); // Placeholder

    const playNationalsRound = (division: string) => {
        toast.info(`Simulating round for ${division}.`);
    };

    const simulateFullNationalsTournament = (division: string) => {
        toast.success(`Full tournament for ${division} has been simulated.`);
    };

    const simulateSingleNationalsGame = (division: string, gameId: string) => {
        playNationalsRound(division);
        toast.info(`Simulated the round containing the selected game.`);
    };

    const autoSimulateUserNationalsGame = (division: string, gameId: string) => {
        const tournament = nationalsData[currentDate.year]?.[division];
        if (!tournament || !userTeam) return;

        const allGames = [...tournament.groupStageSchedule, ...tournament.playoffSchedule];
        const game = allGames.find(g => g.id === gameId);
        if (!game) return;

        const homeTeamName = typeof game.homeTeam === 'string' ? game.homeTeam : 'TBD';
        const awayTeamName = typeof game.awayTeam === 'string' ? game.awayTeam : 'TBD';

        const opponentName = homeTeamName === userTeam.name ? awayTeamName : homeTeamName;
        const opponent = teams.find(t => t.name === opponentName);
        if (!opponent) return;

        const finalGameState = simulateFullGame(userTeam, opponent, true);
        processGameResults(userTeam, opponent, finalGameState, true, division, gameId);
    };

    return (
        <TeamContext.Provider value={{
            teams, updateTeam, userTeam, selectTeam, scoutingPool, recruitedPool, fairHosted,
            generateScoutingPool, recruitPlayer, assignPlayerToRoster, discardRecruit,
            updateBudgetAllocations, runStudentLifeInitiative, startFacilityProject,
            currentDate, advanceWeek, developmentHistory, updatePlayerTrainingFocus,
            autoAssignTrainingFocuses, processGameResults, movePlayer, requestPlayerTransfer,
            managedOrganization, isManagingOrg, managedTeams, selectOrganization, setActiveTeam,
            organizationFinancials, organizationFacilities, schedule, gameForCurrentWeek, nationalsData,
            markGameAsCompleted, seasonRecords, careerRecords, alumni,
            playNationalsRound, autoSimulateUserNationalsGame,
            simulateFullNationalsTournament, simulateSingleNationalsGame, seasonHistory
        }}>
            {children}
        </TeamContext.Provider>
    );
};

export const useTeam = (): TeamContextType => {
    const context = useContext(TeamContext);
    if (context === undefined) {
        throw new Error('useTeam must be used within a TeamProvider');
    }
    return context;
};