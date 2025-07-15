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
    
        const assigned = new Set<<dyad-problem-report summary="4 problems">
<problem file="src/context/TeamContext.tsx" line="1630" column="22" code="2345">Argument of type '(currentTeams: Team[]) =&gt; { financials: { budgetAllocations: { Facilities: number; Travel: number; Equipment: number; &quot;Ice Time&quot;: number; Recruiting: number; &quot;Student Life&quot;: number; }; totalBudget: number; iceTimeCostPerGame: number; equipmentCost: number; }; ... 14 more ...; tactics: TacticsSelection; }[]' is not assignable to parameter of type 'SetStateAction&lt;Team[]&gt;'.
  Type '(currentTeams: Team[]) =&gt; { financials: { budgetAllocations: { Facilities: number; Travel: number; Equipment: number; &quot;Ice Time&quot;: number; Recruiting: number; &quot;Student Life&quot;: number; }; totalBudget: number; iceTimeCostPerGame: number; equipmentCost: number; }; ... 14 more ...; tactics: TacticsSelection; }[]' is not assignable to type '(prevState: Team[]) =&gt; Team[]'.
    Type '{ financials: { budgetAllocations: { Facilities: number; Travel: number; Equipment: number; &quot;Ice Time&quot;: number; Recruiting: number; &quot;Student Life&quot;: number; }; totalBudget: number; iceTimeCostPerGame: number; equipmentCost: number; }; ... 14 more ...; tactics: TacticsSelection; }[]' is not assignable to type 'Team[]'.
      Type '{ financials: { budgetAllocations: { Facilities: number; Travel: number; Equipment: number; &quot;Ice Time&quot;: number; Recruiting: number; &quot;Student Life&quot;: number; }; totalBudget: number; iceTimeCostPerGame: number; equipmentCost: number; }; ... 14 more ...; tactics: TacticsSelection; }' is not assignable to type 'Team'.
        Types of property 'facilities' are incompatible.
          Type '(FacilityProject | { status: string; weeksToComplete: number; id: string; name: string; description: string; cost: number; benefit: string; })[]' is not assignable to type 'FacilityProject[]'.
            Type 'FacilityProject | { status: string; weeksToComplete: number; id: string; name: string; description: string; cost: number; benefit: string; }' is not assignable to type 'FacilityProject'.
              Type '{ status: string; weeksToComplete: number; id: string; name: string; description: string; cost: number; benefit: string; }' is not assignable to type 'FacilityProject'.
                Types of property 'status' are incompatible.
                  Type 'string' is not assignable to type '&quot;Not Started&quot; | &quot;In Progress&quot; | &quot;Completed&quot;'.</problem>
<problem file="src/context/TeamContext.tsx" line="1638" column="114" code="2322">Type '(FacilityProject | { status: string; weeksToComplete: number; id: string; name: string; description: string; cost: number; benefit: string; })[]' is not assignable to type 'FacilityProject[]'.
  Type 'FacilityProject | { status: string; weeksToComplete: number; id: string; name: string; description: string; cost: number; benefit: string; }' is not assignable to type 'FacilityProject'.
    Type '{ status: string; weeksToComplete: number; id: string; name: string; description: string; cost: number; benefit: string; }' is not assignable to type 'FacilityProject'.
      Types of property 'status' are incompatible.
        Type 'string' is not assignable to type '&quot;Not Started&quot; | &quot;In Progress&quot; | &quot;Completed&quot;'.</problem>
<problem file="src/context/TeamContext.tsx" line="1665" column="17" code="18004">No value exists in scope for the shorthand property 'updatePlayerTrainingFocus'. Either declare one or provide an initializer.</problem>
<problem file="src/context/TeamContext.tsx" line="1666" column="17" code="18004">No value exists in scope for the shorthand property 'autoAssignTrainingFocuses'. Either declare one or provide an initializer.</problem>
</dyad-problem-report><think>Deciding which files are relevant...

**Investigating TypeScript Errors**

I'm currently digging into the initial pair of TypeScript errors flagged in `TeamContext.tsx`. It seems the compiler is unhappy about type mismatches during the `facilities` update. I am reviewing the type definitions for both the existing `facilities` and the intended update, making sure they align.


**Troubleshooting Type Inconsistencies**

I'm now focused on errors 1 and 2 related to the `facilities` update. It seems the compiler is flagging issues with type assignment, specifically with the `status` property. I suspect a potential type mismatch between the literal string being assigned ('In Progress') and the expected union type within the `FacilityProject` interface. My investigation centers on how `project` is being spread and how its status is being handled in `startFacilityProject`. I'm examining the type definitions and the surrounding logic, as well as tracing project state changes.


**Pinpointing Status Mismatches**

I'm concentrating on the type errors in `TeamContext.tsx`. The core issue is the status type mismatch. I've verified the `FacilityProject` type definition and confirmed its union type. Now I'm examining how the spread operator (`...project`) interacts with the explicit `'In Progress'` assignment. It's possible that type information is lost during the object spread and that the original `status` might not be the correct union. I will analyze the context of how `project` is sourced, to fix the root cause.


**Debugging Facility Updates**

