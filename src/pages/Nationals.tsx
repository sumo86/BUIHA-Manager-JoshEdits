import { useState, useMemo } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Swords } from 'lucide-react';
import NationalsGroupCard from '@/components/nationals/NationalsGroupCard';
import { NationalsTournament } from '@/types';
import NationalsSchedule from '@/components/nationals/NationalsSchedule';

const NationalsPage = () => {
  const { nationalsData, currentDate } = useTeam();
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);

  const currentYearTournaments = useMemo(() => {
    return nationalsData[currentDate.year] || {};
  }, [nationalsData, currentDate.year]);

  const availableDivisions = useMemo(() => {
    return Object.keys(currentYearTournaments);
  }, [currentYearTournaments]);

  const tournamentToDisplay: NationalsTournament | null = useMemo(() => {
    if (selectedDivision && currentYearTournaments[selectedDivision]) {
      return currentYearTournaments[selectedDivision];
    }
    if (availableDivisions.length > 0 && !selectedDivision) {
        setSelectedDivision(availableDivisions[0]);
        return currentYearTournaments[availableDivisions[0]];
    }
    return null;
  }, [selectedDivision, currentYearTournaments, availableDivisions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">BUIHA Nationals {currentDate.year}</h1>
          <p className="text-lg text-muted-foreground">
            View tournament groups, schedules, and results.
          </p>
        </div>
        <Swords className="h-10 w-10 text-primary" />
      </div>

      {availableDivisions.length > 0 ? (
        <>
          <div>
            <Select value={selectedDivision || ''} onValueChange={setSelectedDivision}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select a division" />
              </SelectTrigger>
              <SelectContent>
                {availableDivisions.map(div => (
                  <SelectItem key={div} value={div}>
                    {div}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tournamentToDisplay ? (
            <div className="grid gap-6 md:grid-cols-2">
              {tournamentToDisplay.groups.map(group => (
                <NationalsGroupCard key={group.name} group={group} />
              ))}
              <NationalsSchedule tournament={tournamentToDisplay} />
            </div>
          ) : (
             <p>Select a division to view its tournament details.</p>
          )}
        </>
      ) : (
        <div className="text-center py-10">
            <h2 className="text-xl font-semibold">No Nationals data available for {currentDate.year}.</h2>
            <p className="text-muted-foreground">Tournaments are generated in April of each season.</p>
        </div>
      )}
    </div>
  );
};

export default NationalsPage;