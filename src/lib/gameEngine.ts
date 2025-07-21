import { Team, GameEvent, GameState, SkaterAttributes, GoalieAttributes, Player } from '@/types';
import { tactics } from '@/data/tactics';
import { roles, Role } from '@/data/roles';
import { calculateTacticSuitability } from '@/lib/tactics';
import { aiMakeAdjustments } from '@/lib/aiManager';
import { populateLineup } from '@/lib/lineupUtils';

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomValueInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const POWER_PLAY_MODIFIER = 1.3; // 30% boost on power play

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
    // These values represent the target average goals per game (GPG).
    // This function returns the target GPG, which will then be converted to a per-tick probability.
    if (isBigGame) {
        return getRandomValueInRange(2, 4); // Nationals: 2-4 GPG
    }
    if (leagueDivision.includes('Non-Checking 3')) return getRandomValueInRange(11, 13); 
    if (leagueDivision.includes('Non-Checking 2')) return getRandomValueInRange(16, 22);
    if (leagueDivision.includes('Non-Checking 1')) return getRandomValueInRange(15, 20);
    if (leagueDivision.includes('Checking 2')) return getRandomValueInRange(14, 19);
    if (leagueDivision.includes('Checking 1')) return getRandomValueInRange(12, 17);
    return getRandomValueInRange(15, 20); // Default
};

const getPenaltyFactor = (): number => {
    return getRandomValueInRange(4, 8); // Target 4-8 penalties per game
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

    // Ensure activeInstructions is an array, even if it's undefined or null
    const activeInstructions = player.activeInstructions || [];

    if (activeInstructions.length === 0) {
        return modifiers;
    }

    for (const instruction of activeInstructions) {
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

const getSkaterOffensiveRating = (player: Player, isBigGame?: boolean): number => {
    if (player.positions.includes('G')) return 0;
    const attrs = player.attributes as SkaterAttributes;
    const instructionMods = getInstructionModifiers(player);
    const baseRating = (attrs.shootingAccuracy + attrs.shootingRange + attrs.offensiveRead + attrs.gettingOpen + attrs.passing + attrs.puckhandling + (attrs.intelligence / 2)) / 6.5;
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
        if (random < wp.weight) {
            return wp.player;
        }
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
        const centers = team.lineup.forwards.c
            .map(id => team.roster.find(p => p.id === id))
            .filter((p): p is Player => !!p);
        if (centers.length === 0) return 5; // Low default if no centers
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

    let attackingTeam: Team;
    if (gameState.possessionHolder) {
        attackingTeam = gameState.possessionHolder === userTeam.id ? userTeam : opponentTeam;
    } else {
        attackingTeam = Math.random() > 0.5 ? userTeam : opponentTeam;
    }
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
    
    // Normalize ratings to a -0.9 to 1 range (assuming 1-20 attributes, 10 is average)
    const offenseFactor = (modifiedAttackRating - 10) / 10;
    const defenseFactor = (modifiedDefenseRating - 10) / 10;
    
    // Base probabilities per tick
    const totalGameTicks = 3600; // 3 periods * 20 mins * 60 seconds
    const baseTargetGPG = getGoalFactor(attackingTeam.leagueDivision, isBigGame || false);
    let baseGoalProbPerTick = baseTargetGPG / totalGameTicks;

    // Adjust goal probability based on team offense/defense factors
    let actualGoalProbPerTick = baseGoalProbPerTick * (1 + offenseFactor * 0.5) / (1 + defenseFactor * 0.5);
    actualGoalProbPerTick = Math.max(0, Math.min(1, actualGoalProbPerTick)); // Clamp between 0 and 1

    // Calculate shot success probability based on goalie ability
    const goalieFactor = (defendingGoalieAbility - 10) / 10;
    const shotSuccessProb = Math.max(0.05, Math.min(0.95, 0.5 - (goalieFactor * 0.5)));
    
    // Probability of a saved shot (if a shot occurs but isn't a goal)
    // P(Saved Shot) = P(Goal) * (1/ShotSuccessProb - 1)
    let actualSavedShotProbPerTick = actualGoalProbPerTick * (1 / shotSuccessProb - 1);
    actualSavedShotProbPerTick = Math.max(0, actualSavedShotProbPerTick); // Ensure non-negative

    // Other event probabilities (fixed per tick)
    const baseTargetPenalties = getPenaltyFactor();
    const penaltyProbPerTick = baseTargetPenalties / totalGameTicks; // Target 4-8 penalties per game
    const hitProbPerTick = 25.0 / totalGameTicks; // ~25 hits per game
    const puckMovementProbPerTick = 100.0 / totalGameTicks; // ~100 puck movements/turnovers per game

    // Sum of all event probabilities
    const totalEventProb = actualGoalProbPerTick + actualSavedShotProbPerTick + penaltyProbPerTick + hitProbPerTick + puckMovementProbPerTick;

    const roll = Math.random();
    let cumulativeProb = 0;

    // Determine event type based on weighted probabilities
    if (roll < (cumulativeProb += actualGoalProbPerTick)) { // Goal event
        possessionChange = true; // Stoppage of play
        shotOnGoal = true;
        const attacker = selectPlayerWeighted(attackingSkaters, p => Math.pow(getSkaterOffensiveRating(p, isBigGame), 4) * getRoleModifiers(p).shootTendency);
        if (!attacker) return { event: null, possessionChange: true, shotOnGoal };

        // Update goalie stats for goal against
        if (defendingGoalie) {
            let goalieStat = gameState.goalieStats.find(s => s.playerId === defendingGoalie.id);
            if (goalieStat) {
                goalieStat.goalsAgainst++;
                goalieStat.shotsAgainst++;
            } else {
                gameState.goalieStats.push({ playerId: defendingGoalie.id, goalsAgainst: 1, shotsAgainst: 1, saves: 0, shutout: false });
            }
        }

        const potentialAssisters = attackingSkaters.filter(p => p.id !== attacker.id);
        let assists: Player[] = [];
        
        // First assist
        if (potentialAssisters.length > 0 && Math.random() < 0.85) { // 85% chance of a first assist
            const assist1 = selectPlayerWeighted(potentialAssisters, p => Math.pow((p.attributes as SkaterAttributes).passing, 4) * getRoleModifiers(p).passTendency);
            if (assist1) {
                assists.push(assist1);
                
                // Second assist
                const potentialSecondAssisters = potentialAssisters.filter(p => p.id !== assist1.id);
                if (potentialSecondAssisters.length > 0 && Math.random() < 0.6) { // 60% chance of a second assist if there was a first
                    const assist2 = selectPlayerWeighted(potentialSecondAssisters, p => Math.pow((p.attributes as SkaterAttributes).passing, 4) * getRoleModifiers(p).passTendency);
                    if (assist2) {
                        assists.push(assist2);
                    }
                }
            }
        }

        const assistText = assists.length > 0 ? `Assists: ${assists.map(a => a.name).join(', ')}` : "Unassisted";

        // Record goal scorer
        let attackerStat = gameState.skaterStats.find(s => s.playerId === attacker.id);
        if (attackerStat) {
            attackerStat.goals++;
            attackerStat.points++;
        } else {
            gameState.skaterStats.push({ playerId: attacker.id, goals: 1, assists: 0, points: 1, penaltyMinutes: 0 });
        }

        // Record assists
        assists.forEach(p => {
            let assisterStat = gameState.skaterStats.find(s => s.playerId === p.id);
            if (assisterStat) {
                assisterStat.assists++;
                assisterStat.points++;
            } else {
                gameState.skaterStats.push({ playerId: p.id, goals: 0, assists: 1, points: 1, penaltyMinutes: 0 });
            }
        });

        return { event: { time: eventTime, period: gameState.period, team: attackingTeam.name, description: `GOAL! ${attacker.name} scores. ${assistText}` }, possessionChange, shotOnGoal };
    } else if (roll < (cumulativeProb += actualSavedShotProbPerTick)) { // Saved shot event
        possessionChange = true; // Stoppage of play
        shotOnGoal = true;
        const attacker = selectPlayerWeighted(attackingSkaters, p => getSkaterOffensiveRating(p, isBigGame) * getRoleModifiers(p).shootTendency);
        if (!attacker) return { event: null, possessionChange: true, shotOnGoal };
        
        // Record shot on goal (saved)
        if (defendingGoalie) {
            let goalieStat = gameState.goalieStats.find(s => s.playerId === defendingGoalie.id);
            if (goalieStat) {
                goalieStat.shotsAgainst++;
                goalieStat.saves++;
            } else {
                gameState.goalieStats.push({ playerId: defendingGoalie.id, goalsAgainst: 0, shotsAgainst: 1, saves: 1, shutout: false });
            }
        }

        return { event: { time: eventTime, period: gameState.period, team: attackingTeam.name, description: `${attacker.name} takes a shot, saved by ${defendingGoalie?.name || 'the goalie'}.` }, possessionChange, shotOnGoal };
    } else if (roll < (cumulativeProb += penaltyProbPerTick)) { // Penalty event
        possessionChange = true; // Stoppage of play
        const penaltyTeam = Math.random() > 0.5 ? userTeam : opponentTeam;
        
        const eligiblePlayers = penaltyTeam.roster.filter(p => !p.positions.includes('G'));
        if (eligiblePlayers.length === 0) {
            return { event: null, possessionChange: false, shotOnGoal: false }; 
        }

        // Select player weighted by their tendency to take penalties
        const player = selectPlayerWeighted(eligiblePlayers, p => {
            const instructionMods = getInstructionModifiers(p);
            const roleMods = getRoleModifiers(p);
            const aggression = (p.attributes as SkaterAttributes).aggression || 10;
            const sportsmanship = (p.attributes as SkaterAttributes).sportsmanship || 10;
            
            // Scale aggression and sportsmanship to influence penalty weight
            // Aggression: 1 -> 0.5, 10 -> 1, 20 -> 1.5
            // Sportsmanship: 1 -> 1.5, 10 -> 1, 20 -> 0.5 (lower sportsmanship means higher weight)
            const aggressionFactor = 0.5 + (aggression - 1) / 19 * 1; 
            const sportsmanshipFactor = 1.5 - (sportsmanship - 1) / 19 * 1; 

            const penaltyWeight = aggressionFactor * sportsmanshipFactor * instructionMods.penaltyChance * roleMods.penaltyTendency;
            return Math.max(0.01, penaltyWeight); // Ensure a minimum weight to allow all players a chance
        });
        
        if (!player) {
            // Fallback if no suitable player is found (e.g., all goalies, or weights are zero)
            // This should be rare with the filter above, but good for robustness.
            return { event: null, possessionChange: false, shotOnGoal: false };
        }

        // If a player is selected, a penalty occurs
        const infraction = getRandomItem(infractions);
        
        // Record penalty
        let playerStat = gameState.skaterStats.find(s => s.playerId === player.id);
        if (playerStat) {
            playerStat.penaltyMinutes += 2;
        } else {
            gameState.skaterStats.push({ playerId: player.id, goals: 0, assists: 0, points: 0, penaltyMinutes: 2 });
        }

        return { event: { time: eventTime, period: gameState.period, team: penaltyTeam.name, description: `PENALTY! ${player.name} gets 2 minutes for ${infraction}.` }, possessionChange, shotOnGoal: false };
    } else if (roll < (cumulativeProb += hitProbPerTick)) { // Hit event
        const attacker = selectPlayerWeighted(attackingSkaters, p => ((p.attributes as SkaterAttributes).hitting + (p.attributes as SkaterAttributes).strength) * getRoleModifiers(p).hitTendency);
        const defender = selectPlayerWeighted(defendingSkaters, p => (p.attributes as SkaterAttributes).balance + (p.attributes as SkaterAttributes).strength);
        if (!attacker || !defender) return { event: null, possessionChange: false, shotOnGoal: false };
        const hitDescriptions = [`${attacker.name} lays a big hit on ${defender.name}.`, `${attacker.name} delivers a crushing check to ${defender.name}.`, `${defender.name} is rocked by a huge hit from ${attacker.name}.`, `${attacker.name} finishes his check on ${defender.name} with authority.`, `${defender.name} gets stood up at the blue line by ${attacker.name}.`];
        
        // Injury check for hit
        if (defender.healthStatus === 'Healthy') {
            const injuryProneness = (defender.attributes as SkaterAttributes).injuryProneness || 10;
            if (Math.random() < 0.01 + (injuryProneness / 2000)) { // Base 1% chance + proneness
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
    } else if (roll < (cumulativeProb += puckMovementProbPerTick)) { // Puck movement / turnover event
        const player1 = selectPlayerWeighted(attackingSkaters, p => (p.attributes as SkaterAttributes).puckhandling);
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

    // Handle Power Play Countdown
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
        if (possessionChange) {
            newGameState.possessionHolder = null;
        }
        if (newEvent.description.startsWith('GOAL!')) {
            if (newEvent.team === userTeam.name) newGameState.userScore++;
            else newGameState.opponentScore++;

            // End power play on goal
            if (newGameState.powerPlayState.isActive && newGameState.powerPlayState.teamOnPowerPlay === newEvent.team) {
                newGameState.gameLog = [{ time: newEvent.time, period: newEvent.period, team: "System", description: "Power play ended due to a goal." }, ...newGameState.gameLog];
                newGameState.powerPlayState = { isActive: false, teamOnPowerPlay: null, timeLeft: 0 };
            }
        }
        if (newEvent.description.startsWith('PENALTY!')) {
            const teamOnPowerPlay = newEvent.team === userTeam.name ? opponentTeam.name : userTeam.name;
            newGameState.powerPlayState = {
                isActive: true,
                teamOnPowerPlay: teamOnPowerPlay,
                timeLeft: 120, // 2 minutes = 120 ticks
            };
            newGameState.gameLog = [{ time: newEvent.time, period: newEvent.period, team: "System", description: `${teamOnPowerPlay} is now on the power play.` }, ...newGameState.gameLog];
        }
        // Injury check for hit events is now handled directly within generateGameEvent
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
        userShots: 0,
        opponentShots: 0,
        period: 1,
        time: 0,
        gameLog: [],
        isGameOver: false,
        isPaused: false,
        injuries: [],
        possessionHolder: null,
        powerPlayState: {
            isActive: false,
            teamOnPowerPlay: null,
            timeLeft: 0,
        },
        skaterStats: [], // Initialize skaterStats
        goalieStats: [], // Initialize goalieStats
    };

    let currentHomeTeam = JSON.parse(JSON.stringify(homeTeam));
    let currentAwayTeam = JSON.parse(JSON.stringify(awayTeam));

    // Ensure lineups are populated
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

    // Set shutout status for goalies
    gameState.goalieStats.forEach(stat => {
        if (stat.goalsAgainst === 0 && stat.shotsAgainst > 0) {
            stat.shutout = true;
        }
    });

    return gameState;
};

export const simulateOvertime = (gameState: GameState, homeTeam: Team, awayTeam: Team, isBigGame?: boolean): GameState => {
    let otGameState = { ...gameState };
    otGameState.period++; // e.g., Period 4
    otGameState.time = 0;
    otGameState.isPaused = false;
    otGameState.isGameOver = false;
    otGameState.gameLog.unshift({ time: "20:00", period: otGameState.period, team: "System", description: `Start of Overtime Period.` });

    const initialHomeScore = otGameState.userScore;
    const initialAwayScore = otGameState.opponentScore;

    // Simulate until a goal is scored (with a safety break)
    for (let t = 0; t < 1200 * 5; t++) { // Safety break after 5 OT periods
        otGameState = simulateTick(otGameState, homeTeam, awayTeam, isBigGame);
        if (otGameState.userScore !== initialHomeScore || otGameState.opponentScore !== initialAwayScore) {
            break; // Goal scored
        }
    }
    
    otGameState.isGameOver = true;
    otGameState.isPaused = true;
    return otGameState;
};