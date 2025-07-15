import { useTeam } from "@/context/TeamContext";
import { Player } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const JerseyManagement = () => {
    const { userTeam, updateTeam } = useTeam();

    if (!userTeam) {
        return <div>Loading...</div>;
    }

    const handleNumberChange = (newNumber: number, selectedPlayerId: string) => {
        if (!userTeam) return;

        const newRoster = [...userTeam.roster];

        const targetPlayer = newRoster.find(p => p.id === selectedPlayerId);
        if (!targetPlayer) return;

        const originalPlayerNumber = targetPlayer.jerseyNumber;

        // If the player is already assigned this number, do nothing.
        if (originalPlayerNumber === newNumber) return;

        const playerCurrentlyWithNewNumber = newRoster.find(p => p.jerseyNumber === newNumber);

        // Assign the new number to the target player
        targetPlayer.jerseyNumber = newNumber;

        // If another player had the new number, swap numbers
        if (playerCurrentlyWithNewNumber) {
            playerCurrentlyWithNewNumber.jerseyNumber = originalPlayerNumber;
            toast.info(`${targetPlayer.name} and ${playerCurrentlyWithNewNumber.name} swapped jersey numbers.`, {
                description: `${targetPlayer.name} is now #${newNumber}, ${playerCurrentlyWithNewNumber.name} is now #${originalPlayerNumber}.`
            });
        } else {
             toast.success(`${targetPlayer.name}'s jersey number changed to #${newNumber}.`);
        }
        
        updateTeam({ ...userTeam, roster: newRoster });
    };
    
    const playerByNumber: { [key: number]: Player } = {};
    userTeam.roster.forEach(player => {
        playerByNumber[player.jerseyNumber] = player;
    });

    const numbers = Array.from({ length: 99 }, (_, i) => i + 1);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Jersey Number Assignments</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {numbers.map(number => {
                        const player = playerByNumber[number];
                        return (
                            <div key={number} className="flex items-center gap-2 p-2 border rounded-md">
                                <div className="font-bold text-lg w-8 text-center">{number}</div>
                                <div className="flex-1">
                                    <Select
                                        value={player?.id || "available"}
                                        onValueChange={(value) => {
                                            if (value !== "available") {
                                                handleNumberChange(number, value);
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="truncate">
                                            <SelectValue placeholder="Assign Player" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="available">Available</SelectItem>
                                            {userTeam.roster.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name} (#{p.jerseyNumber})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};