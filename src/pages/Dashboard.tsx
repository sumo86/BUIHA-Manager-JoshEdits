import { useTeam } from '@/context/TeamContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { GameState } from '@/types';
import { useNavigate } from 'react-router-dom';
import { GameSummary } from '@/components/game/GameSummary';
import { RosterDisplay } from '@/components/game/RosterDisplay';
import { LineupDisplay } from '@/components/game/LineupDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

const Dashboard = () => {
  const { userTeam, advanceWeek, generateScoutingPool, fairHosted, gameForCurrentWeek, teams, autoSimulateUserNationalsGame, currentDate } = useTeam();
  const navigate = useNavigate();

  if (!userTeam) {
    return <div>Loading team data...</div>;
  }

  const handleAdvanceWeek = () => {
    advanceWeek();
  };

  const handleHostFair = () => {
    generateScoutingPool();
    toast.success("Student fair hosted!", {
      description: "New recruits have been added to your scouting pool.",
    });
  };

  const handlePlayGame = () => {
    if (gameForCurrentWeek) {
      if (gameForCurrentWeek.isNationals) {
        const division = userTeam.nationalsDivision;
        const gameId = gameForCurrentWeek.id;
        if (division && gameId) {
          navigate(`/game/nationals/${division}/${gameId}`);
        } else {
          toast.error("Error", { description: "Could not determine Nationals game details." });
        }
      } else {
        navigate(`/game/${gameForCurrentWeek.opponent}`);
      }
    } else {
      toast.info("No game scheduled for this week.");
    }
  };

  const handleAutoSimulateNationalsGame = () => {
    if (gameForCurrentWeek && gameForCurrentWeek.isNationals) {
      const division = userTeam.nationalsDivision;
      const gameId = gameForCurrentWeek.id;
      if (division && gameId) {
        autoSimulateUserNationalsGame(division, gameId);
      } else {
        toast.error("Error", { description: "Could not determine Nationals game details for auto-simulation." });
      }
    }
  };

  const opponentTeam = gameForCurrentWeek && !gameForCurrentWeek.isNationals ? teams.find(t => t.name === gameForCurrentWeek.opponent) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {userTeam.name} Manager!</h1>
          <p className="text-muted-foreground">Current Date: {currentDate.month} Week {currentDate.week}, {currentDate.year}</p>
        </div>
        <Button size="lg" onClick={handleAdvanceWeek}>Advance Week</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p>League: {userTeam.leagueDivision}</p>
            <p>Nationals Division: {userTeam.nationalsDivision}</p>
            <p>Record: {userTeam.wins}-{userTeam.losses}-{userTeam.draws}</p>
            <p>Points: {userTeam.points}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Game</CardTitle>
          </CardHeader>
          <CardContent>
            {gameForCurrentWeek ? (
              <>
                <p className="text-lg font-semibold">
                  {typeof gameForCurrentWeek.homeTeam === 'string' ? gameForCurrentWeek.homeTeam : gameForCurrentWeek.opponent} vs{' '}
                  {typeof gameForCurrentWeek.awayTeam === 'string' ? gameForCurrentWeek.awayTeam : gameForCurrentWeek.opponent}
                </p>
                <p className="text-muted-foreground">
                  {gameForCurrentWeek.isNationals ? 'Nationals Game' : 'Regular Season Game'}
                </p>
                <div className="mt-4 space-x-2">
                  <Button onClick={handlePlayGame}>Play Game</Button>
                  {gameForCurrentWeek.isNationals && (
                    <Button variant="outline" onClick={handleAutoSimulateNationalsGame}>Auto-Simulate</Button>
                  )}
                </div>
              </>
            ) : (
              <p>No game scheduled for this week.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recruitment</CardTitle>
          </CardHeader>
          <CardContent>
            {fairHosted ? (
              <p>Student fair already hosted this year. Check the Recruitment tab for your scouting pool.</p>
            ) : (
              <Button onClick={handleHostFair}>Host Student Fair</Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="roster">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="roster">Roster</TabsTrigger>
              <TabsTrigger value="lineup">Lineup</TabsTrigger>
              <TabsTrigger value="tactics">Tactics</TabsTrigger>
            </TabsList>
            <Card className="mt-2">
              <CardContent className="p-4">
                <TabsContent value="roster">
                  <ScrollArea className="h-[400px] w-full">
                    <RosterDisplay players={userTeam.roster} />
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="lineup">
                  <LineupDisplay lineup={userTeam.lineup} roster={userTeam.roster} />
                </TabsContent>
                <TabsContent value="tactics">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(userTeam.tactics).map(([category, tactic]) => (
                      <div key={category} className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium">{category}:</span>
                        <span>{tactic}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;