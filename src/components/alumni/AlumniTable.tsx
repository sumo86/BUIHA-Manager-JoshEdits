import { Player } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom'; // Import Link

interface AlumniTableProps {
  alumni: Player[];
}

export const AlumniTable = ({ alumni }: AlumniTableProps) => {
  if (!alumni || alumni.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Alumni Yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">As your players graduate or retire, they will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alumni Players</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Last Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Career Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alumni.map(player => {
              const careerPoints = player.history.reduce((sum, season) => sum + (season.points || 0), 0);
              return (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">
                    <Link to={`/player/${player.id}`} className="text-blue-600 hover:underline">
                      {player.name}
                    </Link>
                  </TableCell>
                  <TableCell>{player.history[player.history.length - 1]?.team || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={player.alumniStatus === 'Retired' ? 'destructive' : 'secondary'}>
                      {player.alumniStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">{careerPoints}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};