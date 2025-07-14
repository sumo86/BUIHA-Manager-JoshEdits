import { Player, PlayerSeasonStats } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAggregatedCurrentStats } from '@/lib/statsUtils';

type StatKey = keyof PlayerSeasonStats;

interface PlayerStatsTableProps {
  title: string;
  players: Player[];
  stat: StatKey;
  category: 'skater' | 'goalie';
}

const formatValue = (stats: PlayerSeasonStats, stat: StatKey) => {
  if (stat === 'savePercentage') {
    return stats.savePercentage?.toFixed(3);
  }
  if (stat === 'goalsAgainstAverage') {
    return stats.goalsAgainstAverage?.toFixed(2);
  }
  return stats[stat] || 0;
};

export const PlayerStatsTable = ({ title, players, stat, category }: PlayerStatsTableProps) => {
  const sortedPlayers = [...players]
    .map(p => ({ player: p, stats: getAggregatedCurrentStats(p) }))
    .filter(({ stats }) => {
      if (category === 'goalie') {
        return stats.gamesPlayed >= 3;
      }
      return true;
    })
    .sort((a, b) => {
      const statA = a.stats[stat] || 0;
      const statB = b.stats[stat] || 0;
      
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
            {sortedPlayers.map(({ player, stats }) => (
              <TableRow key={player.id}>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell>{stats.team}</TableCell>
                <TableCell className="text-right font-bold">{formatValue(stats, stat)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};