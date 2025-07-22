import { useState, useMemo } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Team } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateDivisionDialog } from '@/components/dialogs/CreateDivisionDialog';
import { toast } from 'sonner';

const DivisionManager = () => {
  const { teams, updateTeamDivision } = useTeam();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableDivisions, setAvailableDivisions] = useState<string[]>(() => [...new Set(teams.map(t => t.leagueDivision))].sort());

  const teamsByDivision = useMemo(() => {
    const grouped: { [key: string]: Team[] } = {};
    teams.forEach(team => {
      if (!grouped[team.leagueDivision]) {
        grouped[team.leagueDivision] = [];
      }
      grouped[team.leagueDivision].push(team);
    });
    // Sort teams within each division alphabetically
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

  const handleTeamDivisionChange = (teamName: string, newDivision: string) => {
    if (newDivision === 'create_new') {
      setIsDialogOpen(true);
    } else {
      updateTeamDivision(teamName, newDivision);
      toast.success(`${teamName} moved to ${newDivision}.`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-muted-foreground">Manually move teams between divisions or create new ones.</p>
        <Button onClick={() => setIsDialogOpen(true)}>Add New Division</Button>
      </div>
      <Accordion type="multiple" className="w-full">
        {sortedDivisions.map(division => (
          <AccordionItem value={division} key={division}>
            <AccordionTrigger className="text-lg font-semibold">{division} ({teamsByDivision[division].length} teams)</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 p-4">
                {teamsByDivision[division].map(team => (
                  <div key={team.name} className="flex items-center justify-between p-2 rounded-md border">
                    <span className="font-medium">{team.name}</span>
                    <Select
                      value={team.leagueDivision}
                      onValueChange={(newDivision) => handleTeamDivisionChange(team.name, newDivision)}
                    >
                      <SelectTrigger className="w-[350px]">
                        <SelectValue placeholder="Select division" />
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
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <CreateDivisionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreate={handleCreateDivision}
      />
    </div>
  );
};

export default DivisionManager;