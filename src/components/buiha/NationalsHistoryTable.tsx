import { TeamSeasonHistory } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NationalsHistoryTableProps {
  standings: TeamSeasonHistory[];
}

export const NationalsHistoryTable = ({ standings }: NationalsHistoryTableProps) => {
  if (!standings || standings.length === 0) {
    return null;
  }

  const sortedStandings = [...standings].sort((a, b) => {
    if (a.nationalsResult === 'Winner' && b.nationalsResult !== 'Winner') return -1;
    if (b.nationalsResult === 'Winner' && a.nationalsResult !== 'Winner') return 1;
    return a.teamName.localeCompare(b.teamName);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nationals Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStandings.map(team => (
              <TableRow key={team.teamName}>
                <TableCell className="font-medium">{team.teamName}</TableCell>
                <TableCell>{team.nationalsResult}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};