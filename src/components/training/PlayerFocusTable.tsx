import { useMemo, useState } from 'react';
import { Player, TrainingFocus } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trainingFocusesMap } from '@/data/trainingFocuses';
import { useTeam } from '@/context/TeamContext';
import { toast } from 'sonner';

type PlayerWithTeamInfo = Player & {
  teamName: string;
};

const PlayerFocusTable = ({ players }: { players: PlayerWithTeamInfo[] }) => {
  const { updatePlayerTrainingFocus } = useTeam();
  const [selectedFocus, setSelectedFocus] = useState<string>('All');

  const handleFocusChange = (playerId: string, newFocus: string) => {
    updatePlayerTrainingFocus(playerId, newFocus as TrainingFocus);
  };

  const filteredPlayers = useMemo(() => {
    if (selectedFocus === 'All') {
      return players;
    }
    return players.filter(player => player.trainingFocus === selectedFocus);
  }, [players, selectedFocus]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select onValueChange={setSelectedFocus} defaultValue="All">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Focus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Focuses</SelectItem>
            {Object.keys(trainingFocusesMap).map((focus: string) => ( 
              <SelectItem key={focus} value={focus}>
                {focus}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Current Focus</TableHead>
              <TableHead>Change Focus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map(player => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{player.teamName}</TableCell>
                  <TableCell>{player.trainingFocus}</TableCell>
                  <TableCell>
                    <Select onValueChange={(value) => handleFocusChange(player.id, value)} value={player.trainingFocus}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Focus" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(trainingFocusesMap).map((focus: string) => ( 
                          <SelectItem key={focus} value={focus}>
                            {focus}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No players found matching the selected criteria.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PlayerFocusTable;