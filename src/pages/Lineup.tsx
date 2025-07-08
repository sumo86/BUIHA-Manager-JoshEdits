import { useState, useMemo } from 'react';
import { teams } from '@/data/teams';
import { tactics } from '@/data/tactics';
import { Player, Position, Team, Lineup as LineupType, TacticsSelection } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateTacticSuitability } from '@/lib/tactics';
import { Star } from 'lucide-react';

const Lineup = () => {
    const [team, setTeam] = useState<Team>(teams[0]);

    const assignedPlayerIds = useMemo(() => {
        const ids = new Set<string>();
        Object.values(team.lineup.forwards).forEach(line => line.forEach(id => id && ids.add(id)));
        Object.values(team.lineup.defence).forEach(pair => pair.forEach(id => id && ids.add(id)));
        if (team.lineup.goalies.starter) ids.add(team.lineup.goalies.starter);
        if (team.lineup.goalies.backup) ids.add(team.lineup.goalies.backup);
        return ids;
    }, [team.lineup]);

    const getAvailablePlayers = (position: Position, currentSelection: string | null): Player[] => {
        return team.roster.filter(player => {
            if (!player.positions.includes(position)) return false;
            if (assignedPlayerIds.has(player.id) && player.id !== currentSelection) return false;
            return true;
        });
    };

    const handleLineupChange = (posType: 'forwards' | 'defence', pos: 'lw' | 'c' | 'rw' | 'ld' | 'rd', index: number, playerId: string) => {
        setTeam(prevTeam => {
            const newLineup = { ...prevTeam.lineup };
            (newLineup[posType][pos] as (string | null)[])[index] = playerId === 'empty' ? null : playerId;
            return { ...prevTeam, lineup: newLineup };
        });
    };

    const handleGoalieChange = (role: 'starter' | 'backup', playerId: string) => {
        setTeam(prevTeam => {
            const newLineup = { ...prevTeam.lineup };
            newLineup.goalies[role] = playerId === 'empty' ? null : playerId;
            return { ...prevTeam, lineup: newLineup };
        });
    };
    
    const handleTacticChange = (category: string, tactic: string) => {
        setTeam(prevTeam => ({
            ...prevTeam,
            tactics: { ...prevTeam.tactics, [category]: tactic }
        }));
    };

    const renderStars = (rating: number) => (
        <div className="flex">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            ))}
        </div>
    );

    const groupedTactics = useMemo(() => tactics.reduce((acc, t) => {
        acc[t.phase] = acc[t.phase] || {};
        acc[t.phase][t.category] = acc[t.phase][t.category] || [];
        acc[t.phase][t.category].push(t);
        return acc;
    }, {} as Record<string, Record<string, typeof tactics>>), []);

    const PlayerSelect = ({ position, value, onChange }: { position: Position, value: string | null, onChange: (value: string) => void }) => {
        const players = getAvailablePlayers(position, value);
        const playerMap = useMemo(() => new Map(team.roster.map(p => [p.id, p])), [team.roster]);
        const selectedPlayer = value ? playerMap.get(value) : null;

        return (
            <Select value={value || 'empty'} onValueChange={onChange}>
                <SelectTrigger className="w-full">
                    <SelectValue>
                        {selectedPlayer ? `${selectedPlayer.name} (${selectedPlayer.starRating}⭐)` : 'Empty'}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="empty">Empty</SelectItem>
                    {players.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.starRating}⭐)
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    };

    const LineRow = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div className="grid grid-cols-4 items-center gap-4 py-2 border-b">
            <div className="font-semibold text-muted-foreground">{title}</div>
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
                    <CardHeader><CardTitle>Set Your Lines</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Forwards</h3>
                            {[...Array(3)].map((_, i) => (
                                <LineRow key={i} title={`Line ${i + 1}`}>
                                    <div className="grid grid-cols-3 gap-2">
                                        <PlayerSelect position="LW" value={team.lineup.forwards.lw[i]} onChange={val => handleLineupChange('forwards', 'lw', i, val)} />
                                        <PlayerSelect position="C" value={team.lineup.forwards.c[i]} onChange={val => handleLineupChange('forwards', 'c', i, val)} />
                                        <PlayerSelect position="RW" value={team.lineup.forwards.rw[i]} onChange={val => handleLineupChange('forwards', 'rw', i, val)} />
                                    </div>
                                </LineRow>
                            ))}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Defence</h3>
                            {[...Array(3)].map((_, i) => (
                                <LineRow key={i} title={`Pairing ${i + 1}`}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <PlayerSelect position="LD" value={team.lineup.defence.ld[i]} onChange={val => handleLineupChange('defence', 'ld', i, val)} />
                                        <PlayerSelect position="RD" value={team.lineup.defence.rd[i]} onChange={val => handleLineupChange('defence', 'rd', i, val)} />
                                    </div>
                                </LineRow>
                            ))}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Goalies</h3>
                            <LineRow title="Starter">
                                <PlayerSelect position="G" value={team.lineup.goalies.starter} onChange={val => handleGoalieChange('starter', val)} />
                            </LineRow>
                            <LineRow title="Backup">
                                <PlayerSelect position="G" value={team.lineup.goalies.backup} onChange={val => handleGoalieChange('backup', val)} />
                            </LineRow>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="tactics">
                <div className="space-y-6">
                    {Object.entries(groupedTactics).map(([phase, categories]) => (
                        <Card key={phase}>
                            <CardHeader><CardTitle>{phase}</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {Object.entries(categories).map(([category, categoryTactics]) => (
                                    <div key={category} className="grid grid-cols-3 items-center gap-4">
                                        <label className="font-semibold">{category}</label>
                                        <div className="col-span-2">
                                            <Select value={team.tactics[category]} onValueChange={val => handleTacticChange(category, val)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {categoryTactics.map(t => (
                                                        <SelectItem key={t.tactic} value={t.tactic}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="flex justify-between w-full items-center pr-2">
                                                                        <span>{t.tactic}</span>
                                                                        {renderStars(calculateTacticSuitability(t, team.roster))}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="right" className="max-w-xs">
                                                                    <p className="font-bold mb-1">{t.tactic}</p>
                                                                    <p className="text-sm text-muted-foreground mb-2">{t.description}</p>
                                                                    <p className="text-xs"><span className="font-semibold">Best with:</span> {t.bestUsedWith}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TabsContent>
        </Tabs>
    );
};

export default Lineup;