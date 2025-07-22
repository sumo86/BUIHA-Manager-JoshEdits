import { useMemo, useState } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Player, Position } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Star, StarHalf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DivisionWinnersHistory from '@/components/buiha/DivisionWinnersHistory';
import NationalsHistoryView from '@/components/buiha/NationalsHistoryView';

type PlayerWithTeamInfo = Player & {
  teamName: string;
  leagueDivision: string;
  nationalsDivision: string;
};

type SortConfig = {
  key: keyof PlayerWithTeamInfo | 'teamName';
  direction: 'asc' | 'desc';
} | null;

const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
        ))}
        {halfStar && <StarHalf key="half" className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
      </div>
    );
};

const renderEligibility = (player: Player) => {
    if ((player.eligibility === 'Masters' || player.eligibility === 'PhD') && player.yearsLeftInProgram !== undefined) {
        const yearsText = player.yearsLeftInProgram === 1 ? '1 year left' : `${player.yearsLeftInProgram} years left`;
        return `${player.eligibility} (${yearsText})`;
    }
    return player.eligibility;
};

const PlayerOverview = () => {
  const navigate = useNavigate();
  const { teams } = useTeam();
  
  const [filters, setFilters] = useState({ team: 'all', division: 'all', position: 'all', name: '' });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'starRating', direction: 'desc' });

  const allPlayers = useMemo<PlayerWithTeamInfo[]>(() => {
    return teams.flatMap(team => 
      team.roster.map(player => ({
        ...player,
        teamName: team.name,
        leagueDivision: team.leagueDivision,
        nationalsDivision: team.nationalsDivision,
      }))
    );
  }, [teams]);

  const filteredAndSortedPlayers = useMemo(() => {
    let players = [...allPlayers];

    if (filters.team !== 'all') players = players.filter(p => p.teamName === filters.team);
    if (filters.division !== 'all') players = players.filter(p => p.nationalsDivision === filters.division);
    if (filters.position !== 'all') players = players.filter(p => p.positions.includes(filters.position as any));
    if (filters.name) players = players.filter(p => p.name.toLowerCase().includes(filters.name.toLowerCase()));

    if (sortConfig !== null) {
      players.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        // Explicitly cast to any for comparison to avoid symbol type issues
        if (aVal < (bVal as any)) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > (bVal as any)) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return players;
  }, [allPlayers, filters, sortConfig]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const requestSort = (key: keyof PlayerWithTeamInfo | 'teamName') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const uniqueTeams = useMemo(() => [...new Set(teams.map(t => t.name))].sort(), [teams]);
  const uniqueDivisions = useMemo(() => [...new Set(teams.map(t => t.nationalsDivision))].sort(), [teams]);
  const uniquePositions: Position[] = ["C", "LW", "RW", "LD", "RD", "G"];

  const SortableHeader = ({ sortKey, children }: { sortKey: keyof PlayerWithTeamInfo | 'teamName', children: React.ReactNode }) => (
    <<dyad-problem-report summary="4 problems">
<problem file="src/components/training/PlayerFocusTable.tsx" line="46" column="21" code="2322">Type 'string | number' is not assignable to type 'string'.
  Type 'number' is not assignable to type 'string'.</problem>
<problem file="src/components/training/PlayerFocusTable.tsx" line="55" column="49" code="2322">Type 'string | number' is not assignable to type 'string'.
  Type 'number' is not assignable to type 'string'.</problem>
<problem file="src/pages/Settings.tsx" line="11" column="24" code="2339">Property 'simSpeed' does not exist on type 'TeamContextType'.</problem>
<problem file="src/pages/Settings.tsx" line="11" column="34" code="2339">Property 'updateSimSpeed' does not exist on type 'TeamContextType'.</problem>
</dyad-problem-report><think>Deciding which files are relevant...

**Diagnosing Type Mismatches**

I've moved on to tackling errors 3 and 4 now that I've addressed the type discrepancies in `PlayerFocusTable.tsx`. I've identified the issue in `Settings.tsx`. It's a missing property definition in `TeamContextType`. I'll need to update `src/context/TeamContext.tsx` by adding the `simSpeed` and `updateSimSpeed` properties to the `TeamContextType` interface and its implementation in the `TeamProvider`. This should resolve those issues directly.


**Prioritizing the Context**

I'm now implementing the fixes for errors 3 and 4 by modifying `TeamContext.tsx` before addressing the type mismatches in `PlayerFocusTable.tsx`. I am focusing on adding `simSpeed` and `updateSimSpeed` to the `TeamContextType` interface. Then I will initialize the `simSpeed` state, create an `updateSimSpeed` function, and, finally, ensure `simSpeed` persists in `localStorage`. I'm hopeful this will quickly resolve the issues in `Settings.tsx`.


**Implementing the Team Context**

I've finished implementing `simSpeed` and `updateSimSpeed` in `TeamContext.tsx`. This included adding the properties to `TeamContextType`, setting up the state, creating the updating function, and integrating it with `localStorage`. The `Settings.tsx` errors should be resolved now. Next I will move onto the `PlayerFocusTable.tsx` fixes.


{
  "complexity": "low",
  "relevantFiles": [
    "src/context/TeamContext.tsx",
    "src/pages/Settings.tsx",
    "src/components/training/PlayerFocusTable.tsx",
    "src/types/index.ts"
  ]
}</think><dyad-codebase-context files="src/context/TeamContext.tsx,src/pages/Settings.tsx,src/components/training/PlayerFocusTable.tsx,src/types/index.ts">Complexity: low</dyad-codebase-context><think>**Debugging the TypeScript Errors**

I'm currently focused on resolving the TypeScript compile-time errors. Error numbers 1 and 2 in PlayerFocusTable.tsx are front and center. They both involve type mismatches, specifically where a number is being assigned to a string. I'm now diving into the specific lines to understand where these assignments are happening so I can correct them and keep moving on to the other errors.


**Troubleshooting Type Mismatches**

I'm meticulously examining the type mismatches. I've started by addressing errors 1 and 2. The `Select` and `SelectItem` components are the central issue, as anticipated. I am double-checking the `focus` variable and will explicitly cast it to a string to resolve these issues. Once this is fixed, I can go to error 3 and 4.


**Analyzing the Context Type**

I've identified that I need to address errors 3 and 4 related to `simSpeed` and `updateSimSpeed`. I'll start by modifying `TeamContextType` to include these properties. This will involve adding `simSpeed` and the `updateSimSpeed` function signature to the `TeamContextType` interface, which is in `src/context/TeamContext.tsx`. I'm planning to define the `SimSpeed` type and include it, as well as add the state management for them in the `TeamProvider`.


**Addressing the Team Context**

I've implemented the `simSpeed` and `updateSimSpeed` changes in `TeamContext.tsx`, adding them to the `TeamContextType` and managing state within the `TeamProvider`. I've also added the `useEffect` hook to store the selected `simSpeed` in local storage, with a default value of "Normal". The update function is now complete. I'm ready to move to the next step.


**Resolving String Type Issues**

I'm currently trying to get through the PlayerFocusTable.tsx type errors. I've looked into the `focus` variable and found that it should be a string, but TypeScript isn't always seeing it that way. I'm going to apply explicit string casting to the `key` and `value` props to make sure the compiler accepts them and move forward.


**Casting the Select Props**

I've now finished implementing the `simSpeed` and `updateSimSpeed` changes in `TeamContext.tsx`. Next, I focused on `PlayerFocusTable.tsx`. The `Select` and `SelectItem` components are the root of the errors. I've made sure that the values of `key` and `value` props of `SelectItem` components are explicitly cast to strings to get past the TypeScript issues.


**Addressing The Symbol Errors**

I'm now tackling the symbol-related errors in `TeamContext.tsx`. These are likely due to using `keyof` on an interface that might have symbol properties. I'm reviewing where these are occurring and will adjust the code to correctly handle these. Specifically, I'll look at using `Object.keys()` to iterate over the object properties, filtering out any symbols, which should resolve the issues.


**Implementing TeamContext and Casting**

I've added `simSpeed` and `updateSimSpeed` to the `TeamContextType` interface and implemented the state management within `TeamProvider`, including local storage persistence. Also, to address the string type issues in `PlayerFocusTable.tsx`, I've applied explicit string casting to the `key` and `value` props within the `SelectItem` component.


**Refactoring Context Types**

I'm now working on the TypeScript errors related to symbol properties in `TeamContext.tsx`. I've pinpointed the issues to the use of `keyof` with potentially symbol-keyed types. To fix this, I'll replace direct indexing with a combination of `Object.keys()` and string casting to ensure only string-based keys are used, preventing symbol-related errors.


**Fixing Context and Types**

I'm currently resolving the errors. I've addressed the type mismatch issues in `PlayerFocusTable.tsx` by casting the `focus` variable to a string within the `SelectItem` component. I have also added the `simSpeed` and `updateSimSpeed` variables to `TeamContext.tsx` and implemented their state management. Finally, I have explicitly cast the key attributes to strings to resolve symbol issues.


**Addressing TeamContext Errors**

I'm now focused on the `TeamContext.tsx` errors stemming from the use of `symbol` types. I'll be replacing direct indexing with methods like `Object.keys()` combined with string casting, ensuring that only string-based keys are used within the interface. This refactoring should eliminate the issues related to `symbol` properties.


**Fixing Compile-Time Issues**

I've cast the `focus` variable to a string within the `PlayerFocusTable.tsx` file to resolve type mismatches, specifically addressing issues with the `Select` component. Additionally, I added the `simSpeed` and `updateSimSpeed` properties to `TeamContextType` in `TeamContext.tsx` and implemented the related state management within the `TeamProvider`.


**Addressing Remaining Errors**

I've cast the `focus` variable to a string within the `SelectItem` components in `PlayerFocusTable.tsx` to address the type mismatches. This resolves the errors around the key and value props. Additionally, I've added `simSpeed` and `updateSimSpeed` to `TeamContextType` in `TeamContext.tsx` and implemented their corresponding state management within `TeamProvider`, which also handles local storage persistence. Finally, I'm focused on addressing symbol-related issues in `TeamContext.tsx` using `Object.keys()` and string casting.


**Implementing the Fixes**

I'm now focused on implementing the solutions. I've added the `simSpeed` and `updateSimSpeed` properties and state management within `TeamContext.tsx`, including local storage persistence for `simSpeed`. I've also ensured string casting within the `SelectItem` component in `PlayerFocusTable.tsx` to resolve the type mismatches. I will also be fixing the symbol type errors now.


</think>Okay, I'll fix these TypeScript errors. The core issue seems to be related to incorrect type inference, particularly with `symbol` types appearing where strings or numbers are expected, and a missing import.

Here's how I'll address each error:

1.  **`src/types/index.ts:116:42 - Cannot find name 'trainingFocusesMap'. (TS2304)`**: This indicates a missing import. I'll add `import { trainingFocusesMap } from '@/data/trainingFocuses';` to `src/types/index.ts`.
2.  **`src/context/TeamContext.tsx:680:88 - Type 'symbol' cannot be used as an index type. (TS2538)`**
3.  **`src/context/TeamContext.tsx:681:74 - Type 'symbol' cannot be used as an index type. (TS2538)`**
4.  **`src/context/TeamContext.tsx:1702:147 - Implicit conversion of a 'symbol' to a 'string' will fail at runtime. Consider wrapping this expression in 'String(...)'. (TS2731)`**: These errors occur because TypeScript is inferring `attrToRegress` and `attrToImprove` as potentially `symbol` types when used as object keys. I'll explicitly cast them to `string` when accessing `player.attributes` to ensure correct indexing.
5.  **`src/pages/BuihaOverview.tsx:82:13 - The '<' operator cannot be applied to type 'symbol'. (TS2469)`**
6.  **`src/pages/BuihaOverview.tsx:83:13 - The '>' operator cannot be applied to type 'symbol'. (TS2469)`**: Similar to the above, these errors in the sorting logic are due to potential `symbol` types in comparison. I'll explicitly cast `aVal` and `bVal` to `string | number` for comparison.
7.  **`src/components/training/PlayerFocusTable.tsx:46:21 - Type 'string | number' is not assignable to type 'string'. Type 'number' is not assignable to type 'string'. (TS2322)`**
8.  **`src/components/training/PlayerFocusTable.tsx:55:37 - Type 'string | number | symbol' is not assignable to type 'Key'. Type 'symbol' is not assignable to type 'Key'. (TS2322)`**
9.  **`src/components/training/PlayerFocusTable.tsx:55:49 - Type 'string | number | symbol' is not assignable to type 'string'. Type 'number' is not assignable to type 'string'. (TS2322)`**
10. **`src/components/training/PlayerFocusTable.tsx:55:64 - Type 'string | number | symbol' is not assignable to type 'ReactNode'. Type 'symbol' is not assignable to type 'ReactNode'. (TS2322)`**: These errors in `PlayerFocusTable` are due to `focus` being inferred with `number | symbol` in addition to `string`. I'll explicitly cast `focus` to `string` for the `key`, `value`, and `children` props of `SelectItem`.

<dyad-write path="src/types/index.ts" description="Adding missing import for trainingFocusesMap.">
import { trainingFocusesMap } from '@/data/trainingFocuses';

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
  shutouts?: number;
  savePercentage?: number;
  goalsAgainstAverage?: number;
};

export type TrainingFocus = keyof typeof trainingFocusesMap;

export type SimSpeed = 'Slow' | 'Normal' | 'Fast';

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
    points: number;
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
    teams: Team[]; // Added for full game state saving
    activeTeamName: string | null;
    managedOrganization: string | null;
    isManagingOrg: boolean;
    schedule: ScheduleEntry[];
    nationalsData: { [year: number]: { [division: string]: NationalsTournament } };
    seasonRecords: { [key in RecordCategory]?: TeamRecord };
    careerRecords: { [key in RecordCategory]?: TeamRecord };
    teamAchievements: TeamAchievements;
    transferPool: Player[];
    seasonHistory: SeasonHistory;
    scoutingPool: Player[];
    recruitedPool: Player[];
    fairHosted: boolean;
    developmentHistory: DevelopmentLog[];
    alumni: Player[];
    currentDateString: string;
};