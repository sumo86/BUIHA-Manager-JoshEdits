import { rivalries } from '@/data/rivalries';

export const isRivalryGame = (team1Name: string, team2Name: string): boolean => {
    if (!team1Name || !team2Name) return false;
    return rivalries.some(rivalry => 
        (rivalry[0] === team1Name && rivalry[1] === team2Name) ||
        (rivalry[0] === team2Name && rivalry[1] === team1Name)
    );
};