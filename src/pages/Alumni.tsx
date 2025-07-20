import { useMemo } from 'react';
import { useTeam } from '@/context/TeamContext';
import { AlumniTable } from '@/components/alumni/AlumniTable';
import { AdditionalDegreesTable } from '@/components/alumni/AdditionalDegreesTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AlumniPage = () => {
  const { alumni, teams, managedTeams } = useTeam();

  const continuingEducationPlayers = useMemo(() => {
    return teams.flatMap(team => team.roster.filter(p => p.isContinuingEducation));
  }, [teams]);

  const filteredContinuingEducationPlayers = useMemo(() => {
    const managedTeamNames = new Set(managedTeams.map(t => t.name));
    
    return continuingEducationPlayers.filter(player => {
        const playerTeam = teams.find(t => t.roster.some(p => p.id === player.id));
        return playerTeam && managedTeamNames.has(playerTeam.name);
    });
  }, [continuingEducationPlayers, managedTeams, teams]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alumni Tracker</h1>
        <p className="text-lg text-muted-foreground">
          Track the careers of players who have graduated from your organization.
        </p>
      </div>

      <Tabs defaultValue="alumni">
        <TabsList>
          <TabsTrigger value="alumni">Alumni</TabsTrigger>
          <TabsTrigger value="continuing-education">Continuing Education</TabsTrigger>
        </TabsList>
        <TabsContent value="alumni" className="mt-4">
          <AlumniTable alumni={alumni} />
        </TabsContent>
        <TabsContent value="continuing-education" className="mt-4">
          <AdditionalDegreesTable players={filteredContinuingEducationPlayers} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlumniPage;