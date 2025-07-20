import { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Team, Player, SkaterAttributes, GoalieAttributes, DevelopmentLog, TrainingFocus, GameState, FacilityProject, Financials, ScheduleEntry, GameDate, PlayerSeasonStats, RecordCategory, TeamRecord, NationalsPlayoffMatch, Achievement, TeamAchievements, SeasonHistory, SaveGameSlot, TeamSeasonHistory } from '@/types';
import { teams as initialTeams, getTeamOrganizations, getOrganizationName } from '@/data/teams';
import { generateRecruits, generatePlayer, calculateStarRating, getGamesPlayedForDivision } from '@/lib/playerGenerator'; 
import { toast } from 'sonner';
import { calculateCurrentAbility } from '@/lib/playerGenerator';
import { trainingFocusesMap } from '@/data/trainingFocuses';
import { skaterFocuses, goalieFocuses } from '@/data/trainingFocuses';
import { processGameResults as processGameResultsEngine } from '@/lib/statsEngine';
import { generateSeasonSchedule } from '@/lib/scheduleGenerator';
import { simulateFullGame } from '@/lib/gameEngine';
import { validateLineup } from '@/lib/lineupValidation';
import { createNationalsTournament } from '@/lib/nationalsGenerator';
import { NationalsTournament } from '@/types';
import { isRivalryGame } from '@/lib/rivalries';
import { rebalanceOrganizationRosters } from '@/lib/aiManager';
import { processNationalsRound } from '@/lib/nationalsSimulator';
import { getAggregatedCurrentStats } from '@/lib/statsUtils';

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
    teamAchievements: TeamAchievements;
    saveGame: (saveName: string) => void;
    exitToMainMenu: () => void;
    transferPool: Player[];
    seasonHistory: SeasonHistory;
    savedGames: SaveGameSlot[];
    loadGame: (saveName: string) => void;
    deleteGame: (saveName: string) => void;
    simulateFullNationalsTournament: (division: string) => void;
    simulateSingleNationalsGame: (division: string, gameId: string) => void;
    simulateAllNationalsTournaments: () => void;
    signPlayerFromTransferPool: (playerId: string, toTeamName: string) => void;
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

    const [teamAchievements, setTeamAchievements] = useState<TeamAchievements>(() => {
        try {
            const saved = localStorage.getItem('teamAchievements');
            return saved ? JSON.parse(saved) : {};
        } catch (error) { return {}; }
    });

    useEffect(() => { localStorage.setItem('teamAchievements', JSON.stringify(teamAchievements)); }, [teamAchievements]);

    const [transferPool, setTransferPool] = useState<Player[]>([]);
    const [seasonHistory, setSeasonHistory] = useState<SeasonHistory>(() => {
        try {
            const saved = localStorage.getItem('seasonHistory');
            return saved ? JSON.parse(saved) : {};
        } catch (error) { return {}; }
    });
    useEffect(() => {
        localStorage.setItem('seasonHistory', JSON.stringify(seasonHistory));
    }, [seasonHistory]);

    const [savedGames, setSavedGames] = useState<SaveGameSlot[]>(() => {
        try {
            const saved = localStorage.getItem('savedGames');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Failed to load saved games list:", error);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('savedGames', JSON.stringify(savedGames));
    }, [savedGames]);

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
        const totalBudget = managedTeams.reduce((sum, t) => sum + (t.financials?.totalBudget || 0), 0);
        const discretionaryBudget = managedTeams.reduce((sum, t) => sum + (t.financials?.discretionaryBudget || 0), 0);
        const iceTimeCostPerGame = managedTeams.reduce((sum, t) => sum + (t.financials?.iceTimeCostPerGame || 0), 0) / managedTeams.length;
        const equipmentCost = managedTeams.reduce((sum, t) => sum + (t.financials?.equipmentCost || 0), 0) / managedTeams.length;

        return {
            totalBudget,
            discretionaryBudget,
            iceTimeCostPerGame,
            equipmentCost,
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
            const team = initialTeams.find(t => t.name === teamName);
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
        const regularGame = schedule.find(game =>
            (game.homeTeam === userTeam.name || game.awayTeam === userTeam.name) &&
            game.date.month === currentDate.month &&
            game.date.week === currentDate.week &&
            game.status === 'scheduled'
        );
        if (regularGame) {
            const opponent = regularGame.homeTeam === userTeam.name ? regularGame.awayTeam : regularGame.homeTeam;
            return { ...regularGame, opponent, isNationals: false };
        }<dyad-problem-report summary="40 problems">
<problem file="src/context/TeamContext.tsx" line="1319" column="138" code="1005">'}' expected.</problem>
<problem file="src/context/TeamContext.tsx" line="85" column="70" code="2355">A function whose declared type is neither 'undefined', 'void', nor 'any' must return a value.</problem>
<problem file="src/components/Sidebar.tsx" line="1" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/components/dialogs/SaveGameDialog.tsx" line="16" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/components/dialogs/ExitGameDialog.tsx" line="15" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/components/Layout.tsx" line="4" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/Dashboard.tsx" line="1" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/Standings.tsx" line="2" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/Standings.tsx" line="65" column="15" code="2322">Type 'unknown' is not assignable to type 'string'.</problem>
<problem file="src/components/roster/PlayerMovement.tsx" line="1" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/components/roster/JerseyManagement.tsx" line="1" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/Roster.tsx" line="6" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/components/recruitment/ScoutingTable.tsx" line="1" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/components/recruitment/RecruitsTable.tsx" line="1" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/Recruitment.tsx" line="1" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/Finances.tsx" line="2" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/components/facilities/FacilityProjectCard.tsx" line="1" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/Upgrades.tsx" line="2" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/PlayerProfile.tsx" line="2" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="12" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="84" column="80" code="2345">Argument of type 'unknown' is not assignable to parameter of type 'string'.</problem>
<problem file="src/pages/Lineup.tsx" line="85" column="79" code="2345">Argument of type 'unknown' is not assignable to parameter of type 'string'.</problem>
<problem file="src/pages/Lineup.tsx" line="101" column="34" code="2339">Property 'eligibility' does not exist on type 'unknown'.</problem>
<problem file="src/pages/Lineup.tsx" line="279" column="47" code="2345">Argument of type 'unknown' is not assignable to parameter of type 'Player'.
  Type '{}' is missing the following properties from type 'Player': id, jerseyNumber, name, age, and 18 more.</problem>
<problem file="src/pages/Lineup.tsx" line="280" column="38" code="2339">Property 'role' does not exist on type 'unknown'.</problem>
<problem file="src/pages/Lineup.tsx" line="288" column="47" code="2345">Argument of type 'unknown' is not assignable to parameter of type 'Player'.
  Type '{}' is missing the following properties from type 'Player': id, jerseyNumber, name, age, and 18 more.</problem>
<problem file="src/pages/Lineup.tsx" line="289" column="38" code="2339">Property 'role' does not exist on type 'unknown'.</problem>
<problem file="src/pages/BuihaOverview.tsx" line="2" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/Game.tsx" line="3" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/PlayGame.tsx" line="1" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/Morale.tsx" line="3" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/SeasonOverview.tsx" line="2" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/Calendar.tsx" line="2" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/Training.tsx" line="3" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/TeamSelection.tsx" line="1" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/TeamHistory.tsx" line="2" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/Nationals.tsx" line="2" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/Alumni.tsx" line="2" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/pages/NationalsGame.tsx" line="3" column="10" code="2305">Module '&quot;@/context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
<problem file="src/App.tsx" line="16" column="24" code="2305">Module '&quot;./context/TeamContext&quot;' has no exported member 'useTeam'.</problem>
</dyad-problem-report><think>Deciding which files are relevant...

**Addressing Compile Errors**

I've started by analyzing the user's request to resolve those TypeScript compile-time errors. My initial focus involves understanding the nature of each error and pinpointing their origins. I've already begun scrutinizing the list, concentrating on the most prevalent ones.


**Diagnosing the Root Cause**

I've dug deeper into the error messages. The bulk of the problems seem centered around the `useTeam` hook not being exported, suggesting a crucial piece is missing from the `TeamContext.tsx` file. I've also found syntax errors in that same file, plus type-related issues, which suggests the `TeamContext` file may be incomplete, and that `useTeam` hook should be the primary focus to solve all the other errors.


**Implementing TeamContext.tsx**

I've decided to focus on finishing `TeamContext.tsx`. This includes implementing the missing functions. Correcting the syntax and type errors within the file will be my next step. The plan involves building the `useTeam` hook, verifying that the `TeamProvider` is exporting correctly, and addressing all other related issues within the context file. The core issue appears to be an incomplete context, which leads to many downstream errors.


**Prioritizing Implementation Steps**

I've broken down the plan. First, I'll fully flesh out `TeamContext.tsx`, paying close attention to the `useTeam` hook and the `TeamProvider` export. I'll address the syntax errors and missing return statements. Afterwards, I'll implement the various missing functions, checking for the usage of `teams`. Once that context is solid, I'll address the type issues in `Lineup.tsx` and `Standings.tsx`.


{
  "complexity": "high",
  "relevantFiles": [
    "src/context/TeamContext.tsx",
    "src/components/Sidebar.tsx",
    "src/components/dialogs/SaveGameDialog.tsx",
    "src/components/dialogs/ExitGameDialog.tsx",
    "src/components/Layout.tsx",
    "src/pages/Dashboard.tsx",
    "src/pages/Standings.tsx",
    "src/components/roster/PlayerMovement.tsx",
    "src/components/roster/JerseyManagement.tsx",
    "src/pages/Roster.tsx",
    "src/components/recruitment/ScoutingTable.tsx",
    "src/components/recruitment/RecruitsTable.tsx",
    "src/pages/Recruitment.tsx",
    "src/pages/Finances.tsx",
    "src/components/facilities/FacilityProjectCard.tsx",
    "src/pages/Upgrades.tsx",
    "src/pages/PlayerProfile.tsx",
    "src/pages/Lineup.tsx",
    "src/pages/BuihaOverview.tsx",
    "src/pages/Game.tsx",
    "src/pages/PlayGame.tsx",
    "src/pages/Morale.tsx",
    "src/pages/SeasonOverview.tsx",
    "src/pages/Calendar.tsx",
    "src/pages/Training.tsx",
    "src/pages/TeamSelection.tsx",
    "src/pages/TeamHistory.tsx",
    "src/pages/Nationals.tsx",
    "src/pages/Alumni.tsx",
    "src/pages/NationalsGame.tsx",
    "src/App.tsx"
  ]
}</think><dyad-codebase-context files="src/context/TeamContext.tsx,src/components/Sidebar.tsx,src/components/dialogs/SaveGameDialog.tsx,src/components/dialogs/ExitGameDialog.tsx,src/components/Layout.tsx,src/pages/Dashboard.tsx,src/pages/Standings.tsx,src/components/roster/PlayerMovement.tsx,src/components/roster/JerseyManagement.tsx,src/pages/Roster.tsx,src/components/recruitment/ScoutingTable.tsx,src/components/recruitment/RecruitsTable.tsx,src/pages/Recruitment.tsx,src/pages/Finances.tsx,src/components/facilities/FacilityProjectCard.tsx,src/pages/Upgrades.tsx,src/pages/PlayerProfile.tsx,src/pages/Lineup.tsx,src/pages/BuihaOverview.tsx,src/pages/Game.tsx,src/pages/PlayGame.tsx,src/pages/Morale.tsx,src/pages/SeasonOverview.tsx,src/pages/Calendar.tsx,src/pages/Training.tsx,src/pages/TeamSelection.tsx,src/pages/TeamHistory.tsx,src/pages/Nationals.tsx,src/pages/Alumni.tsx,src/pages/NationalsGame.tsx,src/App.tsx">Complexity: high</dyad-codebase-context><think>**Addressing TypeScript Issues**

I've started to dissect the TypeScript errors. It looks like there are some key problems at the root of the 40 reported errors. I'm currently examining the first error's origin. I'm looking for the root cause of the errors, to resolve the initial issue more efficiently.


**Identifying Primary Problems**

I've now identified the crucial root causes, pinpointing a missing export in `TeamContext.tsx` as a critical issue. This missing export seems to be propagating errors throughout the codebase. Additionally, there's a syntax error and a return type error in the provided incomplete file. I'll address those after fixing the initial export issue.


**Devising a Solution**

I've formulated a plan to rectify the reported TypeScript issues. My approach is to first complete the incomplete `TeamContext.tsx` file, including the essential `useTeam` hook export. After, I will focus on the `TeamProvider` component, ensuring it correctly returns a `TeamContext.Provider`. Finally, I'll review the remaining errors, which I expect will be resolved by these initial fixes.


**Implementing TeamContext.tsx**

I've now broken down the tasks for `TeamContext.tsx` and have begun coding the incomplete functions like `recruitPlayer`, adding all the missing function implementations within the TeamProvider component. My focus is now on accurately implementing the `useTeam` hook for seamless context access. I will then ensure the return statement of the `TeamProvider` function provides a value to its children.


**Completing the Implementation**

I've now focused on completing the missing functions within `TeamContext.tsx`, meticulously implementing each one based on the original file's logic, and also including all the necessary functions to be added to the context's value. I've addressed the return value in the `TeamProvider` and have also included the `useTeam` hook. With that done, I will test my implementation.


**Refining Implementation Strategy**

I've now fully constructed the `TeamContext.tsx` file, meticulously incorporating all missing functions and completing the `useTeam` hook. This includes handling edge cases. I will now focus on verifying the overall implementation, paying close attention to its interaction with other components, especially `Lineup.tsx`, and `Standings.tsx` to ensure correct types are now being inferred.


**Implementing File Completion**

I've begun the complete implementation of `TeamContext.tsx`, meticulously implementing all missing functions, incorporating the `useTeam` hook for context access and ensuring the file is complete. I've reviewed and included all required function implementations, and I'm now focusing on constructing the `value` object for the `TeamContext.Provider` and the `TeamContext.Provider` return statement, which must wrap the children. After I finish with `TeamContext.tsx`, I will test my implementation.


**Constructing Final File**

I'm now finalizing the `TeamContext.tsx` file, adding all missing function implementations from the original code in the first user prompt to the file. The `value` object for `TeamContext.Provider` and the `useTeam` hook are now included and implemented. I've ensured all functions, including `recruitPlayer`, `assignPlayerToRoster` and others, are included and I am ready to submit this to be reviewed and tested.


**Final File Construction**

I've now finalized the `TeamContext.tsx` file, including all functions and the `useTeam` hook, using the code from the original prompt. All missing function implementations have been incorporated to provide the full implementation. I'm ready to run tests on the file.


**Constructing the Context**

I'm now working to complete the `TeamContext.tsx` file based on the original incomplete code. My primary focus is to add the remaining function implementations within the `TeamProvider` and construct the `value` object, ensuring all necessary functionality is present. Finally, I will finish the hook. After this I will test my implementation.


**Revising Context Construction**

I'm now integrating the `TeamContext.tsx` file from the prompt, completing the `recruitPlayer`, `assignPlayerToRoster`, and other missing functions. I've carefully added the `useTeam` hook and am crafting the `TeamContext.Provider`'s value object to include the added functions, ensuring all necessary data and function calls are included. Next, I will test my implementation.


**Constructing Context Completion**

I'm now completing the `TeamContext.tsx` file, constructing each missing function implementation and the `value` object for `TeamContext.Provider`. My primary focus is to incorporate all the function implementations from the original prompt, including `recruitPlayer`, `assignPlayerToRoster`, `discardRecruit` and others, and also the `useTeam` hook, to create a working implementation. Following this implementation, I will test.


**Implementing Remaining Context Logic**

I've completed the missing function implementations like `recruitPlayer`, `assignPlayerToRoster`, `discardRecruit`, `startFacilityProject`, `saveGame`, `loadGame`, and the other functions. I have also added the `useTeam` hook for seamless context access. I will now focus on testing the implementation, ensuring that all functions operate correctly.


**Final Context Construction**

I've now completed the `TeamContext.tsx` file, including all functions and the `useTeam` hook, using the code from the original prompt and my added implementations. I've ensured the `value` object for the `TeamContext.Provider` now contains all the functionality. I've added all the missing functions, including `recruitPlayer`, `assignPlayerToRoster`, and others, and am ready to provide the file.


I've now finished the remaining functions in `TeamContext.tsx`, like `recruitPlayer`, `assignPlayerToRoster`, and `discardRecruit`, along with the rest of the file's logic, including `saveGame`, `loadGame`, `deleteGame`, and `exitToMainMenu`. I'm confident that all functions have been implemented, and the `useTeam` hook is also added. The code is complete and ready for testing and deployment.


**Completing Context Logic**

I've now implemented the remaining functions from the original file, including `saveGame`, `loadGame`, and other utility functions, and ensured all the `useContext` calls will work correctly. All the missing implementations have been added, and I have also included the `useTeam` hook at the end of the file.


**Refactoring TeamContext.tsx**

I've addressed the file by incorporating the remaining function implementations: `recruitPlayer`, `assignPlayerToRoster`, `discardRecruit`, `startFacilityProject`, `saveGame`, `loadGame`, `deleteGame`, `exitToMainMenu`, `simulateFullNationalsTournament`, `simulateSingleNationalsGame`, `simulateAllNationalsTournaments`, and `signPlayerFromTransferPool`. I have now implemented the complete file, and I'll focus on testing the entire implementation to ensure it's error-free.


**Constructing Context Completion**

I'm now constructing the `TeamContext.tsx` file, constructing each missing function implementation and the `value` object for `TeamContext.Provider`. My primary focus is to incorporate all the function implementations from the original prompt, including `recruitPlayer`, `assignPlayerToRoster`, `discardRecruit` and others, and also the `useTeam` hook, to create a working implementation. Following this implementation, I will test.


**Reconstructing the Context**

I've now implemented the missing functions for `TeamContext.tsx`, like `recruitPlayer`, `assignPlayerToRoster`, and others, and also constructed the `TeamContext.Provider` return statement. The `useTeam` hook is now correctly included. All functions and necessary calls have been included, so the file can be provided.


**Completing the Context**

I've now implemented the complete `TeamContext.tsx` file, meticulously adding all the missing function implementations and incorporating the `useTeam` hook. I ensured all functions from the first user prompt, including `recruitPlayer`, `assignPlayerToRoster`, and all others, are now implemented and ready to use. I will now test the file and the application.


**Completing Implementation**

I've now finalized the `TeamContext.tsx` file by implementing the functions, including `recruitPlayer`, and others. I have also added the `useTeam` hook. The `value` object for the provider has been constructed. I will proceed with testing and evaluation.


**Reconstructing the File**

I'm now constructing the complete `TeamContext.tsx` file, based on the original, incomplete code. I've added all the missing function implementations like `recruitPlayer`, `assignPlayerToRoster`, `discardRecruit`, and so on. All functions, including `recruitPlayer`, are implemented, and the `useTeam` hook will allow the components to access the context. I am now ready to test.


</think>Of course. It appears the `TeamContext.tsx` file was incomplete, which caused a cascade of errors throughout your application. I've completed the file by implementing the missing functions and exporting the `useTeam` hook. This should resolve all the reported TypeScript errors.

Here is the corrected file:

<dyad-write path="src/context/TeamContext.tsx" description="Completing the TeamContext file and exporting the useTeam hook to resolve multiple compilation errors.">
import { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Team, Player, SkaterAttributes, GoalieAttributes, DevelopmentLog, TrainingFocus, GameState, FacilityProject, Financials, ScheduleEntry, GameDate, PlayerSeasonStats, RecordCategory, TeamRecord, NationalsPlayoffMatch, Achievement, TeamAchievements, SeasonHistory, SaveGameSlot, TeamSeasonHistory } from '@/types';
import { teams as initialTeams, getTeamOrganizations, getOrganizationName } from '@/data/teams';
import { generateRecruits, generatePlayer, calculateStarRating, getGamesPlayedForDivision } from '@/lib/playerGenerator'; 
import { toast } from 'sonner';
import { calculateCurrentAbility } from '@/lib/playerGenerator';
import { trainingFocusesMap } from '@/data/trainingFocuses';
import { skaterFocuses, goalieFocuses } from '@/data/trainingFocuses';
import { processGameResults as processGameResultsEngine } from '@/lib/statsEngine';
import { generateSeasonSchedule } from '@/lib/scheduleGenerator';
import { simulateFullGame } from '@/lib/gameEngine';
import { validateLineup } from '@/lib/lineupValidation';
import { createNationalsTournament } from '@/lib/nationalsGenerator';
import { NationalsTournament } from '@/types';
import { isRivalryGame } from '@/lib/rivalries';
import { rebalanceOrganizationRosters } from '@/lib/aiManager';
import { processNationalsRound } from '@/lib/nationalsSimulator';
import { getAggregatedCurrentStats } from '@/lib/statsUtils';

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
    teamAchievements: TeamAchievements;
    saveGame: (saveName: string) => void;
    exitToMainMenu: () => void;
    transferPool: Player[];
    seasonHistory: SeasonHistory;
    savedGames: SaveGameSlot[];
    loadGame: (saveName: string) => void;
    deleteGame: (saveName: string) => void;
    simulateFullNationalsTournament: (division: string) => void;
    simulateSingleNationalsGame: (division: string, gameId: string) => void;
    simulateAllNationalsTournaments: () => void;
    signPlayerFromTransferPool: (playerId: string, toTeamName: string) => void;
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

    const [teamAchievements, setTeamAchievements] = useState<TeamAchievements>(() => {
        try {
            const saved = localStorage.getItem('teamAchievements');
            return saved ? JSON.parse(saved) : {};
        } catch (error) { return {}; }
    });

    useEffect(() => { localStorage.setItem('teamAchievements', JSON.stringify(teamAchievements)); }, [teamAchievements]);

    const [transferPool, setTransferPool] = useState<Player[]>([]);
    const [seasonHistory, setSeasonHistory] = useState<SeasonHistory>(() => {
        try {
            const saved = localStorage.getItem('seasonHistory');
            return saved ? JSON.parse(saved) : {};
        } catch (error) { return {}; }
    });
    useEffect(() => {
        localStorage.setItem('seasonHistory', JSON.stringify(seasonHistory));
    }, [seasonHistory]);

    const [savedGames, setSavedGames] = useState<SaveGameSlot[]>(() => {
        try {
            const saved = localStorage.getItem('savedGames');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Failed to load saved games list:", error);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('savedGames', JSON.stringify(savedGames));
    }, [savedGames]);

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
        const totalBudget = managedTeams.reduce((sum, t) => sum + (t.financials?.totalBudget || 0), 0);
        const discretionaryBudget = managedTeams.reduce((sum, t) => sum + (t.financials?.discretionaryBudget || 0), 0);
        const iceTimeCostPerGame = managedTeams.reduce((sum, t) => sum + (t.financials?.iceTimeCostPerGame || 0), 0) / managedTeams.length;
        const equipmentCost = managedTeams.reduce((sum, t) => sum + (t.financials?.equipmentCost || 0), 0) / managedTeams.length;

        return {
            totalBudget,
            discretionaryBudget,
            iceTimeCostPerGame,
            equipmentCost,
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
            const team = initialTeams.find(t => t.name === teamName);
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
                    const opponentName = (typeof userGame.homeTeam === 'string' && userTeam.name === userGame.homeTeam)
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

        return null;
    }, [userTeam, schedule, currentDate, nationalsData]);

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
        
        tempTeams = tempTeams.map(team => {
            if (team.facilities) {
                let weeklyIncome = 0;
                if (team.facilities.some(f => f.id === 'merch_kiosk_1' && f.status === 'Completed')) weeklyIncome += 50;
                if (team.facilities.some(f => f.id === 'rink_ads_1' && f.status === 'Completed')) weeklyIncome += 25;
                if (team.facilities.some(f => f.id === 'social_media_1' && f.status === 'Completed')) weeklyIncome += 75;

                if (weeklyIncome > 0) {
                    team.financials.discretionaryBudget += weeklyIncome;
                    if (team.name === userTeam?.name) {
                         toast.info(`+£${weeklyIncome} weekly income received from facilities.`);
                    }
                }
            }
            return team;
        });

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

                } else { // Goalie
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

                const currentSeasonString = `${currentDate.year}-${currentDate.year + 1}`;
                const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, currentSeasonString, false);
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
                                    let improvement = ((Math.random() * 0.2) + (devRate / 100)) * moraleModifier;

                                    const hasVideoRoom = team.facilities.some(f => f.id === 'video_room_1' && f.status === 'Completed');
                                    const hasGym = team.facilities.some(f => f.id === 'basic_gym_1' && f.status === 'Completed');
                                    const hasShootingPads = team.facilities.some(f => f.id === 'shooting_pads_1' && f.status === 'Completed');

                                    const mentalAttrs: (keyof SkaterAttributes)[] = ['determination', 'intelligence', 'offensiveRead', 'defensiveRead', 'professionalism'];
                                    const physicalAttrs: (keyof SkaterAttributes)[] = ['strength', 'stamina', 'speed', 'acceleration', 'agility', 'balance', 'hitting'];
                                    const shootingAttrs: (keyof SkaterAttributes)[] = ['shootingAccuracy', 'shootingRange'];

                                    if (hasVideoRoom && mentalAttrs.includes(attrToImprove as any)) improvement *= 1.1;
                                    if (hasGym && physicalAttrs.includes(attrToImprove as any)) improvement *= 1.1;
                                    if (hasShootingPads && shootingAttrs.includes(attrToImprove as any)) improvement *= 1.1;

                                    const newAttrValue = Math.min(20, currentAttrValue + improvement);
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

        const newDate = ((prevDate) => {
            let { month, week, year } = prevDate;
            const monthIndex = months.indexOf(month);
            
            week += 1;

            if (week > 4) {
                week = 1;
                let nextMonthIndex = (monthIndex + 1) % months.length;
                if (month === "July" && months[nextMonthIndex] === "August") {
                    year += 1;
                    toast.info("Season Ended", { description: `The ${prevDate.year}-${prevDate.year + 1} season has concluded. Stats are being archived.` });
                    
                    const seasonThatEnded = `${prevDate.year}-${prevDate.year + 1}`;
                    
                    tempTeams = tempTeams.map(team => {
                        const updatedRoster = team.roster.map(player => {
                            if (player.currentStats && player.currentStats.length > 0) {
                                const newHistory = player.history ? [...player.history, ...player.currentStats] : [...player.currentStats];
                                return { ...player, history: newHistory, currentStats: [] };
                            } 
                            else if (!player.history.some(h => h.season === seasonThatEnded)) {
                                const newHistoryEntry: PlayerSeasonStats = {
                                    season: seasonThatEnded,
                                    team: team.name,
                                    league: team.leagueDivision,
                                    gamesPlayed: 0, goals: 0, assists: 0, points: 0, penaltyMinutes: 0,
                                    shotsAgainst: 0, saves: 0, shutouts: 0, goalsAgainst: 0,
                                    savePercentage: 0, goalsAgainstAverage: 0,
                                };
                                const newHistory = player.history ? [...player.history, newHistoryEntry] : [newHistoryEntry];
                                return { ...player, history: newHistory, currentStats: [] };
                            }
                            return player;
                        });
                        return { ...team, roster: updatedRoster, wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0 };
                    });

                    const finalStandings: TeamSeasonHistory[] = tempTeams.map(team => ({
                        teamName: team.name,
                        leagueDivision: team.leagueDivision,
                        nationalsDivision: team.nationalsDivision,
                        wins: team.wins,
                        losses: team.losses,
                        draws: team.draws,
                        points: team.points,
                        goalsFor: team.goalsFor,
                        goalsAgainst: team.goalsAgainst,
                    }));

                    setSeasonHistory(prev => ({
                        ...prev,
                        [seasonThatEnded]: finalStandings,
                    }));

                    tempTeams = tempTeams.map(team => {
                        const leftoverBudget = team.financials.discretionaryBudget;
                        const totalGames = getGamesPlayedForDivision(team.leagueDivision);
                        const numberOfHomeGames = Math.floor(totalGames / 2);
                        const numberOfAwayGames = Math.ceil(totalGames / 2);
                        const iceTimeCost = numberOfHomeGames * 350;
                        const travelCost = numberOfAwayGames * 500;
                        const equipmentCost = team.financials.equipmentCost;
                        const fixedCosts = iceTimeCost + travelCost + equipmentCost;
                        const newDiscretionaryBudget = (team.financials.totalBudget - fixedCosts) + leftoverBudget;

                        if (team.name === userTeam?.name) {
                            toast.info("New Season Budget Calculated", {
                                description: `Fixed costs of £${fixedCosts.toLocaleString()} deducted. £${leftoverBudget.toLocaleString()} carried over. You have £${newDiscretionaryBudget.toLocaleString()} available.`,
                            });
                        }

                        return {
                            ...team,
                            financials: {
                                ...team.financials,
                                discretionaryBudget: newDiscretionaryBudget,
                            }
                        };
                    });

                    const seasonString = `${prevDate.year}-${prevDate.year + 1}`;
                    const leagueDivisions = [...new Set(tempTeams.map(t => t.leagueDivision))];
                    const newAchievements: { teamName: string, achievement: Achievement }[] = [];

                    leagueDivisions.forEach(division => {
                        const teamsInDivision = tempTeams.filter(t => t.leagueDivision === division);
                        if (teamsInDivision.length > 0) {
                            const winner = teamsInDivision.sort((a, b) => {
                                if (b.points !== a.points) return b.points - a.points;
                                const goalDiffA = a.goalsFor - a.goalsAgainst;
                                const goalDiffB = b.goalsFor - b.goalsAgainst;
                                if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
                                return b.goalsFor - a.goalsFor;
                            })[0];
                            
                            newAchievements.push({
                                teamName: winner.name,
                                achievement: {
                                    type: 'Division Title',
                                    season: seasonString,
                                    division: division
                                }
                            });
                        }
                    });

                    if (newAchievements.length > 0) {
                        setTeamAchievements(prev => {
                            const updated = JSON.parse(JSON.stringify(prev));
                            newAchievements.forEach(({ teamName, achievement }) => {
                                if (!updated[teamName]) updated[teamName] = [];
                                if (!updated[teamName].some((ach: Achievement) => ach.type === achievement.type && ach.season === achievement.season && ach.division === achievement.division)) {
                                    updated[teamName].push(achievement);
                                }
                            });
                            return updated;
                        });
                    }
                    
                    tempSeasonRecords = {};
                    
                    const newAlumni: Player[] = [];
                    const newTransferPoolPlayers: Player[] = [];

                    tempTeams = tempTeams.map(team => {
                        const graduatingPlayers: Player[] = [];
                        const remainingPlayers = team.roster.filter(player => {
                            const eligibilityMap: { [key in Player['eligibility']]: Player['eligibility'] | null } = {
                                "UG Year 1": "UG Year 2", "UG Year 2": "UG Year 3", "UG Year 3": "UG Year 4",
                                "UG Year 4": null, "Masters": null, "PhD": null, "Staff": "Staff"
                            };
                            const nextEligibility = eligibilityMap[player.eligibility];
                            
                            const isGraduating = (player.eligibility === 'UG Year 4' && !player.isContinuingEducation) || 
                                                 ((player.eligibility === 'Masters' || player.eligibility === 'PhD') && (player.yearsLeftInProgram || 0) <= 0);

                            if (isGraduating) {
                                graduatingPlayers.push(player);
                                return false;
                            } else if (nextEligibility) {
                                player.eligibility = nextEligibility;
                                player.age += 1;
                                if (player.eligibility === 'Masters' || player.eligibility === 'PhD') {
                                    player.yearsLeftInProgram = (player.yearsLeftInProgram || 1) - 1;
                                }
                                return true;
                            } else if (player.eligibility !== 'Staff') {
                                graduatingPlayers.push(player);
                                return false;
                            }
                            return true;
                        });

                        graduatingPlayers.forEach(player => {
                            const isManaged = managedTeamNames.includes(team.name);
                            const roll = Math.random();
                            
                            if (roll < 0.85) {
                                player.alumniStatus = 'Retired';
                                newAlumni.push(player);
                                if (isManaged) {
                                    toast.info(`${player.name} has retired from university hockey.`);
                                }
                            } else if (roll < 0.95) {
                                player.alumniStatus = 'Transfer Listed';
                                newTransferPoolPlayers.push(player);
                                newAlumni.push(player);
                                if (isManaged) {
                                    toast.info(`${player.name} has graduated and entered the transfer portal.`);
                                }
                            } else {
                                player.eligibility = player.eligibility === 'UG Year 4' ? 'Masters' : 'PhD';
                                player.yearsLeftInProgram = player.eligibility === 'Masters' ? 2 : 4;
                                player.isContinuingEducation = true;
                                player.continuingEducationStartSeason = `${prevDate.year}-${prevDate.year + 1}`;
                                remainingPlayers.push(player);
                                if (isManaged) {
                                    toast.info(`${player.name} has graduated and enrolled in a ${player.eligibility} program to stay with the team!`);
                                }
                            }
                        });

                        team.roster = remainingPlayers;
                        return team;
                    });

                    if (newAlumni.length > 0) {
                        setAlumni(prev => [...prev, ...newAlumni]);
                    }

                    let availableForSigning = [...newTransferPoolPlayers];
                    const managedTeamNamesSet = new Set(managedTeamNames);
                    const aiTeams = tempTeams.filter(t => !managedTeamNamesSet.has(t.name));
                    if (aiTeams.length > 0) {
                        const playersSignedByAI: Player[] = [];
                        availableForSigning.forEach(player => {
                            if (Math.random() < 0.8) {
                                const signingTeam = getRandomItem(aiTeams);
                                const teamIndex = tempTeams.findIndex(t => t.id === signingTeam.id);
                                if (teamIndex !== -1) {
                                    tempTeams[teamIndex].roster.push(player);
                                    playersSignedByAI.push(player);
                                }
                            }
                        });
                        const signedPlayerIds = new Set(playersSignedByAI.map(p => p.id));
                        availableForSigning = availableForSigning.filter(p => !signedPlayerIds.has(p.id));
                    }

                    if (availableForSigning.length > 0) {
                        setTransferPool(prev => [...prev, ...availableForSigning]);
                        toast.info(`${availableForSigning.length} new players have entered the transfer portal.`);
                    }

                    const allOrgs = getTeamOrganizations();
                    const aiOrgsList = allOrgs.filter(org => org.name !== managedOrganization);
                    const allTeamNames = tempTeams.map(t => t.name);
                    let recruitmentOccurred = false;

                    aiOrgsList.forEach(org => {
                        const orgTeamNames = org.teams.map(t => t.name);
                        const orgTeams = tempTeams.filter(t => orgTeamNames.includes(t.name));
                        if (orgTeams.length === 0) return;

                        const targetRosterSize = orgTeams.length * 21;
                        const currentRosterSize = orgTeams.reduce((sum, t) => sum + t.roster.length, 0);
                        const playersToRecruitCount = Math.max(0, targetRosterSize - currentRosterSize);

                        if (playersToRecruitCount > 0) {
                            recruitmentOccurred = true;
                            const primaryTeam = orgTeams.sort((a, b) => b.name.localeCompare(a.name))[0];
                            const prospects = generateRecruits(primaryTeam.leagueDivision, allTeamNames, playersToRecruitCount * 2, primaryTeam.facilities);
                            
                            prospects.sort((a, b) => b.potentialAbility - a.potentialAbility);
                            const newRecruits = prospects.slice(0, playersToRecruitCount);

                            const lowestTierTeamName = orgTeams.sort((a, b) => b.name.localeCompare(a.name))[0].name;
                            const lowestTierTeamIndex = tempTeams.findIndex(t => t.name === lowestTierTeamName);

                            if (lowestTierTeamIndex !== -1) {
                                const teamToUpdate = tempTeams[lowestTierTeamIndex];
                                const usedJerseyNumbers = new Set(teamToUpdate.roster.map(p => p.jerseyNumber));
                                
                                newRecruits.forEach(recruit => {
                                    let newJerseyNumber = 1;
                                    while (usedJerseyNumbers.has(newJerseyNumber)) { newJerseyNumber++; }
                                    recruit.jerseyNumber = newJerseyNumber;
                                    usedJerseyNumbers.add(newJerseyNumber);
                                    const isSkater = recruit.positions[0] !== 'G';
                                    recruit.starRating = calculateStarRating(recruit.currentAbility, isSkater, teamToUpdate.leagueDivision);
                                });

                                teamToUpdate.roster.push(...newRecruits);
                                tempTeams[lowestTierTeamIndex] = teamToUpdate;
                            }
                        }
                    });

                    if (recruitmentOccurred) {
                        toast.info("AI teams have recruited new players for the upcoming season.");
                    }

                    tempTeams = tempTeams.map(team => {
                        const updatedRoster = team.roster.map(player => {
                            if (player.currentStats && player.currentStats.length > 0) {
                                const newHistory = player.history ? [...player.history, ...player.currentStats] : [...player.currentStats];
                                return { ...player, history: newHistory, currentStats: [] };
                            }
                            return player;
                        });
                        return { ...team, roster: updatedRoster, wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0 };
                    });
                }
                month = months[nextMonthIndex];
            }
            return { month, week, year };
        })(currentDate);

        if (newDevelopmentLogs.length > 0) setDevelopmentHistory(prev => [...newDevelopmentLogs, ...prev].slice(0, 200));
        if (newDate.month === 'August' && newDate.week === 2 && !(currentDate.month === 'August' && currentDate.week === 2)) {
            tempSchedule = generateSeasonSchedule(tempTeams, newDate);
            toast.success(`New season schedule generated for ${newDate.year}-${newDate.year + 1}!`);
            setScoutingPool([]);
            setFairHosted(false);
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

    const markGameAsCompleted = (gameId: string, homeScore: number, awayScore: number) => {
        setSchedule(prevSchedule =>
            prevSchedule.map(game =>
                game.id === gameId
                    ? { ...game, status: 'completed', result: { homeScore, awayScore } }
                    : game
            )
        );
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
                starRating: calculateStarRating(player.currentAbility, isSkater, toTeam.leagueDivision),
                captaincy: null,
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
        const loyaltyModifier = (player.attributes.loyalty - 10) / 25;
        const ambitionModifier = (player.attributes.ambition - 10) / 25;
        
        const successChance = baseSuccessChance - loyaltyModifier + ambitionModifier;

        if (Math.random() < successChance) {
            toast.success("Transfer Approved!", {
                description: `${player.name} has agreed to the move and is now available in the Transfer Portal.`
            });
            
            setTeams(currentTeams => {
                const fromTeam = currentTeams.find(t => t.name === fromTeamName);
                if (!fromTeam) return currentTeams;
                
                const playerToRemove = fromTeam.roster.find(p => p.id === playerId);
                if (!playerToRemove) return currentTeams;

                setTransferPool(prev => [...prev, playerToRemove]);

                const newFromRoster = fromTeam.roster.filter(p => p.id !== playerId);
                const updatedFromTeam = { ...fromTeam, roster: newFromRoster };
                
                return currentTeams.map(t => t.name === fromTeamName ? updatedFromTeam : t);
            });
        } else {
            const reasonRoll = Math.random();
            let reasonText: string;
            if (reasonRoll < 0.4) reasonText = `The manager of ${fromTeamName} has blocked the transfer, wanting to keep the player.`;
            else if (reasonRoll < 0.8) reasonText = `${player.name} has declined the offer to move to ${toTeamName}, citing loyalty to their current team.`;
            else reasonText = `${player.name} is happy where they are and does not wish to move at this time.`;
            toast.error("Transfer Denied", { description: reasonText });
        }
    };

    const processGameResults = (userTeam: Team, opponentTeam: Team, gameState: GameState, isNationalsGame: boolean = false, nationalsDivision?: string, gameId?: string) => {
        const currentSeasonString = `${currentDate.year}-${currentDate.year + 1}`;
        const { updatedUserTeam, updatedOpponentTeam } = processGameResultsEngine(userTeam, opponentTeam, gameState, currentSeasonString, isNationalsGame);
        
        setTeams(currentTeams =>
            currentTeams.map(t => {
                if (t.name === updatedUserTeam.name) return updatedUserTeam;
                if (t.name === updatedOpponentTeam.name) return updatedOpponentTeam;
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

    const playNationalsRound = (division: string, userGameResult?: { homeTeamName: string, awayTeamName: string, homeScore: number, awayScore: number, gameId: string }) => {
        const { updatedTeams, updatedNationalsData, newAchievements } = processNationalsRound(division, teams, nationalsData, currentDate.year, userGameResult);
        setTeams(updatedTeams);
        setNationalsData(updatedNationalsData);
        if (newAchievements.length > 0) {
            setTeamAchievements(prev => {
                const updated = JSON.parse(JSON.stringify(prev));
                newAchievements.forEach(({ teamName, achievement }) => {
                    if (!updated[teamName]) updated[teamName] = [];
                    if (!updated[teamName].some((ach: Achievement) => ach.type === achievement.type && ach.season === achievement.season && ach.division === achievement.division)) {
                        updated[teamName].push(achievement);
                        toast.success(`${teamName} has won the ${achievement.division} ${achievement.type === 'Nationals Gold' ? 'Gold' : 'Silver'} Championship!`);
                    }
                });
                return updated;
            });
        }
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
        const currentSeasonString = `${currentDate.year}-${currentDate.year + 1}`;
        processGameResults(userTeam, opponent, finalGameState, true, division, gameId);
    };

    const runStudentLifeInitiative = () => {
        if (!userTeam) return;
        const cost = 150;
        const currentBudget = userTeam.financials.discretionaryBudget;

        if (currentBudget < cost) {
            toast.error("Insufficient Discretionary Budget", {
                description: `You need £${cost.toLocaleString()} but only have £${currentBudget.toLocaleString()} available.`,
            });
            return;
        }

        const newFinancials = {
            ...userTeam.financials,
            discretionaryBudget: Math.round(currentBudget - cost),
        };
        
        if (Math.random() < 0.5) {
            const newRoster = userTeam.roster.map(player => ({
                ...player,
                morale: updateMorale(player.morale, 1)
            }));

            updateTeam({ ...userTeam, roster: newRoster, financials: newFinancials });
            toast.success("Student Life Initiative Successful!", {
                description: `Team morale has improved. Cost: £${cost.toLocaleString()}.`,
            });
        } else {
            updateTeam({ ...userTeam, financials: newFinancials });
            toast.error("Student Life Initiative Failed", {
                description: `The event didn't have the desired effect on morale. Cost: £${cost.toLocaleString()}.`,
            });
        }
    };

    const updatePlayerTrainingFocus = (playerId: string, focus: TrainingFocus) => {
        if (!userTeam) return;
        const newRoster = userTeam.roster.map(p => p.id === playerId ? { ...(p as Player), trainingFocus: focus } : p);
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
            return { ...(player as Player), trainingFocus: weakestFocus };
        });

        updateTeam({ ...userTeam, roster: newRoster });
        toast.success("Training focuses have been auto-assigned based on players' weakest areas.");
    };

    const generateScoutingPool = () => {
        if (!userTeam) return;
        const allTeamNames = teams.map(t => t.name).filter(name => name !== userTeam.name);
        const newRecruits = generateRecruits(userTeam.leagueDivision, allTeamNames, undefined, userTeam.facilities);
        setScoutingPool(newRecruits);
        setFairHosted(true);
    };

    const recruitPlayer = (playerId: string) => {
        if (!userTeam) return;
        const playerToRecruit = scoutingPool.find(p => p.id === playerId);
        if (!playerToRecruit) return;

        const cost = playerToRecruit.recruitmentCost || 500;
        const currentBudget = userTeam.financials.discretionaryBudget;

        if (currentBudget < cost) {
            toast.error("Insufficient Discretionary Budget", {
                description: `You need £${cost.toLocaleString()} but only have £${currentBudget.toLocaleString()} available.`,
            });
            return;
        }

        const newFinancials = {
            ...userTeam.financials,
            discretionaryBudget: Math.round(currentBudget - cost),
        };
        
        updateTeam({ ...userTeam, financials: newFinancials });
        toast.success("Player Recruited", {
            description: `${playerToRecruit.name} has been recruited for £${cost.toLocaleString()}. They are now in your recruited pool.`
        });

        setRecruitedPool(prev => [...prev, playerToRecruit]);
        setScoutingPool(prev => prev.filter(p => p.id !== playerId));
    };

    const assignPlayerToRoster = (playerId: string) => {
        if (!userTeam) return;
        const playerToAssign = recruitedPool.find(p => p.id === playerId);
        if (!playerToAssign) return;

        const newRoster = [...userTeam.roster, playerToAssign];
        updateTeam({ ...userTeam, roster: newRoster });
        setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
    };

    const discardRecruit = (playerId: string) => {
        setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
    };

    const startFacilityProject = (projectId: string) => {
        if (!userTeam) return;
        const project = userTeam.facilities.find(p => p.id === projectId);
        if (!project || project.status !== 'Not Started') return;

        const cost = project.cost;
        const currentBudget = userTeam.financials.discretionaryBudget;

        if (currentBudget < cost) {
            toast.error("Insufficient Funds", { description: `You cannot afford to start ${project.name}.` });
            return;
        }

        const newFinancials = { ...userTeam.financials, discretionaryBudget: currentBudget - cost };
        const newFacilities = userTeam.facilities.map(p =>
            p.id === projectId ? { ...p, status: 'In Progress' as 'In Progress' } : p
        );

        updateTeam({ ...userTeam, financials: newFinancials, facilities: newFacilities });
        toast.success("Project Started", { description: `${project.name} is now under construction.` });
    };

    const saveGame = (saveName: string) => {
        if (!userTeam) return;
        const gameState = {
            teams, alumni, activeTeamName, managedOrganization, isManagingOrg, schedule,
            nationalsData, seasonRecords, careerRecords, teamAchievements, transferPool,
            seasonHistory, scoutingPool, recruitedPool, fairHosted, currentDate, developmentHistory,
        };
        localStorage.setItem(`savegame_${saveName}`, JSON.stringify(gameState));

        const newSaveSlot: SaveGameSlot = {
            saveName,
            userTeamName: userTeam.name,
            currentDate,
            savedAt: new Date().toISOString(),
        };

        setSavedGames(prev => {
            const existingIndex = prev.findIndex(s => s.saveName === saveName);
            if (existingIndex > -1) {
                const newSaves = [...prev];
                newSaves[existingIndex] = newSaveSlot;
                return newSaves;
            }
            return [...prev, newSaveSlot];
        });

        toast.success("Game Saved", { description: `Your progress has been saved as "${saveName}".` });
    };

    const loadGame = (saveName: string) => {
        const savedStateJSON = localStorage.getItem(`savegame_${saveName}`);
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            setTeams(savedState.teams);
            setAlumni(savedState.alumni);
            setActiveTeamName(savedState.activeTeamName);
            setManagedOrganization(savedState.managedOrganization);
            setIsManagingOrg(savedState.isManagingOrg);
            setSchedule(savedState.schedule);
            setNationalsData(savedState.nationalsData);
            setSeasonRecords(savedState.seasonRecords);
            setCareerRecords(savedState.careerRecords);
            setTeamAchievements(savedState.teamAchievements);
            setTransferPool(savedState.transferPool);
            setSeasonHistory(savedState.seasonHistory);
            setScoutingPool(savedState.scoutingPool);
            setRecruitedPool(savedState.recruitedPool);
            setFairHosted(savedState.fairHosted);
            setCurrentDate(savedState.currentDate);
            setDevelopmentHistory(savedState.developmentHistory);
            toast.success("Game Loaded", { description: `Successfully loaded "${saveName}".` });
        } else {
            toast.error("Load Failed", { description: `Could not find save file "${saveName}".` });
        }
    };

    const deleteGame = (saveName: string) => {
        localStorage.removeItem(`savegame_${saveName}`);
        setSavedGames(prev => prev.filter(s => s.saveName !== saveName));
        toast.info("Save Deleted", { description: `The save file "${saveName}" has been deleted.` });
    };

    const exitToMainMenu = () => {
        selectTeam(null);
    };

    const simulateFullNationalsTournament = (division: string) => {
        let tempTeams = JSON.parse(JSON.stringify(teams));
        let tempNationalsData = JSON.parse(JSON.stringify(nationalsData));
        let tournament = tempNationalsData[currentDate.year]?.[division];

        if (!tournament) return;

        while (tournament.status !== 'completed') {
            const { updatedTeams, updatedNationalsData } = processNationalsRound(division, tempTeams, tempNationalsData, currentDate.year);
            tempTeams = updatedTeams;
            tempNationalsData = updatedNationalsData;
            tournament = tempNationalsData[currentDate.year]?.[division];
        }
        setTeams(tempTeams);
        setNationalsData(tempNationalsData);
        toast.success(`${division} tournament simulated.`);
    };

    const simulateAllNationalsTournaments = () => {
        let tempTeams = JSON.parse(JSON.stringify(teams));
        let tempNationalsData = JSON.parse(JSON.stringify(nationalsData));
        const divisions = Object.keys(tempNationalsData[currentDate.year] || {});

        divisions.forEach(division => {
            let tournament = tempNationalsData[currentDate.year]?.[division];
            if (!tournament) return;
            while (tournament.status !== 'completed') {
                const { updatedTeams, updatedNationalsData } = processNationalsRound(division, tempTeams, tempNationalsData, currentDate.year);
                tempTeams = updatedTeams;
                tempNationalsData = updatedNationalsData;
                tournament = tempNationalsData[currentDate.year]?.[division];
            }
        });
        setTeams(tempTeams);
        setNationalsData(tempNationalsData);
        toast.success(`All national tournaments simulated.`);
    };

    const simulateSingleNationalsGame = (division: string, gameId: string) => {
        let tempTeams = JSON.parse(JSON.stringify(teams));
        let tempNationalsData = JSON.parse(JSON.stringify(nationalsData));
        const tournament = tempNationalsData[currentDate.year]?.[division];
        if (!tournament) return;

        const allGames = [...tournament.groupStageSchedule, ...tournament.playoffSchedule];
        const game = allGames.find(g => g.id === gameId);
        if (!game || typeof game.homeTeam !== 'string' || typeof game.awayTeam !== 'string') return;

        const homeTeam = tempTeams.find(t => t.name === game.homeTeam);
        const awayTeam = tempTeams.find(t => t.name === game.awayTeam);
        if (!homeTeam || !awayTeam) return;

        const finalGameState = simulateFullGame(homeTeam, awayTeam, true);
        
        const { updatedTeams, updatedNationalsData } = processNationalsRound(division, tempTeams, tempNationalsData, currentDate.year, {
            gameId,
            homeScore: finalGameState.userScore,
            awayScore: finalGameState.opponentScore,
            homeTeamName: homeTeam.name,
            awayTeamName: awayTeam.name,
        });

        setTeams(updatedTeams);
        setNationalsData(updatedNationalsData);
    };

    const signPlayerFromTransferPool = (playerId: string, toTeamName: string) => {
        const playerToSign = transferPool.find(p => p.id === playerId);
        const toTeam = teams.find(t => t.name === toTeamName);

        if (!playerToSign || !toTeam) {
            toast.error("Failed to sign player.");
            return;
        }

        const newRoster = [...toTeam.roster, playerToSign];
        const updatedToTeam = { ...toTeam, roster: newRoster };

        setTeams(prevTeams => prevTeams.map(t => t.name === toTeamName ? updatedToTeam : t));
        setTransferPool(prev => prev.filter(p => p.id !== playerId));

        toast.success(`${playerToSign.name} signed with ${toTeamName}.`);
    };

    const value = {
        teams, updateTeam, userTeam, organizationFinancials, organizationFacilities, selectTeam,
        scoutingPool, recruitedPool, fairHosted, generateScoutingPool, recruitPlayer,
        assignPlayerToRoster, discardRecruit, runStudentLifeInitiative, startFacilityProject,
        currentDate, advanceWeek, developmentHistory, updatePlayerTrainingFocus, autoAssignTrainingFocuses,
        processGameResults, movePlayer, requestPlayerTransfer, managedOrganization, isManagingOrg,
        managedTeams, selectOrganization, setActiveTeam, schedule, gameForCurrentWeek, nationalsData,
        markGameAsCompleted, seasonRecords, careerRecords, alumni, playNationalsRound,
        autoSimulateUserNationalsGame, teamAchievements, saveGame, exitToMainMenu, transferPool,
        seasonHistory, savedGames, loadGame, deleteGame, simulateFullNationalsTournament,
        simulateSingleNationalsGame, simulateAllNationalsTournaments, signPlayerFromTransferPool,
    };

    return (
        <TeamContext.Provider value={value}>
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