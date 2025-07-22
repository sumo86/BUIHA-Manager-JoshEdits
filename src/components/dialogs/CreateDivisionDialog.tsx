import { useState } from 'react';
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

interface CreateDivisionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newDivisionName: string) => void;
}

export const CreateDivisionDialog = ({ isOpen, onClose, onCreate }: CreateDivisionDialogProps) => {
  const [divisionName, setDivisionName] = useState('');

  const handleCreate = () => {
    if (divisionName.trim()) {
      onCreate(divisionName.trim());
      onClose();
      setDivisionName('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Division</DialogTitle>
          <DialogDescription>
            Enter the full name for the new division. e.g., "Non Checking 4 - North".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Division Name
            </Label>
            <Input
              id="name"
              value={divisionName}
              onChange={(e) => setDivisionName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Non Checking 4 - North"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" onClick={handleCreate} disabled={!divisionName.trim()}>Create Division</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};