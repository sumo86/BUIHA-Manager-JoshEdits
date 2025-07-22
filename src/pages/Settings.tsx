import { useTeam } from "@/context/TeamContext";
import DivisionManager from "@/components/settings/DivisionManager";
import TierManager from "@/components/settings/TierManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const Settings = () => {
  const { currentDate, resetGame } = useTeam();

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

      <Card className="mt-8 border-red-500">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Use these options with caution. They will permanently alter or delete your game data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Reset Game</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your game data, including all saved games, and reset the application to its initial state.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetGame} className="bg-red-600 hover:bg-red-700">
                  Reset Game
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;