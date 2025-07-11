import { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Team, Player, BudgetAllocations, SkaterAttributes, GoalieAttributes, DevelopmentLog, TrainingFocus, GameState, FacilityProject, BudgetCategory, Financials, ScheduleEntry, GameDate, PlayerSeasonStats, CurrentSeasonStats } from '@/types';
import { teams as initialTeams, getTeamOrganizations, getOrganizationName } from '@/data/teams'; // Added getOrganizationName import
import { generateRecruits } from '@/lib/playerGenerator';
import { toast } from 'sonner';
import { calculateCurrentAbility, calculateStarRating } from '@/lib/playerGenerator';
import { trainingFocusesMap } from '@/data/trainingFocuses';
import { skaterFocuses, goalieFocuses } from '@/data/trainingFocuses';
import { processGameResults as processGameResultsEngine } from '@/lib/statsEngine';
import { generateSeasonSchedule } from '@/lib/scheduleGenerator';
import { simulateFullGame } from '@/lib/gameEngine';
import { validateLineup } from '@/lib/lineupValidation';
import { createNationalsTournament } from '@/lib/nationalsGenerator';
import { nationalsSchedule } from '@/data/nationalsSchedule';
import { NationalsTournament } from '@/types';

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
    gameForCurrentWeek: ScheduleEntry | null;
    nationalsData: { [year: number]: { [division: string]: NationalsTournament } };
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
        if (!userTeam || !schedule) return null;
        return schedule.find(game =>
            (game.homeTeam === userTeam.name || game.awayTeam === userTeam.name) &&
            game.date.month === currentDate.month &&
            game.date.week === currentDate.week &&
            game.status === 'scheduled'
        ) || null;
    }, [userTeam, schedule, currentDate]);

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

        const gamesThisWeek = tempSchedule.filter(game =>
            game.date.month === currentDate.month &&
            game.date.week === currentDate.week &&
            game.status === 'scheduled'
        );

        if (gamesThisWeek.length > 0) {
            gamesThisWeek.forEach(game => {
                const homeTeamIndex = tempTeams.findIndex(t => t.name === game.homeTeam);
                const awayTeamIndex = tempTeams.findIndex(t => t.name === game.awayTeam);
                
                if (homeTeamIndex === -1 || awayTeamIndex === -1) return;

                const homeTeam = tempTeams[homeTeamIndex];
                const awayTeam = tempTeams[awayTeamIndex];

                const finalGameState = simulateFullGame(homeTeam, awayTeam);

                if (userTeam) {
                    finalGameState.injuries.forEach(injury => {
                        if (injury.teamName === userTeam.name) {
                            const injuredPlayer = userTeam.roster.find(p => p.id === injury.playerId);
                            if (injuredPlayer) {
                                toast.warning("Player Injured!", {
                                    description: `${injuredPlayer.name} was injured during the game. (${injury.injuryType}, out for ${injury.duration} weeks)`,
                                });
                            }
                        }
                    });
                }

                const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState);
                
                tempTeams[homeTeamIndex] = updatedHomeTeam;
                tempTeams[awayTeamIndex] = updatedAwayTeam;

                const scheduleGameIndex = tempSchedule.findIndex(g => g.id === game.id);
                if (scheduleGameIndex !== -1) {
                    tempSchedule[scheduleGameIndex].status = 'completed';
                    tempSchedule[scheduleGameIndex].result = { homeScore: finalGameState.userScore, awayScore: finalGameState.opponentScore };
                }
                
                if (game.homeTeam === userTeam?.name || game.awayTeam === userTeam?.name) {
                    toast.info("Game Auto-Simulated", {
                        description: `${homeTeam.name} ${finalGameState.userScore} - ${awayTeam.name} ${finalGameState.opponentScore}`
                    });
                }
            });
        }

        // Weekly updates for all teams
        tempTeams = tempTeams.map(team => {
            let newRoster = [...team.roster];
            let newFacilities = [...team.facilities];
            const isUserManagedTeam = team.name === userTeam?.name || managedTeamNames.includes(team.name);

            // 1. Injury Recovery
            newRoster = newRoster.map(player => {
                if (player.injury && player.injury.duration > 0) {
                    const hasPhysio = team.facilities.some(f => f.id === 'physio_office_1' && f.status === 'Completed');
                    player.injury.duration -= (hasPhysio ? 2 : 1);

                    if (player.injury.duration <= 0) {
                        if (team.name === userTeam?.name) {
                            toast.success("Player Recovered", { description: `${player.name} has recovered from their injury.` });
                        }
                        return { ...player, injury: null, healthStatus: 'Healthy' as 'Healthy' };
                    }
                }
                return player;
            });

            // 2. Facility Completion
            newFacilities = newFacilities.map(project => {
                if (project.status === 'In Progress' && project.weeksToComplete) {
                    project.weeksToComplete -= 1;
                    if (project.weeksToComplete <= 0) {
                        project.status = 'Completed';
                        if (team.name === userTeam?.name) {
                            toast.info("Facility Project Completed", { description: `${project.name} is now complete.` });
                        }
                        // Apply one-time benefits
                        if (project.id === 'locker_room_1') {
                            newRoster = newRoster.map(p => ({ ...p, morale: updateMorale(p.morale, 1) }));
                            if (team.name === userTeam?.name) {
                                toast.success("Morale Boost!", { description: "The new locker room has boosted team morale." });
                            }
                        }
                    }
                }
                return project;
            });

            // 3. Morale Drift
            newRoster = newRoster.map(player => {
                if (Math.random() < 0.1) { // 10% chance of morale drift per week
                    if (player.morale === 'Happy') return { ...player, morale: 'Content' as 'Content' };
                    if (player.morale === 'Unhappy') return { ...player, morale: 'Content' as 'Content' };
                }
                return player;
            });

            // 4. Player Development (only for healthy players)
            newRoster = newRoster.map(player => {
                if (player.healthStatus === 'Injured') {
                    return player;
                }

                const isSkater = !player.positions.includes('G');
                let changed = false;

                // Development for younger players
                const paGap = player.potentialAbility - player.currentAbility;
                if (player.age < 33 && paGap > 0 && player.morale !== 'Angry') {
                    const devRate = (player.attributes as SkaterAttributes | GoalieAttributes).developmentRate || 10;
                    const professionalism = (player.attributes as SkaterAttributes | GoalieAttributes).professionalism || 10;
                    const determination = (player.attributes as SkaterAttributes | GoalieAttributes).determination || 10;
                    
                    const baseDevChance = 0.2;
                    const paBonus = Math.max(0, paGap / 50);
                    const workEthicBonus = (professionalism + determination - 20) / 100;
                    const devChance = baseDevChance + paBonus + workEthicBonus;

                    if (Math.random() < devChance) {
                        let attributesToDevelop: (keyof SkaterAttributes | keyof GoalieAttributes)[] = [];
                        if (player.trainingFocus && trainingFocusesMap[player.trainingFocus]) {
                            attributesToDevelop = trainingFocusesMap[player.trainingFocus];
                        } else {
                            const allAttrs = Object.keys(player.attributes).filter(
                                attr => !['aging', 'injuryProneness', 'passShootTendency', 'mood', 'controversy', 'greed', 'loyalty', 'handleCritics', 'handleFailure', 'handleSuccess', 'sportsmanship', 'ambition', 'bigGames', 'coachability', 'intelligence'].includes(attr)
                            ) as (keyof typeof player.attributes)[];
                            if (allAttrs.length > 0) {
                                attributesToDevelop.push(getRandomItem(allAttrs));
                            }
                        }

                        if (attributesToDevelop.length > 0) {
                            const attrToImprove = getRandomItem(attributesToDevelop);
                            const currentAttrValue = player.attributes[attrToImprove as keyof typeof player.attributes] as number;

                            if (currentAttrValue < 20) {
                                let moraleModifier = 1.0;
                                if (player.morale === 'Happy') {
                                    moraleModifier = 1.2; // 20% boost
                                } else if (player.morale === 'Unhappy') {
                                    moraleModifier = 0.5; // 50% penalty
                                }

                                const improvement = ((Math.random() * 0.2) + (devRate / 100)) * moraleModifier;
                                const newAttrValue = Math.min(20, currentAttrValue + improvement);
                                (player.attributes[attrToImprove as keyof typeof player.attributes] as number) = newAttrValue;
                                changed = true;

                                if (isUserManagedTeam) {
                                    newDevelopmentLogs.push({
                                        playerId: player.id,
                                        playerName: player.name,
                                        attribute: attrToImprove.toString(),
                                        change: improvement,
                                        newRating: newAttrValue,
                                        date: currentDate,
                                    });
                                }
                            }
                        }
                    }
                }

                // Decline for older players
                if (player.age > 28) {
                    const baseDeclineChance = 0.05;
                    const agePenalty = (player.age - 28) / 80;
                    const declineChance = baseDeclineChance + agePenalty;

                    if (Math.random() < declineChance) {
                        let attrsToDecline: (keyof SkaterAttributes | keyof GoalieAttributes)[] = [];
                        if (isSkater) {
                            attrsToDecline = ['acceleration', 'agility', 'balance', 'speed', 'stamina', 'strength'];
                        } else {
                            attrsToDecline = ['skating', 'goaltenderStamina', 'reflexes', 'recovery'];
                        }
                        const attrToDecline = getRandomItem(attrsToDecline);
                        const currentAttrValue = player.attributes[attrToDecline as keyof typeof player.attributes] as number;

                        if (currentAttrValue > 1) {
                            const decline = (Math.random() * 0.15) + 0.05;
                            const newAttrValue = Math.max(1, currentAttrValue - decline);
                            (player.attributes[attrToDecline as keyof typeof player.attributes] as number) = newAttrValue;
                            changed = true;

                            if (isUserManagedTeam) {
                                newDevelopmentLogs.push({
                                    playerId: player.id,
                                    playerName: player.name,
                                    attribute: attrToDecline.toString(),
                                    change: -decline,
                                    newRating: newAttrValue,
                                    date: currentDate,
                                });
                            }
                        }
                    }
                }

                if (changed) {
                    const newCurrentAbility = calculateCurrentAbility(player.attributes, isSkater);
                    const newStarRating = calculateStarRating(newCurrentAbility, isSkater, team.leagueDivision);
                    return { ...player, currentAbility: newCurrentAbility, starRating: newStarRating };
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
                
                if (month === "July" && months[nextMonthIndex] === "August") {
                    year += 1;
                    toast.info("Season Ended", { description: `The ${prevDate.year}-${prevDate.year + 1} season has concluded. Stats are being archived.` });

                    tempTeams = tempTeams.map(team => {
                        const updatedRoster = team.roster.map(player => {
                            const isSkater = !player.positions.includes('G');
                            const seasonStats = player.currentStats;

                            if (seasonStats.gamesPlayed > 0) {
                                const historyEntry: PlayerSeasonStats = {
                                    season: `${prevDate.year}-${prevDate.year + 1}`,
                                    team: team.name,
                                    league: team.leagueDivision,
                                    gamesPlayed: seasonStats.gamesPlayed,
                                    captaincy: player.captaincy,
                                };

                                if (isSkater) {
                                    historyEntry.goals = seasonStats.goals;
                                    historyEntry.assists = seasonStats.assists;
                                    historyEntry.points = seasonStats.points;
                                    historyEntry.penaltyMinutes = seasonStats.penaltyMinutes;
                                } else {
                                    historyEntry.goalsAgainstAverage = seasonStats.goalsAgainstAverage;
                                    historyEntry.savePercentage = seasonStats.savePercentage;
                                    historyEntry.shutouts = seasonStats.shutouts;
                                }
                                
                                const newHistory = player.history ? [...player.history, historyEntry] : [historyEntry];
                                
                                const newCurrentStats: CurrentSeasonStats = {
                                    gamesPlayed: 0, goals: 0, assists: 0, points: 0, penaltyMinutes: 0,
                                    wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0,
                                    shotsAgainst: 0, saves: 0, savePercentage: 0, goalsAgainstAverage: 0, shutouts: 0,
                                };

                                return { ...player, history: newHistory, currentStats: newCurrentStats };
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

        if (newDevelopmentLogs.length > 0) {
            setDevelopmentHistory(prev => [...newDevelopmentLogs, ...prev].slice(0, 200));
        }

        if (newDate.month === 'August' && newDate.week === 2 && !(currentDate.month === 'August' && currentDate.week === 2)) {
            tempSchedule = generateSeasonSchedule(tempTeams, newDate);
            toast.success(`New season schedule generated for ${newDate.year}-${newDate.year + 1}!`);
        }

        // Generate Nationals in April Week 4
        if (newDate.month === 'April' && newDate.week === 4 && !(currentDate.month === 'April' && currentDate.week === 4)) {
            toast.info("Nationals Draws Being Made", { description: "Groups for the BUIHA National Championships are being generated." });
            const allNationalsDivisions = [...new Set(tempTeams.map(t => t.nationalsDivision))];
            const newNationalsDataForYear: { [division: string]: NationalsTournament } = {};

            allNationalsDivisions.forEach(division => {
                const teamsInDivision = tempTeams.filter(t => t.nationalsDivision === division);
                if (teamsInDivision.length >= 2) {
                    const week = Object.keys(nationalsSchedule).find(w => nationalsSchedule[parseInt(w)].includes(division));
                    if (week) {
                        const tournament = createNationalsTournament(division, teamsInDivision, newDate.year, parseInt(week));
                        newNationalsDataForYear[division] = tournament;
                    }
                }
            });
            setNationalsData(prev => ({ ...prev, [newDate.year]: newNationalsDataForYear }));
        }
        
        setTeams(tempTeams);
        setSchedule(tempSchedule);
        setCurrentDate(newDate);
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

        const successChance = 0.3;
        if (Math.random() < successChance) {
            toast.success("Transfer Approved!", {
                description: `${player.name} has agreed to the move and their coach has approved the transfer.`
            });
            movePlayer(playerId, fromTeamName, toTeamName);
        } else {
            const reason = Math.random() < 0.5 ? 'coach' : 'player';
            toast.error("Transfer Denied", {
                description: reason === 'coach'
                    ? `The manager of ${fromTeamName} has blocked the transfer.`
                    : `${player.name} has declined the offer to move to ${toTeamName}.`
            });
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
            description: `Team morale has improved. Cost: £${cost.toLocaleString()}.`,
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

                const totalValue = relevantPlayerAttributes.reduce((sum, attr) => {
                    return sum + (player.attributes[attr as keyof typeof player.attributes] as number);
                }, 0);

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

        if (managedOrganization) { // Simplified condition
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
            schedule, gameForCurrentWeek, nationalsData
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