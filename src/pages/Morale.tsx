import { useTeam } from '@/context/TeamContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Player } from '@/types';

const Morale = () => {
  const { userTeam, runStudentLifeInitiative } = useTeam();

  if (!userTeam) {
    return <div>Please select a team first.</div>;
  }

  const getMoraleVariant = (morale: Player['morale']): "default" | "secondary" | "destructive" | "outline" => {
    switch (morale) {
      case 'Happy': return 'default';
      case 'Content': return 'secondary';
      case 'Unhappy': return 'outline';
      case 'Angry': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Morale Management</CardTitle>
          <CardDescription>
            Boost team spirits by organizing events. Good morale can lead to better on-ice performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Run a student life initiative to improve the morale of every player on the team.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={runStudentLifeInitiative}>
            Run Student Life Initiative (£500)
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Player Morale</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="text-right">Morale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userTeam.roster.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{player.positions.join(', ')}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getMoraleVariant(player.morale)}>
                      {player.morale}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Morale;