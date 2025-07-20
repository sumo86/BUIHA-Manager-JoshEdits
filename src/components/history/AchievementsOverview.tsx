import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Achievement } from '@/types';
import { Trophy } from 'lucide-react';

interface AchievementsOverviewProps {
  achievements: Achievement[];
  title: string;
}

export const AchievementsOverview = ({ achievements, title }: AchievementsOverviewProps) => {
  const safeAchievements = Array.isArray(achievements) ? achievements : [];

  const divisionTitles = useMemo(() => safeAchievements.filter(a => a.type === 'Division Title'), [safeAchievements]);
  const nationalsGold = useMemo(() => safeAchievements.filter(a => a.type === 'Nationals Gold'), [safeAchievements]);
  const nationalsSilver = useMemo(() => safeAchievements.filter(a => a.type === 'Nationals Silver'), [safeAchievements]);

  const hasAchievements = divisionTitles.length > 0 || nationalsGold.length > 0 || nationalsSilver.length > 0;

  const renderAchievementList = (list: Achievement[], name: string) => {
    if (list.length === 0) return null;
    
    return (
        <div>
            <h4 className="font-semibold text-lg">{name} ({list.length})</h4>
            <ul className="list-disc list-inside text-muted-foreground">
                {list.map((ach, index) => (
                    <li key={`${ach.season}-${ach.division}-${index}`}>{ach.division} - {ach.season}</li>
                ))}
            </ul>
        </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasAchievements ? (
          <>
            {renderAchievementList(divisionTitles, 'Division Titles')}
            {renderAchievementList(nationalsGold, 'Nationals Gold Titles')}
            {renderAchievementList(nationalsSilver, 'Nationals Silver Titles')}
          </>
        ) : (
          <p className="text-muted-foreground text-center py-4">No honours recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
};