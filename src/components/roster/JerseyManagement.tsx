import { useMemo } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Player } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const JerseyManagement = () => {
    const { userTeam, updateTeam } = useTeam();

    const handleJerseyChange = (jerseyNumber: number, playerId: string) => {
        if (!userTeam) return;

        const newRoster = userTeam.roster.map(p => ({ ...p }));

        const playerToAssign = newRoster.find(p => p.id === playerId);
        const playerCurrentlyWithNumber = newRoster.find(p => p.jerseyNumber === jerseyNumber);

        if (!playerToAssign) return;

        const oldNumberOfPlayerToAssign = playerToAssign.jerseyNumber;

        // Assign the new number
        playerToAssign.jerseyNumber = jerseyNumber;

        // If another player had this number, swap them to the old number of the player being assigned
        if (playerCurrentlyWithNumber && playerCurrentlyWithNumber.id !== playerId) {
            playerCurrentlyWithNumber.jerseyNumber = oldNumberOfPlayerToAssign;
            toast.success(`${playerToAssign.name} assigned #${jerseyNumber}, and ${playerCurrentlyWithNumber.name} assigned #${oldNumberOfPlayerToAssign}.`);
        } else {
            toast.success(`${playerToAssign.name} assigned #${jerseyNumber}.`);
        }
        
        // Sort roster by new jersey number to keep it consistent
        newRoster.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
        updateTeam({ ...userTeam, roster: newRoster });
    };

    const playersByNumber = useMemo(() => {
        const map = new Map<number, Player>();
        userTeam?.roster.forEach(p => {
            if (p.jerseyNumber > 0 && p.jerseyNumber <= 99) {
                map.set(p.jerseyNumber, p);
            }
        });
        return map;
    }, [userTeam?.roster]);

    const numberGrid = Array.from({ length: 99 }, (_, i) => i + 1);
    const sortedRoster = useMemo(() => userTeam?.roster.slice().sort((a, b) => a.name.localeCompare(b.name)), [userTeam?.roster]);

    if (!userTeam) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Jersey Number Assignments</CardTitle>
                <p className="text-muted-foreground">Select a player from the dropdown to assign them that number. If the number is already taken, the players will swap jerseys.</p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {numberGrid.map(num => {
                    const player = playersByNumber.get(num);
                    return (
                        <div key={num} className="p-3 border rounded-lg flex flex-col space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-xl text-muted-foreground">{num}</span>
                                {player && <Badge variant="secondary">{player.name}</Badge>}
                                {!player && <Badge variant="outline">Available</Badge>}
                            </div>
                            <Select
                                value={player?.id || ''}
                                onValueChange={(value) => {
                                    if (value) {
                                        handleJerseyChange(num, value);
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Assign to..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortedRoster?.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name} (#{p.jerseyNumber})
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