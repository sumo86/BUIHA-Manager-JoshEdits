import { useTeam } from '@/context/TeamContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const months = ["August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June", "July"];

const Calendar = () => {
  const { currentDate } = useTeam();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Season Calendar</h1>
      <Card>
        <CardHeader>
          <CardTitle>{currentDate.year} - {currentDate.year + 1} Season</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {months.map(month => (
              <div key={month} className={`border rounded-lg p-4 ${month === currentDate.month ? 'border-primary bg-primary/5' : ''}`}>
                <h3 className="font-semibold text-lg mb-2">{month}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map(week => (
                    <div key={week} className={`text-center p-2 rounded ${month === currentDate.month && week === currentDate.week ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
                      Week {week}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-6 text-center">
            Full game schedule coming soon. Advance the week from the Dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Calendar;