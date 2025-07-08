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

  let pros = strengths.length > 0 ? `Strengths include his ${strengths.slice(0, 3).join(', ')}.` : '';
  let cons = weaknesses.length > 0 ? `Weaknesses include his ${weaknesses.slice(0, 3).join(', ')}.` : '';

  // Hints for hidden attributes
  const hiddenHints: string[] = [];
  const hidden = attributes as any; // To access hidden attributes by string key

  if (hidden.professionalism >= 15 && hidden.determination >= 15) {
    hiddenHints.push("He is known for his strong work ethic and never-give-up attitude.");
  }
  if (hidden.professionalism <= 8) {
    hiddenHints.push("He sometimes lacks focus in practice and could be more dedicated.");
  }
  if (hidden.leadership >= 16) {
    hiddenHints.push("He is a natural leader in the locker room.");
  }
  if (hidden.injuryProneness >= 14) {
    hiddenHints.push("He seems to have issues with durability and has a history of nagging injuries.");
  }
  if (hidden.injuryProneness <= 7) {
    hiddenHints.push("He is quite durable and rarely misses a game.");
  }
  if (hidden.bigGames >= 15) {
    hiddenHints.push("He is known to perform well under pressure in important matchups.");
  }
  if (hidden.temperament <= 6) {
    hiddenHints.push("He plays with a fiery edge and can be prone to taking bad penalties.");
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