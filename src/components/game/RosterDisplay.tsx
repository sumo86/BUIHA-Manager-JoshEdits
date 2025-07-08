import { Player } from '@/types';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RosterDisplayProps {
  players: Player[];
}

export const RosterDisplay = ({ players }: RosterDisplayProps) => {
  return (
    <ScrollArea className="h-[450px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Pos</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Elig.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map(player => (
            <TableRow key={player.id}>
              <TableCell>{player.jerseyNumber}</TableCell>
              <TableCell className="font-medium">{player.name}</TableCell>
              <TableCell>{player.positions.join(', ')}</TableCell>
              <TableCell>{player.age}</TableCell>
              <TableCell>{player.starRating.toFixed(1)}</TableCell>
              <TableCell>{player.eligibility}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};