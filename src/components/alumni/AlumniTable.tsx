import { Player } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface AlumniTableProps {
  alumni: Player[];
}

export const AlumniTable = ({ alumni }: AlumniTableProps) => {
  const navigate = useNavigate();

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
            {alumni.map(player => (
              <TableRow key={player.id}>
                <TableCell 
                  className="font-medium cursor-pointer hover:underline"
                  onClick={() => navigate(`/player/${player.id}`)}
                >
                  {player.name}
                </TableCell>
                <TableCell>{player.alumniStatus}</TableCell>
                <TableCell>{player.history[player.history.length - 1]?.team || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};