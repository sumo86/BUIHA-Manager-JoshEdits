import { useParams, useNavigate } from "react-router-dom";
import { useTeam } from "@/context/TeamContext";
import { Player, SkaterAttributes, GoalieAttributes } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, AlertCircle } from "lucide-react";
import { PlayerHistoryTable } from "@/components/player/PlayerHistoryTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlayerEditForm } from "@/components/player/PlayerEditForm";
import { PlayerScoutingReport } from "@/components/player/PlayerScoutingReport";
import { useState, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PlayerProfile = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { teams, userTeam, updateTeam, alumni } = useTeam();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { player, team } = useMemo(() => {
    // Search active rosters first
    for (const t of teams) {
        const p = t.roster.find((pl) => pl.id === playerId);
        if (p) {
            return { player: p, team: t };
        }
    }
    // If not found, search alumni
    const alumniPlayer = alumni.find(p => p.id === playerId);
    if (alumniPlayer) {
        const lastTeamName = alumniPlayer.history.length > 0 ? alumniPlayer.history[alumniPlayer.history.length - 1].team : undefined;
        const lastTeam = lastTeamName ? teams.find(t => t.name === lastTeamName) : undefined;
        return { player: alumniPlayer, team: lastTeam || null };
    }

    return { player: undefined, team: undefined };
  }, [teams, playerId, alumni]);

  if (!player || !userTeam) {
    return <div>Player not found or user team not set.</div>;
  }

  const isUserPlayer = player && team?.name === userTeam.name;
  const isRetired = player.alumniStatus === 'Retired';

  const handleSaveChanges = (updatedPlayer: Partial<Player>) => {
    const newRoster = userTeam.roster.map((p) =>
      p.id === updatedPlayer.id ? { ...p, ...updatedPlayer } : p
    );
    updateTeam({ ...userTeam, roster: newRoster });
    setIsEditDialogOpen(false);
  };

  const isSkater = player.positions[0] !== 'G';
  const attributes = player.attributes;

  const renderAttribute = (label: string, value: number) => {
    const flooredValue = Math.floor(value);
    return (
        <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={`font-medium ${getAttributeColorClass(flooredValue)}`}>{flooredValue}</span>
        </div>
    );
  };

  const getAttributeColorClass = (value: number) => {
    if (value >= 17) return "text-green-700";
    if (value >= 13) return "text-green-500";
    if (value >= 9) return "text-yellow-500";
    if (value >= 5) return "text-orange-500";
    return "text-red-500";
  };

  const renderAttributeGrid = (attrs: (keyof SkaterAttributes | keyof GoalieAttributes)[]) => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      {attrs.map((attr) => (
        <div key={attr as string}>
          {renderAttribute(
            (attr as string).replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
            (player.attributes[attr as keyof typeof attributes] as number)
          )}
        </div>
      ))}
    </div>
  );

  const skaterPhysicalAttrs: (keyof SkaterAttributes)[] = ['acceleration', 'agility', 'balance', 'fighting', 'speed', 'stamina', 'strength', 'hitting'];
  const skaterMentalAttrs: (keyof SkaterAttributes)[] = ['aggression', 'bravery', 'determination', 'leadership', 'professionalism', 'teamPlayer', 'temperament'];
  const skaterOffensiveAttrs: (keyof SkaterAttributes)[] = ['gettingOpen', 'offensiveRead', 'passing', 'puckHandling', 'screening', 'shootingAccuracy', 'shootingRange'];
  const skaterDefensiveAttrs: (keyof SkaterAttributes)[] = ['checking', 'defensiveRead', 'faceoffs', 'positioning', 'shotBlocking', 'stickchecking'];
  const goalieAttrs: (keyof GoalieAttributes)[] = ['blocker', 'glove', 'lowShots', 'positioning', 'rebound', 'recovery', 'reflexes', 'passing', 'pokeCheck', 'puckHandling', 'skating', 'mentalToughness', 'goaltenderStamina'];
  const allUsedJerseyNumbers = userTeam.roster.map(p => p.jerseyNumber);
  const sortedRoles = isSkater ? Object.entries(player.roleSuitability).sort(([, a]: [string, number], [, b]: [string, number]) => b - a).slice(0, 5) : [];

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex items-center gap-4">
                {team?.logo && <img src={team.logo} alt={team.name} className="h-16 w-16 object-contain" />}
                <div>
                    <CardTitle className="text-5xl font-extrabold leading-none tracking-tight">
                        {player.name}
                        {player.captaincy === 'C' && <span className="ml-4 text-yellow-700">C</span>}
                        {player.captaincy === 'A' && <span className="ml-4 text-yellow-500">A</span>}
                    </CardTitle>
                    <p className="text-4xl font-bold text-primary mt-2">#{player.jerseyNumber}</p>
                    <p className="text-muted-foreground text-lg mt-1">{player.positions.join(", ")} | {player.age} years old | {player.nationality}</p>
                </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                {isUserPlayer && !isRetired && (
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild><Button variant="outline" size="icon"><Edit className="h-4 w-4" /></Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Edit {player.name}</DialogTitle></DialogHeader>
                            <PlayerEditForm player={player} onSave={handleSaveChanges} allUsedJerseyNumbers={allUsedJerseyNumbers} />
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </CardHeader>
      </Card>

      {isRetired && (
        <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Retired</AlertTitle>
            <AlertDescription>
                This player has retired from university hockey. Their stats are preserved for historical purposes.
            </AlertDescription>
        </Alert>
      )}

      {player.injury && (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Injured</AlertTitle>
            <AlertDescription>
                {player.injury.type} - Out for {player.injury.duration} more week(s).
            </AlertDescription>
        </Alert>
      )}

      {isUserPlayer && !isRetired && team && <PlayerScoutingReport player={player} team={team} />}

      <Card>
        <CardHeader><CardTitle>Career Statistics</CardTitle></CardHeader>
        <CardContent>
            <PlayerHistoryTable 
                history={player.history || []} 
                isSkater={isSkater} 
                teams={teams}
                currentStats={player.currentStats}
            />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isSkater ? (
          <>
            <Card><CardHeader><CardTitle>Physical</CardTitle></CardHeader><CardContent>{renderAttributeGrid(skaterPhysicalAttrs)}</CardContent></Card>
            <Card><CardHeader><CardTitle>Mental</CardTitle></CardHeader><CardContent>{renderAttributeGrid(skaterMentalAttrs)}</CardContent></Card>
            <Card><CardHeader><CardTitle>Offensive</CardTitle></CardHeader><CardContent>{renderAttributeGrid(skaterOffensiveAttrs)}</CardContent></Card>
            <Card><CardHeader><CardTitle>Defensive</CardTitle></CardHeader><CardContent>{renderAttributeGrid(skaterDefensiveAttrs)}</CardContent></Card>
          </>
        ) : (
          <Card className="md:col-span-2 lg:col-span-4"><CardHeader><CardTitle>Goaltending</CardTitle></CardHeader><CardContent>{renderAttributeGrid(goalieAttrs)}</CardContent></Card>
        )}
      </div>

      {isSkater && (
        <Card>
          <CardHeader><CardTitle>Top Role Suitability</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {sortedRoles.map(([role, suitability]: [string, number]) => (
              <div key={role} className="flex items-center justify-between text-sm">
                <span className="font-medium">{role}</span>
                <span className={`font-bold ${getAttributeColorClass(suitability)}`}>{suitability}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlayerProfile;