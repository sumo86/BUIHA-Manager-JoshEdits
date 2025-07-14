import { useTeam } from '@/context/TeamContext';
import { AlumniTable } from '@/components/alumni/AlumniTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdditionalDegreesTable } from '@/components/alumni/AdditionalDegreesTable';

const AlumniPage = () => {
  const { alumni, additionalDegreePlayers } = useTeam();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alumni Tracker</h1>
        <p className="text-lg text-muted-foreground">
          Track the careers of players who have graduated or re-enrolled in new degrees.
        </p>
      </div>
      <Tabs defaultValue="graduated">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="graduated">Graduated Alumni</TabsTrigger>
          <TabsTrigger value="additional-degrees">Additional Degrees</TabsTrigger>
        </TabsList>
        <TabsContent value="graduated" className="mt-4">
          <AlumniTable alumni={alumni} />
        </TabsContent>
        <TabsContent value="additional-degrees" className="mt-4">
          <AdditionalDegreesTable players={additionalDegreePlayers} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlumniPage;