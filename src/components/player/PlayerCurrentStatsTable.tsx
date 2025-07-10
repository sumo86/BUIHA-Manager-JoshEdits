import { CurrentSeasonStats } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PlayerCurrentStatsTableProps {
  stats: CurrentSeasonStats;
  isSkater: boolean;
}

export const PlayerCurrentStatsTable = ({ stats, isSkater }: PlayerCurrentStatsTableProps) => {
  if (stats.gamesPlayed === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Season Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This player has not played any games this season.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Season Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GP</TableHead>
              {isSkater ? (
                <>
                  <TableHead>G</TableHead>
                  <TableHead>A</TableHead>
                  <TableHead>P</TableHead>
                  <TableHead>PIM</TableHead>
                </>
              ) : (
                <>
                  <TableHead>W</TableHead>
                  <TableHead>L</TableHead>
                  <TableHead>D</TableHead>
                  <TableHead>GAA</TableHead>
                  <TableHead>SV%</TableHead>
                  <TableHead>SO</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{stats.gamesPlayed}</TableCell>
              {isSkater ? (
                <>
                  <TableCell>{stats.goals}</TableCell>
                  <TableCell>{stats.assists}</TableCell>
                  <TableCell>{stats.points}</TableCell>
                  <TableCell>{stats.penaltyMinutes}</TableCell>
                </>
              ) : (
                <>
                  <TableCell>{stats.wins}</TableCell>
                  <TableCell>{stats.losses}</TableCell>
                  <TableCell>{stats.draws}</TableCell>
                  <TableCell>{stats.goalsAgainstAverage.toFixed(2)}</TableCell>
                  <TableCell>{stats.savePercentage.toFixed(3)}</TableCell>
                  <TableCell>{stats.shutouts}</TableCell>
                </>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};