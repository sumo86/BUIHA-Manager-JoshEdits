import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upgrade, TeamUpgrade } from '@/types';
import { DollarSign, TrendingUp, Heart, Users, Brain } from 'lucide-react';

interface UpgradeCardProps {
  upgrade: Upgrade;
  currentLevel: number;
  onPurchase: (upgradeId: string, level: number, cost: number) => void;
  canAfford: boolean;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Financial':
      return <DollarSign className="h-5 w-5" />;
    case 'Player Development':
      return <TrendingUp className="h-5 w-5" />;
    case 'Health & Wellness':
      return <Heart className="h-5 w-5" />;
    case 'Recruitment':
      return <Users className="h-5 w-5" />;
    default:
      return <Brain className="h-5 w-5" />;
  }
};

const UpgradeCard: React.FC<UpgradeCardProps> = ({ upgrade, currentLevel, onPurchase, canAfford }) => {
  const nextLevelData = upgrade.levels.find(level => level.level === currentLevel + 1);
  const isMaxLevel = currentLevel >= upgrade.maxLevel;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{upgrade.name}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          {getCategoryIcon(upgrade.category)}
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-2">{upgrade.description}</p>
          <div className="mb-4">
            <p className="text-sm font-medium">Current Level: {currentLevel}</p>
            <Progress value={(currentLevel / upgrade.maxLevel) * 100} className="w-full" />
          </div>
          {isMaxLevel ? (
            <p className="text-sm text-green-600 font-semibold">Max Level Reached!</p>
          ) : (
            <>
              <p className="text-sm font-medium">Next Level ({nextLevelData?.level}):</p>
              <p className="text-sm text-muted-foreground">{nextLevelData?.description}</p>
              <p className="text-lg font-bold mt-2">Cost: £{nextLevelData?.cost.toLocaleString()}</p>
            </>
          )}
        </div>
        <Button
          onClick={() => nextLevelData && onPurchase(upgrade.id, nextLevelData.level, nextLevelData.cost)}
          disabled={isMaxLevel || !canAfford}
          className="mt-4 w-full"
        >
          {isMaxLevel ? 'Fully Upgraded' : `Purchase Level ${nextLevelData?.level}`}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UpgradeCard;