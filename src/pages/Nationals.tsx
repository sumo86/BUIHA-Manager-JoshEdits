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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const NationalsPage = () => {
  const { nationalsData, currentDate, userTeam, teams, playNationalsRound, autoSimulateUserNationalsGame, simulateFullNationalsTournament, simulateSingleNationalsGame, simulateAllNationalsTournaments } = useTeam();
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

  const hasActiveTournaments = useMemo(() => {
    return Object.values(currentYearTournaments).some(t => t.status !== 'completed');
  }, [currentYearTournaments]);

  const handlePlayGame = (gameId: string) => {
    if (!userTeam || !tournamentToDisplay) return;
    const validationError = validateLineup(userTeam);
    if (validationError) {
      toast.error("Lineup Error", { description: validationError });
      return;
    }
    navigate(`/game/nationals/play/${tournamentToDisplay.division}/${gameId}`);
  };

  const handleSimulateUserGame = (gameId: string) => {
    if (!tournamentToDisplay) return;
    autoSimulateUserNationalsGame(tournamentToDisplay.division, gameId);
  };

  const handleSimulateRound = () => {
    if (!tournamentToDisplay) return;
    playNationalsRound(tournamentToDisplay.division);
  };

  const handleSimulateFullTournament = () => {
    if (!tournamentToDisplay) return;
    simulateFullNationalsTournament(tournamentToDisplay.division);
  };

  const handleSimulateSingleGame = (gameId: string) => {
    if (!tournamentToDisplay) return;
    simulateSingleNationalsGame(tournamentToDisplay.division, gameId);
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

  const showPlayoffs = tournamentToDisplay && (tournamentToDisplay.status === 'silver-playoffs' || tournamentToDisplay.status === 'gold-playoffs' || tournamentToDisplay.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">BUIHA Nationals {currentDate.year}</h1>
          <p className="text-lg text-muted-foreground">
            View tournament groups, schedules, and results.
          </p>
        </div>
        <div className="flex items-center gap-2">
            {hasActiveTournaments && (
                <Button onClick={simulateAllNationalsTournaments} variant="destructive">Sim All Tournaments</Button>
            )}
            <Swords className="h-10 w-10 text-primary" />
        </div>
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
            <div className="flex gap-2">
                {tournamentToDisplay && tournamentToDisplay.status !== 'completed' && !userHasGameThisRound && (
                    <Button onClick={handleSimulateRound}>Simulate Next Round</Button>
                )}
                {tournamentToDisplay && tournamentToDisplay.status !== 'completed' && (
                    <Button onClick={handleSimulateFullTournament} variant="secondary">Sim Full Tournament</Button>
                )}
            </div>
          </div>

          {tournamentToDisplay ? (
            showPlayoffs ? (
              <Tabs defaultValue="playoffs" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="playoffs">Playoffs</TabsTrigger>
                    <TabsTrigger value="groups">Group Stage</TabsTrigger>
                </TabsList>
                <TabsContent value="playoffs">
                    <Tabs defaultValue="Gold" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="Gold">Gold Bracket</TabsTrigger>
                            <TabsTrigger value="Silver">Silver Bracket</TabsTrigger>
                        </TabsList>
                        <TabsContent value="Gold">
                            <NationalsPlayoffTree 
                                playoffSchedule={tournamentToDisplay.playoffSchedule.filter(m => m.bracket === 'Gold')}
                                teams={teams}
                                userTeamName={userTeam?.name}
                                onPlayGame={handlePlayGame}
                                onSimulateGame={handleSimulateUserGame}
                                onSimulateSingleGame={handleSimulateSingleGame}
                                bracket="Gold"
                            />
                        </TabsContent>
                        <TabsContent value="Silver">
                            <NationalsPlayoffTree 
                                playoffSchedule={tournamentToDisplay.playoffSchedule.filter(m => m.bracket === 'Silver')}
                                teams={teams}
                                userTeamName={userTeam?.name}
                                onPlayGame={handlePlayGame}
                                onSimulateGame={handleSimulateUserGame}
                                onSimulateSingleGame={handleSimulateSingleGame}
                                bracket="Silver"
                            />
                        </TabsContent>
                    </Tabs>
                </TabsContent>
                <TabsContent value="groups">
                    <div className="grid gap-6 md:grid-cols-2 mt-4">
                        {tournamentToDisplay.groups.map(group => (
                            <NationalsGroupCard key={group.name} group={group} />
                        ))}
                    </div>
                </TabsContent>
              </Tabs>
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