import { useMemo } from 'react';
import { Player, PlayerSeasonStats, Team } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import clsx from 'clsx';

interface PlayerHistoryTableProps {
  history: PlayerSeasonStats[];
  isSkater: boolean;
  teams: Team[];
  currentStats: PlayerSeasonStats[];
}

export const PlayerHistoryTable = ({ history, isSkater, teams, currentStats }: PlayerHistoryTableProps) => {
  const leagueHistory = useMemo(() => history.filter(s => s.league !== 'Nationals'), [history]);
  const nationalsHistory = useMemo(() => history.filter(s => s.league === 'Nationals'), [history]);

  const allLeagueStats = useMemo(() => 
    // Changed sorting order: a.season.localeCompare(b.season) for oldest to newest
    [...currentStats.filter(s => s.league !== 'Nationals'), ...leagueHistory].sort((a, b) => a.season.localeCompare(b.season)),
    [currentStats, leagueHistory]
  );

  const allNationalsStats = useMemo(() =>
    // Changed sorting order: a.season.localeCompare(b.season) for oldest to newest
    [...currentStats.filter(s => s.league === 'Nationals'), ...nationalsHistory].sort((a, b) => a.season.localeCompare(b.season)),
    [currentStats, nationalsHistory]
  );

  const renderTable = (stats: PlayerSeasonStats[]) => {
    if (stats.length === 0) {
      return <p className="text-center text-muted-foreground py-4">No stats available for this competition.</p>;
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Season</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>League</TableHead>
              <TableHead className="text-right">GP</TableHead>
              {isSkater ? (
                <>
                  <TableHead className="text-right">G</TableHead>
                  <TableHead className="text-right">A</TableHead>
                  <TableHead className="text-right">P</TableHead>
                  <TableHead className="text-right">PIM</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="text-right">GAA</TableHead>
                  <TableHead className="text-right">SV%</TableHead>
                  <TableHead className="text-right">SO</TableHead>
                </>
              )}
              <TableHead className="text-center">C/A</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((s, index) => {
              const teamLogo = teams.find(t => t.name === s.team)?.logo;
              return (
                <TableRow key={`${s.season}-${s.team}-${index}`}>
                  <TableCell className="font-medium">{s.season}</TableCell>
                  <TableCell className="flex items-center">
                    {teamLogo && <img src={teamLogo} alt={s.team} className="h-6 w-6 mr-2 object-contain" />}
                    {s.team}
                  </TableCell>
                  <TableCell>{s.league}</TableCell>
                  <TableCell className="text-right">{s.gamesPlayed}</TableCell>
                  {isSkater ? (
                    <>
                      <TableCell className="text-right">{s.goals}</TableCell>
                      <TableCell className="text-right">{s.assists}</TableCell>
                      <TableCell className="text-right font-bold">{s.points}</TableCell>
                      <TableCell className="text-right">{s.penaltyMinutes}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-right">{s.goalsAgainstAverage?.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold">{s.savePercentage?.toFixed(3)}</TableCell>
                      <TableCell className="text-right">{s.shutouts}</TableCell>
                    </>
                  )}
                  <TableCell className="text-center">
                    {s.captaincy ? (
                      <span className={clsx({
                        "font-bold text-yellow-700": s.captaincy === 'C',
                        "font-medium text-yellow-500": s.captaincy === 'A',
                      })}>
                        {s.captaincy}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Tabs defaultValue="league" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="league">League History</TabsTrigger>
        <TabsTrigger value="nationals">Nationals History</TabsTrigger>
      </TabsList>
      <TabsContent value="league" className="pt-4">
        {renderTable(allLeagueStats)}
      </TabsContent>
      <TabsContent value="nationals" className="pt-4">
        {renderTable(allNationalsStats)}
      </TabsContent>
    </Tabs>
  );
};