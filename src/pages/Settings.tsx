import { useTeam } from "@/context/TeamContext";
import DivisionManager from "@/components/settings/DivisionManager";
import TierManager from "@/components/settings/TierManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
  const { currentDate } = useTeam();

  const canEdit = currentDate.month === 'August' && currentDate.week === 1;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">League Settings</h1>
      
      {canEdit ? (
        <div>
          <TierManager />
          <Separator className="my-8" />
          <DivisionManager />
        </div>
      ) : (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Editing Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>League structure and division assignments can only be edited during the pre-season.</p>
            <p className="font-semibold mt-2">Please advance to August, Week 1 to make changes.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Settings;