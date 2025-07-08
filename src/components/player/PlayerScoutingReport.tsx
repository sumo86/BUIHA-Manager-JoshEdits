import { Player, Team, SkaterAttributes, GoalieAttributes } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { divisionTiers } from '@/lib/leagueUtils';

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

// Helper to calculate star rating for a given ability and division
const calculateStarRatingForAbility = (ability: number, isSkater: boolean, targetLeagueDivision: string): number => {
    const tierKey = Object.keys(divisionTiers).find(key => targetLeagueDivision.includes(key)) || 'Non-Checking 3';
    const tier = divisionTiers[tierKey];
    
    const avgAbility = isSkater ? tier.skater : tier.goalie;
    const step = isSkater ? tier.step.skater : tier.step.goalie;
    
    const diff = ability - avgAbility;

    if (diff > step * 1.75) return 5;
    if (diff > step * 1.25) return 4.5;
    if (diff > step * 0.75) return 4;
    if (diff > step * 0.25) return 3.5;
    if (diff > -0.25 * step) return 3;
    if (diff > -0.75 * step) return 2.5;
    if (diff > -1.25 * step) return 2;
    if (diff > -1.75 * step) return 1.5;
    return 1;
};

const generateReport = (player: Player, team: Team) => {
  const firstName = player.name.split(' ')[0];
  const isSkater = player.positions[0] !== 'G';
  const { attributes, starRating, potentialAbility } = player;
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

  // Hints for hidden attributes
  const hiddenHints: string[] = [];
  const hidden = attributes as any; // To access hidden attributes by string key

  // Professionalism & Determination (Work Ethic)
  if (hidden.professionalism >= 18 && hidden.determination >= 18) {
    hiddenHints.push(`${firstName}'s unwavering dedication and relentless work ethic are exceptional.`);
  } else if (hidden.professionalism >= 15 && hidden.determination >= 15) {
    hiddenHints.push(`${firstName} is known for a strong work ethic and never-give-up attitude.`);
  } else if (hidden.professionalism >= 12 && hidden.determination >= 12) {
    hiddenHints.push(`${firstName} generally puts in a good effort and is committed to improving.`);
  } else if (hidden.professionalism <= 7 || hidden.determination <= 7) {
    hiddenHints.push(`${firstName} sometimes lacks focus in practice and could be more dedicated.`);
  } else if (hidden.professionalism <= 4 || hidden.determination <= 4) {
    hiddenHints.push(`Concerns exist about ${firstName}'s commitment; ${firstName} often seems disengaged.`);
  }

  // Leadership
  if (hidden.leadership >= 18) {
    hiddenHints.push(`A true captain, ${firstName} inspires teammates with exceptional leadership.`);
  } else if (hidden.leadership >= 15) {
    hiddenHints.push(`${firstName} is a natural leader in the locker room, guiding teammates by example.`);
  } else if (hidden.leadership <= 7) {
    hiddenHints.push(`${firstName} tends to keep to themself and is not a vocal presence.`);
  }

  // Injury Proneness
  if (hidden.injuryProneness <= 5) {
    hiddenHints.push(`Remarkably durable, ${firstName} rarely misses a game.`);
  } else if (hidden.injuryProneness <= 8) {
    hiddenHints.push(`${firstName} is quite durable and rarely misses a game.`);
  } else if (hidden.injuryProneness >= 14) {
    hiddenHints.push(`${firstName} seems to have issues with durability and has a history of nagging injuries.`);
  } else if (hidden.injuryProneness >= 17) {
    hiddenHints.push(`${firstName}'s career has been plagued by frequent and severe injuries.`);
  }

  // Big Games (Clutch Performance)
  if (hidden.bigGames >= 18) {
    hiddenHints.push(`${firstName} thrives under immense pressure, consistently delivering in the biggest moments.`);
  } else if (hidden.bigGames >= 15) {
    hiddenHints.push(`${firstName} is known to perform well under pressure in important matchups.`);
  } else if (hidden.bigGames <= 7) {
    hiddenHints.push(`${firstName} can sometimes struggle when the stakes are highest.`);
  }

  // Temperament (Discipline)
  if (hidden.temperament <= 5) {
    hiddenHints.push(`${firstName} plays with a fiery edge and can be prone to taking bad penalties.`);
  } else if (hidden.temperament <= 8) {
    hiddenHints.push(`${firstName} can be a bit hot-headed and occasionally takes unnecessary penalties.`);
  } else if (hidden.temperament >= 15) {
    hiddenHints.push(`${firstName} maintains excellent composure under pressure and rarely takes a bad penalty.`);
  }

  // Greed
  if (hidden.greed <= 5) {
    hiddenHints.push(`${firstName} is known for being selfless and team-oriented.`);
  } else if (hidden.greed >= 15) {
    hiddenHints.push(`${firstName} has a reputation for being overly focused on personal gain.`);
  }

  // Controversy
  if (hidden.controversy <= 5) {
    hiddenHints.push(`${firstName} maintains a clean public image and avoids off-ice distractions.`);
  } else if (hidden.controversy >= 15) {
    hiddenHints.push(`${firstName} has a history of off-ice incidents that could be a distraction.`);
  }

  // Potential Assessment
  let potentialAssessment = '';
  const potentialDivisions = Object.keys(divisionTiers);
  let bestFitDivision = leagueDivision; // Start with current division

  // Find the highest division where potentialAbility is at least "average" (3 stars)
  for (let i = potentialDivisions.length - 1; i >= 0; i--) {
    const div = potentialDivisions[i];
    const potentialStar = calculateStarRatingForAbility(potentialAbility, isSkater, div);
    if (potentialStar >= 3) {
      bestFitDivision = div;
      break;
    }
  }

  const potentialStarRating = calculateStarRatingForAbility(potentialAbility, isSkater, bestFitDivision);
  const potentialSkillDescription = getSkillTierDescription(potentialStarRating);

  const potentialPhrases = [
    `${firstName} may have the potential to become ${potentialSkillDescription} in ${bestFitDivision}.`,
    `With proper development, ${firstName} could grow into ${potentialSkillDescription} at the ${bestFitDivision} level.`,
    `Scouts project ${firstName} to potentially develop into ${potentialSkillDescription} in ${bestFitDivision}.`
  ];
  potentialAssessment = potentialPhrases[Math.floor(Math.random() * potentialPhrases.length)];


  return [summary, pros, cons, ...hiddenHints, potentialAssessment].filter(Boolean).join(' ');
};

export const PlayerScoutingReport = ({ player, team }: PlayerScoutingReportProps) => {
  const report = generateReport(player, team);

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