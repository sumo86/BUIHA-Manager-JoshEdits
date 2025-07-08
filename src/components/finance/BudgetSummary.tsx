import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Financials } from "@/types";

interface BudgetSummaryProps {
  financials: Financials;
}

export const BudgetSummary = ({ financials }: BudgetSummaryProps) => {
  const totalExpenses = 0; // Placeholder
  const totalIncome = 0; // Placeholder

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">£{financials.totalBudget.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Season allocation</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">£{totalExpenses.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Spent this season</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">£{totalIncome.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Generated this season</p>
        </CardContent>
      </Card>
    </div>
  );
};