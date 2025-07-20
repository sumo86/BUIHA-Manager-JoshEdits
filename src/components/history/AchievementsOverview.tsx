import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Achievement } from '@/types';
import { Trophy } from 'lucide-react';

interface AchievementsOverviewProps {
  achievements: Achievement[];
  title: string;
}

export const AchievementsOverview = ({ achievements, title }: AchievementsOverviewProps) => {
  const divisionTitles = useMemo(() => achievements.filter(a => a.type === 'Division Title'), [achievements]);
  const nationalsGold = useMemo(() => achievements.filter(a => a.type === 'Nationals Gold'), [achievements]);
  const nationalsSilver = useMemo(() => achievements.filter(a => a.type === 'Nationals Silver'), [achievements]);

  const renderAchievementList = (list: Achievement[], name: string) => (
    <div>
      <h4 className="font-semibold text-lg">{name} ({list.length})</h4>
      {list.length > 0 ? (
        <ul className="list-disc list-inside text-muted-foreground">
          {list.map((ach, index) => (
            <li key={index}>{ach.division} - {ach.season}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">None</p>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderAchievementList(divisionTitles, 'Division Titles')}
        {renderAchievementList(nationalsGold, 'Nationals Gold Titles')}
        {renderAchievementList(nationalsSilver, 'Nationals Silver Titles')}
      </CardContent>
    </Card>
  );
};