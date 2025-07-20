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
        <dyad-problem-report summary="20 problems">
<problem file="src/context/TeamContext.tsx" line="17" column="34" code="1005">'from' expected.</problem>
<problem file="src/context/TeamContext.tsx" line="17" column="34" code="1141">String literal expected.</problem>
<problem file="src/context/TeamContext.tsx" line="1386" column="13" code="2353">Object literal may only specify known properties, and 'teams' does not exist in type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1418" column="31" code="2339">Property 'teams' does not exist on type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1419" column="32" code="2339">Property 'alumni' does not exist on type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1420" column="40" code="2339">Property 'activeTeamName' does not exist on type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1421" column="45" code="2339">Property 'managedOrganization' does not exist on type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1422" column="39" code="2339">Property 'isManagingOrg' does not exist on type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1423" column="34" code="2339">Property 'schedule' does not exist on type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1424" column="39" code="2339">Property 'nationalsData' does not exist on type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1425" column="39" code="2339">Property 'seasonRecords' does not exist on type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1426" column="39" code="2339">Property 'careerRecords' does not exist on type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1427" column="42" code="2339">Property 'teamAchievements' does not exist on type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1428" column="38" code="2339">Property 'transferPool' does not exist on type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1429" column="39" code="2339">Property 'seasonHistory' does not exist on type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1430" column="38" code="2339">Property 'scoutingPool' does not exist on type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1431" column="39" code="2339">Property 'recruitedPool' does not exist on type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1432" column="36" code="2339">Property 'fairHosted' does not exist on type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1434" column="44" code="2339">Property 'developmentHistory' does not exist on type 'SaveGameSlot'.</problem>
<problem file="src/context/TeamContext.tsx" line="1585" column="13" code="18004">No value exists in scope for the shorthand property 'startFacilityProject'. Either declare one or provide an initializer.</problem>
</dyad-problem-report><think>Deciding which files are relevant...

**Tackling Compile Errors**

I'm methodically working through the TypeScript errors. The first one, in `TeamContext.tsx` on line 17, is a syntax issue: a missing 'from'. Looks like a simple fix, will address it immediately. Subsequent errors likely depend on the initial fix, so I will keep moving forward.


**Correcting Imports**

I've pinpointed the initial error to a syntax issue on line 17 of `TeamContext.tsx`, stemming from an incorrect import statement. The `=>` was the culprit; it needed to be `from`. Fixing this should resolve the subsequent errors flagged.


**Defining Save Game Slots**

I've moved onto `types/index.ts`. Currently, the `SaveGameSlot` type is too simplistic. I'm inspecting the `saveGame` function in `TeamContext.tsx` to identify all the properties that need to be saved and incorporated into the `SaveGameSlot` definition, which includes `teams`, `alumni`, `activeTeamName`, and the current date. I'm expanding the type definition.


**Expanding the Type**

I've reviewed the `saveGame` function and the current `SaveGameSlot` type. It's clear that the type definition in `types/index.ts` is missing a lot of crucial properties. I'm now updating the `SaveGameSlot` definition to include `teams`, `alumni`, `activeTeamName`, `managedOrganization`, `isManagingOrg`, `schedule`, `nationalsData`, `seasonRecords`, `careerRecords`, `teamAchievements`, `transferPool`, `seasonHistory`, `scoutingPool`, `recruitedPool`, `fairHosted`, and `developmentHistory`, alongside the already existing properties.


**Refining SaveGame Type**

I've identified the missing properties in `SaveGameSlot`. To fully resolve the type errors, I need to update the type definition in `types/index.ts`. The current definition is far too basic. I'm adding `teams`, `alumni`, `activeTeamName`, `managedOrganization`, `isManagingOrg`, `schedule`, `nationalsData`, `seasonRecords`, `careerRecords`, `teamAchievements`, `transferPool`, `seasonHistory`, `scoutingPool`, `recruitedPool`, `fairHosted`, and `developmentHistory` to the `SaveGameSlot` type definition.


{
  "complexity": "low",
  "relevantFiles": [
    "src/context/TeamContext.tsx",
    "src/types/index.ts"
  ]
}</think><dyad-codebase-context files="src/context/TeamContext.tsx,src/types/index.ts">Complexity: low</dyad-codebase-context><think>**Examining Compilation Issues**

I'm currently focused on resolving the TypeScript errors. I've started by dissecting the compilation failures, beginning with the first few. I'm applying fixes and making sure everything works. My current approach is error-by-error, with focused attention to details of the errors.


**Resolving Syntax Errors**

