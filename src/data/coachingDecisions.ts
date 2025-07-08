import { CoachingDecision } from '@/types';

export type CoachingDecisionTrigger = 
  | 'ANY'
  | 'USER_LEADING'
  | 'USER_TRAILING'
  | 'TIED_GAME'
  | 'RECENT_GOAL_FOR'
  | 'RECENT_GOAL_AGAINST'
  | 'OPPONENT_PRESSURE'
  | 'OFFENSIVE_STALL'
  | 'LATE_GAME_TIED';

type DecisionOption = CoachingDecision['options'][0];

export type CoachingDecisionTemplate = {
  trigger: CoachingDecisionTrigger;
  prompt: string;
  options: [DecisionOption, DecisionOption, DecisionOption];
};

const genericEffect = { type: 'TACTIC_MODIFIER', value: 0, duration: 0 } as const;

export const coachingDecisionsMap: Record<CoachingDecisionTrigger, CoachingDecisionTemplate[]> = {
  ANY: [
    {
      trigger: 'ANY',
      prompt: "The pace has slowed down. What's the message to the bench?",
      options: [
        { text: "Let's pick up the pace!", effect: genericEffect },
        { text: "Stay patient, wait for opportunities.", effect: genericEffect },
        { text: "Focus on puck possession.", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "Refereeing seems biased, and your players are getting frustrated.",
      options: [
        { text: "Tell them to keep their heads", effect: genericEffect },
        { text: "Ask the ref for clarification (respectfully)", effect: genericEffect },
        { text: "Refocus the team on execution", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "Your first line looks exhausted.",
      options: [
        { text: "Shorten the bench and rotate faster", effect: genericEffect },
        { text: "Double-shift your second line instead", effect: genericEffect },
        { text: "Balance shifts more evenly", effect: genericEffect },
      ]
    },
  ],
  OPPONENT_PRESSURE: [
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "Your team is struggling to break out of the defensive zone.",
      options: [
        { text: "Adjust breakout to a safer option.", effect: genericEffect },
        { text: "Tell defensemen to rim it more aggressively.", effect: genericEffect },
        { text: "Tell forwards to play higher in the zone.", effect: genericEffect },
      ]
    },
  ],
  OFFENSIVE_STALL: [
    {
      trigger: 'OFFENSIVE_STALL',
      prompt: "You haven't generated a good scoring chance in a while. How do you create more offense?",
      options: [
        { text: "Activate the defensemen in the offensive zone.", effect: genericEffect },
        { text: "Encourage more shots from the point.", effect: genericEffect },
        { text: "Tell forwards to crash the net.", effect: genericEffect },
      ]
    },
  ],
  RECENT_GOAL_AGAINST: [
    {
      trigger: 'RECENT_GOAL_AGAINST',
      prompt: "The opponent just scored. How do you respond?",
      options: [
        { text: "Shorten the bench, get top players out.", effect: genericEffect },
        { text: "Roll the lines, calm things down.", effect: genericEffect },
        { text: "Tell the team to answer with a physical shift.", effect: genericEffect },
      ]
    },
  ],
  RECENT_GOAL_FOR: [
    {
      trigger: 'RECENT_GOAL_FOR',
      prompt: "You just scored a big goal! What's next?",
      options: [
        { text: "Keep the pressure on, go for another.", effect: genericEffect },
        { text: "Get the checking line out to lock it down.", effect: genericEffect },
        { text: "Let the players ride the momentum.", effect: genericEffect },
      ]
    },
  ],
  USER_LEADING: [
    {
      trigger: 'USER_LEADING',
      prompt: "You have the lead late in the period. How do you manage the clock?",
      options: [
        { text: "Play a conservative trap system.", effect: genericEffect },
        { text: "Keep attacking, the best defense is a good offense.", effect: genericEffect },
        { text: "Focus on short, smart shifts.", effect: genericEffect },
      ]
    },
  ],
  USER_TRAILING: [
    {
      trigger: 'USER_TRAILING',
      prompt: "You're trailing. How do you generate a comeback?",
      options: [
        { text: "Pull the goalie early if we get possession.", effect: genericEffect },
        { text: "Open up the offense, take more risks.", effect: genericEffect },
        { text: "Focus on winning the next faceoff and setting up a play.", effect: genericEffect },
      ]
    },
  ],
  TIED_GAME: [
    {
      trigger: 'TIED_GAME',
      prompt: "It's a tight, tied game. What's your strategic focus?",
      options: [
        { text: "Prioritize defense, don't make the first mistake.", effect: genericEffect },
        { text: "Try to exploit their weaker defensive pairing.", effect: genericEffect },
        { text: "Emphasize special teams performance.", effect: genericEffect },
      ]
    },
  ],
  LATE_GAME_TIED: [
    {
      trigger: 'LATE_GAME_TIED',
      prompt: "The game is tied with 2 minutes left.",
      options: [
        { text: "Play it safe, go to overtime", effect: genericEffect },
        { text: "Push your top line, go for the win", effect: genericEffect },
        { text: "Mix lines to surprise them", effect: genericEffect },
      ]
    },
  ],
};