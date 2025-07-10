import { useTeam } from "@/context/TeamContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FacilityProjectCard } from "@/components/facilities/FacilityProjectCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Facilities = () => {
  const { userTeam, startFacilityProject, managedOrganization, organizationFacilities } = useTeam();

  if (!userTeam) {
    return <div>Loading team data...</div>;
  }

  const currentFacilities = managedOrganization ? organizationFacilities : userTeam.facilities;

  if (!currentFacilities) {
    return <div>Facility data not available.</div>;
  }

  const handleStartProject = (projectId: string) => {
    startFacilityProject(projectId);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{managedOrganization ? `${managedOrganization} Organization` : userTeam.name} Facilities</h1>
      <p className="text-lg text-muted-foreground">Upgrade your team's facilities to improve player development, recruitment, and revenue.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentFacilities.map((project) => (
          <FacilityProjectCard
            key={project.id}
            project={project}
            onStartProject={handleStartProject}
          />
        ))}
      </div>
    </div>
  );
};

export default Facilities;