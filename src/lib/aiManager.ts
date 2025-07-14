import { Team, Player, SkaterAttributes } from '@/types';
import { tactics } from '@/data/tactics';

export const aiMakeAdjustments = (team: Team, opponent: Team, scoreDifference: number): Team => {
    const newTeam = JSON.parse(JSON.stringify(team));
    
    // Tactic adjustment logic
    const currentAttackTacticName = newTeam.tactics['Attacking Zone Offence'];
    const currentDefendTacticName = newTeam.tactics['Defensive Zone Coverage'];
    const opponentDefendTacticName = opponent.tactics['Defensive Zone Coverage'];
    
    const currentAttackTactic = tactics.find(t => t.tactic === currentAttackTacticName);
    
    if (scoreDifference < -1 && currentAttackTactic && currentAttackTactic.weakVs === opponentDefendTacticName) {
        const betterTactics = tactics.filter(t => t.phase === 'Offence' && t.tactic !== currentAttackTacticName && t.weakVs !== opponentDefendTacticName);
        if (betterTactics.length > 0) {
            newTeam.tactics['Attacking Zone Offence'] = betterTactics[Math.floor(Math.random() * betterTactics.length)].tactic;
        }
    }

    return newTeam;
};

export const rebalanceOrganizationRosters = (teamsInOrg: Team[]): Team[] => {
    if (teamsInOrg.length <= 1) return teamsInOrg;

    // Sort teams by level (assuming naming convention like "Team A", "Team B")
    const sortedTeams = [...teamsInOrg].sort((a, b) => a.name.localeCompare(b.name));

    // Pool all players from the organization
    const allPlayers = sortedTeams.flatMap(team => team.roster);

    // Sort all players by current ability
    allPlayers.sort((a, b) => b.currentAbility - a.currentAbility);

    // Clear existing rosters
    const updatedTeams = sortedTeams.map(team => ({ ...team, roster: [] as Player[] }));
    const assignedPlayerIds = new Set<string>();

    // Re-distribute players, filling top teams first
    for (const team of updatedTeams) {
        const rosterLimit = 21; // A standard roster size
        while (team.roster.length < rosterLimit && allPlayers.length > 0) {
            const playerIndex = allPlayers.findIndex(p => !assignedPlayerIds.has(p.id));
            if (playerIndex === -1) break; // No unassigned players left
            
            const playerToAssign = allPlayers[playerIndex];
            team.roster.push(playerToAssign);
            assignedPlayerIds.add(playerToAssign.id);
        }
    }

    // Distribute any remaining players to the lowest-level team
    const lowestTeam = updatedTeams[updatedTeams.length - 1];
    allPlayers.forEach(p => {
        if (!assignedPlayerIds.has(p.id)) {
            lowestTeam.roster.push(p);
            assignedPlayerIds.add(p.id);
        }
    });

    return updatedTeams;
};