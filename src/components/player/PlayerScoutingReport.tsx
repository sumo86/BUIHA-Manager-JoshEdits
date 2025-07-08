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

const generateReport = (player: Player, team: Team) => {
  const isSkater = player.positions[0] !== 'G';
  const { attributes, starRating } = player;
  const { leagueDivision } = team;

  const summary = `${player.name} is ${getSkillTierDescription(starRating)} in ${leagueDivision}.`;

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  Object.entries(attributes).forEach(([key, value]) => {
    const desc = getAttributeDescription(key, value as number);
    if (desc.includes('elite') || desc.includes('strong')) {
      strengths.push(desc);
    } else if (desc.includes('weak')) {
      weaknesses.push(desc);
    }
  });

  let pros = strengths.length > 0 ? `Strengths include ${player.name}'s ${strengths.slice(0, 3).join(', ')}.` : '';
  let cons = weaknesses.length > 0 ? `Weaknesses include ${player.name}'s ${weaknesses.slice(0, 3).join(', ')}.` : '';

  // Hints for hidden attributes
  const hiddenHints: string[] = [];
  const hidden = attributes as any; // To access hidden attributes by string key

  // Professionalism & Determination (Work Ethic)
  if (hidden.professionalism >= 18 && hidden.determination >= 18) {
    hiddenHints.push(`${player.name}'s unwavering dedication and relentless work ethic are exceptional.`);
  } else if (hidden.professionalism >= 15 && hidden.determination >= 15) {
    hiddenHints.push(`${player.name} is known for a strong work ethic and never-give-up attitude.`);
  } else if (hidden.professionalism >= 12 && hidden.determination >= 12) {
    hiddenHints.push(`${player.name} generally puts in a good effort and is committed to improving.`);
  } else if (hidden.professionalism <= 7 || hidden.determination <= 7) {
    hiddenHints.push(`${player.name} sometimes lacks focus in practice and could be more dedicated.`);
  } else if (hidden.professionalism <= 4 || hidden.determination <= 4) {
    hiddenHints.push(`Concerns exist about ${player.name}'s commitment; ${player.name} often seems disengaged.`);
  }

  // Leadership
  if (hidden.leadership >= 18) {
    hiddenHints.push(`A true captain, ${player.name} inspires teammates with exceptional leadership.`);
  } else if (hidden.leadership >= 15) {
    hiddenHints.push(`${player.name} is a natural leader in the locker room, guiding teammates by example.`);
  } else if (hidden.leadership <= 7) {
    hiddenHints.push(`${player.name} tends to keep to ${player.name}self and is not a vocal presence.`);
  }

  // Injury Proneness
  if (hidden.injuryProneness <= 5) {
    hiddenHints.push(`Remarkably durable, ${player.name} rarely misses a game and can withstand a lot of punishment.`);
  } else if (hidden.injuryProneness <= 8) {
    hiddenHints.push(`${player.name} is quite durable and rarely misses a game.`);
  } else if (hidden.injuryProneness >= 14) {
    hiddenHints.push(`${player.name} seems to have issues with durability and has a history of nagging injuries.`);
  } else if (hidden.injuryProneness >= 17) {
    hiddenHints.push(`${player.name}'s career has been plagued by frequent and severe injuries, raising long-term concerns.`);
  }

  // Big Games (Clutch Performance)
  if (hidden.bigGames >= 18) {
    hiddenHints.push(`${player.name} thrives under immense pressure, consistently delivering in the biggest moments.`);
  } else if (hidden.bigGames >= 15) {
    hiddenHints.push(`${player.name} is known to perform well under pressure in important matchups.`);
  } else if (hidden.bigGames <= 7) {
    hiddenHints.push(`${player.name} can sometimes struggle when the stakes are highest, tending to disappear in big games.`);
  }

  // Temperament (Discipline)
  if (hidden.temperament <= 5) {
    hiddenHints.push(`${player.name} plays with a fiery edge and can be prone to taking bad penalties, often costing ${player.name}'s team.`);
  } else if (hidden.temperament <= 8) {
    hiddenHints.push(`${player.name} can be a bit hot-headed and occasionally takes unnecessary penalties.`);
  } else if (hidden.temperament >= 15) {
    hiddenHints.push(`${player.name} maintains excellent composure under pressure and rarely takes a bad penalty.`);
  }

  return [summary, pros, cons, ...hiddenHints].filter(Boolean).join(' ');
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