import { useTeam } from "@/context/TeamContext";
import { BudgetSummary } from "@/components/finance/BudgetSummary";
import { BudgetAllocation } from "@/components/finance/BudgetAllocation";
import { Transactions } from "@/components/finance/Transactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Finances = () => {
  const { userTeam } = useTeam();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Management</h1>
        <p className="text-lg text-muted-foreground">
          Manage your team's budget and track expenses.
        </p>
      </div>

      <BudgetSummary financials={userTeam.financials} />

      <Tabs defaultValue="allocation">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="allocation">Budget Allocation</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="allocation" className="mt-4">
          <BudgetAllocation />
        </TabsContent>
        <TabsContent value="transactions" className="mt-4">
          <Transactions />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Finances;