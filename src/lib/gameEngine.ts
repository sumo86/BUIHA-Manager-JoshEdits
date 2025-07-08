import { Team, GameEvent, GameState, CoachingDecision } from '@/types';
import { coachingDecisions, CoachingDecisionTrigger } from '@/data/coachingDecisions';

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(20 - 1 - mins).padStart(2, '0')}:${String(59 - secs).padStart(2, '0')}`;
};

const generateGameEvent = (time: number, period: number, userTeam: Team, opponentTeam: Team): GameEvent | null => {
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

const getContexts = (gameState: GameState, userTeam: Team, opponentTeam: Team): Set<CoachingDecisionTrigger> => {
    const { userScore, opponentScore, gameLog } = gameState;
    const contexts: Set<CoachingDecisionTrigger> = new Set(['ANY']);

    // Score context
    if (userScore > opponentScore) contexts.add('USER_LEADING');
    else if (userScore < opponentScore) contexts.add('USER_TRAILING');
    else contexts.add('TIED_GAME');

    // Recent event context
    const lastEvent = gameLog[0];
    if (lastEvent && lastEvent.description.startsWith('GOAL!')) {
        if (lastEvent.team === userTeam.name) contexts.add('RECENT_GOAL_FOR');
        else contexts.add('RECENT_GOAL_AGAINST');
    }

    // Pressure/Stall context
    const recentEvents = gameLog.slice(0, 4);
    if (recentEvents.length === 4) {
        if (recentEvents.every(e => e.team === opponentTeam.name)) {
            contexts.add('OPPONENT_PRESSURE');
        }
        if (!recentEvents.some(e => e.team === userTeam.name && e.description.includes('shot'))) {
            contexts.add('OFFENSIVE_STALL');
        }
    }
    return contexts;
}

const generateCoachingDecision = (gameState: GameState, userTeam: Team, opponentTeam: Team): CoachingDecision | null => {
    // Low chance to trigger a decision on any given tick
    if (Math.random() > 0.998) return null; // Adjusted for ~2-3 decisions per period

    const contexts = getContexts(gameState, userTeam, opponentTeam);
    const possibleDecisions = coachingDecisions.filter(d => contexts.has(d.trigger));

    if (possibleDecisions.length === 0) return null;

    const decisionTemplate = possibleDecisions[Math.floor(Math.random() * possibleDecisions.length)];

    return {
        id: crypto.randomUUID(),
        prompt: decisionTemplate.prompt,
        options: decisionTemplate.options,
    };
};

export const simulateTick = (gameState: GameState, userTeam: Team, opponentTeam: Team) => {
    const newGameState = { ...gameState };
    let newEvent: GameEvent | null = null;
    let newDecision: CoachingDecision | null = null;

    newGameState.time += 1;

    // Only process game logic if not paused for a decision
    if (!newGameState.currentDecision) {
        newEvent = generateGameEvent(newGameState.time, newGameState.period, userTeam, opponentTeam);
        if (newEvent) {
            newGameState.gameLog = [newEvent, ...newGameState.gameLog];
            if (newEvent.description.startsWith('GOAL!')) {
                if (newEvent.team === userTeam.name) newGameState.userScore++;
                else newGameState.opponentScore++;
            }
        }

        // Now, check if a decision should be triggered based on the new state
        newDecision = generateCoachingDecision(newGameState, userTeam, opponentTeam);
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