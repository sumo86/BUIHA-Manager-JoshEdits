import { useTeam } from '@/context/TeamContext';
import { AlumniTable } from '@/components/alumni/AlumniTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdditionalDegreesTable } from '@/components/alumni/AdditionalDegreesTable';
import { useMemo } from 'react';

const AlumniPage = () => {
  const { alumni, userTeam } = useTeam();

  const playersWithAdditionalDegrees = useMemo(() => {
    return userTeam?.roster.filter(p => p.isContinuingEducation) || [];
  }, [userTeam]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alumni Tracker</h1>
        <p className="text-lg text-muted-foreground">
          Track the careers of players who have graduated from your organization.
        </p>
      </div>
      <Tabs defaultValue="alumni">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="alumni">Alumni</TabsTrigger>
          <TabsTrigger value="additional-degrees">Additional Degrees</TabsTrigger>
        </TabsList>
        <TabsContent value="alumni">
          <AlumniTable alumni={alumni} />
        </TabsContent>
        <TabsContent value="additional-degrees">
          <AdditionalDegreesTable players={playersWithAdditionalDegrees} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlumniPage;