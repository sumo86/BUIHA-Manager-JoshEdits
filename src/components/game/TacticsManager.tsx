import { Tactic, TacticsSelection } from '@/types';
import { tactics } from '@/data/tactics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TacticsManagerProps {
  currentTactics: TacticsSelection;
  onTacticChange: (category: string, tactic: string) => void;
}

export const TacticsManager = ({ currentTactics, onTacticChange }: TacticsManagerProps) => {
  const groupedTactics = tactics.reduce((acc, tactic) => {
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
                          {tactic.tactic}
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