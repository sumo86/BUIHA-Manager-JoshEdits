import { Player, SkaterAttributes, GoalieAttributes, CurrentSeasonStats } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type StatKey = keyof CurrentSeasonStats;

interface PlayerStatsTableProps {
  title: string;
  players: Player[];
  stat: StatKey;
  category: 'skater' | 'goalie';
}

const formatValue = (player: Player, stat: StatKey, category: 'goalie' | 'skater') => {
  if (stat === 'savePercentage') {
    return player.currentStats.savePercentage.toFixed(3);
  }
  if (stat === 'goalsAgainstAverage') {
    return player.currentStats.goalsAgainstAverage.toFixed(2);
  }
  return player.currentStats[stat] || 0;
};

export const PlayerStatsTable = ({ title, players, stat, category }: PlayerStatsTableProps) => {
  const sortedPlayers = [...players]
    .filter(p => {
      if (category === 'goalie') {
        // Goalie eligibility for in-season stats: at least 3 games played
        return p.currentStats.gamesPlayed >= 3;
      }
      return true;
    })
    .sort((a, b) => {
      const statA = formatValue(a, stat, category);
      const statB = formatValue(b, stat, category);
      
      if (stat === 'goalsAgainstAverage') {
        return (statA as number) - (statB as number);
      }
      return (statB as number) - (statA as number);
    })
    .slice(0, 5);

  if (sortedPlayers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">{stat.toString().charAt(0).toUpperCase() + stat.toString().slice(1)}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map(player => (
              <TableRow key={player.id}>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell>{player.history.length > 0 ? player.history[player.history.length - 1].team : 'N/A'}</TableCell>
                <TableCell className="text-right font-bold">{formatValue(player, stat, category)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};