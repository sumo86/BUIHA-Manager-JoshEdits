import { Player, Team, SkaterAttributes, GoalieAttributes } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateStarRating } from '@/lib/playerGenerator';
import { useTeam, TierInfo } from '@/context/TeamContext'; // Import useTeam and TierInfo

interface PlayerScoutingReportProps {
  player: Player;
  team: Team;
}

const getSkillTierDescription = (starRating: number): string => {
  if (starRating >= 4.5) return "an elite player";
  if (starRating >= 4.0) return "a star player";
  if (starRating >= 3.5) return "an above-average player";
  if (starRating >= 3.0) return "an average player";
  if (starRating >= 2.5) return "a below-average player";
  if (starRating >= 2.0) return "a depth player";
  return "a replacement-level player";
};

const getAttributeDescription = (key: string, value: number): string => {
    const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
    if (value >= 17) return `elite ${formattedKey}`;
    if (value >= 14) return `strong ${formattedKey}`;
    if (value <= 7) return `weak ${formattedKey}`;
    if (value <= 4) return `very weak ${formattedKey}`;
    return '';
};

const generateReport = (player: Player, team: Team, tierHierarchy: TierInfo[]) => { // Added tierHierarchy parameter
  const firstName = player.name.split(' ')[0];
  const isSkater = player.positions[0] !== 'G';
  const { attributes, starRating, potentialAbility, currentAbility } = player;
  const { leagueDivision } = team;

  const summaryPhrases = [
    `${firstName} is ${getSkillTierDescription(starRating)} in ${leagueDivision}.`,
    `${firstName} currently performs as ${getSkillTierDescription(starRating)} at the ${leagueDivision} level.`,
    `At the ${leagueDivision} level, ${firstName} is considered ${getSkillTierDescription(starRating)}.`
  ];
  const summary = summaryPhrases[Math.floor(Math.random() * summaryPhrases.length)];

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Define visible attributes to consider for general strengths/weaknesses
  const visibleSkaterKeys: (keyof SkaterAttributes)[] = ['acceleration', 'agility', 'balance', 'fighting', 'speed', 'stamina', 'strength', 'hitting', 'aggression', 'bravery', 'gettingOpen', 'offensiveRead', 'passing', 'puckhandling', 'screening', 'shootingAccuracy', 'shootingRange', 'checking', 'defensiveRead', 'faceoffs', 'positioning', 'shotBlocking', 'stickchecking'];
  const visibleGoalieKeys: (keyof GoalieAttributes)[] = ['blocker', 'glove', 'lowShots', 'positioning', 'rebound', 'recovery', 'reflexes', 'passing', 'pokeCheck', 'puckhandling', 'skating', 'mentalToughness', 'goaltenderStamina'];
  
  const attributesToConsider = isSkater ? visibleSkaterKeys : visibleGoalieKeys;

  attributesToConsider.forEach(key => {
    const value = attributes[key as keyof typeof attributes] as number;
    const desc = getAttributeDescription(key as string, value);
    if (desc.includes('elite') || desc.includes('strong')) {
      strengths.push(desc);
    } else if (desc.includes('weak')) {
      weaknesses.push(desc);
    }
  });

  let pros = '';
  if (strengths.length > 0) {
    const proPhrases = [
      `A key strength is ${firstName}'s ${strengths[0]}.`,
      `${firstName} excels in areas like ${strengths[0]}.`,
      `One notable positive is ${firstName}'s ${strengths[0]}.`
    ];
    pros = proPhrases[Math.floor(Math.random() * proPhrases.length)];
  }

  let cons = '';
  if (weaknesses.length > 0) {
    const conPhrases = [
      `However, ${firstName} struggles with ${weaknesses[0]}.`,
      `A notable area for improvement is ${firstName}'s ${weaknesses[0]}.`,
      `On the other hand, ${firstName} shows weakness in ${weaknesses[0]}.`
    ];
    cons = conPhrases[Math.floor(Math.random() * conPhrases.length)];
  }

  // Hints for hidden attributes - now prioritized and limited
  const hiddenHints: { text: string; score: number }[] = [];
  const hidden = attributes as any; // To access hidden attributes by string key

  // Professionalism & Determination (Work Ethic)
  if (hidden.professionalism >= 18 && hidden.determination >= 18) hiddenHints.push({ text: `demonstrates exceptional work ethic and dedication.`, score: 10 });
  else if (hidden.professionalism >= 15 && hidden.determination >= 15) hiddenHints.push({ text: `has a strong work ethic and is committed to improvement.`, score: 8 });
  else if (hidden.professionalism <= 7 || hidden.determination <= 7) hiddenHints.push({ text: `lacks focus and dedication.`, score: 8 });
  else if (hidden.professionalism <= 4 || hidden.determination <= 4) hiddenHints.push({ text: `raises significant concerns about commitment and engagement.`, score: 10 });

  // Leadership
  if (hidden.leadership >= 18) hiddenHints.push({ text: `is an exceptional leader, inspiring teammates.`, score: 9 });
  else if (hidden.leadership >= 15) hiddenHints.push({ text: `is a natural leader, guiding by example.`, score: 7 });
  else if (hidden.leadership <= 7) hiddenHints.push({ text: `is not a vocal presence and tends to keep themself.`, score: 7 });

  // Injury Proneness
  if (hidden.injuryProneness <= 5) hiddenHints.push({ text: `is remarkably durable, rarely missing games.`, score: 9 });
  else if (hidden.injuryProneness >= 17) hiddenHints.push({ text: `has a career plagued by frequent, severe injuries.`, score: 10 });

  // Big Games (Clutch Performance)
  if (hidden.bigGames >= 18) hiddenHints.push({ text: `thrives under pressure, delivering in big moments.`, score: 9 });
  else if (hidden.bigGames <= 7) hiddenHints.push({ text: `struggles when stakes are highest, often disappearing in big games.`, score: 8 });

  // Temperament (Discipline)
  if (hidden.temperament <= 5) hiddenHints.push({ text: `plays with a fiery edge and is prone to bad penalties.`, score: 9 });
  else if (hidden.temperament >= 15) hiddenHints.push({ text: `shows excellent composure and rarely takes bad penalties.`, score: 7 });

  // Greed
  if (hidden.greed <= 5) hiddenHints.push({ text: `is selfless and team-oriented.`, score: 7 });
  else if (hidden.greed >= 15) hiddenHints.push({ text: `is overly focused on personal gain.`, score: 8 });

  // Controversy
  if (hidden.controversy <= 5) hiddenHints.push({ text: `maintains a clean public image and avoids distractions.`, score: 7 });
  else if (hidden.controversy >= 15) hiddenHints.push({ text: `has a history of off-ice incidents, which could be a distraction.`, score: 8 });

  // Sort hints by score and take top 3 (or fewer if not enough)
  const selectedHiddenHints = hiddenHints
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(hint => `${firstName} ${hint.text}`);

  // Potential Assessment - only if significant potential
  let potentialAssessment = '';
  if (potentialAbility - currentAbility > 75) {
    const potentialStarRating = calculateStarRating(potentialAbility, isSkater, leagueDivision, tierHierarchy); // Pass tierHierarchy
    const potentialSkillDescription = getSkillTierDescription(potentialStarRating);

    const potentialPhrases = [
      `${firstName} may have the potential to become ${potentialSkillDescription} in ${leagueDivision}.`,
      `With proper development, ${firstName} could grow into ${potentialSkillDescription} at the ${leagueDivision} level.`,
      `Scouts project ${firstName} to potentially develop into ${potentialSkillDescription} in ${leagueDivision}.`
    ];
    potentialAssessment = potentialPhrases[Math.floor(Math.random() * potentialPhrases.length)];
  }


  return [summary, pros, cons, ...selectedHiddenHints, potentialAssessment].filter(Boolean).join(' ');
};

export const PlayerScoutingReport = ({ player, team }: PlayerScoutingReportProps) => {
  const { tierHierarchy } = useTeam(); // Get tierHierarchy from context
  const report = generateReport(player, team, tierHierarchy); // Pass tierHierarchy to generateReport

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scouting Report</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{report}</p>
      </CardContent>
    </Card>
  );
};