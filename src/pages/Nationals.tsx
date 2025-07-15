import { useState, useMemo } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Swords } from 'lucide-react';
import NationalsGroupCard from '@/components/nationals/NationalsGroupCard';
import { NationalsTournament } from '@/types';
import NationalsSchedule from '@/components/nationals/NationalsSchedule';
import NationalsPlayoffTree from '@/components/nationals/NationalsPlayoffTree';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { validateLineup } from '@/lib/lineupValidation';

const NationalsPage = () => {
  const { nationalsData, currentDate, userTeam, teams, playNationalsRound, autoSimulateUserNationalsGame } = useTeam();
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const handlePlayGame = (gameId: string) => {
    if (!userTeam) return;
    const validationError = validateLineup(userTeam);
    if (validationError) {
      toast.error("Lineup Error", { description: validationError });
      return;
    }
    navigate(`/game/nationals/${tournamentToDisplay.division}/${gameId}`);
  };

  const handleSimulateUserGame = (gameId: string) => {
    if (!tournamentToDisplay) return;
    autoSimulateUserNationalsGame(tournamentToDisplay.division, gameId);
  };

  const handleSimulateRound = () => {
    if (!tournamentToDisplay) return;
    playNationalsRound(tournamentToDisplay.division);
  };

  const userHasGameThisRound = useMemo(() => {
    if (!tournamentToDisplay || !userTeam) return false;
    const schedule = (tournamentToDisplay.status === 'silver-playoffs' || tournamentToDisplay.status === 'gold-playoffs') ? tournamentToDisplay.playoffSchedule : tournamentToDisplay.groupStageSchedule;
    const currentRound = tournamentToDisplay.currentRound;
    
    return schedule.some(game => 
        game.round === currentRound &&
        game.status === 'scheduled' &&
        ((typeof game.homeTeam === 'string' && game.homeTeam === userTeam.name) || (typeof game.awayTeam === 'string' && game.awayTeam === userTeam.name))
    );
  }, [tournamentToDisplay, userTeam]);

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
          <div className="flex justify-between items-center">
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
            {tournamentToDisplay && tournamentToDisplay.status !== 'completed' && !userHasGameThisRound && (
                <Button onClick={handleSimulateRound}>Simulate Next Round</Button>
            )}
          </div>

          {tournamentToDisplay ? (
            tournamentToDisplay.status === 'silver-playoffs' || tournamentToDisplay.status === 'gold-playoffs' || tournamentToDisplay.status === 'completed' ? (
                <NationalsPlayoffTree 
                    playoffSchedule={tournamentToDisplay.playoffSchedule}
                    teams={teams}
                    userTeamName={userTeam?.name}
                    onPlayGame={handlePlayGame}
                    onSimulateGame={handleSimulateUserGame}
                />
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {tournamentToDisplay.groups.map(group => (
                        <NationalsGroupCard key={group.name} group={group} />
                    ))}
                    <NationalsSchedule 
                        tournament={tournamentToDisplay} 
                        onPlayGame={handlePlayGame}
                        onSimulateGame={handleSimulateUserGame}
                        userTeamName={userTeam?.name}
                    />
                </div>
            )
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