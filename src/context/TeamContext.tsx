import { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Team, Player, SkaterAttributes, GoalieAttributes, DevelopmentLog, TrainingFocus, GameState, FacilityProject, Financials, ScheduleEntry, GameDate, PlayerSeasonStats, RecordCategory, TeamRecord, NationalsPlayoffMatch, Achievement, TeamAchievements, SeasonHistory, SaveGameSlot, TeamSeasonHistory, NationalsTournament } from '@/types';
import { teams as initialTeams, getTeamOrganizations, getOrganizationName } from '@/data/teams';
import { generateRecruits, calculateStarRating, getGamesPlayedForDivision } from '@/lib/playerGenerator'; 
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
import { processNationalsRound } from '@/lib/nationalsSimulator';
import { getAggregatedCurrentStats } from '@/lib/statsUtils';
import { getPromotionDivision, getRelegationDivision, getTierName } from '@/lib/leagueUtils';

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
            return []; 
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
            
            week += 1; // Always advance by one week

            // Handle month rollover
            if (week > 4) { // If week exceeds 4, roll over to next month
                week = 1;
                let nextMonthIndex = (monthIndex + 1) % months.length;
                if (month === "July" && months[nextMonthIndex] === "August") {
                    year += 1;
                    toast.info("Season Ended", { description: `The ${prevDate.year}-${prevDate.year + 1} season has concluded. Stats are being archived.` });
                    
                    const seasonThatEnded = `${prevDate.year}-${prevDate.year + 1}`;
                    
                    // Archive player stats for the season that just ended
                    tempTeams = tempTeams.map(team => {
                        const updatedRoster = team.roster.map(player => {
                            // If player has stats for the season, archive them.
                            if (player.currentStats && player.currentStats.length > 0) {
                                const newHistory = player.history ? [...player.history, ...player.currentStats] : [...player.currentStats];
                                return { ...player, history: newHistory, currentStats: [] };
                            } 
                            // If player has no stats but was on the roster, create a blank history entry to track their tenure.
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

                    // Promotion & Relegation Logic
                    const promotionRelegationChanges: { teamName: string, newDivision: string, type: 'promotion' | 'relegation' }[] = [];
                    const allLeagueDivisions = [...new Set(tempTeams.map(t => t.leagueDivision))];

                    allLeagueDivisions.forEach(division => {
                        const teamsInDivision = tempTeams
                            .filter(t => t.leagueDivision === division)
                            .sort((a, b) => {
                                if (b.points !== a.points) return b.points - a.points;
                                const goalDiffA = a.goalsFor - a.goalsAgainst;
                                const goalDiffB = b.goalsFor - b.goalsAgainst;
                                if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
                                return b.goalsFor - a.goalsFor;
                            });

                        if (teamsInDivision.length > 1) {
                            // Promotion
                            const promotedTeam = teamsInDivision[0];
                            const promotionDivision = getPromotionDivision(promotedTeam.leagueDivision);
                            if (promotionDivision) {
                                promotionRelegationChanges.push({
                                    teamName: promotedTeam.name,
                                    newDivision: promotionDivision,
                                    type: 'promotion',
                                });
                            }

                            // Relegation
                            const relegatedTeam = teamsInDivision[teamsInDivision.length - 1];
                            const relegationDivision = getRelegationDivision(relegatedTeam.leagueDivision);
                            if (relegationDivision) {
                                promotionRelegationChanges.push({
                                    teamName: relegatedTeam.name,
                                    newDivision: relegationDivision,
                                    type: 'relegation',
                                });
                            }
                        }
                    });

                    if (promotionRelegationChanges.length > 0) {
                        toast.info("Processing end-of-season promotions and relegations...");
                        tempTeams = tempTeams.map(team => {
                            const change = promotionRelegationChanges.find(c => c.teamName === team.name);
                            if (change) {
                                team.leagueDivision = change.newDivision;
                                team.nationalsDivision = getTierName(change.newDivision); // Update nationals division based on new league tier

                                // Recalculate star ratings for all players on the team
                                team.roster = team.roster.map(player => {
                                    const isSkater = !player.positions.includes('G');
                                    player.starRating = calculateStarRating(player.currentAbility, isSkater, team.leagueDivision);
                                    return player;
                                });

                                if (change.type === 'promotion') {
                                    toast.success(`${team.name} promoted to ${change.newDivision}!`);
                                } else {
                                    toast.error(`${team.name} relegated to ${change.newDivision}.`);
                                }
                            }
                            return team;
                        });
                    }

                    // New season budget calculations
                    tempTeams = tempTeams.map(team => {
                        const unspentBudget = team.financials.discretionaryBudget;

                        const totalGames = getGamesPlayedForDivision(team.leagueDivision);
                        const numberOfHomeGames = Math.floor(totalGames / 2);
                        const numberOfAwayGames = Math.ceil(totalGames / 2);
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
                                // Avoid duplicates
                                if (!updated[teamName].some((ach: Achievement) => ach.type === achievement.type && ach.season === achievement.season && ach.division === achievement.division)) {
                                    updated[teamName].push(achievement);
                                }
                            });
                            return updated; // Return the updated state
                        });
                    }
                    
                    tempSeasonRecords = {}; // Reset season records
                    
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
                            
                            // Only consider for graduation if yearsLeftInProgram is 0 or eligibility is UG Year 4
                            const isGraduating = (player.eligibility === 'UG Year 4' && !player.isContinuingEducation) || 
                                                 ((player.eligibility === 'Masters' || player.eligibility === 'PhD') && (player.yearsLeftInProgram || 0) <= 0);

                            if (isGraduating) {
                                graduatingPlayers.push(player);
                                return false; // Remove from current roster
                            } else if (nextEligibility) {
                                player.eligibility = nextEligibility;
                                player.age += 1;
                                if (player.eligibility === 'Masters' || player.eligibility === 'PhD') {
                                    player.yearsLeftInProgram = (player.yearsLeftInProgram || 1) - 1;
                                }
                                return true;
                            } else if (player.eligibility !== 'Staff') { // If not staff and no next eligibility, they should graduate
                                graduatingPlayers.push(player);
                                return false;
                            }
                            return true; // Staff remain
                        });

                        graduatingPlayers.forEach(player => {
                            const isManaged = managedTeamNames.includes(team.name);
                            const roll = Math.random();
                            
                            if (roll < 0.85) { // Retire (85% chance)
                                player.alumniStatus = 'Retired';
                                newAlumni.push(player);
                                if (isManaged) {
                                    toast.info(`${player.name} has retired from university hockey.`);
                                }
                            } else if (roll < 0.95) { // Transfer (10% chance)
                                player.alumniStatus = 'Transfer Listed';
                                newTransferPoolPlayers.push(player);
                                newAlumni.push(player); // Also add to alumni to track them
                                if (isManaged) {
                                    toast.info(`${player.name} has graduated and entered the transfer portal.`);
                                }
                            } else { // New Degree (5% chance)
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

                    // AI teams sign players from the transfer pool
                    let availableForSigning = [...newTransferPoolPlayers];
                    
                    const allOrgs = getTeamOrganizations();
                    const aiOrgs = allOrgs.filter(org => org.name !== managedOrganization);

                    if (aiOrgs.length > 0) {
                        const shuffledAiOrgs = shuffleArray(aiOrgs);
                        const playersForAISigning: Player[] = [];
                        
                        // Determine which players AI will sign (80%)
                        availableForSigning.forEach(player => {
                            if (Math.random() < 0.8) { 
                                playersForAISigning.push(player);
                            }
                        });

                        // Assign players to AI organizations in a round-robin fashion
                        let orgAssignIndex = 0;
                        playersForAISigning.forEach(player => {
                            const signingOrg = shuffledAiOrgs[orgAssignIndex % shuffledAiOrgs.length];
                            
                            // Assign to the lowest-tier team in the org. Teams are sorted A, B, C... so the last one is the lowest tier.
                            const lowestTierTeamInOrg = signingOrg.teams[signingOrg.teams.length - 1];
                            const teamIndexInTemp = tempTeams.findIndex(t => t.name === lowestTierTeamInOrg.name);
                            
                            if (teamIndexInTemp !== -1) {
                                tempTeams[teamIndexInTemp].roster.push(player);
                            }
                            orgAssignIndex++;
                        });
                        
                        // Filter out players signed by AI from the availableForSigning pool
                        const signedPlayerIds = new Set(playersForAISigning.map(p => p.id));
                        availableForSigning = availableForSigning.filter(p => !signedPlayerIds.has(p.id));
                    }

                    if (availableForSigning.length > 0) {
                        setTransferPool(prev => [...prev, ...availableForSigning]);
                        toast.info(`${availableForSigning.length} new players have entered the transfer portal.`);
                    }

                    // AI Recruitment Logic (for new recruits, not transfers)
                    const allOrgsList = getTeamOrganizations();
                    const aiOrgsList = allOrgsList.filter(org => org.name !== managedOrganization);
                    const allTeamNames = tempTeams.map(t => t.name);
                    let recruitmentOccurred = false;

                    aiOrgsList.forEach(org => {
                        const orgTeamNames = org.teams.map(t => t.name);
                        const orgTeams = tempTeams.filter(t => orgTeamNames.includes(t.name));
                        if (orgTeams.length === 0) return;

                        const targetRosterSize = orgTeams.length * 21; // Standard roster size
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

        // This block ensures fairHosted is reset when the new date is August, Week 1
        if (newDate.month === 'August' && newDate.week === 1 && userTeam) {
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

            Object.entries(teamsByNationalsDivision).forEach(([division, teamsInDivision]) => {
                if (teamsInDivision.length >= 4) { // Minimum teams for a tournament
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
            
            const isSkater = player.positions[0] !== 'G';
            const updatedPlayer = {
                ...player,
                starRating: calculateStarRating(player.currentAbility, isSkater, toTeam.leagueDivision),
                captaincy: null, // Reset captaincy when player moves teams
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
        const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(userTeam, opponentTeam, gameState, currentSeasonString, isNationalsGame);
        
        setTeams(currentTeams =>
            currentTeams.map(t => {
                if (t.name === updatedHomeTeam.name) return updatedHomeTeam;
                if (t.name === updatedAwayTeam.name) return updatedAwayTeam;
                return t;
            })
        );

        if (isNationalsGame && nationalsDivision && gameId) {
            const completedGame = {
                gameId: gameId,
                homeTeamName: userTeam.name,
                awayTeamName: opponentTeam.name,
                homeScore: gameState.userScore,
                awayScore: gameState.opponentScore,
            };
            playNationalsRound(nationalsDivision, completedGame);
        } else if (gameId) { // Handle regular season game completion
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
                return updated; // Return the updated state
            });
        }
    };

    const autoSimulateUserNationalsGame = (division: string, gameId: string) => {
        const tournament = nationalsData[currentDate.year]?.[division];
        if (!tournament || !userTeam) return;

        const allGames = [...tournament.groupStageSchedule, ...tournament.playoffSchedule];
        const game = allGames.find(g => g.id === gameId);
        if (!game) return;

        const homeTeamSim = teams.find(t => t.name === (typeof game.homeTeam === 'string' ? game.homeTeam : 'TBD'));
        const awayTeamSim = teams.find(t => t.name === (typeof game.awayTeam === 'string' ? game.awayTeam : 'TBD'));

        // Simulate the game
        if (!homeTeamSim || !awayTeamSim) {
            toast.error("Error simulating Nationals game: One or both teams not found.");
            return;
        }

        const finalGameState = simulateFullGame(homeTeamSim, awayTeamSim, false); // Assuming not a rivalry game for auto-sim
        processGameResults(homeTeamSim, awayTeamSim, finalGameState, true, division, gameId);
        toast.info("Nationals Game Auto-Simulated", { description: `${homeTeamSim.name} ${finalGameState.userScore} - ${awayTeamSim.name} ${finalGameState.opponentScore}` });
    };

    const simulateFullNationalsTournament = (division: string) => {
        setNationalsData(prev => {
            const newNationalsData = { ...prev };
            if (!newNationalsData[currentDate.year]) return prev;
            const tournament = newNationalsData[currentDate.year][division];
            if (!tournament) return prev;

            let currentTournament = { ...tournament };

            // Simulate group stage
            if (currentTournament.status === 'group-stage') {
                currentTournament.groupStageSchedule.forEach(game => {
                    if (game.status === 'scheduled') {
                        const homeTeam = teams.find(t => t.name === game.homeTeam);
                        const awayTeam = teams.find(t => t.name === game.awayTeam);
                        if (homeTeam && awayTeam) {
                            const finalGameState = simulateFullGame(homeTeam, awayTeam, false);
                            processGameResults(homeTeam, awayTeam, finalGameState, true, division, game.id);
                        }
                    }
                });
                // After group stage, transition to playoffs
                currentTournament.status = 'silver-playoffs'; // Or 'gold-playoffs' depending on logic
                currentTournament.currentRound = 1; // Reset round for playoffs
            }

            // Simulate playoffs (Silver and Gold)
            while (currentTournament.status === 'silver-playoffs' || currentTournament.status === 'gold-playoffs') {
                const { updatedTeams, updatedNationalsData: nextNationalsData, newAchievements } = processNationalsRound(division, teams, newNationalsData, currentDate.year);
                setTeams(updatedTeams);
                newNationalsData[currentDate.year] = nextNationalsData[currentDate.year]; // Update with the result of the round
                currentTournament = newNationalsData[currentDate.year][division]; // Get updated tournament state
                
                if (newAchievements.length > 0) {
                    setTeamAchievements(prevAch => {
                        const updatedAch = JSON.parse(JSON.stringify(prevAch));
                        newAchievements.forEach(({ teamName, achievement }) => {
                            if (!updatedAch[teamName]) updatedAch[teamName] = [];
                            if (!updatedAch[teamName].some((ach: Achievement) => ach.type === achievement.type && ach.season === achievement.season && ach.division === achievement.division)) {
                                updatedAch[teamName].push(achievement);
                                toast.success(`${teamName} has won the ${achievement.division} ${achievement.type === 'Nationals Gold' ? 'Gold' : 'Silver'} Championship!`);
                            }
                        });
                        return updatedAch;
                    });
                }

                if (currentTournament.status === 'completed') break; // Tournament finished
            }

            return newNationalsData;
        });
    };

    const simulateSingleNationalsGame = (division: string, gameId: string) => {
        setNationalsData(prev => {
            const newNationalsData = { ...prev };
            if (!newNationalsData[currentDate.year]) return prev;
            const tournament = newNationalsData[currentDate.year][division];
            if (!tournament) return prev;

            const allGames = [...tournament.groupStageSchedule, ...tournament.playoffSchedule];
            const game = allGames.find(g => g.id === gameId);
            if (!game || game.status !== 'scheduled') return prev;

            const homeTeam = teams.find(t => t.name === (typeof game.homeTeam === 'string' ? game.homeTeam : 'TBD'));
            const awayTeam = teams.find(t => t.name === (typeof game.awayTeam === 'string' ? game.awayTeam : 'TBD'));

            if (homeTeam && awayTeam) {
                const finalGameState = simulateFullGame(homeTeam, awayTeam, false);
                processGameResults(homeTeam, awayTeam, finalGameState, true, division, game.id);
            }
            return newNationalsData;
        });
    };

    const simulateAllNationalsTournaments = () => {
        const currentYearNationals = nationalsData[currentDate.year];
        if (!currentYearNationals) {
            toast.info("No Nationals tournaments to simulate for this year.");
            return;
        }
        Object.keys(currentYearNationals).forEach(division => {
            simulateFullNationalsTournament(division);
        });
        toast.success("All Nationals tournaments simulated!");
    };

    const signPlayerFromTransferPool = (playerId: string, toTeamName: string) => {
        const playerToSign = transferPool.find(p => p.id === playerId);
        const targetTeam = teams.find(t => t.name === toTeamName);

        if (!playerToSign || !targetTeam) {
            toast.error("Failed to sign player: Player or team not found.");
            return;
        }

        // Remove player from transfer pool
        setTransferPool(prev => prev.filter(p => p.id !== playerId));

        // Add player to target team's roster
        setTeams(currentTeams => currentTeams.map(team => {
            if (team.name === toTeamName) {
                const toTeamJerseyNumbers = new Set(team.roster.map(p => p.jerseyNumber));
                let newJerseyNumber = 1;
                while (toTeamJerseyNumbers.has(newJerseyNumber)) { newJerseyNumber++; }
                
                const isSkater = playerToSign.positions[0] !== 'G';
                const updatedPlayer = {
                    ...playerToSign,
                    jerseyNumber: newJerseyNumber,
                    starRating: calculateStarRating(playerToSign.currentAbility, isSkater, team.leagueDivision),
                    captaincy: null, // Reset captaincy when player moves teams
                };
                return { ...team, roster: [...team.roster, updatedPlayer].sort((a, b) => a.jerseyNumber - b.jerseyNumber) };
            }
            return team;
        }));
        toast.success(`${playerToSign.name} signed to ${toTeamName}!`);
    };

    const saveGame = (saveName: string) => {
        const gameData = {
            teams: teams,
            alumni: alumni,
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
        };
        try {
            localStorage.setItem(`saveGame_${saveName}`, JSON.stringify(gameData));
            setSavedGames(prev => {
                if (!prev.some(s => s.name === saveName)) {
                    return [...prev, { name: saveName, date: new Date().toISOString() }];
                }
                return prev.map(s => s.name === saveName ? { ...s, date: new Date().toISOString() } : s);
            });
            toast.success(`Game "${saveName}" saved successfully!`);
        } catch (error) {
            console.error("Failed to save game:", error);
            toast.error("Failed to save game.");
        }
    };

    const loadGame = (saveName: string) => {
        try {
            const savedData = localStorage.getItem(`saveGame_${saveName}`);
            if (savedData) {
                const gameData = JSON.parse(savedData);
                setTeams(gameData.teams);
                setAlumni(gameData.alumni);
                setActiveTeamName(gameData.activeTeamName);
                setManagedOrganization(gameData.managedOrganization);
                setIsManagingOrg(gameData.isManagingOrg);
                setSchedule(gameData.schedule);
                setNationalsData(gameData.nationalsData);
                setSeasonRecords(gameData.seasonRecords);
                setCareerRecords(gameData.careerRecords);
                setTeamAchievements(gameData.teamAchievements);
                setTransferPool(gameData.transferPool || []); // Ensure transferPool is initialized
                setSeasonHistory(gameData.seasonHistory || {}); // Ensure seasonHistory is initialized
                setScoutingPool(gameData.scoutingPool || []);
                setRecruitedPool(gameData.recruitedPool || []);
                setFairHosted(gameData.fairHosted || false);
                setCurrentDate(gameData.currentDate);
                setDevelopmentHistory(gameData.developmentHistory || []);
                toast.success(`Game "${saveName}" loaded successfully!`);
            } else {
                toast.error(`Save game "${saveName}" not found.`);
            }
        } catch (error) {
            console.error("Failed to load game:", error);
            toast.error("Failed to load game.");
        }
    };

    const deleteGame = (saveName: string) => {
        try {
            localStorage.removeItem(`saveGame_${saveName}`);
            setSavedGames(prev => prev.filter(s => s.name !== saveName));
            toast.success(`Game "${saveName}" deleted successfully.`);
        } catch (error) {
            console.error("Failed to delete game:", error);
            toast.error("Failed to delete game.");
        }
    };

    const exitToMainMenu = () => {
        // Clear all local storage related to the current game session
        localStorage.removeItem('teams');
        localStorage.removeItem('alumni');
        localStorage.removeItem('activeTeamName');
        localStorage.removeItem('managedOrganization');
        localStorage.removeItem('isManagingOrg');
        localStorage.removeItem('schedule');
        localStorage.removeItem('nationalsData');
        localStorage.removeItem('seasonRecords');
        localStorage.removeItem('careerRecords');
        localStorage.removeItem('teamAchievements');
        localStorage.removeItem('scoutingPool');
        localStorage.removeItem('recruitedPool');
        localStorage.removeItem('fairHosted');
        localStorage.removeItem('currentDate');
        localStorage.removeItem('developmentHistory');
        localStorage.removeItem('seasonHistory');
        // Do NOT remove 'savedGames' as that lists all save slots

        // Reset all state variables to their initial values
        setTeams(initialTeams);
        setAlumni([]);
        setActiveTeamName(null);
        setManagedOrganization(null);
        setIsManagingOrg(false);
        setSchedule([]);
        setNationalsData({});
        setSeasonRecords({});
        setCareerRecords({});
        setTeamAchievements({});
        setTransferPool([]);
        setSeasonHistory({});
        setScoutingPool([]);
        setRecruitedPool([]);
        setFairHosted(false);
        setCurrentDate({ month: 'August', week: 1, year: new Date().getFullYear() });
        setDevelopmentHistory([]);

        toast.info("Exited to Main Menu.");
    };

    const contextValue = useMemo(() => ({
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
        autoAssignTrainingFocuses: () => { /* Placeholder */ },
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
        simulateFullNationalsTournament,
        simulateSingleNationalsGame,
        simulateAllNationalsTournaments,
        signPlayerFromTransferPool,
    }), [
        teams, updateTeam, userTeam, organizationFinancials, organizationFacilities, selectTeam,
        scoutingPool, recruitedPool, fairHosted, generateScoutingPool, recruitPlayer, assignPlayerToRoster,
        discardRecruit, runStudentLifeInitiative, startFacilityProject, currentDate, advanceWeek,
        developmentHistory, updatePlayerTrainingFocus, processGameResults, movePlayer, requestPlayerTransfer,
        managedOrganization, isManagingOrg, managedTeams, selectOrganization, setActiveTeam, schedule,
        gameForCurrentWeek, nationalsData, markGameAsCompleted, seasonRecords, careerRecords, alumni,
        playNationalsRound, autoSimulateUserNationalsGame, teamAchievements, saveGame, exitToMainMenu,
        transferPool, seasonHistory, savedGames, loadGame, deleteGame, simulateFullNationalsTournament,
        simulateSingleNationalsGame, simulateAllNationalsTournaments, signPlayerFromTransferPool,
    ]);

    return (
        <TeamContext.Provider value={contextValue}>
            {children}
        </TeamContext.Provider>
    );
};