I'm analyzing the type errors in `TeamContext.tsx` related to facility updates. Errors 1 and 2 stem from a `status` type mismatch during project updates. I'm carefully tracing the `startFacilityProject` function, including how the spread operator handles the `project` data and its `status`. The problem is likely in how type information is maintained when merging existing projects with the updated project.


{
  "complexity": "low",
  "relevantFiles": [
    "src/context/TeamContext.tsx"
  ]
}</think><dyad-codebase-context files="src/context/TeamContext.tsx">Complexity: low</dyad-codebase-context><think>**Analyzing Compile Errors**

I'm zeroing in on the user's TypeScript errors. Specifically, I'm currently focusing on the type mismatches within `src/context/TeamContext.tsx` inside the `startFacilityProject` function. I'm dissecting errors 1 and 2, which concern `FacilityProject` and its status, to grasp the root cause.


**Debugging Type Assignments**

I've fully analyzed the first two errors in `TeamContext.tsx`. It's clear the `status` property of `FacilityProject` isn't correctly typed when updated. Now I'm creating a plan to modify the `startFacilityProject` function so the `status` assignment adheres to the expected literal union type, `"Not Started" | "In Progress" | "Completed"`. Then, I will move on to errors 3 & 4.


**Tackling Missing Functions**

I've now formulated a plan to address errors 3 and 4, which involve missing functions in `TeamContext.Provider`. I intend to define both `updatePlayerTrainingFocus` and `autoAssignTrainingFocuses` within the scope. I will begin by scrutinizing `src/types/index.ts` to understand the `TrainingFocus` and `Player` structures to correctly implement `updatePlayerTrainingFocus`. Simultaneously, I will devise a strategy for implementing `autoAssignTrainingFocuses`, considering both default and calculated focus assignments.


**Developing Function Implementations**

I'm now focused on implementing `updatePlayerTrainingFocus` and `autoAssignTrainingFocuses`. I will examine `src/types/index.ts` for the `TrainingFocus` and `Player` definitions, and then I will design how to update a player's training focus. Afterwards, I'll determine a strategy for `autoAssignTrainingFocuses` by reviewing training focus data from `src/data/trainingFocuses.ts`. I'm also considering how to fix the `FacilityProject` status assignment; it seems the type safety is getting lost during the object spread.


**Implementing missing context functions**

I'm proceeding to define `updatePlayerTrainingFocus` and `autoAssignTrainingFocuses`. I've determined that `TrainingFocus` is likely a string type. I'll implement `updatePlayerTrainingFocus` to update a player's training focus within the team's roster, ensuring to handle potential null `userTeam` scenarios. Then, I will implement `autoAssignTrainingFocuses` by examining training data to perform calculations and assignments.


**Refactoring Context Implementations**

I'm currently focused on fixing the `FacilityProject` status errors by examining the `startFacilityProject` function and the type of `rebalancedTeam`. I plan to explicitly cast the `status` property in the `startFacilityProject` function to ensure type safety. Then, I'll integrate the newly implemented `updatePlayerTrainingFocus` and `autoAssignTrainingFocuses` functions into the `TeamContext.Provider`.


**Fixing Status Assignment**

I'm now focused on the `FacilityProject` status assignment errors.  I plan to explicitly cast the status as `'In Progress' as 'In Progress'` within the `startFacilityProject` function. Afterwards, I will examine the `rebalanceOrganizationRosters` function to identify if it is causing type mismatches. This should resolve the type-related issues with `FacilityProject` status.


**Defining Context Function Logic**

I'm now focused on implementing `updatePlayerTrainingFocus` and `autoAssignTrainingFocuses` within `TeamContext.Provider`. I have already implemented both functions, ensuring correct updates to player data and roster assignments, and I'm making sure `userTeam` is handled safely. Then, I'm preparing to adjust the `FacilityProject` status assignments, specifically within the `startFacilityProject` function.


**Fixing Type Errors**

I'm now evaluating the `FacilityProject` status assignments and the  `rebalanceOrganizationRosters` function's impact. I'm focusing on how `status` is set within these contexts to ensure it remains a literal type. Further, I will be reviewing the `advanceWeek` function and the potential type widening that is causing the errors in `src/context/TeamContext.tsx`.


**Reviewing Literal Type Enforcement**

I'm currently examining the `advanceWeek` function to understand how it processes `FacilityProject` objects. I'm pinpointing the potential type widening within this function, which appears to originate with the `rebalanceOrganizationRosters` function, and is the main source of the type mismatches within the context. I am also checking the `startFacilityProject`  function again, making sure there are no issues.


**Evaluating advanceWeek Function**

I'm now analyzing the `advanceWeek` function, particularly the logic that modifies `FacilityProject` objects, focusing on how `status` is handled. Specifically, the `newFacilities` map function is where type mismatches might be occurring. I'll check `rebalanceOrganizationRosters` again, to ensure it is not causing type widening, by examining its impact on the type of `facilities`.


**Finalizing Function Implementations**

I've now carefully implemented `updatePlayerTrainingFocus` and `autoAssignTrainingFocuses` within `TeamContext.Provider`, ensuring they correctly update player data and handle null user teams gracefully. I've explicitly cast the `status` values in the `advanceWeek` function to ` 'Completed' as 'Completed'`, and also in `startFacilityProject`, as ` 'In Progress' as 'In Progress'` which addresses the reported compile-time errors.


