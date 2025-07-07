import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { teams } from "@/data/teams";
import { Player } from "@/types";
import { Star } from "lucide-react";

const Roster = () => {
  // For now, let's just display the first team's roster.
  // We can add a team selector later.
  const team = teams[0];

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{team.name} Roster</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Manage your players, lines, and training schedules here.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Player List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Position(s)</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Morale</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Eligibility</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.roster.map((player: Player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-bold">{player.jerseyNumber}</TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell>{player.positions.join(", ")}</TableCell>
                  <TableCell>{player.age}</TableCell>
                  <TableCell>{player.nationality}</TableCell>
                  <TableCell>{renderStars(player.starRating)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{player.morale}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={player.healthStatus === 'Healthy' ? 'secondary' : 'destructive'}>
                      {player.healthStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{player.eligibility}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Roster;