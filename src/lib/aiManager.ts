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

    // Pool all players from the organization and sort by ability
    const allPlayers = sortedTeams.flatMap(team => team.roster);
    allPlayers.sort((a, b) => b.currentAbility - a.currentAbility);

    // Clear existing rosters
    const updatedTeams = sortedTeams.map(team => ({ ...team, roster: [] as Player[] }));

    // Distribute players in a "snake" draft style to ensure top teams get better players
    // but roster sizes remain relatively even.
    allPlayers.forEach((player, index) => {
        const teamIndex = index % sortedTeams.length;
        updatedTeams[teamIndex].roster.push(player);
    });

    // Ensure minimum roster size by moving players from bottom up if needed
    for (let i = updatedTeams.length - 1; i > 0; i--) {
        const currentTeam = updatedTeams[i];
        const teamAbove = updatedTeams[i - 1];
        while (currentTeam.roster.length < 16 && teamAbove.roster.length > 16) {
            // Move worst player from team above to current team
            teamAbove.roster.sort((a, b) => a.currentAbility - b.currentAbility);
            const playerToMove = teamAbove.roster.shift();
            if (playerToMove) {
                currentTeam.roster.push(playerToMove);
            }
        }
        // sort back
        teamAbove.roster.sort((a, b) => b.currentAbility - a.currentAbility);
    }

    return updatedTeams;
};