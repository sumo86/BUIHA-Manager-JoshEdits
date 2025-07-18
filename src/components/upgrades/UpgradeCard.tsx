import { Upgrade, TeamUpgrade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface UpgradeCardProps {
  upgrade: Upgrade;
  teamUpgrades: TeamUpgrade[];
  upgradesBudget: number;
  onPurchase: (upgradeId: string, level: number, cost: number) => void;
}

export const UpgradeCard = ({ upgrade, teamUpgrades, upgradesBudget, onPurchase }: UpgradeCardProps) => {
  const currentTeamUpgrade = teamUpgrades.find(u => u.upgradeId === upgrade.id);
  const currentLevel = currentTeamUpgrade?.level || 0;
  const isMaxLevel = currentLevel >= upgrade.maxLevel;

  const nextLevelInfo = !isMaxLevel ? upgrade.levels.find(l => l.level === currentLevel + 1) : null;

  const handlePurchase = () => {
    if (nextLevelInfo) {
      onPurchase(upgrade.id, nextLevelInfo.level, nextLevelInfo.cost);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span>{upgrade.name}</span>
          <Badge variant="secondary">
            Lvl {currentLevel} / {upgrade.maxLevel}
          </Badge>
        </CardTitle>
        <CardDescription>{upgrade.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-1">Current Bonus</h4>
          <p className="text-sm text-muted-foreground">
            {currentLevel > 0 ? upgrade.levels.find(l => l.level === currentLevel)?.description : 'None'}
          </p>
        </div>
        {nextLevelInfo && (
          <div>
            <h4 className="font-semibold text-sm mb-1">Next Level ({nextLevelInfo.level})</h4>
            <p className="text-sm text-muted-foreground">
              {nextLevelInfo.description}
            </p>
          </div>
        )}
        {isMaxLevel && (
            <p className="text-sm font-semibold text-green-600">Max level reached!</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="w-full">
            <Progress value={(currentLevel / upgrade.maxLevel) * 100} className="h-2" />
        </div>
        {nextLevelInfo && (
          <Button 
            onClick={handlePurchase} 
            disabled={upgradesBudget < nextLevelInfo.cost}
            className="w-full"
          >
            Upgrade for £{nextLevelInfo.cost.toLocaleString()}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};