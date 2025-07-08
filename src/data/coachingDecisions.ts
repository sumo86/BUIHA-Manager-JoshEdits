import { CoachingDecision } from '@/types';

export type CoachingDecisionTrigger = 
  | 'ANY'
  | 'USER_LEADING'
  | 'USER_TRAILING'
  | 'TIED_GAME'
  | 'RECENT_GOAL_FOR'
  | 'RECENT_GOAL_AGAINST'
  | 'OPPONENT_PRESSURE'
  | 'OFFENSIVE_STALL';

type DecisionOption = CoachingDecision['options'][0];

export type CoachingDecisionTemplate = {
  trigger: CoachingDecisionTrigger;
  prompt: string;
  options: [DecisionOption, DecisionOption, DecisionOption];
};

const genericEffect = { type: 'TACTIC_MODIFIER', value: 0, duration: 0 } as const;

export const coachingDecisions: CoachingDecisionTemplate[] = [
  // Generic
  {
    trigger: 'ANY',
    prompt: "The pace has slowed down. What's the message to the bench?",
    options: [
      { text: "Let's pick up the pace!", effect: genericEffect },
      { text: "Stay patient, wait for opportunities.", effect: genericEffect },
      { text: "Focus on puck possession.", effect: genericEffect },
    ]
  },
  // User's Example
  {
    trigger: 'OPPONENT_PRESSURE',
    prompt: "Your team is struggling to break out of the defensive zone.",
    options: [
      { text: "Adjust breakout to a safer option.", effect: genericEffect },
      { text: "Tell defensemen to rim it more aggressively.", effect: genericEffect },
      { text: "Tell forwards to play higher in the zone.", effect: genericEffect },
    ]
  },
  // Offensive Stall
  {
    trigger: 'OFFENSIVE_STALL',
    prompt: "You haven't generated a good scoring chance in a while. How do you create more offense?",
    options: [
      { text: "Activate the defensemen in the offensive zone.", effect: genericEffect },
      { text: "Encourage more shots from the point.", effect: genericEffect },
      { text: "Tell forwards to crash the net.", effect: genericEffect },
    ]
  },
  // Recent Goal Against
  {
    trigger: 'RECENT_GOAL_AGAINST',
    prompt: "The opponent just scored. How do you respond?",
    options: [
      { text: "Shorten the bench, get top players out.", effect: genericEffect },
      { text: "Roll the lines, calm things down.", effect: genericEffect },
      { text: "Tell the team to answer with a physical shift.", effect: genericEffect },
    ]
  },
  // Recent Goal For
  {
    trigger: 'RECENT_GOAL_FOR',
    prompt: "You just scored a big goal! What's next?",
    options: [
      { text: "Keep the pressure on, go for another.", effect: genericEffect },
      { text: "Get the checking line out to lock it down.", effect: genericEffect },
      { text: "Let the players ride the momentum.", effect: genericEffect },
    ]
  },
  // User Leading
  {
    trigger: 'USER_LEADING',
    prompt: "You have the lead late in the period. How do you manage the clock?",
    options: [
      { text: "Play a conservative trap system.", effect: genericEffect },
      { text: "Keep attacking, the best defense is a good offense.", effect: genericEffect },
      { text: "Focus on short, smart shifts.", effect: genericEffect },
    ]
  },
  // User Trailing
  {
    trigger: 'USER_TRAILING',
    prompt: "You're trailing. How do you generate a comeback?",
    options: [
      { text: "Pull the goalie early if we get possession.", effect: genericEffect },
      { text: "Open up the offense, take more risks.", effect: genericEffect },
      { text: "Focus on winning the next faceoff and setting up a play.", effect: genericEffect },
    ]
  },
  // Tied Game
  {
    trigger: 'TIED_GAME',
    prompt: "It's a tight, tied game. What's your strategic focus?",
    options: [
      { text: "Prioritize defense, don't make the first mistake.", effect: genericEffect },
      { text: "Try to exploit their weaker defensive pairing.", effect: genericEffect },
      { text: "Emphasize special teams performance.", effect: genericEffect },
    ]
  },
];