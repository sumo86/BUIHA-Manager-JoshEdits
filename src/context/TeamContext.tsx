import { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Team, Player, BudgetAllocations, SkaterAttributes, GoalieAttributes, DevelopmentLog, TrainingFocus, GameState } from '@/types';
import { teams as initialTeams } from '@/data/teams';
import { generateRecruits } from '@/lib/playerGenerator';
import { toast } from 'sonner';
import { calculateCurrentAbility, calculateStarRating } from '@/lib/playerGenerator';
import { trainingFocusesMap } from '@/data/trainingFocuses';
import { skaterFocuses, goalieFocuses } from '@/data/trainingFocuses';
import { processGameResults as processGameResultsEngine } from '@/lib/statsEngine';

interface GameDate {
    month: string;
    week: number;
    year: number;
}

const months = ["August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June", "July"];

interface TeamContextType {
    teams: Team[];
    updateTeam: (updatedTeam: Team) => void;
    userTeam: Team | null;
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
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider = ({ children }: { children: ReactNode }): JSX.Element => {
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const [selectedTeamName, setSelectedTeamName] = useState<string | null>(() => localStorage.getItem('selectedTeamName') || null);

    const userTeam = useMemo(() => {
        if (!selectedTeamName) return null;
        return teams.find(t => t.name === selectedTeamName) || null;
    }, [selectedTeamName, teams]);

    const selectTeam = (teamName: string | null) => {
        if (teamName) {
            localStorage.setItem('selectedTeamName', teamName);
        } else {
            localStorage.removeItem('selectedTeamName');
        }
        setSelectedTeamName(teamName);
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

    const [isInitialMount, setIsInitialMount] = useState(true);

    useEffect(() => { localStorage.setItem('scoutingPool', JSON.stringify(scoutingPool)); }, [scoutingPool]);
    useEffect(() => { localStorage.setItem('recruitedPool', JSON.stringify(recruitedPool)); }, [recruitedPool]);
    useEffect(() => { localStorage.setItem('fairHosted', JSON.stringify(fairHosted)); }, [fairHosted]);
    useEffect(() => { localStorage.setItem('currentDate', JSON.stringify(currentDate)); }, [currentDate]);
    useEffect(() => { localStorage.setItem('developmentHistory', JSON.stringify(developmentHistory)); }, [developmentHistory]);

    const updateTeam = (updatedTeam: Team) => {
        setTeams(currentTeams =>
            currentTeams.map(t => (t.name === updatedTeam.name ? updatedTeam : t))
        );
    };

    const handlePlayerDevelopment = () => {
        if (!userTeam) return;
        // ... (rest of the function is the same, just guarded)
    };

    useEffect(() => {
        if (isInitialMount) {
            setIsInitialMount(false);
        } else {
            handlePlayerDevelopment();
        }
    }, [currentDate, userTeam]); // Add userTeam dependency

    const advanceWeek = () => {
        setCurrentDate(prevDate => {
            let { month, week, year } = prevDate;
            week += 1;
            if (week > 4) {
                week = 1;
                const monthIndex = months.indexOf(month);
                if (monthIndex === 11) {
                    month = months[0];
                    year += 1;
                } else {
                    month = months[monthIndex + 1];
                }
            }
            return { month, week, year };
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
            Recruiting: currentBudget - cost,
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
        const updatedTeam = { ...userTeam, financials: { ...userTeam.financials, budgetAllocations: newAllocations } };
        updateTeam(updatedTeam);
    };

    const runStudentLifeInitiative = () => {
        if (!userTeam) return;
        // ... (rest of the function is the same, just guarded)
    };

    const startFacilityProject = (projectId: string) => {
        if (!userTeam) return;
        // ... (rest of the function is the same, just guarded)
    };

    const processGameResults = (userTeam: Team, opponentTeam: Team, gameState: GameState) => {
        const { updatedUserTeam, updatedOpponentTeam } = processGameResultsEngine(userTeam, opponentTeam, gameState);
        updateTeam(updatedUserTeam);
        updateTeam(updatedOpponentTeam);
    };

    return (
        <TeamContext.Provider value={{ 
            teams, updateTeam, userTeam, selectTeam, scoutingPool, recruitedPool, fairHosted,
            generateScoutingPool, recruitPlayer, assignPlayerToRoster, discardRecruit,
            updateBudgetAllocations, runStudentLifeInitiative, startFacilityProject,
            currentDate, advanceWeek, developmentHistory, updatePlayerTrainingFocus,
            autoAssignTrainingFocuses, processGameResults
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