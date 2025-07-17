import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FacilityProject } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Badge } from "../ui/badge";
import { CheckCircle, Construction, DollarSign, TrendingUp } from "lucide-react";

interface FacilityProjectCardProps {
  project: FacilityProject;
  onStartProject: (projectId: string) => void;
}

const getStatusInfo = (status: FacilityProject['status']) => {
  switch (status) {
    case 'Completed':
      return { text: 'Completed', color: 'bg-green-500', icon: <CheckCircle className="h-4 w-4" /> };
    case 'In Progress':
      return { text: 'In Progress', color: 'bg-yellow-500', icon: <Construction className="h-4 w-4" /> };
    default:
      return { text: 'Not Started', color: 'bg-gray-500', icon: null };
  }
}

const getLiveBenefit = (project: FacilityProject) => {
  if (project.status !== 'Completed') return null;

  switch (project.id) {
    case 'merch_store_1':
      return `Total Income Generated: $${project.incomeGenerated || 0}`;
    case 'rink_ads_1':
      return `Provides $5000 at the start of each season.`;
    case 'team_bus_1':
      return `Reduces away game travel costs by 50%.`;
    case 'social_media_1':
      return `Increases merchandise and ticket income by 15%.`;
    case 'training_gym_1':
      return `Boosts physical attribute development.`;
    case 'video_room_1':
      return `Boosts mental attribute development.`;
    default:
      return null;
  }
};

export const FacilityProjectCard = ({ project, onStartProject }: FacilityProjectCardProps) => {
  const statusInfo = getStatusInfo(project.status);
  const liveBenefit = getLiveBenefit(project);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <Badge variant="secondary" className={`flex items-center gap-1 ${statusInfo.color} text-white`}>
            {statusInfo.icon}
            {statusInfo.text}
          </Badge>
        </div>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{project.benefit}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 pt-4 border-t">
        {liveBenefit && (
          <div className="flex items-center text-sm font-semibold text-green-600">
            <TrendingUp className="h-4 w-4 mr-2" />
            {liveBenefit}
          </div>
        )}
        <div className="flex justify-between items-center w-full">
          <div className="text-lg font-bold">${project.cost.toLocaleString()}</div>
          {project.status === 'Not Started' && (
            <Button onClick={() => onStartProject(project.id)}>
              <Construction className="mr-2 h-4 w-4" />
              Start Project
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};