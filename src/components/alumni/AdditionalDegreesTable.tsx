import { Player } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from 'react-router-dom';

interface AdditionalDegreesTableProps {
  players: Player[];
}

export const AdditionalDegreesTable = ({ players }: AdditionalDegreesTableProps) => {
  const navigate = useNavigate();

  if (!players || players.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No players have enrolled in additional degrees yet.</p>;
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>New Eligibility</TableHead>
            <TableHead>Position</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id} onClick={() => navigate(`/player/${player.id}`)} className="cursor-pointer">
              <TableCell className="font-medium">{player.name}</TableCell>
              <TableCell>{player.age}</TableCell>
              <TableCell>{player.eligibility}</TableCell>
              <TableCell>{player.positions.join(', ')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};