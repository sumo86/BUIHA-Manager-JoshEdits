import { useTeam } from '@/context/TeamContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PlayGame = () => {
  const { teams, userTeam } = useTeam();
  const navigate = useNavigate();

  const opponents = teams.filter(team => team.name !== userTeam.name);

  const handlePlayGame = (opponentName: string) => {
    navigate(`/game/${encodeURIComponent(opponentName)}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Play a Game</CardTitle>
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
                    <Button onClick={() => handlePlayGame(team.name)}>Play Game</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayGame;