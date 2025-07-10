import { Team, GameEvent, GameState, SkaterAttributes, GoalieAttributes, Player } from '@/types';

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

// Helper to get a player's offensive rating
const getSkaterOffensiveRating = (player: Player): number => {
    if (player.positions.includes('G')) return 0;
    const attrs = player.attributes as SkaterAttributes;
    return (attrs.shootingAccuracy + attrs.shootingRange + attrs.offensiveRead + attrs.gettingOpen + attrs.passing + attrs.puckhandling) / 6;
};

// Helper to get a player's defensive rating
const getSkaterDefensiveRating = (player: Player): number => {
    if (player.positions.includes('G')) return 0;
    const attrs = player.attributes as SkaterAttributes;
    return (attrs.defensiveRead + attrs.positioning + attrs.stickchecking + attrs.checking + attrs.shotBlocking) / 5;
};

// Helper to get a goalie's rating
const getGoalieRating = (player: Player): number => {
    if (!player.positions.includes('G')) return 0;
    const attrs = player.attributes as GoalieAttributes;
    return (attrs.blocker + attrs.glove + attrs.lowShots + attrs.positioning + attrs.rebound + attrs.recovery + attrs.reflexes) / 7;
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

const generateGameEvent = (time: number, period: number, userTeam: Team, opponentTeam: Team): GameEvent | null => {
    if (Math.random() > 0.05) return null;

    const eventTime = formatTime(time);
    const attackingTeam = Math.random() > 0.5 ? userTeam : opponentTeam;
    const defendingTeam = attackingTeam.name === userTeam.name ? opponentTeam : userTeam;

    const eventType = Math.random();
    const divisionGoalFactor = getGoalFactor(attackingTeam.leagueDivision);

    const attackingSkaters = attackingTeam.roster.filter(p => !p.positions.includes('G'));
    const defendingSkaters = defendingTeam.roster.filter(p => !p.positions.includes('G'));
    const defendingGoalie = defendingTeam.roster.find(p => p.id === defendingTeam.lineup.goalies.starter);

    const avgAttackingOffense = attackingSkaters.length > 0 
        ? attackingSkaters.reduce((sum, p) => sum + getSkaterOffensiveRating(p), 0) / attackingSkaters.length
        : 10;
    
    const avgDefendingDefense = defendingSkaters.length > 0
        ? defendingSkaters.reduce((sum, p) => sum + getSkaterDefensiveRating(p), 0) / defendingSkaters.length
        : 10;
    
    const defendingGoalieAbility = defendingGoalie ? getGoalieRating(defendingGoalie) : 10;

    const offenseFactor = (avgAttackingOffense - 10) / 10;
    const defenseFactor = (avgDefendingDefense - 10) / 10;
    const goalieFactor = (defendingGoalieAbility - 10) / 10;

    const baseProb = 0.1 * divisionGoalFactor;
    let goalProbability = baseProb * (1 + offenseFactor * 1.5 - (defenseFactor * 0.5) - (goalieFactor * 0.5));
    goalProbability = Math.max(0.01, Math.min(0.25, goalProbability));

    if (eventType < goalProbability) {
        const attacker = selectPlayerWeighted(attackingSkaters, p => Math.pow(getSkaterOffensiveRating(p), 4));
        if (!attacker) return null;

        const potentialAssisters = attackingSkaters.filter(p => p.id !== attacker.id);
        let assists: string[] = [];
        
        if (potentialAssisters.length > 0 && Math.random() > 0.2) { 
            const assist1 = selectPlayerWeighted(potentialAssisters, p => Math.pow((p.attributes as SkaterAttributes).passing + (p.attributes as SkaterAttributes).offensiveRead, 4));
            if (assist1) {
                assists.push(assist1.name);
                const remainingAssisters = potentialAssisters.filter(p => p.id !== assist1.id);
                if (remainingAssisters.length > 0 && Math.random() > 0.5) { 
                    const assist2 = selectPlayerWeighted(remainingAssisters, p => Math.pow((p.attributes as SkaterAttributes).passing + (p.attributes as SkaterAttributes).offensiveRead, 4));
                    if (assist2) {
                        assists.push(assist2.name);
                    }
                }
            }
        }

        const assistText = assists.length > 0 ? `Assists: ${assists.join(', ')}` : "Unassisted";
        return { time: eventTime, period, team: attackingTeam.name, description: `GOAL! ${attacker.name} scores. ${assistText}` };
    } 
    else if (eventType > 0.85) {
        const penaltyTeam = Math.random() > 0.5 ? userTeam : opponentTeam;
        const player = penaltyTeam.roster[Math.floor(Math.random() * penaltyTeam.roster.length)];
        const infraction = infractions[Math.floor(Math.random() * infractions.length)];
        return { time: eventTime, period, team: penaltyTeam.name, description: `PENALTY! ${player.name} gets 2 minutes for ${infraction}.` };
    }
    else if (eventType > 0.35) {
        const attacker = selectPlayerWeighted(attackingSkaters, getSkaterOffensiveRating);
        if (!attacker) return null;
        return { time: eventTime, period, team: attackingTeam.name, description: `${attacker.name} takes a shot, saved by ${defendingGoalie?.name || 'the goalie'}.` };
    } 
    else {
        const attacker = selectPlayerWeighted(attackingSkaters, p => (p.attributes as SkaterAttributes).hitting + (p.attributes as SkaterAttributes).strength);
        const defender = selectPlayerWeighted(defendingSkaters, p => (p.attributes as SkaterAttributes).balance + (p.attributes as SkaterAttributes).strength);
        if (!attacker || !defender) return null;
        return { time: eventTime, period, team: attackingTeam.name, description: `${attacker.name} lays a big hit on ${defender.name}.` };
    }
};

export const simulateTick = (gameState: GameState, userTeam: Team, opponentTeam: Team) => {
    const newGameState = { ...gameState };
    newGameState.time += 1;

    const newEvent = generateGameEvent(newGameState.time, newGameState.period, userTeam, opponentTeam);
    if (newEvent) {
        newGameState.gameLog = [newEvent, ...newGameState.gameLog];
        if (newEvent.description.startsWith('GOAL!')) {
            if (newEvent.team === userTeam.name) newGameState.userScore++;
            else newGameState.opponentScore++;
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

export const simulateFullGame = (homeTeam: Team, awayTeam: Team): GameState => {
    let gameState: GameState = {
        userScore: 0,
        opponentScore: 0,
        period: 1,
        time: 0,
        gameLog: [],
        isGameOver: false,
        isPaused: false,
    };

    for (let p = 1; p <= 3; p++) {
        gameState.period = p;
        gameState.time = 0;
        for (let t = 0; t < 1200; t++) {
            gameState = simulateTick(gameState, homeTeam, awayTeam);
        }
    }

    gameState.isGameOver = true;
    gameState.isPaused = true;

    return gameState;
};