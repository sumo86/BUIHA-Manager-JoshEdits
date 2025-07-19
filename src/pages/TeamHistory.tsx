import { useMemo, useState } from 'react';
import { useTeam } from '@/context/TeamContext';
import { HistoryRecords } from '@/components/history/HistoryRecords';
import { RecordCategory, Achievement } from '@/types';
import { calculateRecords } from '@/lib/historyUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CareerStatsTable } from '@/components/history/CareerStatsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeasonalStatsTable } from '@/components/history/SeasonalStatsTable';
import { AchievementsOverview } from '@/components/history/AchievementsOverview';

const TeamHistoryPage = () => {
  const { userTeam, managedTeams, teams, schedule, seasonHistory, alumni, teamAchievements } = useTeam();
  const [filterScope, setFilterScope] = useState<'organization' | string>('organization');

  const filterOptions = useMemo(() => {
    const options = [{ value: 'organization', label: 'Organization' }];
    if (userTeam) {
      options.push({ value: userTeam.name, label: userTeam.name });
    }
    return options;
  }, [userTeam]);

  const allPlayersInOrg = useMemo(() => {
    const currentPlayers = managedTeams.flatMap(t => t.roster);
    const managedTeamNames = new Set(managedTeams.map(t => t.name));
    
    const relevantAlumni = alumni.filter(player => 
        player.history.some(record => managedTeamNames.has(record.team))
    );

    const allPlayers = [...currentPlayers, ...relevantAlumni];
    const uniquePlayers = Array.from(new Map(allPlayers.map(p => [p.id, p])).values());
    
    return uniquePlayers;
  }, [managedTeams, alumni]);

  const playersToDisplay = useMemo(() => {
    if (filterScope === 'organization') {
        return allPlayersInOrg;
    }
    const selectedTeam = teams.find(t => t.name === filterScope);
    if (!selectedTeam) return [];

    const teamName = selectedTeam.name;
    return allPlayersInOrg.filter(player => 
        player.history.some(record => record.team === teamName) || 
        selectedTeam.roster.some(p => p.id === player.id)
    );
  }, [filterScope, allPlayersInOrg, teams]);

  const achievementsToDisplay = useMemo(() => {
    if (!teamAchievements) return [];
    
    const teamNamesToInclude = filterScope === 'organization'
      ? managedTeams.map(t => t.name)
      : [filterScope];

    return teamNamesToInclude.flatMap(name => teamAchievements[name] || []);
  }, [filterScope, managedTeams, teamAchievements]);

  const { careerRecords } = useMemo(() => {
    return calculateRecords(playersToDisplay, schedule);
  }, [playersToDisplay, schedule]);

  const seasons = useMemo(() => Object.keys(seasonHistory), [seasonHistory]);

  if (!userTeam) {
    return <div>Select a team to see its history.</div>;
  }

  const careerCategories: RecordCategory[] = ['Goals', 'Points', 'Assists', 'PenaltyMinutes', 'Shutouts'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Team History & Records</h1>
          <p className="text-lg text-muted-foreground">
            Historical records and stats from the start of your career.
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
      
      <Tabs defaultValue="records" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="records">Records & Achievements</TabsTrigger>
          <TabsTrigger value="seasonal-stats">Seasonal Stats</TabsTrigger>
        </TabsList>
        <TabsContent value="records" className="mt-4 space-y-6">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <AchievementsOverview achievements={achievementsToDisplay} title="Honours" />
            <HistoryRecords title="Career Records" records={careerRecords} categories={careerCategories} />
          </div>
          <CareerStatsTable players={playersToDisplay} />
        </TabsContent>
        <TabsContent value="seasonal-stats" className="mt-4">
          <SeasonalStatsTable players={allPlayersInOrg} seasons={seasons} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamHistoryPage;