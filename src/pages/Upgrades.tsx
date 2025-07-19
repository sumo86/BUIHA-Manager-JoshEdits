import { useTeam } from "@/context/TeamContext";
import { FacilityProjectCard } from "@/components/facilities/FacilityProjectCard";

const Upgrades = () => {
  const { userTeam, startFacilityProject, managedOrganization, organizationFacilities } = useTeam();

  if (!userTeam) {
    return <div>Loading...</div>;
  }

  const currentFacilities = managedOrganization ? organizationFacilities : userTeam.facilities;

  if (!currentFacilities) {
    return <div>No upgrade projects available.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Upgrades</h1>
      <p className="text-lg text-muted-foreground">
        Invest in your team's future by purchasing upgrades. Completed projects provide long-term benefits.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentFacilities.map((project) => (
          <FacilityProjectCard
            key={project.id}
            project={project}
            onStartProject={startFacilityProject}
          />
        ))}
      </div>
    </div>
  );
};

export default Upgrades;