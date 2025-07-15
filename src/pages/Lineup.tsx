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
        const skaters = team.roster.filter((p: Player) => !p.positions.includes('G'));
        const goalies = team.roster.filter((p: Player) => p.positions.includes('G'));
        const players = position === 'G' ? goalies : skaters;
        const currentStaffInLineup = staffInLineupCount; // Capture current count for this function call

        return players
            .filter((p: Player) => {
                // If player is already assigned to a different slot, filter them out
                if (assignedPlayerIds.has(p.id) && p.id !== currentSelection) {
                    return false;
                }
                // If player is staff and staff limit is reached, and they are not the current selection (meaning we are trying to add another staff)
                if (p.eligibility === 'Staff' && currentStaffInLineup >= 2 && p.id !== currentSelection) {
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
        const availableSkaters = healthyRoster.filter(p => !p.positions.includes('G')).sort((a, b) => b.starRating - a.starRating);
        const availableGoalies = healthyRoster.filter(p => p.positions.includes('G')).sort((a, b) => b.starRating - a.starRating);

        let tempLineup: LineupType = {
            forwards: { lw: [null, null, null, null], c: [null, null, null, null], rw: [null, null, null, null] },
            defence: { ld: [null, null, null], rd: [null, null, null] },
            goalies: { starter: null, backup: null }
        };

        let skaterIndex = 0;
        // Forwards
        ['lw', 'c', 'rw'].forEach(pos => {
            for (let i = 0; i < 4; i++) {
                if (skaterIndex < availableSkaters.length) {
                    const player = availableSkaters[skaterIndex];
                    // Check staff limit before assigning
                    if (player.eligibility !== 'Staff' || staffInLineupCount < 2) {
                        tempLineup.forwards[pos as keyof LineupType['forwards']][i] = player.id;
                        skaterIndex++;
                    } else {
                        // Skip this staff player if limit reached, try next available skater
                        skaterIndex++; 
                        i--; // Decrement i to re-evaluate the current slot with the next player
                    }
                }
            }
        });

        // Defence
        ['ld', 'rd'].forEach(pos => {
            for (let i = 0; i < 3; i++) {
                if (skaterIndex < availableSkaters.length) {
                    const player = availableSkaters[skaterIndex];
                    // Check staff limit before assigning
                    if (player.eligibility !== 'Staff' || staffInLineupCount < 2) {
                        tempLineup.defence[pos as keyof LineupType['defence']][i] = player.id;
                        skaterIndex++;
                    } else {
                        // Skip this staff player if limit reached, try next available skater
                        skaterIndex++;
                        i--; // Decrement i to re-evaluate the current slot with the next player
                    }
                }
            }
        });

        // Goalies
        if (availableGoalies.length > 0) {
            tempLineup.goalies.starter = availableGoalies[0].id;
            if (availableGoalies.length > 1) {
                tempLineup.goalies.backup = availableGoalies[1].id;
            }
        }

        updateTeam({ ...team, lineup: tempLineup });
        toast.success("Lines auto-filled based on player ratings and health.");
    };

    if (!team) {
        return <div>Loading team data...</div>;
    }

    const allTactics = useMemo(() => {
        const grouped = new Map<string, Map<string, any[]>>();
        tactics.forEach(tactic => {
            if (!grouped.has(tactic.phase)) {
                grouped.set(tactic.phase, new Map<string, any[]>());
            }
            const phaseMap = grouped.get(tactic.phase)!;
            if (!phaseMap.has(tactic.category)) {
                phaseMap.set(tactic.category, []);
            }
            phaseMap.get(tactic.category)!.push(tactic);
        });
        return grouped;
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Lineup & Tactics</h1>
                    <p className="text-lg text-muted-foreground">
                        Set your team's lines and tactical approach for upcoming games.
                    </p>
                </div>
                <Button onClick={autoFillLines}>Auto-Fill Lines</Button>
            </div>

            <Tabs defaultValue="forwards" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="forwards">Forwards</TabsTrigger>
                    <TabsTrigger value="defence">Defence</TabsTrigger>
                    <TabsTrigger value="goalies">Goalies</TabsTrigger>
                </TabsList>

                <TabsContent value="forwards" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Forward Lines</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 4 }).map((_, lineIndex) => (
                                <div key={`forward-line-${lineIndex}`} className="space-y-2">
                                    <h3 className="font-semibold text-lg">Line {lineIndex + 1}</h3>
                                    {['lw', 'c', 'rw'].map((pos) => {
                                        const playerId = team.lineup.forwards[pos as keyof LineupType['forwards']][lineIndex];
                                        const player = playerId ? playerMap.get(playerId) : null;
                                        return (
                                            <div key={`${pos}-${lineIndex}`} className="flex items-center gap-2">
                                                <span className="w-8 text-right text-sm text-muted-foreground">{pos.toUpperCase()}:</span>
                                                <Select
                                                    value={playerId || 'null-player'}
                                                    onValueChange={(value: string) => handleLineupChange('forwards', pos as keyof LineupType['forwards'], lineIndex, value === 'null-player' ? null : value)}
                                                >
                                                    <SelectTrigger className="flex-1 h-9">
                                                        <SelectValue placeholder={`Select ${pos.toUpperCase()}`} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {player && <SelectItem value={player.id}>{player.name}</SelectItem>}
                                                        {getAvailablePlayers(pos as Position, playerId).map((p: Player) => (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                {p.name} ({p.starRating}★)
                                                            </SelectItem>
                                                        ))}
                                                        {playerId && <SelectItem value="null-player">(Empty)</SelectItem>}
                                                    </SelectContent>
                                                </Select>
                                                {player && (
                                                    <PlayerLineupCard 
                                                        player={player} 
                                                        onRoleChange={(newRole) => handleRoleChange(player.id, newRole)} 
                                                        displayName={playerDisplayNames.get(player.id) || player.name}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="defence" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Defence Pairings</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 3 }).map((_, pairIndex) => (
                                <div key={`defence-pair-${pairIndex}`} className="space-y-2">
                                    <h3 className="font-semibold text-lg">Pairing {pairIndex + 1}</h3>
                                    {['ld', 'rd'].map((pos) => {
                                        const playerId = team.lineup.defence[pos as keyof LineupType['defence']][pairIndex];
                                        const player = playerId ? playerMap.get(playerId) : null;
                                        return (
                                            <div key={`${pos}-${pairIndex}`} className="flex items-center gap-2">
                                                <span className="w-8 text-right text-sm text-muted-foreground">{pos.toUpperCase()}:</span>
                                                <Select
                                                    value={playerId || 'null-player'}
                                                    onValueChange={(value: string) => handleLineupChange('defence', pos as keyof LineupType['defence'], pairIndex, value === 'null-player' ? null : value)}
                                                >
                                                    <SelectTrigger className="flex-1 h-9">
                                                        <SelectValue placeholder={`Select ${pos.toUpperCase()}`} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {player && <SelectItem value={player.id}>{player.name}</SelectItem>}
                                                        {getAvailablePlayers(pos as Position, playerId).map((p: Player) => (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                {p.name} ({p.starRating}★)
                                                            </SelectItem>
                                                        ))}
                                                        {playerId && <SelectItem value="null-player">(Empty)</SelectItem>}
                                                    </SelectContent>
                                                </Select>
                                                {player && (
                                                    <PlayerLineupCard 
                                                        player={player} 
                                                        onRoleChange={(newRole) => handleRoleChange(player.id, newRole)} 
                                                        displayName={playerDisplayNames.get(player.id) || player.name}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="goalies" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Goaltenders</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Starter</h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 text-right text-sm text-muted-foreground">G:</span>
                                    <Select
                                        value={team.lineup.goalies.starter || 'null-player'}
                                        onValueChange={(value: string) => handleGoalieChange('starter', value === 'null-player' ? null : value)}
                                    >
                                        <SelectTrigger className="flex-1 h-9">
                                            <SelectValue placeholder="Select Starter" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {team.lineup.goalies.starter && <SelectItem value={team.lineup.goalies.starter}>{playerMap.get(team.lineup.goalies.starter)?.name}</SelectItem>}
                                            {getAvailablePlayers('G', team.lineup.goalies.starter).map((p: Player) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name} ({p.starRating}★)
                                                </SelectItem>
                                            ))}
                                            {team.lineup.goalies.starter && <SelectItem value="null-player">(Empty)</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Backup</h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 text-right text-sm text-muted-foreground">G:</span>
                                    <Select
                                        value={team.lineup.goalies.backup || 'null-player'}
                                        onValueChange={(value: string) => handleGoalieChange('backup', value === 'null-player' ? null : value)}
                                    >
                                        <SelectTrigger className="flex-1 h-9">
                                            <SelectValue placeholder="Select Backup" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {team.lineup.goalies.backup && <SelectItem value={team.lineup.goalies.backup}>{playerMap.get(team.lineup.goalies.backup)?.name}</SelectItem>}
                                            {getAvailablePlayers('G', team.lineup.goalies.backup).map((p: Player) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name} ({p.starRating}★)
                                                </SelectItem>
                                            ))}
                                            {team.lineup.goalies.backup && <SelectItem value="null-player">(Empty)</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Card>
                <CardHeader><CardTitle>Tactics</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from(allTactics.entries()).map(([phase, categories]) => (
                        <div key={phase} className="space-y-4">
                            <h3 className="font-semibold text-lg">{phase}</h3>
                            {Array.from(categories.entries()).map(([category, tacticList]) => (
                                <div key={category} className="space-y-2">
                                    <CardDescription>{category}</CardDescription>
                                    <Select
                                        value={team.tactics[category] || ''}
                                        onValueChange={(value: string) => handleTacticChange(category, value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={`Select ${category} tactic`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tacticList.map((tactic: any) => {
                                                const suitability = calculateTacticSuitability(tactic, team.roster);
                                                return (
                                                    <SelectItem key={tactic.tactic} value={tactic.tactic}>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger className="w-full text-left">
                                                                    <div className="flex justify-between items-center">
                                                                        <span>{tactic.tactic}</span>
                                                                        <span className={`text-xs font-medium ${getAttributeColorClass(suitability.score)}`}>
                                                                            {suitability.score}/20
                                                                        </span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{tactic.description}</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        Suitability: {suitability.explanation}
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
};

export default Lineup;