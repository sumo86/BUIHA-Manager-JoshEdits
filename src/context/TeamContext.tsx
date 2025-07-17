import { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Team, Player, BudgetAllocations, SkaterAttributes, GoalieAttributes, DevelopmentLog, TrainingFocus, GameState, FacilityProject, BudgetCategory, Financials, ScheduleEntry, GameDate, PlayerSeasonStats, RecordCategory, TeamRecord, NationalsPlayoffMatch, SeasonHistory, TeamSeasonHistory } from '@/types';
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
    getSavedGames: () => { name: string, savedAt: string }[];
    saveGame: (saveName: string) => void;
    loadGame: (saveName: string) => void;
    deleteGame: (saveName: string) => void;
    exitToMainMenu: () => void;
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
    const [teams, setTeams] = useState<Team[]>([]);
    const [alumni, setAlumni] = useState<Player[]>([]);
    const [seasonHistory, setSeasonHistory] = useState<SeasonHistory>({});
    const [activeTeamName, setActiveTeamName] = useState<string | null>(null);
    const [managedOrganization, setManagedOrganization] = useState<string | null>(null);
    const [isManagingOrg, setIsManagingOrg] = useState<boolean>(false);
    const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
    const [nationalsData, setNationalsData] = useState<{ [year: number]: { [division: string]: NationalsTournament } }>({});
    const [seasonRecords, setSeasonRecords] = useState<{ [key in RecordCategory]?: TeamRecord }>({});
    const [careerRecords, setCareerRecords] = useState<{ [key in RecordCategory]?: TeamRecord }>({});
    const [scoutingPool, setScoutingPool] = useState<Player[]>([]);
    const [recruitedPool, setRecruitedPool] = useState<Player[]>([]);
    const [fairHosted, setFairHosted] = useState<boolean>(false);
    const [transferPool, setTransferPool] = useState<Player[]>([]);
    const [currentDate, setCurrentDate] = useState<GameDate>({ month: 'August', week: 1, year: new Date().getFullYear() });
    const [developmentHistory, setDevelopmentHistory] = useState<DevelopmentLog[]>([]);

    const resetGameState = () => {
        setTeams(JSON.parse(JSON.stringify(initialTeams)));
        setAlumni([]);
        setSeasonHistory({});
        setSchedule([]);
        setNationalsData({});
        setSeasonRecords({});
        setCareerRecords({});
        setScoutingPool([]);
        setRecruitedPool([]);
        setFairHosted(false);
        setTransferPool([]);
        setCurrentDate({ month: 'August', week: 1, year: new Date().getFullYear() });
        setDevelopmentHistory([]);
    };

    const exitToMainMenu = () => {
        resetGameState();
        setActiveTeamName(null);
        setManagedOrganization(null);
        setIsManagingOrg(false);
    };

    const selectTeam = (teamName: string | null) => {
        if (teamName) {
            resetGameState();
            const team = initialTeams.find(t => t.name === teamName);
            if (team) {
                const orgName = getOrganizationName(team.name);
                setActiveTeamName(teamName);
                setManagedOrganization(orgName);
                setIsManagingOrg(false);
            }
        } else {
            exitToMainMenu();
        }
    };

    const selectOrganization = (orgName: string | null) => {
        if (orgName) {
            resetGameState();
            const organizations = getTeamOrganizations();
            const org = organizations.find(o => o.name === orgName);
            if (org && org.teams.length > 0) {
                const mainTeam = org.teams[0];
                setManagedOrganization(orgName);
                setActiveTeamName(mainTeam.name);
                setIsManagingOrg(true);
            }
        } else {
            exitToMainMenu();
        }
    };

    const setActiveTeam = (teamName: string) => {
        const teamExistsInOrg = managedTeams.some(t => t.name === teamName);
        if (managedOrganization && teamExistsInOrg) {
            setActiveTeamName(teamName);
        }
    };

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

    const getSavedGames = (): { name: string, savedAt: string }[] => {
        try {
            const savedGamesRaw = localStorage.getItem('savedGames');
            if (!savedGamesRaw) return [];
            const savedGames = JSON.parse(savedGamesRaw);
            return Object.values(savedGames).map((game: any) => ({
                name: game.saveName,
                savedAt: game.savedAt,
            })).sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        } catch (error) {
            console.error("Failed to load saved games:", error);
            return [];
        }
    };

    const saveGame = (saveName: string) => {
        if (!activeTeamName) {
            toast.error("Cannot save game", { description: "No active game to save." });
            return;
        }

        const gameState = {
            saveName,
            savedAt: new Date().toISOString(),
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
        };

        const savedGamesRaw = localStorage.getItem('savedGames');
        const savedGames = savedGamesRaw ? JSON.parse(savedGamesRaw) : {};
        savedGames[saveName] = gameState;
        localStorage.setItem('savedGames', JSON.stringify(savedGames));
        toast.success("Game Saved!", { description: `Saved as "${saveName}".` });
    };

    const loadGame = (saveName: string) => {
        const savedGamesRaw = localStorage.getItem('savedGames');
        if (!savedGamesRaw) {
            toast.error("Load failed", { description: "No saved games found." });
            return;
        }
        const savedGames = JSON.parse(savedGamesRaw);
        const gameState = savedGames[saveName];

        if (!gameState) {
            toast.error("Load failed", { description: `Save file "${saveName}" not found.` });
            return;
        }

        setTeams(gameState.teams);
        setAlumni(gameState.alumni || []);
        setSeasonHistory(gameState.seasonHistory || {});
        setActiveTeamName(gameState.activeTeamName);
        setManagedOrganization(gameState.managedOrganization);
        setIsManagingOrg(gameState.isManagingOrg);
        setSchedule(gameState.schedule);
        setNationalsData(gameState.nationalsData || {});
        setSeasonRecords(gameState.seasonRecords || {});
        setCareerRecords(gameState.careerRecords || {});
        setScoutingPool(gameState.scoutingPool || []);
        setRecruitedPool(gameState.recruitedPool || []);
        setFairHosted(gameState.fairHosted || false);
        setTransferPool(gameState.transferPool || []);
        setCurrentDate(gameState.currentDate);
        setDevelopmentHistory(gameState.developmentHistory || []);

        toast.success("Game Loaded!", { description: `Loaded "${saveName}".` });
    };

    const deleteGame = (saveName: string) => {
        const savedGamesRaw = localStorage.getItem('savedGames');
        if (!savedGamesRaw) return;
        const savedGames = JSON.parse(savedGamesRaw);
        delete savedGames[saveName];
        localStorage.setItem('savedGames', JSON.stringify(savedGames));
        toast.info("Save Deleted", { description: `Save file "${saveName}" has been deleted.` });
    };

    const advanceWeek = () => {
        // ... existing code ...
    };

    const movePlayer = (playerId: string, fromTeamName: string, toTeamName: string) => {
        // ... existing code ...
    };

    const requestPlayerTransfer = (playerId: string, fromTeamName: string, toTeamName: string) => {
        // ... existing code ...
    };

    const markGameAsCompleted = (gameId: string, homeScore: number, awayScore: number) => {
        // ... existing code ...
    };

    const processGameResults = (userTeam: Team, opponentTeam: Team, gameState: GameState, isNationalsGame?: boolean, nationalsDivision?: string, gameId?: string) => {
        // ... existing code ...
    };

    const playNationalsRound = (division: string, userGameResult?: { homeTeamName: string, awayTeamName: string, homeScore: number, awayScore: number, gameId: string }) => {
        // ... existing code ...
    };

    const simulateFullNationalsTournament = (division: string) => {
        // ... existing code ...
    };

    const simulateSingleNationalsGame = (division: string, gameId: string) => {
        // ... existing code ...
    };

    const simulateAllNationalsTournaments = () => {
        // ... existing code ...
    };

    const generateScoutingPool = () => {
        // ... existing code ...
    };

    const recruitPlayer = (playerId: string) => {
        // ... existing code ...
    };

    const assignPlayerToRoster = (playerId: string) => {
        // ... existing code ...
    };

    const discardRecruit = (playerId: string) => {
        // ... existing code ...
    };

    const updateBudgetAllocations = (newAllocations: BudgetAllocations) => {
        // ... existing code ...
    };

    const runStudentLifeInitiative = () => {
        // ... existing code ...
    };

    const startFacilityProject = (projectId: string) => {
        // ... existing code ...
    };

    const updatePlayerTrainingFocus = (playerId: string, focus: TrainingFocus) => {
        // ... existing code ...
    };

    const autoAssignTrainingFocuses = () => {
        // ... existing code ...
    };

    const autoSimulateUserNationalsGame = (division: string, gameId: string) => {
        // ... existing code ...
    };

    return (
        <TeamContext.Provider value={{
            teams,
            updateTeam: (updatedTeam: Team) => {
                setTeams(currentTeams =>
                    currentTeams.map(t => (t.name === updatedTeam.name ? updatedTeam : t))
                );
            },
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
            gameForCurrentWeek: null,
            nationalsData,
            markGameAsCompleted,
            seasonRecords,
            careerRecords,
            alumni: [],
            playNationalsRound,
            autoSimulateUserNationalsGame,
            seasonHistory,
            simulateFullNationalsTournament,
            simulateSingleNationalsGame,
            simulateAllNationalsTournaments,
            getSavedGames,
            saveGame,
            loadGame,
            deleteGame,
            exitToMainMenu,
        }}>
            {children}
        </TeamContext.Provider>
    );
};