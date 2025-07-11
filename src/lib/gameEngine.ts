import { Team, GameEvent, GameState, SkaterAttributes, GoalieAttributes, Player } from '@/types';
import { tactics } from '@/data/tactics';
import { calculateTacticSuitability } from '@/lib/tactics';

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomValueInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(19 - mins).padStart(2, '0')}:${String(59 - secs).padStart(2, '0')}`;
};

const getGoalFactor = (leagueDivision: string): number => {
    if (leagueDivision.includes('Non-Checking 3')) return 1.3;
    if (leagueDivision.includes('Non-Checking 2')) return 1.2;
    if (leagueDivision.includes('Non-Checking 1')) return 1.1;
    if (leagueDivision.includes('Checking 2')) return 1.0;
    if (leagueDivision.includes('Checking 1')) return 0.9;
    return 1.0; // Default
};

const infractions = ["Holding", "Boarding", "Tripping", "Hooking", "Slashing", "Interference", "Roughing"];

const getInstructionModifiers = (player: Player) => {
    const modifiers = {
        offense: 1.0,
        defense: 1.0,
        goalie: 1.0,
        morale: 0,
        penaltyChance: 1.0,
    };

    if (!player.activeInstructions || player.activeInstructions.length === 0) {
        return modifiers;
    }

    for (const instruction of player.activeInstructions) {
        switch (instruction.type) {
            case 'Encourage':
                modifiers.morale += 0.02;
                break;
            case 'Praise':
                modifiers.morale += 0.05;
                break;
            case 'Discipline':
                modifiers.morale -= 0.10;
                break;
            case 'Push Harder':
                modifiers.offense += 0.05;
                modifiers.defense += 0.05;
                modifiers.goalie += 0.05;
                break;
            case 'Calm Down':
                modifiers.penaltyChance *= 0.75; // 25% reduction
                break;
        }
    }
    return modifiers;
};

const getMoraleModifier = (morale: Player['morale'], instructionMoraleMod: number): number => {
    let baseMod = 1.0;
    switch (morale) {
        case 'Happy':
            baseMod = 1.05;
            break;
        case 'Unhappy':
            baseMod = 0.90;
            break;
        case 'Angry':
            baseMod = 0.80;
            break;
    }
    return baseMod + instructionMoraleMod;
};

// Helper to get a player's offensive rating
const getSkaterOffensiveRating = (player: Player, isBigGame?: boolean): number => {
    if (player.positions.includes('G')) return 0;
    const attrs = player.attributes as SkaterAttributes;
    const instructionMods = getInstructionModifiers(player);
    const baseRating = (attrs.shootingAccuracy + attrs.shootingRange + attrs.offensiveRead + attrs.gettingOpen + attrs.passing + attrs.puckhandling + (attrs.intelligence / 2)) / 6.5;
    const moraleMod = getMoraleModifier(player.morale, instructionMods.morale);

    let bigGameMod = 1.0;
    if (isBigGame) {
        const bigGamesAttr = attrs.bigGames || 10;
        bigGameMod = 1 + (bigGamesAttr - 10) / 50; // +/- 20% modifier
    }

    return baseRating * moraleMod * instructionMods.offense * bigGameMod;
};

// Helper to get a player's defensive rating
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

// Helper to get a goalie's rating
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

// Weighted random selection for players
const selectPlayerWeighted = (players: Player[], getWeight: (p: Player) => number): Player | null => {
    const weightedPlayers = players.map(p => ({ player: p, weight: getWeight(p) }));
    const totalWeight = weightedPlayers.reduce((sum, wp) => sum + wp.weight, 0);

    if (totalWeight === 0) return players.length > 0 ? players[0] : null;

    let random = Math.random() * totalWeight;
    for (const wp of weightedPlayers) {
        if (random < wp.weight) {
            return wp.player;
        }
        random -= wp.weight;
    }
    return null; // Should not happen if totalWeight > 0
};

const getTacticalModifier = (attackingTeam: Team, defendingTeam: Team): number => {
    let modifier = 1.0;

    // Get the relevant tactics for a scoring chance
    const attackTacticName = attackingTeam.tactics['Attacking Zone Offence'];
    const defendTacticName = defendingTeam.tactics['Defensive Zone Coverage'];

    const attackTactic = tactics.find(t => t.tactic === attackTacticName && t.category === 'Attacking Zone Offence');
    const defendTactic = tactics.find(t => t.tactic === defendTacticName && t.category === 'Defensive Zone Coverage');

    if (!attackTactic || !defendTactic) {
        return modifier; // Return base modifier if tactics aren't set
    }

    // 1. Tactic vs Tactic Interaction
    if (attackTactic.strongVs === defendTactic.tactic) {
        modifier += 0.075; // 7.5% bonus for a hard counter
    } else if (attackTactic.weakVs === defendTactic.tactic) {
        modifier -= 0.075; // 7.5% penalty for being countered
    }

    // 2. Team Suitability
    const attackSuitability = calculateTacticSuitability(attackTactic, attackingTeam.roster);
    const defendSuitability = calculateTacticSuitability(defendTactic, defendingTeam.roster);

    // Convert suitability score (1-5) to a modifier.
    // A score of 3 is average (0), 5 is excellent (+0.05), 1 is very poor (-0.05)
    const suitabilityToMod = (score: number) => (score - 3) * 0.025;

    modifier += suitabilityToMod(attackSuitability.score);
    modifier -= suitabilityToMod(defendSuitability.score); // Good defensive suitability penalizes the attacker's modifier

    // Clamp the modifier to a reasonable range to prevent extreme results
    return Math.max(0.8, Math.min(1.2, modifier));
};

const generateGameEvent = (time: number, period: number, userTeam: Team, opponentTeam: Team, isBigGame?: boolean): GameEvent | null => {
    if (Math.random() > 0.08) return null; // Increased event frequency slightly

    const eventTime = formatTime(time);
    const attackingTeam = Math.random() > 0.5 ? userTeam : opponentTeam;
    const defendingTeam = attackingTeam.name === userTeam.name ? opponentTeam : userTeam;

    const tacticalModifier = getTacticalModifier(attackingTeam, defendingTeam);

    const eventType = Math.random();
    const divisionGoalFactor = getGoalFactor(attackingTeam.leagueDivision);

    const attackingSkaters = attackingTeam.roster.filter(p => !p.positions.includes('G'));
    const defendingSkaters = defendingTeam.roster.filter(p => !p.positions.includes('G'));
    const defendingGoalie = defendingTeam.roster.find(p => p.id === defendingTeam.lineup.goalies.starter);

    const avgAttackingOffense = attackingSkaters.length > 0 
        ? attackingSkaters.reduce((sum, p) => sum + getSkaterOffensiveRating(p, isBigGame), 0) / attackingSkaters.length
        : 10;
    
    const avgDefendingDefense = defendingSkaters.length > 0
        ? defendingSkaters.reduce((sum, p) => sum + getSkaterDefensiveRating(p, isBigGame), 0) / defendingSkaters.length
        : 10;
    
    let defendingGoalieAbility = defendingGoalie ? getGoalieRating(defendingGoalie, isBigGame) : 10;

    const modifiedAttackRating = avgAttackingOffense * tacticalModifier;
    const modifiedDefenseRating = avgDefendingDefense / tacticalModifier;

    const offenseFactor = (modifiedAttackRating - 10) / 10;
    const defenseFactor = (modifiedDefenseRating - 10) / 10;
    
    // --- GOAL PROBABILITY ---
    const baseProb = 0.1 * divisionGoalFactor;
    let goalProbability = baseProb * (1 + offenseFactor * 1.5 - (defenseFactor * 0.5));
    
    if (eventType < goalProbability) {
        // --- SHOT EVENT ---
        const avgScreening = attackingSkaters.reduce((sum, p) => sum + (p.attributes as SkaterAttributes).screening, 0) / attackingSkaters.length;
        const screeningModifier = 1 - ((avgScreening - 10) / 150); // Max 6.6% debuff
        defendingGoalieAbility *= screeningModifier;
        const goalieFactor = (defendingGoalieAbility - 10) / 10;
        
        const shotSuccessProb = Math.max(0.05, Math.min(0.95, 0.5 - (goalieFactor * 0.5)));
        
        if (Math.random() < shotSuccessProb) {
            // --- GOAL! ---
            const attacker = selectPlayerWeighted(attackingSkaters, p => Math.pow(getSkaterOffensiveRating(p, isBigGame), 4));
            if (!attacker) return null;

            const potentialAssisters = attackingSkaters.filter(p => p.id !== attacker.id);
            let assists: string[] = [];
            
            const passTendency = (attacker.attributes as SkaterAttributes).passShootTendency || 10;
            if (potentialAssisters.length > 0 && Math.random() < (0.3 + passTendency / 25)) { 
                const assist1 = selectPlayerWeighted(potentialAssisters, p => Math.pow((p.attributes as SkaterAttributes).passing + (p.attributes as SkaterAttributes).offensiveRead, 4));
                if (assist1) {
                    assists.push(assist1.name);
                    const remainingAssisters = potentialAssisters.filter(p => p.id !== assist1.id);
                    if (remainingAssisters.length > 0 && Math.random() < (0.2 + passTendency / 30)) { 
                        const assist2 = selectPlayerWeighted(remainingAssisters, p => Math.pow((p.attributes as SkaterAttributes).passing + (p.attributes as SkaterAttributes).offensiveRead, 4));
                        if (assist2) assists.push(assist2.name);
                    }
                }
            }
            const assistText = assists.length > 0 ? `Assists: ${assists.join(', ')}` : "Unassisted";
            return { time: eventTime, period, team: attackingTeam.name, description: `GOAL! ${attacker.name} scores. ${assistText}` };
        } else {
            // --- SAVE ---
            const attacker = selectPlayerWeighted(attackingSkaters, p => getSkaterOffensiveRating(p, isBigGame));
            if (!attacker) return null;
            return { time: eventTime, period, team: attackingTeam.name, description: `${attacker.name} takes a shot, saved by ${defendingGoalie?.name || 'the goalie'}.` };
        }
    } 
    else if (eventType < 0.35) {
        // --- SHOT BLOCK ---
        const avgBravery = defendingSkaters.reduce((sum, p) => sum + (p.attributes as SkaterAttributes).bravery, 0) / defendingSkaters.length;
        const blockChance = (avgBravery - 5) / 100; // Max 15% chance
        if (Math.random() < blockChance) {
            const blocker = selectPlayerWeighted(defendingSkaters, p => (p.attributes as SkaterAttributes).shotBlocking + (p.attributes as SkaterAttributes).bravery);
            if (!blocker) return null;
            return { time: eventTime, period, team: defendingTeam.name, description: `Shot blocked by ${blocker.name}!` };
        }
        return null;
    }
    else if (eventType > 0.90) {
        // --- PENALTY ---
        const penaltyTeam = Math.random() > 0.5 ? userTeam : opponentTeam;
        const player = penaltyTeam.roster[Math.floor(Math.random() * penaltyTeam.roster.length)];
        const instructionMods = getInstructionModifiers(player);
        
        const aggression = (player.attributes as SkaterAttributes).aggression || 10;
        const sportsmanship = (player.attributes as SkaterAttributes).sportsmanship || 10;
        
        const basePenaltyChance = 0.1;
        const personalityModifier = (1 + (aggression - 10) / 20) * (1 - (sportsmanship - 10) / 30);
        const finalPenaltyChance = basePenaltyChance * personalityModifier * instructionMods.penaltyChance;

        if (Math.random() < finalPenaltyChance) {
            const infraction = infractions[Math.floor(Math.random() * infractions.length)];
            return { time: eventTime, period, team: penaltyTeam.name, description: `PENALTY! ${player.name} gets 2 minutes for ${infraction}.` };
        }
        return null;
    }
    else {
        // --- HIT ---
        const attacker = selectPlayerWeighted(attackingSkaters, p => (p.attributes as SkaterAttributes).hitting + (p.attributes as SkaterAttributes).strength);
        const defender = selectPlayerWeighted(defendingSkaters, p => (p.attributes as SkaterAttributes).balance + (p.attributes as SkaterAttributes).strength);
        if (!attacker || !defender) return null;
        return { time: eventTime, period, team: attackingTeam.name, description: `${attacker.name} lays a big hit on ${defender.name}.` };
    }
};

export const simulateTick = (gameState: GameState, userTeam: Team, opponentTeam: Team, isBigGame?: boolean) => {
    const newGameState = { ...gameState };
    newGameState.time += 1;

    // Process and decrement active instructions
    const processInstructions = (team: Team) => {
        team.roster.forEach(player => {
            if (player.activeInstructions && player.activeInstructions.length > 0) {
                player.activeInstructions = player.activeInstructions
                    .map(instr => ({ ...instr, duration: instr.duration - 1 }))
                    .filter(instr => instr.duration > 0);
            }
        });
    };
    processInstructions(userTeam);
    processInstructions(opponentTeam);

    const newEvent = generateGameEvent(newGameState.time, newGameState.period, userTeam, opponentTeam, isBigGame);
    if (newEvent) {
        newGameState.gameLog = [newEvent, ...newGameState.gameLog];
        if (newEvent.description.startsWith('GOAL!')) {
            if (newEvent.team === userTeam.name) newGameState.userScore++;
            else newGameState.opponentScore++;
        }
        // If the event was a hit, check for an injury
        if (newEvent.description.includes('lays a big hit on')) {
            const defenderName = newEvent.description.split('on ')[1].replace('.', '');
            const attackingTeamName = newEvent.team;
            const defendingTeam = attackingTeamName === userTeam.name ? opponentTeam : userTeam;
            const defender = defendingTeam.roster.find(p => p.name === defenderName);

            if (defender && defender.healthStatus === 'Healthy') {
                const injuryProneness = (defender.attributes as SkaterAttributes).injuryProneness || 10;
                const injuryChance = 0.01 + (injuryProneness / 2000); // Base 1% chance on a hit event
                if (Math.random() < injuryChance) {
                    const injuryRoll = Math.random();
                    let injuryType: string;
                    let duration: number;
                    if (injuryRoll < 0.6) {
                        injuryType = getRandomItem(["Bruised Ribs", "Minor Strain", "Day-to-Day"]);
                        duration = getRandomValueInRange(1, 3);
                    } else if (injuryRoll < 0.9) {
                        injuryType = getRandomItem(["Sprained Ankle", "Mild Concussion", "Groin Injury"]);
                        duration = getRandomValueInRange(4, 8);
                    } else {
                        injuryType = getRandomItem(["Broken Arm", "Torn ACL", "Severe Concussion"]);
                        duration = getRandomValueInRange(10, 24);
                    }
                    
                    if (!newGameState.injuries.some(i => i.playerId === defender.id)) {
                        newGameState.injuries.push({
                            teamName: defendingTeam.name,
                            playerId: defender.id,
                            injuryType,
                            duration
                        });
                        const injuryLogEvent: GameEvent = {
                            time: newEvent.time,
                            period: newEvent.period,
                            team: defendingTeam.name,
                            description: `INJURY! ${defender.name} is injured after the hit. (${injuryType})`
                        };
                        newGameState.gameLog = [injuryLogEvent, ...newGameState.gameLog];
                    }
                }
            }
        }
    }

    if (newGameState.time >= 1200) {
        newGameState.isPaused = true;
        if (newGameState.period === 3) {
            newGameState.isGameOver = true;
        }
    }

    return newGameState;
};

export const simulateFullGame = (homeTeam: Team, awayTeam: Team, isBigGame?: boolean): GameState => {
    let gameState: GameState = {
        userScore: 0,
        opponentScore: 0,
        period: 1,
        time: 0,
        gameLog: [],
        isGameOver: false,
        isPaused: false,
        injuries: [],
    };

    for (let p = 1; p <= 3; p++) {
        gameState.period = p;
        gameState.time = 0;
        for (let t = 0; t < 1200; t++) {
            gameState = simulateTick(gameState, homeTeam, awayTeam, isBigGame);
        }
    }

    gameState.isGameOver = true;
    gameState.isPaused = true;

    return gameState;
};