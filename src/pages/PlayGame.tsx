import { useTeam } from '@/context/TeamContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { validateLineup } from '@/lib/lineupValidation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarIcon } from 'lucide-react';

const PlayGame = () => {
  const { teams, userTeam, gameForCurrentWeek } = useTeam();
  const navigate = useNavigate();
  const { toast } = useToast();

  const opponents = teams.filter(team => team.name !== userTeam?.name);

  const handlePlayGame = (opponentName: string) => {
    if (!userTeam) return;
    const validationError = validateLineup(userTeam);

    if (validationError) {
      toast({
        variant: "destructive",
        title: "Lineup Error",
        description: validationError,
      });
      return;
    }

    navigate(`/game/${encodeURIComponent(opponentName)}`);
  };

  return (
    <div className="space-y-6">
      {gameForCurrentWeek ? (
        <Card>
          <CardHeader>
            <CardTitle>Next Official Match</CardTitle>
            <CardDescription>
              You have a scheduled game this week. You can play it now or it will be auto-simulated when you advance the week.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CalendarIcon className="h-4 w-4" />
              <AlertTitle>
                League Match vs {gameForCurrentWeek.opponent}
              </AlertTitle>
              <AlertDescription className="flex justify-between items-center">
                <p>
                  {gameForCurrentWeek.date.month}, Week {gameForCurrentWeek.date.week}
                </p>
                <Button onClick={() => handlePlayGame(gameForCurrentWeek.opponent)}>Play Game</Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Game This Week</CardTitle>
            <CardDescription>
              You have no official game scheduled. Feel free to play a friendly match.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Play a Friendly Match</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">Select an opponent to play a friendly match against.</p>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>League Division</TableHead>
                  <TableHead>Nationals Division</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opponents.map(team => (
                  <TableRow key={team.name}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.leagueDivision}</TableCell>
                    <TableCell>{team.nationalsDivision}</TableCell>
                    <TableCell className="text-right">
                      <Button onClick={() => handlePlayGame(team.name)}>Play Friendly</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayGame;