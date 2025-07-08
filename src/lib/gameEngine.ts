import { Team, GameEvent } from '@/types';

const generateRandomEvent = (period: number, userTeam: Team, opponentTeam: Team): GameEvent => {
    const minute = Math.floor(Math.random() * 20);
    const second = Math.floor(Math.random() * 60);
    const time = `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

    const scoringTeam = Math.random() > 0.5 ? userTeam : opponentTeam;
    const defendingTeam = scoringTeam.name === userTeam.name ? opponentTeam : userTeam;

    const scorer = scoringTeam.roster[Math.floor(Math.random() * scoringTeam.roster.length)];
    const goalie = defendingTeam.roster.find(p => p.positions.includes('G'));

    const eventType = Math.random();
    if (eventType > 0.8) { // Goal
        return {
            time,
            period,
            team: scoringTeam.name,
            description: `GOAL! ${scorer.name} scores against ${goalie?.name || 'the goalie'}!`,
        };
    } else if (eventType > 0.5) { // Shot
        return {
            time,
            period,
            team: scoringTeam.name,
            description: `${scorer.name} takes a shot, saved by ${goalie?.name || 'the goalie'}.`,
        };
    } else { // Check
        const checkingPlayer = scoringTeam.roster[Math.floor(Math.random() * scoringTeam.roster.length)];
        const checkedPlayer = defendingTeam.roster[Math.floor(Math.random() * defendingTeam.roster.length)];
        return {
            time,
            period,
            team: scoringTeam.name,
            description: `${checkingPlayer.name} lays a big hit on ${checkedPlayer.name}.`,
        };
    }
};

export const simulatePeriod = (period: number, userTeam: Team, opponentTeam: Team) => {
    const events: GameEvent[] = [];
    let userScoreChange = 0;
    let opponentScoreChange = 0;

    const numberOfEvents = Math.floor(Math.random() * 5) + 3; // 3-7 events per period

    for (let i = 0; i < numberOfEvents; i++) {
        const event = generateRandomEvent(period, userTeam, opponentTeam);
        events.push(event);
        if (event.description.startsWith('GOAL!')) {
            if (event.team === userTeam.name) {
                userScoreChange++;
            } else {
                opponentScoreChange++;
            }
        }
    }
    
    events.sort((a, b) => a.time.localeCompare(b.time));

    return { events, userScoreChange, opponentScoreChange };
};