import { useMemo } from 'react';
import { useTeam } from "@/context/TeamContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Plane, Box, Calendar as CalendarIcon, Building2 } from 'lucide-react';
import { getGamesPlayedForDivision } from '@/lib/playerGenerator';

const Finances = () => {
  const { userTeam, managedOrganization, organizationFinancials, isManagingOrg, managedTeams } = useTeam();

  const gameCounts = useMemo(() => {
    if (!userTeam) return { home: 0, away: 0 };
    const totalGames = getGamesPlayedForDivision(userTeam.leagueDivision);
    const home = Math.floor(totalGames / 2);
    const away = Math.ceil(totalGames / 2);
    return { home, away };
  }, [userTeam]);

  const travelCostPerGame = 500;
  const iceTimeCostPerGame = 350;

  const currentFinancials = useMemo(() => {
    if (isManagingOrg) return organizationFinancials;
    return userTeam?.financials;
  }, [userTeam, isManagingOrg, organizationFinancials]);

  const fixedCosts = useMemo(() => {
    if (!userTeam || !currentFinancials) return { iceTime: 0, travel: 0, equipment: 0, total: 0 };
    
    const iceTime = gameCounts.home * iceTimeCostPerGame;
    const travel = gameCounts.away * travelCostPerGame;
    const equipment = currentFinancials.equipmentCost;
    const total = iceTime + travel + equipment;

    return { iceTime, travel, equipment, total };
  }, [userTeam, currentFinancials, gameCounts]);

  const orgBudgetBreakdown = useMemo(() => {
    if (isManagingOrg || !managedOrganization || !userTeam || managedTeams.length <= 1) return null;

    const orgTotalBudget = managedTeams.reduce((sum, t) => sum + (t.financials?.totalBudget || 0), 0);
    const otherTeamsBudget = managedTeams
        .filter(t => t.name !== userTeam.name)
        .reduce((sum, t) => sum + (t.financials?.totalBudget || 0), 0);

    return {
        orgTotalBudget,
        otherTeamsBudget,
        otherTeamCount: managedTeams.length - 1,
    };
  }, [isManagingOrg, managedOrganization, managedTeams, userTeam]);

  if (!userTeam || !currentFinancials) {
    return <div>Loading team data...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{isManagingOrg ? `${managedOrganization} Organization` : userTeam.name} Finances</h1>
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
              <p className="text-muted-foreground">Total Season Budget</p>
              <p className="text-3xl font-bold">£{(currentFinancials.totalBudget || 0).toLocaleString()}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-muted-foreground">Discretionary Spend Available</p>
              <p className="text-3xl font-bold text-green-600">£{(currentFinancials.discretionaryBudget || 0).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {orgBudgetBreakdown && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Building2 className="mr-2 h-5 w-5" />
                    Organization Budget Allocation
                </CardTitle>
                <p className="text-muted-foreground pt-1">
                    Your team is part of the {managedOrganization} organization. Here's how the total budget is allocated across the teams.
                </p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Organization Total Budget</span>
                    <span className="font-mono font-semibold">£{orgBudgetBreakdown.orgTotalBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3">
                    <span>Your Team's Budget Allocation</span>
                    <span className="font-mono">£{(userTeam.financials.totalBudget || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3">
                    <span>Budget for other teams ({orgBudgetBreakdown.otherTeamCount})</span>
                    <span className="font-mono">£{orgBudgetBreakdown.otherTeamsBudget.toLocaleString()}</span>
                </div>
            </CardContent>
        </Card>
      )}

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
                <span>Ice Time ({gameCounts.home} home games)</span>
              </div>
              <span className="font-mono">£{fixedCosts.iceTime.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Plane className="h-5 w-5 text-muted-foreground" />
                <span>Travel ({gameCounts.away} away games)</span>
              </div>
              <span className="font-mono">£{fixedCosts.travel.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Box className="h-5 w-5 text-muted-foreground" />
                <span>Equipment</span>
              </div>
              <span className="font-mono">£{fixedCosts.equipment.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex justify-between items-center p-3 mt-4 border-t">
            <span className="font-semibold">Total Fixed Costs</span>
            <span className="font-bold font-mono">£{fixedCosts.total.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Finances;