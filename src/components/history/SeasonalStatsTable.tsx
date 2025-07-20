import { useMemo, useState } from 'react';
import { Player } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SeasonalStatsTableProps {
  players: Player[];
  seasons: string[];
}

type DisplayStat = Player['history'][0] & { playerName: string };

export const SeasonalStatsTable = ({ players, seasons }: SeasonalStatsTableProps) => {
  const sortedSeasons = useMemo(() => seasons.sort((a, b) => b.localeCompare(a)), [seasons]);
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(sortedSeasons[0]);

  const statsForSeason = useMemo((): DisplayStat[] => {
    if (!selectedSeason) return [];
    
    const allStats: DisplayStat[] = [];
    players.forEach(player => {
      const seasonStats = player.history.filter(h => h.season === selectedSeason);
      seasonStats.forEach(stat => {
        allStats.push({
          ...stat,
          playerName: player.name,
        });
      });
    });
    return allStats;
  }, [players, selectedSeason]);

  const skaters = useMemo(() => 
    statsForSeason
      .filter(s => s.points !== undefined)
      .sort((a, b) => (b.points || 0) - (a.points || 0)), 
    [statsForSeason]
  );

  const goalies = useMemo(() => 
    statsForSeason
      .filter(s => s.savePercentage !== undefined)
      .sort((a, b) => (b.savePercentage || 0) - (a.savePercentage || 0)),
    [statsForSeason]
  );

  if (seasons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seasonal Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No historical seasons found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Seasonal Stats</CardTitle>
        <Select value={selectedSeason} onValueChange={setSelectedSeason}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select a season..." />
          </SelectTrigger>
          <SelectContent>
            {sortedSeasons.map(season => (
              <SelectItem key={season} value={season}>{season}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Skaters</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>League</TableHead>
                  <TableHead className="text-right">GP</TableHead>
                  <TableHead className="text-right">G</TableHead>
                  <TableHead className="text-right">A</TableHead>
                  <TableHead className="text-right">P</TableHead>
                  <TableHead className="text-right">PIM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skaters.length > 0 ? skaters.map(stat => (
                  <TableRow key={`${stat.playerName}-${stat.season}-${stat.team}-${stat.league}`}>
                    <TableCell className="font-medium">{stat.playerName}</TableCell>
                    <TableCell>{stat.team}</TableCell>
                    <TableCell>{stat.league}</TableCell>
                    <TableCell className="text-right">{stat.gamesPlayed}</TableCell>
                    <TableCell className="text-right">{stat.goals}</TableCell>
                    <TableCell className="text-right">{stat.assists}</TableCell>
                    <TableCell className="text-right font-bold">{stat.points}</TableCell>
                    <TableCell className="text-right">{stat.penaltyMinutes}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No skater stats for this season.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Goalies</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>League</TableHead>
                  <TableHead className="text-right">GP</TableHead>
                  <TableHead className="text-right">GAA</TableHead>
                  <TableHead className="text-right">SV%</TableHead>
                  <TableHead className="text-right">SO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goalies.length > 0 ? goalies.map(stat => (
                  <TableRow key={`${stat.playerName}-${stat.season}-${stat.team}-${stat.league}`}>
                    <TableCell className="font-medium">{stat.playerName}</TableCell>
                    <TableCell>{stat.team}</TableCell>
                    <TableCell>{stat.league}</TableCell>
                    <TableCell className="text-right">{stat.gamesPlayed}</TableCell>
                    <TableCell className="text-right">{stat.goalsAgainstAverage?.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold">{stat.savePercentage?.toFixed(3)}</TableCell>
                    <TableCell className="text-right">{stat.shutouts}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No goalie stats for this season.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};