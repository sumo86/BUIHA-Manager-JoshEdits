import { useTeam } from '@/context/TeamContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeasonHistoryTable } from '@/components/buiha/SeasonHistoryTable';
import { useMemo } from 'react';

const BuihaOverview = () => {
  const { seasonHistory, seasonRecords, careerRecords } = useTeam();

  const sortedSeasonYears = useMemo(() => {
    return Object.keys(seasonHistory).sort((a, b) => parseInt(b.split('-')[0]) - parseInt(a.split('-')[0]));
  }, [seasonHistory]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">BUIHA Overview</h1>
        <p className="text-muted-foreground">Explore the history of the BUIHA.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Season Records</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(seasonRecords).length > 0 ? (
              <ul className="space-y-2">
                {Object.entries(seasonRecords).map(([category, record]) => (
                  <li key={category}>
                    <strong>{category}:</strong> {record?.playerName} ({record?.teamName}) - {record?.value}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No season records yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>All-Time Career Records</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(careerRecords).length > 0 ? (
              <ul className="space-y-2">
                {Object.entries(careerRecords).map(([category, record]) => (
                  <li key={category}>
                    <strong>{category}:</strong> {record?.playerName} ({record?.teamName}) - {record?.value}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No career records yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Season History</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedSeasonYears.length > 0 ? (
            <div className="space-y-4">
              {sortedSeasonYears.map(year => (
                <div key={year}>
                  <h3 className="text-xl font-semibold mb-2">Season {year}</h3>
                  <SeasonHistoryTable data={seasonHistory[year]} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No season history yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BuihaOverview;