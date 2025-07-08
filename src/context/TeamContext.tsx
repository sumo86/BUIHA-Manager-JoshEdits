import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Team, Player, BudgetAllocations } from '@/types';
import { teams as initialTeams } from '@/data/teams';
import { generateRecruits } from '@/lib/playerGenerator';
import { toast } from 'sonner';

interface TeamContextType {
    teams: Team[];
    updateTeam: (updatedTeam: Team) => void;
    userTeam: Team;
    scoutingPool: Player[];
    recruitedPool: Player[];
    fairHosted: boolean;
    generateScoutingPool: () => void;
    recruitPlayer: (playerId: string) => void;
    assignPlayerToRoster: (playerId: string) => void;
    discardRecruit: (playerId: string) => void;
    updateBudgetAllocations: (newAllocations: BudgetAllocations) => void;
    runStudentLifeInitiative: () => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider = ({ children }: { children: ReactNode }) => {
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    
    const [scoutingPool, setScoutingPool] = useState<Player[]>(() => {
        try {
            const saved = localStorage.getItem('scoutingPool');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Failed to parse scoutingPool from localStorage", error);
            return [];
        }
    });

    const [recruitedPool, setRecruitedPool] = useState<Player[]>(() => {
        try {
            const saved = localStorage.getItem('recruitedPool');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Failed to parse recruitedPool from localStorage", error);
            return [];
        }
    });

    const [fairHosted, setFairHosted] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem('fairHosted');
            return saved ? JSON.parse(saved) : false;
        } catch (error) {
            console.error("Failed to parse fairHosted from localStorage", error);
            return false;
        }
    });

    useEffect(() => {
        localStorage.setItem('scoutingPool', JSON.stringify(scoutingPool));
    }, [scoutingPool]);

    useEffect(() => {
        localStorage.setItem('recruitedPool', JSON.stringify(recruitedPool));
    }, [recruitedPool]);

    useEffect(() => {
        localStorage.setItem('fairHosted', JSON.stringify(fairHosted));
    }, [fairHosted]);

    const updateTeam = (updatedTeam: Team) => {
        setTeams(currentTeams =>
            currentTeams.map(t => (t.name === updatedTeam.name ? updatedTeam : t))
        );
    };
    
    const userTeam = teams[0];

    const generateScoutingPool = () => {
        const allTeamNames = teams.map(t => t.name).filter(name => name !== userTeam.name);
        const newRecruits = generateRecruits(userTeam.leagueDivision, allTeamNames);
        setScoutingPool(newRecruits);
        setFairHosted(true);
    };

    const recruitPlayer = (playerId: string) => {
        const playerToRecruit = scoutingPool.find(p => p.id === playerId);
        if (playerToRecruit) {
            setScoutingPool(prev => prev.filter(p => p.id !== playerId));
            setRecruitedPool(prev => [...prev, playerToRecruit]);
        }
    };

    const assignPlayerToRoster = (playerId: string) => {
        const playerToAssign = recruitedPool.find(p => p.id === playerId);
        if (playerToAssign) {
            const usedJerseyNumbers = new Set(userTeam.roster.map(p => p.jerseyNumber));
            let newJerseyNumber = 1;
            while (usedJerseyNumbers.has(newJerseyNumber)) {
                newJerseyNumber++;
            }
            playerToAssign.jerseyNumber = newJerseyNumber;

            const newRoster = [...userTeam.roster, playerToAssign].sort((a, b) => a.jerseyNumber - b.jerseyNumber);
            const updatedTeam = { ...userTeam, roster: newRoster };
            updateTeam(updatedTeam);
            setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
        }
    };

    const discardRecruit = (playerId: string) => {
        setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
    };

    const updateBudgetAllocations = (newAllocations: BudgetAllocations) => {
        const updatedTeam = {
            ...userTeam,
            financials: {
                ...userTeam.financials,
                budgetAllocations: newAllocations,
            }
        };
        updateTeam(updatedTeam);
    };

    const runStudentLifeInitiative = () => {
        const studentLifeBudget = userTeam.financials.budgetAllocations['Student Life'];
        if (studentLifeBudget <= 0) {
            toast.error("No funds allocated to Student Life.", { description: "Allocate a budget to host team events and boost morale." });
            return;
        }

        const chance = studentLifeBudget / 50;
        const roll = Math.random() * 100;

        if (roll < chance) {
            const moraleLevels: Player['morale'][] = ["Angry", "Unhappy", "Content", "Happy", "Ecstatic"];
            const newRoster = userTeam.roster.map(player => {
                const currentMoraleIndex = moraleLevels.indexOf(player.morale);
                if (currentMoraleIndex < moraleLevels.length - 1) {
                    return { ...player, morale: moraleLevels[currentMoraleIndex + 1] };
                }
                return player;
            });
            updateTeam({ ...userTeam, roster: newRoster });
            toast.success("Team event was a success!", { description: "Player morale has improved across the team." });
        } else {
            toast.info("Team event had no effect.", { description: "The event was fine, but it didn't boost team morale this time." });
        }
    };

    return (
        <TeamContext.Provider value={{ 
            teams, 
            updateTeam, 
            userTeam, 
            scoutingPool, 
            recruitedPool, 
            fairHosted,
            generateScoutingPool, 
            recruitPlayer, 
            assignPlayerToRoster,
            discardRecruit,
            updateBudgetAllocations,
            runStudentLifeInitiative
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