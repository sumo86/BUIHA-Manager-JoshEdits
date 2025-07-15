import { useTeam } from '@/context/TeamContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Player } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlayerScoutingReport } from '@/components/player/PlayerScoutingReport';

interface ScoutingTableProps {
  data: Player[];
}

export const ScoutingTable = ({ data }: ScoutingTableProps) => {
  const { recruitPlayer, userTeam } = useTeam();
  const recruitingBudget = userTeam.financials.budgetAllocations.Recruiting;

  if (data.length === 0) {
    return <p className="text-muted-foreground">No players match the current filters.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Age</TableHead>
          <TableHead>Estimated Quality</TableHead>
          <TableHead>Recruitment Cost</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((player: Player) => (
          <TableRow key={player.id}>
            <TableCell className="font-medium">{player.name}</TableCell>
            <TableCell>{player.positions.join(', ')}</TableCell>
            <TableCell>{player.age}</TableCell>
            <TableCell>{player.estimatedQuality}</TableCell>
            <TableCell>£{player.recruitmentCost?.toLocaleString() || 'N/A'}</TableCell>
            <TableCell className="text-right space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">View Report</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Scouting Report: {player.name}</DialogTitle>
                  </DialogHeader>
                  <PlayerScoutingReport player={player} team={userTeam} />
                </DialogContent>
              </Dialog>
              <Button 
                onClick={() => recruitPlayer(player.id)} 
                size="sm" 
                disabled={(player.recruitmentCost || 0) > recruitingBudget}
              >
                Recruit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};