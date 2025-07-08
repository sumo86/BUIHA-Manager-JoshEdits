import { useTeam } from '@/context/TeamContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FacilityProjectCard } from '@/components/facilities/FacilityProjectCard';

const Facilities = () => {
  const { userTeam } = useTeam();
  const facilitiesBudget = userTeam.financials.budgetAllocations.Facilities;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Facilities</h1>
          <p className="text-lg text-muted-foreground">
            Invest in your team's future by upgrading your facilities.
          </p>
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Facilities Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{facilitiesBudget.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {userTeam.facilities.map(project => (
          <FacilityProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
};

export default Facilities;