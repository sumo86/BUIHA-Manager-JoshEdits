import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameDivisionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (oldName: string, newName: string) => void;
  divisionName: string | null;
}

export const RenameDivisionDialog = ({ 
  isOpen, 
  onClose, 
  onRename,
  divisionName
}: RenameDivisionDialogProps) => {
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (divisionName) {
      setNewName(divisionName);
    }
  }, [divisionName]);

  const handleRename = () => {
    if (newName.trim() && divisionName) {
      onRename(divisionName, newName.trim());
      onClose();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  if (!divisionName) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Division</DialogTitle>
          <DialogDescription>
            Renaming '{divisionName}'. Enter the new name for the division.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              New Name
            </Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Non Checking 4 - North"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" onClick={handleRename} disabled={!newName.trim() || newName.trim() === divisionName}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};