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

    // Create mutable, sorted pools for each position group
    const goalies = [...roster].filter(p => p.positions.includes('G')).sort((a, b) => b.currentAbility - a.currentAbility);
    const forwards = [...roster].filter(p => ['C', 'LW', 'RW'].some(pos => p.positions.includes(pos as Position))).sort((a, b) => b.currentAbility - a.currentAbility);
    const defence = [...roster].filter(p => ['LD', 'RD'].some(pos => p.positions.includes(pos as Position))).sort((a, b) => b.currentAbility - a.currentAbility);

    const assignedIds = new Set<string>();

    const assignPlayer = (pool: Player[], position?: Position): string | null => {
        let playerIndex = -1;

        // 1. Try to find a natural fit who is not yet assigned
        if (position) {
            playerIndex = pool.findIndex(p => !assignedIds.has(p.id) && p.positions.includes(position));
        }

        // 2. If no natural fit, find any player in the pool not yet assigned
        if (playerIndex === -1) {
            playerIndex = pool.findIndex(p => !assignedIds.has(p.id));
        }

        if (playerIndex !== -1) {
            const player = pool[playerIndex];
            assignedIds.add(player.id);
            return player.id;
        }

        return null;
    };

    // Populate goalies
    lineup.goalies.starter = assignPlayer(goalies, 'G');
    lineup.goalies.backup = assignPlayer(goalies, 'G');

    // Populate defence pairings (3 pairs)
    for (let i = 0; i < 3; i++) {
        lineup.defence.ld[i] = assignPlayer(defence, 'LD');
        lineup.defence.rd[i] = assignPlayer(defence, 'RD');
    }

    // Populate forward lines (3 lines)
    for (let i = 0; i < 3; i++) {
        lineup.forwards.lw[i] = assignPlayer(forwards, 'LW');
        lineup.forwards.c[i] = assignPlayer(forwards, 'C');
        lineup.forwards.rw[i] = assignPlayer(forwards, 'RW');
    }

    return lineup;
};