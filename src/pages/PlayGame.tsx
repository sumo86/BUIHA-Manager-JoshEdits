import { useTeam } from '@/context/TeamContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Player } from '@/types';

const PlayGame = () => {
  const { teams, userTeam } = useTeam();
  const navigate = useNavigate();
  const { toast } = useToast();

  const opponents = teams.filter(team => team.name !== userTeam.name);

  const validateLineup = (roster: Player[], lineup: typeof userTeam.lineup) => {
    let missingPlayers: string[] = [];
    let staffCount = 0;

    const assignedPlayerIds = new Set<string>();
    const getPlayerById = (id: string | null) => id ? roster.find(p => p.id === id) : undefined;

    // Count assigned players and staff
    const checkAndAddPlayer = (playerId: string | null) => {
      if (playerId) {
        assignedPlayerIds.add(playerId);
        const player = getPlayerById(playerId);
        if (player && player.eligibility === 'Staff') {
          staffCount++;
        }
      }
    };

    lineup.forwards.lw.forEach(checkAndAddPlayer);
    lineup.forwards.c.forEach(checkAndAddPlayer);
    lineup.forwards.rw.forEach(checkAndAddPlayer);
    lineup.defence.ld.forEach(checkAndAddPlayer);
    lineup.defence.rd.forEach(checkAndAddPlayer);
    checkAndAddPlayer(lineup.goalies.starter);
    checkAndAddPlayer(lineup.goalies.backup);

    const assignedForwards = lineup.forwards.lw.filter(Boolean).length +
                             lineup.forwards.c.filter(Boolean).length +
                             lineup.forwards.rw.filter(Boolean).length;
    const assignedDefense = lineup.defence.ld.filter(Boolean).length +
                            lineup.defence.rd.filter(Boolean).length;
    const assignedGoalies = (lineup.goalies.starter ? 1 : 0) + (lineup.goalies.backup ? 1 : 0);

    if (assignedForwards < 9) missingPlayers.push('9 Forwards');
    if (assignedDefense < 6) missingPlayers.push('6 Defensemen');
    if (assignedGoalies < 2) missingPlayers.push('2 Goalies');

    if (staffCount > 2) {
      return `You have ${staffCount} staff members in your lineup. You can only have a maximum of 2.`;
    }

    if (missingPlayers.length > 0) {
      return `Your lineup is incomplete. You need: ${missingPlayers.join(', ')}.`;
    }

    return null; // Lineup is valid
  };

  const handlePlayGame = (opponentName: string) => {
    const validationError = validateLineup(userTeam.roster, userTeam.lineup);

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