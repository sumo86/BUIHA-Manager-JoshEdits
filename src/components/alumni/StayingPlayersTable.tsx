import { Player } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface StayingPlayersTableProps {
  players: Player[];
}

export const StayingPlayersTable = ({ players }: StayingPlayersTableProps) => {
  if (!players || players.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Staying Players</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No players re-enrolled for a new degree this offseason.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Players Staying for a New Degree</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>New Eligibility</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map(player => (
              <TableRow key={player.id}>
                <TableCell className="font-medium">
                  <Button variant="link" asChild className="p-0 h-auto">
                    <Link to={`/player/${player.id}`}>{player.name}</Link>
                  </Button>
                </TableCell>
                <TableCell>{player.eligibility}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};