import { useState, useMemo, useEffect } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BudgetAllocations, BudgetCategory } from '@/types';
import { toast } from 'sonner';
import { Plane, Box, Calendar, UserPlus, Users, Building, Info } from 'lucide-react';

interface BudgetAllocationProps {
  initialAllocations: BudgetAllocations;
  totalBudget: number;
  onSave: (newAllocations: BudgetAllocations) => void;
}

const categoryDetails: Record<BudgetCategory, { icon: React.ElementType, description: string, tooltip: string }> = {
  "Travel": { icon: Plane, description: "Match travel and accommodation", tooltip: "Costs for away games, including transport and hotels." },
  "Equipment": { icon: Box, description: "Gear, sticks, and protective equipment", tooltip: "Includes player sticks, helmets, pads, and jerseys." },
  "Ice Time": { icon: Calendar, description: "Rental costs for home games and practices", tooltip: "This is an auto-calculated fixed cost based on your home games." },
  "Recruiting": { icon: UserPlus, description: "Player recruitment and scouting", tooltip: "Funds for scouting trips and hosting potential recruits." },
  "Student Life": { icon: Users, description: "Improves player morale through team events", tooltip: "Budget for team-building activities, dinners, and social events." },
  "Facilities": { icon: Building, description: "Upgrades and new construction", tooltip: "Long-term investments in improving team facilities." },
};

const categoryColors: Record<BudgetCategory, string> = {
  "Travel": "bg-blue-100 text-blue-800",
  "Equipment": "bg-orange-100 text-orange-800",
  "Ice Time": "bg-indigo-100 text-indigo-800",
  "Recruiting": "bg-green-100 text-green-800",
  "Student Life": "bg-pink-100 text-pink-800",
  "Facilities": "bg-purple-100 text-purple-800",
};

export const BudgetAllocation = ({ initialAllocations, totalBudget, onSave }: BudgetAllocationProps) => {
  const { userTeam, runStudentLifeInitiative } = useTeam();
  const [allocations, setAllocations] = useState<BudgetAllocations>(initialAllocations);

  const numberOfHomeGames = 13;
  const numberOfAwayGames = 13;
  
  // Use userTeam.financials for specific team costs, not consolidated org costs
  const iceTimeCost = useMemo(() => numberOfHomeGames * (userTeam?.financials.iceTimeCostPerGame || 0), [userTeam?.financials.iceTimeCostPerGame]);
  const travelCost = useMemo(() => numberOfAwayGames * 200, []);
  const equipmentCost = useMemo(() => userTeam?.financials.equipmentCost || 0, [userTeam?.financials.equipmentCost]);

  useEffect(() => {
    // Only update if the initialAllocations prop changes, to avoid resetting user input
    setAllocations(initialAllocations);
  }, [initialAllocations]);

  useEffect(() => {
    // Auto-calculate fixed costs and update allocations
    setAllocations(prev => ({ 
      ...prev, 
      "Ice Time": Math.round(iceTimeCost),
      "Travel": Math.round(travelCost),
      "Equipment": Math.round(equipmentCost),
    }));
  }, [iceTimeCost, travelCost, equipmentCost]);


  const handleAllocationChange = (category: BudgetCategory, value: string) => {
    const numberValue = parseInt(value, 10);
    if (!isNaN(numberValue) || value === '') {
      setAllocations(prev => ({
        ...prev,
        [category]: isNaN(numberValue) ? 0 : Math.round(numberValue),
      }));
    }
  };

  const totalAllocated = useMemo(() => {
    return Object.values(allocations).reduce((sum, value) => sum + (value || 0), 0);
  }, [allocations]);

  const unallocated = totalBudget - totalAllocated;

  const handleSave = () => {
    if (unallocated < 0) {
      toast.error("Total allocated budget cannot exceed the total budget.");
      return;
    }
    onSave(allocations);
    toast.success("Budget allocations saved successfully!");
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Budget Allocation</CardTitle>
          <p className="text-muted-foreground">Distribute your total budget across different categories.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(categoryDetails).map((cat) => {
            const category = cat as BudgetCategory;
            const Icon = categoryDetails[category].icon;
            const isReadOnly = ["Ice Time", "Travel", "Equipment"].includes(category);
            return (
              <div key={category} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center h-12 w-12 rounded-lg ${categoryColors[category]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{category}</h3>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{categoryDetails[category].tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm text-muted-foreground">{categoryDetails[category].description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">Spent: £0</p>
                    <p className="text-xs text-muted-foreground">0.0% of allocation used</p>
                  </div>
                  <Input
                    type="number"
                    className="w-32 text-right"
                    placeholder="0"
                    value={allocations[category]}
                    onChange={(e) => handleAllocationChange(category, e.target.value)}
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                  />
                  {category === "Student Life" && (
                    <Button 
                        variant="secondary" 
                        onClick={runStudentLifeInitiative}
                        disabled={(allocations['Student Life'] || 0) <= 0}
                    >
                        Run Initiative
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <div className="flex justify-end items-center gap-6 mt-6 p-4 bg-muted rounded-lg">
        <div className="text-right">
          <span className="text-muted-foreground">Total Allocated: </span>
          <span className="font-bold">£{totalAllocated.toLocaleString()}</span>
        </div>
        <div className="text-right">
          <span className="text-muted-foreground">Unallocated: </span>
          <span className={`font-bold ${unallocated < 0 ? 'text-destructive' : 'text-green-600'}`}>
            £{unallocated.toLocaleString()}
          </span>
        </div>
        <Button onClick={handleSave}>Save Allocations</Button>
      </div>
    </TooltipProvider>
  );
};