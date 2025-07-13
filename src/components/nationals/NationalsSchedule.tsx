import { NationalsTournament } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface NationalsScheduleProps {
  tournament: NationalsTournament;
}

const NationalsSchedule = ({ tournament }: NationalsScheduleProps) => {
  const allGames = [...tournament.groupStageSchedule, ...tournament.playoffSchedule.map(p => ({...p, isPlayoff: true}))]
    .sort((a, b) => {
        if (a.date.week !== b.date.week) return a.date.week - b.date.week;
        return 0; // keep original order within a week
    });

  if (allGames.length === 0) {
    return null;
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Tournament Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Week</TableHead>
              <TableHead>Home</TableHead>
              <TableHead>Away</TableHead>
              <TableHead className="text-right">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allGames.map((game: any) => (
              <TableRow key={game.id}>
                <TableCell>May, Week {game.date.week}</TableCell>
                <TableCell>{typeof game.homeTeam === 'object' ? `Winner of ${game.homeTeam.winnerOf}` : game.homeTeam}</TableCell>
                <TableCell>{typeof game.awayTeam === 'object' ? `Winner of ${game.awayTeam.winnerOf}` : game.awayTeam}</TableCell>
                <TableCell className="text-right">
                  {game.status === 'completed' && game.result ? (
                    `${game.result.homeScore} - ${game.result.awayScore}`
                  ) : (
                    <Badge variant="outline">Scheduled</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default NationalsSchedule;