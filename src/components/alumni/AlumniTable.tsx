import { Player } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getPlayerLastTeam } from '@/lib/playerUtils';

interface AlumniTableProps {
  alumni: Player[];
}

export const AlumniTable = ({ alumni }: AlumniTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Last Team</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alumni.length > 0 ? (
            alumni.map(player => (
              <TableRow key={player.id}>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell>{player.age}</TableCell>
                <TableCell>{getPlayerLastTeam(player)}</TableCell>
                <TableCell>{player.alumniStatus}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No alumni found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};