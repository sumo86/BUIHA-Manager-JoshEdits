import { useMemo } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BudgetAllocation } from '@/components/finance/BudgetAllocation';
import { Financials } from '@/types';

const Finances = () => {
  const { userTeam, managedOrganization, organizationFinancials, updateBudgetAllocations, isManagingOrg } = useTeam();

  const currentFinancials: Financials | null = useMemo(() => {
    if (isManagingOrg && organizationFinancials) {
      return organizationFinancials;
    }
    return userTeam ? userTeam.financials : null;
  }, [userTeam, isManagingOrg, organizationFinancials]);

  if (!currentFinancials) {
    return <div>Loading financial data...</div>;
  }

  const totalBudget = currentFinancials.totalBudget;
  const budgetAllocations = currentFinancials.budgetAllocations;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Finances</h1>
          <p className="text-muted-foreground">Manage your team's budget and financial health.</p>
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalBudget.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <BudgetAllocation 
        initialAllocations={budgetAllocations} 
        totalBudget={totalBudget} 
        onSave={updateBudgetAllocations} 
      />
    </div>
  );
};

export default Finances;