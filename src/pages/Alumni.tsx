import { useMemo, useState } from 'react';
import { useTeam } from '@/context/TeamContext';
import { AlumniTable } from '@/components/alumni/AlumniTable';
import { AdditionalDegreesTable } from '@/components/alumni/AdditionalDegreesTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AlumniPage = () => {
  const { alumni, managedTeams, userTeam } = useTeam();
  const [filterScope, setFilterScope] = useState<'organization' | string>('organization');

  const filterOptions = useMemo(() => {
    const options = [{ value: 'organization', label: 'Organization' }];
    if (userTeam) {
      managedTeams.forEach(team => {
        options.push({ value: team.name, label: team.name });
      });
    }
    return options;
  }, [userTeam, managedTeams]);

  const filteredAlumni = useMemo(() => {
    if (filterScope === 'organization') {
      return alumni;
    }
    return alumni.filter(player => {
      const lastTeam = player.history[player.history.length - 1]?.team;
      return lastTeam === filterScope;
    });
  }, [alumni, filterScope]);

  const continuingEducationPlayers = useMemo(() => {
    return managedTeams.flatMap(team => team.roster.filter(p => p.isContinuingEducation));
  }, [managedTeams]);

  const filteredContinuingEducationPlayers = useMemo(() => {
    if (filterScope === 'organization') {
      return continuingEducationPlayers;
    }
    const team = managedTeams.find(t => t.name === filterScope);
    return team ? team.roster.filter(p => p.isContinuingEducation) : [];
  }, [continuingEducationPlayers, filterScope, managedTeams]);

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
            <SelectValue placeholder="Filter by team..." />
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