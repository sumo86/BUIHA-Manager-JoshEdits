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

    // Sort teams by level (e.g., "Team A", "Team B")
    const sortedTeams = [...teamsInOrg].sort((a, b) => a.name.localeCompare(b.name));

    // Pool all players from the organization and sort by ability within position groups
    const allPlayers = sortedTeams.flatMap(team => team.roster);
    const allGoalies = allPlayers.filter(p => p.positions.includes('G')).sort((a, b) => b.currentAbility - a.currentAbility);
    const allSkaters = allPlayers.filter(p => !p.positions.includes('G')).sort((a, b) => b.currentAbility - a.currentAbility);

    // Clear existing rosters
    const updatedTeams = sortedTeams.map(team => ({ ...team, roster: [] as Player[] }));
    const assignedPlayerIds = new Set<string>();

    // Assign goalies first, ensuring 2 per team
    for (const team of updatedTeams) {
        const goaliesNeeded = 2;
        while (team.roster.filter(p => p.positions.includes('G')).length < goaliesNeeded && allGoalies.length > 0) {
            const goalie = allGoalies.shift();
            if (goalie && !assignedPlayerIds.has(goalie.id)) {
                team.roster.push(goalie);
                assignedPlayerIds.add(goalie.id);
            }
        }
    }

    // Assign skaters to fill up rosters
    for (const team of updatedTeams) {
        const rosterSize = 21; // Standard roster size
        while (team.roster.length < rosterSize && allSkaters.length > 0) {
            const skater = allSkaters.shift();
            if (skater && !assignedPlayerIds.has(skater.id)) {
                team.roster.push(skater);
                assignedPlayerIds.add(skater.id);
            }
        }
    }

    // Assign remaining players (if any) to the lowest team
    const lowestTeam = updatedTeams[updatedTeams.length - 1];
    [...allGoalies, ...allSkaters].forEach(p => {
        if (!assignedPlayerIds.has(p.id)) {
            lowestTeam.roster.push(p);
        }
    });

    // Ensure minimum roster size by moving players down, being careful with goalies
    for (let i = 0; i < updatedTeams.length - 1; i++) {
        const teamAbove = updatedTeams[i];
        const teamBelow = updatedTeams[i + 1];
        while (teamBelow.roster.length < 16 && teamAbove.roster.length > 16) {
            // Find the worst skater to move down, preserving goalie counts
            teamAbove.roster.sort((a, b) => a.currentAbility - b.currentAbility);
            const playerToMoveIndex = teamAbove.roster.findIndex(p => !p.positions.includes('G'));

            if (playerToMoveIndex !== -1) {
                const [playerToMove] = teamAbove.roster.splice(playerToMoveIndex, 1);
                teamBelow.roster.push(playerToMove);
            } else {
                // No skaters to move, break to avoid infinite loop
                break;
            }
            // sort back
            teamAbove.roster.sort((a, b) => b.currentAbility - a.currentAbility);
        }
    }

    return updatedTeams;
};