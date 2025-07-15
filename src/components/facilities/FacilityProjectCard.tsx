import { useTeam } from '@/context/TeamContext';
import { FacilityProject } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface FacilityProjectCardProps {
  project: FacilityProject;
}

export const FacilityProjectCard = ({ project }: FacilityProjectCardProps) => {
  const { userTeam, updateTeam } = useTeam();

  const handleStartProject = () => {
    if (!userTeam) return;

    const cost = project.cost;
    const currentBudget = userTeam.financials.budgetAllocations.Facilities;

    if (currentBudget < cost) {
      toast.error("Insufficient Facilities Budget", {
        description: `You need £${cost.toLocaleString()} but only have £${currentBudget.toLocaleString()} available.`,
      });
      return;
    }

    const newBudgetAllocations = {
      ...userTeam.financials.budgetAllocations,
      Facilities: Math.round(currentBudget - cost),
    };

    const weeks = project.weeksToComplete || 4;
    const updatedProject: FacilityProject = { ...project, status: 'In Progress', weeksToComplete: weeks, initialWeeksToComplete: weeks };
    const newFacilities = userTeam.facilities.map(p => p.id === project.id ? updatedProject : p);

    updateTeam({ 
      ...userTeam, 
      facilities: newFacilities,
      financials: { ...userTeam.financials, budgetAllocations: newBudgetAllocations }
    });
    toast.success(`Started ${project.name}!`, {
      description: `Cost: £${cost.toLocaleString()}. Remaining budget: £${(currentBudget - cost).toLocaleString()}`,
    });
  };

  const progressValue = (project.status === 'In Progress' && project.initialWeeksToComplete && project.weeksToComplete) 
    ? ((project.initialWeeksToComplete - project.weeksToComplete) / project.initialWeeksToComplete) * 100 
    : 0;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{project.description}</p>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div>
          <p className="text-lg font-bold mb-2">Cost: £{project.cost.toLocaleString()}</p>
          {project.status === 'Not Started' && (
            <Button onClick={handleStartProject} className="w-full">Start Project</Button>
          )}
          {project.status === 'In Progress' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">In Progress: {project.weeksToComplete} weeks remaining</p>
              <Progress value={progressValue} />
            </div>
          )}
          {project.status === 'Completed' && (
            <p className="text-green-600 font-semibold">Completed</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};