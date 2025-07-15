import { Player, Lineup, Position } from "@/types";

/**
 * Populates a team's lineup from its roster.
 * It tries to fill each position with the best available player.
 */
export const populateLineup = (roster: Player[]): Lineup => {
    const lineup: Lineup = {
        forwards: { line1: [null, null, null], line2: [null, null, null], line3: [null, null, null], line4: [null, null, null] },
        defence: { pair1: [null, null], pair2: [null, null], pair3: [null, null] },
        goalies: { starter: null, backup: null },
    };

    const healthyRoster = roster.filter(p => p.healthStatus === 'Healthy');
    
    const forwards = healthyRoster.filter(p => ['C', 'LW', 'RW'].some(pos => p.positions.includes(pos as Position))).sort((a, b) => b.starRating - a.starRating);
    const defencemen = healthyRoster.filter(p => ['LD', 'RD'].some(pos => p.positions.includes(pos as Position))).sort((a, b) => b.starRating - a.starRating);
    const goalies = healthyRoster.filter(p => p.positions.includes('G')).sort((a, b) => b.starRating - a.starRating);

    const assigned = new Set<string>();

    // Assign Goalies
    if (goalies[0]) {
        lineup.goalies.starter = goalies[0].id;
        assigned.add(goalies[0].id);
    }
    if (goalies[1]) {
        lineup.goalies.backup = goalies[1].id;
        assigned.add(goalies[1].id);
    }

    // Assign Forwards
    let forwardIndex = 0;
    for (const lineKey of Object.keys(lineup.forwards) as Array<keyof Lineup['forwards']>) {
        for (let i = 0; i < lineup.forwards[lineKey].length; i++) {
            while (forwardIndex < forwards.length && assigned.has(forwards[forwardIndex].id)) {
                forwardIndex++;
            }
            if (forwardIndex < forwards.length) {
                lineup.forwards[lineKey][i] = forwards[forwardIndex].id;
                assigned.add(forwards[forwardIndex].id);
                forwardIndex++;
            }
        }
    }

    // Assign Defencemen
    let defenceIndex = 0;
    for (const pairKey of Object.keys(lineup.defence) as Array<keyof Lineup['defence']>) {
        for (let i = 0; i < lineup.defence[pairKey].length; i++) {
            while (defenceIndex < defencemen.length && assigned.has(defencemen[defenceIndex].id)) {
                defenceIndex++;
            }
            if (defenceIndex < defencemen.length) {
                lineup.defence[pairKey][i] = defencemen[defenceIndex].id;
                assigned.add(defencemen[defenceIndex].id);
                defenceIndex++;
            }
        }
    }

    return lineup;
};