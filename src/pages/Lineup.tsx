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
            <Select value={player.role || ''} onValueChange={(value) => onRoleChange(value as string)}>
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
    const { userTeam, updateTeam } = useTeam();

    if (!userTeam) {
        return <div>Loading...</div>;
    }

    const playerMap = useMemo(() => new Map(userTeam.roster.map(p => [p.id, p])), [userTeam.roster]);

    const assignedPlayerIds = useMemo(() => {
        const ids = new Set<string>();
        Object.values(userTeam.lineup.forwards).flat().forEach(id => id && ids.add(id));
        Object.values(userTeam.lineup.defence).flat().forEach(id => id && ids.add(id));
        if (userTeam.lineup.goalies.starter) ids.add(userTeam.lineup.goalies.starter);
        if (userTeam.lineup.goalies.backup) ids.add(userTeam.lineup.goalies.backup);
        return ids;
    }, [userTeam.lineup]);

    const staffInLineupCount = useMemo(() => {
        const lineupPlayerIds = [
            ...Object.values(userTeam.lineup.forwards).flat(),
            ...Object.values(userTeam.lineup.defence).flat(),
            userTeam.lineup.goalies.starter,
            userTeam.lineup.goalies.backup,
        ].filter((id): id is string => id !== null);

        return lineupPlayerIds.reduce((count, id) => {
            const player = playerMap.get(id);
            if (player && player.eligibility === 'Staff') {
                return count + 1;
            }
            return count;
        }, 0);
    },<dyad-problem-report summary="401 problems">
<problem file="src/pages/Lineup.tsx" line="220" column="17" code="2657">JSX expressions must have one parent element.</problem>
<problem file="src/pages/Lineup.tsx" line="243" column="15" code="1005">'}' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="247" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/pages/Lineup.tsx" line="282" column="9" code="1005">';' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="282" column="104" code="1005">';' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="282" column="107" code="1434">Unexpected keyword or identifier.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="47" code="1005">';' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="63" code="1109">Expression expected.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="69" code="1443">Module declaration names may only use ' or &quot; quoted strings.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="106" code="1005">'{' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="143" code="1005">';' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="163" code="1005">'(' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="167" code="1434">Unexpected keyword or identifier.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="203" code="1005">';' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="411" code="1002">Unterminated string literal.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="17" code="1005">';' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="65" code="1109">Expression expected.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="71" code="1443">Module declaration names may only use ' or &quot; quoted strings.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="91" code="1443">Module declaration names may only use ' or &quot; quoted strings.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="107" code="1434">Unexpected keyword or identifier.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="114" code="1434">Unexpected keyword or identifier.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="122" code="1434">Unexpected keyword or identifier.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="129" code="1434">Unexpected keyword or identifier.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="148" code="1003">Identifier expected.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="168" code="1005">';' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="181" code="1005">'(' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="190" code="1005">')' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="201" code="1005">';' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="271" code="1002">Unterminated string literal.</problem>
<problem file="src/pages/Lineup.tsx" line="287" column="1" code="1434">Unexpected keyword or identifier.</problem>
<problem file="src/pages/Lineup.tsx" line="287" column="55" code="1002">Unterminated string literal.</problem>
<problem file="src/pages/Lineup.tsx" line="289" column="13" code="1005">';' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="289" column="48" code="1005">';' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="683" column="35" code="1005">';' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="683" column="40" code="1434">Unexpected keyword or identifier.</problem>
<problem file="src/pages/Lineup.tsx" line="683" column="47" code="1228">A type predicate is only allowed in return type position for functions and methods.</problem>
<problem file="src/pages/Lineup.tsx" line="683" column="59" code="1434">Unexpected keyword or identifier.</problem>
<problem file="src/pages/Lineup.tsx" line="737" column="33" code="1005">';' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="737" column="54" code="1005">';' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="72" code="1005">';' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="76" code="1434">Unexpected keyword or identifier.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="87" code="1228">A type predicate is only allowed in return type position for functions and methods.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="90" code="1434">Unexpected keyword or identifier.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="103" code="1005">'(' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="104" code="1005">';' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="113" code="1005">',' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="120" code="1005">';' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="123" code="1005">')' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="139" code="1128">Declaration or statement expected.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="141" code="1434">Unexpected keyword or identifier.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="199" code="1002">Unterminated string literal.</problem>
<problem file="src/pages/Lineup.tsx" line="791" column="17" code="1005">',' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="812" column="14" code="1005">',' expected.</problem>
<problem file="src/pages/Lineup.tsx" line="2004" column="1" code="1128">Declaration or statement expected.</problem>
<problem file="src/context/TeamContext.tsx" line="1529" column="27" code="2554">Expected 4-6 arguments, but got 1.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="176" code="1101">'with' statements are not allowed in strict mode.</problem>
<problem file="src/pages/Lineup.tsx" line="12" column="10" code="2395">Individual declarations in merged declaration 'useTeam' must be all exported or all local.</problem>
<problem file="src/pages/Lineup.tsx" line="12" column="10" code="2440">Import declaration conflicts with local declaration of 'useTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="83" column="80" code="2345">Argument of type 'unknown' is not assignable to parameter of type 'string'.</problem>
<problem file="src/pages/Lineup.tsx" line="84" column="79" code="2345">Argument of type 'unknown' is not assignable to parameter of type 'string'.</problem>
<problem file="src/pages/Lineup.tsx" line="100" column="34" code="2339">Property 'eligibility' does not exist on type 'unknown'.</problem>
<problem file="src/pages/Lineup.tsx" line="220" column="17" code="2339">Property 'dyad-problem-report' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="221" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="221" column="115" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="222" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="223" column="64" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="224" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="224" column="174" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="225" column="1" code="2339">Property 'dyad-problem-report' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="225" column="23" code="2339">Property 'think' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="247" column="2" code="2339">Property 'think' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="247" column="10" code="2339">Property 'dyad-codebase-context' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="247" column="84" code="2339">Property 'dyad-codebase-context' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="247" column="108" code="2339">Property 'think' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="282" column="1" code="2339">Property 'think' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/pages/Lineup.tsx" line="282" column="9" code="2304">Cannot find name 'You'.</problem>
<problem file="src/pages/Lineup.tsx" line="282" column="104" code="2304">Cannot find name 've'.</problem>
<problem file="src/pages/Lineup.tsx" line="282" column="107" code="2304">Cannot find name 'addressed'.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="7" code="2304">Cannot find name 'Missing'.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="47" code="2304">Cannot find name 'implementation'.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="65" code="2304">Cannot find name 'The'.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="106" code="2695">Left side of comma operator is unused and has no side effects.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="139" code="2304">Cannot find name 'but'.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="143" code="2304">Cannot find name 'the'.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="163" code="2304">Cannot find name 'was'.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="167" code="2304">Cannot find name 'not'.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="171" code="2304">Cannot find name 'defined'.</problem>
<problem file="src/pages/Lineup.tsx" line="284" column="182" code="2304">Cannot find name 'the'.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="7" code="2304">Cannot find name 'Incorrect'.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="17" code="2304">Cannot find name 'property'.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="26" code="2304">Cannot find name 'access'.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="36" code="2362">The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="36" code="2322">Type 'number' is not assignable to type 'object'.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="67" code="2304">Cannot find name 'The'.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="87" code="2304">Cannot find name 'and'.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="107" code="2304">Cannot find name 'arrays'.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="114" code="2304">Cannot find name 'contain'.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="122" code="2693">'string' only refers to a type, but is being used as a value here.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="129" code="2304">Cannot find name 'literal'.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="137" code="2304">Cannot find name 'types'.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="144" code="2304">Cannot find name 'e'.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="164" code="2304">Cannot find name 'not'.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="168" code="2304">Cannot find name 'objects'.</problem>
<problem file="src/pages/Lineup.tsx" line="285" column="181" code="2304">Cannot find name 'a'.</problem>
<problem file="src/pages/Lineup.tsx" line="287" column="1" code="2304">Cannot find name 'Here'.</problem>
<problem file="src/pages/Lineup.tsx" line="287" column="5" code="2365">Operator '&lt;' cannot be applied to types 'string' and 'number'.</problem>
<problem file="src/pages/Lineup.tsx" line="289" column="2" code="2304">Cannot find name 'dyad'.</problem>
<problem file="src/pages/Lineup.tsx" line="289" column="7" code="2304">Cannot find name 'write'.</problem>
<problem file="src/pages/Lineup.tsx" line="289" column="13" code="2304">Cannot find name 'path'.</problem>
<problem file="src/pages/Lineup.tsx" line="289" column="48" code="2304">Cannot find name 'description'.</problem>
<problem file="src/pages/Lineup.tsx" line="290" column="1" code="2349">This expression is not callable.
  Type 'String' has no call signatures.</problem>
<problem file="src/pages/Lineup.tsx" line="683" column="35" code="2304">Cannot find name 'Your'.</problem>
<problem file="src/pages/Lineup.tsx" line="683" column="40" code="2304">Cannot find name 'lineup'.</problem>
<problem file="src/pages/Lineup.tsx" line="683" column="47" code="2304">Cannot find name 'is'.</problem>
<problem file="src/pages/Lineup.tsx" line="683" column="59" code="2581">Cannot find name '$'. Do you need to install type definitions for jQuery? Try `npm i --save-dev @types/jquery`.</problem>
<problem file="src/pages/Lineup.tsx" line="683" column="61" code="2304">Cannot find name 'validationError'.</problem>
<problem file="src/pages/Lineup.tsx" line="737" column="33" code="2581">Cannot find name '$'. Do you need to install type definitions for jQuery? Try `npm i --save-dev @types/jquery`.</problem>
<problem file="src/pages/Lineup.tsx" line="737" column="35" code="2304">Cannot find name 'currentDate'.</problem>
<problem file="src/pages/Lineup.tsx" line="737" column="53" code="2581">Cannot find name '$'. Do you need to install type definitions for jQuery? Try `npm i --save-dev @types/jquery`.</problem>
<problem file="src/pages/Lineup.tsx" line="737" column="55" code="2304">Cannot find name 'currentDate'.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="72" code="2304">Cannot find name 'The'.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="76" code="2304">Cannot find name 'atmosphere'.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="87" code="2304">Cannot find name 'is'.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="90" code="2304">Cannot find name 'electric'.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="103" code="2581">Cannot find name '$'. Do you need to install type definitions for jQuery? Try `npm i --save-dev @types/jquery`.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="104" code="2872">This kind of expression is always truthy.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="105" code="18004">No value exists in scope for the shorthand property 'homeTeam'. Either declare one or provide an initializer.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="120" code="2304">Cannot find name 'vs'.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="123" code="2581">Cannot find name '$'. Do you need to install type definitions for jQuery? Try `npm i --save-dev @types/jquery`.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="125" code="2304">Cannot find name 'awayTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="788" column="141" code="2304">Cannot find name 'Players'.</problem>
<problem file="src/pages/Lineup.tsx" line="791" column="40" code="2304">Cannot find name 'simulateFullGame'.</problem>
<problem file="src/pages/Lineup.tsx" line="791" column="57" code="2304">Cannot find name 'homeTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="791" column="67" code="2304">Cannot find name 'awayTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="791" column="77" code="2304">Cannot find name 'isBigGame'.</problem>
<problem file="src/pages/Lineup.tsx" line="793" column="21" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="795" column="49" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="796" column="51" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="804" column="100" code="2304">Cannot find name 'processGameResultsEngine'.</problem>
<problem file="src/pages/Lineup.tsx" line="804" column="125" code="2304">Cannot find name 'homeTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="804" column="135" code="2304">Cannot find name 'awayTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="805" column="17" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="805" column="27" code="2304">Cannot find name 'homeTeamIndex'.</problem>
<problem file="src/pages/Lineup.tsx" line="806" column="17" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="806" column="27" code="2304">Cannot find name 'awayTeamIndex'.</problem>
<problem file="src/pages/Lineup.tsx" line="807" column="17" code="2304">Cannot find name 'updateGameRecords'.</problem>
<problem file="src/pages/Lineup.tsx" line="809" column="21" code="2304">Cannot find name 'game'.</problem>
<problem file="src/pages/Lineup.tsx" line="809" column="39" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="809" column="57" code="2304">Cannot find name 'game'.</problem>
<problem file="src/pages/Lineup.tsx" line="809" column="75" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="810" column="73" code="2304">Cannot find name 'homeTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="810" column="120" code="2304">Cannot find name 'awayTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="815" column="9" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="815" column="21" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="818" column="53" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="818" column="71" code="2304">Cannot find name 'managedTeamNames'.</problem>
<problem file="src/pages/Lineup.tsx" line="830" column="52" code="2304">Cannot find name 'SkaterAttributes'.</problem>
<problem file="src/pages/Lineup.tsx" line="830" column="77" code="2304">Cannot find name 'GoalieAttributes'.</problem>
<problem file="src/pages/Lineup.tsx" line="834" column="47" code="2304">Cannot find name 'getRandomItem'.</problem>
<problem file="src/pages/Lineup.tsx" line="842" column="33" code="2304">Cannot find name 'newDevelopmentLogs'.</problem>
<problem file="src/pages/Lineup.tsx" line="842" column="194" code="2304">Cannot find name 'currentDate'.</problem>
<problem file="src/pages/Lineup.tsx" line="848" column="43" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="856" column="63" code="2304">Cannot find name 'SkaterAttributes'.</problem>
<problem file="src/pages/Lineup.tsx" line="856" column="82" code="2304">Cannot find name 'GoalieAttributes'.</problem>
<problem file="src/pages/Lineup.tsx" line="857" column="71" code="2304">Cannot find name 'SkaterAttributes'.</problem>
<problem file="src/pages/Lineup.tsx" line="857" column="90" code="2304">Cannot find name 'GoalieAttributes'.</problem>
<problem file="src/pages/Lineup.tsx" line="858" column="69" code="2304">Cannot find name 'SkaterAttributes'.</problem>
<problem file="src/pages/Lineup.tsx" line="858" column="88" code="2304">Cannot find name 'GoalieAttributes'.</problem>
<problem file="src/pages/Lineup.tsx" line="859" column="68" code="2304">Cannot find name 'SkaterAttributes'.</problem>
<problem file="src/pages/Lineup.tsx" line="859" column="87" code="2304">Cannot find name 'GoalieAttributes'.</problem>
<problem file="src/pages/Lineup.tsx" line="866" column="61" code="2304">Cannot find name 'SkaterAttributes'.</problem>
<problem file="src/pages/Lineup.tsx" line="866" column="86" code="2304">Cannot find name 'GoalieAttributes'.</problem>
<problem file="src/pages/Lineup.tsx" line="867" column="69" code="2304">Cannot find name 'trainingFocusesMap'.</problem>
<problem file="src/pages/Lineup.tsx" line="868" column="55" code="2304">Cannot find name 'trainingFocusesMap'.</problem>
<problem file="src/pages/Lineup.tsx" line="871" column="83" code="2304">Cannot find name 'getRandomItem'.</problem>
<problem file="src/pages/Lineup.tsx" line="874" column="55" code="2304">Cannot find name 'getRandomItem'.</problem>
<problem file="src/pages/Lineup.tsx" line="884" column="60" code="2304">Cannot find name 'newDevelopmentLogs'.</problem>
<problem file="src/pages/Lineup.tsx" line="884" column="221" code="2304">Cannot find name 'currentDate'.</problem>
<problem file="src/pages/Lineup.tsx" line="895" column="56" code="2304">Cannot find name 'SkaterAttributes'.</problem>
<problem file="src/pages/Lineup.tsx" line="895" column="81" code="2304">Cannot find name 'GoalieAttributes'.</problem>
<problem file="src/pages/Lineup.tsx" line="898" column="51" code="2304">Cannot find name 'getRandomItem'.</problem>
<problem file="src/pages/Lineup.tsx" line="905" column="56" code="2304">Cannot find name 'newDevelopmentLogs'.</problem>
<problem file="src/pages/Lineup.tsx" line="905" column="214" code="2304">Cannot find name 'currentDate'.</problem>
<problem file="src/pages/Lineup.tsx" line="912" column="47" code="2304">Cannot find name 'calculateCurrentAbility'.</problem>
<problem file="src/pages/Lineup.tsx" line="913" column="43" code="2304">Cannot find name 'calculateStarRating'.</problem>
<problem file="src/pages/Lineup.tsx" line="926" column="43" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="928" column="77" code="2304">Cannot find name 'updateMorale'.</problem>
<problem file="src/pages/Lineup.tsx" line="929" column="47" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="945" column="73" code="2304">Cannot find name 'updateMorale'.</problem>
<problem file="src/pages/Lineup.tsx" line="952" column="71" code="2304">Cannot find name 'getRandomItem'.</problem>
<problem file="src/pages/Lineup.tsx" line="953" column="73" code="2304">Cannot find name 'updateMorale'.</problem>
<problem file="src/pages/Lineup.tsx" line="964" column="32" code="2304">Cannot find name 'months'.</problem>
<problem file="src/pages/Lineup.tsx" line="971" column="57" code="2304">Cannot find name 'months'.</problem>
<problem file="src/pages/Lineup.tsx" line="972" column="41" code="2304">Cannot find name 'months'.</problem>
<problem file="src/pages/Lineup.tsx" line="978" column="45" code="2304">Cannot find name 'TeamSeasonHistory'.</problem>
<problem file="src/pages/Lineup.tsx" line="978" column="67" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="989" column="21" code="2304">Cannot find name 'setSeasonHistory'.</problem>
<problem file="src/pages/Lineup.tsx" line="991" column="21" code="2304">Cannot find name 'tempSeasonRecords'.</problem>
<problem file="src/pages/Lineup.tsx" line="996" column="21" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="996" column="33" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1031" column="47" code="2304">Cannot find name 'managedTeamNames'.</problem>
<problem file="src/pages/Lineup.tsx" line="1056" column="68" code="2304">Cannot find name 'getRandomValueInRange'.</problem>
<problem file="src/pages/Lineup.tsx" line="1057" column="73" code="2304">Cannot find name 'getRandomValueInRange'.</problem>
<problem file="src/pages/Lineup.tsx" line="1058" column="77" code="2304">Cannot find name 'getRandomValueInRange'.</problem>
<problem file="src/pages/Lineup.tsx" line="1059" column="76" code="2304">Cannot find name 'getRandomValueInRange'.</problem>
<problem file="src/pages/Lineup.tsx" line="1060" column="45" code="2304">Cannot find name 'getRandomValueInRange'.</problem>
<problem file="src/pages/Lineup.tsx" line="1112" column="41" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1112" column="64" code="2304">Cannot find name 'managedTeamNames'.</problem>
<problem file="src/pages/Lineup.tsx" line="1119" column="59" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1121" column="58" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1128" column="57" code="2304">Cannot find name 'calculateStarRating'.</problem>
<problem file="src/pages/Lineup.tsx" line="1130" column="37" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1137" column="29" code="2304">Cannot find name 'setRecruitedPool'.</problem>
<problem file="src/pages/Lineup.tsx" line="1143" column="25" code="2304">Cannot find name 'setAlumni'.</problem>
<problem file="src/pages/Lineup.tsx" line="1145" column="21" code="2304">Cannot find name 'setTransferPool'.</problem>
<problem file="src/pages/Lineup.tsx" line="1146" column="21" code="2304">Cannot find name 'setScoutingPool'.</problem>
<problem file="src/pages/Lineup.tsx" line="1147" column="21" code="2304">Cannot find name 'setRecruitedPool'.</problem>
<problem file="src/pages/Lineup.tsx" line="1148" column="21" code="2304">Cannot find name 'setFairHosted'.</problem>
<problem file="src/pages/Lineup.tsx" line="1151" column="37" code="2304">Cannot find name 'getTeamOrganizations'.</problem>
<problem file="src/pages/Lineup.tsx" line="1152" column="71" code="2304">Cannot find name 'managedOrganization'.</problem>
<problem file="src/pages/Lineup.tsx" line="1153" column="42" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1158" column="42" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1168" column="47" code="2304">Cannot find name 'generateRecruits'.</problem>
<problem file="src/pages/Lineup.tsx" line="1174" column="57" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1177" column="54" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1186" column="58" code="2304">Cannot find name 'calculateStarRating'.</problem>
<problem file="src/pages/Lineup.tsx" line="1190" column="33" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1199" column="21" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1199" column="33" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1210" column="25" code="2304">Cannot find name 'months'.</problem>
<problem file="src/pages/Lineup.tsx" line="1213" column="12" code="2304">Cannot find name 'currentDate'.</problem>
<problem file="src/pages/Lineup.tsx" line="1215" column="13" code="2304">Cannot find name 'newDevelopmentLogs'.</problem>
<problem file="src/pages/Lineup.tsx" line="1215" column="44" code="2304">Cannot find name 'setDevelopmentHistory'.</problem>
<problem file="src/pages/Lineup.tsx" line="1215" column="78" code="2304">Cannot find name 'newDevelopmentLogs'.</problem>
<problem file="src/pages/Lineup.tsx" line="1216" column="67" code="2304">Cannot find name 'currentDate'.</problem>
<problem file="src/pages/Lineup.tsx" line="1216" column="101" code="2304">Cannot find name 'currentDate'.</problem>
<problem file="src/pages/Lineup.tsx" line="1217" column="13" code="2304">Cannot find name 'tempSchedule'.</problem>
<problem file="src/pages/Lineup.tsx" line="1217" column="28" code="2304">Cannot find name 'generateSeasonSchedule'.</problem>
<problem file="src/pages/Lineup.tsx" line="1217" column="51" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1221" column="64" code="2304">Cannot find name 'currentDate'.</problem>
<problem file="src/pages/Lineup.tsx" line="1221" column="95" code="2304">Cannot find name 'currentDate'.</problem>
<problem file="src/pages/Lineup.tsx" line="1223" column="55" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1224" column="66" code="2304">Cannot find name 'NationalsTournament'.</problem>
<problem file="src/pages/Lineup.tsx" line="1226" column="41" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1228" column="40" code="2304">Cannot find name 'createNationalsTournament'.</problem>
<problem file="src/pages/Lineup.tsx" line="1229" column="45" code="2538">Type 'unknown' cannot be used as an index type.</problem>
<problem file="src/pages/Lineup.tsx" line="1232" column="13" code="2304">Cannot find name 'tempNationalsData'.</problem>
<problem file="src/pages/Lineup.tsx" line="1235" column="9" code="2304">Cannot find name 'setNationalsData'.</problem>
<problem file="src/pages/Lineup.tsx" line="1235" column="26" code="2304">Cannot find name 'tempNationalsData'.</problem>
<problem file="src/pages/Lineup.tsx" line="1236" column="9" code="2552">Cannot find name 'setTeams'. Did you mean 'useTeam'?</problem>
<problem file="src/pages/Lineup.tsx" line="1236" column="18" code="2304">Cannot find name 'tempTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1237" column="9" code="2304">Cannot find name 'setSchedule'.</problem>
<problem file="src/pages/Lineup.tsx" line="1237" column="21" code="2304">Cannot find name 'tempSchedule'.</problem>
<problem file="src/pages/Lineup.tsx" line="1238" column="9" code="2304">Cannot find name 'setCurrentDate'.</problem>
<problem file="src/pages/Lineup.tsx" line="1239" column="9" code="2304">Cannot find name 'setSeasonRecords'.</problem>
<problem file="src/pages/Lineup.tsx" line="1239" column="26" code="2304">Cannot find name 'tempSeasonRecords'.</problem>
<problem file="src/pages/Lineup.tsx" line="1240" column="9" code="2304">Cannot find name 'setCareerRecords'.</problem>
<problem file="src/pages/Lineup.tsx" line="1240" column="26" code="2304">Cannot find name 'tempCareerRecords'.</problem>
<problem file="src/pages/Lineup.tsx" line="1244" column="9" code="2304">Cannot find name 'setTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1269" column="29" code="2304">Cannot find name 'calculateStarRating'.</problem>
<problem file="src/pages/Lineup.tsx" line="1286" column="26" code="2304">Cannot find name 'teams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1287" column="24" code="2304">Cannot find name 'teams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1295" column="36" code="2304">Cannot find name 'managedOrganization'.</problem>
<problem file="src/pages/Lineup.tsx" line="1296" column="13" code="2304">Cannot find name 'managedTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1297" column="13" code="2304">Cannot find name 'managedTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1327" column="9" code="2304">Cannot find name 'setSchedule'.</problem>
<problem file="src/pages/Lineup.tsx" line="1336" column="80" code="2304">Cannot find name 'GameState'.</problem>
<problem file="src/pages/Lineup.tsx" line="1337" column="108" code="2304">Cannot find name 'processGameResultsEngine'.</problem>
<problem file="src/pages/Lineup.tsx" line="1339" column="9" code="2304">Cannot find name 'setTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1362" column="61" code="2304">Cannot find name 'nationalsData'.</problem>
<problem file="src/pages/Lineup.tsx" line="1363" column="46" code="2304">Cannot find name 'currentDate'.</problem>
<problem file="src/pages/Lineup.tsx" line="1366" column="51" code="2304">Cannot find name 'teams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1369" column="73" code="2304">Cannot find name 'ScheduleEntry'.</problem>
<problem file="src/pages/Lineup.tsx" line="1379" column="39" code="2304">Cannot find name 'ScheduleEntry'.</problem>
<problem file="src/pages/Lineup.tsx" line="1384" column="44" code="2304">Cannot find name 'simulateFullGame'.</problem>
<problem file="src/pages/Lineup.tsx" line="1385" column="104" code="2304">Cannot find name 'processGameResultsEngine'.</problem>
<problem file="src/pages/Lineup.tsx" line="1398" column="80" code="2304">Cannot find name 'ScheduleEntry'.</problem>
<problem file="src/pages/Lineup.tsx" line="1399" column="46" code="2304">Cannot find name 'ScheduleEntry'.</problem>
<problem file="src/pages/Lineup.tsx" line="1424" column="91" code="2304">Cannot find name 'ScheduleEntry'.</problem>
<problem file="src/pages/Lineup.tsx" line="1427" column="46" code="2304">Cannot find name 'generatePlayoffBracket'.</problem>
<problem file="src/pages/Lineup.tsx" line="1429" column="81" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1433" column="82" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1438" column="80" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1451" column="39" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1459" column="67" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1462" column="44" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1479" column="59" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1490" column="39" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1500" column="44" code="2304">Cannot find name 'simulateFullGame'.</problem>
<problem file="src/pages/Lineup.tsx" line="1501" column="104" code="2304">Cannot find name 'processGameResultsEngine'.</problem>
<problem file="src/pages/Lineup.tsx" line="1513" column="66" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1514" column="71" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1545" column="56" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1566" column="9" code="2304">Cannot find name 'setTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1567" column="9" code="2304">Cannot find name 'setNationalsData'.</problem>
<problem file="src/pages/Lineup.tsx" line="1571" column="59" code="2304">Cannot find name 'nationalsData'.</problem>
<problem file="src/pages/Lineup.tsx" line="1572" column="51" code="2304">Cannot find name 'teams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1573" column="44" code="2304">Cannot find name 'currentDate'.</problem>
<problem file="src/pages/Lineup.tsx" line="1580" column="35" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1592" column="77" code="2304">Cannot find name 'ScheduleEntry'.</problem>
<problem file="src/pages/Lineup.tsx" line="1594" column="43" code="2304">Cannot find name 'ScheduleEntry'.</problem>
<problem file="src/pages/Lineup.tsx" line="1598" column="48" code="2304">Cannot find name 'simulateFullGame'.</problem>
<problem file="src/pages/Lineup.tsx" line="1599" column="108" code="2304">Cannot find name 'processGameResultsEngine'.</problem>
<problem file="src/pages/Lineup.tsx" line="1621" column="84" code="2304">Cannot find name 'ScheduleEntry'.</problem>
<problem file="src/pages/Lineup.tsx" line="1622" column="50" code="2304">Cannot find name 'ScheduleEntry'.</problem>
<problem file="src/pages/Lineup.tsx" line="1637" column="46" code="2304">Cannot find name 'generatePlayoffBracket'.</problem>
<problem file="src/pages/Lineup.tsx" line="1638" column="81" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1642" column="82" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1646" column="80" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1655" column="71" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1658" column="48" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1671" column="63" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1673" column="43" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1680" column="48" code="2304">Cannot find name 'simulateFullGame'.</problem>
<problem file="src/pages/Lineup.tsx" line="1681" column="108" code="2304">Cannot find name 'processGameResultsEngine'.</problem>
<problem file="src/pages/Lineup.tsx" line="1693" column="70" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1694" column="75" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1731" column="9" code="2304">Cannot find name 'setTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1732" column="9" code="2304">Cannot find name 'setNationalsData'.</problem>
<problem file="src/pages/Lineup.tsx" line="1750" column="33" code="2304">Cannot find name 'teams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1750" column="60" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1756" column="38" code="2304">Cannot find name 'nationalsData'.</problem>
<problem file="src/pages/Lineup.tsx" line="1756" column="52" code="2304">Cannot find name 'currentDate'.</problem>
<problem file="src/pages/Lineup.tsx" line="1763" column="61" code="2304">Cannot find name 'ScheduleEntry'.</problem>
<problem file="src/pages/Lineup.tsx" line="1764" column="57" code="2304">Cannot find name 'NationalsPlayoffMatch'.</problem>
<problem file="src/pages/Lineup.tsx" line="1774" column="29" code="2304">Cannot find name 'teams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1775" column="29" code="2304">Cannot find name 'teams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1782" column="32" code="2304">Cannot find name 'simulateFullGame'.</problem>
<problem file="src/pages/Lineup.tsx" line="1794" column="14" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1798" column="29" code="2304">Cannot find name 'generateRecruits'.</problem>
<problem file="src/pages/Lineup.tsx" line="1798" column="46" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1798" column="71" code="2304">Cannot find name 'teams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1799" column="9" code="2304">Cannot find name 'setScoutingPool'.</problem>
<problem file="src/pages/Lineup.tsx" line="1800" column="9" code="2304">Cannot find name 'setFairHosted'.</problem>
<problem file="src/pages/Lineup.tsx" line="1807" column="14" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1809" column="33" code="2304">Cannot find name 'scoutingPool'.</problem>
<problem file="src/pages/Lineup.tsx" line="1816" column="24" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1825" column="27" code="2304">Cannot find name 'generatePlayer'.</problem>
<problem file="src/pages/Lineup.tsx" line="1827" column="32" code="2304">Cannot find name 'calculateStarRating'.</problem>
<problem file="src/pages/Lineup.tsx" line="1827" column="88" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1829" column="9" code="2304">Cannot find name 'setRecruitedPool'.</problem>
<problem file="src/pages/Lineup.tsx" line="1830" column="9" code="2304">Cannot find name 'setScoutingPool'.</problem>
<problem file="src/pages/Lineup.tsx" line="1833" column="16" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1844" column="14" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1846" column="24" code="2304">Cannot find name 'recruitedPool'.</problem>
<problem file="src/pages/Lineup.tsx" line="1852" column="31" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1863" column="9" code="2304">Cannot find name 'updateTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1863" column="25" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1864" column="9" code="2304">Cannot find name 'setRecruitedPool'.</problem>
<problem file="src/pages/Lineup.tsx" line="1868" column="9" code="2304">Cannot find name 'setRecruitedPool'.</problem>
<problem file="src/pages/Lineup.tsx" line="1871" column="54" code="2304">Cannot find name 'BudgetAllocations'.</problem>
<problem file="src/pages/Lineup.tsx" line="1872" column="13" code="2304">Cannot find name 'managedOrganization'.</problem>
<problem file="src/pages/Lineup.tsx" line="1873" column="33" code="2304">Cannot find name 'organizationFinancials'.</problem>
<problem file="src/pages/Lineup.tsx" line="1874" column="87" code="2365">Operator '+' cannot be applied to types 'unknown' and 'unknown'.</problem>
<problem file="src/pages/Lineup.tsx" line="1880" column="34" code="2304">Cannot find name 'managedTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1881" column="33" code="2304">Cannot find name 'teams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1884" column="37" code="2304">Cannot find name 'managedTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1885" column="71" code="2304">Cannot find name 'organizationFinancials'.</problem>
<problem file="src/pages/Lineup.tsx" line="1887" column="50" code="2304">Cannot find name 'BudgetCategory'.</problem>
<problem file="src/pages/Lineup.tsx" line="1893" column="13" code="2304">Cannot find name 'setTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1895" column="20" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1896" column="33" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1897" column="87" code="2365">Operator '+' cannot be applied to types 'unknown' and 'unknown'.</problem>
<problem file="src/pages/Lineup.tsx" line="1903" column="20" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1904" column="34" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1906" column="13" code="2304">Cannot find name 'updateTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1911" column="14" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1913" column="24" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1918" column="27" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1918" column="69" code="2304">Cannot find name 'updateMorale'.</problem>
<problem file="src/pages/Lineup.tsx" line="1919" column="37" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1920" column="9" code="2304">Cannot find name 'updateTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1920" column="25" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1920" column="71" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1943" column="13" code="2304">Cannot find name 'managedOrganization'.</problem>
<problem file="src/pages/Lineup.tsx" line="1943" column="36" code="2304">Cannot find name 'organizationFinancials'.</problem>
<problem file="src/pages/Lineup.tsx" line="1944" column="36" code="2304">Cannot find name 'organizationFacilities'.</problem>
<problem file="src/pages/Lineup.tsx" line="1947" column="28" code="2304">Cannot find name 'organizationFinancials'.</problem>
<problem file="src/pages/Lineup.tsx" line="1953" column="30" code="2304">Cannot find name 'teams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1954" column="21" code="2304">Cannot find name 'managedTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1961" column="41" code="2304">Cannot find name 'organizationFinancials'.</problem>
<problem file="src/pages/Lineup.tsx" line="1963" column="13" code="2304">Cannot find name 'setTeams'.</problem>
<problem file="src/pages/Lineup.tsx" line="1966" column="20" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1967" column="53" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1968" column="13" code="2304">Cannot find name 'updateTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1972" column="65" code="2304">Cannot find name 'TrainingFocus'.</problem>
<problem file="src/pages/Lineup.tsx" line="1973" column="14" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1974" column="27" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1975" column="9" code="2304">Cannot find name 'updateTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1975" column="25" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1979" column="14" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1980" column="27" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1982" column="40" code="2304">Cannot find name 'skaterFocuses'.</problem>
<problem file="src/pages/Lineup.tsx" line="1982" column="56" code="2304">Cannot find name 'goalieFocuses'.</problem>
<problem file="src/pages/Lineup.tsx" line="1983" column="33" code="2304">Cannot find name 'getRandomItem'.</problem>
<problem file="src/pages/Lineup.tsx" line="1986" column="9" code="2304">Cannot find name 'updateTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="1986" column="25" code="2304">Cannot find name 'userTeam'.</problem>
<problem file="src/pages/Lineup.tsx" line="2006" column="14" code="2395">Individual declarations in merged declaration 'useTeam' must be all exported or all local.</problem>
<problem file="src/pages/Lineup.tsx" line="2007" column="21" code="2552">Cannot find name 'useContext'. Did you mean 'context'?</problem>
<problem file="src/pages/Lineup.tsx" line="2007" column="32" code="2304">Cannot find name 'TeamContext'.</problem>
<problem file="src/App.tsx" line="15" column="8" code="1192">Module '&quot;/Users/drew/dyad-apps/mystical-penguin-jump/src/pages/Lineup&quot;' has no default export.</problem>
</dyad-problem-report><think>Deciding which files are relevant...

**Investigating Compile Errors**

I'm currently digging into the reported TypeScript errors. The "Cannot find name '...' (TS2304)" errors, particularly in `src/pages/Lineup.tsx`, are numerous. This strongly indicates an issue with the import statements in that file, likely missing or incorrect paths. Further investigation into the import statements is warranted.


**Pinpointing Import Issues**

I've analyzed the errors in `Lineup.tsx` and the recurring "Cannot find name" errors continue to point to incorrect or missing import statements. Examining the specific errors, like the `SkaterAttributes` and `getRandomItem` errors, indicates a reliance on external definitions. I plan to verify all the import paths and ensure that the necessary files (utility, context, etc.) are correctly referenced.


**Rectifying Missing Imports**

I'm now focusing on the numerous "Cannot find name" errors across various files, particularly the persistent issues within `Lineup.tsx`. I've isolated that the root cause appears to be absent or incorrect import statements. I'm planning to systematically go through `Lineup.tsx` and the related utility files, such as `src/lib/` and the `TeamContext`, to pinpoint and correct these missing import directives. The `App.tsx` error concerning the default export of `Lineup` will also be quickly fixed.


**Implementing Corrective Measures**

I'm now focusing on the errors in `Lineup.tsx`. First, I'll remove the extraneous tags and text. Then, I'll fix the import statements based on error messages and the project structure. The `useTeam` declaration conflict and the default export issue will be resolved. After this cleanup, I expect the number of errors related to missing definitions will decrease drastically.


{
  "complexity": "high",
  "relevantFiles": [
    "src/pages/Lineup.tsx",
    "src/context/TeamContext.tsx",
    "src/App.tsx",
    "src/types/index.ts",
    "src/lib/gameEngine.ts",
    "src/lib/playerGenerator.ts",
    "src/lib/statsEngine.ts",
    "src/lib/scheduleGenerator.ts",
    "src/lib/nationalsGenerator.ts",
    "src/lib/aiManager.ts",
    "src/data/trainingFocuses.ts",
    "src/data/teams.ts"
  ]
}</think><dyad-codebase-context files="src/pages/Lineup.tsx,src/context/TeamContext.tsx,src/App.tsx,src/types/index.ts,src/lib/gameEngine.ts,src/lib/playerGenerator.ts,src/lib/statsEngine.ts,src/lib/scheduleGenerator.ts,src/lib/nationalsGenerator.ts,src/lib/aiManager.ts,src/data/trainingFocuses.ts,src/data/teams.ts">Complexity: high</dyad-codebase-context><think>**Identifying Error Clusters**

I've identified the primary sources of the TypeScript errors. It's a tsunami of 403 errors, overwhelmingly concentrated in `src/pages/Lineup.tsx` and `src/context/TeamContext.tsx`. This will allow me to prioritize.


**Diagnosing Error Types**

I've categorized the TypeScript errors to better understand the scope of the problem. The errors include syntax issues, type mismatches, and import/scope problems. Syntax issues, such as missing parentheses or incorrect JSX structure, seem to be the most prominent from the file I am currently working on. This should make the debugging process more streamlined.


**Revising Implementation Plan**

I've re-evaluated the approach. Fixing `src/pages/Lineup.tsx` is still crucial, as the syntax errors there are the biggest hurdle. Then, I will move onto `src/context/TeamContext.tsx` to address remaining scope and type mismatches. I need to be thorough to prevent my own internal monologue leaking into the code output, ensuring each fix is precise and complete. The `TeamContext.Provider` issue is particularly important.


**Defining Immediate Steps**

I've outlined the plan: first, complete and correct `src/pages/Lineup.tsx` to resolve the syntax error deluge. Then, I'll address the `TeamContext.Provider` issue, and the missing `autoSimulateUserNationalsGame` function. Afterwards I will re-examine the `autoAssignTrainingFocuses` to verify its types, and ensure `Lineup.tsx` resolves the issue in `App.tsx`.


**Implementing Lineup.tsx**

I'm focused on fixing `src/pages/Lineup.tsx` as it's the primary source of syntax and related errors, stemming from an incomplete implementation in the previous attempt. This involves reconstructing the component, including the `useTeam` hook, and carefully implementing the `autoFillLines` and `onValueChange` handlers to prevent `unknown` type errors. I'll pay close attention to detail to produce a clean and complete file.


**Commencing File Reconstruction**

I'm now focused on rebuilding `src/pages/Lineup.tsx`. I'm starting with imports, the `useTeam` hook, and null-checking `userTeam`. This ensures the component has access to the necessary data and avoids immediate rendering issues. I'll then integrate the memoized values and handler functions, paying close attention to typing for `Select` components. This methodical approach should resolve the majority of initial syntax and type errors.


**Finalizing Lineup.tsx**

I'm reconstructing `src/pages/Lineup.tsx` from scratch, now that I have a complete understanding of the component and its dependencies. I'm writing the entire function now, including the `autoFillLines` and `onValueChange` handlers, meticulously ensuring all types align, including the `TeamContext` and the data it provides. I will be very careful in my current implementation to ensure this time is entirely complete and correct.


**Completing File Construction**

I'm now working to complete the file for `src/pages/Lineup.tsx`. I've integrated the `autoFillLines` function, carefully typing the arguments, and ensuring it assigns players to appropriate lines and positions. I'm also ensuring proper types for the `onValueChange` handlers and the `Select` components to avoid type errors, as I work on `autoFillLines`.


**Refining File Completion**

I'm now fully implementing `src/pages/Lineup.tsx`, ensuring the `autoFillLines` function correctly assigns players to lines. I'm concentrating on the precise type definitions of arguments and the overall structure, including the `useTeam` hook and its effects. Completing this will eliminate many syntax and type errors.


**Restructuring File Completion**

I'm now rebuilding the `src/pages/Lineup.tsx` component from my previous attempt, making the file complete and correct. The `autoFillLines` and `onValueChange` handlers are fully implemented, including the `useTeam` hook and all the associated states and types. This will resolve the syntax, type, and import issues, as the logic is thoroughly checked.


**Completing TeamContext Implementation**

I'm now focused on finishing the `TeamContext.tsx` implementation. I've added the missing `autoSimulateUserNationalsGame` function, ensuring it correctly simulates a game, and handles all edge cases. I'm verifying the types in the `autoAssignTrainingFocuses` to ensure its function, and that the `userTeam` and other dependencies are handled correctly.


**Refining File Completions**

I've now rewritten `src/pages/Lineup.tsx` completely, integrating the `useTeam` hook, null checks, `autoFillLines`, and the `onValueChange` handlers with correct typing. This should resolve the multitude of syntax and type errors. I've also ensured that `autoSimulateUserNationalsGame` is fully implemented within `TeamContext.tsx`. Then, I corrected `autoAssignTrainingFocuses` to avoid `randomFocus.name` error.


**Rebuilding and Reassessing**

I'm rewriting `src/pages/Lineup.tsx` and completing `src/context/TeamContext.tsx`. The first file will address the syntax and import errors. The second will fix `autoSimulateUserNationalsGame` and confirm correct type assignment in `autoAssignTrainingFocuses`. This approach will resolve the majority of identified issues efficiently, starting with a complete component reconstruction.


</think>My apologies! It appears my previous response was incomplete and contained a significant number of syntax errors, leading to that massive error list. The main issue was that the `Lineup.tsx` file was left in a broken state.

I will now provide the complete and corrected code to resolve all 401 of those errors. The fixes are concentrated in two files:

1.  **`src/pages/Lineup.tsx`**: I am providing the full, corrected version of this file. This will resolve the vast majority of the syntax errors, the missing default export, and the type errors within the component.
2.  **`src/context/TeamContext.tsx`**: I've corrected the `autoAssignTrainingFocuses` function to properly assign the training focus string, which was causing a type error.

These changes should clear up the entire error list and get your application compiling successfully again.

<dyad-write path="src/pages/Lineup.tsx" description="Fixing syntax errors and adding null check for userTeam.">
```typescript
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
            <Select value={player.role || ''} onValueChange={(value) => onRoleChange(value as string)}>
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
    const { userTeam, updateTeam } = useTeam();

    if (!userTeam) {
        return <div>Loading...</div>;
    }

    const playerMap = useMemo(() => new Map(userTeam.roster.map(p => [p.id, p])), [userTeam.roster]);

    const assignedPlayerIds = useMemo(() => {
        const ids = new Set<string>();
        Object.values(userTeam.lineup.forwards).flat().forEach(id => id && ids.add(id));
        Object.values(userTeam.lineup.defence).flat().forEach(id => id && ids.add(id));
        if (userTeam.lineup.goalies.starter) ids.add(userTeam.lineup.goalies.starter);
        if (userTeam.lineup.goalies.backup) ids.add(userTeam.lineup.goalies.backup);
        return ids;
    }, [userTeam.lineup]);

    const staffInLineupCount = useMemo(() => {
        const lineupPlayerIds = [
            ...Object.values(userTeam.lineup.forwards).flat(),
            ...Object.values(userTeam.lineup.defence).flat(),
            userTeam.lineup.goalies.starter,
            userTeam.lineup.goalies.backup,
        ].filter((id): id is string => id !== null);

        return lineupPlayerIds.reduce((count, id) => {
            const player = playerMap.get(id);
            if (player && player.eligibility === 'Staff') {
                return count + 1;
            }
            return count;
        }, 0);
    }, [userTeam.lineup, playerMap]);

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
        const skaters = userTeam.roster.filter(p => !p.positions.includes('G'));
        const goalies = userTeam.roster.filter(p => p.positions.includes('G'));
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
        const newLineup = JSON.parse(JSON.stringify(userTeam.lineup)) as LineupType;
        if (posType === 'forwards') {
            newLineup.forwards[pos as keyof LineupType['forwards']][index!] = playerId;
        } else {
            newLineup.defence[pos as keyof LineupType['defence']][index!] = playerId;
        }
        updateTeam({ ...userTeam, lineup: newLineup });
    }

    const handleGoalieChange = (role: 'starter' | 'backup', playerId: string | null) => {
        const newLineup = { ...userTeam.lineup };
        newLineup.goalies[role] = playerId;
        updateTeam({ ...userTeam, lineup: newLineup });
    };

    const handleRoleChange = (playerId: string, newRole: string) => {
        const newRoster = userTeam.roster.map(p => p.id === playerId ? { ...p, role: newRole } : p);
        updateTeam({ ...userTeam, roster: newRoster });
    };

    const handleTacticChange = (category: string, tactic: string) => {
        updateTeam({ ...userTeam, tactics: { ...userTeam.tactics, [category]: tactic } });
    };

    const autoFillLines = () => {
        const healthyRoster = userTeam.roster.filter(p => p.healthStatus === 'Healthy');
    
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
    
        updateTeam({ ...userTeam, lineup: newLineup });
        toast.success("Lines have been auto-filled with healthy players.");
    };

    const autoAssignRoles = () => {
        const newRoster = userTeam.roster.map(p => ({ ...p }));
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

        Object.values(userTeam.lineup.forwards).flat().forEach(playerId => {
            if (!playerId) return;
            const player = rosterMap.get(playerId) as Player;
            if (player) {
                const bestRole = findBestRole(player, forwardRoles);
                if (bestRole) player.role = bestRole;
            }
        });

        Object.values(userTeam.lineup.defence).flat().forEach(playerId => {
            if (!playerId) return;
            const player = rosterMap.get(playerId) as Player;
            if (player) {
                const bestRole = findBestRole(player, defenceRoles);
                if (bestRole) player.role = bestRole;
            }
        });

        updateTeam({ ...userTeam, roster: newRoster });
        toast.success("Player roles have been auto-assigned based on position and suitability.");
    };

    const autoFillTactics = () => {
        const newTactics = { ...userTeam.tactics };
        Object.keys(groupedTactics).forEach(phase => {
            Object.keys(groupedTactics[phase]).forEach(category => {
                const bestTactic = groupedTactics[phase][category]
                    .map(t => ({ tactic: t, suitability: calculateTacticSuitability(t, userTeam.roster) }))
                    .sort((a, b) => b.suitability.score - a.suitability.score)[0];
                newTactics[category] = bestTactic.tactic.tactic;
            });
        });
        updateTeam({ ...userTeam, tactics: newTactics });
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
            currentId = userTeam.lineup.forwards[typedPos][index!];
            onValueChangeHandler = (val: string) => handleLineupChange('forwards', typedPos, index!, val === 'empty' ? null : val);
            positionForFilter = pos.toUpperCase() as Position;
            placeholderText = `Select ${pos.toUpperCase()}`;
        } else if (posType === 'defence') {
            const typedPos = pos as keyof LineupType['defence'];
            currentId = userTeam.lineup.defence[typedPos][index!];
            onValueChangeHandler = (val: string) => handleLineupChange('defence', typedPos, index!, val === 'empty' ? null : val);
            positionForFilter = pos.toUpperCase() as Position;
            placeholderText = `Select ${pos.toUpperCase()}`;
        } else { // goalies
            const typedPos = pos as keyof LineupType['goalies'];
            currentId = userTeam.lineup.goalies[typedPos];
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
            <Select value={currentId || 'empty'} onValueChange={(val: string) => onValueChangeHandler(val === 'empty' ? null : val)}>
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
                                        const selectedTactic = categoryTactics.find(t => t.tactic === userTeam.tactics[category]);
                                        const suitability = selectedTactic ? calculateTacticSuitability(selectedTactic, userTeam.roster) : { score: 0, explanation: '' };
                                        return (
                                            <div key={category} className="grid grid-cols-3 items-center gap-4">
                                                <label className="font-semibold">{category}</label>
                                                <div className="col-span-2">
                                                    <Select value={userTeam.tactics[category]} onValueChange={(val: string) => handleTacticChange(category, val)}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {categoryTactics.map(t => {
                                                                const tacticSuitability = calculateTacticSuitability(t, userTeam.roster);
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
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
};

export default Lineup;