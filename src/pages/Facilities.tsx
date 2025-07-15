import { useTeam } from '@/context/TeamContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FacilityProjectCard } from '@/components/facilities/FacilityProjectCard';
import { useMemo } from 'react';

const Facilities = () => {
  const { userTeam, organizationFacilities, isManagingOrg } = useTeam();

  const facilitiesToDisplay = useMemo(() => {
    if (isManagingOrg && organizationFacilities) {
      return organizationFacilities;
    }
    return userTeam ? userTeam.facilities : [];
  }, [userTeam, isManagingOrg, organizationFacilities]);

  if (!userTeam) {
    return <div>Loading facilities data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Facilities</h1>
        <p className="text-muted-foreground">Upgrade your team's infrastructure to improve player development and morale.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facilitiesToDisplay.map(project => (
          <FacilityProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
};

export default Facilities;