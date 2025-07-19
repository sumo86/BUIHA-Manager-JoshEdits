import { useMemo } from 'react';
import { useTeam } from "@/context/TeamContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Plane, Box, Calendar as CalendarIcon } from 'lucide-react';

const Finances = () => {
  const { userTeam, managedOrganization, organizationFinancials } = useTeam();

  const numberOfHomeGames = 13;
  const numberOfAwayGames = 13;
  const travelCostPerGame = 200;

  const currentFinancials = useMemo(() => {
    if (managedOrganization) return organizationFinancials;
    return userTeam?.financials;
  }, [userTeam, managedOrganization, organizationFinancials]);

  const fixedCosts = useMemo(() => {
    if (!userTeam || !currentFinancials) return { iceTime: 0, travel: 0, equipment: 0, total: 0 };
    
    const iceTime = numberOfHomeGames * currentFinancials.iceTimeCostPerGame;
    const travel = numberOfAwayGames * travelCostPerGame;
    const equipment = currentFinancials.equipmentCost;
    const total = iceTime + travel + equipment;

    return { iceTime, travel, equipment, total };
  }, [userTeam, currentFinancials]);

  if (!userTeam || !currentFinancials) {
    return <div>Loading team data...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{managedOrganization ? `${managedOrganization} Organization` : userTeam.name} Finances</h1>
      <p className="text-lg text-muted-foreground">Manage your team's budget and track financial transactions.</p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Budget Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg">
              <p className="text-3xl font-bold">£{currentFinancials.totalBudget?.toLocaleString() || 0}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-3xl font-bold text-green-600">£{currentFinancials.discretionaryBudget?.toLocaleString() || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Season Fixed Costs</CardTitle>
          <p className="text-muted-foreground">These costs are automatically deducted from your total budget at the start of the season.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <span>Ice Time ({numberOfHomeGames} home games)</span>
              </div>
              <span className="font-mono">£{fixedCosts.iceTime?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Plane className="h-5 w-5 text-muted-foreground" />
                <span>Travel ({numberOfAwayGames} away games)</span>
              </div>
              <span className="font-mono">£{fixedCosts.travel?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Box className="h-5 w-5 text-muted-foreground" />
                <span>Equipment</span>
              </div>
              <span className="font-mono">£{fixedCosts.equipment?.toLocaleString() || 0}</span>
            </div>
          </div>
          <div className="flex justify-between items-center p-3 mt-4 border-t">
            <span className="font-semibold">Total Fixed Costs</span>
            <span className="font-bold font-mono">£{fixedCosts.total?.toLocaleString() || 0}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Finances;