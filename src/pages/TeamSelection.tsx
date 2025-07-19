import { getTeamOrganizations } from '@/data/teams';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTeam } from '@/context/TeamContext';
import { SavedGameCard } from '@/components/SavedGameCard';

const TeamSelection = () => {
  const organizations = getTeamOrganizations();
  const { selectOrganization, savedGames, loadGame, deleteGame } = useTeam();

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">University Hockey Manager</h1>
        <p className="text-xl text-muted-foreground mt-2">Welcome to the world of British university ice hockey.</p>
      </div>

      <div className="space-y-8">
        {savedGames && savedGames.length > 0 && (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Load Game</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {savedGames.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()).map(save => (
                        <SavedGameCard key={save.saveName} save={save} onLoad={loadGame} onDelete={deleteGame} />
                    ))}
                </div>
            </div>
        )}

        <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Start New Game</h2>
            <p className="text-muted-foreground">
                Select a university organization to manage. You will be in control of all teams within that organization.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {organizations.map(org => (
                <Card key={org.name}>
                  <CardHeader>
                    <CardTitle>{org.name}</CardTitle>
                    <CardDescription>{org.teams.length} teams</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {org.teams.map(team => (
                        <li key={team.name}>{team.name} ({team.leagueDivision})</li>
                      ))}
                    </ul>
                    <Button onClick={() => selectOrganization(org.name)} className="w-full mt-4">
                      Select {org.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TeamSelection;