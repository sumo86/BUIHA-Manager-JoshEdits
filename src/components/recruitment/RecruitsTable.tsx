import { useTeam } from '@/context/TeamContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Player } from '@/types';
import { calculateStarRating } from '@/lib/playerGenerator';
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlayerScoutingReport } from '@/components/player/PlayerScoutingReport';

export const RecruitsTable = () => {
  const { recruitedPool, assignPlayerToRoster, discardRecruit, userTeam } = useTeam();

  const playersWithStarRating = useMemo(() => {
    if (!userTeam) return [];
    return recruitedPool.map(player => {
      const isSkater = !player.positions.includes('G');
      const starRating = calculateStarRating(player.currentAbility, isSkater, userTeam.leagueDivision);
      return { ...player, starRating };
    }).sort((a, b) => b.starRating - a.starRating);
  }, [recruitedPool, userTeam]);

  if (playersWithStarRating.length === 0) {
    return <p className="text-muted-foreground">No players have been recruited yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Age</TableHead>
          <TableHead>Star Rating</TableHead>
          <TableHead>Recruitment Cost</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {playersWithStarRating.map((player: Player) => (
          <TableRow key={player.id}>
            <TableCell className="font-medium">{player.name}</TableCell>
            <TableCell>{player.positions.join(', ')}</TableCell>
            <TableCell>{player.age}</TableCell>
            <TableCell>{player.starRating.toFixed(1)} ⭐</TableCell>
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
                  <PlayerScoutingReport player={player} />
                </DialogContent>
              </Dialog>
              <Button onClick={() => assignPlayerToRoster(player.id)} size="sm">Assign to Roster</Button>
              <Button variant="destructive" onClick={() => discardRecruit(player.id)} size="sm">Discard</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};