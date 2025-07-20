import { useMemo, useState } from 'react';
import { useTeam } from '@/context/TeamContext';
import { AlumniTable } from '@/components/alumni/AlumniTable';
import { AdditionalDegreesTable } from '@/components/alumni/AdditionalDegreesTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTeamOrganizations } from '@/data/teams';
import { getPlayerLastTeam } from '@/lib/playerUtils';

const AlumniPage = () => {
  const { alumni, teams, managedTeams } = useTeam();
  const [filterScope, setFilterScope] = useState<string>('all');

  const organizations = useMemo(() => getTeamOrganizations(), []);

  const filterOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All Organizations' }];
    organizations.forEach(org => {
        options.push({ value: org.name, label: org.name });
    });
    return options;
  }, [organizations]);

  const filteredAlumni = useMemo(() => {
    if (filterScope === 'all') {
      return alumni;
    }
    const org = organizations.find(o => o.name === filterScope);
    if (!org) return [];
    const orgTeamNames = new Set(org.teams.map(t => t.name));
    return alumni.filter(player => {
        const lastTeam = getPlayerLastTeam(player);
        return orgTeamNames.has(lastTeam);
    });
  }, [alumni, filterScope, organizations]);

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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Alumni Tracker</h1>
          <p className="text-lg text-muted-foreground">
            Track the careers of players who have graduated from your organization.
          </p>
        </div>
        <Select value={filterScope} onValueChange={setFilterScope}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by organization..." />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="alumni">
        <TabsList>
          <TabsTrigger value="alumni">Alumni</TabsTrigger>
          <TabsTrigger value="continuing-education">Continuing Education</TabsTrigger>
        </TabsList>
        <TabsContent value="alumni" className="mt-4">
          <AlumniTable alumni={filteredAlumni} />
        </TabsContent>
        <TabsContent value="continuing-education" className="mt-4">
          <AdditionalDegreesTable players={filteredContinuingEducationPlayers} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlumniPage;