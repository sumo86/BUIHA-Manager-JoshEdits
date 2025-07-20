import { Player } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAggregatedCareerStats } from '@/lib/statsUtils';
import { getPlayerLastTeam } from '@/lib/playerUtils';

interface CareerStatsTableProps {
  players: Player[];
}

export const CareerStatsTable = ({ players }: CareerStatsTableProps) => {
  const playerStats = players
    .map(player => ({
      player,
      stats: getAggregatedCareerStats(player),
    }))
    .sort((a, b) => (b.stats.points || 0) - (a.stats.points || 0));

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Last Team</TableHead>
            <TableHead className="text-center">GP</TableHead>
            <TableHead className="text-center">G</TableHead>
            <TableHead className="text-center">A</TableHead>
            <TableHead className="text-center">Pts</TableHead>
            <TableHead className="text-center">PIM</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {playerStats.length > 0 ? (
            playerStats.map(({ player, stats }) => (
              <TableRow key={player.id}>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell>{getPlayerLastTeam(player)}</TableCell>
                <TableCell className="text-center">{stats.gamesPlayed}</TableCell>
                <TableCell className="text-center">{stats.goals}</TableCell>
                <TableCell className="text-center">{stats.assists}</TableCell>
                <TableCell className="text-center">{stats.points}</TableCell>
                <TableCell className="text-center">{stats.penaltyMinutes}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No player data available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};