import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTeam } from "@/context/TeamContext";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface CreateClubDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const CreateClubDialog = ({ isOpen, onOpenChange }: CreateClubDialogProps) => {
  const { createCustomTeam } = useTeam();
  const [name, setName] = useState("");
  const [region, setRegion] = useState<'North' | 'South' | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'image/png') {
        toast.error("Invalid File Type", { description: "Please upload a PNG image." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogo(base64String);
        setLogoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!name || !region || !logo) {
      toast.error("Missing Information", { description: "Please fill out all fields and upload a logo." });
      return;
    }
    createCustomTeam(name, region, logo);
    onOpenChange(false); // Close dialog on successful creation
  };

  const isFormValid = name.trim() !== "" && region !== null && logo !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Your Club</DialogTitle>
          <DialogDescription>
            Build your legacy from the ground up. Enter your new club's details to begin.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Club Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Durham Wildcats"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Region</Label>
            <RadioGroup
              onValueChange={(value: 'North' | 'South') => setRegion(value)}
              className="col-span-3 flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="North" id="r-north" />
                <Label htmlFor="r-north">North</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="South" id="r-south" />
                <Label htmlFor="r-south">South</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="logo-upload" className="text-right">
              Logo
            </Label>
            <div className="col-span-3 flex items-center gap-4">
              <Button asChild variant="outline">
                <Label htmlFor="logo-upload" className="cursor-pointer flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload PNG
                </Label>
              </Button>
              <Input id="logo-upload" type="file" accept="image/png" className="hidden" onChange={handleFileChange} />
              {logoPreview && <img src={logoPreview} alt="Logo Preview" className="h-10 w-10 object-contain border rounded-md" />}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!isFormValid}>
            Create Club
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};