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

const getAttributeColorClass = (value: number) => {
    if (value >= 17) return "text-green-700";
    if (value >= 13) return "text-green-500";
    return "text-yellow-500"; // Default for average
};

const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    const starClass = "h-4 w-4";
    
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

    const staffInLineupCount = useMemo(() => {
        const lineupPlayerIds = [
            ...Object.values(team.lineup.forwards).flat(),
            ...Object.values(team.lineup.defence).flat(),
            team.lineup.goalies.starter,
            team.lineup.goalies.backup,
        ].filter((id): id is string => id !== null);

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
        const players = position === 'G' ? goalies : skaters;
        const staffLimitReached = staffInLineupCount >= 2;

        return players
            .filter(p => {
                if (assignedPlayerIds.has(p.id) && p.id !== currentSelection) {
                    return false;
                }
                if (p.eligibility === 'Staff' && staffLimitReached && p.id !== currentSelection) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => {
                const aIsNatural = a.positions.includes(position);
                const bIsNatural = b.positions.includes(position);
                if (aIsNatural && !bIsNatural) return -1;
                if (!aIsNatural && bIsNatural) return 1;
                return b.starRating - a.starRating;
            });
    };

    function handleLineupChange(posType: 'forwards', pos: keyof LineupType['forwards'], index: number, playerId: string | null): void;
    function handleLineupChange(posType: 'defence', pos: keyof LineupType['defence'], index: number, playerId: string | null): void;
    function handleLineupChange(
        posType: 'forwards' | 'defence',
        pos: keyof LineupType['forwards'] | keyof LineupType['defence'],
        index: number,
        playerId: string | null
    ): void {
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
        const healthyRoster = team.roster.filter(p => p.healthStatus === 'Healthy');
    
        const forwards = healthyRoster.filter(p => ['C', 'LW', 'RW'].some(pos => p.positions.includes(pos as Position))).sort((a, b) => b.starRating - a.starRating);
        const defencemen = healthyRoster.filter(p => ['LD', 'RD'].some(pos => p.positions.includes(pos as Position))).sort((a, b) => b.starRating - a.starRating);
        const goalies = healthyRoster.filter(p => p.positions.includes('G')).sort((a, b) => b.starRating - a.starRating);
    
        const assigned = new Set<string>();
        const newForwards: LineupType['forwards'] = {
            line1: [null, null, null],
            line2: [null, null, null],
            line3: [null, null, null],
            line4: [null, null, null],
        };
        const newDefence: LineupType['defence'] = {
            pair1: [null, null],
            pair2: [null, null],
            pair3: [null, null],
        };
        const newGoalies: LineupType['goalies'] = {
            starter: null,
            backup: null,
        };
    
        // Assign Goalies
        if (goalies[0]) {
            newGoalies.starter = goalies[0].id;
            assigned.add(goalies[0].id);
        }
        if (goalies[1]) {
            newGoalies.backup = goalies[1].id;
            assigned.add(goalies[1].id);
        }
    
        // Assign Forwards
        let forwardIndex = 0;
        for (const lineKey of Object.keys(newForwards) as Array<keyof LineupType['forwards']>) {
            for (let i = 0; i < newForwards[lineKey].length; i++) {
                while (forwardIndex < forwards.length && assigned.has(forwards[forwardIndex].id)) {
                    forwardIndex++;
                }
                if (forwardIndex < forwards.length) {
                    newForwards[lineKey][i] = forwards[forwardIndex].id;
                    assigned.add(forwards[forwardIndex].id);
                    forwardIndex++;
                }
            }
        }
    
        // Assign Defencemen
        let defenceIndex = 0;
        for (const pairKey of Object.keys(newDefence) as Array<keyof LineupType['defence']>) {
            for (let i = 0; i < newDefence[pairKey].length; i++) {
                while (defenceIndex < defencemen.length && assigned.has(defencemen[defenceIndex].id)) {
                    defenceIndex++;
                }
                if (defenceIndex < defencemen.length) {
                    newDefence[pairKey][i] = defencemen[defenceIndex].id;
                    assigned.add(defencemen[defenceIndex].id);
                    defenceIndex++;
                }
            }
        }
    
        updateTeam({
            ...team,
            lineup: {
                forwards: newForwards,
                defence: newDefence,
                goalies: newGoalies,
            },
        });
        toast.success("Lines auto-filled!");
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
                    <Card className="mb-6">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-2xl font-bold">Forwards</CardTitle>
                            <Button onClick={autoFillLines}>Auto-Fill Lines</Button>
                        </CardHeader>
                        <CardContent>
                            {Object.keys(team.lineup.forwards).map((lineKey, lineIndex) => (
                                <div key={lineKey} className="mb-4">
                                    <h3 className="text-lg font-semibold mb-2 capitalize">{lineKey.replace('line', 'Line ')}</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {team.lineup.forwards[lineKey as keyof LineupType['forwards']].map((playerId, playerIndex) => {
                                            const player = playerId ? playerMap.get(playerId) : null;
                                            const availablePlayers = getAvailablePlayers('C', playerId); // Using 'C' as a generic forward position for filtering
                                            return (
                                                <Select
                                                    key={`${lineKey}-${playerIndex}`}
                                                    value={playerId || ''}
                                                    onValueChange={(newPlayerId) => handleLineupChange('forwards', lineKey as keyof LineupType['forwards'], playerIndex, newPlayerId)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Player">
                                                            {player ? (
                                                                <PlayerLineupCard
                                                                    player={player}
                                                                    onRoleChange={(newRole) => handleRoleChange(player.id, newRole)}
                                                                    displayName={playerDisplayNames.get(player.id) || player.name}
                                                                />
                                                            ) : 'Empty Slot'}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availablePlayers.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                <div className="flex items-center justify-between w-full">
                                                                    <span>{p.name} (#{p.jerseyNumber})</span>
                                                                    {renderStars(p.starRating)}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                        {playerId && <SelectItem value="">Remove Player</SelectItem>}
                                                    </SelectContent>
                                                </Select>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">Defence</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {Object.keys(team.lineup.defence).map((pairKey, pairIndex) => (
                                <div key={pairKey} className="mb-4">
                                    <h3 className="text-lg font-semibold mb-2 capitalize">{pairKey.replace('pair', 'Pair ')}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {team.lineup.defence[pairKey as keyof LineupType['defence']].map((playerId, playerIndex) => {
                                            const player = playerId ? playerMap.get(playerId) : null;
                                            const availablePlayers = getAvailablePlayers('LD', playerId); // Using 'LD' as a generic defence position for filtering
                                            return (
                                                <Select
                                                    key={`${pairKey}-${playerIndex}`}
                                                    value={playerId || ''}
                                                    onValueChange={(newPlayerId) => handleLineupChange('defence', pairKey as keyof LineupType['defence'], playerIndex, newPlayerId)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Player">
                                                            {player ? (
                                                                <PlayerLineupCard
                                                                    player={player}
                                                                    onRoleChange={(newRole) => handleRoleChange(player.id, newRole)}
                                                                    displayName={playerDisplayNames.get(player.id) || player.name}
                                                                />
                                                            ) : 'Empty Slot'}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availablePlayers.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                <div className="flex items-center justify-between w-full">
                                                                    <span>{p.name} (#{p.jerseyNumber})</span>
                                                                    {renderStars(p.starRating)}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                        {playerId && <SelectItem value="">Remove Player</SelectItem>}
                                                    </SelectContent>
                                                </Select>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">Goalies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Starter</h3>
                                    <Select
                                        value={team.lineup.goalies.starter || ''}
                                        onValueChange={(newPlayerId) => handleGoalieChange('starter', newPlayerId)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Starter">
                                                {team.lineup.goalies.starter ? (
                                                    <PlayerLineupCard
                                                        player={playerMap.get(team.lineup.goalies.starter)!}
                                                        onRoleChange={(newRole) => handleRoleChange(team.lineup.goalies.starter!, newRole)}
                                                        displayName={playerDisplayNames.get(team.lineup.goalies.starter) || playerMap.get(team.lineup.goalies.starter)!.name}
                                                    />
                                                ) : 'Empty Slot'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getAvailablePlayers('G', team.lineup.goalies.starter).map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>{p.name} (#{p.jerseyNumber})</span>
                                                        {renderStars(p.starRating)}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {team.lineup.goalies.starter && <SelectItem value="">Remove Player</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Backup</h3>
                                    <Select
                                        value={team.lineup.goalies.backup || ''}
                                        onValueChange={(newPlayerId) => handleGoalieChange('backup', newPlayerId)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Backup">
                                                {team.lineup.goalies.backup ? (
                                                    <PlayerLineupCard
                                                        player={playerMap.get(team.lineup.goalies.backup)!}
                                                        onRoleChange={(newRole) => handleRoleChange(team.lineup.goalies.backup!, newRole)}
                                                        displayName={playerDisplayNames.get(team.lineup.goalies.backup) || playerMap.get(team.lineup.goalies.backup)!.name}
                                                    />
                                                ) : 'Empty Slot'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getAvailablePlayers('G', team.lineup.goalies.backup).map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>{p.name} (#{p.jerseyNumber})</span>
                                                        {renderStars(p.starRating)}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {team.lineup.goalies.backup && <SelectItem value="">Remove Player</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tactics" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">Team Tactics</CardTitle>
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
                                                                <p className="text-xs text-muted-foreground mt-1">Affects: {tactic.affectedAttributes.join(', ')}</p>
                                                                <p className="text-xs text-muted-foreground">Best for: {tactic.bestForRoles.join(', ')}</p>
                                                                <p className="text-xs text-muted-foreground">Suitability: {calculateTacticSuitability(tactic, team.roster).score.toFixed(1)}%</p>
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