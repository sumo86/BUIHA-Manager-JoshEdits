import { Team, NationalsTournament, NationalsPlayoffMatch, ScheduleEntry, NationalsGame } from '@/types';
import { simulateFullGame, simulateOvertime } from './gameEngine';
import { processGameResults as processGameResultsEngine } from './statsEngine';
import { generatePlayoffBracket } from './nationalsGenerator';
import { toast } from 'sonner';

const getWinner = (match: NationalsPlayoffMatch): string | undefined => {
    if (!match.result) return undefined;
    if (match.result.homeScore > match.result.awayScore) return typeof match.homeTeam === 'string' ? match.homeTeam : undefined;
    if (match.result.awayScore > match.result.homeScore) return typeof match.awayTeam === 'string' ? match.awayTeam : undefined;
    return undefined;
};

export const processNationalsRound = (
    division: string,
    teams: Team[],
    nationalsData: { [year: number]: { [division: string]: NationalsTournament } },
    currentYear: number,
    userGameResult?: { homeTeamName: string, awayTeamName: string, homeScore: number, awayScore: number, gameId: string }
): { updatedTeams: Team[], updatedNationalsData: any, newAchievements: { teamName: string, achievement: any }[] } => {
    const tempNationalsData = JSON.parse(JSON.stringify(nationalsData));
    const tournament = tempNationalsData[currentYear]?.[division];
    if (!tournament || tournament.status === 'completed') {
        return { updatedTeams: teams, updatedNationalsData: nationalsData, newAchievements: [] };
    }

    let tempTeams = JSON.parse(JSON.stringify(teams)) as Team[];
    const newAchievements: { teamName: string, achievement: any }[] = [];
    
    if (tournament.status === 'group-stage') {
        const gamesToSim = tournament.groupStageSchedule.filter((g: NationalsGame) => g.round === tournament.currentRound && g.status === 'scheduled');
        
        if (userGameResult) {
            const userGame = gamesToSim.find(g => g.id === userGameResult.gameId);
            if (userGame) {
                userGame.status = 'completed';
                userGame.result = { homeScore: userGameResult.homeScore, awayScore: userGameResult.awayScore };
            }
        }

        gamesToSim.forEach((game: NationalsGame) => {
            if (game.status === 'completed') return;
            const homeTeam = tempTeams.find((t: Team) => t.name === game.homeTeam);
            const awayTeam = tempTeams.find((t: Team) => t.name === game.awayTeam);

            if (homeTeam && awayTeam) {
                const finalGameState = simulateFullGame(homeTeam, awayTeam, true);
                const currentSeasonString = `${currentYear}-${currentYear + 1}`;
                const { updatedUserTeam, updatedOpponentTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, currentSeasonString, true);
                tempTeams = tempTeams.map((t: Team) => {
                    if (t.name === homeTeam.name) return updatedUserTeam;
                    if (t.name === awayTeam.name) return updatedOpponentTeam;
                    return t;
                });
                game.status = 'completed';
                game.result = { homeScore: finalGameState.userScore, awayScore: finalGameState.opponentScore };
            }
        });

        tournament.groups.forEach((group: any) => {
            group.standings.forEach((standing: any) => {
                const teamGames = tournament.groupStageSchedule.filter((g: NationalsGame) => (g.homeTeam === standing.teamName || g.awayTeam === standing.teamName) && g.round === tournament.currentRound && g.result);
                teamGames.forEach((game: NationalsGame) => {
                    standing.played++;
                    const isHome = game.homeTeam === standing.teamName;
                    const homeScore = game.result!.homeScore;
                    const awayScore = game.result!.awayScore;
                    standing.goalsFor += isHome ? homeScore : awayScore;
                    standing.goalsAgainst += isHome ? awayScore : homeScore;
                    if (homeScore === awayScore) { standing.draws++; standing.points++; }
                    else if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) { standing.wins++; standing.points += 3; }
                    else { standing.losses++; }
                });
            });
        });

        tournament.currentRound = (tournament.currentRound as number) + 1;
        
        const allGroupGamesPlayed = tournament.groupStageSchedule.every((g: NationalsGame) => g.status === 'completed');
        if (allGroupGamesPlayed) {
            toast.success(`Group stage for ${division} has concluded!`, { description: "Playoff matchups will now be generated." });
            tournament.playoffSchedule = generatePlayoffBracket(tournament.groups, tournament.groupStageSchedule[0].date);
            
            const silverPlayoffExists = tournament.playoffSchedule.some((m: NationalsPlayoffMatch) => m.bracket === 'Silver');

            if (silverPlayoffExists) {
                tournament.status = 'silver-playoffs';
                const firstSilverRound = tournament.playoffSchedule.find((m: NationalsPlayoffMatch) => m.bracket === 'Silver')?.round || 'Final';
                tournament.currentRound = firstSilverRound;
            } else {
                tournament.status = 'gold-playoffs';
                const firstGoldRound = tournament.playoffSchedule.find((m: NationalsPlayoffMatch) => m.bracket === 'Gold')?.round || 'Final';
                tournament.currentRound = firstGoldRound;
            }

            if (tournament.playoffSchedule.length === 0) {
                tournament.status = 'completed';
            }
        }
    } else if (tournament.status === 'silver-playoffs' || tournament.status === 'gold-playoffs') {
        const currentBracket = tournament.status === 'silver-playoffs' ? 'Silver' : 'Gold';
        const allPlayoffGames = tournament.playoffSchedule as NationalsPlayoffMatch[];
        
        allPlayoffGames.forEach((game: NationalsPlayoffMatch) => {
            if (game.bracket === currentBracket && game.round === tournament.currentRound && game.status === 'scheduled') {
                if (typeof game.homeTeam !== 'string') {
                    const feederMatch = allPlayoffGames.find(m => m.id === (game.homeTeam as { winnerOf: string }).winnerOf);
                    if (feederMatch && feederMatch.status === 'completed') game.<dyad-problem-report summary="10 problems">
<problem file="src/lib/gameEngine.ts" line="3" column="17" code="2724">'&quot;@/data/roles&quot;' has no exported member named 'Role'. Did you mean 'roles'?</problem>
<problem file="src/context/TeamContext.tsx" line="490" column="39" code="2741">Property 'captaincy' is missing in type '{ season: string; team: string; league: string; gamesPlayed: number; goals: number; assists: number; points: number; penaltyMinutes: number; shotsAgainst: number; saves: number; shutouts: number; goalsAgainst: number; savePercentage: number; goalsAgainstAverage: number; }' but required in type 'PlayerSeasonStats'.</problem>
<problem file="src/lib/statsUtils.ts" line="35" column="3" code="2741">Property 'captaincy' is missing in type '{ team: string; season: string; league: string; gamesPlayed: number; goals: number; assists: number; points: number; penaltyMinutes: number; shotsAgainst: number; saves: number; shutouts: number; goalsAgainst: number; savePercentage: number; goalsAgainstAverage: number; }' but required in type 'PlayerSeasonStats'.</problem>
<problem file="src/lib/statsUtils.ts" line="107" column="3" code="2741">Property 'captaincy' is missing in type '{ team: string; season: string; league: string; gamesPlayed: number; goals: number; assists: number; points: number; penaltyMinutes: number; shotsAgainst: number; saves: number; shutouts: number; goalsAgainst: number; savePercentage: number; goalsAgainstAverage: number; }' but required in type 'PlayerSeasonStats'.</problem>
<problem file="src/components/player/PlayerScoutingReport.tsx" line="46" column="219" code="2820">Type '&quot;puckhandling&quot;' is not assignable to type 'keyof SkaterAttributes'. Did you mean '&quot;puckHandling&quot;'?</problem>
<problem file="src/components/player/PlayerScoutingReport.tsx" line="47" column="164" code="2820">Type '&quot;puckhandling&quot;' is not assignable to type 'keyof GoalieAttributes'. Did you mean '&quot;puckHandling&quot;'?</problem>
<problem file="src/pages/PlayerProfile.tsx" line="96" column="104" code="2820">Type '&quot;puckhandling&quot;' is not assignable to type 'keyof SkaterAttributes'. Did you mean '&quot;puckHandling&quot;'?</problem>
<problem file="src/pages/PlayerProfile.tsx" line="98" column="158" code="2820">Type '&quot;puckhandling&quot;' is not assignable to type 'keyof GoalieAttributes'. Did you mean '&quot;puckHandling&quot;'?</problem>
<problem file="src/pages/Lineup.tsx" line="3" column="17" code="2724">'&quot;@/data/roles&quot;' has no exported member named 'Role'. Did you mean 'roles'?</problem>
<problem file="src/components/game/LineupManager.tsx" line="5" column="17" code="2724">'&quot;@/data/roles&quot;' has no exported member named 'Role'. Did you mean 'roles'?</problem>
</dyad-problem-report><think>Deciding which files are relevant...

**Examining Error Scenarios**

I'm currently mapping out the initial error, focusing on the import paths within `gameEngine.ts`.  It seems the module resolution might be off, and I'll need to check that the paths are correctly configured. I'll look at the `@/data/roles` import to make sure the directory is set up correctly.


**Diagnosing Type Mismatches**

I've identified the issue in `TeamContext.tsx`. It seems the `PlayerSeasonStats` type is missing the `captaincy` property when the object is being created, causing a type mismatch. I will need to add or modify the data source for the captaincy. I'll start by checking the `src/types/index.ts` to understand the requirements, and then pinpoint where the `captaincy` value should come from in `TeamContext.tsx`.


**Tackling Remaining Errors**

I've now reached the final batch of errors. It seems all are due to missing `captaincy` properties in various object initializations of type `PlayerSeasonStats`. I'm systematically applying the fix, adding `captaincy: null,` or where applicable, `captaincy: player.captaincy || null,` to the relevant code blocks in `statsUtils.ts`. I'm carefully checking context for availability of a player object. I should be done soon.


**Rectifying Imports & Typos**

I'm addressing the `gameEngine.ts` import now. I'll remove the incorrect `Role` import from `@/data/roles`, as it's unnecessary and was the source of the initial error. Then, I'll tackle the two typos in `PlayerScoutingReport.tsx`, replacing `puckhandling` with `puckHandling`. These fixes should be straightforward.


{
  "complexity": "low",
  "relevantFiles": [
    "src/lib/gameEngine.ts",
    "src/context/TeamContext.tsx",
    "src/lib/statsUtils.ts",
    "src/components/player/PlayerScoutingReport.tsx",
    "src/pages/PlayerProfile.tsx",
    "src/pages/Lineup.tsx",
    "src/components/game/LineupManager.tsx"
  ]
}</think><dyad-codebase-context files="src/lib/gameEngine.ts,src/context/TeamContext.tsx,src/lib/statsUtils.ts,src/components/player/PlayerScoutingReport.tsx,src/pages/PlayerProfile.tsx,src/pages/Lineup.tsx,src/components/game/LineupManager.tsx">Complexity: low</dyad-codebase-context><think>**Fixing TypeScript Errors**

I'm currently diving into the 10 reported TypeScript errors. Starting with the first one, I'm focusing on the import issue in `gameEngine.ts`. It seems there's a problem with the `Role` export from the `@/data/roles` module. I'm investigating potential misspellings or incorrect import paths. The goal is to resolve this dependency before moving on to the next error.


**Pinpointing the Imports**

I've identified the import issue in `gameEngine.ts`. Turns out the initial assessment was partially correct: The import was wrong. I need to import `Role` from `@/types` not `@/data/roles`. Also, the usage of `roles` (plural) is correct. Next up are the `PlayerSeasonStats` errors, starting with those found in `TeamContext.tsx`. It's missing the `captaincy` property when generating these objects.


**Analyzing Captaincy Issues**

I'm now tackling the `captaincy` property errors. The first three are related and are all problems of omitting the `captaincy` field when creating `PlayerSeasonStats` objects in `TeamContext.tsx` and `statsUtils.ts`. I'll go through each file and add or set `captaincy: player.captaincy` appropriately, and also add handling if it may be null. After this, I will resolve the remaining errors.


**Planning Error Resolution**

I've reviewed all 10 errors. Now, the plan is to systematically address them. First, I will address all the `Role` import issues, ensuring the correct imports from `types` for `Role` and `roles` from `@/data/roles` are used. Then, I will tackle the `captaincy` property errors, adding that field or handling potential null values where needed. Finally, I will quickly resolve the remaining "puckhandling" typos.


**Executing Error Fixes**

I've now begun implementing the changes. I'm starting with the import issues, updating `gameEngine.ts`, `Lineup.tsx`, and `LineupManager.tsx`. The goal is to get these files to compile without import errors. Then, I'll adjust the files to correctly handle `captaincy`, and lastly, I'll correct the "puckhandling" typos.


**Coding the Changes**

I'm now implementing the outlined plan. First, I'll update the import statements in `gameEngine.ts`, `Lineup.tsx`, and `LineupManager.tsx`. After confirming these changes resolve the import errors, I'll address the `captaincy` property inconsistencies in `TeamContext.tsx` and `statsUtils.ts`. Following this, I will make the necessary typo corrections in `PlayerScoutingReport.tsx` and `PlayerProfile.tsx`. The entire process will be done methodically, reviewing each change after implementation to confirm.


</think>You're right to point these out! It looks like a few type inconsistencies and typos slipped through. I'll fix all 10 errors for you.

Here's a breakdown of the fixes:

1.  **Incorrect `Role` Import**: The `Role` type is defined in `src/types/index.ts`, while `roles` (the array of role objects) is exported from `src/data/roles.ts`. I'll correct the import statements in `src/lib/gameEngine.ts`, `src/pages/Lineup.tsx`, and `src/components/game/LineupManager.tsx` to reflect this.
2.  **Missing `captaincy` in `PlayerSeasonStats`**: The `PlayerSeasonStats` type requires a `captaincy` property. I'll ensure this property is correctly initialized when new `PlayerSeasonStats` objects are created or aggregated in `src/context/TeamContext.tsx` and `src/lib/statsUtils.ts`.
3.  **`puckhandling` Typo**: There were several instances where `puckhandling` was used instead of the correct `puckHandling`. I'll correct these typos in `src/components/player/PlayerScoutingReport.tsx` and `src/pages/PlayerProfile.tsx`.

Here are the updated files:

<dyad-write path="src/lib/gameEngine.ts" description="Correcting Role import.">
import { Team, GameEvent, GameState, SkaterAttributes, GoalieAttributes, Player, Instruction, Role } from '@/types';
import { tactics } from '@/data/tactics';
import { roles } from '@/data/roles';
import { calculateTacticSuitability } from '@/lib/tactics';
import { aiMakeAdjustments } from '@/lib/aiManager';
import { populateLineup } from '@/lib/lineupUtils';

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomValueInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const POWER_PLAY_MODIFIER = 1.3;

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(19 - mins).padStart(2, '0')}:${String(59 - secs).padStart(2, '0')}`;
};

const defaultModifiers: Role['behavioralModifiers'] = {
    shootTendency: 1.0,
    passTendency: 1.0,
    hitTendency: 1.0,
    shotBlockTendency: 1.0,
    penaltyTendency: 1.0,
};

const getRoleModifiers = (player: Player | null): Role['behavioralModifiers'] => {
    if (!player || !player.role) {
        return defaultModifiers;
    }
    const roleData = roles.find(r => r.name === player.role);
    return roleData ? roleData.behavioralModifiers : defaultModifiers;
};

const getGoalFactor = (leagueDivision: string, isBigGame: boolean): number => {
    if (isBigGame) return getRandomValueInRange(2, 4);
    if (leagueDivision.includes('Non-Checking 3')) return getRandomValueInRange(11, 13); 
    if (leagueDivision.includes('Non-Checking 2')) return getRandomValueInRange(16, 22);
    if (leagueDivision.includes('Non-Checking 1')) return getRandomValueInRange(15, 20);
    if (leagueDivision.includes('Checking 2')) return getRandomValueInRange(14, 19);
    if (leagueDivision.includes('Checking 1')) return getRandomValueInRange(12, 17);
    return getRandomValueInRange(15, 20);
};

const infractions = ["Holding", "Boarding", "Tripping", "Hooking", "Slashing", "Interference", "Roughing"];

const getInstructionModifiers = (player: Player) => {
    const modifiers = { offense: 1.0, defense: 1.0, goalie: 1.0, morale: 0, penaltyChance: 1.0 };
    const activeInstructions = player.activeInstructions || [];
    if (activeInstructions.length === 0) return modifiers;
    for (const instruction of activeInstructions) {
        switch (instruction.type) {
            case 'Encourage': modifiers.morale += 0.02; break;
            case 'Praise': modifiers.morale += 0.05; break;
            case 'Discipline': modifiers.morale -= 0.10; break;
            case 'Push Harder': modifiers.offense += 0.05; modifiers.defense += 0.05; modifiers.goalie += 0.05; break;
            case 'Calm Down': modifiers.penaltyChance *= 0.75; break;
        }
    }
    return modifiers;
};

const getMoraleModifier = (morale: Player['morale'], instructionMoraleMod: number): number => {
    let baseMod = 1.0;
    switch (morale) {
        case 'Happy': baseMod = 1.05; break;
        case 'Unhappy': baseMod = 0.90; break;
        case 'Angry': baseMod = 0.80; break;
    }
    return baseMod + instructionMoraleMod;
};

const getSkaterOffensiveRating = (player: Player, isBigGame?: boolean): number => {
    if (player.positions.includes('G')) return 0;
    const attrs = player.attributes as SkaterAttributes;
    const instructionMods = getInstructionModifiers(player);
    const baseRating = (attrs.shootingAccuracy + attrs.shootingRange + attrs.offensiveRead + attrs.gettingOpen + attrs.passing + attrs.puckHandling + (attrs.intelligence / 2)) / 6.5;
    const moraleMod = getMoraleModifier(player.morale, instructionMods.morale);
    let bigGameMod = 1.0;
    if (isBigGame) {
        const bigGamesAttr = attrs.bigGames || 10;
        bigGameMod = 1 + (bigGamesAttr - 10) / 50;
    }
    return baseRating * moraleMod * instructionMods.offense * bigGameMod;
};

const getSkaterDefensiveRating = (player: Player, isBigGame?: boolean): number => {
    if (player.positions.includes('G')) return 0;
    const attrs = player.attributes as SkaterAttributes;
    const instructionMods = getInstructionModifiers(player);
    const baseRating = (attrs.defensiveRead + attrs.positioning + attrs.stickchecking + attrs.checking + attrs.shotBlocking + (attrs.intelligence / 2)) / 5.5;
    const moraleMod = getMoraleModifier(player.morale, instructionMods.morale);
    let bigGameMod = 1.0;
    if (isBigGame) {
        const bigGamesAttr = attrs.bigGames || 10;
        bigGameMod = 1 + (bigGamesAttr - 10) / 50;
    }
    return baseRating * moraleMod * instructionMods.defense * bigGameMod;
};

const getGoalieRating = (player: Player, isBigGame?: boolean): number => {
    if (!player.positions.includes('G')) return 0;
    const attrs = player.attributes as GoalieAttributes;
    const instructionMods = getInstructionModifiers(player);
    const baseRating = (attrs.blocker + attrs.glove + attrs.lowShots + attrs.positioning + attrs.rebound + attrs.recovery + attrs.reflexes + (attrs.mentalToughness / 2)) / 7.5;
    const moraleMod = getMoraleModifier(player.morale, instructionMods.morale);
    let bigGameMod = 1.0;
    if (isBigGame) {
        const bigGamesAttr = attrs.bigGames || 10;
        bigGameMod = 1 + (bigGamesAttr - 10) / 50;
    }
    return baseRating * moraleMod * instructionMods.goalie * bigGameMod;
};

const selectPlayerWeighted = (players: Player[], getWeight: (p: Player) => number): Player | null => {
    const weightedPlayers = players.map(p => ({ player: p, weight: getWeight(p) }));
    const totalWeight = weightedPlayers.reduce((sum, wp) => sum + wp.weight, 0);
    if (totalWeight <= 0) return players.length > 0 ? getRandomItem(players) : null;
    let random = Math.random() * totalWeight;
    for (const wp of weightedPlayers) {
        if (random < wp.weight) return wp.player;
        random -= wp.weight;
    }
    return null;
};

const getTacticalModifier = (attackingTeam: Team, defendingTeam: Team): number => {
    let modifier = 1.0;
    const attackTacticName = attackingTeam.tactics['Attacking Zone Offence'];
    const defendTacticName = defendingTeam.tactics['Defensive Zone Coverage'];
    const attackTactic = tactics.find(t => t.tactic === attackTacticName);
    const defendTactic = tactics.find(t => t.tactic === defendTacticName);
    if (!attackTactic || !defendTactic) return modifier;
    if (attackTactic.strongVs === defendTactic.tactic) modifier += 0.075;
    else if (attackTactic.weakVs === defendTactic.tactic) modifier -= 0.075;
    const attackSuitability = calculateTacticSuitability(attackTactic, attackingTeam.roster);
    const defendSuitability = calculateTacticSuitability(defendTactic, defendingTeam.roster);
    const suitabilityToMod = (score: number) => (score - 3) * 0.025;
    modifier += suitabilityToMod(attackSuitability.score);
    modifier -= suitabilityToMod(defendSuitability.score);
    return Math.max(0.8, Math.min(1.2, modifier));
};

const determineFaceoffWinner = (teamA: Team, teamB: Team): string => {
    const getTeamFaceoffRating = (team: Team) => {
        const centers = team.lineup.forwards.c.map(id => team.roster.find(p => p.id === id)).filter((p): p is Player => !!p);
        if (centers.length === 0) return 5;
        return Math.max(...centers.map(c => (c.attributes as SkaterAttributes).faceoffs));
    };
    const ratingA = getTeamFaceoffRating(teamA);
    const ratingB = getTeamFaceoffRating(teamB);
    const totalRating = ratingA + ratingB;
    return (Math.random() * totalRating < ratingA) ? teamA.id : teamB.id;
};

const generateGameEvent = (gameState: GameState, userTeam: Team, opponentTeam: Team, isBigGame?: boolean): { event: GameEvent | null, possessionChange: boolean, shotOnGoal: boolean } => {
    const eventTime = formatTime(gameState.time);
    let possessionChange = false;
    let shotOnGoal = false;

    let attackingTeam: Team = gameState.possessionHolder === userTeam.id ? userTeam : opponentTeam;
    const defendingTeam = attackingTeam.id === userTeam.id ? opponentTeam : userTeam;

    const tacticalModifier = getTacticalModifier(attackingTeam, defendingTeam);
    const attackingSkaters = attackingTeam.roster.filter(p => !p.positions.includes('G'));
    const defendingSkaters = defendingTeam.roster.filter(p => !p.positions.includes('G'));
    const defendingGoalie = defendingTeam.roster.find(p => p.id === defendingTeam.lineup.goalies.starter);

    if (attackingSkaters.length === 0) return { event: null, possessionChange: false, shotOnGoal: false };

    const avgAttackingOffense = attackingSkaters.reduce((sum, p) => sum + getSkaterOffensiveRating(p, isBigGame), 0) / attackingSkaters.length;
    const avgDefendingDefense = defendingSkaters.length > 0 ? defendingSkaters.reduce((sum, p) => sum + getSkaterDefensiveRating(p, isBigGame), 0) / defendingSkaters.length : 10;
    let defendingGoalieAbility = defendingGoalie ? getGoalieRating(defendingGoalie, isBigGame) : 10;

    let powerPlayModifier = 1.0;
    if (gameState.powerPlayState.isActive && gameState.powerPlayState.teamOnPowerPlay === attackingTeam.name) {
        powerPlayModifier = POWER_PLAY_MODIFIER;
    }

    const modifiedAttackRating = avgAttackingOffense * tacticalModifier * powerPlayModifier;
    const modifiedDefenseRating = avgDefendingDefense / tacticalModifier;
    const offenseFactor = (modifiedAttackRating - 10) / 10;
    const defenseFactor = (modifiedDefenseRating - 10) / 10;
    
    const totalGameTicks = 3600;
    const baseTargetGPG = getGoalFactor(attackingTeam.leagueDivision, isBigGame || false);
    let baseGoalProbPerTick = baseTargetGPG / totalGameTicks;
    let actualGoalProbPerTick = Math.max(0, Math.min(1, baseGoalProbPerTick * (1 + offenseFactor * 0.5) / (1 + defenseFactor * 0.5)));
    const goalieFactor = (defendingGoalieAbility - 10) / 10;
    const shotSuccessProb = Math.max(0.05, Math.min(0.95, 0.5 - (goalieFactor * 0.5)));
    let actualSavedShotProbPerTick = Math.max(0, actualGoalProbPerTick * (1 / shotSuccessProb - 1));
    const penaltyProbPerTick = 4.5 / totalGameTicks;
    const hitProbPerTick = 25.0 / totalGameTicks;
    const puckMovementProbPerTick = 100.0 / totalGameTicks;

    const roll = Math.random();
    let cumulativeProb = 0;

    if (roll < (cumulativeProb += actualGoalProbPerTick)) {
        possessionChange = true;
        shotOnGoal = true;
        const attacker = selectPlayerWeighted(attackingSkaters, p => Math.pow(getSkaterOffensiveRating(p, isBigGame), 4) * getRoleModifiers(p).shootTendency);
        if (!attacker) return { event: null, possessionChange: true, shotOnGoal };
        if (defendingGoalie) {
            let goalieStat = gameState.goalieStats.find(s => s.playerId === defendingGoalie.id);
            if (goalieStat) { goalieStat.goalsAgainst++; goalieStat.shotsAgainst++; } 
            else { gameState.goalieStats.push({ playerId: defendingGoalie.id, goalsAgainst: 1, shotsAgainst: 1, saves: 0, shutout: false }); }
        }
        const potentialAssisters = attackingSkaters.filter(p => p.id !== attacker.id);
        let assists: Player[] = [];
        if (potentialAssisters.length > 0 && Math.random() < 0.85) {
            const assist1 = selectPlayerWeighted(potentialAssisters, p => Math.pow((p.attributes as SkaterAttributes).passing, 4) * getRoleModifiers(p).passTendency);
            if (assist1) {
                assists.push(assist1);
                const potentialSecondAssisters = potentialAssisters.filter(p => p.id !== assist1.id);
                if (potentialSecondAssisters.length > 0 && Math.random() < 0.6) {
                    const assist2 = selectPlayerWeighted(potentialSecondAssisters, p => Math.pow((p.attributes as SkaterAttributes).passing, 4) * getRoleModifiers(p).passTendency);
                    if (assist2) assists.push(assist2);
                }
            }
        }
        const assistText = assists.length > 0 ? `Assists: ${assists.map(a => a.name).join(', ')}` : "Unassisted";
        let attackerStat = gameState.skaterStats.find(s => s.playerId === attacker.id);
        if (attackerStat) { attackerStat.goals++; attackerStat.points++; } 
        else { gameState.skaterStats.push({ playerId: attacker.id, goals: 1, assists: 0, points: 1, penaltyMinutes: 0 }); }
        assists.forEach(p => {
            let assisterStat = gameState.skaterStats.find(s => s.playerId === p.id);
            if (assisterStat) { assisterStat.assists++; assisterStat.points++; } 
            else { gameState.skaterStats.push({ playerId: p.id, goals: 0, assists: 1, points: 1, penaltyMinutes: 0 }); }
        });
        return { event: { time: eventTime, period: gameState.period, team: attackingTeam.name, description: `GOAL! ${attacker.name} scores. ${assistText}` }, possessionChange, shotOnGoal };
    } else if (roll < (cumulativeProb += actualSavedShotProbPerTick)) {
        possessionChange = true;
        shotOnGoal = true;
        const attacker = selectPlayerWeighted(attackingSkaters, p => getSkaterOffensiveRating(p, isBigGame) * getRoleModifiers(p).shootTendency);
        if (!attacker) return { event: null, possessionChange: true, shotOnGoal };
        if (defendingGoalie) {
            let goalieStat = gameState.goalieStats.find(s => s.playerId === defendingGoalie.id);
            if (goalieStat) { goalieStat.shotsAgainst++; goalieStat.saves++; } 
            else { gameState.goalieStats.push({ playerId: defendingGoalie.id, goalsAgainst: 0, shotsAgainst: 1, saves: 1, shutout: false }); }
        }
        return { event: { time: eventTime, period: gameState.period, team: attackingTeam.name, description: `${attacker.name} takes a shot, saved by ${defendingGoalie?.name || 'the goalie'}.` }, possessionChange, shotOnGoal };
    } else if (roll < (cumulativeProb += penaltyProbPerTick)) {
        possessionChange = true;
        const penaltyTeam = Math.random() > 0.5 ? userTeam : opponentTeam;
        if (penaltyTeam.roster.length === 0) return { event: null, possessionChange: false, shotOnGoal: false }; 
        const player = penaltyTeam.roster[Math.floor(Math.random() * penaltyTeam.roster.length)];
        if (!player) return { event: null, possessionChange: false, shotOnGoal: false };
        const instructionMods = getInstructionModifiers(player);
        const roleMods = getRoleModifiers(player);
        const aggression = (player.attributes as SkaterAttributes).aggression || 10;
        const sportsmanship = (player.attributes as SkaterAttributes).sportsmanship || 10;
        const personalityModifier = (1 + (aggression - 10) / 20) * (1 - (sportsmanship - 10) / 30);
        if (Math.random() < 0.1 * personalityModifier * instructionMods.penaltyChance * roleMods.penaltyTendency) {
            const infraction = getRandomItem(infractions);
            let playerStat = gameState.skaterStats.find(s => s.playerId === player.id);
            if (playerStat) { playerStat.penaltyMinutes += 2; } 
            else { gameState.skaterStats.push({ playerId: player.id, goals: 0, assists: 0, points: 0, penaltyMinutes: 2 }); }
            return { event: { time: eventTime, period: gameState.period, team: penaltyTeam.name, description: `PENALTY! ${player.name} gets 2 minutes for ${infraction}.` }, possessionChange, shotOnGoal: false };
        }
    } else if (roll < (cumulativeProb += hitProbPerTick)) {
        const attacker = selectPlayerWeighted(attackingSkaters, p => ((p.attributes as SkaterAttributes).hitting + (p.attributes as SkaterAttributes).strength) * getRoleModifiers(p).hitTendency);
        const defender = selectPlayerWeighted(defendingSkaters, p => (p.attributes as SkaterAttributes).balance + (p.attributes as SkaterAttributes).strength);
        if (!attacker || !defender) return { event: null, possessionChange: false, shotOnGoal: false };
        const hitDescriptions = [`${attacker.name} lays a big hit on ${defender.name}.`, `${attacker.name} delivers a crushing check to ${defender.name}.`, `${defender.name} is rocked by a huge hit from ${attacker.name}.`, `${attacker.name} finishes his check on ${defender.name} with authority.`, `${defender.name} gets stood up at the blue line by ${attacker.name}.`];
        if (defender.healthStatus === 'Healthy') {
            const injuryProneness = (defender.attributes as SkaterAttributes).injuryProneness || 10;
            if (Math.random() < 0.01 + (injuryProneness / 2000)) {
                const injuryRoll = Math.random();
                let injuryType: string, duration: number;
                if (injuryRoll < 0.6) { injuryType = getRandomItem(["Bruised Ribs", "Minor Strain"]); duration = getRandomValueInRange(1, 3); } 
                else if (injuryRoll < 0.9) { injuryType = getRandomItem(["Sprained Ankle", "Mild Concussion"]); duration = getRandomValueInRange(4, 8); } 
                else { injuryType = getRandomItem(["Broken Arm", "Torn ACL"]); duration = getRandomValueInRange(10, 24); }
                if (!gameState.injuries.some(i => i.playerId === defender.id)) {
                    gameState.injuries.push({ teamName: defendingTeam.name, playerId: defender.id, injuryType, duration });
                    return { event: { time: eventTime, period: gameState.period, team: defendingTeam.name, description: `INJURY! ${defender.name} is injured. (${injuryType})` }, possessionChange: false, shotOnGoal: false };
                }
            }
        }
        return { event: { time: eventTime, period: gameState.period, team: attackingTeam.name, description: getRandomItem(hitDescriptions) }, possessionChange: false, shotOnGoal: false };
    } else if (roll < (cumulativeProb += puckMovementProbPerTick)) {
        const player1 = selectPlayerWeighted(attackingSkaters, p => (p.attributes as SkaterAttributes).puckHandling);
        if (!player1) return { event: null, possessionChange: false, shotOnGoal: false };
        const movementType = Math.random();
        const player1Modifiers = getRoleModifiers(player1);
        if (movementType < 0.6 * player1Modifiers.passTendency) {
            const player2 = selectPlayerWeighted(attackingSkaters.filter(p => p.id !== player1.id), p => (p.attributes as SkaterAttributes).gettingOpen);
            if (player2) return { event: { time: eventTime, period: gameState.period, team: attackingTeam.name, description: `${player1.name} passes to ${player2.name}.` }, possessionChange: false, shotOnGoal: false };
        } else {
            possessionChange = true;
            return { event: { time: eventTime, period: gameState.period, team: attackingTeam.name, description: `${player1.name} turns over the puck.` }, possessionChange, shotOnGoal: false };
        }
    }
    return { event: null, possessionChange: false, shotOnGoal: false };
};

export const simulateTick = (gameState: GameState, userTeam: Team, opponentTeam: Team, isBigGame?: boolean): GameState => {
    let newGameState = { ...gameState };
    newGameState.time += 1;

    if (newGameState.powerPlayState.isActive) {
        newGameState.powerPlayState.timeLeft -= 1;
        if (newGameState.powerPlayState.timeLeft <= 0) {
            newGameState.gameLog = [{ time: formatTime(newGameState.time), period: newGameState.period, team: "System", description: "Power play has expired." }, ...newGameState.gameLog];
            newGameState.powerPlayState = { isActive: false, teamOnPowerPlay: null, timeLeft: 0 };
        }
    }

    if (newGameState.possessionHolder === null) {
        newGameState.possessionHolder = determineFaceoffWinner(userTeam, opponentTeam);
    }

    const { event: newEvent, possessionChange, shotOnGoal } = generateGameEvent(newGameState, userTeam, opponentTeam, isBigGame);
    if (shotOnGoal) {
        const attackingTeamName = newGameState.possessionHolder === userTeam.id ? userTeam.name : opponentTeam.name;
        if (attackingTeamName === userTeam.name) newGameState.userShots++;
        else newGameState.opponentShots++;
    }

    if (newEvent) {
        newGameState.gameLog = [newEvent, ...newGameState.gameLog];
        if (possessionChange) newGameState.possessionHolder = null;
        if (newEvent.description.startsWith('GOAL!')) {
            if (newEvent.team === userTeam.name) newGameState.userScore++;
            else newGameState.opponentScore++;
            if (newGameState.powerPlayState.isActive && newGameState.powerPlayState.teamOnPowerPlay === newEvent.team) {
                newGameState.gameLog = [{ time: newEvent.time, period: newEvent.period, team: "System", description: "Power play ended due to a goal." }, ...newGameState.gameLog];
                newGameState.powerPlayState = { isActive: false, teamOnPowerPlay: null, timeLeft: 0 };
            }
        }
        if (newEvent.description.startsWith('PENALTY!')) {
            const teamOnPowerPlay = newEvent.team === userTeam.name ? opponentTeam.name : userTeam.name;
            newGameState.powerPlayState = { isActive: true, teamOnPowerPlay: teamOnPowerPlay, timeLeft: 120 };
            newGameState.gameLog = [{ time: newEvent.time, period: newEvent.period, team: "System", description: `${teamOnPowerPlay} is now on the power play.` }, ...newGameState.gameLog];
        }
    }

    if (newGameState.time >= 1200) {
        newGameState.isPaused = true;
        if (newGameState.period === 3) newGameState.isGameOver = true;
    }

    return newGameState;
};

export const simulateFullGame = (homeTeam: Team, awayTeam: Team, isBigGame?: boolean): GameState => {
    let gameState: GameState = {
        userScore: 0, opponentScore: 0, userShots: 0, opponentShots: 0, period: 1, time: 0,
        gameLog: [], isGameOver: false, isPaused: false, injuries: [], possessionHolder: null,
        powerPlayState: { isActive: false, teamOnPowerPlay: null, timeLeft: 0 },
        skaterStats: [], goalieStats: [],
    };

    let currentHomeTeam = JSON.parse(JSON.stringify(homeTeam));
    let currentAwayTeam = JSON.parse(JSON.stringify(awayTeam));

    currentHomeTeam.lineup = populateLineup(currentHomeTeam.roster);
    currentAwayTeam.lineup = populateLineup(currentAwayTeam.roster);

    for (let p = 1; p <= 3; p++) {
        gameState.period = p;
        gameState.time = 0;
        gameState.possessionHolder = determineFaceoffWinner(currentHomeTeam, currentAwayTeam);
        gameState.gameLog.unshift({ time: "20:00", period: p, team: "System", description: `Start of Period ${p}.` });

        if (p > 1) {
            const scoreDifferenceHomeVsAway = gameState.userScore - gameState.opponentScore;
            currentHomeTeam = aiMakeAdjustments(currentHomeTeam, currentAwayTeam, scoreDifferenceHomeVsAway);
            currentAwayTeam = aiMakeAdjustments(currentAwayTeam, currentHomeTeam, -scoreDifferenceHomeVsAway);
        }

        for (let t = 0; t < 1200; t++) {
            gameState = simulateTick(gameState, currentHomeTeam, currentAwayTeam, isBigGame);
        }
    }

    gameState.isGameOver = true;
    gameState.isPaused = true;

    gameState.goalieStats.forEach(stat => {
        if (stat.goalsAgainst === 0 && stat.shotsAgainst > 0) stat.shutout = true;
    });

    return gameState;
};

export const simulateOvertime = (gameState: GameState, homeTeam: Team, awayTeam: Team, isBigGame?: boolean): GameState => {
    let otGameState = { ...gameState };
    otGameState.period++;
    otGameState.time = 0;
    otGameState.isPaused = false;
    otGameState.isGameOver = false;
    otGameState.gameLog.unshift({ time: "20:00", period: otGameState.period, team: "System", description: `Start of Overtime Period.` });

    const initialHomeScore = otGameState.userScore;
    const initialAwayScore = otGameState.opponentScore;

    for (let t = 0; t < 1200 * 5; t++) {
        otGameState = simulateTick(otGameState, homeTeam, awayTeam, isBigGame);
        if (otGameState.userScore !== initialHomeScore || otGameState.opponentScore !== initialAwayScore) break;
    }
    
    otGameState.isGameOver = true;
    otGameState.isPaused = true;
    return otGameState;
};