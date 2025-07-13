import { Player } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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
              <TableHead>Status</TableHead>
              <TableHead>Last Team</TableHead>
              <TableHead>Last Season</TableHead>
              <TableHead className="text-right">GP</TableHead>
              <TableHead className="text-right">G</TableHead>
              <TableHead className="text-right">A</TableHead>
              <TableHead className="text-right">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alumni.map(player => {
              const careerStats = player.history.reduce((acc, season) => {
                acc.gp += season.gamesPlayed || 0;
                acc.g += season.goals || 0;
                acc.a += season.assists || 0;
                acc.p += season.points || 0;
                return acc;
              }, { gp: 0, g: 0, a: 0, p: 0 });

              const lastSeason = player.history[player.history.length - 1];

              return (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">
                    {player.alumniStatus === 'Active Elsewhere' ? (
                      <Button variant="link" asChild className="p-0 h-auto">
                        <Link to={`/player/${player.id}`}>{player.name}</Link>
                      </Button>
                    ) : (
                      player.name
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={player.alumniStatus === 'Retired' ? 'destructive' : 'secondary'}>
                      {player.alumniStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{lastSeason?.team || 'N/A'}</TableCell>
                  <TableCell>{lastSeason?.season || 'N/A'}</TableCell>
                  <TableCell className="text-right">{careerStats.gp}</TableCell>
                  <TableCell className="text-right">{careerStats.g}</TableCell>
                  <TableCell className="text-right">{careerStats.a}</TableCell>
                  <TableCell className="text-right font-bold">{careerStats.p}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};