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
    {
      trigger: 'ANY',
      prompt: "Your backup goalie is playing due to an injury.",
      options: [
        { text: "Keep tactics simple and defensive", effect: genericEffect },
        { text: "Play normally, show confidence in them", effect: genericEffect },
        { text: "Reduce shots against with controlled possession", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "One of your wingers is having an off game.",
      options: [
        { text: "Move them down a line", effect: genericEffect },
        { text: "Switch their side", effect: genericEffect },
        { text: "Let them play through it", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "Your captain is playing recklessly.",
      options: [
        { text: "Talk to them on the bench", effect: genericEffect },
        { text: "Let them play emotionally – it lifts the team", effect: genericEffect },
        { text: "Reduce their ice time subtly", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "Crowd energy is high for the home team.",
      options: [
        { text: "Quiet the game down", effect: genericEffect },
        { text: "Tell your players to feed off the hostility", effect: genericEffect },
        { text: "Focus on silencing the crowd with early chances", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "Your enforcer is chirping the other bench.",
      options: [
        { text: "Let them be – it’s part of their role", effect: genericEffect },
        { text: "Tell them to cool it", effect: genericEffect },
        { text: "Use it as a psychological edge", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "Your star player is getting targeted physically.",
      options: [
        { text: "Ask refs to protect them", effect: genericEffect },
        { text: "Encourage the team to stand up for them", effect: genericEffect },
        { text: "Focus on scoring, not retaliation", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "Faceoffs are being consistently lost.",
      options: [
        { text: "Change your faceoff centre", effect: genericEffect },
        { text: "Emphasise support from the wingers", effect: genericEffect },
        { text: "Accept it and play reactive defence", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "The other coach is line-matching aggressively.",
      options: [
        { text: "Try to get last change more often", effect: genericEffect },
        { text: "Mix your lines to confuse them", effect: genericEffect },
        { text: "Stick with normal flow, trust your depth", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "A veteran makes a costly mistake.",
      options: [
        { text: "Let it slide, they know", effect: genericEffect },
        { text: "Pull them aside for quick advice", effect: genericEffect },
        { text: "Reduce their ice time quietly", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "Your team takes back-to-back penalties.",
      options: [
        { text: "Refocus them on discipline", effect: genericEffect },
        { text: "Adjust your penalty kill strategy", effect: genericEffect },
        { text: "Switch PK personnel", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "Your defence is overcommitting on pinches.",
      options: [
        { text: "Instruct D to stay home more", effect: genericEffect },
        { text: "Remind them to read the play better", effect: genericEffect },
        { text: "Limit pinching to specific pairings", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "You're losing puck battles consistently.",
      options: [
        { text: "Re-emphasise grit and work rate", effect: genericEffect },
        { text: "Change line combinations", effect: genericEffect },
        { text: "Encourage support from high forward", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "An opponent makes a dangerous hit that isn’t called.",
      options: [
        { text: "Demand an explanation from the refs", effect: genericEffect },
        { text: "Send a message shift with physical play", effect: genericEffect },
        { text: "Focus your team on discipline", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "A fight just broke out and the crowd is going wild.",
      options: [
        { text: "Use the energy to motivate the team", effect: genericEffect },
        { text: "Calm the bench down", effect: genericEffect },
        { text: "Reinforce structured play going forward", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "The game has become overly physical.",
      options: [
        { text: "Tell players to keep emotions in check", effect: genericEffect },
        { text: "Use your physical line strategically", effect: genericEffect },
        { text: "Focus on clean checks and smart play", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "You just took a penalty immediately after scoring.",
      options: [
        { text: "Reinforce discipline", effect: genericEffect },
        { text: "Rotate penalty kill units", effect: genericEffect },
        { text: "Settle the team emotionally", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "You keep losing puck possession in corners.",
      options: [
        { text: "Double support the puck carrier", effect: genericEffect },
        { text: "Win battles by using body positioning", effect: genericEffect },
        { text: "Cycle quickly to avoid traps", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "Your team is taking too many icing calls.",
      options: [
        { text: "Encourage smarter breakout choices", effect: genericEffect },
        { text: "Rotate lines more effectively", effect: genericEffect },
        { text: "Instruct players to skate the puck out", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "You're getting beat to loose pucks repeatedly.",
      options: [
        { text: "Push for more urgency and anticipation", effect: genericEffect },
        { text: "Switch to faster players on forecheck", effect: genericEffect },
        { text: "Emphasise shorter shifts for higher energy", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "The crowd is turning hostile after a dirty hit.",
      options: [
        { text: "Focus your team on clean, smart play", effect: genericEffect },
        { text: "Use energy to swing momentum", effect: genericEffect },
        { text: "Let your play do the talking", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "The opponent keeps winning board battles.",
      options: [
        { text: "Emphasise body position and stick strength", effect: genericEffect },
        { text: "Send help quicker in the corners", effect: genericEffect },
        { text: "Adjust angle of approach on puck pursuit", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "Team energy looks flat.",
      options: [
        { text: "Shorten the bench to wake things up", effect: genericEffect },
        { text: "Encourage louder bench communication", effect: genericEffect },
        { text: "Increase line rotation pace", effect: genericEffect },
      ]
    },
    {
      trigger: 'ANY',
      prompt: "Your team is playing too passively.",
      options: [
        { text: "Instruct aggressive puck pursuit", effect: genericEffect },
        { text: "Push tempo with quick shifts", effect: genericEffect },
        { text: "Change to a high-pressure forecheck", effect: genericEffect },
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
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "The opponent’s top line is generating a lot of pressure.",
      options: [
        { text: "Match lines and play defensively", effect: genericEffect },
        { text: "Stick with the current plan, trust your players", effect: genericEffect },
        { text: "Shift to a more conservative forecheck", effect: genericEffect },
      ]
    },
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "The opponent switches to a heavy forecheck.",
      options: [
        { text: "Switch to a quick-up breakout", effect: genericEffect },
        { text: "Tell D to slow it down behind the net", effect: genericEffect },
        { text: "Play dump-and-chase to reduce turnovers", effect: genericEffect },
      ]
    },
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "Opponents are targeting your weak-side D-man.",
      options: [
        { text: "Flip your D pairings", effect: genericEffect },
        { text: "Support with F3 in the zone", effect: genericEffect },
        { text: "Instruct safe outlet passes", effect: genericEffect },
      ]
    },
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "The opponent is dominating time on attack.",
      options: [
        { text: "Reinforce defensive structure", effect: genericEffect },
        { text: "Switch to a more passive zone", effect: genericEffect },
        { text: "Encourage quick transitions", effect: genericEffect },
      ]
    },
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "The opponent is scoring off odd-man rushes.",
      options: [
        { text: "Limit risky pinches", effect: genericEffect },
        { text: "Have forwards backcheck harder", effect: genericEffect },
        { text: "Play a deeper forecheck", effect: genericEffect },
      ]
    },
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "Your defensive zone coverage is falling apart.",
      options: [
        { text: "Switch to man-on-man", effect: genericEffect },
        { text: "Tighten the slot coverage", effect: genericEffect },
        { text: "Sub in more reliable D-pair", effect: genericEffect },
      ]
    },
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "Faceoff losses are leading to goals.",
      options: [
        { text: "Focus on improved puck support post-draw", effect: genericEffect },
        { text: "Sub in best faceoff centre", effect: genericEffect },
        { text: "Shift wingers to better defensive positions", effect: genericEffect },
      ]
    },
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "Your defence is struggling with gap control.",
      options: [
        { text: "Coach them to maintain tighter gaps", effect: genericEffect },
        { text: "Emphasise footwork and positioning", effect: genericEffect },
        { text: "Limit 1-on-1 situations", effect: genericEffect },
      ]
    },
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "You're getting outshot heavily.",
      options: [
        { text: "Increase offensive zone time", effect: genericEffect },
        { text: "Encourage more shot attempts", effect: genericEffect },
        { text: "Focus on blocking shots in your own zone", effect: genericEffect },
      ]
    },
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "Opponent is dominating in front of your net.",
      options: [
        { text: "Clear the crease with more physicality", effect: genericEffect },
        { text: "Box out earlier", effect: genericEffect },
        { text: "Collapse defence into a tighter triangle", effect: genericEffect },
      ]
    },
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "Penalty kill is giving up cross-ice passes.",
      options: [
        { text: "Tighten box formation", effect: genericEffect },
        { text: "Front the puck carrier more aggressively", effect: genericEffect },
        { text: "Cut passing lanes with active sticks", effect: genericEffect },
      ]
    },
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "Players aren’t backchecking fast enough.",
      options: [
        { text: "Bench repeat offenders briefly", effect: genericEffect },
        { text: "Reinforce importance of full-team defence", effect: genericEffect },
        { text: "Use more speed-focused lines", effect: genericEffect },
      ]
    },
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "The game pace is too fast for your team.",
      options: [
        { text: "Control the tempo with possession", effect: genericEffect },
        { text: "Slow transitions and regroup more", effect: genericEffect },
        { text: "Use longer shifts with experienced players", effect: genericEffect },
      ]
    },
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "You're giving up too many breakaways.",
      options: [
        { text: "Pull D back on offensive zone entries", effect: genericEffect },
        { text: "Always have a high forward", effect: genericEffect },
        { text: "Switch to a less aggressive strategy", effect: genericEffect },
      ]
    },
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "Players are missing assignments in coverage.",
      options: [
        { text: "Re-emphasise communication", effect: genericEffect },
        { text: "Switch pairings to increase reliability", effect: genericEffect },
        { text: "Simplify coverage responsibilities", effect: genericEffect },
      ]
    },
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "Forecheck is leaving you exposed defensively.",
      options: [
        { text: "Drop a forward back early", effect: genericEffect },
        { text: "Use a more passive 1-2-2 forecheck", effect: genericEffect },
        { text: "Emphasise quick forward changes", effect: genericEffect },
      ]
    },
    {
      trigger: 'OPPONENT_PRESSURE',
      prompt: "Your breakout passes are getting intercepted.",
      options: [
        { text: "Simplify the breakout strategy", effect: genericEffect },
        { text: "Instruct wingers to get deeper", effect: genericEffect },
        { text: "Tell D to carry the puck more", effect: genericEffect },
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
    {
      trigger: 'OFFENSIVE_STALL',
      prompt: "Power play has been ineffective all game.",
      options: [
        { text: "Change the formation", effect: genericEffect },
        { text: "Swap in different personnel", effect: genericEffect },
        { text: "Keep trusting the unit, it’ll click", effect: genericEffect },
      ]
    },
    {
      trigger: 'OFFENSIVE_STALL',
      prompt: "You notice the opposing goalie struggles with high shots.",
      options: [
        { text: "Tell players to shoot high glove side", effect: genericEffect },
        { text: "Crash the net hard", effect: genericEffect },
        { text: "Keep the regular plan – don’t overthink", effect: genericEffect },
      ]
    },
    {
      trigger: 'OFFENSIVE_STALL',
      prompt: "Your forecheck isn’t producing turnovers.",
      options: [
        { text: "Increase forecheck pressure", effect: genericEffect },
        { text: "Switch to a trap", effect: genericEffect },
        { text: "Target specific opposing D-men", effect: genericEffect },
      ]
    },
    {
      trigger: 'OFFENSIVE_STALL',
      prompt: "The other team is blocking most of your shots.",
      options: [
        { text: "Encourage more puck movement", effect: genericEffect },
        { text: "Shoot lower for rebounds", effect: genericEffect },
        { text: "Cycle the puck to tire them out", effect: genericEffect },
      ]
    },
    {
      trigger: 'OFFENSIVE_STALL',
      prompt: "Your neutral zone play is ineffective.",
      options: [
        { text: "Clog the middle with a 1-2-2 setup", effect: genericEffect },
        { text: "Go for aggressive stretch passes", effect: genericEffect },
        { text: "Slow it down and regroup more", effect: genericEffect },
      ]
    },
    {
      trigger: 'OFFENSIVE_STALL',
      prompt: "You're dominating possession but can't score.",
      options: [
        { text: "Get more traffic in front of the net", effect: genericEffect },
        { text: "Switch to shooting from the point", effect: genericEffect },
        { text: "Encourage behind-the-net plays", effect: genericEffect },
      ]
    },
    {
      trigger: 'OFFENSIVE_STALL',
      prompt: "The other team is stacking the blue line.",
      options: [
        { text: "Dump and chase more aggressively", effect: genericEffect },
        { text: "Enter with more speed", effect: genericEffect },
        { text: "Utilise cross-ice passes", effect: genericEffect },
      ]
    },
    {
      trigger: 'OFFENSIVE_STALL',
      prompt: "Opponent is collapsing in front of their net.",
      options: [
        { text: "Shoot from the point and crash", effect: genericEffect },
        { text: "Work the puck low to high", effect: genericEffect },
        { text: "Draw defenders out with wide movement", effect: genericEffect },
      ]
    },
    {
      trigger: 'OFFENSIVE_STALL',
      prompt: "The power play is struggling to gain zone entry.",
      options: [
        { text: "Try a drop-pass entry", effect: genericEffect },
        { text: "Chip and chase entry", effect: genericEffect },
        { text: "Switch puck carrier on entry", effect: genericEffect },
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
    {
      trigger: 'RECENT_GOAL_AGAINST',
      prompt: "Your goalie looks shaky after giving up a soft goal.",
      options: [
        { text: "Reinforce defensive structure", effect: genericEffect },
        { text: "Tell the team to limit rebounds", effect: genericEffect },
        { text: "Encourage more offensive pressure to respond", effect: genericEffect },
      ]
    },
    {
      trigger: 'RECENT_GOAL_AGAINST',
      prompt: "You’re down 3–0 after one period.",
      options: [
        { text: "Give an inspirational speech", effect: genericEffect },
        { text: "Focus on execution and structure", effect: genericEffect },
        { text: "Make a key tactical change", effect: genericEffect },
      ]
    },
    {
      trigger: 'RECENT_GOAL_AGAINST',
      prompt: "The opponent just scored a controversial goal.",
      options: [
        { text: "Refocus the team immediately", effect: genericEffect },
        { text: "Channel the frustration into energy", effect: genericEffect },
        { text: "Keep the team composed", effect: genericEffect },
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
    {
      trigger: 'RECENT_GOAL_FOR',
      prompt: "You just scored two quick goals.",
      options: [
        { text: "Ride the momentum with your top line", effect: genericEffect },
        { text: "Rotate through all lines to stay fresh", effect: genericEffect },
        { text: "Emphasise discipline – don’t get cocky", effect: genericEffect },
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
    {
      trigger: 'USER_LEADING',
      prompt: "You're up big heading into the 3rd period.",
      options: [
        { text: "Roll all four lines", effect: genericEffect },
        { text: "Push for more goals – goal difference matters", effect: genericEffect },
        { text: "Play ultra-defensive and safe", effect: genericEffect },
      ]
    },
    {
      trigger: 'USER_LEADING',
      prompt: "Your team is winning but play is getting sloppy.",
      options: [
        { text: "Demand focus on fundamentals", effect: genericEffect },
        { text: "Rotate lines to reset energy", effect: genericEffect },
        { text: "Simplify the breakout and exits", effect: genericEffect },
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
    {
      trigger: 'TIED_GAME',
      prompt: "The game is tied with 2 minutes left.",
      options: [
        { text: "Play it safe, go to overtime", effect: genericEffect },
        { text: "Push your top line, go for the win", effect: genericEffect },
        { text: "Mix lines to surprise them", effect: genericEffect },
      ]
    },
  ],
};