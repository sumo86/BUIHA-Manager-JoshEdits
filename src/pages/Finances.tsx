import { useTeam } from "@/context/TeamContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetAllocation } from "@/components/finance/BudgetAllocation";
import { Transactions } from "@/components/finance/Transactions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMemo } from "react";

const Finances = () => {
  const { userTeam, updateBudgetAllocations, managedOrganization, organizationFinancials } = useTeam();

  if (!userTeam) {
    return <div>Loading team data...</div>;
  }

  const currentFinancials = managedOrganization ? organizationFinancials : userTeam.financials;

  if (!currentFinancials) {
    return <div>Financial data not available.</div>;
  }

  // Calculate the team's total wealth to be used for budget allocation
  const totalWealth = useMemo(() => {
    if (!currentFinancials) return 0;
    const allocated = Object.values(currentFinancials.budgetAllocations).reduce((sum, val) => sum + val, 0);
    // Total wealth is the unallocated funds (totalBudget) + all the money in allocated pots
    return currentFinancials.totalBudget + allocated;
  }, [currentFinancials]);

  const handleSaveAllocations = (newAllocations: typeof currentFinancials.budgetAllocations) => {
    updateBudgetAllocations(newAllocations);
    toast.success("Budget allocations updated!");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{managedOrganization ? `${managedOrganization} Organization` : userTeam.name} Finances</h1>
      <p className="text-lg text-muted-foreground">Manage your team's budget and track financial transactions.</p>

      <Card>
        <CardHeader>
          <CardTitle>Budget Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground">Total Unallocated Funds:</p>
              <p className="text-2xl font-bold">£{currentFinancials.totalBudget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ice Time Cost per Game:</p>
              <p className="text-2xl font-bold">£{currentFinancials.iceTimeCostPerGame.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Equipment Cost:</p>
              <p className="text-2xl font-bold">£{currentFinancials.equipmentCost.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <BudgetAllocation
        initialAllocations={currentFinancials.budgetAllocations}
        totalBudget={totalWealth}
        onSave={handleSaveAllocations}
      />

      <Transactions />
    </div>
  );
};

export default Finances;