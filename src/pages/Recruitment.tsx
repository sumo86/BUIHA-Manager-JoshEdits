import { useTeam } from '@/context/TeamContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScoutingTable } from '@/components/recruitment/ScoutingTable';
import { RecruitsTable } from '@/components/recruitment/RecruitsTable';

const Recruitment = () => {
  const { scoutingPool, recruitedPool } = useTeam();

  if (scoutingPool.length === 0 && recruitedPool.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-4">Recruitment</h1>
        <p className="text-lg text-muted-foreground">
          There are no players to scout right now. Host the student fair from the Dashboard to find new talent.
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="scouting" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="scouting">Scouting Pool</TabsTrigger>
        <TabsTrigger value="recruits">Your Recruits</TabsTrigger>
      </TabsList>
      <TabsContent value="scouting" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Scouting Pool</CardTitle>
            <CardDescription>
              Potential players from the student fair. Their exact abilities are unknown until you recruit them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScoutingTable />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="recruits" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Your Recruits</CardTitle>
            <CardDescription>
              Players you have recruited. Review their full profile and decide whether to assign them to your roster or discard them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecruitsTable />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default Recruitment;