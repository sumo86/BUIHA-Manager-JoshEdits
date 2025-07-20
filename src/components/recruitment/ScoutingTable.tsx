import { useTeam } from '@/context/TeamContext';
import { Player } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ScoutingTableProps {
  data: Player[];
  isTransferPortal?: boolean;
}

const qualityColorMap: { [key in Player['estimatedQuality'] | 'default']: string } = {
  'Beginner': 'bg-gray-500',
  'Moderate': 'bg-blue-500',
  'Intermediate': 'bg-green-500',
  'Experienced': 'bg-purple-500',
  'Elite': 'bg-yellow-500 text-black',
  'default': 'bg-gray-400',
};

export const ScoutingTable = ({ data, isTransferPortal = false }: ScoutingTableProps) => {
  const { recruitPlayer, signPlayerFromTransferPool, userTeam, managedTeams } = useTeam();

  const handleAction = (player: Player) => {
    if (isTransferPortal) {
      if (userTeam) {
        // For transfers, default to the primary team of the organization if multiple exist
        const targetTeam = managedTeams.length > 0 ? managedTeams[0] : userTeam;
        signPlayerFromTransferPool(player.id, targetTeam.name);
      }
    } else {
      recruitPlayer(player.id);
    }
  };

  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No players to display.</p>;
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>{isTransferPortal ? 'Source' : 'Est. Quality'}</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((player) => (
            <TableRow key={player.id}>
              <TableCell className="font-medium">{player.name}</TableCell>
              <TableCell>{player.age}</TableCell>
              <TableCell>{player.positions.join(', ')}</TableCell>
              <TableCell>
                {isTransferPortal ? (
                  player.source || 'N/A'
                ) : (
                  <Badge className={`${qualityColorMap[player.estimatedQuality || 'default']} hover:${qualityColorMap[player.estimatedQuality || 'default']}`}>
                    {player.estimatedQuality || 'N/A'}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {isTransferPortal ? 'Free' : `£${player.recruitmentCost?.toLocaleString() || 500}`}
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" onClick={() => handleAction(player)}>
                  {isTransferPortal ? 'Sign' : 'Recruit'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};