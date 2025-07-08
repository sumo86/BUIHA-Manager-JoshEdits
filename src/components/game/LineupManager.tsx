import { Lineup, Player, Position } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LineupManagerProps {
  lineup: Lineup;
  roster: Player[];
  onLineupChange: (lineup: Lineup) => void;
}

const forwardPositions: Position[] = ['LW', 'C', 'RW'];
const defencePositions: Position[] = ['LD', 'RD'];

export const LineupManager = ({ lineup, roster, onLineupChange }: LineupManagerProps) => {
  const getAvailablePlayers = (position: Position, currentId: string | null) => {
    const usedPlayerIds = new Set([
      ...lineup.forwards.lw,
      ...lineup.forwards.c,
      ...lineup.forwards.rw,
      ...lineup.defence.ld,
      ...lineup.defence.rd,
      lineup.goalies.starter,
      lineup.goalies.backup,
    ].filter(id => id !== currentId)); // Exclude the current player from the used list

    let positionGroup: Position[] = [];
    if (forwardPositions.includes(position)) positionGroup = forwardPositions;
    if (defencePositions.includes(position)) positionGroup = defencePositions;
    if (position === 'G') positionGroup = ['G'];

    return roster.filter(p => 
      !usedPlayerIds.has(p.id) && p.positions.some(pos => positionGroup.includes(pos))
    );
  };

  const handlePlayerChange = (
    group: 'forwards' | 'defence' | 'goalies',
    position: 'lw' | 'c' | 'rw' | 'ld' | 'rd' | 'starter' | 'backup',
    index: number | null,
    playerId: string | null
  ) => {
    const newLineup = JSON.parse(JSON.stringify(lineup)); // Deep copy

    if (group === 'forwards' || group === 'defence') {
      if (index !== null) {
        newLineup[group][position][index] = playerId;
      }
    } else if (group === 'goalies') {
      newLineup[group][position] = playerId;
    }
    
    onLineupChange(newLineup);
  };

  const PlayerSelect = ({ value, position, onChange }: { value: string | null, position: Position, onChange: (playerId: string | null) => void }) => {
    const currentPlayer = roster.find(p => p.id === value);
    const availablePlayers = getAvailablePlayers(position, value);
    
    return (
      <Select value={value || 'empty'} onValueChange={(val) => onChange(val === 'empty' ? null : val)}>
        <SelectTrigger>
          <SelectValue placeholder="Empty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="empty">Empty</SelectItem>
          {currentPlayer && <SelectItem value={currentPlayer.id}>{currentPlayer.name}</SelectItem>}
          {availablePlayers.map(p => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const LineRow = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="grid grid-cols-4 items-center gap-4 py-2 border-b">
      <div className="font-semibold text-muted-foreground">{title}</div>
      <div className="col-span-3">{children}</div>
    </div>
  );

  return (
    <ScrollArea className="h-[60vh] pr-4">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Forwards</h3>
          {[...Array(3)].map((_, i) => (
            <LineRow key={i} title={`Line ${i + 1}`}>
              <div className="grid grid-cols-3 gap-2">
                <PlayerSelect value={lineup.forwards.lw[i]} position="LW" onChange={(pid) => handlePlayerChange('forwards', 'lw', i, pid)} />
                <PlayerSelect value={lineup.forwards.c[i]} position="C" onChange={(pid) => handlePlayerChange('forwards', 'c', i, pid)} />
                <PlayerSelect value={lineup.forwards.rw[i]} position="RW" onChange={(pid) => handlePlayerChange('forwards', 'rw', i, pid)} />
              </div>
            </LineRow>
          ))}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Defence</h3>
          {[...Array(3)].map((_, i) => (
            <LineRow key={i} title={`Pairing ${i + 1}`}>
              <div className="grid grid-cols-2 gap-2">
                <PlayerSelect value={lineup.defence.ld[i]} position="LD" onChange={(pid) => handlePlayerChange('defence', 'ld', i, pid)} />
                <PlayerSelect value={lineup.defence.rd[i]} position="RD" onChange={(pid) => handlePlayerChange('defence', 'rd', i, pid)} />
              </div>
            </LineRow>
          ))}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Goalies</h3>
          <LineRow title="Starter">
            <PlayerSelect value={lineup.goalies.starter} position="G" onChange={(pid) => handlePlayerChange('goalies', 'starter', null, pid)} />
          </LineRow>
          <LineRow title="Backup">
            <PlayerSelect value={lineup.goalies.backup} position="G" onChange={(pid) => handlePlayerChange('goalies', 'backup', null, pid)} />
          </LineRow>
        </div>
      </div>
    </ScrollArea>
  );
};