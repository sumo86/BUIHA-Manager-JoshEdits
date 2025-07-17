import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FacilityProject } from "@/types";
import { useTeam } from "@/context/TeamContext";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Hourglass, XCircle } from "lucide-react";

interface FacilityProjectCardProps {
  project: FacilityProject;
  onStartProject: (projectId: string) => void;
}

export const FacilityProjectCard = ({ project, onStartProject }: FacilityProjectCardProps) => {
  const { userTeam, managedOrganization, organizationFacilities } = useTeam();

  const currentFinancials = managedOrganization ? userTeam?.financials : userTeam?.financials;
  const currentBudget = currentFinancials?.currentBudget || 0;

  const teamFacilities = managedOrganization ? organizationFacilities : userTeam?.facilities;

  const isCompleted = teamFacilities?.some(f => f.id === project.id && f.status === 'Completed');
  const isInProgress = teamFacilities?.some(f => f.id === project.id && f.status === 'In Progress');

  const hasPrerequisites = project.prerequisites?.every(prereqId => 
    teamFacilities?.some(f => f.id === prereqId && f.status === 'Completed')
  ) || project.prerequisites?.length === 0;

  const canAfford = currentBudget >= project.cost;
  const canStart = !isCompleted && !isInProgress && canAfford && hasPrerequisites;

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (isInProgress) return <Hourglass className="h-5 w-5 text-yellow-500" />;
    return <XCircle className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isCompleted) return "Completed";
    if (isInProgress) return `In Progress (${project.weeksToComplete} weeks left)`;
    if (!hasPrerequisites) return "Prerequisites not met";
    if (!canAfford) return "Insufficient funds";
    return "Not Started";
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm font-medium">Cost: £{project.cost.toLocaleString()}</p>
        <p className="text-sm font-medium">Benefit: {project.benefit}</p>
        {project.weeksToComplete && (
          <p className="text-sm font-medium">Time to complete: {project.weeksToComplete} weeks</p>
        )}
        <div className="flex items-center mt-2 text-sm">
          {getStatusIcon()}
          <span className="ml-2">{getStatusText()}</span>
        </div>
        {isInProgress && project.weeksToComplete !== undefined && project.weeksToComplete > 0 && (
          <Progress value={((project.weeksToComplete || 0) / (project.weeksToComplete + 1)) * 100} className="mt-2" />
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onStartProject(project.id)}
          disabled={!canStart}
          className="w-full"
        >
          Start Project
        </Button>
      </CardFooter>
    </Card>
  );
};