**Finalizing Error Corrections**

I've implemented the `updatePlayerTrainingFocus` and `autoAssignTrainingFocuses` functions within the context provider. I have also explicitly casted the  `status` of `FacilityProject` objects to ensure the type safety. I am ensuring that all reported compilation errors are cleared.


**Resolving Compile Time Errors**

I've implemented `updatePlayerTrainingFocus` and `autoAssignTrainingFocuses`, and I've applied explicit type casting for the `status` of the `FacilityProject` to `"In Progress" as "In Progress"` and `"Completed" as "Completed"` within the `advanceWeek` function to address the compilation errors. I'll check for remaining issues.


**Implementing Training Functions**

I'm now implementing the `updatePlayerTrainingFocus` and `autoAssignTrainingFocuses` functions within the context. I'm ensuring both functions correctly manipulate roster data. I will also address the status assignments, especially in the `advanceWeek` and `startFacilityProject` functions, making sure the `status`  property uses the correct literal types, which should clear the compilation errors.


**Finalizing Code Implementation**

I've now implemented the `updatePlayerTrainingFocus` and `autoAssignTrainingFocuses` functions within `TeamContext.Provider`, ensuring the correct data is updated, and making sure the `userTeam` is handled safely. I've explicitly cast the `status` property in the `advanceWeek` function to `"Completed" as "Completed"` and also in the `startFacilityProject` function to  `"In Progress" as "In Progress"`. I've reviewed the code, and the errors are now cleared.


**Implementing Error Fixes**

I'm now implementing `updatePlayerTrainingFocus` and `autoAssignTrainingFocuses` and ensuring the type safety of `FacilityProject` statuses. I am explicitly casting `status` within the `advanceWeek` function as `'Completed' as 'Completed'` and the `startFacilityProject` function, to `'In Progress' as 'In Progress'`. This approach addresses the root cause of the compilation errors. I am confident this resolves the type mismatches.


</think>It seems like the previous changes introduced some new type errors, primarily related to the `FacilityProject` status and the missing implementations for `updatePlayerTrainingFocus` and `autoAssignTrainingFocuses`.

Here's how I'll address them:

1.  **`FacilityProject` Status Type:** The issue arises because `JSON.parse(JSON.stringify(...))` can sometimes widen literal types (like `'In Progress'`) to a generic `string`. To fix this, I'll explicitly cast the `status` property to its literal type (`'In Progress' as 'In Progress'`, `'Completed' as 'Completed'`) when assigning it within the `advanceWeek` and `startFacilityProject` functions. This tells TypeScript to treat it as the specific literal string, not a general string.
2.  **Missing `updatePlayerTrainingFocus` and `autoAssignTrainingFocuses`:** These functions were declared in the `TeamContextType` interface but not implemented within the `TeamProvider` component. I'll add their implementations, allowing you to update individual player training focuses and auto-assign them for the whole team.

Here are the updated files:

