import { Team, GameEvent, GameState } from '@/types';

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(20 - 1 - mins).padStart(2, '0')}:${String(59 - secs).padStart(2, '0')}`;
};

const infractions = ["Holding", "Boarding", "Tripping", "Hooking", "Slashing", "Interference", "Roughing"];

const generateGameEvent = (time: number, period: number, userTeam: Team, opponentTeam: Team): GameEvent | null => {
    if (Math.random() > 0.06) return null;

    const eventTime = formatTime(time);
    const attackingTeam = Math.random() > 0.5 ? userTeam : opponentTeam;
    const defendingTeam = attackingTeam.name === userTeam.name ? opponentTeam : userTeam;

    const eventType = Math.random();

    // Goal (10% of events)
    if (eventType > 0.9) {
        const attacker = attackingTeam.roster[Math.floor(Math.random() * attackingTeam.roster.length)];
        
        const potentialAssisters = attackingTeam.roster.filter(p => p.id !== attacker.id && !p.positions.includes('G'));
        let assists: string[] = [];
        if (potentialAssisters.length > 0 && Math.random() > 0.2) { // 80% chance of at least one assist
            const assist1 = potentialAssisters.splice(Math.floor(Math.random() * potentialAssisters.length), 1)[0];
            assists.push(assist1.name);
            if (potentialAssisters.length > 0 && Math.random() > 0.5) { // 50% chance of a second assist
                const assist2 = potentialAssisters.splice(Math.floor(Math.random() * potentialAssisters.length), 1)[0];
                assists.push(assist2.name);
            }
        }

        const assistText = assists.length > 0 ? `Assists: ${assists.join(', ')}` : "Unassisted";

        return {
            time: eventTime,
            period,
            team: attackingTeam.name,
            description: `GOAL! ${attacker.name} scores. ${assistText}`
        };
    } 
    // Penalty (20% of events)
    else if (eventType > 0.7) {
        const penaltyTeam = Math.random() > 0.5 ? userTeam : opponentTeam;
        const player = penaltyTeam.roster[Math.floor(Math.random() * penaltyTeam.roster.length)];
        const infraction = infractions[Math.floor(Math.random() * infractions.length)];
        return {
            time: eventTime,
            period,
            team: penaltyTeam.name,
            description: `PENALTY! ${player.name} gets 2 minutes for ${infraction}.`
        };
    }
    // Shot (40% of events)
    else if (eventType > 0.3) {
        const attacker = attackingTeam.roster[Math.floor(Math.random() * attackingTeam.roster.length)];
        const goalie = defendingTeam.roster.find(p => p.positions.includes('G'));
        return {
            time: eventTime,
            period,
            team: attackingTeam.name,
            description: `${attacker.name} takes a shot, saved by ${goalie?.name || 'the goalie'}.`
        };
    } 
    // Check (30% of events)
    else {
        const attacker = attackingTeam.roster[Math.floor(Math.random() * attackingTeam.roster.length)];
        const defender = defendingTeam.roster[Math.floor(Math.random() * defendingTeam.roster.length)];
        return {
            time: eventTime,
            period,
            team: attackingTeam.name,
            description: `${attacker.name} lays a big hit on ${defender.name}.`
        };
    }
};

export const simulateTick = (gameState: GameState, userTeam: Team, opponentTeam: Team) => {
    const newGameState = { ...gameState };
    let newEvent: GameEvent | null = null;

    newGameState.time += 1;

    newEvent = generateGameEvent(newGameState.time, newGameState.period, userTeam, opponentTeam);
    if (newEvent) {
        newGameState.gameLog = [newEvent, ...newGameState.gameLog];
        if (newEvent.description.startsWith('GOAL!')) {
            if (newEvent.team === userTeam.name) newGameState.userScore++;
            else newGameState.opponentScore++;
        }
    }

    if (newGameState.time >= 1200) { // End of period (20 mins * 60 secs)
        newGameState.isPaused = true;
        if (newGameState.period === 3) {
            newGameState.isGameOver = true;
        }
    }

    return newGameState;
};