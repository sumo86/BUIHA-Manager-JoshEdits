import { ScheduleEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeam } from '@/context/TeamContext';

interface NationalsScheduleProps {
  schedule: ScheduleEntry[];
  title: string;
}

const NationalsSchedule = ({ schedule, title }: NationalsScheduleProps) => {
  const { teams } = useTeam();

  const getTeamLogo = (teamName: string): string => {
    const team = teams.find(t => t.name === teamName);
    return team?.logo || '';
  };

  if (!schedule || schedule.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {schedule.map(game => (
          <div key={game.id} className="flex items-center justify-between p-2 rounded-md border">
            <div className="flex items-center gap-2 w-2/5">
              <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} className="h-6 w-6" />
              <span className="font-medium">{game.homeTeam}</span>
            </div>
            <div className="text-center">
              {game.status === 'completed' && game.result ? (
                <span className="font-bold text-lg">{game.result.homeScore} - {game.result.awayScore}</span>
              ) : (
                <span className="text-muted-foreground">vs</span>
              )}
            </div>
            <div className="flex items-center gap-2 w-2/5 justify-end">
              <span className="font-medium text-right">{game.awayTeam}</span>
              <img src={getTeamLogo(game.awayTeam)} alt={game.awayTeam} className="h-6 w-6" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default NationalsSchedule;