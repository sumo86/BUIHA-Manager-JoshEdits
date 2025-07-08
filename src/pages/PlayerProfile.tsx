import { useParams, useNavigate } from "react-router-dom";
import { useTeam } from "@/context/TeamContext";
import { Player, SkaterAttributes, GoalieAttributes } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { PlayerHistoryTable } from "@/components/player/PlayerHistoryTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlayerEditForm } from "@/components/player/PlayerEditForm";
import { useState } from "react";

const PlayerProfile = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { userTeam, updateTeam } = useTeam();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const player = userTeam.roster.find((p) => p.id === playerId);

  if (!player) {
    return <div>Player not found</div>;
  }

  const handleSaveChanges = (updatedPlayer: Partial<Player>) => {
    const newRoster = userTeam.roster.map((p) =>
      p.id === updatedPlayer.id ? { ...p, ...updatedPlayer } : p
    );
    updateTeam({ ...userTeam, roster: newRoster });
    setIsEditDialogOpen(false);
  };

  const isSkater = player.positions[0] !== 'G';
  const attributes = player.attributes;

  const renderAttribute = (label: string, value: number) => (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${getAttributeColorClass(value)}`}>{value}</span>
    </div>
  );

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
            player.attributes[attr as keyof typeof attributes]
          )}
        </div>
      ))}
    </div>
  );

  const skaterPhysicalAttrs: (keyof SkaterAttributes)[] = ['acceleration', 'agility', 'balance', 'fighting', 'speed', 'stamina', 'strength', 'hitting'];
  const skaterMentalAttrs: (keyof SkaterAttributes)[] = ['aggression', 'bravery', 'determination', 'leadership', 'professionalism', 'teamPlayer', 'temperament'];
  const skaterOffensiveAttrs: (keyof SkaterAttributes)[] = ['gettingOpen', 'offensiveRead', 'passing', 'puckhandling', 'screening', 'shootingAccuracy', 'shootingRange'];
  const skaterDefensiveAttrs: (keyof SkaterAttributes)[] = ['checking', 'defensiveRead', 'faceoffs', 'positioning', 'shotBlocking', 'stickchecking'];
  
  const goalieAttrs: (keyof GoalieAttributes)[] = ['blocker', 'glove', 'lowShots', 'positioning', 'rebound', 'recovery', 'reflexes', 'passing', 'pokeCheck', 'puckhandling', 'skating', 'mentalToughness', 'goaltenderStamina'];

  const allUsedJerseyNumbers = userTeam.roster.map(p => p.jerseyNumber);

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Roster
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl">{player.name}</CardTitle>
            <p className="text-muted-foreground">
              #{player.jerseyNumber} | {player.positions.join(", ")} | {player.age} years old | {player.nationality}
            </p>
          </div>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit {player.name}</DialogTitle>
              </DialogHeader>
              <PlayerEditForm 
                player={player} 
                onSave={handleSaveChanges}
                allUsedJerseyNumbers={allUsedJerseyNumbers}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* ... other player details ... */}
        </CardContent>
      </Card>

      {/* Attribute Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isSkater ? (
          <>
            <Card>
              <CardHeader><CardTitle>Physical</CardTitle></CardHeader>
              <CardContent>{renderAttributeGrid(skaterPhysicalAttrs)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Mental</CardTitle></CardHeader>
              <CardContent>{renderAttributeGrid(skaterMentalAttrs)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Offensive</CardTitle></CardHeader>
              <CardContent>{renderAttributeGrid(skaterOffensiveAttrs)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Defensive</CardTitle></CardHeader>
              <CardContent>{renderAttributeGrid(skaterDefensiveAttrs)}</CardContent>
            </Card>
          </>
        ) : (
          <Card className="md:col-span-2 lg:col-span-4">
            <CardHeader><CardTitle>Goaltending</CardTitle></CardHeader>
            <CardContent>{renderAttributeGrid(goalieAttrs)}</CardContent>
          </Card>
        )}
      </div>

      {player.history && player.history.length > 0 && (
        <PlayerHistoryTable history={player.history} />
      )}
    </div>
  );
};

export default PlayerProfile;