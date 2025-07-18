import React from 'react';
import { useTeam } from '@/context/TeamContext';
import { initialUpgrades } from '@/data/upgrades';
import UpgradeCard from '@/components/upgrades/UpgradeCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const Upgrades: React.FC = () => {
  const { userTeam, updateTeam, organizationFinancials } = useTeam();

  if (!userTeam || !organizationFinancials) {
    return <div className="p-4">Loading team data...</div>;
  }

  const availableBudget = organizationFinancials.budgetAllocations.Upgrades || 0;

  const handlePurchaseUpgrade = (upgradeId: string, level: number, cost: number) => {
    if (!userTeam) return;

    if (availableBudget < cost) {
      toast.error("Insufficient Funds", {
        description: `You need £${cost.toLocaleString()} in your Upgrades budget to purchase this. You currently have £${availableBudget.toLocaleString()}.`,
      });
      return;
    }

    const updatedUpgrades = userTeam.upgrades.map(u =>
      u.upgradeId === upgradeId ? { ...u, level: level } : u
    );

    if (!userTeam.upgrades.some(u => u.upgradeId === upgradeId)) {
      updatedUpgrades.push({ upgradeId, level });
    }

    const updatedFinancials = {
      ...userTeam.financials,
      budgetAllocations: {
        ...userTeam.financials.budgetAllocations,
        Upgrades: (userTeam.financials.budgetAllocations.Upgrades || 0) - cost,
      },
    };

    updateTeam({
      ...userTeam,
      upgrades: updatedUpgrades,
      financials: updatedFinancials,
    });

    toast.success("Upgrade Purchased!", {
      description: `${initialUpgrades.find(u => u.id === upgradeId)?.name} upgraded to level ${level}.`,
    });
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold">Team Upgrades</h1>
      <p className="text-muted-foreground">Invest in permanent improvements for your team, affecting finances, player development, health, and recruitment.</p>

      <Card>
        <CardHeader>
          <CardTitle>Current Upgrades Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">£{availableBudget.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Allocate funds to the "Upgrades" category in your Finances to purchase improvements.</p>
        </CardContent>
      </Card>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialUpgrades.map(upgrade => {
          const currentLevel = userTeam.upgrades.find(u => u.upgradeId === upgrade.id)?.level || 0;
          const nextLevelCost = upgrade.levels.find(l => l.level === currentLevel + 1)?.cost || Infinity;
          const canAfford = availableBudget >= nextLevelCost;

          return (
            <UpgradeCard
              key={upgrade.id}
              upgrade={upgrade}
              currentLevel={currentLevel}
              onPurchase={handlePurchaseUpgrade}
              canAfford={canAfford}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Upgrades;