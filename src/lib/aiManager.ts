import { Team } from '@/types';
import { tactics } from '@/data/tactics';
import { calculateTacticSuitability } from '@/lib/tactics';

/**
 * Allows an AI team to make tactical adjustments based on the game situation.
 * @param aiTeam The AI team to potentially adjust.
 * @param playerTeam The opponent (player) team.
 * @param scoreDifference The score from the AI's perspective (e.g., -1 means losing by 1).
 * @returns The potentially updated AI team.
 */
export const aiMakeAdjustments = (aiTeam: Team, playerTeam: Team, scoreDifference: number): Team => {
    // If AI is winning or tied, it's less likely to make a change.
    if (scoreDifference >= 0 && Math.random() < 0.75) {
        return aiTeam;
    }

    const newAiTeam = JSON.parse(JSON.stringify(aiTeam));
    let changeMade = false;

    // --- Defensive Tactic Adjustment ---
    const playerAttackTacticName = playerTeam.tactics['Attacking Zone Offence'];
    const aiDefendTacticName = aiTeam.tactics['Defensive Zone Coverage'];
    const playerAttackTactic = tactics.find(t => t.tactic === playerAttackTacticName);
    const aiDefendTactic = tactics.find(t => t.tactic === aiDefendTacticName);

    if (playerAttackTactic && aiDefendTactic) {
        const isCountered = playerAttackTactic.strongVs === aiDefendTactic.tactic;
        const suitability = calculateTacticSuitability(aiDefendTactic, aiTeam.roster);

        // Change if losing and countered, or if suitability is poor.
        if (scoreDifference < 0 || isCountered || suitability.score <= 2) {
            const possibleTactics = tactics.filter(t => t.category === 'Defensive Zone Coverage');
            
            const bestTactic = possibleTactics
                .map(t => ({
                    tactic: t,
                    suitability: calculateTacticSuitability(t, aiTeam.roster),
                    isCounterToPlayer: t.strongVs === playerAttackTactic.tactic,
                }))
                .sort((a, b) => {
                    // Prioritize counters, then suitability
                    if (a.isCounterToPlayer && !b.isCounterToPlayer) return -1;
                    if (!a.isCounterToPlayer && b.isCounterToPlayer) return 1;
                    return b.suitability.score - a.suitability.score;
                })[0];

            if (bestTactic && bestTactic.tactic.tactic !== aiDefendTactic.tactic) {
                newAiTeam.tactics['Defensive Zone Coverage'] = bestTactic.tactic.tactic;
                changeMade = true;
            }
        }
    }
    
    // A similar logic could be added for AI's offense vs player's defense.
    // For now, just adjusting the defensive tactic is a great start.

    return newAiTeam;
};