import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { teams } from "@/data/teams";
import { Team } from "@/types";

const Standings = () => {
  const groupedTeams = teams.reduce((acc, team) => {
    const { leagueDivision } = team;
    if (!acc[leagueDivision]) {
      acc[leagueDivision] = [];
    }
    acc[leagueDivision].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">League Standings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(groupedTeams).map(([division, teamsInDivision]: [string, Team[]]) => (
          <Card key={division}>
            <CardHeader>
              <CardTitle>{division}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Nationals Division</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamsInDivision.map((team) => (
                    <TableRow key={team.name}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>{team.nationalsDivision}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Standings;