import { NationalsTournament } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NationalsScheduleProps {
  tournament: NationalsTournament;
  userTeamName: string | undefined;
  onPlayGame: (gameId: string) => void;
  onSimulateGame: (gameId: string) => void;
}

const NationalsSchedule = ({ tournament, userTeamName, onPlayGame, onSimulateGame }: NationalsScheduleProps) => {
  const gamesThisRound = tournament.groupStageSchedule.filter(g => g.round === tournament.currentRound);

  if (gamesThisRound.length === 0) {
    return (
        <Card className="col-span-2">
            <CardHeader><CardTitle>Tournament Schedule</CardTitle></CardHeader>
            <CardContent><p>All group stage games have been played.</p></CardContent>
        </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Tournament Schedule - Round {tournament.currentRound}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Home</TableHead>
              <TableHead>Away</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gamesThisRound.map((game: any) => {
              const isUserGame = userTeamName && (game.homeTeam === userTeamName || game.awayTeam === userTeamName);
              return (
                <TableRow key={game.id}>
                  <TableCell>{game.homeTeam}</TableCell>
                  <TableCell>{game.awayTeam}</TableCell>
                  <TableCell className="text-right">
                    {isUserGame ? (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={() => onPlayGame(game.id)}>Play</Button>
                        <Button size="sm" variant="secondary" onClick={() => onSimulateGame(game.id)}>Sim</Button>
                      </div>
                    ) : (
                      <Badge variant="outline">AI Match</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default NationalsSchedule;