import { useTeam } from "@/context/TeamContext";
import DivisionManager from "@/components/settings/DivisionManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SimSpeed } from "@/types";

const Settings = () => {
  const { currentDate, simSpeed, updateSimSpeed } = useTeam();

  const canEdit = currentDate.month === 'August' && currentDate.week === 1;

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Display & Game Settings</CardTitle>
          <CardDescription>Manage theme and game simulation speed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-toggle">Theme</Label>
            <ModeToggle />
          </div>
          <div className="space-y-2">
            <Label>Game Simulation Speed</Label>
            <RadioGroup
              defaultValue={simSpeed}
              onValueChange={(value) => updateSimSpeed(value as SimSpeed)}
              className="flex items-center gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Slow" id="slow" />
                <Label htmlFor="slow">Slow</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Normal" id="normal" />
                <Label htmlFor="normal">Normal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Fast" id="fast" />
                <Label htmlFor="fast">Fast</Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              Affects the speed of live game simulations you watch.
            </p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">League Settings</h2>
        {canEdit ? (
          <DivisionManager />
        ) : (
          <Card>
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
    </div>
  );
};

export default Settings;