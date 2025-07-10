import { useTeam } from '@/context/TeamContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const months = ["August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June", "July"];

const Calendar = () => {
  const { currentDate, schedule, userTeam } = useTeam();

  // Filter schedule for games involving the user's team
  const userTeamGames = schedule.filter(game => 
    userTeam && (game.homeTeam === userTeam.name || game.awayTeam === userTeam.name)
  );

  // Group games by month and week
  const gamesByMonthAndWeek: { [key: string]: { [key: number]: typeof userTeamGames } } = {};
  userTeamGames.forEach(game => {
    const monthKey = game.date.month;
    const weekKey = game.date.week;
    if (!gamesByMonthAndWeek[monthKey]) {
      gamesByMonthAndWeek[monthKey] = {};
    }
    if (!gamesByMonthAndWeek[monthKey][weekKey]) {
      gamesByMonthAndWeek[monthKey][weekKey] = [];
    }
    gamesByMonthAndWeek[monthKey][weekKey].push(game);
  });

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
              <div key={month} className={cn(
                "border rounded-lg p-4",
                month === currentDate.month ? 'border-primary bg-primary/5' : ''
              )}>
                <h3 className="font-semibold text-lg mb-2">{month}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map(week => (
                    <div key={week} className={cn(
                      "text-center p-2 rounded",
                      month === currentDate.month && week === currentDate.week ? 'bg-primary text-primary-foreground' : 'bg-muted/50'
                    )}>
                      Week {week}
                      {gamesByMonthAndWeek[month] && gamesByMonthAndWeek[month][week] && (
                        <div className="mt-1 text-xs space-y-1">
                          {gamesByMonthAndWeek[month][week].map(game => (
                            <div key={game.id} className="bg-background p-1 rounded">
                              {game.homeTeam === userTeam?.name ? (
                                <>vs {game.awayTeam} (H)</>
                              ) : (
                                <>@ {game.homeTeam} (A)</>
                              )}
                              {game.status === 'completed' && game.result && (
                                <span className="ml-1 font-bold">
                                  {game.homeTeam === userTeam?.name ? 
                                    `${game.result.homeScore}-${game.result.awayScore}` : 
                                    `${game.result.awayScore}-${game.result.homeScore}`}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {schedule.length === 0 && (
            <p className="text-muted-foreground mt-6 text-center">
              The season schedule will be generated in August, Week 2. Advance the week to continue.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Calendar;