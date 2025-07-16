import { useMemo } from 'react';
import { tactics } from '@/data/tactics';
import { roles, Role } from '@/data/roles';
import { Player, Position, Team, Lineup as LineupType } from '@/types';
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
            <Select value={player.role || ''} onValueChange={(value: string) => onRoleChange(value)}>
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
    const { userTeam: team, updateTeam } = useTeam(); // Changed userTeam to team

    if (!team) {
        return <div>Loading...</div>;
    }

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
        let staffCount = 0;
        const MAX_STAFF = 2;
    
        const newLineup: LineupType = {
            forwards: { lw: [null, null, null], c: [null, null, null], rw: [null, null, null] },
            defence: { ld: [null, null, null], rd: [null, null, null] },
            goalies: { starter: null, backup: null }
        };
    
        const findAndAssignPlayer = (playerPool: Player[], position?: Position): string | null => {
            if (position) {
                const naturalFit = playerPool.find(p => {
                    if (assigned.has(p.id)) return false;
                    if (p.eligibility === 'Staff' && staffCount >= MAX_STAFF) return false;
                    return p.positions.includes(position);
                });
                if (naturalFit) {
                    assigned.add(naturalFit.id);
                    if (naturalFit.eligibility === 'Staff') staffCount++;
                    return naturalFit.id;
                }
            }
    
            const anyFit = playerPool.find(p => {
                if (assigned.has(p.id)) return false;
                if (p.eligibility === 'Staff' && staffCount >= MAX_STAFF) return false;
                return true;
            });
            if (anyFit) {
                assigned.add(anyFit.id);
                if (anyFit.eligibility === 'Staff') staffCount++;
                return anyFit.id;
            }
    
            return null;
        };
    
        for (let i = 0; i < 3; i++) {
            newLineup.forwards.lw[i] = findAndAssignPlayer(forwards, 'LW');
            newLineup.forwards.c[i] = findAndAssignPlayer(forwards, 'C');
            newLineup.forwards.rw[i] = findAndAssignPlayer(forwards, 'RW');
        }
    
        for (let i = 0; i < 3; i++) {
            newLineup.defence.ld[i] = findAndAssignPlayer(defencemen, 'LD');
            newLineup.defence.rd[i] = findAndAssignPlayer(defencemen, 'RD');
        }
    
        newLineup.goalies.starter = findAndAssignPlayer(goalies, 'G');
        newLineup.goalies.backup = findAndAssignPlayer(goalies, 'G');
    
        updateTeam({ ...team, lineup: newLineup });
        toast.success("Lines have been auto-filled with healthy players.");
    };

    const autoAssignRoles = () => {
        const newRoster = team.roster.map(p => ({ ...p }));
        const rosterMap = new Map(newRoster.map(p => [p.id, p]));

        const forwardRoles = roles.filter(r => r.positions.includes('Forward'));
        const defenceRoles = roles.filter(r => r.positions.includes('Defenceman'));

        const findBestRole = (player: Player, availableRoles: typeof roles): string | null => {
            if (!player || !player.roleSuitability || availableRoles.length === 0) return null;

            let bestRoleName: string | null = null;
            let maxSuitability = -1;

            for (const role of availableRoles) {
                const suitability = player.roleSuitability[role.name] || 0;
                if (suitability > maxSuitability) {
                    maxSuitability = suitability;
                    bestRoleName = role.name;
                }
            }
            return bestRoleName;
        };

        Object.values(team.lineup.forwards).flat().forEach(playerId => {
            if (!playerId) return;
            const player = rosterMap.get(playerId) as Player;
            if (player) {
                const bestRole = findBestRole(player, forwardRoles);
                if (bestRole) player.role = bestRole;
            }
        });

        Object.values(team.lineup.defence).flat().forEach(playerId => {
            if (!playerId) return;
            const player = rosterMap.get(playerId) as Player;
            if (player) {
                const bestRole = findBestRole(player, defenceRoles);
                if (bestRole) player.role = bestRole;
            }
        });

        updateTeam({ ...team, roster: newRoster });
        toast.success("Player roles have been auto-assigned based on position and suitability.");
    };

    const autoFillTactics = () => {
        const newTactics = { ...team.tactics };
        Object.keys(groupedTactics).forEach(phase => {
            Object.keys(groupedTactics[phase]).forEach(category => {
                const bestTactic = groupedTactics[phase][category]
                    .map(t => ({ tactic: t, suitability: calculateTacticSuitability(t, team.roster) }))
                    .sort((a, b) => b.suitability.score - a.suitability.score)[0];
                newTactics[category] = bestTactic.tactic.tactic;
            });
        });
        updateTeam({ ...team, tactics: newTactics });
    };

    const groupedTactics = useMemo(() => tactics.reduce((acc, t) => {
        acc[t.phase] = acc[t.phase] || {};
        acc[t.phase][t.category] = acc[t.phase][t.category] || [];
        acc[t.phase][t.category].push(t);
        return acc;
    }, {} as Record<string, Record<string, typeof tactics>>), []);

    const LineupSlot = ({ posType, pos, index }: { posType: 'forwards' | 'defence' | 'goalies', pos: string, index: number | null }) => {
        let currentId: string | null;
        let players: Player[];
        let onValueChangeHandler: (val: string | null) => void;
        let placeholderText: string;
        let positionForFilter: Position;

        if (posType === 'forwards') {
            const typedPos = pos as keyof LineupType['forwards'];
            currentId = team.lineup.forwards[typedPos][index!];
            onValueChangeHandler = (val: string) => handleLineupChange('forwards', typedPos, index!, val === 'empty' ? null : val);
            positionForFilter = pos.toUpperCase() as Position;
            placeholderText = `Select ${pos.toUpperCase()}`;
        } else if (posType === 'defence') {
            const typedPos = pos as keyof LineupType['defence'];
            currentId = team.lineup.defence[typedPos][index!];
            onValueChangeHandler = (val: string) => handleLineupChange('defence', typedPos, index!, val === 'empty' ? null : val);
            positionForFilter = pos.toUpperCase() as Position;
            placeholderText = `Select ${pos.toUpperCase()}`;
        } else { // goalies
            const typedPos = pos as keyof LineupType['goalies'];
            currentId = team.lineup.goalies[typedPos];
            onValueChangeHandler = (val: string) => handleGoalieChange(typedPos, val === 'empty' ? null : val);
            positionForFilter = 'G';
            placeholderText = `Select ${pos.toUpperCase()}`;
        }

        players = getAvailablePlayers(positionForFilter, currentId);
        const player = currentId ? playerMap.get(currentId) as Player : undefined;

        if (player) {
            return (
                <div className="flex flex-col items-center gap-1">
                    <PlayerLineupCard 
                        player={player} 
                        onRoleChange={(newRole) => handleRoleChange(player.id, newRole)} 
                        displayName={playerDisplayNames.get(player.id) || player.name.split(' ').pop()?.toUpperCase() || ''}
                    />
                    <Button variant="link" className="h-auto p-0 text-xs" onClick={() => onValueChangeHandler(null)}>Remove</Button>
                </div>
            );
        }

        return (
            <Select value={currentId || 'empty'} onValueChange={(val: string) => onValueChangeHandler(val)}>
                <SelectTrigger className="w-full h-full min-h-[118px] bg-muted/50 border-dashed">
                    <SelectValue placeholder={placeholderText} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="empty">Empty</SelectItem>
                    {players.map((p: Player) => (
                        <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.positions.join(', ')}) - {p.starRating}⭐ {p.eligibility === 'Staff' && '(Staff)'}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    };

    const LineRow = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div className="grid grid-cols-4 items-start gap-4 py-2 border-b">
            <div className="font-semibold text-muted-foreground pt-2">{title}</div>
            <div className="col-span-3">{children}</div>
        </div>
    );

    return (
        <Tabs defaultValue="lineup" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lineup">Lineup</TabsTrigger>
                <TabsTrigger value="tactics">Tactics</TabsTrigger>
            </TabsList>
            <TabsContent value="lineup">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Set Your Lines</CardTitle>
                            <div className="flex items-center gap-2">
                                <Button onClick={autoAssignRoles} variant="outline">Auto-Assign Roles</Button>
                                <Button onClick={autoFillLines}>Auto-Fill Lines</Button>
                            </div>
                        </div>
                        <CardDescription>
                            You can have a maximum of 2 staff members in your lineup. Currently: {staffInLineupCount}/2
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Forwards</h3>
                            {[...Array(3)].map((_, i) => (
                                <LineRow key={i} title={`Line ${i + 1}`}>
                                    <div className="grid grid-cols-3 gap-2">
                                        <LineupSlot posType="forwards" pos="lw" index={i} />
                                        <LineupSlot posType="forwards" pos="c" index={i} />
                                        <LineupSlot posType="forwards" pos="rw" index={i} />
                                    </div>
                                </LineRow>
                            ))}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Defence</h3>
                            {[...Array(3)].map((_, i) => (
                                <LineRow key={i} title={`Pairing ${i + 1}`}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <LineupSlot posType="defence" pos="ld" index={i} />
                                        <LineupSlot posType="defence" pos="rd" index={i} />
                                    </div>
                                </LineRow>
                            ))}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Goalies</h3>
                            <LineRow title="Starter"><LineupSlot posType="goalies" pos="starter" index={null} /></LineRow>
                            <LineRow title="Backup"><LineupSlot posType="goalies" pos="backup" index={null} /></LineRow>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="tactics">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Set Your Tactics</CardTitle>
                            <Button onClick={autoFillTactics}>Auto-Fill Tactics</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {Object.entries(groupedTactics).map(([phase, categories]) => (
                            <div key={phase}>
                                <h3 className="text-lg font-semibold mb-2">{phase}</h3>
                                <div className="space-y-4">
                                    {Object.entries(categories).map(([category, categoryTactics]) => {
                                        const selectedTactic = categoryTactics.find(t => t.tactic === team.tactics[category]);
                                        const suitability = selectedTactic ? calculateTacticSuitability(selectedTactic, team.roster) : { score: 0, explanation: '' };
                                        return (
                                            <div key={category} className="grid grid-cols-3 items-center gap-4">
                                                <label className="font-semibold">{category}</label>
                                                <div className="col-span-2">
                                                    <Select value={team.tactics[category]} onValueChange={(val: string) => handleTacticChange(category, val)}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {categoryTactics.map(t => {
                                                                const tacticSuitability = calculateTacticSuitability(t, team.roster);
                                                                const scaledScore = tacticSuitability.score * 4; // Scale 1-5 to 4-20
                                                                return (
                                                                    <SelectItem key={t.tactic} value={t.tactic}>
                                                                        <div className="flex justify-between w-full items-center pr-2">
                                                                            <span>{t.tactic}</span>
                                                                            <span className="text-muted-foreground text-sm">
                                                                                Suitability: {scaledScore}/20
                                                                            </span>
                                                                        </div>
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                    {selectedTactic && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="flex items-center gap-2 mt-2">
                                                                        {renderStars(suitability.score)}
                                                                        <p className="text-xs text-muted-foreground">Suitability</p>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="bottom" className="max-w-xs">
                                                                    <p className="font-bold mb-1">{selectedTactic.tactic}</p>
                                                                    <p className="text-sm text-muted-foreground mb-2">{suitability.explanation}</p>
                                                                    <p className="text-xs"><span className="font-semibold">Description:</span> {selectedTactic.description}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </<dyad-problem-report summary="4 problems">
<problem file="src/context/TeamContext.tsx" line="1022" column="35" code="2322">Type '(Player | { jerseyNumber: number; currentStats: any[]; history: PlayerSeasonStats[]; morale: string; trainingFocus: string; role: any; captaincy: any; isContinuingEducation: boolean; ... 19 more ...; alumniStatus?: &quot;Retired&quot; | &quot;Active Elsewhere&quot;; })[]' is not assignable to type 'Player[]'.
  Type 'Player | { jerseyNumber: number; currentStats: any[]; history: PlayerSeasonStats[]; morale: string; trainingFocus: string; role: any; captaincy: any; isContinuingEducation: boolean; ... 19 more ...; alumniStatus?: &quot;Retired&quot; | &quot;Active Elsewhere&quot;; }' is not assignable to type 'Player'.
    Type '{ jerseyNumber: number; currentStats: any[]; history: PlayerSeasonStats[]; morale: string; trainingFocus: string; role: any; captaincy: any; isContinuingEducation: boolean; ... 19 more ...; alumniStatus?: &quot;Retired&quot; | &quot;Active Elsewhere&quot;; }' is not assignable to type 'Player'.
      Types of property 'morale' are incompatible.
        Type 'string' is not assignable to type '&quot;Content&quot; | &quot;Happy&quot; | &quot;Unhappy&quot; | &quot;Angry&quot;'.</problem>
<problem file="src/context/TeamContext.tsx" line="1092" column="108" code="2339">Property 'buildTimeWeeks' does not exist on type 'FacilityProject'.</problem>
<problem file="src/context/TeamContext.tsx" line="1094" column="35" code="2322">Type '(FacilityProject | { status: string; weeksToComplete: any; id: string; name: string; description: string; cost: number; benefit: string; })[]' is not assignable to type 'FacilityProject[]'.
  Type 'FacilityProject | { status: string; weeksToComplete: any; id: string; name: string; description: string; cost: number; benefit: string; }' is not assignable to type 'FacilityProject'.
    Type '{ status: string; weeksToComplete: any; id: string; name: string; description: string; cost: number; benefit: string; }' is not assignable to type 'FacilityProject'.
      Types of property 'status' are incompatible.
        Type 'string' is not assignable to type '&quot;Not Started&quot; | &quot;In Progress&quot; | &quot;Completed&quot;'.</problem>
<problem file="src/context/TeamContext.tsx" line="1096" column="68" code="2339">Property 'buildTimeWeeks' does not exist on type 'FacilityProject'.</problem>
</dyad-problem-report><think>Deciding which files are relevant...

**Deconstructing the Errors**

I'm currently focused on dissecting the user's TypeScript compilation woes. First up, error number one! Seems like a type mismatch between an array of Player or other objects and a simple Player array. The "morale" property is the culprit; it's a string where a more complex type is needed, as I understand it.


**Pinpointing Type Discrepancies**

I'm now tackling the second error. It seems that a property, `buildTimeWeeks`, is missing from `FacilityProject`, which is preventing access in the `startFacilityProject` function. My analysis reveals that the correct property should be `weeksToComplete`. Looks like a simple property mismatch, stemming from data inconsistencies between the `types/index.ts` file and the `initialFacilityProjects` data structure.


**Examining the Facility Project**

My current focus is on the third error, which is a type mismatch with the `status` property of the `FacilityProject`. The `status` property seems to be assigned the string `'In Progress'`, but it should be a union of specific string literals like `"Not Started"`, `"In Progress"`, and `"Completed"`. This is similar to the morale error, and suggests that TypeScript is inferring the wrong type in `startFacilityProject` when creating `updatedProject`. The user likely intended to use a specific literal.


**Refining the Solution**

I'm now homing in on the errors in the `TeamContext.tsx` file. Error 1 looks like a simple type mismatch in the `assignPlayerToRoster` function; ensuring the `morale` property is correctly typed as the literal `"Content"`. Errors 2 and 4, which are regarding missing `buildTimeWeeks`, point to inconsistencies between the `FacilityProject` type and the `initialFacilityProjects` data, and I'm confident that adding `buildTimeWeeks?: number;` will resolve these problems. Error 3 presents a similar challenge related to the `status` property, where I must ensure the literal type is preserved during the `updatedProject` assignment in the `startFacilityProject` function.


{
  "complexity": "low",
  "relevantFiles": [
    "src/context/TeamContext.tsx",
    "src/types/index.ts"
  ]
}</think><dyad-codebase-context files="src/context/TeamContext.tsx,src/types/index.ts">Complexity: low</dyad-codebase-context><think>**Debugging Errors in TypeScript**

I'm currently focused on resolving the initial error flagged in the TypeScript compilation. It seems there's a type mismatch: an array containing both `Player` and other objects is not compatible with the expected `Player[]`. I'm investigating the logic behind how morale is being updated to pinpoint the source of this discrepancy.


**Troubleshooting Morale Types**

I've now moved on to the first compile-time error concerning morale. The issue is a type mismatch in the `Player` object's `morale` property. My code's using a generic `string` when it should be one of the predefined literal values. I'm looking into the assignment within the `assignPlayerToRoster` function and will try to fix the explicit typing to ensure it matches the allowed literals.


**Examining Literal Typing**

I'm now focusing on the first reported error, specifically within `assignPlayerToRoster`. The issue lies in the `morale` property, where `'Content'` is being typed as `string` instead of one of the allowed literal values. I'll try a direct cast to `Player['morale']`. I've also identified two other type errors, in the same file, which share this string literal problem with `"In Progress"` as the status.


**Typing the Project**

I've identified and addressed the issue where `buildTimeWeeks` was missing. I've added `buildTimeWeeks?: number;` to the `FacilityProject` type in `src/types/index.ts`. Now, I'll focus on rectifying the type mismatches related to string literals within the `TeamContext.tsx` file.


</think>It looks like these errors are primarily due to missing properties in type definitions and some strict type checking around string literals. I'll address them by:

1.  **Updating `FacilityProject` type:** Adding `buildTimeWeeks?: number;` to the `FacilityProject` interface in `src/types/index.ts` to resolve errors related to that property.
2.  **Explicitly typing string literals:** Ensuring that string literals like `'Content'` and `'In Progress'` are explicitly cast to their respective union types (`Player['morale']` and `FacilityProject['status']`) to satisfy TypeScript's strict type checking.

Here are the changes:

<dyad-write path="src/types/index.ts" description="Adding buildTimeWeeks to FacilityProject type.">
```typescript
export type Position = "C" | "LW" | "RW" | "LD" | "RD" | "G";

export type Instruction = "Encourage" | "Discipline" | "Praise" | "Push Harder" | "Calm Down";

export type ActiveInstruction = {
  type: Instruction;
  duration: number; // in game ticks
};

export type PlayerArchetype = {
  position: 'Defenceman' | 'Centre' | 'Winger' | 'Goaltender';
  type: string;
  physicality: string;
  description: string;
};

export type SkaterAttributes = {
  acceleration: number;
  agility: number;
  balance: number;
  fighting: number;
  speed: number;
  stamina: number;
  strength: number;
  hitting: number;
  aggression: number;
  bravery: number;
  determination: number;
  leadership: number;
  professionalism: number;
  teamPlayer: number;
  temperament: number;
  gettingOpen: number;
  offensiveRead: number;
  passing: number;
  puckhandling: number;
  screening: number;
  shootingAccuracy: number;
  shootingRange: number;
  checking: number;
  defensiveRead: number;
  faceoffs: number;
  positioning: number;
  shotBlocking: number;
  stickchecking: number;
  aging: number;
  ambition: number;
  bigGames: number;
  coachability: number;
  controversy: number;
  developmentRate: number;
  greed: number;
  handleFailure: number;
  handleSuccess: number;
  handleCritics: number;
  injuryProneness: number;
  intelligence: number;
  loyalty: number;
  mood: number;
  sportsmanship: number;
  passShootTendency: number;
};

export type GoalieAttributes = {
  blocker: number;
  glove: number;
  lowShots: number;
  positioning: number;
  rebound: number;
  recovery: number;
  reflexes: number;
  passing: number;
  pokeCheck: number;
  puckhandling: number;
  skating: number;
  mentalToughness: number;
  goaltenderStamina: number;
  aging: number;
  ambition: number;
  bigGames: number;
  coachability: number;
  controversy: number;
  developmentRate: number;
  greed: number;
  handleFailure: number;
  handleSuccess: number;
  handleCritics: number;
  injuryProneness: number;
  intelligence: number;
  loyalty: number;
  mood: number;
  sportsmanship: number;
  professionalism: number;
  determination: number;
  leadership: number;
};

export type PlayerSeasonStats = {
  season: string;
  team: string;
  league: string;
  gamesPlayed: number;
  goals?: number;
  assists?: number;
  points?: number;
  penaltyMinutes?: number;
  captaincy?: 'C' | 'A' | null;
  goalsAgainst?: number;
  shotsAgainst?: number;
  saves?: number;
  goalsAgainstAverage?: number;
  savePercentage?: number;
  shutouts?: number;
};

export type TrainingFocus = "Skating" | "Shooting" | "Playmaking" | "Defense" | "Physical" | "Mental" | "Goaltending" | null;

export type Player = {
  id: string;
  jerseyNumber: number;
  name: string;
  age: number;
  nationality: string;
  positions: Position[];
  starRating: number;
  morale: "Content" | "Happy" | "Unhappy" | "Angry";
  healthStatus: "Healthy" | "Injured" | "Suspended";
  injury: { type: string; duration: number } | null;
  eligibility: "UG Year 1" | "UG Year 2" | "UG Year 3" | "UG Year 4" | "Masters" | "PhD" | "Staff";
  archetype: PlayerArchetype;
  attributes: SkaterAttributes | GoalieAttributes;
  currentAbility: number;
  potentialAbility: number;
  role: string | undefined;
  roleSuitability: { [key: string]: number };
  captaincy: 'C' | 'A' | null;
  yearsLeftInProgram?: number;
  history: PlayerSeasonStats[];
  trainingFocus: TrainingFocus;
  currentStats: PlayerSeasonStats[];
  activeInstructions: ActiveInstruction[];
  source?: 'Local' | 'International' | 'Transfer';
  estimatedQuality?: 'Beginner' | 'Moderate' | 'Intermediate' | 'Experienced' | 'Elite';
  recruitmentCost?: number;
  alumniStatus?: 'Retired' | 'Active Elsewhere';
  isContinuingEducation?: boolean;
};

export type Lineup = {
  forwards: {
    lw: (string | null)[];
    c: (string | null)[];
    rw: (string | null)[];
  };
  defence: {
    ld: (string | null)[];
    rd: (string | null)[];
  };
  goalies: {
    starter: string | null;
    backup: string | null;
  };
};

export type TacticsSelection = {
  [key: string]: string;
};

export type BudgetCategory = "Travel" | "Equipment" | "Ice Time" | "Recruiting" | "Student Life" | "Facilities";

export type BudgetAllocations = {
  [key in BudgetCategory]: number;
};

export type Financials = {
  totalBudget: number;
  iceTimeCostPerGame: number;
  equipmentCost: number;
  budgetAllocations: BudgetAllocations;
};

export type FacilityProject = {
  id: string;
  name: string;
  description: string;
  cost: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
  benefit: string;
  weeksToComplete?: number;
  buildTimeWeeks?: number; // Added this property
};

export type Team = {
  id: string;
  name: string;
  logo: string;
  leagueDivision: string;
  nationalsDivision: string;
  roster: Player[];
  wins: number;
  losses: number;
  draws: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  lineup: Lineup;
  tactics: TacticsSelection;
  financials: Financials;
  facilities: FacilityProject[];
};

export type GameEvent = {
  time: string;
  period: number;
  team: string;
  description: string;
};

export type PowerPlayState = {
  isActive: boolean;
  teamOnPowerPlay: string | null;
  timeLeft: number; // in game ticks
};

export type GameState = {
  userScore: number;
  opponentScore: number;
  userShots: number;
  opponentShots: number;
  period: number;
  time: number;
  gameLog: GameEvent[];
  isGameOver: boolean;
  isPaused: boolean;
  injuries: { teamName: string; playerId: string; injuryType: string; duration: number; }[];
  possessionHolder: string | null;
  powerPlayState: PowerPlayState;
};

export type GameDate = {
  year: number;
  month: string;
  week: number;
};

export type ScheduleEntry = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: GameDate;
  status: 'scheduled' | 'completed';
  result?: { homeScore: number; awayScore: number };
  round?: number;
};

export type DevelopmentLog = {
  playerId: string;
  playerName: string;
  attribute: string;
  change: number;
  newRating: number;
  date: GameDate;
};

export type Tactic = {
  phase: string;
  category: string;
  tactic: string;
  description: string;
  bestUsedWith: string;
  strongVs: string;
  weakVs: string;
};

export type TacticSuitability = {
  score: number;
  explanation: string;
};

export type TeamRecord = {
  playerName: string;
  teamName: string;
  value: number;
  season?: string;
};

export type RecordCategory = 'Goals' | 'Assists' | 'Points' | 'PenaltyMinutes' | 'GAA' | 'SavePercentage' | 'Shutouts';

export type LegacyRecord = {
  playerName: string;
  teamName: string;
  category: RecordCategory;
  type: 'season' | 'career';
  value: number;
  season?: string;
};

// Nationals Types
export type NationalsStanding = {
  teamName: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export type NationalsGroup = {
  name: string; // e.g., "Group A"
  teams: string[]; // team names
  standings: NationalsStanding[];
};

export type NationalsPlayoffMatch = {
  id: string;
  round: 'Quarter-Final' | 'Semi-Final' | 'Final' | 'Preliminary';
  bracket: 'Gold' | 'Silver';
  homeTeam: string | { winnerOf: string };
  awayTeam: string | { winnerOf: string };
  winner?: string;
  result?: { homeScore: number; awayScore: number };
  status: 'scheduled' | 'completed';
  date: GameDate;
};

export type NationalsTournament = {
  division: string;
  year: number;
  groups: NationalsGroup[];
  groupStageSchedule: ScheduleEntry[];
  playoffSchedule: NationalsPlayoffMatch[];
  status: 'pending' | 'group-stage' | 'silver-playoffs' | 'gold-playoffs' | 'completed';
  winner?: string;
  currentRound: number | 'Preliminary' | 'Quarter-Final' | 'Semi-Final' | 'Final';
};

// History Types
export type TeamSeasonHistory = {
  teamName: string;
  leagueDivision: string;
  nationalsDivision: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type SeasonHistory = {
  [season: string]: TeamSeasonHistory[];
};