import { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Team, Player, SkaterAttributes, GoalieAttributes, DevelopmentLog, TrainingFocus, GameState, FacilityProject, Financials, ScheduleEntry, GameDate, PlayerSeasonStats, RecordCategory, TeamRecord, NationalsPlayoffMatch, Achievement, TeamAchievements, SeasonHistory, SaveGameSlot, TeamSeasonHistory, NationalsTournament, TacticsSelection } from '@/types';
import { teams as initialTeams, getTeamOrganizations, getOrganizationName, getTeamOrganizationalTier } from '@/data/teams';
import { generateRecruits, calculateStarRating, getGamesPlayedForDivision, generateRoster } from '@/lib/playerGenerator'; 
import { toast } from 'sonner';
import { calculateCurrentAbility } from '@/lib/playerGenerator';
import { trainingFocusesMap } from '@/data/trainingFocuses';
import { skaterFocuses, goalieFocuses } from '@/data/trainingFocuses';
import { processGameResults as processGameResultsEngine } from '@/lib/statsEngine';
import { generateSeasonSchedule } from '@/lib/scheduleGenerator';
import { simulateFullGame } from '@/lib/gameEngine';
import { validateLineup } from '@/lib/lineupValidation';
import { createNationalsTournament } from '@/lib/nationalsGenerator';
import { isRivalryGame } from '@/lib/rivalries';
import { rebalanceOrganizationRosters } from '@/lib/aiManager';
import { processNationalsRound as processNationalsRoundEngine } from '@/lib/nationalsSimulator';
import { getAggregatedCurrentStats } from '@/lib/statsUtils';
import { getPromotionTarget, getRelegationTarget, getDivisionRank, getTierName } from '@/lib/leagueUtils';
import { populateLineup } from '@/lib/lineupUtils';
import { initialFacilityProjects } from '@/data/facilities';
import { teamLogos } from '@/data/logos';

