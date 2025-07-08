import { useTeam } from '@/context/TeamContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { generateScoutingPool, scoutingPool, recruitedPool, fairHosted } = useTeam();

  const handleHostFair = () => {
    generateScoutingPool();
  };

  return (
    <div>
      {scoutingPool.length === 0 && recruitedPool.length === 0 && !fairHosted && (
        <Card className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <CardHeader>
            <CardTitle>New Season Recruitment Drive!</CardTitle>
            <CardDescription>It's the start of a new season. Host your student fair to find new talent for your team.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleHostFair}>Host Student Fair</Button>
          </CardContent>
        </Card>
      )}
      <h1 className="text-3xl font-bold mb-4">Welcome, Manager!</h1>
      <p className="text-lg text-muted-foreground">
        This is your central hub for managing your university ice hockey team.
        <br />
        Use the navigation on the left to get started.
      </p>
    </div>
  );
};

export default Dashboard;