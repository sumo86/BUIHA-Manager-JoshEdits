import { useTeam } from "@/context/TeamContext";
import { allUpgrades } from "@/data/upgrades";
import UpgradeCard from "@/components/upgrades/UpgradeCard";
import { NavLink } from "react-router-dom";

const Upgrades = () => {
  const { userTeam } = useTeam();

  if (!userTeam) {
    return <div>Loading...</div>;
  }

  const facilitiesBudget = userTeam.financials.budgetAllocations.Facilities;
  const totalBudget = userTeam.financials.totalBudget;
  const spentBudget = Object.values(userTeam.financials.budgetAllocations).reduce((a, b) => a + b, 0);
  const remainingBudget = totalBudget - spentBudget;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">Upgrades</h1>
      <p className="text-muted-foreground mb-6">
        Purchase permanent upgrades for your organization to gain passive bonuses. Upgrades are purchased from the 'Facilities' budget category.
      </p>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Budget</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">Remaining University Budget</h3>
                <p className="text-2xl font-bold">£{remainingBudget.toLocaleString()}</p>
            </div>
            <div className="p-4 border rounded-lg bg-secondary">
                <h3 className="text-sm font-medium text-muted-foreground">Allocated to Facilities</h3>
                <p className="text-2xl font-bold">£{facilitiesBudget.toLocaleString()}</p>
            </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">You can change your budget allocations on the <NavLink to="/finances" className="underline hover:text-primary">Finances</NavLink> page.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allUpgrades.map((upgrade) => (
          <UpgradeCard
            key={upgrade.id}
            upgrade={upgrade}
          />
        ))}
      </div>
    </div>
  );
};

export default Upgrades;