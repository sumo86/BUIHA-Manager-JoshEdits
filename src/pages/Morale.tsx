import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTeam } from "@/context/TeamContext";
import { Heart, Users } from "lucide-react";

const Morale = () => {
  const { userTeam, runStudentLifeInitiative } = useTeam();

  if (!userTeam) {
    return <div>Loading team data...</div>;
  }

  const getMoraleColor = (morale: string) => {
    switch (morale) {
      case "Happy":
        return "bg-green-100 text-green-800 border-green-200";
      case "Content":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Unhappy":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Angry":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Morale</h1>
          <p className="text-lg text-muted-foreground">
            Keep your players happy to build a winning culture.
          </p>
        </div>
        <Heart className="h-10 w-10 text-primary" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Player Morale Overview</CardTitle>
              <CardDescription>
                Morale is influenced by team performance, playing time, and off-ice events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-center">Morale</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userTeam.roster.map(player => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={getMoraleColor(player.morale)}>
                            {player.morale}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Life Initiative</CardTitle>
              <CardDescription>
                Organize a team-building event to boost everyone's spirits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This action spends funds from your "Student Life" budget to provide a small, team-wide morale boost. It's a great way to recover from a tough loss or build momentum.
              </p>
              <Button onClick={runStudentLifeInitiative} className="w-full">
                <Users className="mr-2 h-4 w-4" /> Run Initiative (£500)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Morale;