import { useMemo } from 'react';
import { tactics } from '@/data/tactics';
import { roles, Role } from '@/data/roles';
import { Player, Position, Team, Lineup as LineupType, TacticsSelection, Tactic } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { calculateTacticSuitability } from '@/lib/tactics';
import { Star, StarHalf } from 'lucide-react';
import { useTeam } from '@/context/TeamContext';
import { toast } from 'sonner';
import { populateLineup } from '@/lib/lineupUtils';

const getAttributeColorClass = (value: number) => {
    if (value >= 17) return "text-green-700";
    if (value >= 13) return "text-green-500";
    if (value >= 9) return "text-yellow-500";
    if (value >= 5) return "text-orange-500";
    return "text-red-500";
};

const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    const starClass = "h-4 w-4";
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className={`${starClass} text-yellow-400 fill-yellow-400`} />)}
        {halfStar && <StarHalf key="half" className={`${starClass} text-yellow-400 fill-yellow-400`} />}
        {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className={`${starClass} text-gray-300`} />)}
      </div>
    );
};

const Lineup = () => {
    const { userTeam: team, updateTeam } = useTeam();
    const playerMap = useMemo(() => new Map(team.roster.map(p => [p.id, p])), [team.roster]);

    const groupedTactics = useMemo(() => {
        return tactics.reduce((acc, tactic) => {
            const category = tactic.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(tactic);
            return acc;
        }, {} as Record<string, Tactic[]>);
    }, []);

    const assignedPlayerIds = useMemo(() => {
        const ids = new Set<string>();
        Object.values(team.lineup.forwards).flat().forEach(id => id && ids.add(id));
        Object.values(team.lineup.defence).flat().forEach(id => id && ids.add(id));
        if (team.lineup.goalies.starter) ids.add(team.lineup.goalies.starter);
        if (team.lineup.goalies.backup) ids.add(team.lineup.goalies.backup);
        return ids;
    }, [team.lineup]);

    const getAvailablePlayers = (isGoalie: boolean, currentSelection: string | null): Player[] => {
        const players = isGoalie 
            ? team.roster.filter(p => p.positions.includes('G'))
            : team.roster.filter(p => !p.positions.includes('G'));

        return players
            .filter(p => !assignedPlayerIds.has(p.id) || p.id === currentSelection)
            .sort((a, b) => b.starRating - a.starRating);
    };

    function handleLineupChange(posType: 'forwards' | 'defence', pos: keyof LineupType['forwards'] | keyof LineupType['defence'], index: number, playerId: string | null): void {
        const newLineup = JSON.parse(JSON.stringify(team.lineup)) as LineupType;
        if (posType === 'forwards') {
            newLineup.forwards[pos as keyof LineupType['forwards']][index!] = playerId;
        } else {
            newLineup.defence[pos as keyof LineupType['defence']][index!] = playerId;
        }
        updateTeam({ ...team, lineup: newLineup });
    }

    const handleGoalieChange = (role: 'starter' | 'backup', playerId: string | null) => {
        const newLineup = { ...team.lineup };
        newLineup.goalies[role] = playerId;
        updateTeam({ ...team, lineup: newLineup });
    };

    const handleRoleChange = (playerId: string, newRole: string) => {
        const newRoster = team.roster.map(p => p.id === playerId ? { ...p, role: newRole } : p);
        updateTeam({ ...team, roster: newRoster });
    };

    const handleTacticChange = (category: string, tactic: string) => {
        updateTeam({ ...team, tactics: { ...team.tactics, [category]: tactic } });
    };

    const autoFillLines = () => {
        const newLineup = populateLineup(team.roster);
        updateTeam({ ...team, lineup: newLineup });
        toast.success("Lines auto-filled based on best available players!");
    };

    const getApplicableRoles = (player: Player): Role[] => {
        if (player.positions.includes('G')) return [];
        const isF = ['C', 'LW', 'RW'].some(pos => player.positions.includes(pos as Position));
        const isD = ['LD', 'RD'].some(pos => player.positions.includes(pos as Position));
        if (isF && isD) return roles;
        if (isF) return roles.filter(r => r.positions.includes('Forward'));
        return roles.filter(r => r.positions.includes('Defenceman'));
    };

    if (!team) {
        return <div>Loading team data...</div>;
    }

    const currentTactics = team.tactics;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Lineup & Tactics</h1>
                <p className="text-lg text-muted-foreground">Set your team's lines and choose your tactics for the upcoming games.</p>
            </div>

            <Tabs defaultValue="lines">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="lines">Lines</TabsTrigger>
                    <TabsTrigger value="tactics">Tactics</TabsTrigger>
                </TabsList>

                <TabsContent value="lines" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Manage Lines</CardTitle>
                            <Button onClick={autoFillLines}>Auto-Fill Lines</Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Forwards */}
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Forwards</h3>
                                <div className="space-y-4">
                                    {Object.entries(team.lineup.forwards).map(([lineKey, players]) => (
                                        <div key={lineKey} className="p-4 border rounded-lg">
                                            <h4 className="font-semibold capitalize mb-2">{lineKey.replace('line', 'Line ')}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {players.map((playerId, index) => {
                                                    const player = playerId ? playerMap.get(playerId) : null;
                                                    const availablePlayers = getAvailablePlayers(false, playerId);
                                                    const applicableRoles = player ? getApplicableRoles(player) : [];
                                                    return (
                                                        <div key={index} className="space-y-2 p-2 bg-muted/50 rounded-md">
                                                            <Select value={playerId || 'none'} onValueChange={(val) => handleLineupChange('forwards', lineKey as keyof LineupType['forwards'], index, val === 'none' ? null : val)}>
                                                                <SelectTrigger><SelectValue placeholder="Empty Slot" /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">Empty Slot</SelectItem>
                                                                    {player && <SelectItem value={player.id}>{player.name}</SelectItem>}
                                                                    {availablePlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                            {player && (
                                                                <div className="space-y-1 text-xs">
                                                                    <div className="flex justify-between"><span>{player.positions.join(', ')}</span>{renderStars(player.starRating)}</div>
                                                                    {applicableRoles.length > 0 && (
                                                                        <Select value={player.role || ''} onValueChange={(newRole) => handleRoleChange(player.id, newRole)}>
                                                                            <SelectTrigger className="h-7"><SelectValue placeholder="Select role" /></SelectTrigger>
                                                                            <SelectContent>
                                                                                {applicableRoles.map(role => (
                                                                                    <SelectItem key={role.name} value={role.name}>
                                                                                        <div className="flex justify-between w-full pr-2">
                                                                                            <span>{role.name}</span>
                                                                                            <span className={`font-bold ${getAttributeColorClass(player.roleSuitability[role.name])}`}>{player.roleSuitability[role.name]}/20</span>
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
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Defence */}
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Defence</h3>
                                <div className="space-y-4">
                                    {Object.entries(team.lineup.defence).map(([pairKey, players]) => (
                                        <div key={pairKey} className="p-4 border rounded-lg">
                                            <h4 className="font-semibold capitalize mb-2">{pairKey.replace('pair', 'Pair ')}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {players.map((playerId, index) => {
                                                    const player = playerId ? playerMap.get(playerId) : null;
                                                    const availablePlayers = getAvailablePlayers(false, playerId);
                                                    const applicableRoles = player ? getApplicableRoles(player) : [];
                                                    return (
                                                        <div key={index} className="space-y-2 p-2 bg-muted/50 rounded-md">
                                                            <Select value={playerId || 'none'} onValueChange={(val) => handleLineupChange('defence', pairKey as keyof LineupType['defence'], index, val === 'none' ? null : val)}>
                                                                <SelectTrigger><SelectValue placeholder="Empty Slot" /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">Empty Slot</SelectItem>
                                                                    {player && <SelectItem value={player.id}>{player.name}</SelectItem>}
                                                                    {availablePlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                            {player && (
                                                                <div className="space-y-1 text-xs">
                                                                    <div className="flex justify-between"><span>{player.positions.join(', ')}</span>{renderStars(player.starRating)}</div>
                                                                    {applicableRoles.length > 0 && (
                                                                        <Select value={player.role || ''} onValueChange={(newRole) => handleRoleChange(player.id, newRole)}>
                                                                            <SelectTrigger className="h-7"><SelectValue placeholder="Select role" /></SelectTrigger>
                                                                            <SelectContent>
                                                                                {applicableRoles.map(role => (
                                                                                    <SelectItem key={role.name} value={role.name}>
                                                                                        <div className="flex justify-between w-full pr-2">
                                                                                            <span>{role.name}</span>
                                                                                            <span className={`font-bold ${getAttributeColorClass(player.roleSuitability[role.name])}`}>{player.roleSuitability[role.name]}/20</span>
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
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Goalies */}
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Goalies</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(['starter', 'backup'] as const).map(role => {
                                        const playerId = team.lineup.goalies[role];
                                        const player = playerId ? playerMap.get(playerId) : null;
                                        const availablePlayers = getAvailablePlayers(true, playerId);
                                        return (
                                            <div key={role} className="p-4 border rounded-lg">
                                                <h4 className="font-semibold capitalize mb-2">{role}</h4>
                                                <div className="space-y-2 p-2 bg-muted/50 rounded-md">
                                                    <Select value={playerId || 'none'} onValueChange={(val) => handleGoalieChange(role, val === 'none' ? null : val)}>
                                                        <SelectTrigger><SelectValue placeholder="Empty Slot" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Empty Slot</SelectItem>
                                                            {player && <SelectItem value={player.id}>{player.name}</SelectItem>}
                                                            {availablePlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    {player && (
                                                        <div className="space-y-1 text-xs">
                                                            <div className="flex justify-between"><span>{player.positions.join(', ')}</span>{renderStars(player.starRating)}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tactics" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Tactics</CardTitle>
                            <CardDescription>Choose your team's overall playing style and specific tactics.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.keys(groupedTactics).map(category => (
                                <div key={category} className="space-y-2">
                                    <h3 className="text-lg font-semibold capitalize">{category}</h3>
                                    <Select value={currentTactics[category as keyof TacticsSelection]} onValueChange={(value) => handleTacticChange(category, value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={`Select ${category} tactic`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {groupedTactics[category].map(tactic => (
                                                <SelectItem key={tactic.tactic} value={tactic.tactic}>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger className="text-left w-full">{tactic.tactic}</TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{tactic.description}</p>
                                                                <p className="text-xs text-muted-foreground mt-1">Suitability: {calculateTacticSuitability(tactic, team.roster).score.toFixed(1)}/5</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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