const months = ["August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June", "July"];
const moraleLevels: Player['morale'][] = ["Angry", "Unhappy", "Content", "Happy"];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const shuffleArray = <T,>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const defaultTactics: TacticsSelection = {
    "Breakout": "Flexible Reaction",
    "Neutral Zone Offence": "Balanced Attack",
    "Attacking Zone Offence": "Lane Positioning",
    "Forechecking": "1-2-2",
    "Neutral Zone Coverage": "1-2-2 Retreat",
    "Defensive Zone Coverage": "Strict Zonal",
};

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
    formNewSquad: () => void;
    updateTeamDivision: (teamName: string, newDivision: string) => void;
    updateTeamNationalsDivision: (teamName: string, newNationalsDivision: string) => void;
    renameDivision: (oldName: string, newName: string) => void;
    createCustomTeam: (name: string, region: 'North' | 'South', logo: string) => void;
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
        const organizations = getTeamOrganizations(teams); // Pass current teams state
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
            setManagedOrganization(null);
            setActiveTeamName(null);
            setIsManagingOrg(false);
        }
    };

    const selectOrganization = (orgName: string | null) => {
        if (orgName) {
            const organizations = getTeamOrganizations(teams); // Pass current teams state
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
                    // Correctly determine opponent name based on userGame object
                    const opponentName = (typeof userGame.homeTeam === 'string' && userTeam.name === userGame.homeTeam)
                        ? (typeof userGame.awayTeam === 'string' ? userGame.awayTeam : 'TBD')
                        : (typeof userGame.homeTeam === 'string' ? userGame.homeTeam : 'TBD');
                    
                    return {
                        id: userGame.id,
                        opponent: opponentName,
                        date: userGame.date,
                        isNationals: true,
                        homeTeam: userGame.homeTeam,
                        awayTeam: userGame.awayTeam as string | { winnerOf: string }, // Ensure type correctness
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
        
        // Weekly income from facilities
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

        // AI Organization Roster Rebalancing
        const allOrgs = getTeamOrganizations(tempTeams); // Pass tempTeams here
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

        // Declare and initialize temporary variables for records and nationals data
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
                    if (stats.gamesPlayed >= 5) { // Goalie eligibility for in-season records
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
            let nextMonthIndex = monthIndex; // Declare nextMonthIndex here

            week += 1; // Always advance by one week

            // Handle month rollover
            if (week > 4) { // If week exceeds 4, roll over to next month
                week = 1;
                nextMonthIndex = (monthIndex + 1) % months.length; // Assign new value
                if (month === "July" && months[nextMonthIndex] === "August") {
                    year += 1;
                    toast.info("Season Ended", { description: `The ${prevDate.year}-${prevDate.year + 1} season has concluded. Stats are being archived.` });
                    
                    const seasonThatEnded = `${prevDate.year}-${prevDate.year + 1}`;
                    
                    // --- DYNAMIC DIVISION SPLITTING & PROMOTION/RELEGATION LOGIC ---
                    let promotionRelegationChanges: { teamName: string, newDivision: string }[] = [];

                    // --- Standard Promotion & Relegation Logic ---
                    const leagueDivisions = [...new Set(tempTeams.map(t => t.leagueDivision))];

                    leagueDivisions.forEach(division => {
                        const teamsInDivision = tempTeams
                            .filter(t => t.leagueDivision === division)
                            .sort((a, b) => {
                                if (b.points !== a.points) return b.points - a.points;
                                const goalDiffA = a.goalsFor - a.goalsAgainst;
                                const goalDiffB = b.goalsFor - b.goalsAgainst;
                                if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
                                return b.goalsFor - a.goalsFor;
                            });

                        if (teamsInDivision.length < 1) return;

                        // --- Promotion Logic ---
                        const promotionTarget = getPromotionTarget(division);
                        if (promotionTarget) {
                            for (const promotionCandidate of teamsInDivision) {
                                if (promotionRelegationChanges.some(c => c.teamName === promotionCandidate.name)) continue;

                                let isEligible = true;
                                const candidateOrg = getOrganizationName(promotionCandidate.name);
                                const promotionTargetRank = getDivisionRank(promotionTarget);
                                
                                const seniorTeams = tempTeams.filter(t => 
                                    getOrganizationName(t.name) === candidateOrg &&
                                    getTeamOrganizationalTier(t.name) < getTeamOrganizationalTier(promotionCandidate.name)
                                );

                                for (const seniorTeam of seniorTeams) {
                                    const seniorTeamRank = getDivisionRank(seniorTeam.leagueDivision);
                                    if (seniorTeamRank > promotionTargetRank) {
                                        isEligible = false;
                                        break;
                                    }
                                }

                                if (isEligible) {
                                    promotionRelegationChanges.push({
                                        teamName: promotionCandidate.name,
                                        newDivision: promotionTarget,
                                    });
                                    break; 
                                }
                            }
                        }

                        // --- Relegation Logic ---
                        const relegationTarget = getRelegationTarget(division);
                        if (relegationTarget && teamsInDivision.length > 0) {
                            const relegationCandidate = teamsInDivision[teamsInDivision.length - 1];
                            if (relegationCandidate && !promotionRelegationChanges.some(c => c.teamName === relegationCandidate.name)) {
                                promotionRelegationChanges.push({
                                    teamName: relegationCandidate.name,
                                    newDivision: relegationTarget,
                                });
                            }
                        }
                    });

                    // --- Apply Changes ---
                    if (promotionRelegationChanges.length > 0) {
                        toast.info("Off-season promotions and relegations are being processed...");
                        promotionRelegationChanges.forEach(({ teamName, newDivision }) => {
                            const teamIndex = tempTeams.findIndex(t => t.name === teamName);
                            if (teamIndex !== -1) {
                                const originalDivision = tempTeams[teamIndex].leagueDivision;
                                const isPromotion = getDivisionRank(newDivision) < getDivisionRank(originalDivision);

                                tempTeams[teamIndex].leagueDivision = newDivision;
                                tempTeams[teamIndex].nationalsDivision = getTierName(newDivision);

                                tempTeams[teamIndex].roster = tempTeams[teamIndex].roster.map(player => {
                                    const isSkater = !player.positions.includes('G');
                                    return {
                                        ...player,
                                        starRating: calculateStarRating(player.currentAbility, isSkater, newDivision),
                                    };
                                });

                                if (managedOrganization && getOrganizationName(teamName) === managedOrganization) {
                                    toast.success(isPromotion
                                        ? `Congratulations! ${teamName} has been promoted to ${newDivision}!`
                                        : `Unfortunately, ${teamName} has been relegated to ${newDivision}.`
                                    );
                                }
                            }
                        });
                    }

                    // Archive player stats for the season that just ended
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

                    // New season budget calculations
                    tempTeams = tempTeams.map(team => {
                        const unspentBudget = team.financials.discretionaryBudget;

                        const teamsInDivisionCount = tempTeams.filter(t => t.leagueDivision === team.leagueDivision).length;
                        const numberOfHomeGames = teamsInDivisionCount > 1 ? teamsInDivisionCount - 1 : 0;
                        const numberOfAwayGames = teamsInDivisionCount > 1 ? teamsInDivisionCount - 1 : 0;

                        const iceTimeCost = numberOfHomeGames * 350;
                        const travelCost = numberOfAwayGames * 500;

                        const equipmentCost = team.financials.equipmentCost;
                        const fixedCosts = iceTimeCost + travelCost + equipmentCost;
                        
                        const newDiscretionaryBudget = (team.financials.totalBudget - fixedCosts) + unspentBudget;

                        if (team.name === userTeam?.name) {
                            toast.info("New Season Budget Calculated", {
                                description: `Fixed costs of £${fixedCosts.toLocaleString()} deducted. You have £${newDiscretionaryBudget.toLocaleString()} available for upgrades (including £${unspentBudget.toLocaleString()} carried over).`,
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
                    const newLeagueDivisions = [...new Set(tempTeams.map(t => t.leagueDivision))];
                    const newAchievements: { teamName: string, achievement: Achievement }[] = [];

                    newLeagueDivisions.forEach(division => {
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
                    
                    const allOrgs = getTeamOrganizations(tempTeams);
                    const aiOrgs = allOrgs.filter(org => org.name !== managedOrganization);

                    if (aiOrgs.length > 0) {
                        const shuffledAiOrgs = shuffleArray(aiOrgs);
                        const playersForAISigning: Player[] = [];
                        
                        availableForSigning.forEach(player => {
                            if (Math.random() < 0.8) { 
                                playersForAISigning.push(player);
                            }
                        });

                        let orgAssignIndex = 0;
                        playersForAISigning.forEach(player => {
                            const signingOrg = shuffledAiOrgs[orgAssignIndex % shuffledAiOrgs.length];
                            
                            const lowestTierTeamInOrg = signingOrg.teams.sort((a, b) => getTeamOrganizationalTier(b.name) - getTeamOrganizationalTier(a.name))[0];
                            const teamIndexInTemp = tempTeams.findIndex(t => t.name === lowestTierTeamInOrg.name);
                            
                            if (teamIndexInTemp !== -1) {
                                tempTeams[teamIndexInTemp].roster.push(player);
                            }
                            orgAssignIndex++;
                        });
                        
                        const signedPlayerIds = new Set(playersForAISigning.map(p => p.id));
                        availableForSigning = availableForSigning.filter(p => !signedPlayerIds.has(p.id));
                    }

                    if (availableForSigning.length > 0) {
                        setTransferPool(prev => [...prev, ...availableForSigning]);
                        toast.info(`${availableForSigning.length} new players have entered the transfer portal.`);
                    }

                    const allOrgsList = getTeamOrganizations(tempTeams);
                    const aiOrgsList = allOrgsList.filter(org => org.name !== managedOrganization);
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
                            const lowestTierTeam = orgTeams.sort((a, b) => getTeamOrganizationalTier(b.name) - getTeamOrganizationalTier(a.name))[0];
                            const prospects = generateRecruits(lowestTierTeam.leagueDivision, allTeamNames, playersToRecruitCount * 2, lowestTierTeam.facilities);
                            
                            prospects.sort((a, b) => b.potentialAbility - a.potentialAbility);
                            const newRecruits = prospects.slice(0, playersToRecruitCount);

                            const lowestTierTeamIndex = tempTeams.findIndex(t => t.name === lowestTierTeam.name);

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
            // AI Team Expansion Logic (runs once per year, in July before rolling to August)
            if (month === "July" && nextMonthIndex === months.indexOf("August")) {
                let newAITeamsCount = 0;
                const maxNewAITeams = 2; // Global limit for new AI teams per season

                const aiOrgsForExpansion = shuffleArray(allOrgs.filter(org => org.name !== managedOrganization));

                for (const org of aiOrgsForExpansion) {
                    if (newAITeamsCount >= maxNewAITeams) break;

                    // 20% chance for an AI organization to form a new squad
                    if (Math.random() < 0.2) {
                        const orgTeams = tempTeams.filter(t => getOrganizationName(t.name) === org.name);
                        const existingTiers = orgTeams.map(t => getTeamOrganizationalTier(t.name));
                        const nextTier = Math.max(...existingTiers) + 1;

                        const suffixMap: { [key: number]: string } = { 1: 'B', 2: 'C', 3: 'D', 4: 'E' };
                        const newSuffix = suffixMap[nextTier];

                        if (!newSuffix) {
                            // Cannot create more teams for this organization (e.g., already have A, B, C, D, E)
                            continue;
                        }

                        const baseName = orgTeams.find(t => getTeamOrganizationalTier(t.name) === 0)?.name || org.name;
                        const newTeamName = `${baseName} ${newSuffix}`;

                        // Determine region for the new team's division based on the main team's region
                        const sampleTeamInOrg = orgTeams[0]; 
                        const newLeagueDivision = sampleTeamInOrg.leagueDivision.includes('North') ? 'Non Checking 3 - North' : 'Non Checking 3 - South';

                        const roster = generateRoster(newLeagueDivision, newTeamName); // Generate full roster
                        const lineup = populateLineup(roster); // Populate lineup based on new roster

                        const equipmentCost = Math.floor(Math.random() * (2500 - 1500 + 1)) + 1500;
                        const teamsInDivisionCount = tempTeams.filter(t => t.leagueDivision === newLeagueDivision).length;
                        const finalTeamCount = teamsInDivisionCount + 1;
                        const numberOfHomeGames = finalTeamCount > 1 ? finalTeamCount - 1 : 0;
                        const numberOfAwayGames = finalTeamCount > 1 ? finalTeamCount - 1 : 0;

                        const iceTimeCost = numberOfHomeGames * 350;
                        const travelCost = numberOfAwayGames * 500;

                        const initialFixedCosts = iceTimeCost + travelCost; 
                        const teamBudget = 7500; // Base budget for new lower-tier teams

                        const newTeam: Team = {
                            id: crypto.randomUUID(),
                            name: newTeamName,
                            leagueDivision: newLeagueDivision,
                            nationalsDivision: getTierName(newLeagueDivision),
                            roster,
                            lineup,
                            tactics: sampleTeamInOrg.tactics, // Inherit tactics from main team
                            wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0,
                            points: 0,
                            logo: teamLogos[org.name], // Use organization's logo
                            financials: {
                                totalBudget: teamBudget,
                                discretionaryBudget: teamBudget - initialFixedCosts,
                                iceTimeCostPerGame: 350,
                                equipmentCost: equipmentCost,
                            },
                            facilities: initialFacilityProjects.map(p => ({ ...p })), // New facilities for new team
                        };

                        tempTeams.push(newTeam);
                        newAITeamsCount++;
                        toast.info("AI Expansion", { description: `${newTeamName} has been formed by ${org.name}!` });
                    }
                }
            }
            return { month, week, year };
        })(currentDate);

        if (newDate.month === 'August' && newDate.week === 1 && !(currentDate.month === 'August' && currentDate.week === 1)) {
            setFairHosted(false);
            setScoutingPool([]);
            setRecruitedPool([]);
            toast.info("New Season Started", {
                description: "The recruitment fair is now available for the upcoming season."
            });
        }

        if (newDate.month === 'April' && newDate.week === 1 && !(currentDate.month === 'April' && currentDate.week === 1)) {
            toast.info("Generating Nationals Tournaments...");
            const nationalsYear = newDate.year;
            const newNationalsDataForYear: { [division: string]: NationalsTournament } = {};

            const teamsByNationalsDivision: { [division: string]: Team[] } = {};
            tempTeams.forEach(team => {
                if (team.nationalsDivision) {
                    if (!teamsByNationalsDivision[team.nationalsDivision]) {
                        teamsByNationalsDivision[team.nationalsDivision] = [];
                    }
                    teamsByNationalsDivision[team.nationalsDivision].push(team);
                }
            });

            const sortedTiers = Object.keys(teamsByNationalsDivision).sort((a, b) => {
                const rankA = getDivisionRank(a + " - North");
                const rankB = getDivisionRank(b + " - North");
                return rankB - rankA;
            });

            sortedTiers.forEach(tierName => {
                const teamsInTier = teamsByNationalsDivision[tierName];
                if (!teamsInTier || teamsInTier.length === 0) return;

                const regions = new Set(teamsInTier.map(t => t.leagueDivision.includes('North') ? 'North' : 'South'));

                if (regions.size === 1) {
                    const sampleLeagueDiv = teamsInTier[0].leagueDivision;
                    const promotionTargetDiv = getPromotionTarget(sampleLeagueDiv);
                    if (promotionTargetDiv) {
                        const promotionTierName = getTierName(promotionTargetDiv);
                        if (teamsByNationalsDivision[promotionTierName]) {
                            teamsByNationalsDivision[promotionTierName].push(...teamsInTier);
                            toast.info(`Nationals Qualification Update`, { description: `${tierName} teams will compete in the ${promotionTierName} Nationals tournament as their tier is not national.`});
                        } else {
                            teamsByNationalsDivision[promotionTierName] = teamsInTier;
                        }
                        delete teamsByNationalsDivision[tierName];
                    }
                }
            });

            Object.entries(teamsByNationalsDivision).forEach(([division, teamsInDivision]) => {
                if (teamsInDivision.length >= 4) {
                    newNationalsDataForYear[division] = createNationalsTournament(division, teamsInDivision, nationalsYear, 1);
                }
            });

            if (Object.keys(newNationalsDataForYear).length > 0) {
                tempNationalsData[nationalsYear] = newNationalsDataForYear;
                toast.success(`Nationals tournaments for ${nationalsYear} have been generated!`);
            } else {
                toast.warning(`Could not generate any Nationals tournaments for ${nationalsYear}. Not enough qualified teams.`);
            }
        }

        if (newDevelopmentLogs.length > 0) setDevelopmentHistory(prev => [...newDevelopmentLogs, ...prev].slice(0, 200));
        if (newDate.month === 'August' && newDate.week === 2 && !(currentDate.month === 'August' && currentDate.week === 2)) {
            tempSchedule = generateSeasonSchedule(tempTeams, newDate);
            toast.success(`New season schedule generated for ${newDate.year}-${newDate.year + 1}!`);
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
            
            const isSkater = !player.positions.includes('G');
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
        setTeams(currentTeams => {
            const fromTeam = currentTeams.find(t => t.name === fromTeamName);
            const toTeam = currentTeams.find(t => t.name === toTeamName);
            const player = fromTeam?.roster.find(p => p.id === playerId);

            if (!fromTeam || !toTeam || !player) {
                toast.error("Could not request transfer. Team or player not found.");
                return currentTeams;
            }

            // Check if player is already in transfer pool
            if (transferPool.some(p => p.id === playerId)) {
                toast.info("Transfer already requested", { description: `${player.name} is already in the transfer pool.` });
                return currentTeams;
            }

            // Remove player from current team
            const newFromRoster = fromTeam.roster.filter(p => p.id !== playerId);
            const updatedFromTeam = { ...fromTeam, roster: newFromRoster };

            // Add player to transfer pool
            const playerForTransferPool = { ...player, alumniStatus: 'Transfer Listed' as 'Transfer Listed' };
            setTransferPool(prev => [...prev, playerForTransferPool]);

            toast.success("Transfer Requested", { description: `${player.name} has been added to the transfer pool.` });

            return currentTeams.map(t => (t.name === fromTeamName ? updatedFromTeam : t));
        });
    };

    const signPlayerFromTransferPool = (playerId: string, toTeamName: string) => {
        setTeams(currentTeams => {
            const toTeam = currentTeams.find(t => t.name === toTeamName);
            const player = transferPool.find(p => p.id === playerId);

            if (!toTeam || !player) {
                toast.error("Could not sign player. Team or player not found.");
                return currentTeams;
            }

            // Remove player from transfer pool
            setTransferPool(prev => prev.filter(p => p.id !== playerId));

            // Add player to new team
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
                alumniStatus: undefined, // No longer in transfer pool
            };

            const newToRoster = [...toTeam.roster, updatedPlayer].sort((a, b) => a.jerseyNumber - b.jerseyNumber);
            const updatedToTeam = { ...toTeam, roster: newToRoster };

            toast.success("Player Signed!", { description: `${player.name} has signed with ${toTeam.name}.` });

            return currentTeams.map(t => (t.name === toTeamName ? updatedToTeam : t));
        });
    };

    const formNewSquad = () => {
        // This function is a placeholder for future expansion, e.g., creating a new team within an organization
        toast.info("Form New Squad", { description: "This feature is not yet implemented." });
    };

    const updateTeamDivision = (teamName: string, newDivision: string) => {
        setTeams(prevTeams => prevTeams.map(team => {
            if (team.name === teamName) {
                const isSkater = team.roster[0]?.positions[0] !== 'G'; // Assuming at least one player to determine type
                return {
                    ...team,
                    leagueDivision: newDivision,
                    nationalsDivision: getTierName(newDivision),
                    roster: team.roster.map(player => ({
                        ...player,
                        starRating: calculateStarRating(player.currentAbility, isSkater, newDivision),
                    })),
                };
            }
            return team;
        }));
        toast.success("Division Updated", { description: `${teamName}'s division has been updated to ${newDivision}.` });
    };

    const updateTeamNationalsDivision = (teamName: string, newNationalsDivision: string) => {
        setTeams(prevTeams => prevTeams.map(team => {
            if (team.name === teamName) {
                return {
                    ...team,
                    nationalsDivision: newNationalsDivision,
                };
            }
            return team;
        }));
        toast.success("Nationals Division Updated", { description: `${teamName}'s Nationals division has been updated to ${newNationalsDivision}.` });
    };

    const renameDivision = (oldName: string, newName: string) => {
        setTeams(prevTeams => prevTeams.map(team => {
            if (team.leagueDivision === oldName) {
                return { ...team, leagueDivision: newName };
            }
            return team;
        }));
        setSchedule(prevSchedule => prevSchedule.map(game => {
            let updatedGame = { ...game };
            if (typeof updatedGame.homeTeam === 'string' && updatedGame.homeTeam.includes(oldName)) {
                updatedGame.homeTeam = updatedGame.homeTeam.replace(oldName, newName);
            }
            if (typeof updatedGame.awayTeam === 'string' && updatedGame.awayTeam.includes(oldName)) {
                updatedGame.awayTeam = updatedGame.awayTeam.replace(oldName, newName);
            }
            return updatedGame;
        }));
        toast.success("Division Renamed", { description: `All teams in ${oldName} are now in ${newName}.` });
    };

    const createCustomTeam = (name: string, region: 'North' | 'South', logo: string) => {
        const newLeagueDivision = `Non Checking 3 - ${region}`;
        const roster: Player[] = [];
        const lineup = populateLineup(roster);

        const equipmentCost = Math.floor(Math.random() * (2500 - 1500 + 1)) + 1500;
        
        // DYNAMIC GAME COUNT LOGIC
        const teamsInDivisionCount = teams.filter(t => t.leagueDivision === newLeagueDivision).length;
        const finalTeamCount = teamsInDivisionCount + 1;
        const numberOfHomeGames = finalTeamCount > 1 ? finalTeamCount - 1 : 0;
        const numberOfAwayGames = finalTeamCount > 1 ? finalTeamCount - 1 : 0;

        const iceTimeCost = numberOfHomeGames * 350;
        const travelCost = numberOfAwayGames * 500;
        
        const initialFixedCosts = iceTimeCost + travelCost; 
        const teamBudget = 10000; // A bit more for a custom team to get started

        const newTeam: Team = {
            id: crypto.randomUUID(),
            name: name,
            leagueDivision: newLeagueDivision,
            nationalsDivision: getTierName(newLeagueDivision),
            roster,
            lineup,
            tactics: defaultTactics,
            wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0,
            points: 0,
            logo: logo,
            financials: {
                totalBudget: teamBudget,
                discretionaryBudget: teamBudget - initialFixedCosts,
                iceTimeCostPerGame: 350,
                equipmentCost: equipmentCost,
            },
            facilities: initialFacilityProjects.map(p => ({ ...p })),
        };

        setTeams(prevTeams => [...prevTeams, newTeam]);
        selectTeam(newTeam.name); // This will set active team and navigate
        toast.success("Club Created!", { description: `Welcome to ${newTeam.name}! Your first step is to recruit some players.` });
    };

    // Recruitment Functions
    const generateScoutingPool = () => {
        if (!userTeam) {
            toast.error("No active team selected.");
            return;
        }
        if (fairHosted) {
            toast.info("Recruitment Fair already hosted this season.");
            return;
        }
        const newPool = generateRecruits(userTeam.leagueDivision, teams.map(t => t.name), 20, userTeam.facilities);
        setScoutingPool(newPool);
        setFairHosted(true);
        toast.success("Recruitment Fair Hosted!", { description: "A new pool of prospects is available for scouting." });
    };

    const recruitPlayer = (playerId: string) => {
        const playerToRecruit = scoutingPool.find(p => p.id === playerId);
        if (playerToRecruit) {
            if (!userTeam) {
                toast.error("No active team selected.");
                return;
            }
            if (userTeam.financials.discretionaryBudget < (playerToRecruit.recruitmentCost || 0)) {
                toast.error("Insufficient Funds", { description: `You need £${playerToRecruit.recruitmentCost} to recruit this player.` });
                return;
            }

            setScoutingPool(prev => prev.filter(p => p.id !== playerId));
            setRecruitedPool(prev => [...prev, playerToRecruit]);
            
            // Deduct recruitment cost
            setTeams(currentTeams => currentTeams.map(t => {
                if (t.name === userTeam.name) {
                    return {
                        ...t,
                        financials: {
                            ...t.financials,
                            discretionaryBudget: t.financials.discretionaryBudget - (playerToRecruit.recruitmentCost || 0)
                        }
                    };
                }
                return t;
            }));

            toast.success("Player Recruited!", { description: `${playerToRecruit.name} has been recruited to your pool for £${playerToRecruit.recruitmentCost}.` });
        }
    };

    const assignPlayerToRoster = (playerId: string) => {
        if (!userTeam) {
            toast.error("No active team selected.");
            return;
        }
        const playerToAssign = recruitedPool.find(p => p.id === playerId);
        if (playerToAssign) {
            setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
            setTeams(currentTeams => currentTeams.map(t => {
                if (t.name === userTeam.name) {
                    const usedJerseyNumbers = new Set(t.roster.map(p => p.jerseyNumber));
                    let newJerseyNumber = 1;
                    while (usedJerseyNumbers.has(newJerseyNumber)) { newJerseyNumber++; }
                    const isSkater = playerToAssign.positions[0] !== 'G';
                    const updatedPlayer = {
                        ...playerToAssign,
                        jerseyNumber: newJerseyNumber,
                        starRating: calculateStarRating(playerToAssign.currentAbility, isSkater, t.leagueDivision),
                    };
                    return { ...t, roster: [...t.roster, updatedPlayer].sort((a, b) => a.jerseyNumber - b.jerseyNumber) };
                }
                return t;
            }));
            toast.success("Player Assigned!", { description: `${playerToAssign.name} has been added to your roster.` });
        }
    };

    const discardRecruit = (playerId: string) => {
        const playerToDiscard = recruitedPool.find(p => p.id === playerId);
        if (playerToDiscard) {
            setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
            toast.info("Recruit Discarded", { description: `${playerToDiscard.name} has been removed from your recruited pool.` });
        }
    };

    // Morale/Facility Functions
    const runStudentLifeInitiative = () => {
        if (!userTeam) return;
        setTeams(prevTeams => prevTeams.map(t => {
            if (t.name === userTeam.name) {
                const newRoster = t.roster.map(p => ({ ...p, morale: updateMorale(p.morale, 1) }));
                toast.success("Student Life Initiative", { description: "Team morale has been boosted!" });
                return { ...t, roster: newRoster };
            }
            return t;
        }));
    };

    const startFacilityProject = (projectId: string) => {
        if (!userTeam) return;
        setTeams(prevTeams => prevTeams.map(t => {
            if (t.name === userTeam.name) {
                const project = initialFacilityProjects.find(p => p.id === projectId);
                if (!project) return t;

                const existingProject = t.facilities.find(f => f.id === projectId);
                if (existingProject && existingProject.status !== 'Not Started') {
                    toast.error("Project already in progress or completed.");
                    return t;
                }

                if (t.financials.discretionaryBudget < project.cost) {
                    toast.error("Insufficient Funds", { description: `You need £${project.cost} to start this project.` });
                    return t;
                }

                const updatedFacilities = t.facilities.map(f => 
                    f.id === projectId ? { ...f, status: 'In Progress' as 'In Progress', weeksToComplete: project.weeksToComplete } : f
                );
                const updatedFinancials = { ...t.financials, discretionaryBudget: t.financials.discretionaryBudget - project.cost };
                toast.success("Project Started!", { description: `${project.name} is now under construction.` });
                return { ...t, facilities: updatedFacilities, financials: updatedFinancials };
            }
            return t;
        }));
    };

    // Training Functions
    const updatePlayerTrainingFocus = (playerId: string, focus: TrainingFocus) => {
        if (!userTeam) return;
        setTeams(prevTeams => prevTeams.map(t => {
            if (t.name === userTeam.name) {
                const newRoster = t.roster.map(p => p.id === playerId ? { ...p, trainingFocus: focus } : p);
                toast.success("Training Focus Updated", { description: `${newRoster.find(p => p.id === playerId)?.name}'s training focus set to ${focus}.` });
                return { ...t, roster: newRoster };
            }
            return t;
        }));
    };

    const autoAssignTrainingFocuses = () => {
        if (!userTeam) return;
        setTeams(prevTeams => prevTeams.map(t => {
            if (t.name === userTeam.name) {
                const newRoster = t.roster.map(player => {
                    if (player.positions.includes('G')) {
                        return { ...player, trainingFocus: 'Goaltending' as TrainingFocus };
                    } else {
                        // Simple auto-assign: assign based on primary position or general focus
                        if (player.positions.includes('C')) return { ...player, trainingFocus: 'Two-Way' as TrainingFocus };
                        if (player.positions.includes('LW') || player.positions.includes('RW')) return { ...player, trainingFocus: 'Offense' as TrainingFocus };
                        if (player.positions.includes('LD') || player.positions.includes('RD')) return { ...player, trainingFocus: 'Defense' as TrainingFocus };
                        return { ...player, trainingFocus: 'General' as TrainingFocus };
                    }
                });
                toast.success("Training Focuses Auto-Assigned", { description: "All players have been assigned a training focus." });
                return { ...t, roster: newRoster };
            }
            return t;
        }));
    };

    // Game Processing
    const processGameResults = (userTeam: Team, opponentTeam: Team, gameState: GameState, isNationalsGame?: boolean, nationalsDivision?: string, gameId?: string) => {
        const currentSeasonString = `${currentDate.year}-${currentDate.year + 1}`;
        const { updatedUserTeam, updatedOpponentTeam } = processGameResultsEngine(userTeam, opponentTeam, gameState, currentSeasonString, isNationalsGame);

        setTeams(prevTeams => prevTeams.map(t => {
            if (t.name === updatedUserTeam.name) return updatedUserTeam;
            if (t.name === updatedOpponentTeam.name) return updatedOpponentTeam;
            return t;
        }));

        if (isNationalsGame && nationalsDivision && gameId) {
            setNationalsData(prevData => {
                const newData = { ...prevData };
                if (newData[currentDate.year] && newData[currentDate.year][nationalsDivision]) {
                    const tournament = newData[currentDate.year][nationalsDivision];
                    const gameIndex = tournament.groupStageSchedule.findIndex(g => g.id === gameId);
                    if (gameIndex !== -1) {
                        if (!tournament.groupStageSchedule[gameIndex].result) {
                            tournament.groupStageSchedule[gameIndex].result = { homeScore: 0, awayScore: 0 };
                        }
                        tournament.groupStageSchedule[gameIndex].result.homeScore = gameState.userScore;
                        tournament.groupStageSchedule[gameIndex].result.awayScore = gameState.opponentScore;
                        tournament.groupStageSchedule[gameIndex].status = 'completed';
                    } else {
                        const playoffGameIndex = tournament.playoffSchedule.findIndex(g => g.id === gameId);
                        if (playoffGameIndex !== -1) {
                            if (!tournament.playoffSchedule[playoffGameIndex].result) {
                                tournament.playoffSchedule[playoffGameIndex].result = { homeScore: 0, awayScore: 0 };
                            }
                            tournament.playoffSchedule[playoffGameIndex].result.homeScore = gameState.userScore;
                            tournament.playoffSchedule[playoffGameIndex].result.awayScore = gameState.opponentScore;
                            tournament.playoffSchedule[playoffGameIndex].status = 'completed';
                        }
                    }
                }
                return newData;
            });
        } else if (gameId) { // For regular season games
            markGameAsCompleted(gameId, gameState.userScore, gameState.opponentScore);
        }
    };

    // Nationals Functions
    const playNationalsRound = (division: string, userGameResult?: { homeTeamName: string, awayTeamName: string, homeScore: number, awayScore: number, gameId: string }) => {
        setNationalsData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const tournament = newData[currentDate.year]?.[division];
            if (!tournament) {
                toast.error("Nationals tournament not found for this division.");
                return prevData;
            }

            const { updatedNationalsData: newNationalsData, updatedTeams, newAchievements: roundAchievements } = processNationalsRoundEngine(
                tournament, 
                teams, 
                newData, // Pass the full prevData for nationalsData
                currentDate.year, 
                userGameResult
            );

            // Update team achievements
            if (roundAchievements.length > 0) {
                setTeamAchievements(prev => {
                    const updated = JSON.parse(JSON.stringify(prev));
                    roundAchievements.forEach(({ teamName, achievement }) => {
                        if (!updated[teamName]) updated[teamName] = [];
                        if (!updated[teamName].some((ach: Achievement) => ach.type === achievement.type && ach.season === achievement.season && ach.division === achievement.division)) {
                            updated[teamName].push(achievement);
                        }
                    });
                    return updated;
                });
            }

            updatedTeams.forEach(updatedTeam => {
                const index = teams.findIndex(t => t.name === updatedTeam.name);
                if (index !== -1) {
                    teams[index] = updatedTeam; // Directly update the teams array
                }
            });
            setTeams([...teams]); // Trigger re-render

            return newNationalsData; // Return the fully updated nationals data
        });
    };

    const autoSimulateUserNationalsGame = (division: string, gameId: string) => {
        if (!userTeam) return;
        setNationalsData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const tournament = newData[currentDate.year]?.[division];
            if (!tournament) return prevData;

            const game = tournament.groupStageSchedule.find(g => g.id === gameId) || tournament.playoffSchedule.find(g => g.id === gameId);
            if (!game || game.status === 'completed') return prevData;

            const homeTeam = teams.find(t => t.name === game.homeTeam);
            const awayTeam = teams.find(t => t.name === game.awayTeam);

            if (!homeTeam || !awayTeam) {
                toast.error("One or both teams for the Nationals game not found.");
                return prevData;
            }

            const finalGameState = simulateFullGame(homeTeam, awayTeam, false); // No rivalry in nationals

            const currentSeasonString = `${currentDate.year}-${currentDate.year + 1}`;
            const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, currentSeasonString, true);

            setTeams(prevTeams => prevTeams.map(t => {
                if (t.name === updatedHomeTeam.name) return updatedHomeTeam;
                if (t.name === updatedAwayTeam.name) return updatedAwayTeam;
                return t;
            }));

            if (!game.result) {
                game.result = { homeScore: 0, awayScore: 0 };
            }
            game.result.homeScore = finalGameState.userScore;
            game.result.awayScore = finalGameState.opponentScore;
            game.status = 'completed';

            toast.info("Nationals Game Auto-Simulated", { description: `${homeTeam.name} ${finalGameState.userScore} - ${awayTeam.name} ${finalGameState.opponentScore}` });
            return newData;
        });
    };

    const simulateFullNationalsTournament = (division: string) => {
        setNationalsData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            let tournament = newData[currentDate.year]?.[division];
            if (!tournament) {
                toast.error("Nationals tournament not found for this division.");
                return prevData;
            }

            let tempTeams = [...teams];

            while (tournament.status !== 'completed') {
                const { updatedNationalsData: newNationalsData, updatedTeams, newAchievements: roundAchievements } = processNationalsRoundEngine(
                    tournament, 
                    tempTeams, 
                    newData, // Pass the full newData object
                    currentDate.year
                );
                tournament = newNationalsData[currentDate.year][division]; // Update local tournament reference
                tempTeams = updatedTeams;

                // Update team achievements
                if (roundAchievements.length > 0) {
                    setTeamAchievements(prev => {
                        const updated = JSON.parse(JSON.stringify(prev));
                        roundAchievements.forEach(({ teamName, achievement }) => {
                            if (!updated[teamName]) updated[teamName] = [];
                            if (!updated[teamName].some((ach: Achievement) => ach.type === achievement.type && ach.season === achievement.season && ach.division === achievement.division)) {
                                updated[teamName].push(achievement);
                            }
                        });
                        return updated;
                    });
                }
            }

            setTeams(tempTeams);
            toast.success(`Nationals ${division} Tournament Fully Simulated!`);
            return newData; // Return the fully updated nationals data
        });
    };

    const simulateSingleNationalsGame = (division: string, gameId: string) => {
        setNationalsData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const tournament = newData[currentDate.year]?.[division];
            if (!tournament) return prevData;

            const game = tournament.groupStageSchedule.find(g => g.id === gameId) || tournament.playoffSchedule.find(g => g.id === gameId);
            if (!game || game.status === 'completed') return prevData;

            const homeTeam = teams.find(t => t.name === game.homeTeam);
            const awayTeam = teams.find(t => t.name === game.awayTeam);

            if (!homeTeam || !awayTeam) {
                toast.error("One or both teams for the Nationals game not found.");
                return prevData;
            }

            const finalGameState = simulateFullGame(homeTeam, awayTeam, false);

            const currentSeasonString = `${currentDate.year}-${currentDate.year + 1}`;
            const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, currentSeasonString, true);

            setTeams(prevTeams => prevTeams.map(t => {
                if (t.name === updatedHomeTeam.name) return updatedHomeTeam;
                if (t.name === updatedAwayTeam.name) return updatedAwayTeam;
                return t;
            }));

            if (!game.result) {
                game.result = { homeScore: 0, awayScore: 0 };
            }
            game.result.homeScore = finalGameState.userScore;
            game.result.awayScore = finalGameState.opponentScore;
            game.status = 'completed';

            toast.info("Nationals Game Simulated", { description: `${homeTeam.name} ${finalGameState.userScore} - ${awayTeam.name} ${finalGameState.opponentScore}` });
            return newData;
        });
    };

    const simulateAllNationalsTournaments = () => {
        setNationalsData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const currentYearTournaments = newData[currentDate.year];

            if (!currentYearTournaments || Object.keys(currentYearTournaments).length === 0) {
                toast.info("No Nationals tournaments to simulate for the current year.");
                return prevData;
            }

            let tempTeams = [...teams];

            for (const division in currentYearTournaments) {
                let tournament = currentYearTournaments[division];
                while (tournament.status !== 'completed') {
                    const { updatedNationalsData: newNationalsData, updatedTeams, newAchievements: roundAchievements } = processNationalsRoundEngine(
                        tournament, 
                        tempTeams, 
                        newData, // Pass the full newData object
                        currentDate.year
                    );
                    tournament = newNationalsData[currentDate.year][division]; // Update local tournament reference
                    tempTeams = updatedTeams;

                    // Update team achievements
                    if (roundAchievements.length > 0) {
                        setTeamAchievements(prev => {
                            const updated = JSON.parse(JSON.stringify(prev));
                            roundAchievements.forEach(({ teamName, achievement }) => {
                                if (!updated[teamName]) updated[teamName] = [];
                                if (!updated[teamName].some((ach: Achievement) => ach.type === achievement.type && ach.season === achievement.season && ach.division === achievement.division)) {
                                    updated[teamName].push(achievement);
                                }
                            });
                            return updated;
                        });
                    }
                }
                newData[currentDate.year][division] = tournament;
            }

            setTeams(tempTeams);
            toast.success("All Nationals Tournaments Fully Simulated!");
            return newData;
        });
    };

    // Save/Load Functions
    const saveGame = (saveName: string) => {
        try {
            const saveSlot: SaveGameSlot = {
                saveName,
                savedAt: new Date().toISOString(),
                teams: teams, // Now correctly included
                activeTeamName: activeTeamName,
                managedOrganization: managedOrganization,
                isManagingOrg: isManagingOrg,
                schedule: schedule,
                nationalsData: nationalsData,
                seasonRecords: seasonRecords,
                careerRecords: careerRecords,
                teamAchievements: teamAchievements,
                transferPool: transferPool,
                seasonHistory: seasonHistory,
                scoutingPool: scoutingPool,
                recruitedPool: recruitedPool,
                fairHosted: fairHosted,
                currentDate: currentDate,
                developmentHistory: developmentHistory,
                alumni: alumni,
                userTeamName: userTeam?.name || 'N/A',
                currentDateString: `${currentDate.month} ${currentDate.week}, ${currentDate.year}`
            };
            localStorage.setItem(`save_${saveName}`, JSON.stringify(saveSlot));
            setSavedGames(prev => {
                const existingIndex = prev.findIndex(s => s.saveName === saveName);
                if (existingIndex !== -1) {
                    const updated = [...prev];
                    updated[existingIndex] = saveSlot;
                    return updated;
                }
                return [...prev, saveSlot];
            });
            toast.success("Game Saved!", { description: `Game "${saveName}" has been saved.` });
        } catch (error) {
            console.error("Failed to save game:", error);
            toast.error("Save Failed", { description: "Could not save the game." });
        }
    };

    const loadGame = (saveName: string) => {
        try {
            const savedData = localStorage.getItem(`save_${saveName}`);
            if (savedData) {
                const saveSlot: SaveGameSlot = JSON.parse(savedData);
                setTeams(saveSlot.teams); // Now correctly loaded
                setActiveTeamName(saveSlot.activeTeamName);
                setManagedOrganization(saveSlot.managedOrganization);
                setIsManagingOrg(saveSlot.isManagingOrg);
                setSchedule(saveSlot.schedule);
                setNationalsData(saveSlot.nationalsData);
                setSeasonRecords(saveSlot.seasonRecords);
                setCareerRecords(saveSlot.careerRecords);
                setTeamAchievements(saveSlot.teamAchievements);
                setTransferPool(saveSlot.transferPool);
                setSeasonHistory(saveSlot.seasonHistory);
                setScoutingPool(saveSlot.scoutingPool);
                setRecruitedPool(saveSlot.recruitedPool);
                setFairHosted(saveSlot.fairHosted);
                setCurrentDate(saveSlot.currentDate);
                setDevelopmentHistory(saveSlot.developmentHistory);
                setAlumni(saveSlot.alumni);
                toast.success("Game Loaded!", { description: `Game "${saveName}" has been loaded.` });
            } else {
                toast.error("Load Failed", { description: `No save game found with name "${saveName}".` });
            }
        } catch (error) {
            console.error("Failed to load game:", error);
            toast.error("Load Failed", { description: "Could not load the game." });
        }
    };

    const deleteGame = (saveName: string) => {
        try {
            localStorage.removeItem(`save_${saveName}`);
            setSavedGames(prev => prev.filter(s => s.saveName !== saveName));
            toast.success("Game Deleted!", { description: `Save game "${saveName}" has been deleted.` });
        } catch (error) {
            console.error("Failed to delete game:", error);
            toast.error("Delete Failed", { description: "Could not delete the game." });
        }
    };

    const exitToMainMenu = () => {
        localStorage.removeItem('activeTeamName');
        localStorage.removeItem('managedOrganization');
        localStorage.removeItem('isManagingOrg');
        localStorage.removeItem('teams');
        localStorage.removeItem('schedule');
        localStorage.removeItem('nationalsData');
        localStorage.removeItem('seasonRecords');
        localStorage.removeItem('careerRecords');
        localStorage.removeItem('teamAchievements');
        localStorage.removeItem('transferPool');
        localStorage.removeItem('seasonHistory');
        localStorage.removeItem('scoutingPool');
        localStorage.removeItem('recruitedPool');
        localStorage.removeItem('fairHosted');
        localStorage.removeItem('currentDate');
        localStorage.removeItem('developmentHistory');
        localStorage.removeItem('alumni');
        window.location.reload(); // Force a full reload to reset all state
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
            fairHosted,
            generateScoutingPool,
            recruitPlayer,
            assignPlayerToRoster,
            discardRecruit,
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
            teamAchievements,
            saveGame,
            exitToMainMenu,
            transferPool,
            seasonHistory,
            savedGames,
            loadGame,
            deleteGame,
            simulateFullNationalsTournament, simulateSingleNationalsGame, simulateAllNationalsTournaments,
            signPlayerFromTransferPool,
            formNewSquad,
            updateTeamDivision,
            updateTeamNationalsDivision,
            renameDivision,
            createCustomTeam
        }}>
            {children}
        </TeamContext.Provider>
    );
};