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
  title?: string;
  description?: string;
  label?: string;
  placeholder?: string;
}

export const CreateDivisionDialog = ({ 
  isOpen, 
  onClose, 
  onCreate,
  title = "Create New Division",
  description = 'Enter the full name for the new division. e.g., "Non Checking 4 - North".',
  label = "Division Name",
  placeholder = "e.g., Non Checking 4 - North"
}: CreateDivisionDialogProps) => {
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim());
      onClose();
      setName('');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName('');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {label}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder={placeholder}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" onClick={handleCreate} disabled={!name.trim()}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};