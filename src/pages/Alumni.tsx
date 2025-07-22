import { useMemo, useState } from 'react';
import { useTeam } from '@/context/TeamContext';
import { AlumniTable } from '@/components/alumni/AlumniTable';
import { AdditionalDegreesTable } from '@/components/alumni/AdditionalDegreesTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTeamOrganizations } from '@/lib/leagueUtils';
import { getPlayerLastTeam } from '@/lib/playerUtils';
import { Player } from '@/types';

const AlumniPage = () => {
  const { alumni, teams, managedTeams, seasonHistory } = useTeam();
  const [filterScope, setFilterScope] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');

  const organizations = useMemo(() => getTeamOrganizations(teams), [teams]);

  const seasons = useMemo(() => {
    return ["all", ...Object.keys(seasonHistory).sort((a, b) => b.localeCompare(a))];
  }, [seasonHistory]);

  const filterOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All Organizations' }];
    organizations.forEach(org => {
        options.push({ value: org.name, label: org.name });
    });
    return options;
  }, [organizations]);

  const continuingEducationPlayers = useMemo(() => {
    return teams.flatMap(team => team.roster.filter(p => p.isContinuingEducation));
  }, [teams]);

  const { retiredPlayers, transferPlayers, continuingEducationFiltered } = useMemo(() => {
    // 1. Filter by Organization
    let orgFilteredAlumni: Player[];
    if (filterScope === 'all') {
      orgFilteredAlumni = alumni;
    } else {
      const org = organizations.find(o => o.name === filterScope);
      if (!org) {
        orgFilteredAlumni = [];
      } else {
        const orgTeamNames = new Set(org.teams.map(t => t.name));
        orgFilteredAlumni = alumni.filter(player => {
            const lastTeam = getPlayerLastTeam(player);
            return orgTeamNames.has(lastTeam);
        });
      }
    }

    const managedTeamNames = new Set(managedTeams.map(t => t.name));
    const orgFilteredContinuing = continuingEducationPlayers.filter(player => {
        const playerTeam = teams.find(t => t.roster.some(p => p.id === player.id));
        return playerTeam && managedTeamNames.has(playerTeam.name);
    });

    // 2. Filter by Season
    const seasonFilteredAlumni = selectedSeason === 'all'
      ? orgFilteredAlumni
      : orgFilteredAlumni.filter(p => p.history.length > 0 && p.history[p.history.length - 1].season === selectedSeason);

    const seasonFilteredContinuing = selectedSeason === 'all'
      ? orgFilteredContinuing
      : orgFilteredContinuing.filter(p => p.continuingEducationStartSeason === selectedSeason);

    // 3. Split into categories
    const retired = seasonFilteredAlumni.filter(p => p.alumniStatus === 'Retired' || !p.alumniStatus);
    const transfer = seasonFilteredAlumni.filter(p => p.alumniStatus === 'Transfer Listed');

    return {
      retiredPlayers: retired,
      transferPlayers: transfer,
      continuingEducationFiltered: seasonFilteredContinuing,
    };
  }, [alumni, filterScope, organizations, selectedSeason, continuingEducationPlayers, managedTeams, teams]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Alumni Tracker</h1>
          <p className="text-lg text-muted-foreground">
            Track the careers of players who have graduated from your organization.
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by season..." />
            </SelectTrigger>
            <SelectContent>
              {seasons.map(season => (
                <SelectItem key={season} value={season}>
                  {season === 'all' ? 'All Time' : season}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      </div>

      <Tabs defaultValue="retired">
        <TabsList>
          <TabsTrigger value="retired">Retired</TabsTrigger>
          <TabsTrigger value="transfer">Transfer Listed</TabsTrigger>
          <TabsTrigger value="continuing-education">Continuing Education</TabsTrigger>
        </TabsList>
        <TabsContent value="retired" className="mt-4">
          <AlumniTable alumni={retiredPlayers} />
        </TabsContent>
        <TabsContent value="transfer" className="mt-4">
          <AlumniTable alumni={transferPlayers} />
        </TabsContent>
        <TabsContent value="continuing-education" className="mt-4">
          <AdditionalDegreesTable players={continuingEducationFiltered} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlumniPage;