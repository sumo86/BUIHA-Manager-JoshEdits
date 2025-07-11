import { Player, Lineup, Instruction } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';

interface InstructionsManagerProps {
  roster: Player[];
  lineup: Lineup;
  onGiveInstruction: (target: string, instruction: Instruction) => void;
}

const INSTRUCTIONS: Instruction[] = ["Encourage", "Discipline", "Praise", "Push Harder", "Calm Down"];

const getPlayerLinePosition = (playerId: string, lineup: Lineup): string => {
    const posMap = { lw: 'LW', c: 'C', rw: 'RW', ld: 'LD', rd: 'RD' };
    for (const group of ['forwards', 'defence'] as const) {
        for (const pos in lineup[group]) {
            const lineIndex = (lineup[group] as any)[pos].indexOf(playerId);
            if (lineIndex !== -1) {
                return `${lineIndex + 1}${posMap[pos as keyof typeof posMap]}`;
            }
        }
    }
    if (lineup.goalies.starter === playerId) return 'G1';
    if (lineup.goalies.backup === playerId) return 'G2';
    return '';
};

export const InstructionsManager = ({ roster, lineup, onGiveInstruction }: InstructionsManagerProps) => {
  const [target, setTarget] = useState('All Forwards');

  const targets = [
    { value: 'All Forwards', label: 'All Forwards' },
    { value: 'All Defence', label: 'All Defence' },
    { value: 'Goalies', label: 'Goalies' },
    ...roster.map(p => {
      const linePos = getPlayerLinePosition(p.id, lineup);
      return { value: p.id, label: `${linePos ? `${linePos} - ` : ''}${p.name}` };
    }),
  ];

  const handleInstructionClick = (instruction: Instruction) => {
    onGiveInstruction(target, instruction);
    const targetLabel = targets.find(t => t.value === target)?.label || 'Unknown';
    toast.info(`Gave instruction "${instruction}" to ${targetLabel}.`);
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <Label htmlFor="instruction-target">Target</Label>
        <Select value={target} onValueChange={setTarget}>
          <SelectTrigger id="instruction-target">
            <SelectValue placeholder="Select a target" />
          </SelectTrigger>
          <SelectContent>
            {targets.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Instruction</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {INSTRUCTIONS.map(instruction => (
            <Button key={instruction} variant="outline" onClick={() => handleInstructionClick(instruction)}>
              {instruction}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};