import { useTeam } from '@/context/TeamContext';
import { AlumniTable } from '@/components/alumni/AlumniTable';
import { AdditionalDegreesTable } from '@/components/alumni/AdditionalDegreesTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AlumniPage = () => {
  const { alumni, userTeam } = useTeam();

  const continuingPlayers = userTeam?.roster.filter(p => p.isContinuingEducation) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alumni Tracker</h1>
        <p className="text-lg text-muted-foreground">
          Track the careers of players who have graduated from your organization.
        </p>
      </div>
      <Tabs defaultValue="graduated" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="graduated">Graduated Alumni</TabsTrigger>
          <TabsTrigger value="continuing">Continuing Education</TabsTrigger>
        </TabsList>
        <TabsContent value="graduated">
          <AlumniTable alumni={alumni} />
        </TabsContent>
        <TabsContent value="continuing">
          <AdditionalDegreesTable players={continuingPlayers} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlumniPage;