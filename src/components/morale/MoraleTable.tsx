import { Player } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MoraleTableProps {
  players: Player[];
  teamWins: number;
  teamLosses: number;
}

const getMoraleReason = (morale: Player['morale'], teamWins: number, teamLosses: number): string => {
  const totalGames = teamWins + teamLosses;
  const winPercentage = totalGames > 0 ? teamWins / totalGames : 0.5;

  switch (morale) {
    case 'Happy':
      return winPercentage > 0.6 ? "Thrilled with the team's winning record." : "Feeling positive and motivated.";
    case 'Content':
      return "Generally satisfied with the team's situation.";
    case 'Unhappy':
      return winPercentage < 0.4 ? "Concerned about the team's recent losses." : "Feeling unsettled about team performance.";
    case 'Angry':
      return "Frustrated with the lack of success on the ice.";
    default:
      return "No specific reason.";
  }
};

const moraleVariantMap: { [key in Player['morale']]: "default" | "destructive" | "outline" | "secondary" } = {
    'Happy': 'default',
    'Content': 'secondary',
    'Unhappy': 'outline',
    'Angry': 'destructive'
};

const moraleColorClass: { [key in Player['morale']]: string } = {
    'Happy': 'bg-green-500 hover:bg-green-600',
    'Content': 'bg-blue-500 hover:bg-blue-600',
    'Unhappy': 'bg-yellow-500 text-black hover:bg-yellow-600',
    'Angry': 'bg-red-600 hover:bg-red-700'
}

export const MoraleTable = ({ players, teamWins, teamLosses }: MoraleTableProps) => {
  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="rounded-lg border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="hidden md:table-cell">Position</TableHead>
                    <TableHead>Morale</TableHead>
                    <TableHead>Reason</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedPlayers.map((player) => (
                    <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{player.positions.join(', ')}</TableCell>
                        <TableCell>
                            <Badge variant={moraleVariantMap[player.morale]} className={cn("text-white", moraleColorClass[player.morale])}>
                                {player.morale}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {getMoraleReason(player.morale, teamWins, teamLosses)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  );
};