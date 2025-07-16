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
        updateTeam({ ...<dyad-problem-report summary="155 problems">
<problem file="src/pages/Lineup.tsx" line="389" column="10" code="17008">JSX element 'Tabs' has no corresponding closing tag.</problem>
<problem file="src/pages/Lineup.tsx" line="440" column="14" code="17008">JSX element 'TabsContent' has no corresponding closing tag.</problem>
<problem file="src/pages/Lineup.tsx" line="441" column="18" code="17008">JSX element 'Card' has no corresponding closing tag.</problem>
<problem file="src/pages/Lineup.tsx" line="503" column="23" code="1003">Identifier expected.</problem>
<problem file="src/pages/Lineup.tsx" line="504" column="111" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="504" column="354" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="505" column="32" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="505" column="275" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="506" column="25" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="506" column="268" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="510" column="114" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="510" column="224" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="511" column="35" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="511" column="145" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="512" column="19" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="512" column="129" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="539" column="15" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="544" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="571" column="2" code="17008">JSX element 'dyad-write' has no corresponding closing tag.</problem>
<problem file="src/pages/Lineup.tsx" line="578" column="7" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="580" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="583" column="11" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="587" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="590" column="15" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="634" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="637" column="10" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="668" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="671" column="9" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="686" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="691" column="5" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="700" column="17" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="700" column="44" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="707" column="26" code="1005">',' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="707" column="44" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="719" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="722" column="11" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="723" column="7" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="726" column="3" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="728" column="7" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="730" column="3" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="732" column="12" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="734" column="3" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="735" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="738" column="7" code="1005">',' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="739" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="744" column="26" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="745" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="748" column="14" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="752" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="755" column="5" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="763" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="766" column="5" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="782" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="785" column="7" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="789" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="792" column="11" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="795" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="798" column="12" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="807" column="23" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="807" column="89" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="810" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="813" column="7" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="816" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="819" column="5" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="824" column="23" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="824" column="51" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="826" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="829" column="11" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="835" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="838" column="8" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="845" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="848" column="8" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="850" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="853" column="13" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="857" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="862" column="13" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="868" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="872" column="11" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="880" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="883" column="7" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="886" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="889" column="5" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="892" column="32" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="892" column="41" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="893" column="32" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="893" column="41" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="895" column="23" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="895" column="51" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="898" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="901" column="11" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="909" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="913" column="11" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="922" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="925" column="10" code="1005">',' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="926" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="926" column="3" code="1005">'&lt;/' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="503" column="23" code="2339">Property 'dyad-problem-report' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="504" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="504" column="99" code="2304">Cannot find name 'jerseyNumber'.</problem>
<problem file="src/pages/Lineup.tsx" line="505" column="20" code="2304">Cannot find name 'jerseyNumber'.</problem>
<problem file="src/pages/Lineup.tsx" line="506" column="13" code="2304">Cannot find name 'jerseyNumber'.</problem>
<problem file="src/pages/Lineup.tsx" line="508" column="133" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="509" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="509" column="149" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="510" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="514" column="125" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="515" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="515" column="148" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="516" column="1" code="2339">Property 'dyad-problem-report' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="516" column="23" code="2339">Property 'think' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="544" column="2" code="2339">Property 'think' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="544" column="10" code="2339">Property 'dyad-codebase-context' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="544" column="103" code="2339">Property 'dyad-codebase-context' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="544" column="127" code="2339">Property 'think' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="564" column="1" code="2339">Property 'think' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="571" column="1" code="2339">Property 'dyad-write' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="578" column="3" code="2304">Cannot find name 'type'.</problem>
<problem file="src/pages/Lineup.tsx" line="583" column="3" code="2304">Cannot find name 'position'.</problem>
<problem file="src/pages/Lineup.tsx" line="590" column="3" code="2304">Cannot find name 'acceleration'.</problem>
<problem file="src/pages/Lineup.tsx" line="637" column="3" code="2304">Cannot find name 'blocker'.</problem>
<problem file="src/pages/Lineup.tsx" line="671" column="3" code="2304">Cannot find name 'season'.</problem>
<problem file="src/pages/Lineup.tsx" line="691" column="3" code="2304">Cannot find name 'id'.</problem>
<problem file="src/pages/Lineup.tsx" line="700" column="13" code="2304">Cannot find name 'type'.</problem>
<problem file="src/pages/Lineup.tsx" line="707" column="23" code="2304">Cannot find name 'key'.</problem>
<problem file="src/pages/Lineup.tsx" line="722" column="3" code="2304">Cannot find name 'forwards'.</problem>
<problem file="src/pages/Lineup.tsx" line="723" column="5" code="2304">Cannot find name 'lw'.</problem>
<problem file="src/pages/Lineup.tsx" line="728" column="5" code="2304">Cannot find name 'ld'.</problem>
<problem file="src/pages/Lineup.tsx" line="732" column="5" code="2304">Cannot find name 'starter'.</problem>
<problem file="src/pages/Lineup.tsx" line="738" column="4" code="2304">Cannot find name 'key'.</problem>
<problem file="src/pages/Lineup.tsx" line="744" column="4" code="2304">Cannot find name 'key'.</problem>
<problem file="src/pages/Lineup.tsx" line="744" column="11" code="2304">Cannot find name 'BudgetCategory'.</problem>
<problem file="src/pages/Lineup.tsx" line="748" column="3" code="2304">Cannot find name 'totalBudget'.</problem>
<problem file="src/pages/Lineup.tsx" line="755" column="3" code="2304">Cannot find name 'id'.</problem>
<problem file="src/pages/Lineup.tsx" line="766" column="3" code="2304">Cannot find name 'id'.</problem>
<problem file="src/pages/Lineup.tsx" line="785" column="3" code="2304">Cannot find name 'time'.</problem>
<problem file="src/pages/Lineup.tsx" line="792" column="3" code="2304">Cannot find name 'isActive'.</problem>
<problem file="src/pages/Lineup.tsx" line="798" column="3" code="2304">Cannot find name 'userScore'.</problem>
<problem file="src/pages/Lineup.tsx" line="807" column="15" code="2304">Cannot find name 'teamName'.</problem>
<problem file="src/pages/Lineup.tsx" line="813" column="3" code="2304">Cannot find name 'year'.</problem>
<problem file="src/pages/Lineup.tsx" line="819" column="3" code="2304">Cannot find name 'id'.</problem>
<problem file="src/pages/Lineup.tsx" line="824" column="14" code="2304">Cannot find name 'homeScore'.</problem>
<problem file="src/pages/Lineup.tsx" line="829" column="3" code="2304">Cannot find name 'playerId'.</problem>
<problem file="src/pages/Lineup.tsx" line="838" column="3" code="2304">Cannot find name 'phase'.</problem>
<problem file="src/pages/Lineup.tsx" line="848" column="3" code="2304">Cannot find name 'score'.</problem>
<problem file="src/pages/Lineup.tsx" line="853" column="3" code="2304">Cannot find name 'playerName'.</problem>
<problem file="src/pages/Lineup.tsx" line="862" column="3" code="2304">Cannot find name 'playerName'.</problem>
<problem file="src/pages/Lineup.tsx" line="872" column="3" code="2304">Cannot find name 'teamName'.</problem>
<problem file="src/pages/Lineup.tsx" line="889" column="3" code="2304">Cannot find name 'id'.</problem>
<problem file="src/pages/Lineup.tsx" line="892" column="24" code="2304">Cannot find name 'winnerOf'.</problem>
<problem file="src/pages/Lineup.tsx" line="893" column="24" code="2304">Cannot find name 'winnerOf'.</problem>
<problem file="src/pages/Lineup.tsx" line="895" column="14" code="2304">Cannot find name 'homeScore'.</problem>
<problem file="src/pages/Lineup.tsx" line="901" column="3" code="2304">Cannot find name 'division'.</problem>
<problem file="src/pages/Lineup.tsx" line="913" column="3" code="2304">Cannot find name 'teamName'.</problem>
<problem file="src/pages/Lineup.tsx" line="925" column="4" code="2304">Cannot find name 'season'.</problem>
<problem file="src/App.tsx" line="15" column="8" code="1192">Module '&quot;/Users/drew/dyad-apps/mystical-penguin-jump/src/pages/Lineup&quot;' has no default export.</problem>
</dyad-problem-report><think>Deciding which files are relevant...

**Analyzing Compilation Failures**

I've zeroed in on the source of the trouble: a swarm of TypeScript errors, mainly in `src/pages/Lineup.tsx`. The compiler's flagging missing closures and syntax glitches. I'm also seeing some issues connected to `dyad-write` and `dyad-problem-`. I'm digging deeper into those files now, hoping to get this resolved promptly.


**Debugging JSX Structure**

I'm focusing on `src/pages/Lineup.tsx` as the source of many problems. I need to remove those bogus `dyad` tags that are causing so many compilation failures. Also, I am investigating the missing closing tags, misbalanced curly braces, and undeclared variables. It's a tangled mess, but I'm slowly untangling the JSX, trying to clean up the code and ensure correct syntax.


**Tackling Compile-Time Errors**

I'm now methodically addressing the reported 155 errors. Removing the rogue `dyad` tags from `Lineup.tsx` is underway, along with fixing mismatched tags and brace issues. I'm also correcting references to undeclared variables, making sure everything aligns correctly. Next, I will verify the import of `useTeam` and check the `TeamContext.tsx` for the expected exports. The focus remains on syntax corrections to stabilize the build.


**Refining Lineup.tsx Cleanup**

I've moved forward with the `Lineup.tsx` file. I've carefully excised all the problematic tags, including the AI-generated ones that were triggering compilation failures. The JSX structure is being fixed, and I'm carefully closing elements that are missing their closing tags. Also, the "Cannot find name" errors are addressed as the scope is restored with correct code. The `handleLineupChange` function's completion is next.


**Formulating Error Correction Plan**

I've developed a detailed plan: First, I'll clean up the corrupted `Lineup.tsx`, removing the rogue tags and ensuring correct JSX structure and variable scope, especially within the `handleLineupChange` function. Next, I'll tackle the `useTeam` import/export issues, verifying the context file and correcting import paths. Then, I will look into the errors in `Recruitment.tsx`. The end of `TeamContext.tsx` will also be checked for a missing brace.


{
  "complexity": "high",
  "relevantFiles": [
    "src/pages/Lineup.tsx",
    "src/context/TeamContext.tsx",
    "src/types/index.ts",
    "src/pages/Recruitment.tsx",
    "src/App.tsx",
    "src/components/Sidebar.tsx",
    "src/components/Layout.tsx",
    "src/pages/Dashboard.tsx",
    "src/pages/Standings.tsx",
    "src/components/roster/PlayerMovement.tsx",
    "src/components/roster/JerseyManagement.tsx",
    "src/pages/Roster.tsx",
    "src/components/recruitment/ScoutingTable.tsx",
    "src/components/recruitment/RecruitsTable.tsx",
    "src/components/finance/BudgetAllocation.tsx",
    "src/pages/Finances.tsx",
    "src/components/facilities/FacilityProjectCard.tsx",
    "src/pages/Facilities.tsx",
    "src/pages/PlayerProfile.tsx",
    "src/pages/BuihaOverview.tsx",
    "src/pages/Game.tsx",
    "src/pages/PlayGame.tsx",
    "src/pages/Morale.tsx",
    "src/pages/SeasonOverview.tsx",
    "src/pages/Calendar.tsx",
    "src/pages/Training.tsx",
    "src/pages/TeamSelection.tsx",
    "src/pages/TeamHistory.tsx",
    "src/pages/Nationals.tsx",
    "src/pages/Alumni.tsx",
    "src/pages/NationalsGame.tsx"
  ]
}</think><dyad-codebase-context files="src/pages/Lineup.tsx,src/context/TeamContext.tsx,src/types/index.ts,src/pages/Recruitment.tsx,src/App.tsx,src/components/Sidebar.tsx,src/components/Layout.tsx,src/pages/Dashboard.tsx,src/pages/Standings.tsx,src/components/roster/PlayerMovement.tsx,src/components/roster/JerseyManagement.tsx,src/pages/Roster.tsx,src/components/recruitment/ScoutingTable.tsx,src/components/recruitment/RecruitsTable.tsx,src/components/finance/BudgetAllocation.tsx,src/pages/Finances.tsx,src/components/facilities/FacilityProjectCard.tsx,src/pages/Facilities.tsx,src/pages/PlayerProfile.tsx,src/pages/BuihaOverview.tsx,src/pages/Game.tsx,src/pages/PlayGame.tsx,src/pages/Morale.tsx,src/pages/SeasonOverview.tsx,src/pages/Calendar.tsx,src/pages/Training.tsx,src/pages/TeamSelection.tsx,src/pages/TeamHistory.tsx,src/pages/Nationals.tsx,src/pages/Alumni.tsx,src/pages/NationalsGame.tsx">Complexity: high</dyad-codebase-context><think>**Deconstructing Errors' Causes**

I'm beginning the analysis by focusing on the `TeamContext.tsx` file, as it seems to be a central source of several errors. My strategy involves identifying the root causes first to address the cascading issues. I'm looking for patterns and commonalities across the errors to quickly narrow down the scope.


**Isolating the Primary Issues**

I'm now focusing on pinpointing the root causes. The `TeamContext.tsx` file is critical, with syntax errors and type mismatches being the main culprits. The `useTeam` hook's missing export is a simple fix. I suspect these errors are contributing to issues in `Lineup.tsx` and the missing `buildTimeWeeks` on `FacilityProject`.


**Evaluating File Corruption**

I've confirmed the suspicion of file corruption in `src/pages/Lineup.tsx`. The errors are far too numerous and inconsistent to be the result of standard coding issues. I'm prioritizing restoring this file. I'll need to replace its contents with the version provided in the prompt to resolve this. This should resolve many of the errors. Then I can address `TeamContext.tsx` and the missing exports.


**Categorizing Error Types**

I'm now classifying the errors to prioritize my fixes. There are clearly four major groups: syntax errors in `TeamContext.tsx`, missing export for `useTeam`, severe corruption in `Lineup.tsx`, and type mismatches across various files. My immediate goal is to address the most critical issues, specifically the file corruption, which is likely cascading. I need to replace the `Lineup.tsx` content first, as a single fix there should resolve dozens of errors.


**Devising a Repair Sequence**

I'm formulating a plan to methodically resolve the 155 errors. The strategy involves tackling `TeamContext.tsx` errors first, then `Lineup.tsx` reconstruction based on the provided content. Missing `useTeam` export is an easy fix. Type mismatches across files, particularly those involving `unknown` types, will follow. I will also address the file corruption of `Lineup.tsx` by replacing the contents with the previous correct file.


**Implementing Corrections and Refinement**

I'm currently correcting the file corruption in `Lineup.tsx` by replacing its contents with the correct version. I will also add the `export default Lineup` to ensure correct module exports. After this, I'll address the syntax errors in `TeamContext.tsx`, specifically the closing brace, and the missing `export` for the hook. Finally, I'll address the type mismatches, including updating `FacilityProject` to include `buildTimeWeeks`.


**Formulating Corrections**

I'm currently focused on implementing the necessary fixes. I'll start by exporting `useTeam` and closing the `TeamContext.tsx` component. Then, I'll apply the fixes within `assignPlayerToRoster` and `startFacilityProject`, while checking the `useState` initializers in the context file. Next, I'll update `FacilityProject` to include `buildTimeWeeks` in `src/types/index.ts`. Finally, I'll fix the corrupted `Lineup.tsx` file using the most recent user provided content.


**Implementing Necessary Fixes**

I'm now focused on implementing the solutions. I will add the `export` to the `useTeam` hook and close `TeamContext.tsx`, then address the `useState` initializer, which I've confirmed is correct. I'll also correct the function bodies. Additionally, I'll add `buildTimeWeeks` to `FacilityProject` and reconstruct and export `Lineup.tsx` using the correct user-provided code, and then fix the related export issues.


**Revising and Refactoring**

I'm actively refining the implementation plan to ensure a smooth execution, especially for the crucial `Lineup.tsx` file. I will replace this entire file's contents and ensure it has all the closing tags. I'm also confirming the correct order of operations and export statements to resolve dependencies and ensure the code runs correctly. I've added and corrected all of the fixes and I will submit the file for validation.


**Analyzing the Implementation Plan**

I'm now prioritizing the implementation and the required fixes, and I will address them in the most efficient order to eliminate the errors, starting with fixing the root problems first. I will replace `Lineup.tsx` entirely. I will also apply the fixes for `TeamContext.tsx`, then address any remaining issues. I am focused on the most efficient order to address these issues.


**Analyzing the Current Errors**

I've now analyzed the errors again in detail, and they are far-ranging. I'm currently focusing on rectifying `Lineup.tsx` as a priority, along with `TeamContext.tsx`, to tackle the most significant and pervasive issues. This should eliminate a large number of errors, as well as the fundamental root cause of the problems. Then I'll work on other minor errors.


**Addressing the Core Issues**

I'm now focusing on the crucial repairs. I will replace the file contents for `Lineup.tsx`, finish the `TeamContext.tsx` file and add the missing export. Then I'll address the `FacilityProject` type issue, and fix the remaining type errors in `Recruitment.tsx` by correctly casting the `q` to type string in the map function. Finally, I will fix the file corruption of `Lineup.tsx` by replacing the contents with the previous correct file.


**Addressing Compilation Issues**

I'm starting the implementation by focusing on critical fixes. First, I'll export `useTeam` and resolve the syntax errors within `TeamContext.tsx`, including the brace issue. Next, I'll fix the `Lineup.tsx` file corruption with a complete rewrite. Then I'll add the `buildTimeWeeks` to `FacilityProject` type, and lastly fix the export issues. This should eliminate the root causes, allowing the code to compile successfully.


**Addressing the Remaining Errors**

I've now completed the necessary adjustments. I've added the export, fixed `TeamContext.tsx`'s syntax errors, and reconstructed `Lineup.tsx` with the proper tags, including the missing closing tags. I've incorporated the type changes into `FacilityProject` and corrected type issues within `Recruitment.tsx`. I will submit these files to address the errors.


</think>This is quite a cascade of errors! It seems like the main issues stem from a few files with syntax errors and missing exports, which then causes a chain reaction of problems across the application.

I'll fix this by:

1.  **Correcting `src/types/index.ts`**: Adding a missing optional property to a type definition.
2.  **Fixing `src/context/TeamContext.tsx`**: This file was incomplete. I'll complete the component, fix some type inconsistencies, and most importantly, export the `useTeam` hook, which will resolve the majority of the "module has no exported member" errors.
3.  **Rebuilding `src/pages/Lineup.tsx`**: This file appears to have been corrupted. I will replace it with a corrected version, ensuring all JSX tags are properly closed and adding the missing default export.
4.  **Fixing `src/pages/Recruitment.tsx`**: Correcting a minor type issue when filtering scouting results.
5.  **Updating `src/App.tsx`**: Ensuring the import for the `Lineup` page is correct.

Here are the corrected files:

<dyad-write path="src/types/index.ts" description="Adding the missing `buildTimeWeeks` property to the `FacilityProject` type.">
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
  buildTimeWeeks?: number;
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