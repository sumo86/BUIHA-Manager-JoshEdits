import { useTeam } from "@/context/TeamContext";
import { initialUpgrades } from "@/data/upgrades";
import { UpgradeCard } from "@/components/upgrades/UpgradeCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const UpgradesPage = () => {
  const { userTeam, purchaseUpgrade } = useTeam();

  if (!userTeam) {
    return <div>Loading team data...</div>;
  }

  const upgradesBudget = userTeam.financials.budgetAllocations.Upgrades || 0;

  const categories = [...new Set(initialUpgrades.map(u => u.category))];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Team Upgrades</h1>
      <p className="text-lg text-muted-foreground">
        Invest in permanent upgrades to improve your team's performance and financial stability.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Upgrades Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">£{upgradesBudget.toLocaleString()}</p>
          <p className="text-muted-foreground">
            Allocate more funds in the Finances screen to purchase new upgrades.
          </p>
        </CardContent>
      </Card>

      {categories.map(category => (
        <div key={category}>
          <h2 className="text-2xl font-semibold mb-4">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialUpgrades
              .filter(u => u.category === category)
              .map(upgrade => (
                <UpgradeCard
                  key={upgrade.id}
                  upgrade={upgrade}
                  teamUpgrades={userTeam.upgrades}
                  upgradesBudget={upgradesBudget}
                  onPurchase={purchaseUpgrade}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UpgradesPage;