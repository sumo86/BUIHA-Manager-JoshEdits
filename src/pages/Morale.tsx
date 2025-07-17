import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTeam } from "@/context/TeamContext";
import { Heart, Smile } from "lucide-react";
import { MoraleTable } from "@/components/morale/MoraleTable";

const MoralePage = () => {
  const { userTeam, runStudentLifeInitiative } = useTeam();

  if (!userTeam) {
    return <div>Loading team data...</div>;
  }

  // Use currentBudget for all spending
  const currentBudget = userTeam.financials.currentBudget;
  const initiativeCost = 500;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Morale</h1>
          <p className="text-lg text-muted-foreground">
            Monitor and improve your team's happiness and motivation.
          </p>
        </div>
        <Smile className="h-10 w-10 text-primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Life Initiative</CardTitle>
          <CardDescription>
            Organize a team-building event to boost everyone's morale. This will improve player happiness and their willingness to train.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Cost: £{initiativeCost.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">
              Available Budget: £{currentBudget.toLocaleString()}
            </p>
          </div>
          <Button onClick={runStudentLifeInitiative} disabled={currentBudget < initiativeCost}>
            <Heart className="mr-2 h-4 w-4" /> Run Initiative
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Player Morale Overview</CardTitle>
          <CardDescription>
            An overview of each player's current morale and the likely reason for it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MoraleTable players={userTeam.roster} teamWins={userTeam.wins} teamLosses={userTeam.losses} />
        </CardContent>
      </Card>
    </div>
  );
};

export default MoralePage;