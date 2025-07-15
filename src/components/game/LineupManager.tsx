import { Lineup, Player, Position } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, StarHalf } from 'lucide-react';
import { roles, Role } from '@/data/roles';

interface LineupManagerProps {
  lineup: Lineup;
  roster: Player[];
  onLineupChange: (lineup: Lineup) => void;
  onRoleChange: (playerId: string, newRole: string) => void;
}

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
    const isForward = ['C', 'LW', 'RW'].some(p => player.positions.includes(p as Position));
    const isDefenceman = ['LD', 'RD'].some(p => player.positions.includes(p as Position));
    if (isForward && isDefenceman) return roles;
    if (isForward) return roles.filter(r => r.positions.includes('Forward'));
    if (isDefenceman) return roles.filter(r => r.positions.includes('Defenceman'));
    return [];
};

export const LineupManager = ({ lineup, roster, onLineupChange, onRoleChange }: LineupManagerProps) => {
  const getAvailablePlayers = (isGoalie: boolean, currentId: string | null) => {
    const usedPlayerIds = new Set(
        [
            ...Object.values(lineup.forwards).flat(),
            ...Object.values(lineup.defence).flat(),
            lineup.goalies.starter,
            lineup.goalies.backup
        ].filter(id => id !== currentId && id !== null)
    );
    
    return roster.filter(p => {
        const isPlayerGoalie = p.positions.includes('G');
        if (isGoalie !== isPlayerGoalie) return false;
        return !usedPlayerIds.has(p.id);
    });
  };

  const handlePlayerChange = (group: keyof Lineup, lineKey: keyof Lineup['forwards'] | keyof Lineup['defence'] | keyof Lineup['goalies'], index: number | null, playerId: string | null) => {
    const newLineup = JSON.parse(JSON.stringify(lineup));
    if (group === 'goalies') {
        newLineup.goalies[lineKey as keyof Lineup['goalies']] = playerId;
    } else if (index !== null) {
        (newLineup[group] as any)[lineKey][index] = playerId;
    }
    onLineupChange(newLineup);
  };

  const PlayerSlot = ({ value, isGoalie, group, lineKey, index }: { value: string | null, isGoalie: boolean, group: keyof Lineup, lineKey: any, index: number | null }) => {
    const currentPlayer = roster.find(p => p.id === value);
    const availablePlayers = getAvailablePlayers(isGoalie, value);
    const applicableRoles = currentPlayer ? getApplicableRoles(currentPlayer) : [];

    return (
      <div className="p-2 border rounded-md bg-muted/30 space-y-2">
        <Select value={value || 'empty'} onValueChange={(val) => handlePlayerChange(group, lineKey, index, val === 'empty' ? null : val)}>
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
          {Object.entries(lineup.forwards).map(([lineKey, players]) => (
            <LineRow key={lineKey} title={lineKey.replace('line', 'Line ')}>
              <div className="grid grid-cols-3 gap-2">
                {players.map((playerId, index) => (
                  <PlayerSlot key={`${lineKey}-${index}`} value={playerId} isGoalie={false} group="forwards" lineKey={lineKey} index={index} />
                ))}
              </div>
            </LineRow>
          ))}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Defence</h3>
          {Object.entries(lineup.defence).map(([pairKey, players]) => (
            <LineRow key={pairKey} title={pairKey.replace('pair', 'Pair ')}>
              <div className="grid grid-cols-2 gap-2">
                {players.map((playerId, index) => (
                  <PlayerSlot key={`${pairKey}-${index}`} value={playerId} isGoalie={false} group="defence" lineKey={pairKey} index={index} />
                ))}
              </div>
            </LineRow>
          ))}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Goalies</h3>
          <LineRow title="Starter">
            <PlayerSlot value={lineup.goalies.starter} isGoalie={true} group="goalies" lineKey="starter" index={null} />
          </LineRow>
          <LineRow title="Backup">
            <PlayerSlot value={lineup.goalies.backup} isGoalie={true} group="goalies" lineKey="backup" index={null} />
          </LineRow>
        </div>
      </div>
    </ScrollArea>
  );
};