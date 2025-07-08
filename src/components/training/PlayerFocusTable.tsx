import { Player, TrainingFocus } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { skaterFocuses, goalieFocuses } from "@/data/trainingFocuses";
import { Star } from "lucide-react";

interface PlayerFocusTableProps {
  players: Player[];
  onFocusChange: (playerId: string, focus: TrainingFocus) => void;
}

export const PlayerFocusTable = ({ players, onFocusChange }: PlayerFocusTableProps) => {
  const sortedPlayers = [...players].sort((a, b) => {
    const aIsGoalie = a.positions.includes('G');
    const bIsGoalie = b.positions.includes('G');
    if (aIsGoalie && !bIsGoalie) return 1;
    if (!aIsGoalie && bIsGoalie) return -1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead className="w-[250px]">Training Focus</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlayers.map((player) => {
            const isGoalie = player.positions.includes('G');
            const applicableFocuses = isGoalie ? goalieFocuses : skaterFocuses;
            
            return (
              <TableRow key={player.id}>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell>{player.age}</TableCell>
                <TableCell className="flex items-center">
                  {player.starRating.toFixed(1)} <Star className="h-4 w-4 ml-1 text-yellow-400 fill-yellow-400" />
                </TableCell>
                <TableCell>
                  <Select
                    value={player.trainingFocus || "None"}
                    onValueChange={(value) => onFocusChange(player.id, value === "None" ? null : value as TrainingFocus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a focus..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      {applicableFocuses.map(focus => (
                        <SelectItem key={focus} value={focus!}>{focus}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};