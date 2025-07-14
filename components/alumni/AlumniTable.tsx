import { Player } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
            {alumni.map(player => {
              const careerPoints = player.history.reduce((sum, season) => sum + (season.points || 0), 0);
              return (
                <TableRow key={player.id} onClick={() => navigate(`/player/${player.id}`)} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{player.name}</TableCell>
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