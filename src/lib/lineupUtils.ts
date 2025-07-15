import { Player, Lineup, Position } from "@/types";

/**
 * Populates a team's lineup from its roster.
 * It tries to fill each position with the best available player.
 */
export const populateLineup = (roster: Player[]): Lineup => {
    const lineup: Lineup = {
        forwards: { lw: Array(3).fill(null), c: Array(3).fill(null), rw: Array(3).fill(null) },
        defence: { ld: Array(3).fill(null), rd: Array(3).fill(null) },
        goalies: { starter: null, backup: null },
    };

    // Create a mutable copy of the roster to draw players from
    const playerPool = [...roster];

    const assignPlayer = (position: Position): string | null => {
        // Prioritize players whose primary position matches
        let bestPlayerIndex = playerPool.findIndex(p => p.positions[0] === position);
        
        // If none, find a player who can play the position as a secondary role
        if (bestPlayerIndex === -1) {
            bestPlayerIndex = playerPool.findIndex(p => p.positions.includes(position));
        }

        // If a player is found, remove them from the pool and return their ID
        if (bestPlayerIndex !== -1) {
            return playerPool.splice(bestPlayerIndex, 1)[0].id;
        }

        // If no suitable player is found in the entire pool
        return null;
    };

    // Populate forward lines
    for (let i = 0; i < 3; i++) {
        lineup.forwards.lw[i] = assignPlayer('LW');
        lineup.forwards.c[i] = assignPlayer('C');
        lineup.forwards.rw[i] = assignPlayer('RW');
    }
    // Populate defence pairings
    for (let i = 0; i < 3; i++) {
        lineup.defence.ld[i] = assignPlayer('LD');
        lineup.defence.rd[i] = assignPlayer('RD');
    }
    // Populate goalies
    lineup.goalies.starter = assignPlayer('G');
    lineup.goalies.backup = assignPlayer('G');

    return lineup;
};