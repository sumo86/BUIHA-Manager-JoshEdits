import { useMemo } from 'react';
import { tactics } from '@/data/tactics';
import { roles, Role } from '@/data/roles';
import { Player, Position, Team, Lineup as LineupType, TacticsSelection } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { calculateTacticSuitability } from '@/lib/tactics';
import { Star, StarHalf } from 'lucide-react';
import { useTeam } from '@/context/TeamContext';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

const getAttributeColorClass = (value: number) => {
    if (value >= 17) return "text-green-700";
    if (value >= 13) return "text-green-500";
    return "text-yellow-500"; // Default for average
};

const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    const starClass = "w-4 h-4"; // Defined starClass here
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className={`${starClass} text-yellow-400 fill-yellow-400`} />)}
        {halfStar && <StarHalf key="half" className={`${starClass} text-yellow-400 fill-yellow-400`} />}
        {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className={`${starClass} text-gray-300`} />)}
      </div>
    );
};

const PlayerLineupCard = ({ player, onRoleChange, displayName }: { player: Player, onRoleChange: (newRole: string) => void, displayName: string }) => {
    const getApplicableRoles = (p: Player): Role[] => {
        if (p.positions.includes('G')) return [];
        const isF = ['C', 'LW', 'RW'].some(pos => p.positions.includes(pos as Position));
        const isD = ['LD', 'RD'].some(pos => p.positions.includes(pos as Position));
        if (isF && isD) return roles;
        if (isF) return roles.filter(r => r.positions.includes('Forward'));
        return roles.filter(r => r.positions.includes('Defenceman'));
    };
    const applicableRoles = getApplicableRoles(player);

    const cardClasses = `border rounded-lg p-2 text-center w-full ${
        player.healthStatus === 'Injured' ? 'border-red-500 bg-red-50/50' : 'bg-card'
    }`;

    return (
        <div className={cardClasses}>
            <div className="font-bold text-sm truncate">{displayName}</div>
            <div className="text-xs text-muted-foreground">#{player.jerseyNumber}</div>
            <div className="flex justify-center my-1">{renderStars(player.starRating)}</div>
            <Select value={player.role || ''} onValueChange={onRoleChange}>
                <SelectTrigger className="h-7 text-xs mt-1">
                    <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                    {applicableRoles.map(role => (
                        <SelectItem key={role.name} value={role.name}>
                            <div className="flex justify-between w-full pr-2 text-xs">
                                <span>{role.name}</span>
                                <span className={`font-bold ${getAttributeColorClass(player.roleSuitability[role.name])}`}>
                                    {player.roleSuitability[role.name]}/20
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

const Lineup = () => {
    const { userTeam: team, updateTeam } = useTeam();
    const playerMap = useMemo(() => new Map(team.roster.map(p => [p.id, p])), [team.roster]);

    const assignedPlayerIds = useMemo(() => {
        const ids = new Set<string>();
        Object.values(team.lineup.forwards).flat().forEach(id => id && ids.add(id));
        Object.values(team.lineup.defence).flat().forEach(id => id && ids.add(id));
        if (team.lineup.goalies.starter) ids.add(team.lineup.goalies.starter);
        if (team.lineup.goalies.backup) ids.add(team.lineup.goalies.backup);
        return ids;
    }, [team.lineup]);

    const staffInLineupCount = useMemo(() => {
        const lineupPlayerIds = [
            ...Object.values(team.lineup.forwards).flat(),
            ...Object.values(team.lineup.defence).flat(),
            team.lineup.goalies.starter,
            team.lineup.goalies.backup,
        ].filter((id): id is string => id !== null); // Filter out nulls here

        return lineupPlayerIds.reduce((count, id) => {
            const player = playerMap.get(id); 
            if (player && player.eligibility === 'Staff') { 
                return count + 1;
            }
            return count;
        }, 0);
    }, [team.lineup, playerMap]);

    const playerDisplayNames = useMemo(() => {
        const lineupPlayerIds = Array.from(assignedPlayerIds);
        const lineupPlayers = lineupPlayerIds.map(id => playerMap.get(id)).filter((p): p is Player => !!p);
    
        const surnameCounts = lineupPlayers.reduce((acc, player) => {
            const surname = player.name.split(' ').pop() || '';
            acc[surname] = (acc[surname] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    
        const displayNames = new Map<string, string>();
        lineupPlayers.forEach(player => {
            const surname = player.name.split(' ').pop() || '';
            if (surnameCounts[surname] > 1) {
                const initial = player.name.charAt(0);
                displayNames.set(player.id, `${initial}. ${surname.toUpperCase()}`);
            } else {
                displayNames.set(player.id, surname.toUpperCase());
            }
        });
    
        return displayNames;
    }, [assignedPlayerIds, playerMap]);

    const getAvailablePlayers = (position: Position, currentSelection: string | null): Player[] => {
        const skaters = team.roster.filter(p => !p.positions.includes('G'));
        const goalies = team.roster.filter(p => p.positions.includes('G'));

        const isAssigned = (playerId: string) => assignedPlayerIds.has(playerId) && playerId !== currentSelection;

        if (position === 'G') {
            return goalies.filter(p => !isAssigned(p.id) && p.healthStatus === 'Healthy');
        } else {
            const positionFilter = (p: Player) => {
                if (position === 'C' && p.positions.includes('C')) return true;
                if (position === 'LW' && p.positions.includes('LW')) return true;
                if (position === 'RW' && p.positions.includes('RW')) return true;
                if (position === 'LD' && p.positions.includes('LD')) return true;
                if (position === 'RD' && p.positions.includes('RD')) return true;
                return false;
            };
            return skaters.filter(p => !isAssigned(p.id) && p.healthStatus === 'Healthy' && positionFilter(p));
        }
    };

    const handlePlayerChange = (positionType: 'forwards' | 'defence' | 'goalies', line: 'lw' | 'c' | 'rw' | 'ld' | 'rd' | 'starter' | 'backup', index: number | null, playerId: string) => {
        if (!team) return;

        const newTeamLineup = { ...team.lineup };

        if (positionType === 'forwards' || positionType === 'defence') {
            if (index !== null) {
                (newTeamLineup[positionType][line] as (string | null)[])[index] = playerId;
            }
        } else if (positionType === 'goalies') {
            (newTeamLineup[positionType] as any)[line] = playerId;
        }

        updateTeam({ ...team, lineup: newTeamLineup });
    };

    const handleRoleChange = (playerId: string, newRole: string) => {
        if (!team) return;
        const updatedRoster = team.roster.map(p =>
            p.id === playerId ? { ...p, role: newRole } : p
        );
        updateTeam({ ...team, roster: updatedRoster });
    };

    const handleTacticChange = (category: string, value: string) => {
        if (!team) return;
        const newTactics = { ...team.tactics, [category]: value };
        updateTeam({ ...team, tactics: newTactics });
    };

    const validateAndSaveLineup = () => {
        // This function is now handled by advanceWeek in TeamContext
        // but we can add specific lineup validation here if needed for UI feedback
        // before advancing week.
        toast.info("Lineup changes saved automatically.");
    };

    if (!team) {
        return <div className="p-4 text-center">Please select a team to manage your lineup.</div>;
    }

    const allTactics = useMemo(() => {
        const groupedTactics: { [key: string]: { [key: string]: any[] } } = {};
        tactics.forEach(tactic => {
            if (!groupedTactics[tactic.phase]) {
                groupedTactics[tactic.phase] = {};
            }
            if (!groupedTactics[tactic.phase][tactic.category]) {
                groupedTactics[tactic.phase][tactic.category] = [];
            }
            groupedTactics[tactic.phase][tactic.category].push(tactic);
        });
        return groupedTactics;
    }, []);

    const renderPlayerSelect = (playerId: string | null, position: Position, lineType: 'forwards' | 'defence' | 'goalies', lineName: 'lw' | 'c' | 'rw' | 'ld' | 'rd' | 'starter' | 'backup', index: number | null = null) => {
        const selectedPlayer = playerId ? playerMap.get(playerId) : null;
        const availablePlayers = getAvailablePlayers(position, playerId);

        return (
            <Select
                value={playerId || ''}
                onValueChange={(value) => handlePlayerChange(lineType, lineName, index, value)}
            >
                <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Select Player">
                        {selectedPlayer ? (
                            <div className="flex items-center">
                                <span className="font-medium">{playerDisplayNames.get(selectedPlayer.id) || selectedPlayer.name}</span>
                                <span className="ml-2 text-muted-foreground">#{selectedPlayer.jerseyNumber}</span>
                            </div>
                        ) : (
                            "Select Player"
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {availablePlayers.map(player => (
                        <SelectItem key={player.id} value={player.id}>
                            <div className="flex items-center">
                                <span className="font-medium">{player.name}</span>
                                <span className="ml-2 text-muted-foreground">#{player.jerseyNumber}</span>
                                <span className="ml-auto text-xs text-gray-500">{player.positions.join('/')}</span>
                            </div>
                        </SelectItem>
                    ))}
                    {selectedPlayer && !availablePlayers.some(p => p.id === selectedPlayer.id) && (
                        <SelectItem key={selectedPlayer.id} value={selectedPlayer.id} className="bg-gray-100 text-gray-500" disabled>
                            <div className="flex items-center">
                                <span className="font-medium">{selectedPlayer.name}</span>
                                <span className="ml-2 text-muted-foreground">#{selectedPlayer.jerseyNumber}</span>
                                <span className="ml-auto text-xs text-gray-500">(Current)</span>
                            </div>
                        </SelectItem>
                    )}
                    <SelectItem value="" className="text-muted-foreground">
                        (Empty Slot)
                    </SelectItem>
                </SelectContent>
            </Select>
        );
    };

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-3xl font-bold">Lineup & Tactics</h1>

            <Tabs defaultValue="lineup">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="lineup">Lineup</TabsTrigger>
                    <TabsTrigger value="tactics">Tactics</TabsTrigger>
                </TabsList>

                <TabsContent value="lineup" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Forwards</CardTitle>
                            <CardDescription>Set your forward lines.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {['Line 1', 'Line 2', 'Line 3', 'Line 4'].map((lineName, lineIndex) => (
                                <div key={lineIndex} className="grid grid-cols-4 gap-4 items-center">
                                    <Label className="text-right">{lineName}</Label>
                                    {renderPlayerSelect(team.lineup.forwards.lw[lineIndex], 'LW', 'forwards', 'lw', lineIndex)}
                                    {renderPlayerSelect(team.lineup.forwards.c[lineIndex], 'C', 'forwards', 'c', lineIndex)}
                                    {renderPlayerSelect(team.lineup.forwards.rw[lineIndex], 'RW', 'forwards', 'rw', lineIndex)}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Defence</CardTitle>
                            <CardDescription>Set your defensive pairings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {['Pairing 1', 'Pairing 2', 'Pairing 3'].map((pairingName, pairIndex) => (
                                <div key={pairIndex} className="grid grid-cols-3 gap-4 items-center">
                                    <Label className="text-right">{pairingName}</Label>
                                    {renderPlayerSelect(team.lineup.defence.ld[pairIndex], 'LD', 'defence', 'ld', pairIndex)}
                                    {renderPlayerSelect(team.lineup.defence.rd[pairIndex], 'RD', 'defence', 'rd', pairIndex)}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Goalies</CardTitle>
                            <CardDescription>Select your starting and backup goaltenders.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 items-center">
                                <Label className="text-right">Starter</Label>
                                {renderPlayerSelect(team.lineup.goalies.starter, 'G', 'goalies', 'starter')}
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center">
                                <Label className="text-right">Backup</Label>
                                {renderPlayerSelect(team.lineup.goalies.backup, 'G', 'goalies', 'backup')}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Player Roles</CardTitle>
                            <CardDescription>Assign roles to players in your lineup for tactical benefits.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                ...team.lineup.forwards.lw, ...team.lineup.forwards.c, ...team.lineup.forwards.rw,
                                ...team.lineup.defence.ld, ...team.lineup.defence.rd,
                                team.lineup.goalies.starter, team.lineup.goalies.backup
                            ]
                            .filter((id): id is string => id !== null)
                            .filter((id, index, self) => self.indexOf(id) === index) // Unique players
                            .map(playerId => {
                                const player = playerMap.get(playerId);
                                if (!player) return null;
                                return (
                                    <PlayerLineupCard
                                        key={player.id}
                                        player={player}
                                        onRoleChange={(newRole) => handleRoleChange(player.id, newRole)}
                                        displayName={playerDisplayNames.get(player.id) || player.name}
                                    />
                                );
                            })}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tactics" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Tactics</CardTitle>
                            <CardDescription>Set your team's overall tactical approach.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {Object.entries(allTactics).map(([phase, categories]) => (
                                <div key={phase} className="space-y-4">
                                    <h3 className="text-lg font-semibold">{phase}</h3>
                                    {Object.entries(categories).map(([category, tacticsList]) => (
                                        <div key={category} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                            <Label className="font-medium">{category}</Label>
                                            <Select
                                                value={team.tactics[category] || ''}
                                                onValueChange={(value) => handleTacticChange(category, value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={`Select ${category} tactic`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tacticsList.map((tactic: any) => (
                                                        <SelectItem key={tactic.tactic} value={tactic.tactic}>
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger className="w-full text-left">
                                                                        {tactic.tactic}
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{tactic.description}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Best Used With: {tactic.bestUsedWith || 'N/A'} | Strong Vs: {tactic.strongVs || 'N/A'} | Weak Vs: {tactic.weakVs || 'N/A'}
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Lineup;