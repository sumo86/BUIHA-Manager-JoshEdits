import { useTeam } from "@/context/TeamContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetSummary } from "@/components/finance/BudgetSummary";
import { Transactions } from "@/components/finance/Transactions";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Building, Users, HandCoins } from "lucide-react";

const Finances = () => {
  const { userTeam, managedOrganization, organizationFinancials, runStudentLifeInitiative } = useTeam();
  const navigate = useNavigate();

  if (!userTeam) {
    return <div>Loading team data...</div>;
  }

  const currentFinancials = managedOrganization ? organizationFinancials : userTeam.financials;

  if (!currentFinancials) {
    return <div>Financial data not available.</div>;
  }
  
  const handleRunInitiative = () => {
    runStudentLifeInitiative();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{managedOrganization ? `${managedOrganization} Organization` : userTeam.name} Finances</h1>
      <p className="text-lg text-muted-foreground">Manage your team's budget and track financial transactions.</p>

      <BudgetSummary financials={currentFinancials} />

      <Card>
        <CardHeader>
          <CardTitle>Discretionary Spending</CardTitle>
          <p className="text-muted-foreground">Use your available budget to improve your team.</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col items-start gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                    <Building className="h-8 w-8 text-primary" />
                    <h3 className="text-xl font-semibold">Facilities</h3>
                </div>
                <p className="text-muted-foreground">Invest in long-term projects to upgrade your club's infrastructure.</p>
                <Button onClick={() => navigate('/facilities')}>Go to Facilities</Button>
            </div>
            <div className="flex flex-col items-start gap-4 p-4 border rounded-lg">
                 <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    <h3 className="text-xl font-semibold">Student Life Initiative</h3>
                </div>
                <p className="text-muted-foreground">Spend £500 to organize a team-building event and boost morale.</p>
                <Button onClick={handleRunInitiative} disabled={currentFinancials.currentBudget < 500}>Run Initiative</Button>
            </div>
        </CardContent>
      </Card>

      <Transactions />
    </div>
  );
};

export default Finances;