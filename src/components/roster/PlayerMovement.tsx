import { useState, useMemo } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Player, Team } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface PlayerMovementProps {
  player: Player;
}

export const PlayerMovement = ({ player }: PlayerMovementProps) => {
  const { teams, userTeam, managedTeams, requestPlayerTransfer, isManagingOrg } = useTeam();
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const availableTeams = useMemo(() => {
    if (!userTeam) return [];
    if (isManagingOrg) {
      // If managing an organization, allow transfers between all managed teams
      return managedTeams.filter(t => t.name !== userTeam.name);
    } else {
      // If managing a single team, allow transfers to any other team in the game
      return teams.filter(t => t.name !== userTeam.name);
    }
  }, [teams, userTeam, managedTeams, isManagingOrg]);

  const handleTransfer = () => {
    if (!userTeam || !selectedTeam) {
      toast.error("Please select a team to transfer to.");
      return;
    }
    requestPlayerTransfer(player.id, userTeam.name, selectedTeam);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Transfer {player.name}</h3>
      <div className="flex items-center space-x-2">
        <Select value={selectedTeam} onValueChange={(value: string) => setSelectedTeam(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select team to transfer to" />
          </SelectTrigger>
          <SelectContent>
            {availableTeams.map((team: Team) => (
              <SelectItem key={team.id} value={team.name}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleTransfer} disabled={!selectedTeam}>Request Transfer</Button>
      </div>
    </div>
  );
};