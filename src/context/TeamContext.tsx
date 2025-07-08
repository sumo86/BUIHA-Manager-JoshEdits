import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Team, Player, BudgetAllocations } from '@/types';
import { teams as initialTeams } from '@/data/teams';
import { generateRecruits } from '@/lib/playerGenerator';

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
            updateBudgetAllocations
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