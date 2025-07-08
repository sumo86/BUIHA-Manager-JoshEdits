import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeam } from "@/context/TeamContext";
import { TrendingUp } from "lucide-react";
import { DevelopmentLogTable } from "@/components/training/DevelopmentLogTable";
import { PlayerFocusTable } from "@/components/training/PlayerFocusTable";

const Training = () => {
  const { userTeam, currentDate, developmentHistory, updatePlayerTrainingFocus } = useTeam();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training & Development</h1>
          <p className="text-lg text-muted-foreground">
            Current Date: {currentDate.month} {currentDate.year}, Week {currentDate.week}
          </p>
        </div>
        <TrendingUp className="h-10 w-10 text-primary" />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="focuses">Player Focuses</TabsTrigger>
          <TabsTrigger value="log">Development Log</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Development</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Each week, players automatically have a chance to improve their attributes based on their age, potential, and work ethic (professionalism and determination). Younger players with high potential and a strong work ethic are more likely to see significant gains.
              </p>
              <p className="text-muted-foreground">
                You can guide their growth by setting a <span className="font-semibold">Training Focus</span>. This will increase the likelihood that they improve attributes related to that specific area.
              </p>
              <p className="text-muted-foreground">
                Once a player reaches their potential ability, they will stop improving. As they get older, especially past their late 20s, they may begin to see a natural decline in their physical attributes.
              </p>
              <p className="text-muted-foreground">
                You can track all recent improvements and declines in the <span className="font-semibold">Development Log</span> tab.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="focuses">
            <Card>
                <CardHeader>
                    <CardTitle>Set Training Focuses</CardTitle>
                </CardHeader>
                <CardContent>
                    <PlayerFocusTable players={userTeam.roster} onFocusChange={updatePlayerTrainingFocus} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="log">
            <Card>
                <CardHeader>
                    <CardTitle>Recent Attribute Changes</CardTitle>
                </CardHeader>
                <CardContent>
                    <DevelopmentLogTable logs={developmentHistory} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Training;