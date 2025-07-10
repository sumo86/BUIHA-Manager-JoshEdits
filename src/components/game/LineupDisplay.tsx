import { Player, Lineup as LineupType, Position } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LineupDisplayProps {
  lineup: LineupType;
  roster: Player[];
}

const PlayerCard = ({ playerId, roster, slotPosition }: { playerId: string | null, roster: Player[], slotPosition: Position }) => {
  const player = playerId ? roster.find(p => p.id === playerId) : null;
  if (!player) {
    return <div className="border rounded-lg p-2 text-center bg-muted/50 h-[60px] flex items-center justify-center text-muted-foreground text-sm">Empty</div>;
  }

  let displayedStarRating = player.starRating;

  // Apply penalty if the player is not natural in this position (i.e., slotPosition is not in their listed positions)
  if (!player.positions.includes(slotPosition)) {
    displayedStarRating = Math.max(0, player.starRating - 0.5); // Deduct 0.5 stars, but not below 0
  }

  return (
    <div className="border rounded-lg p-2 text-center bg-card">
      <div className="font-bold text-sm truncate">{player.name}</div>
      <div className="text-xs text-muted-foreground">#{player.jerseyNumber} - {displayedStarRating.toFixed(1)} ★</div>
    </div>
  );
};

export const LineupDisplay = ({ lineup, roster }: LineupDisplayProps) => {
  const LineRow = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="grid grid-cols-4 items-center gap-4 py-2 border-b">
      <div className="font-semibold text-muted-foreground">{title}</div>
      <div className="col-span-3">{children}</div>
    </div>
  );

  return (
    <ScrollArea className="h-[450px] pr-4">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Forwards</h3>
          {[...Array(3)].map((_, i) => (
            <LineRow key={i} title={`Line ${i + 1}`}>
              <div className="grid grid-cols-3 gap-2">
                <PlayerCard playerId={lineup.forwards.lw[i]} roster={roster} slotPosition="LW" />
                <PlayerCard playerId={lineup.forwards.c[i]} roster={roster} slotPosition="C" />
                <PlayerCard playerId={lineup.forwards.rw[i]} roster={roster} slotPosition="RW" />
              </div>
            </LineRow>
          ))}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Defence</h3>
          {[...Array(3)].map((_, i) => (
            <LineRow key={i} title={`Pairing ${i + 1}`}>
              <div className="grid grid-cols-2 gap-2">
                <PlayerCard playerId={lineup.defence.ld[i]} roster={roster} slotPosition="LD" />
                <PlayerCard playerId={lineup.defence.rd[i]} roster={roster} slotPosition="RD" />
              </div>
            </LineRow>
          ))}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Goalies</h3>
          <LineRow title="Starter"><PlayerCard playerId={lineup.goalies.starter} roster={roster} slotPosition="G" /></LineRow>
          <LineRow title="Backup"><PlayerCard playerId={lineup.goalies.backup} roster={roster} slotPosition="G" /></LineRow>
        </div>
      </div>
    </ScrollArea>
  );
};