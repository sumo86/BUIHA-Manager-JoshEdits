import { useMemo } from 'react';
import { useTeam } from "@/context/TeamContext";
import { FacilityProjectCard } from "@/components/facilities/FacilityProjectCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FacilityProject } from '@/types';

const Upgrades = () => {
  const { userTeam, startFacilityProject, managedOrganization, organizationFacilities } = useTeam();

  if (!userTeam) {
    return <div>Loading...</div>;
  }

  const currentFacilities = useMemo(() => {
    return managedOrganization ? organizationFacilities : userTeam.facilities;
  }, [managedOrganization, organizationFacilities, userTeam.facilities]);

  const financialProjects = useMemo(() => currentFacilities?.filter(p => p.category === 'Financial') || [], [currentFacilities]);
  const developmentProjects = useMemo(() => currentFacilities?.filter(p => p.category === 'Player Development') || [], [currentFacilities]);
  const welfareProjects = useMemo(() => currentFacilities?.filter(p => p.category === 'Player Welfare') || [], [currentFacilities]);
  const recruitmentProjects = useMemo(() => currentFacilities?.filter(p => p.category === 'Recruitment') || [], [currentFacilities]);

  const renderProjectList = (projects: FacilityProject[]) => {
    if (projects.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No projects in this category.</p>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <FacilityProjectCard
            key={project.id}
            project={project}
            onStartProject={startFacilityProject}
          />
        ))}
      </div>
    );
  };

  if (!currentFacilities) {
    return <div>No upgrade projects available.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Upgrades</h1>
      <p className="text-lg text-muted-foreground">
        Invest in your team's future by purchasing upgrades. Completed projects provide long-term benefits.
      </p>
      
      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="development">Player Development</TabsTrigger>
          <TabsTrigger value="welfare">Player Welfare</TabsTrigger>
          <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
        </TabsList>
        <TabsContent value="financial" className="mt-4">
          {renderProjectList(financialProjects)}
        </TabsContent>
        <TabsContent value="development" className="mt-4">
          {renderProjectList(developmentProjects)}
        </TabsContent>
        <TabsContent value="welfare" className="mt-4">
          {renderProjectList(welfareProjects)}
        </TabsContent>
        <TabsContent value="recruitment" className="mt-4">
          {renderProjectList(recruitmentProjects)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Upgrades;