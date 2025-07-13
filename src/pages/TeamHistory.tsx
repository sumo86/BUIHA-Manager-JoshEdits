import { useMemo, useState } from 'react';
import { useTeam } from '@/context/TeamContext';
import { HistoryRecords } from '@/components/history/HistoryRecords';
import { RecordCategory, Player } from '@/types';
import { calculateRecords } from '@/lib/historyUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TeamHistoryPage = () => {
  const { userTeam, managedTeams, teams, schedule } = useTeam();
  const [filterScope, setFilterScope] = useState<'organization' | string>('organization');

  const filterOptions = useMemo(() => {
    const options = [{ value: 'organization', label: 'Organization' }];
    if (userTeam) {
      options.push({ value: userTeam.name, label: userTeam.name });
    }
    return options;
  }, [userTeam]);

  const playersToDisplay = useMemo(() => {
    if (filterScope === 'organization') {
      return managedTeams.flatMap(t => t.roster);
    }
    const selectedTeam = teams.find(t => t.name === filterScope);
    return selectedTeam ? selectedTeam.roster : [];
  }, [filterScope, managedTeams, teams]);

  const { seasonRecords, careerRecords } = useMemo(() => {
    return calculateRecords(playersToDisplay, schedule);
  }, [playersToDisplay, schedule]);

  if (!userTeam) {
    return <div>Select a team to see its history.</div>;
  }

  const skaterSeasonCategories: RecordCategory[] = ['Goals', 'Assists', 'Points', 'PenaltyMinutes'];
  const goalieSeasonCategories: RecordCategory[] = ['GAA', 'SavePercentage', 'Shutouts'];
  const careerCategories: RecordCategory[] = ['Goals', 'Points', 'Assists', 'PenaltyMinutes'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Team History & Records</h1>
          <p className="text-lg text-muted-foreground">
            Historical records from the start of your career.
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
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <HistoryRecords title="Single Season Records (Skaters)" records={seasonRecords} categories={skaterSeasonCategories} showSeason />
        <HistoryRecords title="Single Season Records (Goalies)" records={seasonRecords} categories={goalieSeasonCategories} showSeason />
        <HistoryRecords title="Career Records" records={careerRecords} categories={careerCategories} />
      </div>
    </div>
  );
};

export default TeamHistoryPage;