import { useState, useMemo } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Team } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateDivisionDialog } from '@/components/dialogs/CreateDivisionDialog';
import { toast } from 'sonner';
import { Separator } from '../ui/separator';

const DivisionManager = () => {
  const { teams, updateTeamDivision, updateTeamNationalsDivision } = useTeam();
  const [isDivisionDialogOpen, setIsDivisionDialogOpen] = useState(false);
  const [isNationalsDialogOpen, setIsNationalsDialogOpen] = useState(false);

  const [availableDivisions, setAvailableDivisions] = useState<string[]>(() => [...new Set(teams.map(t => t.leagueDivision))].sort());
  const [availableNationalsTiers, setAvailableNationalsTiers] = useState<string[]>(() => [...new Set(teams.map(t => t.nationalsDivision))].sort());

  const teamsByDivision = useMemo(() => {
    const grouped: { [key: string]: Team[] } = {};
    teams.forEach(team => {
      if (!grouped[team.leagueDivision]) {
        grouped[team.leagueDivision] = [];
      }
      grouped[team.leagueDivision].push(team);
    });
    for (const division in grouped) {
        grouped[division].sort((a, b) => a.name.localeCompare(b.name));
    }
    return grouped;
  }, [teams]);

  const sortedDivisions = Object.keys(teamsByDivision).sort();

  const handleCreateDivision = (newDivision: string) => {
    if (availableDivisions.includes(newDivision)) {
      toast.error("Division already exists.");
      return;
    }
    setAvailableDivisions(prev => [...prev, newDivision].sort());
    toast.success(`Division "${newDivision}" created and is now available for assignment.`);
  };

  const handleCreateNationalsTier = (newTier: string) => {
    if (availableNationalsTiers.includes(newTier)) {
      toast.error("Nationals tier already exists.");
      return;
    }
    setAvailableNationalsTiers(prev => [...prev, newTier].sort());
    toast.success(`Nationals tier "${newTier}" created and is now available for assignment.`);
  };

  const handleTeamDivisionChange = (teamName: string, newDivision: string) => {
    if (newDivision === 'create_new') {
      setIsDivisionDialogOpen(true);
    } else {
      updateTeamDivision(teamName, newDivision);
      toast.success(`${teamName} moved to ${newDivision}.`);
    }
  };

  const handleTeamNationalsChange = (teamName: string, newTier: string) => {
    if (newTier === 'create_new') {
      setIsNationalsDialogOpen(true);
    } else {
      updateTeamNationalsDivision(teamName, newTier);
      toast.success(`${teamName}'s nationals tier set to ${newTier}.`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-muted-foreground">Manually move teams between divisions or create new ones.</p>
        <div className="flex gap-2">
          <Button onClick={() => setIsDivisionDialogOpen(true)}>Add New Division</Button>
          <Button onClick={() => setIsNationalsDialogOpen(true)} variant="outline">Add New Nationals Tier</Button>
        </div>
      </div>
      <Accordion type="multiple" className="w-full">
        {sortedDivisions.map(division => (
          <AccordionItem value={division} key={division}>
            <AccordionTrigger className="text-lg font-semibold">{division} ({teamsByDivision[division].length} teams)</AccordionTrigger>
            <AccordionContent>
              <div className="p-2">
                <div className="flex justify-end text-xs text-muted-foreground pr-4">
                    <span className="w-[300px] text-center">League Division</span>
                    <span className="w-[250px] text-center ml-2">Nationals Tier</span>
                </div>
                <Separator className="my-2" />
                <div className="space-y-2">
                  {teamsByDivision[division].map(team => (
                    <div key={team.name} className="flex items-center justify-between p-2 rounded-md border">
                      <span className="font-medium">{team.name}</span>
                      <div className="flex gap-2">
                        <Select
                          value={team.leagueDivision}
                          onValueChange={(newDivision) => handleTeamDivisionChange(team.name, newDivision)}
                        >
                          <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Select league division" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDivisions.map(div => (
                              <SelectItem key={div} value={div}>{div}</SelectItem>
                            ))}
                            <SelectItem value="create_new" className="font-bold text-primary">
                              + Create New Division...
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={team.nationalsDivision}
                          onValueChange={(newTier) => handleTeamNationalsChange(team.name, newTier)}
                        >
                          <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select nationals tier" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableNationalsTiers.map(tier => (
                              <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                            ))}
                            <SelectItem value="create_new" className="font-bold text-primary">
                              + Create New Tier...
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <CreateDivisionDialog
        isOpen={isDivisionDialogOpen}
        onClose={() => setIsDivisionDialogOpen(false)}
        onCreate={handleCreateDivision}
      />
      <CreateDivisionDialog
        isOpen={isNationalsDialogOpen}
        onClose={() => setIsNationalsDialogOpen(false)}
        onCreate={handleCreateNationalsTier}
        title="Create New Nationals Tier"
        description='Enter the name for the new nationals tier. e.g., "Non Checking 4".'
        label="Tier Name"
        placeholder="e.g., Non Checking 4"
      />
    </div>
  );
};

export default DivisionManager;