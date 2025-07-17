import { Player } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom'; // Import Link

interface AdditionalDegreesTableProps {
  players: Player[];
}

export const AdditionalDegreesTable = ({ players }: AdditionalDegreesTableProps) => {
  if (!players || players.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Players Pursuing Additional Degrees</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Players who graduate and stay with the team for a Masters or PhD will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Players Pursuing Additional Degrees</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Years Left</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map(player => (
              <TableRow key={player.id}>
                <TableCell className="font-medium">
                  <Link to={`/player/${player.id}`} className="text-blue-600 hover:underline">
                    {player.name}
                  </Link>
                </TableCell>
                <TableCell>{player.eligibility}</TableCell>
                <TableCell>{player.yearsLeftInProgram}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};