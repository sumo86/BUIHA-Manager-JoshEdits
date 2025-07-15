import { Player, Lineup as LineupType } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LineupDisplayProps {
  lineup: LineupType;
  roster: Player[];
}

const PlayerCard = ({ playerId, roster }: { playerId: string | null, roster: Player[] }) => {
  const player = playerId ? roster.find(p => p.id === playerId) : null;
  if (!player) {
    return <div className="border rounded-lg p-2 text-center bg-muted/50 h-[60px] flex items-center justify-center text-muted-foreground text-sm">Empty</div>;
  }

  return (
    <div className="border rounded-lg p-2 text-center bg-card">
      <div className="font-bold text-sm truncate">{player.name}</div>
      <div className="text-xs text-muted-foreground">#{player.jerseyNumber} - {player.starRating.toFixed(1)} ★</div>
    </div>
  );
};

export const LineupDisplay = ({ lineup, roster }: LineupDisplayProps) => {
  return (
    <ScrollArea className="h-[450px] pr-4">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Forwards</h3>
          {Object.entries(lineup.forwards).map(([lineKey, players]) => (
            <div key={lineKey} className="grid grid-cols-4 items-center gap-4 py-2 border-b">
              <div className="font-semibold text-muted-foreground capitalize">{lineKey.replace('line', 'Line ')}</div>
              <div className="col-span-3 grid grid-cols-3 gap-2">
                {players.map((playerId, index) => (
                  <PlayerCard key={`${lineKey}-${index}`} playerId={playerId} roster={roster} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Defence</h3>
          {Object.entries(lineup.defence).map(([pairKey, players]) => (
            <div key={pairKey} className="grid grid-cols-4 items-center gap-4 py-2 border-b">
              <div className="font-semibold text-muted-foreground capitalize">{pairKey.replace('pair', 'Pair ')}</div>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                {players.map((playerId, index) => (
                  <PlayerCard key={`${pairKey}-${index}`} playerId={playerId} roster={roster} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Goalies</h3>
          <div className="grid grid-cols-4 items-center gap-4 py-2 border-b">
            <div className="font-semibold text-muted-foreground">Starter</div>
            <div className="col-span-3"><PlayerCard playerId={lineup.goalies.starter} roster={roster} /></div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4 py-2 border-b">
            <div className="font-semibold text-muted-foreground">Backup</div>
            <div className="col-span-3"><PlayerCard playerId={lineup.goalies.backup} roster={roster} /></div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};