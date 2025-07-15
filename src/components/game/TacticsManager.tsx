import { TacticsSelection, Player, Tactic } from '@/types';
import { tactics } from '@/data/tactics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateTacticSuitability } from '@/lib/tactics';

interface TacticsManagerProps {
  currentTactics: TacticsSelection;
  onTacticChange: (category: string, tactic: string) => void;
  roster: Player[];
}

export const TacticsManager = ({ currentTactics, onTacticChange, roster }: TacticsManagerProps) => {
  const groupedTactics = tactics.reduce((acc, tactic) => {
    const category = tactic.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tactic);
    return acc;
  }, {} as Record<string, Tactic[]>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Object.entries(groupedTactics).map(([category, categoryTactics]) => (
        <div key={category} className="space-y-2">
          <h3 className="text-lg font-semibold capitalize">{category}</h3>
          <Select value={currentTactics[category]} onValueChange={(value) => onTacticChange(category, value)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${category} tactic`} />
            </SelectTrigger>
            <SelectContent>
              {categoryTactics.map(tactic => {
                const suitability = calculateTacticSuitability(tactic, roster);
                return (
                  <SelectItem key={tactic.tactic} value={tactic.tactic}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-left w-full">{tactic.tactic}</TooltipTrigger>
                        <TooltipContent>
                          <p>{tactic.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">Suitability: {suitability.score.toFixed(1)}/5 - {suitability.explanation}</p>
                          <p className="text-xs text-muted-foreground">Strong vs: {tactic.strongVs}</p>
                          <p className="text-xs text-muted-foreground">Weak vs: {tactic.weakVs}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
};