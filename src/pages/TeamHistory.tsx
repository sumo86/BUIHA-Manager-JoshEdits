import { useTeam } from '@/context/TeamContext';
import { HistoryRecords } from '@/components/history/HistoryRecords';
import { RecordCategory } from '@/types';

const TeamHistoryPage = () => {
  const { userTeam, seasonRecords, careerRecords } = useTeam();

  if (!userTeam) {
    return <div>Select a team to see its history.</div>;
  }

  const skaterSeasonCategories: RecordCategory[] = ['Goals', 'Assists', 'Points', 'PenaltyMinutes'];
  const goalieSeasonCategories: RecordCategory[] = ['GAA', 'SavePercentage', 'Shutouts'];
  const careerCategories: RecordCategory[] = ['Points', 'Assists', 'Shutouts', 'PenaltyMinutes'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team History & Records</h1>
        <p className="text-lg text-muted-foreground">
          Historical records from the start of your career.
        </p>
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