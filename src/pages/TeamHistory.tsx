import { useState, useMemo } from 'react';
import { useTeam } from '@/context/TeamContext';
import { processHistory } from '@/lib/historyUtils';
import { HistoryRecords } from '@/components/history/HistoryRecords';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen } from 'lucide-react';
import { RecordCategory } from '@/types';

const skaterCategories: RecordCategory[] = ['Goals', 'Assists', 'Points', 'PenaltyMinutes'];
const goalieCategories: RecordCategory[] = ['GAA', 'SavePercentage', 'Shutouts'];

const TeamHistory = () => {
  const { managedTeams, managedOrganization } = useTeam();
  const [selectedTeam, setSelectedTeam] = useState('all');

  const teamsToProcess = useMemo(() => {
    if (selectedTeam === 'all') {
      return managedTeams;
    }
    return managedTeams.filter(t => t.name === selectedTeam);
  }, [selectedTeam, managedTeams]);

  const records = useMemo(() => {
    return processHistory(teamsToProcess);
  }, [teamsToProcess]);

  if (!managedOrganization) {
    return <div>Select an organization to view its history.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{managedOrganization} History</h1>
          <p className="text-lg text-muted-foreground">
            Franchise records for single season and career achievements.
          </p>
        </div>
        <BookOpen className="h-10 w-10 text-primary" />
      </div>

      <div>
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Filter by team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {managedTeams.map(team => (
              <SelectItem key={team.name} value={team.name}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <HistoryRecords 
          title="Single Season Skater Records"
          records={records.season}
          categories={skaterCategories}
          showSeason
        />
        <HistoryRecords 
          title="Career Skater Records"
          records={records.career}
          categories={skaterCategories}
        />
        <HistoryRecords 
          title="Single Season Goalie Records"
          records={records.season}
          categories={goalieCategories}
          showSeason
        />
        <HistoryRecords 
          title="Career Goalie Records"
          records={records.career}
          categories={goalieCategories}
        />
      </div>
    </div>
  );
};

export default TeamHistory;