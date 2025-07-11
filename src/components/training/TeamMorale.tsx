import { useTeam } from "@/context/TeamContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Player } from "@/types";
import { useMemo } from "react";

const getOverallMorale = (roster: Player[]): string => {
    if (roster.length === 0) return "N/A";
    const moraleValues = { "Angry": 0, "Unhappy": 1, "Content": 2, "Happy": 3 };
    const totalMorale = roster.reduce((sum, player) => sum + moraleValues[player.morale], 0);
    const avgMorale = totalMorale / roster.length;

    if (avgMorale > 2.5) return "Happy";
    if (avgMorale > 1.5) return "Content";
    if (avgMorale > 0.5) return "Unhappy";
    return "Angry";
};

export const TeamMorale = () => {
    const { userTeam, runStudentLifeInitiative } = useTeam();

    const overallMorale = useMemo(() => {
        if (!userTeam) return "N/A";
        return getOverallMorale(userTeam.roster);
    }, [userTeam]);

    if (!userTeam) return null;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Student Life Initiative</CardTitle>
                    <CardDescription>
                        Boost team morale by organizing a team-building event. This will improve every player's morale by one level.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <p className="text-muted-foreground">Cost: £500 (from Student Life Budget)</p>
                    <Button onClick={runStudentLifeInitiative}>Run Initiative</Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Team Morale Report</CardTitle>
                    <CardDescription>Overall team morale is currently: <span className="font-semibold">{overallMorale}</span></CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Player</TableHead>
                                    <TableHead>Morale</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userTeam.roster.sort((a, b) => a.name.localeCompare(b.name)).map(player => (
                                    <TableRow key={player.id}>
                                        <TableCell className="font-medium">{player.name}</TableCell>
                                        <TableCell>{player.morale}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};