I've identified and fixed the syntax error in `TeamContext.tsx`, specifically around the import statement. I have corrected the incorrect syntax. I'm ready to address the series of `SaveGameSlot` property errors.


**Implementing Error Solutions**

I've fully analyzed the errors and formulated a solution strategy. The plan is to address the import syntax error in `TeamContext.tsx`, then update the `SaveGameSlot` type in `src/types/index.ts` to include the missing properties, and finally implement a basic placeholder function for `startFacilityProject` to resolve the final error.


</think>You've hit a few more TypeScript snags, mainly related to an incorrect import syntax and an incomplete `SaveGameSlot` type definition. I'll address these issues to get your application compiling smoothly.

Here's what I'll do:

1.  **Fix Import Syntax:** Correct the `processNationalsRound` import statement in `src/context/TeamContext.tsx` from `=>` to `from`.
2.  **Update `SaveGameSlot` Type:** Expand the `SaveGameSlot` interface in `src/types/index.ts` to include all the properties that are being saved and loaded in your `TeamContext`, such as `teams`, `alumni`, `schedule`, `nationalsData`, and others. This will resolve all the "Property 'X' does not exist on type 'SaveGameSlot'" errors.
3.  **Implement `startFacilityProject`:** Add a basic implementation for the `startFacilityProject` function within `TeamProvider` in `src/context/TeamContext.tsx`, as it was declared in the interface but not defined.

Here are the code changes:

<dyad-edit path="src/context/TeamContext.tsx" description="Fixing import syntax and implementing startFacilityProject.">
```typescript
// ... existing code ...
import { rebalanceOrganizationRosters } from '@/lib/aiManager';
import { processNationalsRound } from '@/lib/nationalsSimulator';
import { getAggregatedCurrentStats } from '@/lib/statsUtils';

const months = ["August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June", "July"];
// ... existing code ...
    const startFacilityProject = (projectId: string) => {
        if (!userTeam) return;
        // Placeholder for actual facility project logic
        toast.info(`Attempted to start facility project: ${projectId}. (Functionality not yet implemented)`);
    };

    return (
        <TeamContext.Provider value={{
            teams,
            updateTeam,
// ... existing code ...
```
</dyad-edit>

<dyad-write path="src/types/index.ts" description="Updating the SaveGameSlot type to include all necessary properties for saving and loading game state.">
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
  alumniStatus?: 'Retired' | 'Active Elsewhere' | 'Transfer Listed';
  isContinuingEducation?: boolean;
  continuingEducationStartSeason?: string;
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
  discretionaryBudget: number;
  iceTimeCostPerGame: number;
  equipmentCost: number;
};

export type FacilityProject = {
  id: string;
  name: string;
  description: string;
  cost: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
  benefit: string;
  weeksToComplete?: number;
  category: 'Financial' | 'Player Development' | 'Player Welfare' | 'Recruitment';
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

export type GameSkaterStats = {
    playerId: string;
    goals: number;
    assists: number;
    penaltyMinutes: number;
};

export type GameGoalieStats = {
    playerId: string;
    shotsAgainst: number;
    saves: number;
    goalsAgainst: number;
    shutout: boolean;
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
  skaterStats: GameSkaterStats[];
  goalieStats: GameGoalieStats[];
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
  currentRound: number | 'Quarter-Final' | 'Semi-Final' | 'Final';
};

export type Achievement = {
    type: 'Division Title' | 'Nationals Gold' | 'Nationals Silver';
    season: string;
    division: string;
};

export type TeamAchievements = {
    [teamName: string]: Achievement[];
};

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

export type SaveGameSlot = {
    saveName: string;
    savedAt: string;
    userTeamName: string;
    currentDate: GameDate;
    teams: Team[]; // Added
    alumni: Player[]; // Added
    activeTeamName: string | null; // Added
    managedOrganization: string | null; // Added
    isManagingOrg: boolean; // Added
    schedule: ScheduleEntry[]; // Added
    nationalsData: { [year: number]: { [division: string]: NationalsTournament } }; // Added
    seasonRecords: { [key in RecordCategory]?: TeamRecord }; // Added
    careerRecords: { [key in RecordCategory]?: TeamRecord }; // Added
    teamAchievements: TeamAchievements; // Added
    transferPool: Player[]; // Added
    seasonHistory: SeasonHistory; // Added
    scoutingPool: Player[]; // Added
    recruitedPool: Player[]; // Added
    fairHosted: boolean; // Added
    developmentHistory: DevelopmentLog[]; // Added
};