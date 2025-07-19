import { SaveGameSlot } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Upload } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SavedGameCardProps {
  save: SaveGameSlot;
  onLoad: (saveName: string) => void;
  onDelete: (saveName: string) => void;
}

export const SavedGameCard = ({ save, onLoad, onDelete }: SavedGameCardProps) => {
  const savedDate = new Date(save.savedAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{save.saveName}</CardTitle>
        <CardDescription>
          {save.userTeamName} - {save.currentDate.month} {save.currentDate.week}, {save.currentDate.year}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Saved: {savedDate.toLocaleDateString()} at {savedDate.toLocaleTimeString()}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button onClick={() => onLoad(save.saveName)} variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Load
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the save file "{save.saveName}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(save.saveName)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};