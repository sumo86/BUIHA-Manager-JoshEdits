import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Financials } from "@/types";

interface BudgetSummaryProps {
  financials: Financials;
}

export const BudgetSummary = ({ financials }: BudgetSummaryProps) => {
  const totalExpenses = financials.seasonBudget - financials.currentBudget;
  const remainingBudget = financials.currentBudget;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Season Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">£{financials.seasonBudget.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Initial allocation for the season</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">£{totalExpenses.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Spent so far this season</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">£{remainingBudget.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Available to spend</p>
        </CardContent>
      </Card>
    </div>
  );
};