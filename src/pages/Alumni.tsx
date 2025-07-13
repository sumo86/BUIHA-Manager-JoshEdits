import { useTeam } from "@/context/TeamContext";
import { AlumniTable } from "@/components/alumni/AlumniTable";
import { StayingPlayersTable } from "@/components/alumni/StayingPlayersTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Alumni = () => {
  const { alumni, stayingPlayers } = useTeam();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Alumni & Player Progression</h1>
      <Tabs defaultValue="departed">
        <TabsList>
          <TabsTrigger value="departed">Departed Alumni</TabsTrigger>
          <TabsTrigger value="staying">Staying Players</TabsTrigger>
        </TabsList>
        <TabsContent value="departed">
          <AlumniTable alumni={alumni} />
        </TabsContent>
        <TabsContent value="staying">
          <StayingPlayersTable players={stayingPlayers || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Alumni;