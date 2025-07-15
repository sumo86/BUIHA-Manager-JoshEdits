import { Lineup, Player, Position } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, StarHalf } from 'lucide-react';
import { roles, Role } from '@/data/roles'; // Corrected import for Role

interface LineupManagerProps {
  lineup: Lineup;
  roster: Player[];
  onLineupChange: (lineup: Lineup) => void;
  onRoleChange: (playerId: string, newRole: string) => void;
}

const forwardPositions: Position[] = ['LW', 'C', 'RW'];
const defencePositions: Position[] = ['LD', 'RD'];

const renderStars = (rating: number) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className="h-3 w-3 text-yellow-400 fill-yellow-400" />)}
      {halfStar && <StarHalf key="half" className="h-3 w-3 text-yellow-400 fill-yellow-400" />}
      {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className="h-3 w-3 text-gray-300" />)}
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

const getApplicableRoles = (player: Player): Role[] => {
    if (player.positions.includes('G')) return [];
    const isForward = forwardPositions.some(p => player.positions.includes(p));
    const isDefenceman = defencePositions.some(p => player.positions.includes(p));
    if (isForward && isDefenceman) return roles;
    if (isForward) return roles.filter(r => r.positions.includes('Forward'));
    if (isDefenceman) return roles.filter(r => r.positions.includes('Defenceman'));
    return [];
};

export const LineupManager = ({ lineup, roster, onLineupChange, onRoleChange }: LineupManagerProps) => {
  const getAvailablePlayers = (position: Position, currentId: string | null) => {
    const usedPlayerIds = new Set(Object.values(lineup).flatMap(group => Object.values(group).flat()).filter(id => id !== currentId));
    let positionGroup: Position[] = [];
    if (forwardPositions.includes(position)) positionGroup = forwardPositions;
    if (defencePositions.includes(position)) positionGroup = defencePositions;
    if (position === 'G') positionGroup = ['G'];
    return roster.filter(p => !usedPlayerIds.has(p.id) && p.positions.some(pos => positionGroup.includes(pos)));
  };

  const handlePlayerChange = (group: keyof Lineup, position: string, index: number | null, playerId: string | null) => {
    const newLineup = JSON.parse(JSON.stringify(lineup));
    if (index !== null) {
      newLineup[group][position][index] = playerId;
    } else {
      newLineup[group][position] = playerId;
    }
    onLineupChange(newLineup);
  };

  const PlayerSlot = ({ value, position, group, posKey, index }: { value: string | null, position: Position, group: keyof Lineup, posKey: string, index: number | null }) => {
    const currentPlayer = roster.find(p => p.id === value);
    const availablePlayers = getAvailablePlayers(position, value);
    const applicableRoles = currentPlayer ? getApplicableRoles(currentPlayer) : [];

    return (
      <div className="p-2 border rounded-md bg-muted/30 space-y-2">
        <Select value={value || 'empty'} onValueChange={(val) => handlePlayerChange(group, posKey, index, val === 'empty' ? null : val)}>
          <SelectTrigger>
            <SelectValue placeholder="Empty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="empty">Empty</SelectItem>
            {currentPlayer && <SelectItem value={currentPlayer.id}>{currentPlayer.name}</SelectItem>}
            {availablePlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {currentPlayer && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between items-center">
              <span>{currentPlayer.positions.join(', ')}</span>
              {renderStars(currentPlayer.starRating)}
            </div>
            {applicableRoles.length > 0 && (
              <Select value={currentPlayer.role} onValueChange={(newRole) => onRoleChange(currentPlayer.id, newRole)}>
                <SelectTrigger className="h-7">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {applicableRoles.map(role => (
                    <SelectItem key={role.name} value={role.name}>
                      <div className="flex justify-between w-full pr-2 text-xs">
                        <span>{role.name}</span>
                        <span className={`font-bold ${getAttributeColorClass(currentPlayer.roleSuitability[role.name])}`}>
                          {currentPlayer.roleSuitability[role.name]}/20
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>
    );
  };

  const LineRow = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="grid grid-cols-4 items-start gap-4 py-2 border-b">
      <div className="font-semibold text-muted-foreground pt-2">{title}</div>
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
                <PlayerSlot value={lineup.forwards.lw[i]} position="LW" group="forwards" posKey="lw" index={i} />
                <PlayerSlot value={lineup.forwards.c[i]} position="C" group="forwards" posKey="c" index={i} />
                <PlayerSlot value={lineup.forwards.rw[i]} position="RW" group="forwards" posKey="rw" index={i} />
              </div>
            </LineRow>
          ))}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Defence</h3>
          {[...Array(3)].map((_, i) => (
            <LineRow key={i} title={`Pairing ${i + 1}`}>
              <div className="grid grid-cols-2 gap-2">
                <PlayerSlot value={lineup.defence.ld[i]} position="LD" group="defence" posKey="ld" index={i} />
                <PlayerSlot value={lineup.defence.rd[i]} position="RD" group="defence" posKey="rd" index={i} />
              </div>
            </LineRow>
          ))}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Goalies</h3>
          <LineRow title="Starter">
            <PlayerSlot value={lineup.goalies.starter} position="G" group="goalies" posKey="starter" index={null} />
          </LineRow>
          <LineRow title="Backup">
            <PlayerSlot value={lineup.goalies.backup} position="G" group="goalies" posKey="backup" index={null} />
          </LineRow>
        </div>
      </div>
    </ScrollArea>
  );
};