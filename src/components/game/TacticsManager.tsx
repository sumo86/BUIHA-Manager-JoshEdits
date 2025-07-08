import { Tactic, TacticsSelection } from '@/types';
import { tactics } from '@/data/tactics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMemo } from 'react';

interface TacticsManagerProps {
  currentTactics: TacticsSelection;
  onTacticChange: (category: string, tactic: string) => void;
}

export const TacticsManager = ({ currentTactics, onTacticChange }: TacticsManagerProps) => {
  const groupedTactics = useMemo(() => {
    return tactics.reduce((acc, tactic) => {
      const phase = tactic.phase;
      if (!acc[phase]) {
        acc[phase] = {};
      }
      const category = tactic.category;
      if (!acc[phase][category]) {
        acc[phase][category] = [];
      }
      acc[phase][category].push(tactic);
      return acc;
    }, {} as Record<string, Record<string, Tactic[]>>);
  }, []);

  // Placeholder for suitability calculation
  const getSuitability = (tacticName: string) => {
    // In a real scenario, this would be a complex calculation based on roster attributes.
    // For now, we'll use a seeded random number for consistent-looking placeholders.
    let hash = 0;
    for (let i = 0; i < tacticName.length; i++) {
      const char = tacticName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return (Math.abs(hash) % 10) + 8; // Returns a value between 8 and 17
  };

  return (
    <ScrollArea className="h-[60vh] pr-4">
      <div className="space-y-6">
        {Object.entries(groupedTactics).map(([phase, categories]) => (
          <div key={phase}>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">{phase}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(categories).map(([category, tacticList]) => (
                <div key={category} className="space-y-2">
                  <Label>{category}</Label>
                  <Select
                    value={currentTactics[category]}
                    onValueChange={(value) => onTacticChange(category, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tactic" />
                    </SelectTrigger>
                    <SelectContent>
                      {tacticList.map((tactic) => (
                        <SelectItem key={tactic.tactic} value={tactic.tactic}>
                          <div className="flex justify-between w-full pr-2">
                            <span>{tactic.tactic}</span>
                            <span className="text-muted-foreground text-sm">
                              Suitability: {getSuitability(tactic.tactic)}/20
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};