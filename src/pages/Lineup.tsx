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
        ].filter((id): id is string => id !== null); // Filter out nulls here

        return lineupPlayerIds.reduce((count, id) => {
            const player = playerMap.get(id);
            if (player && player.eligibility === 'Staff') { // Check if player exists and then its eligibility
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
            const player = rosterMap.get(playerId);
            if (player) {
                const bestRole = findBestRole(player, forwardRoles);
                if (bestRole) player.role = bestRole;
            }
        });

        Object.values(team.lineup.defence).flat().forEach(playerId => {
            if (!playerId) return;
            const player = rosterMap.get(playerId);
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
                    <Button variant="link" className="h-auto p-0 text-xs" onClick={() => onValueChangeHandler('empty')}>Remove</Button>
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
                            <<dyad-problem-report summary="1 problems">
<problem file="src/context/TeamContext.tsx" line="1418" column="18" code="2345">Argument of type '(prevTeams: Team[]) =&gt; { facilities: (FacilityProject | { status: string; weeksToComplete: number; id: string; name: string; description: string; cost: number; benefit: string; })[]; ... 14 more ...; tactics: TacticsSelection; }[]' is not assignable to parameter of type 'SetStateAction&lt;Team[]&gt;'.
  Type '(prevTeams: Team[]) =&gt; { facilities: (FacilityProject | { status: string; weeksToComplete: number; id: string; name: string; description: string; cost: number; benefit: string; })[]; ... 14 more ...; tactics: TacticsSelection; }[]' is not assignable to type '(prevState: Team[]) =&gt; Team[]'.
    Type '{ facilities: (FacilityProject | { status: string; weeksToComplete: number; id: string; name: string; description: string; cost: number; benefit: string; })[]; financials: { budgetAllocations: { ...; }; totalBudget: number; iceTimeCostPerGame: number; equipmentCost: number; }; ... 13 more ...; tactics: TacticsSelect...' is not assignable to type 'Team[]'.
      Type '{ facilities: (FacilityProject | { status: string; weeksToComplete: number; id: string; name: string; description: string; cost: number; benefit: string; })[]; financials: { ...; }; ... 13 more ...; tactics: TacticsSelection; }' is not assignable to type 'Team'.
        Types of property 'facilities' are incompatible.
          Type '(FacilityProject | { status: string; weeksToComplete: number; id: string; name: string; description: string; cost: number; benefit: string; })[]' is not assignable to type 'FacilityProject[]'.
            Type 'FacilityProject | { status: string; weeksToComplete: number; id: string; name: string; description: string; cost: number; benefit: string; }' is not assignable to type 'FacilityProject'.
              Type '{ status: string; weeksToComplete: number; id: string; name: string; description: string; cost: number; benefit: string; }' is not assignable to type 'FacilityProject'.
                Types of property 'status' are incompatible.
                  Type 'string' is not assignable to type '&quot;Not Started&quot; | &quot;In Progress&quot; | &quot;Completed&quot;'.</problem>
</dyad-problem-report><think>Deciding which files are relevant...

**Analyzing Type Mismatch**

I've pinpointed the issue: a type mismatch within the `Team` type, specifically with the `facilities` property. It seems the `status` field within the `facilities` isn't aligning with the expected type. I'm reviewing the `Team` and `facilities` definitions now.


**Troubleshooting Status Types**

I'm now focusing on the `startFacilityProject` function. The compiler's complaining about the `status` type, despite the literal string assignment. My initial thought was wrong: spreading `...f` isn't the issue. I'm revisiting the types to understand why a literal string assignment isn't working as expected. The error suggests some underlying type inference issue.


**Diagnosing Literal String Issue**

I'm still looking at the `startFacilityProject` function.  I've isolated the problem to the object literal within the `map` function where I'm updating the status. It seems the `status` property is being inferred as `string` when it should retain the literal type.  The type definition of `FacilityProject` and the assignment are both correct, yet the error persists. I'm checking the data initialization to see how the initial projects are typed.


**Reviewing Initial Typing**

I'm now revisiting how `initialFacilityProjects` and `team.facilities` are typed. The root cause likely lies in the initial data or how it's being passed. Although `FacilityProject` is well-defined, the issue persists, meaning the typing isn't being fully preserved during data initialization. I'm focusing on the data flow.


{
  "complexity": "low",
  "relevantFiles": [
    "src/context/TeamContext.tsx"
  ]
}</think><dyad-codebase-context files="src/context/TeamContext.tsx">Complexity: low</dyad-codebase-context><think>**Investigating the Compile Error**

I'm currently scrutinizing a TypeScript compile-time error within `TeamContext.tsx`. The error report zeroes in on a type mismatch concerning the `facilities` property when updating the `Team` state. The detailed message highlights the incompatibility, and I'm diving deeper to pinpoint the precise cause. I suspect a type issue during the update process itself.


**Addressing the Status Mismatch**

I've isolated the root cause; the `startFacilityProject` function in `src/context/TeamContext.tsx` is inadvertently losing the literal type definition for the `status` property when creating new `FacilityProject` objects. The immediate fix is to ensure the `status` is explicitly set as the correct literal type. I'm reviewing the `startFacilityProject` implementation to refine the property assignment to match the required literal.


**Pinpointing the Literal Issue**

I've confirmed my initial hunch about `startFacilityProject`. The error arises because the newly created `FacilityProject` objects within the function are not preserving the literal type definition of the `status` property. Specifically, I'm losing the explicit type constraint when creating the new object. I'm leaning toward correcting the type assignment during the update, to match the `FacilityProject` type in `types/index.ts`.


**Addressing Literal Type Enforcement**

I've reviewed the `startFacilityProject` function, focusing on the update logic. The crucial part is the mapping of `facilities` and the assignment of the `status` property. I see where the literal type is lost. The fix is to explicitly cast the `status` property to the correct literal union type when updating. I'm now refining the code to include the explicit casting for `"In Progress"`, to preserve the type integrity during object creation.


**Rectifying the Status Cast**

I've reviewed the `startFacilityProject` function once more, confirming that the `status` property needs an explicit type. The error is that the literal type is lost during the object spread, creating a type conflict. The fix is to explicitly cast `'In Progress'` to `FacilityProjectStatus`, or use a type assertion to ensure the correct typing, when updating a facility's status. I'm now modifying the line `status: 'In Progress'` to correctly resolve the type mismatch.


**Examining Data Structure Issues**

I'm currently inspecting the potential cause of the type mismatch. Specifically, the `initialFacilityProjects` array within `src/data/facilities.ts` might be the source of the literal type loss. It's possible that the type inference on the objects in this array defaults to `string` instead of the expected literal union type.


**Addressing the Array Mapping**

I'm now scrutinizing the result of the `map` function, focusing on the updated `facilities` array. The error suggests that the array's elements aren't consistently typed as `FacilityProject`. Specifically, the spread of `f` causes the original typing to be carried, while the direct assignment `status: 'In Progress'` is creating a mismatch due to type inference. The next step is to explicitly ensure the mapping preserves the `FacilityProject` type for all the array elements.


**Refining the Object Creation**

I've pinpointed the core issue: the type inference on the objects within the `map` function isn't preserving the `FacilityProject` type when updating the `status`. Specifically, when I spread `f` and then assign `status: 'In Progress'`, the final object loses its literal type definition. I'm now modifying the line to ensure the new object explicitly aligns with the `FacilityProject` interface, resolving the type conflict and ensuring the literal type safety.


**Addressing the Array Mapping**

I'm now focused on the updated `facilities` array and the error in `TeamContext.tsx`. It appears the `map` function's returned elements aren't strictly typed as `FacilityProject`. When spreading `f`, the original type is carried, but the direct assignment of `'In Progress'` is causing a type mismatch. The next step is to refine how the map operation maintains the correct `FacilityProject` type throughout.


**Examining the Map Function**

I've re-examined the `map` callback, focusing on type safety. The key is to explicitly assert the type for the updated objects. The problem stems from the mixed return types: some elements are `FacilityProject`, and others are implicitly typed with a generic `status: string`. My next move is to ensure all elements within the `facilities` array adhere strictly to the `FacilityProject` type after the `map` operation.


**Addressing the `project` Casting**

I'm updating the `startFacilityProject` function. To fix the type mismatch, I've cast the `project` variable from the `find` result to `FacilityProject`. I'm also incorporating the explicit type assertion. I'm re-testing the compilation to confirm the issue has resolved.


**Reassessing the Type Assertions**

I'm now focused on the type assertion. I suspect I might need more robust type management within the `map` function. Specifically, even after casting `project`, the `updatedFacilities` array may still be inferring a broader type. To solve this, I'm exploring more precise typing of the objects within the `map` operation itself, to guarantee that the new object maintains the `FacilityProject` status correctly.


**Analyzing the Map Operation**

I'm now reviewing the `map` function's implementation within `src/context/TeamContext.tsx`. The core problem centers on ensuring the new objects created during the mapping maintain strict compliance with the `FacilityProject` type. The objective is to guarantee literal type safety within the updated `facilities` array, specifically addressing the type mismatch.


**Confirming Map Type Enforcement**

I'm now adding the explicit type assertion within the `map` function to ensure the returned objects are correctly typed. The core issue is ensuring the `facilities` array contains only `FacilityProject` objects after the update. I'm carefully reviewing the implementation for strict compliance with the `FacilityProject` type definition.


**Examining Type Enforcement**

I'm now examining the `startFacilityProject` function and the types used in the `map` operation, and the `initialFacilityProjects` import. Specifically, I'm focused on making sure the updated facilities array has the correct `FacilityProject` type to align with the defined interface, and the `project` variable.


**Refining the Map Function**

I'm re-examining the `map` operation, pinpointing where the literal type is lost during the update. I've determined that the spread operator isn't correctly inferring the type. My focus is on ensuring the type integrity of each new object created, maintaining the correct `FacilityProjectStatus` type during the `map` callback's return, to align with the project interface.


**Analyzing the Type Enforcement**

I'm now re-examining the use of `FacilityProject` throughout `TeamContext.tsx`. I've identified that the error occurs when the literal type for `status` isn't preserved during the object spread within the `map` function. This happens when updating the `facilities` state, specifically when the status is updated. I'm now working to ensure consistent type enforcement in the code.


**Addressing Type Inference Issues**

I'm now focusing on the object spread used within the `map` function and how it interacts with the `status` property and the `project` variable. The spread operator potentially broadens the object's type. The type of `project` could influence the overall type. I'm refining how I'm handling object creation to ensure the `status` maintains the expected literal type.


**Addressing the Array Mapping**

I'm now re-examining the `TeamContext.tsx` and focusing on the `map` operation to ensure the updated `facilities` array strictly conforms to the `FacilityProject` type. The issue lies in preserving the literal type for `status` while modifying the `facilities` array. The next step is to strictly enforce the type during this crucial mapping process, to maintain data integrity.


</think>The error you're seeing in `src/context/TeamContext.tsx` is due to a type mismatch when updating the `facilities` array within a `Team` object. Specifically, TypeScript is inferring the `status` property of a newly created `FacilityProject` object as a generic `string` type, while the `FacilityProject` interface expects a more specific literal type (e.g., `"Not Started" | "In Progress" | "Completed"`).

This often happens when an object is constructed using a spread operator (`...`) and one of the properties being added or overridden comes from a source that TypeScript has inferred as a broader type (like `string` instead of a literal union).

To fix this, I'll make two precise changes in `src/context/TeamContext.tsx`:

1.  **Type Assertion for `project`**: I'll add a type assertion to the `project` variable when it's found from `initialFacilityProjects`. This ensures TypeScript correctly understands `project` as a `FacilityProject` from the start, which helps with downstream type inference.
2.  **Explicitly Type Constructed Object**: Within the `map` function where `updatedFacilities` is created, I'll explicitly cast the new object being returned to `FacilityProject`. This forces TypeScript to validate that the new object conforms to the `FacilityProject` interface, including its `status` property, at the point of creation.

These changes will ensure that the `status` property maintains its correct literal type, resolving the compile-time error.

<dyad-write path="src/context/TeamContext.tsx" description="Fixing type mismatch for FacilityProject status in startFacilityProject function.">
```typescript
import { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Team, Player, BudgetAllocations, SkaterAttributes, GoalieAttributes, DevelopmentLog, TrainingFocus, GameState, FacilityProject, BudgetCategory, Financials, ScheduleEntry, GameDate, PlayerSeasonStats, RecordCategory, TeamRecord, NationalsPlayoffMatch, SeasonHistory, TeamSeasonHistory } from '@/types';
import { teams as initialTeams, getTeamOrganizations, getOrganizationName } from '@/data/teams';
import { generateRecruits, generatePlayer, calculateStarRating } from '@/lib/playerGenerator';
import { toast } from 'sonner';
import { calculateCurrentAbility } from '@/lib/playerGenerator';
import { trainingFocusesMap } from '@/data/trainingFocuses';
import { skaterFocuses, goalieFocuses } from '@/data/trainingFocuses';
import { processGameResults as processGameResultsEngine } from '@/lib/statsEngine';
import { generateSeasonSchedule } from '@/lib/scheduleGenerator';
import { simulateFullGame } from '@/lib/gameEngine';
import { validateLineup } from '@/lib/lineupValidation';
import { createNationalsTournament, generatePlayoffBracket } from '@/lib/nationalsGenerator';
import { NationalsTournament } from '@/types';
import { isRivalryGame } from '@/lib/rivalries';
import { rebalanceOrganizationRosters } from '@/lib/aiManager';
import { initialFacilityProjects } from '@/data/facilities';

const months = ["August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June", "July"];
const moraleLevels: Player['morale'][] = ["Angry", "Unhappy", "Content", "Happy"];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomValueInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const updateMorale = (currentMorale: Player['morale'], change: 1 | -1): Player['morale'] => {
    const currentIndex = moraleLevels.indexOf(currentMorale);
    const newIndex = Math.max(0, Math.min(moraleLevels.length - 1, currentIndex + change));
    return moraleLevels[newIndex];
};

interface TeamContextType {
    teams: Team[];
    updateTeam: (updatedTeam: Team) => void;
    userTeam: Team | null;
    organizationFinancials: Financials | null;
    organizationFacilities: FacilityProject[] | null;
    selectTeam: (teamName: string | null) => void;
    scoutingPool: Player[];
    recruitedPool: Player[];
    fairHosted: boolean;
    generateScoutingPool: () => void;
    recruitPlayer: (playerId: string) => void;
    assignPlayerToRoster: (playerId: string) => void;
    discardRecruit: (playerId: string) => void;
    updateBudgetAllocations: (newAllocations: BudgetAllocations) => void;
    runStudentLifeInitiative: () => void;
    startFacilityProject: (projectId: string) => void;
    currentDate: GameDate;
    advanceWeek: () => void;
    developmentHistory: DevelopmentLog[];
    updatePlayerTrainingFocus: (playerId: string, focus: TrainingFocus) => void;
    autoAssignTrainingFocuses: () => void;
    processGameResults: (userTeam: Team, opponentTeam: Team, gameState: GameState, isNationalsGame?: boolean, nationalsDivision?: string, gameId?: string) => void;
    movePlayer: (playerId: string, fromTeamName: string, toTeamName: string) => void;
    requestPlayerTransfer: (playerId: string, fromTeamName: string, toTeamName: string) => void;
    managedOrganization: string | null;
    isManagingOrg: boolean;
    managedTeams: Team[];
    selectOrganization: (orgName: string | null) => void;
    setActiveTeam: (teamName: string) => void;
    schedule: ScheduleEntry[];
    gameForCurrentWeek: { id: string; opponent: string; date: GameDate; isNationals: boolean; homeTeam: string | { winnerOf: string }; awayTeam: string | { winnerOf: { winnerOf: string } | string }; } | null;
    nationalsData: { [year: number]: { [division: string]: NationalsTournament } };
    markGameAsCompleted: (gameId: string, homeScore: number, awayScore: number) => void;
    seasonRecords: { [key in RecordCategory]?: TeamRecord };
    careerRecords: { [key in RecordCategory]?: TeamRecord };
    alumni: Player[];
    playNationalsRound: (division: string, userGameResult?: { homeTeamName: string, awayTeamName: string, homeScore: number, awayScore: number, gameId: string }) => void;
    autoSimulateUserNationalsGame: (division: string, gameId: string) => void;
    seasonHistory: SeasonHistory;
    simulateFullNationalsTournament: (division: string) => void;
    simulateSingleNationalsGame: (division: string, gameId: string) => void;
    simulateAllNationalsTournaments: () => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const useTeam = () => {
    const context = useContext(TeamContext);
    if (context === undefined) {
        throw new Error('useTeam must be used within a TeamProvider');
    }
    return context;
};

export const TeamProvider = ({ children }: { children: ReactNode }): JSX.Element => {
    const [teams, setTeams] = useState<Team[]>(() => {
        try {
            const savedTeams = localStorage.getItem('teams');
            if (savedTeams) {
                const parsedTeams = JSON.parse(savedTeams);
                if (Array.isArray(parsedTeams)) {
                    return parsedTeams;
                }
            }
        } catch (error) {
            console.error("Failed to load teams from localStorage:", error);
            // Fallback to initialTeams in case of parsing error or no saved data
        }
        localStorage.setItem('teams', JSON.stringify(initialTeams)); // Ensure initialTeams is saved if no valid data
        return initialTeams; // Always return initialTeams if no valid saved data
    });

    useEffect(() => {
        localStorage.setItem('teams', JSON.stringify(teams));
    }, [teams]);

    const [alumni, setAlumni] = useState<Player[]>(() => {
        try {
            const saved = localStorage.getItem('alumni');
            return saved ? JSON.parse(saved) : [];
        } catch (error) { return []; }
    });

    useEffect(() => {
        localStorage.setItem('alumni', JSON.stringify(alumni));
    }, [alumni]);

    const [seasonHistory, setSeasonHistory] = useState<SeasonHistory>(() => {
        try {
            const saved = localStorage.getItem('seasonHistory');
            return saved ? JSON.parse(saved) : {};
        } catch (error) { return {}; }
    });

    useEffect(() => {
        localStorage.setItem('seasonHistory', JSON.stringify(seasonHistory));
    }, [seasonHistory]);

    const [activeTeamName, setActiveTeamName] = useState<string | null>(() => localStorage.getItem('activeTeamName') || null);
    const [managedOrganization, setManagedOrganization] = useState<string | null>(() => localStorage.getItem('managedOrganization') || null);
    const [isManagingOrg, setIsManagingOrg] = useState<boolean>(() => localStorage.getItem('isManagingOrg') === 'true');
    
    const [schedule, setSchedule] = useState<ScheduleEntry[]>(() => {
        try {
            const saved = localStorage.getItem('schedule');
            return saved ? JSON.parse(saved) : [];
        } catch (error) { return []; }
    });

    useEffect(() => {
        localStorage.setItem('schedule', JSON.stringify(schedule));
    }, [schedule]);

    const [nationalsData, setNationalsData] = useState<{ [year: number]: { [division: string]: NationalsTournament } }>(() => {
        try {
            const saved = localStorage.getItem('nationalsData');
            return saved ? JSON.parse(saved) : {};
        } catch (error) { return {}; }
    });

    useEffect(() => {
        localStorage.setItem('nationalsData', JSON.stringify(nationalsData));
    }, [nationalsData]);

    const [seasonRecords, setSeasonRecords] = useState<{ [key in RecordCategory]?: TeamRecord }>(() => {
        try { const saved = localStorage.getItem('seasonRecords'); return saved ? JSON.parse(saved) : {}; } catch (error) { return {}; }
    });
    const [careerRecords, setCareerRecords] = useState<{ [key in RecordCategory]?: TeamRecord }>(() => {
        try { const saved = localStorage.getItem('careerRecords'); return saved ? JSON.parse(saved) : {}; } catch (error) { return {}; }
    });

    useEffect(() => { localStorage.setItem('seasonRecords', JSON.stringify(seasonRecords)); }, [seasonRecords]);
    useEffect(() => { localStorage.setItem('careerRecords', JSON.stringify(careerRecords)); }, [careerRecords]);

    const managedTeams = useMemo(() => {
        if (!managedOrganization) return [];
        const organizations = getTeamOrganizations();
        const org = organizations.find(o => o.name === managedOrganization);
        if (!org) return [];
        const orgTeamNames = org.teams.map(t => t.name);
        return teams.filter(t => orgTeamNames.includes(t.name));
    }, [managedOrganization, teams]);

    const userTeam = useMemo(() => {
        if (!activeTeamName) return null;
        return teams.find(t => t.name === activeTeamName) || null;
    }, [activeTeamName, teams]);

    const organizationFinancials = useMemo(() => {
        if (!managedOrganization || managedTeams.length === 0) return null;
        return {
            totalBudget: managedTeams.reduce((sum, t) => sum + t.financials.totalBudget, 0),
            budgetAllocations: managedTeams.reduce((acc, t) => {
                (Object.keys(t.financials.budgetAllocations) as BudgetCategory[]).forEach(key => {
                    acc[key] = Math.round((acc[key] || 0) + t.financials.budgetAllocations[key]);
                });
                return acc;
            }, { Travel: 0, Equipment: 0, "Ice Time": 0, Recruiting: 0, "Student Life": 0, Facilities: 0 } as BudgetAllocations),
            iceTimeCostPerGame: managedTeams.reduce((sum, t) => sum + t.financials.iceTimeCostPerGame, 0),
            equipmentCost: managedTeams.reduce((sum, t) => sum + t.financials.equipmentCost, 0),
        };
    }, [managedOrganization, managedTeams]);

    const organizationFacilities = useMemo(() => {
        if (!managedOrganization || managedTeams.length === 0) return null;
        const uniqueFacilities = managedTeams.reduce((acc, team) => {
            team.facilities.forEach(project => {
                if (!acc.some(p => p.id === project.id)) {
                    acc.push({ ...project });
                }
            });
            return acc;
        }, [] as FacilityProject[]);

        return uniqueFacilities.map(project => {
            const allVersions = managedTeams.flatMap(t => t.facilities).filter(p => p.id === project.id);
            const completed = allVersions.find(p => p.status === 'Completed');
            const inProgress = allVersions.find(p => p.status === 'In Progress');
            
            const newStatus = (completed?.status || inProgress?.status || 'Not Started') as 'Not Started' | 'In Progress' | 'Completed';
            
            const { status: oldStatus, ...restOfProject } = project;
            return { ...restOfProject, status: newStatus };
        });
    }, [managedOrganization, managedTeams]);

    const selectTeam = (teamName: string | null) => {
        if (teamName) {
            const team = teams.find(t => t.name === teamName);
            if (team) {
                const orgName = getOrganizationName(team.name);
                localStorage.setItem('activeTeamName', teamName);
                localStorage.setItem('managedOrganization', orgName);
                localStorage.setItem('isManagingOrg', 'false');
                setActiveTeamName(teamName);
                setManagedOrganization(orgName);
                setIsManagingOrg(false);
            }
        } else {
            localStorage.removeItem('activeTeamName');
            localStorage.removeItem('managedOrganization');
            localStorage.removeItem('isManagingOrg');
            setActiveTeamName(null);
            setManagedOrganization(null);
            setIsManagingOrg(false);
        }
    };

    const selectOrganization = (orgName: string | null) => {
        if (orgName) {
            const organizations = getTeamOrganizations();
            const org = organizations.find(o => o.name === orgName);
            if (org && org.teams.length > 0) {
                const mainTeam = org.teams[0];
                localStorage.setItem('managedOrganization', orgName);
                localStorage.setItem('activeTeamName', mainTeam.name);
                localStorage.setItem('isManagingOrg', 'true');
                setManagedOrganization(orgName);
                setActiveTeamName(mainTeam.name);
                setIsManagingOrg(true);
            }
        } else {
            localStorage.removeItem('managedOrganization');
            localStorage.removeItem('activeTeamName');
            localStorage.removeItem('isManagingOrg');
            setManagedOrganization(null);
            setActiveTeamName(null);
            setIsManagingOrg(false);
        }
    };

    const setActiveTeam = (teamName: string) => {
        const teamExistsInOrg = managedTeams.some(t => t.name === teamName);
        if (managedOrganization && teamExistsInOrg) {
            localStorage.setItem('activeTeamName', teamName);
            setActiveTeamName(teamName);
        }
    };

    const [scoutingPool, setScoutingPool] = useState<Player[]>(() => {
        try {
            const saved = localStorage.getItem('scoutingPool');
            return saved ? JSON.parse(saved) : [];
        } catch (error) { return []; }
    });

    const [recruitedPool, setRecruitedPool] = useState<Player[]>(() => {
        try {
            const saved = localStorage.getItem('recruitedPool');
            return saved ? JSON.parse(saved) : [];
        } catch (error) { return []; }
    });

    const [fairHosted, setFairHosted] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem('fairHosted');
            return saved ? JSON.parse(saved) : false;
        } catch (error) { return false; }
    });

    const [transferPool, setTransferPool] = useState<Player[]>(() => {
        try {
            const saved = localStorage.getItem('transferPool');
            return saved ? JSON.parse(saved) : [];
        } catch (error) { return []; }
    });

    const [currentDate, setCurrentDate] = useState<GameDate>(() => {
        try {
            const saved = localStorage.getItem('currentDate');
            return saved ? JSON.parse(saved) : { month: 'August', week: 1, year: new Date().getFullYear() };
        } catch (error) { return { month: 'August', week: 1, year: new Date().getFullYear() }; }
    });

    const [developmentHistory, setDevelopmentHistory] = useState<DevelopmentLog[]>(() => {
        try {
            const saved = localStorage.getItem('developmentHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (error) { return []; }
    });

    useEffect(() => { localStorage.setItem('scoutingPool', JSON.stringify(scoutingPool)); }, [scoutingPool]);
    useEffect(() => { localStorage.setItem('recruitedPool', JSON.stringify(recruitedPool)); }, [recruitedPool]);
    useEffect(() => { localStorage.setItem('fairHosted', JSON.stringify(fairHosted)); }, [fairHosted]);
    useEffect(() => { localStorage.setItem('transferPool', JSON.stringify(transferPool)); }, [transferPool]);
    useEffect(() => { localStorage.setItem('currentDate', JSON.stringify(currentDate)); }, [currentDate]);
    useEffect(() => { localStorage.setItem('developmentHistory', JSON.stringify(developmentHistory)); }, [developmentHistory]);
    useEffect(() => {
        if (managedOrganization) {
            localStorage.setItem('managedOrganization', managedOrganization);
        } else {
            localStorage.removeItem('managedOrganization');
        }
    }, [managedOrganization]);

    const gameForCurrentWeek = useMemo(() => {
        if (!userTeam) return null;

        const currentYearNationals = nationalsData[currentDate.year];
        if (currentYearNationals && userTeam.nationalsDivision) {
            const tournament = currentYearNationals[userTeam.nationalsDivision];
            if (tournament && (tournament.status === 'group-stage' || tournament.status === 'silver-playoffs' || tournament.status === 'gold-playoffs')) {
                const gamesToCheck = tournament.status === 'group-stage' 
                    ? tournament.groupStageSchedule 
                    : tournament.playoffSchedule;

                const userGame = gamesToCheck.find(g => {
                    if (g.status !== 'scheduled') return false;
                    
                    const isUserGame = (typeof g.homeTeam === 'string' && g.homeTeam === userTeam.name) || 
                                     (typeof g.awayTeam === 'string' && g.awayTeam === userTeam.name);

                    if (!isUserGame) return false;

                    if (tournament.status === 'group-stage') {
                        return g.round === tournament.currentRound;
                    }
                    if (tournament.status === 'silver-playoffs' || tournament.status === 'gold-playoffs') {
                        const currentBracket = tournament.status === 'silver-playoffs' ? 'Silver' : 'Gold';
                        return (g as NationalsPlayoffMatch).round === tournament.currentRound && (g as NationalsPlayoffMatch).bracket === currentBracket;
                    }
                    return false;
                });

                if (userGame) {
                    const opponentName = (typeof userGame.homeTeam === 'string' && userGame.homeTeam === userTeam.name)
                        ? (typeof userGame.awayTeam === 'string' ? userGame.awayTeam : 'TBD')
                        : (typeof userGame.homeTeam === 'string' ? userGame.homeTeam : 'TBD');
                    
                    return {
                        id: userGame.id,
                        opponent: opponentName,
                        date: userGame.date,
                        isNationals: true,
                        homeTeam: userGame.homeTeam,
                        awayTeam: userGame.awayTeam as string | { winnerOf: string }, 
                    };
                }
            }
        }

        const regularGame = schedule.find(game =>
            (game.homeTeam === userTeam.name || game.awayTeam === userTeam.name) &&
            game.date.month === currentDate.month &&
            game.date.week === currentDate.week &&
            game.status === 'scheduled'
        );
        if (regularGame) {
            const opponent = regularGame.homeTeam === userTeam.name ? regularGame.awayTeam : regularGame.homeTeam;
            return { ...regularGame, opponent, isNationals: false };
        }

        return null;
    }, [userTeam, schedule, currentDate, nationalsData]);

    const updateTeam = (updatedTeam: Team) => {
        setTeams(currentTeams =>
            currentTeams.map(t => (t.name === updatedTeam.name ? updatedTeam : t))
        );
    };

    const advanceWeek = () => {
        if (gameForCurrentWeek && userTeam) {
            const validationError = validateLineup(userTeam);
            if (validationError) {
                toast.error("Cannot Advance Week", {
                    description: `Your lineup is invalid: ${validationError}`,
                });
                return;
            }
        }

        let tempTeams = JSON.parse(JSON.stringify(teams)) as Team[];
        
        const allOrgs = getTeamOrganizations();
        const aiOrgs = allOrgs.filter(org => org.name !== managedOrganization);

        aiOrgs.forEach(org => {
            const orgTeamNames = org.teams.map(t => t.name);
            const teamsForRebalancing = tempTeams.filter(t => orgTeamNames.includes(t.name));
            if (teamsForRebalancing.length > 1) {
                const rebalancedTeams = rebalanceOrganizationRosters(teamsForRebalancing);
                rebalancedTeams.forEach(rebalancedTeam => {
                    const index = tempTeams.findIndex(t => t.name === rebalancedTeam.name);
                    if (index !== -1) {
                        tempTeams[index] = rebalancedTeam;
                    }
                });
            }
        });

        let tempSchedule = JSON.parse(JSON.stringify(schedule)) as ScheduleEntry[];
        let newDevelopmentLogs: DevelopmentLog[] = [];
        const managedTeamNames = managedTeams.map(t => t.name);

        const currentYear = currentDate.year;

        let tempNationalsData = JSON.parse(JSON.stringify(nationalsData)) as { [year: number]: { [division: string]: NationalsTournament } };
        let tempSeasonRecords = JSON.parse(JSON.stringify(seasonRecords)) as { [key in RecordCategory]?: TeamRecord };
        let tempCareerRecords = JSON.parse(JSON.stringify(careerRecords)) as { [key in RecordCategory]?: TeamRecord };

        if (currentDate.month === 'May' && currentDate.week === 4) {
            const allTournamentsCompleted = Object.values(tempNationalsData[currentYear] || {}).every(t => t.status === 'completed');
            if (!allTournamentsCompleted) {
                toast.error("Nationals In Progress", { description: "You must complete the National Championships before advancing the week." });
                return;
            }
        }

        const updateGameRecords = (homeTeam: Team, awayTeam: Team) => {
            const allPlayers = [...homeTeam.roster, ...awayTeam.roster];
            const teamsMap = { [homeTeam.name]: homeTeam, [awayTeam.name]: awayTeam };
        
            allPlayers.forEach(player => {
                const team = teamsMap[player.history[player.history.length - 1]?.team || homeTeam.name];
                if (!team) return;

                const isSkater = !player.positions.includes('G');
                const season = `${currentDate.year}-${currentDate.year + 1}`;
        
                if (isSkater) {
                    const stats = player.currentStats[player.currentStats.length - 1];
                    if (!stats) return;
                    if ((stats.goals || 0) > (tempSeasonRecords['Goals']?.value || 0)) tempSeasonRecords['Goals'] = { playerName: player.name, teamName: team.name, value: stats.goals || 0, season };
                    if ((stats.assists || 0) > (tempSeasonRecords['Assists']?.value || 0)) tempSeasonRecords['Assists'] = { playerName: player.name, teamName: team.name, value: stats.assists || 0, season };
                    if ((stats.points || 0) > (tempSeasonRecords['Points']?.value || 0)) tempSeasonRecords['Points'] = { playerName: player.name, teamName: team.name, value: stats.points || 0, season };
                    if ((stats.penaltyMinutes || 0) > (tempSeasonRecords['PenaltyMinutes']?.value || 0)) tempSeasonRecords['PenaltyMinutes'] = { playerName: player.name, teamName: team.name, value: stats.penaltyMinutes || 0, season };
                    
                    const careerGoals = (player.history?.reduce((acc, s) => acc + (s.goals || 0), 0) || 0) + (stats.goals || 0);
                    if (careerGoals > (tempCareerRecords['Goals']?.value || 0)) tempCareerRecords['Goals'] = { playerName: player.name, teamName: team.name, value: careerGoals };
                    const careerAssists = (player.history?.reduce((acc, s) => acc + (s.assists || 0), 0) || 0) + (stats.assists || 0);
                    if (careerAssists > (tempCareerRecords['Assists']?.value || 0)) tempCareerRecords['Assists'] = { playerName: player.name, teamName: team.name, value: careerAssists };
                    const careerPoints = (player.history?.reduce((acc, s) => acc + (s.points || 0), 0) || 0) + (stats.points || 0);
                    if (careerPoints > (tempCareerRecords['Points']?.value || 0)) tempCareerRecords['Points'] = { playerName: player.name, teamName: team.name, value: careerPoints };
                    const careerPims = (player.history?.reduce((acc, s) => acc + (s.penaltyMinutes || 0), 0) || 0) + (stats.penaltyMinutes || 0);
                    if (careerPims > (tempCareerRecords['PenaltyMinutes']?.value || 0)) tempCareerRecords['PenaltyMinutes'] = { playerName: player.name, teamName: team.name, value: careerPims };

                } else { 
                    const stats = player.currentStats[player.currentStats.length - 1];
                    if (!stats) return;
                    if (stats.gamesPlayed >= 5) { 
                        if (!tempSeasonRecords['GAA'] || ((stats.goalsAgainstAverage || 99) < tempSeasonRecords['GAA'].value)) tempSeasonRecords['GAA'] = { playerName: player.name, teamName: team.name, value: stats.goalsAgainstAverage || 99, season };
                        if ((stats.savePercentage || 0) > (tempSeasonRecords['SavePercentage']?.value || 0)) tempSeasonRecords['SavePercentage'] = { playerName: player.name, teamName: team.name, value: stats.savePercentage || 0, season };
                    }
                    if ((stats.shutouts || 0) > (tempSeasonRecords['Shutouts']?.value || 0)) tempSeasonRecords['Shutouts'] = { playerName: player.name, teamName: team.name, value: stats.shutouts || 0, season };
                    
                    const careerShutouts = (player.history?.reduce((acc, s) => acc + (s.shutouts || 0), 0) || 0) + (stats.shutouts || 0);
                    if (careerShutouts > (tempCareerRecords['Shutouts']?.value || 0)) tempCareerRecords['Shutouts'] = { playerName: player.name, teamName: team.name, value: careerShutouts };
                }
            });
        };

        const gamesThisWeek = schedule.filter(game =>
            game.date.month === currentDate.month && game.date.week === currentDate.week && game.status === 'scheduled'
        );

        if (gamesThisWeek.length > 0) {
            gamesThisWeek.forEach(game => {
                if (schedule.find(s => s.id === game.id)?.status === 'completed') return;

                const homeTeamIndex = tempTeams.findIndex(t => t.name === game.homeTeam);
                const awayTeamIndex = tempTeams.findIndex(t => t.name === game.awayTeam);
                if (homeTeamIndex === -1 || awayTeamIndex === -1) return;

                const homeTeam = tempTeams[homeTeamIndex];
                const awayTeam = tempTeams[awayTeamIndex];
                const isBigGame = isRivalryGame(homeTeam.name, awayTeam.name);

                if (isBigGame && (homeTeam.name === userTeam?.name || awayTeam.name === userTeam?.name)) {
                    toast.info("It's a Rivalry Game!", { description: `The atmosphere is electric for ${homeTeam.name} vs ${awayTeam.name}. Players' performance may be affected by the pressure!` });
                }

                const finalGameState = simulateFullGame(homeTeam, awayTeam, isBigGame);

                if (userTeam) {
                    finalGameState.injuries.forEach(injury => {
                        if (injury.teamName === userTeam.name) {
                            const injuredPlayer = userTeam.roster.find(p => p.id === injury.playerId);
                            if (injuredPlayer) {
                                toast.warning("Player Injured!", { description: `${injuredPlayer.name} was injured during the game. (${injury.injuryType}, out for ${injury.duration} weeks)` });
                            }
                        }
                    });
                }

                const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, false);
                tempTeams[homeTeamIndex] = updatedHomeTeam;
                tempTeams[awayTeamIndex] = updatedAwayTeam;
                updateGameRecords(updatedHomeTeam, updatedAwayTeam);

                if (game.homeTeam === userTeam?.name || game.awayTeam === userTeam?.name) {
                    toast.info("Game Auto-Simulated", { description: `${homeTeam.name} ${finalGameState.userScore} - ${awayTeam.name} ${finalGameState.opponentScore}` });
                }
            });
        }

        tempTeams = tempTeams.map(team => {
            let newRoster = [...team.roster];
            let newFacilities = [...team.facilities];
            const isUserManagedTeam = team.name === userTeam?.name || managedTeamNames.includes(team.name);

            newRoster = newRoster.map(player => {
                let playerChanged = false;
                const isSkater = !player.positions.includes('G');

                if (player.injury && player.injury.duration > 0) {
                    const hasPhysio = team.facilities.some(f => f.id === 'physio_office_1' && f.status === 'Completed');
                    player.injury.duration -= (hasPhysio ? 2 : 1);

                    const regression = (Math.random() * 0.1) + 0.02; 
                    if (Math.random() < regression) {
                        let attrsToRegress: (keyof SkaterAttributes | keyof GoalieAttributes)[] = isSkater
                            ? ['speed', 'acceleration', 'agility', 'balance', 'stamina', 'strength']
                            : ['skating', 'goaltenderStamina', 'reflexes', 'recovery'];
                        
                        const attrToRegress = getRandomItem(attrsToRegress);
                        const currentAttrValue = player.attributes[attrToRegress as keyof typeof player.attributes] as number;
                        
                        if (currentAttrValue > 1) {
                            const newAttrValue = Math.max(1, currentAttrValue - regression);
                            (player.attributes[attrToRegress as keyof typeof player.attributes] as number) = newAttrValue;
                            playerChanged = true;
                            if (isUserManagedTeam) {
                                newDevelopmentLogs.push({ playerId: player.id, playerName: player.name, attribute: attrToRegress.toString(), change: -regression, newRating: newAttrValue, date: currentDate });
                            }
                        }
                    }

                    if (player.injury.duration <= 0) {
                        if (team.name === userTeam?.name) toast.success("Player Recovered", { description: `${player.name} has recovered from their injury.` });
                        player.injury = null;
                        player.healthStatus = 'Healthy';
                    }
                } else {
                    const paGap = player.potentialAbility - player.currentAbility;
                    if (player.age < 33 && paGap > 0 && (player as Player).morale !== 'Angry') {
                        const devRate = (player.attributes as SkaterAttributes | GoalieAttributes).developmentRate || 10;
                        const professionalism = (player.attributes as SkaterAttributes | GoalieAttributes).professionalism || 10;
                        const determination = (player.attributes as SkaterAttributes | GoalieAttributes).determination || 10;
                        const coachability = (player.attributes as SkaterAttributes | GoalieAttributes).coachability || 10;
                        const baseDevChance = 0.2;
                        const paBonus = Math.max(0, paGap / 50);
                        const workEthicBonus = (professionalism + determination - 20) / 100;
                        const coachabilityBonus = (coachability - 10) / 100;
                        const devChance = baseDevChance + paBonus + workEthicBonus + coachabilityBonus;
                        if (Math.random() < devChance) {
                            let attributesToDevelop: (keyof SkaterAttributes | keyof GoalieAttributes)[] = [];
                            if ((player as Player).trainingFocus && trainingFocusesMap[(player as Player).trainingFocus]) {
                                attributesToDevelop = trainingFocusesMap[(player as Player).trainingFocus];
                            } else {
                                const allAttrs = Object.keys(player.attributes).filter(attr => !['aging', 'injuryProneness', 'passShootTendency', 'mood', 'controversy', 'greed', 'loyalty', 'handleCritics', 'handleFailure', 'handleSuccess', 'sportsmanship', 'ambition', 'bigGames', 'coachability', 'intelligence'].includes(attr)) as (keyof typeof player.attributes)[];
                                if (allAttrs.length > 0) attributesToDevelop.push(getRandomItem(allAttrs));
                            }
                            if (attributesToDevelop.length > 0) {
                                const attrToImprove = getRandomItem(attributesToDevelop);
                                const currentAttrValue = player.attributes[attrToImprove as keyof typeof player.attributes] as number;
                                if (currentAttrValue < 20) {
                                    let moraleModifier = 1.0;
                                    if ((player as Player).morale === 'Happy') moraleModifier = 1.2;
                                    else if ((player as Player).morale === 'Unhappy') moraleModifier = 0.5;
                                    const improvement = ((Math.random() * 0.2) + (devRate / 100)) * moraleModifier;
                                    const newAttrValue = Math.min(20, currentAttrValue + improvement);
                                    (player.attributes[attrToImprove as keyof typeof player.attributes] as number) = newAttrValue;
                                    playerChanged = true;
                                    if (isUserManagedTeam) newDevelopmentLogs.push({ playerId: player.id, playerName: player.name, attribute: attrToImprove.toString(), change: improvement, newRating: newAttrValue, date: currentDate });
                                }
                            }
                        }
                    }
                    if (player.age > 28) {
                        const baseDeclineChance = 0.05;
                        const agePenalty = (player.age - 28) / 80;
                        const declineChance = baseDeclineChance + agePenalty;
                        if (Math.random() < declineChance) {
                            let attrsToDecline: (keyof SkaterAttributes | keyof GoalieAttributes)[] = isSkater
                                ? ['acceleration', 'agility', 'balance', 'speed', 'stamina', 'strength']
                                : ['skating', 'goaltenderStamina', 'reflexes', 'recovery'];
                            const attrToDecline = getRandomItem(attrsToDecline);
                            const currentAttrValue = player.attributes[attrToDecline as keyof typeof player.attributes] as number;
                            if (currentAttrValue > 1) {
                                const decline = (Math.random() * 0.15) + 0.05;
                                const newAttrValue = Math.max(1, currentAttrValue - decline);
                                (player.attributes[attrToDecline as keyof typeof player.attributes] as number) = newAttrValue;
                                playerChanged = true;
                                if (isUserManagedTeam) newDevelopmentLogs.push({ playerId: player.id, playerName: player.name, attribute: attrToDecline.toString(), change: -decline, newRating: newAttrValue, date: currentDate });
                            }
                        }
                    }
                }

                if (playerChanged) {
                    const newCurrentAbility = calculateCurrentAbility(player.attributes, isSkater);
                    const newStarRating = calculateStarRating(newCurrentAbility, isSkater, team.leagueDivision);
                    player.currentAbility = newCurrentAbility;
                    player.starRating = newStarRating;
                }

                return player;
            });

            newFacilities = newFacilities.map(project => {
                if (project.status === 'In Progress' && project.weeksToComplete) {
                    project.weeksToComplete -= 1;
                    if (project.weeksToComplete <= 0) {
                        project.status = 'Completed';
                        if (team.name === userTeam?.name) toast.info("Facility Project Completed", { description: `${project.name} is now complete.` });
                        if (project.id === 'locker_room_1') {
                            newRoster = newRoster.map(p => ({ ...p, morale: updateMorale(p.morale, 1) }));
                            if (team.name === userTeam?.name) toast.success("Morale Boost!", { description: "The new locker room has boosted team morale." });
                        }
                    }
                }
                return project;
            });

            newRoster = newRoster.map(player => {
                if (Math.random() < 0.1) {
                    if ((player as Player).morale === 'Happy') return { ...player, morale: 'Content' as 'Content' };
                    if ((player as Player).morale === 'Unhappy') return { ...player, morale: 'Content' as 'Content' };
                }
                if (isUserManagedTeam) {
                    const controversyChance = ((player.attributes.controversy || 10) - 10) / 200;
                    if (Math.random() < controversyChance) {
                        toast.warning("Team Controversy!", { description: `${player.name} has caused a stir with off-ice antics, slightly affecting team morale.` });
                        newRoster = newRoster.map(p => ({ ...p, morale: updateMorale(p.morale, -1) }));
                    }
                    const sportsmanship = (player.attributes.sportsmanship || 10);
                    const controversy = (player.attributes.controversy || 10);
                    const positiveEventChance = ((sportsmanship - 1) / 200) + ((20 - controversy) / 200);
                    if (Math.random() < positiveEventChance) {
                        const positiveDescriptions = [ `${player.name} organized a successful team-building event, boosting team cohesion and morale.`, `${player.name} was recognized for their outstanding sportsmanship, setting a positive example for the team.`, `${player.name}'s positive attitude and professionalism are rubbing off on the team, improving overall morale.`, `${player.name} resolved a minor locker room dispute, fostering a more harmonious team environment.`, `${player.name} led a community initiative, bringing positive attention and good vibes to the team.` ];
                        toast.success("Team Harmony!", { description: getRandomItem(positiveDescriptions) });
                        newRoster = newRoster.map(p => ({ ...p, morale: updateMorale(p.morale, 1) }));
                    }
                }
                return player;
            });

            return { ...team, roster: newRoster, facilities: newFacilities };
        });

        const newDate = ((prevDate) => {
            let { month, week, year } = prevDate;
            const monthIndex = months.indexOf(month);
            
            week += 1; 

            if (week > 4) { 
                week = 1;
                let nextMonthIndex = (monthIndex + 1) % months.length;
                if (month === "July" && months[nextMonthIndex] === "August") {
                    year += 1;
                    toast.info("Season Ended", { description: `The ${prevDate.year}-${prevDate.year + 1} season has concluded. Stats are being archived.` });
                    
                    const seasonToArchive = `${prevDate.year}-${prevDate.year + 1}`;
                    const standingsForYear: TeamSeasonHistory[] = tempTeams.map(t => ({
                        teamName: t.name,
                        leagueDivision: t.leagueDivision,
                        nationalsDivision: t.nationalsDivision,
                        wins: t.wins,
                        losses: t.losses,
                        draws: t.draws,
                        points: t.points,
                        goalsFor: t.goalsFor,
                        goalsAgainst: t.goalsAgainst,
                    }));
                    setSeasonHistory(prev => ({ ...prev, [seasonToArchive]: standingsForYear }));

                    tempSeasonRecords = {}; 
                    
                    const newAlumni: Player[] = [];
                    const newTransferPlayers: Player[] = [];

                    tempTeams = tempTeams.map(team => {
                        const graduatingPlayers: Player[] = [];
                        const remainingPlayers = team.roster.filter(player => {
                            const eligibilityMap: { [key in Player['eligibility']]: Player['eligibility'] | null } = {
                                "UG Year 1": "UG Year 2", "UG Year 2": "UG Year 3", "UG Year 3": "UG Year 4",
                                "UG Year 4": null, "Masters": null, "PhD": null, "Staff": "Staff"
                            };
                            const nextEligibility = eligibilityMap[player.eligibility];
                            
                            if (player.eligibility === 'Masters' || player.eligibility === 'PhD') {
                                player.yearsLeftInProgram = (player.yearsLeftInProgram || 1) - 1;
                                if (player.yearsLeftInProgram <= 0) {
                                    graduatingPlayers.push(player);
                                    return false;
                                }
                            }

                            if (nextEligibility) {
                                player.eligibility = nextEligibility;
                                player.age += 1;
                                return true;
                            } else if (player.eligibility !== 'Staff') {
                                graduatingPlayers.push(player);
                                return false;
                            }
                            player.age += 1;
                            return true; 
                        });

                        graduatingPlayers.forEach(player => {
                            if (player.currentStats.length > 0) {
                                player.history.push(...player.currentStats);
                                player.currentStats = [];
                            }

                            const isManaged = managedTeamNames.includes(team.name);
                            const ambition = player.attributes.ambition || 10;
                            const loyalty = player.attributes.loyalty || 10;
                            const roll = Math.random();
                            const continueChance = 0.15 + (loyalty - 10) / 100;
                            const transferChance = 0.40 + (ambition - 10) / 100;

                            if (roll < continueChance) {
                                player.eligibility = player.eligibility === 'UG Year 4' ? 'Masters' : 'PhD';
                                player.yearsLeftInProgram = player.eligibility === 'Masters' ? 2 : 4;
                                player.isContinuingEducation = true;
                                remainingPlayers.push(player);
                                if (isManaged) {
                                    toast.info(`${player.name} has graduated and enrolled in a ${player.eligibility} program to stay with the team!`);
                                }
                            } else if (roll < continueChance + transferChance) {
                                const starRating = player.starRating;
                                let quality: Player['estimatedQuality'];
                                if (starRating >= 4.5) quality = 'Elite';
                                else if (starRating >= 3.5) quality = 'Experienced';
                                else if (starRating >= 2.5) quality = 'Intermediate';
                                else if (starRating >= 1.5) quality = 'Moderate';
                                else quality = 'Beginner';
                            
                                let cost: number;
                                if (quality === 'Beginner') cost = getRandomValueInRange(75, 150);
                                else if (quality === 'Moderate') cost = getRandomValueInRange(150, 300);
                                else if (quality === 'Intermediate') cost = getRandomValueInRange(300, 500);
                                else if (quality === 'Experienced') cost = getRandomValueInRange(500, 750);
                                else cost = getRandomValueInRange(750, 1500);
    
                                const transferProspect: Player = {
                                    ...player,
                                    source: 'Transfer',
                                    jerseyNumber: 0,
                                    morale: 'Content',
                                    eligibility: 'Masters',
                                    yearsLeftInProgram: 2,
                                    estimatedQuality: quality,
                                    recruitmentCost: cost,
                                    captaincy: null,
                                    currentStats: [],
                                    isContinuingEducation: false,
                                };
                                newTransferPlayers.push(transferProspect);
                            
                                player.alumniStatus = 'Active Elsewhere';
                                newAlumni.push(player);
                                if (isManaged) {
                                    toast.info(`${player.name} has graduated and is seeking opportunities at other universities.`);
                                }
                            } else {
                                player.alumniStatus = 'Retired';
                                newAlumni.push(player);
                                if (isManaged) {
                                    toast.info(`${player.name} has retired from university hockey.`);
                                }
                            }
                        });

                        team.roster = remainingPlayers;
                        return team;
                    });

                    if (newTransferPlayers.length > 0) {
                        for (let i = newTransferPlayers.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [newTransferPlayers[i], newTransferPlayers[j]] = [newTransferPlayers[j], newTransferPlayers[i]];
                        }

                        const userPercentage = 0.05 + Math.random() * 0.02;
                        const userPlayerCount = Math.round(newTransferPlayers.length * userPercentage);

                        const userTransfers = newTransferPlayers.slice(0, userPlayerCount);
                        userTransfers.forEach(p => p.recruitmentCost = 0);

                        const aiTransfers = newTransferPlayers.slice(userPlayerCount);
                        const aiTeams = tempTeams.filter(t => !managedTeamNames.includes(t.name));

                        if (aiTransfers.length > 0 && aiTeams.length > 0) {
                            aiTransfers.forEach((player, index) => {
                                const targetTeamIndex = index % aiTeams.length;
                                const targetTeamName = aiTeams[targetTeamIndex].name;
                                const teamToUpdateIndex = tempTeams.findIndex(t => t.name === targetTeamName);
                                if (teamToUpdateIndex !== -1) {
                                    const teamToUpdate = tempTeams[teamToUpdateIndex];
                                    const usedJerseyNumbers = new Set(teamToUpdate.roster.map(p => p.jerseyNumber));
                                    
                                    let newJerseyNumber = 1;
                                    while (usedJerseyNumbers.has(newJerseyNumber)) { newJerseyNumber++; }
                                    player.jerseyNumber = newJerseyNumber;
                                    usedJerseyNumbers.add(newJerseyNumber);
                                    const isSkater = player.positions[0] !== 'G';
                                    player.starRating = calculateStarRating(player.currentAbility, isSkater, teamToUpdate.leagueDivision);
                                }
                            });
                            toast.info("AI teams have recruited new players for the upcoming season.");
                        }
                        
                        if (userTransfers.length > 0) {
                            setRecruitedPool(prev => [...prev, ...userTransfers]);
                            toast.info("Exclusive Transfer Offers", { description: `Your program's prestige has attracted ${userTransfers.length} transfer players. Find them in your Recruits tab.` });
                        }
                    }

                    if (newAlumni.length > 0) {
                        setAlumni(prev => [...prev, ...newAlumni]);
                    }
                    setTransferPool([]);
                    setScoutingPool([]);
                    setRecruitedPool([]);
                    setFairHosted(false);

                    tempTeams = tempTeams.map(team => {
                        const updatedRoster = team.roster.map(player => {
                            if (player.currentStats.length > 0) {
                                const newHistory = player.history ? [...player.history, ...player.currentStats] : [...player.currentStats];
                                return { ...player, history: newHistory, currentStats: [] };
                            }
                            return player;
                        });
                        return { ...team, roster: updatedRoster, wins: 0, losses: 0, draws: 0, points: 0, goalsFor: 0, goalsAgainst: 0 };
                    });
                }
                month = months[nextMonthIndex];
            }
            return { month, week, year };
        })(currentDate);

        if (newDevelopmentLogs.length > 0) setDevelopmentHistory(prev => [...newDevelopmentLogs, ...prev].slice(0, 200));
        if (newDate.month === 'August' && newDate.week === 2 && !(currentDate.month === 'August' && currentDate.week === 2)) {
            tempSchedule = generateSeasonSchedule(tempTeams, newDate);
            toast.success(`New season schedule generated for ${newDate.year}-${newDate.year + 1}!`);
        }

        if (newDate.month === 'May' && newDate.week === 1 && !(currentDate.month === 'May' && currentDate.week === 1)) {
            toast.info("Nationals Draws Being Made", { description: "Groups for the BUIHA National Championships are being generated." });
            const allNationalsDivisions = [...new Set(tempTeams.map(t => t.nationalsDivision))];
            const newNationalsDataForYear: { [division: string]: NationalsTournament } = {};
            allNationalsDivisions.forEach(division => {
                const teamsInDivision = tempTeams.filter(t => t.nationalsDivision === division);
                if (teamsInDivision.length >= 2) {
                    const tournament = createNationalsTournament(division, teamsInDivision, newDate.year, newDate.week);
                    newNationalsDataForYear[division] = tournament;
                }
            });
            tempNationalsData[newDate.year] = newNationalsDataForYear;
        }
        
        setNationalsData(tempNationalsData);
        setTeams(tempTeams);
        setSchedule(tempSchedule);
        setCurrentDate(newDate);
        setSeasonRecords(tempSeasonRecords);
        setCareerRecords(tempCareerRecords);
    };

    const movePlayer = (playerId: string, fromTeamName: string, toTeamName: string) => {
        setTeams(currentTeams => {
            const fromTeam = currentTeams.find(t => t.name === fromTeamName);
            const toTeam = currentTeams.find(t => t.name === toTeamName);
            const player = fromTeam?.roster.find(p => p.id === playerId);

            if (!fromTeam || !toTeam || !player) {
                toast.error("Could not move player. Team or player not found.");
                return currentTeams;
            }

            const newFromRoster = fromTeam.roster.filter(p => p.id !== playerId);

            const toTeamJerseyNumbers = new Set(toTeam.roster.map(p => p.jerseyNumber));
            if (toTeamJerseyNumbers.has(player.jerseyNumber)) {
                let newJerseyNumber = 1;
                while (toTeamJerseyNumbers.has(newJerseyNumber)) { newJerseyNumber++; }
                toast.warning(`${player.name}'s jersey #${player.jerseyNumber} was taken.`, {
                    description: `They have been assigned #${newJerseyNumber}.`
                });
                player.jerseyNumber = newJerseyNumber;
            }
            
            const isSkater = player.positions[0] !== 'G';
            const updatedPlayer = {
                ...player,
                starRating: calculateStarRating(player.currentAbility, isSkater, toTeam.leagueDivision)
            };

            const newToRoster = [...toTeam.roster, updatedPlayer].sort((a, b) => a.jerseyNumber - b.jerseyNumber);

            const updatedFromTeam = { ...fromTeam, roster: newFromRoster };
            const updatedToTeam = { ...toTeam, roster: newToRoster };

            return currentTeams.map(t => {
                if (t.name === fromTeamName) return updatedFromTeam;
                if (t.name === toTeamName) return updatedToTeam;
                return t;
            });
        });
    };

    const requestPlayerTransfer = (playerId: string, fromTeamName: string, toTeamName: string) => {
        const fromTeam = teams.find(t => t.name === fromTeamName);
        const toTeam = teams.find(t => t.name === toTeamName);
        const player = fromTeam?.roster.find(p => p.id === playerId);

        if (!fromTeam || !toTeam || !player) {
            toast.error("Could not request player. Team or player not found.");
            return;
        }

        const isInternalTransfer = managedOrganization &&
            managedTeams.some(t => t.name === fromTeamName) &&
            managedTeams.some(t => t.name === toTeamName);

        if (isInternalTransfer) {
            movePlayer(playerId, fromTeamName, toTeamName);
            toast.success(`${player.name} moved to ${toTeamName}.`);
            return;
        }

        const baseSuccessChance = 0.3;
        const loyaltyModifier = (player.attributes.loyalty - 10) / 25; 
        const ambitionModifier = (player.attributes.ambition - 10) / 25; 
        
        const successChance = baseSuccessChance - loyaltyModifier + ambitionModifier;

        if (Math.random() < successChance) {
            toast.success("Transfer Approved!", {
                description: `${player.name} has agreed to the move and their coach has approved the transfer.`
            });
            movePlayer(playerId, fromTeamName, toTeamName);
        } else {
            const reasonRoll = Math.random();
            let reasonText: string;
            if (reasonRoll < 0.4) reasonText = `The manager of ${fromTeamName} has blocked the transfer, wanting to keep the player.`;
            else if (reasonRoll < 0.8) reasonText = `${player.name} has declined the offer to move to ${toTeamName}, citing loyalty to their current team.`;
            else reasonText = `${player.name} is happy where they are and does not wish to move at this time.`;
            toast.error("Transfer Denied", { description: reasonText });
        }
    };

    const markGameAsCompleted = (gameId: string, homeScore: number, awayScore: number) => {
        setSchedule(prevSchedule =>
            prevSchedule.map(game =>
                game.id === gameId
                    ? { ...game, status: 'completed', result: { homeScore, awayScore } }
                    : game
            )
        );
    };

    const processGameResults = (userTeam: Team, opponentTeam: Team, gameState: GameState, isNationalsGame: boolean = false, nationalsDivision?: string, gameId?: string) => {
        const { updatedUserTeam: updatedUserTeamResult, updatedOpponentTeam: updatedOpponentTeamResult } = processGameResultsEngine(userTeam, opponentTeam, gameState, isNationalsGame);
        
        setTeams(currentTeams =>
            currentTeams.map(t => {
                if (t.name === updatedUserTeamResult.name) return updatedUserTeamResult;
                if (t.name === updatedOpponentTeamResult.name) return updatedOpponentTeamResult;
                return t;
            })
        );

        if (isNationalsGame && nationalsDivision && gameId) {
            const completedGame = {
                gameId: gameId, 
                homeScore: gameState.userScore,
                awayScore: gameState.opponentScore,
                homeTeamName: userTeam.name,
                awayTeamName: opponentTeam.name,
            };
            playNationalsRound(nationalsDivision, completedGame);
        } else if (gameId) { 
            markGameAsCompleted(gameId, gameState.userScore, gameState.opponentScore);
        }
    };

    const _runNationalsRoundSimulation = (
        tournamentToUpdate: NationalsTournament,
        teamsToUpdate: Team[],
        userGameResult?: { homeTeamName: string, awayTeamName: string, homeScore: number, awayScore: number, gameId: string }
    ) => {
        let tournament = tournamentToUpdate;
        let tempTeams = teamsToUpdate;

        if (tournament.status === 'group-stage') {
            const gamesToSim = tournament.groupStageSchedule.filter((g: ScheduleEntry) => g.round === tournament.currentRound && g.status === 'scheduled');
            
            if (userGameResult) {
                const userGame = gamesToSim.find(g => g.id === userGameResult.gameId);
                if (userGame) {
                    userGame.status = 'completed';
                    userGame.result = { homeScore: userGameResult.homeScore, awayScore: userGameResult.awayScore };
                }
            }

            gamesToSim.forEach((game: ScheduleEntry) => {
                if (game.status === 'completed') return;
                const homeTeam = tempTeams.find((t: Team) => t.name === game.homeTeam);
                const awayTeam = tempTeams.find((t: Team) => t.name === game.awayTeam);
                if (homeTeam && awayTeam) {
                    const finalGameState = simulateFullGame(homeTeam, awayTeam, true);
                    const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, true);
                    tempTeams = tempTeams.map((t: Team) => {
                        if (t.name === homeTeam.name) return updatedHomeTeam;
                        if (t.name === awayTeam.name) return updatedAwayTeam;
                        return t;
                    });
                    game.status = 'completed';
                    game.result = { homeScore: finalGameState.userScore, awayScore: finalGameState.opponentScore };
                }
            });
    
            tournament.groups.forEach((group: any) => {
                group.standings.forEach((standing: any) => {
                    const teamGames = tournament.groupStageSchedule.filter((g: ScheduleEntry) => (g.homeTeam === standing.teamName || g.awayTeam === standing.teamName) && g.round === tournament.currentRound && g.result);
                    teamGames.forEach((game: ScheduleEntry) => {
                        standing.played++;
                        const isHome = game.homeTeam === standing.teamName;
                        const homeScore = game.result!.homeScore;
                        const awayScore = game.result!.awayScore;
                        standing.goalsFor += isHome ? homeScore : awayScore;
                        standing.goalsAgainst += isHome ? awayScore : homeScore;
                        if (homeScore === awayScore) { standing.draws++; standing.points++; }
                        else if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) { standing.wins++; standing.points += 3; }
                        else { standing.losses++; }
                    });
                });
            });
    
            const allGamesInCurrentRoundCompleted = tournament.groupStageSchedule
                .filter(g => g.round === tournament.currentRound)
                .every(g => g.status === 'completed');

            if (allGamesInCurrentRoundCompleted) {
                tournament.currentRound = (tournament.currentRound as number) + 1;
                toast.info(`Round ${tournament.currentRound - 1} of group stage completed for ${tournament.division}. Advancing to Round ${tournament.currentRound}.`);
            }
            
            const allGroupGamesCompletedOverall = tournament.groupStageSchedule.every((g: ScheduleEntry) => g.status === 'completed');
            if (allGroupGamesCompletedOverall) {
                toast.success(`Group stage for ${tournament.division} has concluded!`, { description: "Playoff matchups will now be generated." });
                tournament.playoffSchedule = generatePlayoffBracket(tournament.groups, tournament.groupStageSchedule[0].date);
                
                const silverPlayoffExists = tournament.playoffSchedule.some((m: NationalsPlayoffMatch) => m.bracket === 'Silver');

                if (silverPlayoffExists) {
                    tournament.status = 'silver-playoffs';
                    const firstSilverRound = tournament.playoffSchedule.find((m: NationalsPlayoffMatch) => m.bracket === 'Silver')?.round || 'Final';
                    tournament.currentRound = firstSilverRound;
                    toast.info(`The ${tournament.division} Silver Playoffs will now begin.`);
                } else {
                    tournament.status = 'gold-playoffs';
                    const firstGoldRound = tournament.playoffSchedule.find((m: NationalsPlayoffMatch) => m.bracket === 'Gold')?.round || 'Final';
                    tournament.currentRound = firstGoldRound;
                    toast.info(`The ${tournament.division} Gold Playoffs will now begin.`);
                }

                if (tournament.playoffSchedule.length === 0) {
                    tournament.status = 'completed';
                    toast.info(`${tournament.division} tournament has concluded as no playoffs could be generated.`);
                }
            }
        } else if (tournament.status === 'silver-playoffs' || tournament.status === 'gold-playoffs') {
            const currentBracket = tournament.status === 'silver-playoffs' ? 'Silver' : 'Gold';

            const getWinner = (match: NationalsPlayoffMatch): string | undefined => {
                if (!match.result) return undefined;
                if (match.result.homeScore > match.result.awayScore) return typeof match.homeTeam === 'string' ? match.homeTeam : undefined;
                if (match.result.awayScore > match.result.homeScore) return typeof match.awayTeam === 'string' ? match.awayTeam : undefined;
                return Math.random() > 0.5 ? (typeof match.homeTeam === 'string' ? match.homeTeam : undefined) : (typeof match.awayTeam === 'string' ? match.awayTeam : undefined);
            };

            const allPlayoffGames = tournament.playoffSchedule as NationalsPlayoffMatch[];
            
            allPlayoffGames.forEach((game: NationalsPlayoffMatch) => {
                if (game.bracket === currentBracket && game.round === tournament.currentRound && game.status === 'scheduled') {
                    if (typeof game.homeTeam !== 'string') {
                        const feederMatch = allPlayoffGames.find(m => m.id === (game.homeTeam as { winnerOf: string }).winnerOf);
                        if (feederMatch && feederMatch.status === 'completed') {
                            game.homeTeam = getWinner(feederMatch) || 'TBD';
                        }
                    }
                    if (typeof game.awayTeam !== 'string') {
                        const feederMatch = allPlayoffGames.find(m => m.id === (game.awayTeam as { winnerOf: string }).winnerOf);
                        if (feederMatch && feederMatch.status === 'completed') {
                            game.awayTeam = getWinner(feederMatch) || 'TBD';
                        }
                    }
                }
            });

            const gamesToSim = allPlayoffGames.filter((g: NationalsPlayoffMatch) => g.bracket === currentBracket && g.round === tournament.currentRound && g.status === 'scheduled');

            if (userGameResult) {
                const userGame = gamesToSim.find(g => g.id === userGameResult.gameId);
                if (userGame) {
                    userGame.status = 'completed';
                    userGame.result = { homeScore: userGameResult.homeScore, awayScore: userGameResult.awayScore };
                    userGame.winner = getWinner(userGame);
                }
            }

            gamesToSim.forEach((game: NationalsPlayoffMatch) => {
                if (game.status === 'completed') return;
                if (typeof game.homeTeam !== 'string' || typeof game.awayTeam !== 'string' || game.homeTeam === 'TBD' || game.awayTeam === 'TBD') {
                    return; 
                };

                const homeTeam = tempTeams.find((t: Team) => t.name === game.homeTeam);
                const awayTeam = tempTeams.find((t: Team) => t.name === game.awayTeam);

                if (homeTeam && awayTeam) {
                    const finalGameState = simulateFullGame(homeTeam, awayTeam, true);
                    const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, true);
                    tempTeams = tempTeams.map((t: Team) => {
                        if (t.name === homeTeam.name) return updatedHomeTeam;
                        if (t.name === awayTeam.name) return updatedAwayTeam;
                        return t;
                    });
                    game.status = 'completed';
                    game.result = { homeScore: finalGameState.userScore, awayScore: finalGameState.opponentScore };
                    game.winner = getWinner(game);
                }
            });

            const currentRoundGames = allPlayoffGames.filter((g: NationalsPlayoffMatch) => g.bracket === currentBracket && g.round === tournament.currentRound);
            const allGamesInRoundPlayed = currentRoundGames.every((g: NationalsPlayoffMatch) => g.status === 'completed');

            if (allGamesInRoundPlayed && currentRoundGames.length > 0) {
                const nextRoundMap: { [key: string]: 'Preliminary' | 'Quarter-Final' | 'Semi-Final' | 'Final' } = { 'Preliminary': 'Quarter-Final', 'Quarter-Final' : 'Semi-Final', 'Semi-Final': 'Final' };
                
                if (tournament.currentRound === 'Final') {
                    if (currentBracket === 'Silver') {
                        const silverFinal = currentRoundGames.find(g => g.round === 'Final' && g.bracket === 'Silver');
                        toast.success(`${silverFinal?.winner || 'The winner'} has won the ${tournament.division} Silver Championship!`);
                        
                        tournament.status = 'gold-playoffs';
                        const firstGoldRound = allPlayoffGames.find(m => m.bracket === 'Gold')?.round || 'Final';
                        tournament.currentRound = firstGoldRound;
                        toast.info(`The ${tournament.division} Gold Playoffs will now begin.`);
                    } else { 
                        tournament.status = 'completed';
                        const finalMatch = currentRoundGames.find(g => g.round === 'Final' && g.bracket === 'Gold');
                        tournament.winner = finalMatch?.winner;
                        if (tournament.winner) {
                            toast.success(`${tournament.winner} has won the ${tournament.division} National Championship!`);
                        } else {
                            toast.info(`The ${tournament.division} National Championship has concluded.`);
                        }
                    }
                } else {
                    const nextRound = nextRoundMap[tournament.currentRound as 'Preliminary' | 'Quarter-Final' | 'Semi-Final'];
                    if (nextRound) {
                        tournament.currentRound = nextRound;
                        toast.info(`Advancing to the ${nextRound.replace('-', ' ')} of the ${tournament.division} ${currentBracket} playoffs.`);
                        
                        allPlayoffGames.forEach((game: NationalsPlayoffMatch) => {
                            if (game.bracket === currentBracket && game.round === tournament.currentRound && game.status === 'scheduled') {
                                if (typeof game.homeTeam !== 'string') {
                                    const feederMatch = allPlayoffGames.find(m => m.id === (game.homeTeam as { winnerOf: string }).winnerOf);
                                    if (feederMatch && feederMatch.status === 'completed') {
                                        game.homeTeam = getWinner(feederMatch) || 'TBD';
                                    }
                                }
                                if (typeof game.awayTeam !== 'string') {
                                    const feederMatch = allPlayoffGames.find(m => m.id === (game.awayTeam as { winnerOf: string }).winnerOf);
                                    if (feederMatch && feederMatch.status === 'completed') {
                                        game.awayTeam = getWinner(feederMatch) || 'TBD';
                                    }
                                }
                            }
                        });
                    }
                }
            }
        }
        return { updatedTournament: tournament, updatedTeams: tempTeams };
    }

    const playNationalsRound = (division: string, userGameResult?: { homeTeamName: string, awayTeamName: string, homeScore: number, awayScore: number, gameId: string }) => {
        const tempNationalsData = JSON.parse(JSON.stringify(nationalsData));
        const tournament = tempNationalsData[currentDate.year]?.[division];
        if (!tournament || tournament.status === 'completed') return;

        let tempTeams = JSON.parse(JSON.stringify(teams));
        
        const { updatedTournament, updatedTeams } = _runNationalsRoundSimulation(tournament, tempTeams, userGameResult);

        tempNationalsData[currentDate.year][division] = updatedTournament;
        setTeams(updatedTeams);
        setNationalsData(tempNationalsData);
    };

    const simulateFullNationalsTournament = (division: string) => {
        let tempNationalsData = JSON.parse(JSON.stringify(nationalsData));
        let tempTeams = JSON.parse(JSON.stringify(teams));
        let tournament = tempNationalsData[currentDate.year]?.[division];

        if (!tournament || tournament.status === 'completed') {
            toast.info("Tournament already completed or does not exist.");
            return;
        }

        const toastId = toast.loading(`Simulating full ${division} tournament...`);
        let safeguard = 0;
        while (tournament.status !== 'completed' && safeguard < 50) {
            const { updatedTournament, updatedTeams } = _runNationalsRoundSimulation(tournament, tempTeams);
            tournament = updatedTournament;
            tempTeams = updatedTeams;
            safeguard++;
        }

        if (safeguard >= 50) {
            toast.error("Simulation failed", { id: toastId, description: "The simulation took too long and was stopped." });
        } else {
            toast.success(`Successfully simulated ${division} tournament!`, { id: toastId });
        }

        tempNationalsData[currentDate.year][division] = tournament;
        setTeams(tempTeams);
        setNationalsData(tempNationalsData);
    };

    const simulateAllNationalsTournaments = () => {
        let tempNationalsData = JSON.parse(JSON.stringify(nationalsData));
        let tempTeams = JSON.parse(JSON.stringify(teams));
        const allDivisions = Object.keys(tempNationalsData[currentDate.year] || {});

        if (allDivisions.length === 0) {
            toast.info("No Nationals tournaments found for this year.");
            return;
        }

        const toastId = toast.loading("Simulating all Nationals tournaments...");

        allDivisions.forEach(division => {
            let tournament = tempNationalsData[currentDate.year]?.[division];
            if (!tournament || tournament.status === 'completed') {
                return; 
            }

            let safeguard = 0;
            while (tournament.status !== 'completed' && safeguard < 50) {
                const { updatedTournament, updatedTeams } = _runNationalsRoundSimulation(tournament, tempTeams);
                tournament = updatedTournament;
                tempTeams = updatedTeams;
                safeguard++;
            }
            tempNationalsData[currentDate.year][division] = tournament;
        });

        toast.success("All Nationals tournaments have been simulated!", { id: toastId });
        setTeams(tempTeams);
        setNationalsData(tempNationalsData);
    };

    const generateScoutingPool = () => {
        if (!userTeam) {
            toast.error("No active team selected.");
            return;
        }
        const newRecruits = generateRecruits(userTeam.leagueDivision, teams.map(t => t.name));
        
        setScoutingPool(newRecruits);
        setFairHosted(true);
        toast.success("New prospects found!", { description: "You've found new prospects from your student fair."});
    };

    const recruitPlayer = (playerId: string) => {
        if (!userTeam) {
            toast.error("No active team selected.");
            return;
        }
        const playerToRecruit = scoutingPool.find(p => p.id === playerId);
        if (!playerToRecruit) {
            toast.error("Player not found in scouting pool.");
            return;
        }

        const recruitingBudget = userTeam.financials.budgetAllocations.Recruiting;
        if (recruitingBudget < (playerToRecruit.recruitmentCost || 0)) {
            toast.error("Insufficient Recruiting Budget", {
                description: `You need £${(playerToRecruit.recruitmentCost || 0).toLocaleString()} to recruit ${playerToRecruit.name}. You only have £${recruitingBudget.toLocaleString()}.`,
            });
            return;
        }

        setScoutingPool(prev => prev.filter(p => p.id !== playerId));
        setRecruitedPool(prev => [...prev, playerToRecruit]);
        toast.success("Player Recruited!", { description: `${playerToRecruit.name} has been recruited to your team.` });
    };

    const assignPlayerToRoster = (playerId: string) => {
        if (!userTeam) {
            toast.error("No active team selected.");
            return;
        }
        const playerToAssign = recruitedPool.find(p => p.id === playerId);
        if (!playerToAssign) {
            toast.error("Player not found in recruited pool.");
            return;
        }

        const updatedPlayer = { ...playerToAssign };
        const usedJerseyNumbers = new Set(userTeam.roster.map(p => p.jerseyNumber));
        let newJerseyNumber = 1;
        while (usedJerseyNumbers.has(newJerseyNumber)) {
            newJerseyNumber++;
        }
        updatedPlayer.jerseyNumber = newJerseyNumber;

        const isSkater = updatedPlayer.positions[0] !== 'G';
        updatedPlayer.starRating = calculateStarRating(updatedPlayer.currentAbility, isSkater, userTeam.leagueDivision);

        setTeams(prevTeams => prevTeams.map(team =>
            team.name === userTeam.name
                ? { ...team, roster: [...team.roster, updatedPlayer] }
                : team
        ));
        setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
        toast.success(`${updatedPlayer.name} assigned to roster!`);
    };

    const discardRecruit = (playerId: string) => {
        setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
    };

    const updateBudgetAllocations = (newAllocations: BudgetAllocations) => {
        if (!userTeam) return;
        setTeams(prevTeams => prevTeams.map(team =>
            team.name === userTeam.name
                ? { ...team, financials: { ...team.financials, budgetAllocations: newAllocations } }
                : team
        ));
    };

    const runStudentLifeInitiative = () => {
        if (!userTeam) return;
        const initiativeCost = 500;
        if (userTeam.financials.budgetAllocations["Student Life"] < initiativeCost) {
            toast.error("Insufficient Budget", { description: "You don't have enough budget allocated to Student Life for this initiative." });
            return;
        }

        setTeams(prevTeams => prevTeams.map(team => {
            if (team.name === userTeam.name) {
                const updatedAllocations = {
                    ...team.financials.budgetAllocations,
                    "Student Life": team.financials.budgetAllocations["Student Life"] - initiativeCost
                };
                const updatedRoster = team.roster.map(player => ({
                    ...player,
                    morale: updateMorale(player.morale, 1)
                }));
                toast.success("Student Life Initiative Complete!", { description: "Team morale has been boosted!" });
                return { ...team, financials: { ...team.financials, budgetAllocations: updatedAllocations }, roster: updatedRoster };
            }
            return team;
        }));
    };

    const startFacilityProject = (projectId: string) => {
        if (!userTeam) return;

        const project = initialFacilityProjects.find(p => p.id === projectId) as FacilityProject; // Type assertion here
        if (!project) {
            toast.error("Project not found.");
            return;
        }

        const facilitiesBudget = managedOrganization 
            ? (organizationFinancials?.budgetAllocations.Facilities || 0) 
            : (userTeam.financials.budgetAllocations.Facilities || 0);

        if (facilitiesBudget < project.cost) {
            toast.error("Insufficient Funds", { description: `You need £${project.cost.toLocaleString()} to start this project.` });
            return;
        }

        setTeams(prevTeams => prevTeams.map(team => {
            if (managedOrganization) {
                // If managing an organization, apply to all teams in the organization
                if (managedTeams.some(mt => mt.name === team.name)) {
                    const updatedFacilities = team.facilities.map(f => {
                        if (f.id === projectId) {
                            const newFacility: FacilityProject = { // Explicitly type the new object
                                ...f,
                                status: 'In Progress',
                                weeksToComplete: project.weeksToComplete
                            };
                            return newFacility;
                        }
                        return f;
                    });
                    const updatedAllocations = {
                        ...team.financials.budgetAllocations,
                        Facilities: team.financials.budgetAllocations.Facilities - project.cost / managedTeams.length // Distribute cost
                    };
                    toast.success(`${project.name} started for ${team.name}!`);
                    return { ...team, facilities: updatedFacilities, financials: { ...team.financials, budgetAllocations: updatedAllocations } };
                }
            } else if (team.name === userTeam.name) {
                // If managing a single team
                const updatedFacilities = team.facilities.map(f => {
                    if (f.id === projectId) {
                        const newFacility: FacilityProject = { // Explicitly type the new object
                            ...f,
                            status: 'In Progress',
                            weeksToComplete: project.weeksToComplete
                        };
                        return newFacility;
                    }
                    return f;
                });
                const updatedAllocations = {
                    ...team.financials.budgetAllocations,
                    Facilities: team.financials.budgetAllocations.Facilities - project.cost
                };
                toast.success(`${project.name} started!`);
                return { ...team, facilities: updatedFacilities, financials: { ...team.financials, budgetAllocations: updatedAllocations } };
            }
            return team;
        }));
    };

    const updatePlayerTrainingFocus = (playerId: string, focus: TrainingFocus) => {
        if (!userTeam) return;
        setTeams(prevTeams => prevTeams.map(team =>
            team.name === userTeam.name
                ? {
                    ...team,
                    roster: team.roster.map(player =>
                        player.id === playerId ? { ...player, trainingFocus: focus } : player
                    )
                }
                : team
        ));
        toast.success("Training focus updated!");
    };

    const autoAssignTrainingFocuses = () => {
        if (!userTeam) return;
        setTeams(prevTeams => prevTeams.map(team => {
            if (team.name === userTeam.name) {
                const updatedRoster = team.roster.map(player => {
                    if (player.positions.includes('G')) {
                        return { ...player, trainingFocus: getRandomItem(goalieFocuses) };
                    } else {
                        return { ...player, trainingFocus: getRandomItem(skaterFocuses) };
                    }
                });
                toast.success("Training focuses auto-assigned!");
                return { ...team, roster: updatedRoster };
            }
            return team;
        }));
    };

    const autoSimulateUserNationalsGame = (division: string, gameId: string) => {
        if (!userTeam) return;
        const tournament = nationalsData[currentDate.year]?.[division];
        if (!tournament) return;

        const game = [...tournament.groupStageSchedule, ...tournament.playoffSchedule].find(g => g.id === gameId);
        if (!game) return;

        const homeTeam = teams.find(t => t.name === (typeof game.homeTeam === 'string' ? game.homeTeam : '')) || userTeam;
        const awayTeam = teams.find(t => t.name === (typeof game.awayTeam === 'string' ? game.awayTeam : '')) || userTeam;

        const finalGameState = simulateFullGame(homeTeam, awayTeam, true);

        processGameResults(homeTeam, awayTeam, finalGameState, true, division, gameId);
        toast.info("Nationals Game Auto-Simulated", { description: `${homeTeam.name} ${finalGameState.userScore} - ${awayTeam.name} ${finalGameState.opponentScore}` });
    };

    const simulateSingleNationalsGame = (division: string, gameId: string) => {
        const tempNationalsData = JSON.parse(JSON.stringify(nationalsData));
        const tournament = tempNationalsData[currentDate.year]?.[division];
        if (!tournament) return;

        const game = [...tournament.groupStageSchedule, ...tournament.playoffSchedule].find(g => g.id === gameId);
        if (!game || game.status === 'completed') return;

        let tempTeams = JSON.parse(JSON.stringify(teams));

        const homeTeam = tempTeams.find(t => t.name === (typeof game.homeTeam === 'string' ? game.homeTeam : ''));
        const awayTeam = tempTeams.find(t => t.name === (typeof game.awayTeam === 'string' ? game.awayTeam : ''));

        if (!homeTeam || !awayTeam) {
            toast.error("Cannot simulate game", { description: "One or both teams not found." });
            return;
        }

        const finalGameState = simulateFullGame(homeTeam, awayTeam, true);
        const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, true);
        
        tempTeams = tempTeams.map((t: Team) => {
            if (t.name === homeTeam.name) return updatedHomeTeam;
            if (t.name === awayTeam.name) return updatedAwayTeam;
            return t;
        });

        game.status = 'completed';
        game.result = { homeScore: finalGameState.userScore, awayScore: finalGameState.opponentScore };
        if ((game as NationalsPlayoffMatch).bracket) {
            (game as NationalsPlayoffMatch).winner = finalGameState.userScore > finalGameState.opponentScore ? homeTeam.name : awayTeam.name;
        }

        tempNationalsData[currentDate.year][division] = tournament;
        setTeams(tempTeams);
        setNationalsData(tempNationalsData);
        toast.success("Nationals Game Simulated", { description: `${homeTeam.name} ${finalGameState.userScore} - ${awayTeam.name} ${finalGameState.opponentScore}` });
    };

    return (
        <TeamContext.Provider value={{
            teams,
            updateTeam,
            userTeam,
            organizationFinancials,
            organizationFacilities,
            selectTeam,
            scoutingPool,
            recruitedPool,
            fairHosted,
            generateScoutingPool,
            recruitPlayer,
            assignPlayerToRoster,
            discardRecruit,
            updateBudgetAllocations,
            runStudentLifeInitiative,
            startFacilityProject,
            currentDate,
            advanceWeek,
            developmentHistory,
            updatePlayerTrainingFocus,
            autoAssignTrainingFocuses,
            processGameResults,
            movePlayer,
            requestPlayerTransfer,
            managedOrganization,
            isManagingOrg,
            managedTeams,
            selectOrganization,
            setActiveTeam,
            schedule,
            gameForCurrentWeek,
            nationalsData,
            markGameAsCompleted,
            seasonRecords,
            careerRecords,
            alumni,
            playNationalsRound,
            autoSimulateUserNationalsGame,
            seasonHistory,
            simulateFullNationalsTournament,
            simulateSingleNationalsGame,
            simulateAllNationalsTournaments,
        }}>
            {children}
        </TeamContext.Provider>
    );
};