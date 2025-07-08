import { Team, GameEvent, GameState, CoachingDecision } from '@/types';

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(20 - 1 - mins).padStart(2, '0')}:${String(59 - secs).padStart(2, '0')}`;
};

const generateGameEvent = (time: number, period: number, userTeam: Team, opponentTeam: Team): GameEvent | null => {
    // Lower the probability of an event each second
    if (Math.random() > 0.05) return null;

    const eventTime = formatTime(time);
    const attackingTeam = Math.random() > 0.5 ? userTeam : opponentTeam;
    const defendingTeam = attackingTeam.name === userTeam.name ? opponentTeam : userTeam;

    const attacker = attackingTeam.roster[Math.floor(Math.random() * attackingTeam.roster.length)];
    const defender = defendingTeam.roster[Math.floor(Math.random() * defendingTeam.roster.length)];
    const goalie = defendingTeam.roster.find(p => p.positions.includes('G'));

    const eventType = Math.random();
    if (eventType > 0.8) { // Goal
        return { time: eventTime, period, team: attackingTeam.name, description: `GOAL! ${attacker.name} scores against ${goalie?.name || 'the goalie'}!` };
    } else if (eventType > 0.4) { // Shot
        return { time: eventTime, period, team: attackingTeam.name, description: `${attacker.name} takes a shot, saved by ${goalie?.name || 'the goalie'}.` };
    } else { // Check
        return { time: eventTime, period, team: attackingTeam.name, description: `${attacker.name} lays a big hit on ${defender.name}.` };
    }
};

const generateCoachingDecision = (): CoachingDecision | null => {
    // Low chance to trigger a decision
    if (Math.random() > 0.01) return null;

    return {
        id: crypto.randomUUID(),
        prompt: "The opponent's top line is creating a lot of pressure. How do you respond?",
        options: [
            { text: "Match with your checking line", effect: { type: 'TACTIC_MODIFIER', value: 0.1, duration: 120 } },
            { text: "Tell your players to be more physical", effect: { type: 'MORALE_BOOST', value: 0.05, duration: 180 } },
            { text: "Stick to the game plan", effect: { type: 'FATIGUE_REDUCTION', value: 0, duration: 0 } },
        ]
    };
};

export const simulateTick = (gameState: GameState, userTeam: Team, opponentTeam: Team) => {
    const newGameState = { ...gameState };
    let newEvent: GameEvent | null = null;
    let newDecision: CoachingDecision | null = null;

    newGameState.time += 1;

    // Only generate events if not paused for a decision
    if (!newGameState.currentDecision) {
        newEvent = generateGameEvent(newGameState.time, newGameState.period, userTeam, opponentTeam);
        if (newEvent) {
            newGameState.gameLog = [newEvent, ...newGameState.gameLog];
            if (newEvent.description.startsWith('GOAL!')) {
                if (newEvent.team === userTeam.name) newGameState.userScore++;
                else newGameState.opponentScore++;
                // Higher chance of decision after a goal
                if (Math.random() < 0.5) {
                    newDecision = generateCoachingDecision();
                }
            }
        }

        // Check for a random decision trigger if no event happened
        if (!newEvent && !newDecision) {
            newDecision = generateCoachingDecision();
        }
    }
    
    if (newDecision) {
        newGameState.currentDecision = newDecision;
        newGameState.isPaused = true;
    }

    if (newGameState.time >= 1200) { // End of period (20 mins * 60 secs)
        newGameState.isPaused = true;
        if (newGameState.period === 3) {
            newGameState.isGameOver = true;
        }
    }

    return newGameState;
};