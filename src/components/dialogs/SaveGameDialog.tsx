"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeam } from '@/context/TeamContext';
import { Save } from 'lucide-react';

export function SaveGameDialog() {
  const [open, setOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const { saveGame } = useTeam();

  const handleSave = () => {
    if (saveName.trim()) {
      saveGame(saveName.trim());
      setOpen(false);
      setSaveName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Save className="mr-2 h-4 w-4" />
          Save Game
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Game</DialogTitle>
          <DialogDescription>
            Enter a name for your save file. This will overwrite any existing save with the same name.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Save Name
            </Label>
            <Input
              id="name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="col-span-3"
              placeholder="My Awesome Career"
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={!saveName.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}