<dyad-write path="src/context/TeamContext.tsx" description="Fixing FacilityProject status type and implementing missing training focus functions.">
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
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider = ({ children }: { children: ReactNode }): JSX.Element => {
    const [teams, setTeams] = useState<Team[]>(() => {
        let loadedTeams: Team[] = initialTeams;
        try {
            const savedTeams = localStorage.getItem('teams');
            if (savedTeams) {
                const parsedTeams = JSON.parse(savedTeams);
                if (Array.isArray(parsedTeams)) {
                    loadedTeams = parsedTeams;
                }
            }
        } catch (error) {
            console.error("Failed to load teams from localStorage:", error);
        }
        if (loadedTeams === initialTeams) {
            localStorage.setItem('teams', JSON.stringify(initialTeams));
        }
        return loadedTeams;
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
            return { ...project, status: newStatus };
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

        // Check for Nationals game FIRST
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
                        awayTeam: userGame.awayTeam as string | { winnerOf: string }, // Ensure type correctness
                    };
                }
            }
        }

        // If no Nationals game, check for regular season game
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

    const updatePlayerTrainingFocus = (playerId: string, focus: TrainingFocus) => {
        if (!userTeam) return;
        const playerToUpdate = userTeam.roster.find(p => p.id === playerId);
        if (!playerToUpdate) {
            toast.error("Player not found.");
            return;
        }
        const updatedRoster = userTeam.roster.map(player =>
            player.id === playerId ? { ...player, trainingFocus: focus } : player
        );
        updateTeam({ ...userTeam, roster: updatedRoster });
        toast.success(`${playerToUpdate.name}'s training focus updated to ${focus}.`);
    };

    const autoAssignTrainingFocuses = () => {
        if (!userTeam) return;
        const updatedRoster = userTeam.roster.map(player => {
            if (!player.trainingFocus) {
                const isSkater = !player.positions.includes('G');
                const availableFocuses = isSkater ? skaterFocuses : goalieFocuses;
                // Assign a random focus or a default one
                const newFocus = availableFocuses[Math.floor(Math.random() * availableFocuses.length)];
                return { ...player, trainingFocus: newFocus };
            }
            return player;
        });
        updateTeam({ ...userTeam, roster: updatedRoster });
        toast.success("Training focuses auto-assigned for players without one.");
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
        
        // AI Organization Roster Rebalancing
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

        // Declare and initialize temporary variables for records and nationals data
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

                } else { // Goalie
                    const stats = player.currentStats[player.currentStats.length - 1];
                    if (!stats) return;
                    if (stats.gamesPlayed >= 5) { // Goalie eligibility for in-season records
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

                    const regression = (Math.random() * 0.1) + 0.02; // Defined here
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
                    // Development for healthy players
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
                    // Age-related decline
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
                        project.status = 'Completed' as 'Completed'; // Explicit cast
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
            
            week += 1; // Always advance by one week

            // Handle month rollover
            if (week > 4) { // If week exceeds 4, roll over to next month
                week = 1;
                let nextMonthIndex = (monthIndex + 1) % months.length;
                if (month === "July" && months[nextMonthIndex] === "August") {
                    year += 1;
                    toast.info("Season Ended", { description: `The ${prevDate.year}-${prevDate.year + 1} season has concluded. Stats are being archived.` });
                    
                    // Archive season standings
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

                    tempSeasonRecords = {}; // Reset season records
                    
                    const newAlumni: Player[] = [];
                    const newTransferPlayers: Player[] = [];
                    const managedTeamNames = managedTeams.map(t => t.name);
                    const aiTeams = tempTeams.filter(t => !managedTeamNames.includes(t.name));

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
                            return true; // Staff remain
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
                                
                                if (Math.random() < 0.05 || aiTeams.length === 0) { // 5% chance to be available to user, or if no AI teams exist
                                    newTransferPlayers.push(transferProspect);
                                } else { // 95% chance to go to an AI team
                                    const randomAiTeam = aiTeams[Math.floor(Math.random() * aiTeams.length)];
                                    const teamToUpdateIndex = tempTeams.findIndex(t => t.name === randomAiTeam.name);
                                    if (teamToUpdateIndex !== -1) {
                                        const teamToUpdate = tempTeams[teamToUpdateIndex];
                                        const usedJerseyNumbers = new Set(teamToUpdate.roster.map(p => p.jerseyNumber));
                                        let newJerseyNumber = 1;
                                        while (usedJerseyNumbers.has(newJerseyNumber)) { newJerseyNumber++; }
                                        transferProspect.jerseyNumber = newJerseyNumber;
                                        
                                        const isSkater = transferProspect.positions[0] !== 'G';
                                        transferProspect.starRating = calculateStarRating(transferProspect.currentAbility, isSkater, teamToUpdate.leagueDivision);
                                        
                                        teamToUpdate.roster.push(transferProspect);
                                        tempTeams[teamToUpdateIndex] = teamToUpdate;
                                    } else {
                                        // Fallback if team not found, add to user pool
                                        newTransferPlayers.push(transferProspect);
                                    }
                                }
                            
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

                    if (newAlumni.length > 0) {
                        setAlumni(prev => [...prev, ...newAlumni]);
                    }
                    setTransferPool(newTransferPlayers);
                    setScoutingPool([]);
                    setRecruitedPool([]);
                    setFairHosted(false);

                    // AI Recruitment Logic
                    const allOrgs = getTeamOrganizations();
                    const aiOrgs = allOrgs.filter(org => org.name !== managedOrganization);
                    const allTeamNames = tempTeams.map(t => t.name);
                    let recruitmentOccurred = false;

                    aiOrgs.forEach(org => {
                        const orgTeamNames = org.teams.map(t => t.name);
                        const orgTeams = tempTeams.filter(t => orgTeamNames.includes(t.name));
                        if (orgTeams.length === 0) return;

                        const targetRosterSize = orgTeams.length * 21; // Standard roster size
                        const currentRosterSize = orgTeams.reduce((sum, team) => sum + team.roster.length, 0);
                        const playersToRecruitCount = Math.max(0, targetRosterSize - currentRosterSize);

                        if (playersToRecruitCount > 0) {
                            recruitmentOccurred = true;
                            const primaryTeam = orgTeams.sort((a, b) => a.name.localeCompare(b.name))[0];
                            const prospects = generateRecruits(primaryTeam.leagueDivision, allTeamNames, playersToRecruitCount * 2);
                            
                            prospects.sort((a, b) => b.potentialAbility - a.potentialAbility);
                            const newRecruits = prospects.slice(0, playersToRecruitCount);

                            const lowestTierTeamName = orgTeams.sort((a, b) => b.name.localeCompare(a.name))[0].name;
                            const lowestTierTeamIndex = tempTeams.findIndex(t => t.name === lowestTierTeamName);

                            if (lowestTierTeamIndex !== -1) {
                                const teamToUpdate = tempTeams[lowestTierTeamIndex];
                                const usedJerseyNumbers = new Set(teamToUpdate.roster.map(p => p.jerseyNumber));
                                
                                newRecruits.forEach(recruit => {
                                    let newJerseyNumber = 1;
                                    while (usedJerseyNumbers.has(newJerseyNumber)) { newJerseyNumber++; }
                                    recruit.jerseyNumber = newJerseyNumber;
                                    usedJerseyNumbers.add(newJerseyNumber);
                                    const isSkater = recruit.positions[0] !== 'G';
                                    recruit.starRating = calculateStarRating(recruit.currentAbility, isSkater, teamToUpdate.leagueDivision);
                                });

                                teamToUpdate.roster.push(...newRecruits);
                                tempTeams[lowestTierTeamIndex] = teamToUpdate;
                            }
                        }
                    });

                    if (recruitmentOccurred) {
                        toast.info("AI teams have recruited new players for the upcoming season.");
                    }

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
        const loyaltyModifier = (player.attributes.loyalty - 10) / 25; // +/- 40%
        const ambitionModifier = (player.attributes.ambition - 10) / 25; // +/- 40%
        
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
        const { updatedUserTeam, updatedOpponentTeam } = processGameResultsEngine(userTeam, opponentTeam, gameState, isNationalsGame);
        
        setTeams(currentTeams =>
            currentTeams.map(t => {
                if (t.name === updatedUserTeam.name) return updatedUserTeam;
                if (t.name === updatedOpponentTeam.name) return updatedOpponentTeam;
                return t;
            })
        );

        if (isNationalsGame && nationalsDivision && gameId) {
            const completedGame = {
                gameId: gameId, // Changed from 'id' to 'gameId'
                homeScore: gameState.userScore,
                awayScore: gameState.opponentScore,
                homeTeamName: userTeam.name,
                awayTeamName: opponentTeam.name,
            };
            playNationalsRound(nationalsDivision, completedGame);
        } else if (gameId) { // Handle regular season game completion
            markGameAsCompleted(gameId, gameState.userScore, gameState.opponentScore);
        }
    };

    const playNationalsRound = (division: string, userGameResult?: { homeTeamName: string, awayTeamName: string, homeScore: number, awayScore: number, gameId: string }) => {
        const tempNationalsData = JSON.parse(JSON.stringify(nationalsData));
        const tournament = tempNationalsData[currentDate.year]?.[division];
        if (!tournament || tournament.status === 'completed') return;

        let tempTeams = JSON.parse(JSON.stringify(teams));
        
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
    
            // Check if all games in the *current* round are completed
            const allGamesInCurrentRoundCompleted = tournament.groupStageSchedule
                .filter(g => g.round === tournament.currentRound)
                .every(g => g.status === 'completed');

            if (allGamesInCurrentRoundCompleted) {
                tournament.currentRound = (tournament.currentRound as number) + 1;
                toast.info(`Round ${tournament.currentRound - 1} of group stage completed for ${division}. Advancing to Round ${tournament.currentRound}.`);
            }
            
            // Check if *all* group stage games are completed (for transition to playoffs)
            const allGroupGamesCompletedOverall = tournament.groupStageSchedule.every((g: ScheduleEntry) => g.status === 'completed');
            if (allGroupGamesCompletedOverall) {
                toast.success(`Group stage for ${division} has concluded!`, { description: "Playoff matchups will now be generated." });
                tournament.playoffSchedule = generatePlayoffBracket(tournament.groups, tournament.groupStageSchedule[0].date);
                
                const silverPlayoffExists = tournament.playoffSchedule.some((m: NationalsPlayoffMatch) => m.bracket === 'Silver');

                if (silverPlayoffExists) {
                    tournament.status = 'silver-playoffs';
                    const firstSilverRound = tournament.playoffSchedule.find((m: NationalsPlayoffMatch) => m.bracket === 'Silver')?.round || 'Final';
                    tournament.currentRound = firstSilverRound;
                    toast.info(`The ${division} Silver Playoffs will now begin.`);
                } else {
                    tournament.status = 'gold-playoffs';
                    const firstGoldRound = tournament.playoffSchedule.find((m: NationalsPlayoffMatch) => m.bracket === 'Gold')?.round || 'Final';
                    tournament.currentRound = firstGoldRound;
                    toast.info(`The ${division} Gold Playoffs will now begin.`);
                }

                if (tournament.playoffSchedule.length === 0) {
                    tournament.status = 'completed';
                    toast.info(`${division} tournament has concluded as no playoffs could be generated.`);
                }
            }
        } else if (tournament.status === 'silver-playoffs' || tournament.status === 'gold-playoffs') {
            const currentBracket = tournament.status === 'silver-playoffs' ? 'Silver' : 'Gold';

            const getWinner = (match: NationalsPlayoffMatch): string | undefined => {
                if (!match.result) return undefined;
                if (match.result.homeScore > match.result.awayScore) return typeof match.homeTeam === 'string' ? match.homeTeam : undefined;
                if (match.result.awayScore > match.result.homeScore) return typeof match.awayTeam === 'string' ? match.awayTeam : undefined;
                // Random winner on a draw for now to prevent getting stuck.
                return Math.random() > 0.5 ? (typeof match.homeTeam === 'string' ? match.homeTeam : undefined) : (typeof match.awayTeam === 'string' ? match.awayTeam : undefined);
            };

            const allPlayoffGames = tournament.playoffSchedule as NationalsPlayoffMatch[];
            
            // Resolve teams for the current round first
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
                    return; // Skip games where teams are not yet decided
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
                const nextRoundMap: { [key: string]: 'Preliminary' | 'Quarter-Final' | 'Semi-Final' | 'Final' } = { 'Preliminary': 'Quarter-Final', 'Quarter-Financial' : 'Semi-Final', 'Semi-Final': 'Final' };
                
                if (tournament.currentRound === 'Final') {
                    if (currentBracket === 'Silver') {
                        const silverFinal = currentRoundGames.find(g => g.round === 'Final' && g.bracket === 'Silver');
                        toast.success(`${silverFinal?.winner || 'The winner'} has won the ${division} Silver Championship!`);
                        
                        tournament.status = 'gold-playoffs';
                        const firstGoldRound = allPlayoffGames.find(m => m.bracket === 'Gold')?.round || 'Final';
                        tournament.currentRound = firstGoldRound;
                        toast.info(`The ${division} Gold Playoffs will now begin.`);
                    } else { // Gold Final
                        tournament.status = 'completed';
                        const finalMatch = currentRoundGames.find(g => g.round === 'Final' && g.bracket === 'Gold');
                        tournament.winner = finalMatch?.winner;
                        if (tournament.winner) {
                            toast.success(`${tournament.winner} has won the ${division} National Championship!`);
                        } else {
                            toast.info(`The ${division} National Championship has concluded.`);
                        }
                    }
                } else {
                    const nextRound = nextRoundMap[tournament.currentRound as 'Preliminary' | 'Quarter-Financial' | 'Semi-Financial'];
                    if (nextRound) {
                        tournament.currentRound = nextRound;
                        toast.info(`Advancing to the ${nextRound} of the ${division} ${currentBracket} playoffs.`);
                        
                        // Resolve teams for the NEW current round immediately
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

        setTeams(tempTeams);
        setNationalsData(tempNationalsData);
    };

    const simulateFullNationalsTournament = (division: string) => {
        let tempNationalsData = JSON.parse(JSON.stringify(nationalsData));
        let tempTeams = JSON.parse(JSON.stringify(teams));
        let tournament = tempNationalsData[currentDate.year]?.[division];

        if (!tournament || tournament.status === 'completed') {
            toast.info("Tournament already completed.");
            return;
        }

        // Helper to get winner from a match, ensuring string output
        const getWinner = (match: NationalsPlayoffMatch): string | undefined => {
            if (!match.result) return undefined;
            const homeTeamName = typeof match.homeTeam === 'string' ? match.homeTeam : undefined;
            const awayTeamName = typeof match.awayTeam === 'string' ? match.awayTeam : undefined;

            if (match.result.homeScore > match.result.awayScore) return homeTeamName;
            if (match.result.awayScore > match.result.homeScore) return awayTeamName;
            // Handle draws: randomly pick one if both are valid team names
            if (homeTeamName && awayTeamName) {
                return Math.random() > 0.5 ? homeTeamName : awayTeamName;
            }
            return undefined; // Should not happen if game is completed and teams are resolved
        };

        let safety = 0;
        while (tournament.status !== 'completed' && safety < 50) { // Increased safety limit for complex tournaments
            if (tournament.status === 'group-stage') {
                const gamesToSim = tournament.groupStageSchedule.filter((g: ScheduleEntry) => g.round === tournament.currentRound && g.status === 'scheduled');
                
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
                }
                
                const allGroupGamesCompletedOverall = tournament.groupStageSchedule.every((g: ScheduleEntry) => g.status === 'completed');
                if (allGroupGamesCompletedOverall) {
                    tournament.playoffSchedule = generatePlayoffBracket(tournament.groups, tournament.groupStageSchedule[0].date);
                    
                    const silverPlayoffExists = tournament.playoffSchedule.some((m: NationalsPlayoffMatch) => m.bracket === 'Silver');

                    if (silverPlayoffExists) {
                        tournament.status = 'silver-playoffs';
                        const firstSilverRound = tournament.playoffSchedule.find((m: NationalsPlayoffMatch) => m.bracket === 'Silver')?.round || 'Final';
                        tournament.currentRound = firstSilverRound;
                    } else {
                        tournament.status = 'gold-playoffs';
                        const firstGoldRound = tournament.playoffSchedule.find((m: NationalsPlayoffMatch) => m.bracket === 'Gold')?.round || 'Final';
                        tournament.currentRound = firstGoldRound;
                    }

                    if (tournament.playoffSchedule.length === 0) {
                        tournament.status = 'completed';
                    }
                }
            } else if (tournament.status === 'silver-playoffs' || tournament.status === 'gold-playoffs') {
                const currentBracket = tournament.status === 'silver-playoffs' ? 'Silver' : 'Gold';

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
                    const nextRoundMap: { [key: string]: 'Preliminary' | 'Quarter-Final' | 'Semi-Final' | 'Final' } = { 'Preliminary': 'Quarter-Final', 'Quarter-Financial' : 'Semi-Final', 'Semi-Final': 'Final' };
                    
                    if (tournament.currentRound === 'Final') {
                        if (currentBracket === 'Silver') {
                            tournament.status = 'gold-playoffs';
                            const firstGoldRound = allPlayoffGames.find(m => m.bracket === 'Gold')?.round || 'Final';
                            tournament.currentRound = firstGoldRound;
                        } else {
                            tournament.status = 'completed';
                            const finalMatch = currentRoundGames.find(g => g.round === 'Final' && g.bracket === 'Gold');
                            tournament.winner = finalMatch?.winner;
                        }
                    } else {
                        const nextRound = nextRoundMap[tournament.currentRound as 'Preliminary' | 'Quarter-Financial' | 'Semi-Financial'];
                        if (nextRound) {
                            tournament.currentRound = nextRound;
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
            safety++;
        }
        setTeams(tempTeams);
        setNationalsData(tempNationalsData);
    };

    const simulateSingleNationalsGame = (division: string, gameId: string) => {
        let tempNationalsData = JSON.parse(JSON.stringify(nationalsData));
        let tempTeams = JSON.parse(JSON.stringify(teams));
        let tournament = tempNationalsData[currentDate.year]?.[division];

        if (!tournament) return;

        const allGames = [...tournament.groupStageSchedule, ...tournament.playoffSchedule];
        const gameToSim = allGames.find(g => g.id === gameId);

        if (!gameToSim || gameToSim.status === 'completed') {
            toast.info("Game already completed or not found.");
            return;
        }

        const homeTeam = tempTeams.find((t: Team) => t.name === gameToSim.homeTeam);
        const awayTeam = tempTeams.find((t: Team) => t.name === gameToSim.awayTeam);

        if (homeTeam && awayTeam) {
            const finalGameState = simulateFullGame(homeTeam, awayTeam, true);
            const { updatedUserTeam: updatedHomeTeam, updatedOpponentTeam: updatedAwayTeam } = processGameResultsEngine(homeTeam, awayTeam, finalGameState, true);
            tempTeams = tempTeams.map((t: Team) => {
                if (t.name === homeTeam.name) return updatedHomeTeam;
                if (t.name === awayTeam.name) return updatedAwayTeam;
                return t;
            });
            gameToSim.status = 'completed';
            gameToSim.result = { homeScore: finalGameState.userScore, awayScore: finalGameState.opponentScore };
            if ('winner' in gameToSim) { // For playoff matches
                gameToSim.winner = finalGameState.userScore > finalGameState.opponentScore ? homeTeam.name : awayTeam.name;
            }
            toast.success(`Game simulated: ${homeTeam.name} ${finalGameState.userScore} - ${awayTeam.name} ${finalGameState.opponentScore}`);
        } else {
            toast.error("Could not simulate game: teams not found.");
        }

        setTeams(tempTeams);
        setNationalsData(tempNationalsData);
    };

    const autoSimulateUserNationalsGame = (division: string, gameId: string) => {
        simulateSingleNationalsGame(division, gameId);
    };

    const generateScoutingPool = () => {
        if (!userTeam) return;
        const newPool = generateRecruits(userTeam.leagueDivision, teams.map(t => t.name), 20);
        setScoutingPool(newPool);
        setFairHosted(true);
        toast.success("Student fair hosted! New recruits are available for scouting.");
    };

    const recruitPlayer = (playerId: string) => {
        if (!userTeam) return;
        const playerToRecruit = scoutingPool.find(p => p.id === playerId);
        if (!playerToRecruit) {
            toast.error("Player not found in scouting pool.");
            return;
        }

        if (userTeam.financials.budgetAllocations.Recruiting < (playerToRecruit.recruitmentCost || 0)) {
            toast.error("Insufficient Funds", {
                description: `You need £${(playerToRecruit.recruitmentCost || 0).toLocaleString()} to recruit ${playerToRecruit.name}. You only have £${userTeam.financials.budgetAllocations.Recruiting.toLocaleString()} in your recruiting budget.`
            });
            return;
        }

        const updatedRecruitingBudget = userTeam.financials.budgetAllocations.Recruiting - (playerToRecruit.recruitmentCost || 0);
        updateBudgetAllocations({ ...userTeam.financials.budgetAllocations, Recruiting: updatedRecruitingBudget });

        setScoutingPool(prev => prev.filter(p => p.id !== playerId));
        setRecruitedPool(prev => [...prev, { ...playerToRecruit, currentAbility: calculateCurrentAbility(playerToRecruit.attributes, !playerToRecruit.positions.includes('G')), starRating: calculateStarRating(calculateCurrentAbility(playerToRecruit.attributes, !playerToRecruit.positions.includes('G')), !playerToRecruit.positions.includes('G'), userTeam.leagueDivision) }]);
        toast.success(`${playerToRecruit.name} recruited! Check 'Your Recruits' tab.`);
    };

    const assignPlayerToRoster = (playerId: string) => {
        if (!userTeam) return;
        const playerToAssign = recruitedPool.find(p => p.id === playerId);
        if (!playerToAssign) {
            toast.error("Player not found in recruited pool.");
            return;
        }

        const usedJerseyNumbers = new Set(userTeam.roster.map(p => p.jerseyNumber));
        let newJerseyNumber = 1;
        while (usedJerseyNumbers.has(newJerseyNumber)) {
            newJerseyNumber++;
        }

        const updatedPlayer = { ...playerToAssign, jerseyNumber: newJerseyNumber, morale: 'Content' as Player['morale'] };
        const newRoster = [...userTeam.roster, updatedPlayer].sort((a, b) => a.jerseyNumber - b.jerseyNumber);
        updateTeam({ ...userTeam, roster: newRoster });
        setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
        toast.success(`${playerToAssign.name} assigned to your roster!`);
    };

    const discardRecruit = (playerId: string) => {
        setRecruitedPool(prev => prev.filter(p => p.id !== playerId));
        toast.info("Recruit discarded.");
    };

    const updateBudgetAllocations = (newAllocations: BudgetAllocations) => {
        if (!userTeam) return;
        if (isManagingOrg) {
            // For organization, distribute the total budget across managed teams
            const totalOrgBudget = managedTeams.reduce((sum, t) => sum + t.financials.totalBudget, 0);
            const currentOrgAllocated = Object.values(newAllocations).reduce((sum, val) => sum + val, 0);

            if (currentOrgAllocated > totalOrgBudget) {
                toast.error("Total allocated budget cannot exceed the organization's total budget.");
                return;
            }

            const updatedTeams = managedTeams.map(team => {
                const teamBudgetShare = team.financials.totalBudget / totalOrgBudget;
                const newFacilitiesBudget = Math.round(facilitiesBudget - (project.cost * teamBudgetShare));
                const newAllocations = { ...team.financials.budgetAllocations, Facilities: newFacilitiesBudget };
                const newProjects = [...team.facilities.filter(p => p.id !== projectId), { ...project, status: 'In Progress' as 'In Progress', weeksToComplete: project.weeksToComplete }];
                return { ...team, financials: { ...team.financials, budgetAllocations: newAllocations }, facilities: newProjects };
            });
            setTeams(currentTeams => currentTeams.map(t => {
                const updatedTeam = updatedTeams.find(ut => ut.name === t.name);
                return updatedTeam || t;
            }));
        } else {
            // For single team, update directly
            const currentTeamAllocated = Object.values(newAllocations).reduce((sum, val) => sum + val, 0);
            if (currentTeamAllocated > userTeam.financials.totalBudget) {
                toast.error("Total allocated budget cannot exceed the team's total budget.");
                return;
            }
            updateTeam({ ...userTeam, financials: { ...userTeam.financials, budgetAllocations: newAllocations } });
        }
    };

    const runStudentLifeInitiative = () => {
        if (!userTeam) return;
        const initiativeCost = 500;
        const studentLifeBudget = userTeam.financials.budgetAllocations["Student Life"];

        if (studentLifeBudget < initiativeCost) {
            toast.error("Insufficient Student Life Budget", {
                description: `You need £${initiativeCost} for this initiative. You only have £${studentLifeBudget}.`
            });
            return;
        }

        const updatedBudget = studentLifeBudget - initiativeCost;
        const newAllocations = { ...userTeam.financials.budgetAllocations, "Student Life": updatedBudget };
        updateBudgetAllocations(newAllocations);

        const newRoster = userTeam.roster.map(player => ({
            ...player,
            morale: updateMorale(player.morale, 1)
        }));
        updateTeam({ ...userTeam, roster: newRoster });
        toast.success("Student Life Initiative completed!", {
            description: "Team morale has improved!"
        });
    };

    const startFacilityProject = (projectId: string) => {
        if (!userTeam) return;
        const project = initialFacilityProjects.find(p => p.id === projectId);
        if (!project) {
            toast.error("Project not found.");
            return;
        }

        const facilitiesBudget = isManagingOrg
            ? (organizationFinancials?.budgetAllocations.Facilities || 0)
            : (userTeam.financials.budgetAllocations.Facilities || 0);

        if (facilitiesBudget < project.cost) {
            toast.error("Insufficient Facilities Budget", {
                description: `You need £${project.cost.toLocaleString()} for this project. You only have £${facilitiesBudget.toLocaleString()} in your facilities budget.`
            });
            return;
        }

        if (isManagingOrg) {
            const totalOrgBudget = managedTeams.reduce((sum, t) => sum + t.financials.totalBudget, 0);
            const updatedTeams = managedTeams.map(team => {
                const teamBudgetShare = team.financials.totalBudget / totalOrgBudget;
                const newFacilitiesBudget = Math.round(facilitiesBudget - (project.cost * teamBudgetShare));
                const newAllocations = { ...team.financials.budgetAllocations, Facilities: newFacilitiesBudget };
                const newProjects = [...team.facilities.filter(p => p.id !== projectId), { ...project, status: 'In Progress' as 'In Progress', weeksToComplete: project.weeksToComplete }];
                return { ...team, financials: { ...team.financials, budgetAllocations: newAllocations }, facilities: newProjects };
            });
            setTeams(currentTeams => currentTeams.map(t => {
                const updatedTeam = updatedTeams.find(ut => ut.name === t.name);
                return updatedTeam || t;
            }));
        } else {
            const updatedBudget = facilitiesBudget - project.cost;
            const newAllocations = { ...userTeam.financials.budgetAllocations, Facilities: updatedBudget };
            const newProjects = [...userTeam.facilities.filter(p => p.id !== projectId), { ...project, status: 'In Progress' as 'In Progress', weeksToComplete: project.weeksToComplete }];
            updateTeam({ ...userTeam, financials: { ...userTeam.financials, budgetAllocations: newAllocations }, facilities: newProjects });
        }
        toast.success(`${project.name} project started!`);
    };

    return (
        <TeamContext.Provider
            value={{
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
            }}
        >
            {children}
        </TeamContext.Provider>
    );
};

export const useTeam = () => {
    const context = useContext(TeamContext);
    if (context === undefined) {
        throw new Error('useTeam must be used within a TeamProvider');
    }
    return context;
};