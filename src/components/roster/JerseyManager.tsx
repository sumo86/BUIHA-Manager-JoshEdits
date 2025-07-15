import { useTeam } from '@/context/TeamContext';
import { Player } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useMemo } from 'react';

export const JerseyManager = () => {
    const { userTeam: team, updateTeam } = useTeam();

    const jerseyMap = useMemo(() => {
        const map = new Map<number, Player>();
        team.roster.forEach(player => {
            if (player.jerseyNumber > 0 && player.jerseyNumber < 100) {
                map.set(player.jerseyNumber, player);
            }
        });
        return map;
    }, [team.roster]);

    const handleJerseyChange = (jerseyNumber: number, newPlayerId: string) => {
        if (newPlayerId === 'unassigned') {
            const playerToUnassign = team.roster.find(p => p.jerseyNumber === jerseyNumber);
            if (playerToUnassign) {
                const newRoster = team.roster.map(p => 
                    p.id === playerToUnassign.id ? { ...p, jerseyNumber: 0 } : p
                );
                updateTeam({ ...team, roster: newRoster });
                toast.success(`${playerToUnassign.name}'s jersey #${jerseyNumber} has been unassigned.`);
            }
            return;
        }

        const newPlayer = team.roster.find(p => p.id === newPlayerId);
        if (!newPlayer) return;

        const oldPlayerWithJersey = team.roster.find(p => p.jerseyNumber === jerseyNumber);
        const oldJerseyOfNewPlayer = newPlayer.jerseyNumber;

        if (oldJerseyOfNewPlayer === jerseyNumber) {
            return; // No change needed
        }

        const newRoster = team.roster.map(p => {
            if (p.id === newPlayerId) {
                return { ...p, jerseyNumber: jerseyNumber };
            }
            if (oldPlayerWithJersey && p.id === oldPlayerWithJersey.id) {
                return { ...p, jerseyNumber: oldJerseyOfNewPlayer };
            }
            return p;
        });

        updateTeam({ ...team, roster: newRoster.sort((a, b) => a.jerseyNumber - b.jerseyNumber) });
        
        if (oldPlayerWithJersey) {
            toast.success(`Swapped jerseys: ${newPlayer.name} is now #${jerseyNumber} and ${oldPlayerWithJersey.name} is now #${oldJerseyOfNewPlayer > 0 ? oldJerseyOfNewPlayer : 'N/A'}.`);
        } else {
            toast.success(`${newPlayer.name} has been assigned jersey #${jerseyNumber}.`);
        }
    };

    const numbers = Array.from({ length: 99 }, (_, i) => i + 1);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Jersey Number Assignments</CardTitle>
                <CardDescription>Assign or swap jersey numbers for your players. Unassigned players have jersey #0.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {numbers.map(number => {
                    const player = jerseyMap.get(number);
                    return (
                        <div key={number} className="p-3 border rounded-lg flex flex-col items-center justify-center space-y-2">
                            <div className="text-3xl font-bold text-muted-foreground">{number}</div>
                            <Select value={player?.id || 'unassigned'} onValueChange={(newPlayerId) => handleJerseyChange(number, newPlayerId)}>
                                <SelectTrigger className="w-full text-xs">
                                    <SelectValue placeholder="Assign Player" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">(Unassigned)</SelectItem>
                                    {team.roster.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};