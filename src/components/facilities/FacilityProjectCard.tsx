import { useTeam } from '@/context/TeamContext';
import { FacilityProject } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Construction, Circle } from 'lucide-react';

interface FacilityProjectCardProps {
  project: FacilityProject;
  onStartProject: (projectId: string) => void;
}

const statusDetails = {
  'Not Started': { icon: Circle, color: 'text-muted-foreground', badge: 'secondary' },
  'In Progress': { icon: Construction, color: 'text-yellow-500', badge: 'default' },
  'Completed': { icon: CheckCircle, color: 'text-green-500', badge: 'outline' },
};

export const FacilityProjectCard = ({ project, onStartProject }: FacilityProjectCardProps) => {
  const { userTeam, managedOrganization, organizationFinancials } = useTeam();
  
  // Determine the correct facilities budget based on whether an organization is managed
  const facilitiesBudget = managedOrganization 
    ? (organizationFinancials?.discretionaryBudget || 0) // Updated to use discretionaryBudget
    : (userTeam?.financials.discretionaryBudget || 0); // Updated to use discretionaryBudget

  const canAfford = facilitiesBudget >= project.cost;
  const isNotStarted = project.status === 'Not Started';

  const StatusIcon = statusDetails[project.status].icon;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{project.name}</span>
          <Badge variant={statusDetails[project.status].badge as any}>{project.status}</Badge>
        </CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <p className="text-sm font-semibold">Benefit</p>
          <p className="text-sm text-muted-foreground">{project.benefit}</p>
        </div>
        <div>
          <p className="text-sm font-semibold">Cost</p>
          <p className="text-sm text-muted-foreground">£{project.cost.toLocaleString()}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          onClick={() => onStartProject(project.id)}
          disabled={!isNotStarted || !canAfford}
        >
          {isNotStarted ? (canAfford ? 'Start Project' : 'Insufficient Funds') : 'Project Completed'}
        </Button>
      </CardFooter>
    </Card>
  );
};