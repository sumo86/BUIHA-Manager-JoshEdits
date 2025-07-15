import { useParams } from 'react-router-dom';
import { useTeam } from '@/context/TeamContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { PlayerEditForm } from '@/components/player/PlayerEditForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlayerMovement } from '@/components/roster/PlayerMovement';
import { PlayerHistoryTable } from '@/components/player/PlayerHistoryTable';
import { DevelopmentLogTable } from '@/components/training/DevelopmentLogTable';
import { PlayerScoutingReport } from '@/components/player/PlayerScoutingReport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMemo } from 'react';
import { Player } from '@/types';
import { toast } from 'sonner';

const PlayerProfile = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const { userTeam, developmentHistory, updateTeam, teams } = useTeam(); // Destructure 'teams' here

  const player = useMemo(() => {
    return userTeam?.roster.find(p => p.id === playerId);
  }, [userTeam, playerId]);

  const playerDevelopmentLogs = useMemo(() => {
    return developmentHistory.filter(log => log.playerId === playerId);
  }, [developmentHistory, playerId]);

  const allUsedJerseyNumbers = useMemo(() => new Set(userTeam?.roster.map(p => p.jerseyNumber)), [userTeam?.roster]);

  const handleSavePlayer = (updatedPlayer: Player) => {
    if (!userTeam) return;
    const newRoster = userTeam.roster.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
    updateTeam({ ...userTeam, roster: newRoster });
    toast.success(`${updatedPlayer.name} has been updated.`);
  };

  if (!userTeam || !player) {
    return <div>Player not found.</div>;
  }

  const isSkater = !player.positions.includes('G');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{player.name} <span className="text-muted-foreground text-xl">#{player.jerseyNumber}</span></h1>
          <p className="text-muted-foreground">
            {player.positions.join(', ')} | {player.age} years old | {player.eligibility} | {player.nationality}
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Edit Player</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit {player.name}</DialogTitle>
            </DialogHeader>
            {/* Fix 1: Convert Set to Array */}
            <PlayerEditForm player={player} onSave={handleSavePlayer} allUsedJerseyNumbers={Array.from(allUsedJerseyNumbers)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Key Info</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Current Ability:</strong> {player.currentAbility.toFixed(2)}</p>
            <p><strong>Potential Ability:</strong> {player.potentialAbility.toFixed(2)}</p>
            <p><strong>Star Rating:</strong> {player.starRating.toFixed(1)} ⭐</p>
            <p><strong>Health Status:</strong> {player.healthStatus} {player.injury && `(Out for ${player.injury.duration} weeks)`}</p>
            <p><strong>Morale:</strong> {player.morale}</p>
            <p><strong>Role:</strong> {player.role}</p>
            <p><strong>Training Focus:</strong> {player.trainingFocus || 'None'}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Attributes</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {Object.entries(player.attributes).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                    <TableCell className="text-right">{typeof value === 'number' ? value.toFixed(2) : value}</TableCell>
                    <TableCell className="w-[150px]">
                      {typeof value === 'number' && value <= 20 && <Progress value={(value / 20) * 100} className="h-2" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stats">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
          <TabsTrigger value="scouting">Scouting Report</TabsTrigger>
        </TabsList>
        <Card className="mt-2">
          <CardContent className="p-4">
            <TabsContent value="stats">
              {/* Fix 2: Pass missing props */}
              <PlayerHistoryTable history={player.history} currentStats={player.currentStats} isSkater={isSkater} teams={teams} />
            </TabsContent>
            <TabsContent value="development">
              <ScrollArea className="h-[400px] w-full">
                <DevelopmentLogTable logs={playerDevelopmentLogs} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="scouting">
              <PlayerScoutingReport player={player} team={userTeam} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <Card>
        <CardHeader><CardTitle>Player Actions</CardTitle></CardHeader>
        <CardContent>
          <PlayerMovement player={player} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerProfile;