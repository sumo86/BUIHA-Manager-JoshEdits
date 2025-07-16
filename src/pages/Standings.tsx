import { useMemo, useState } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlayerStatsTable } from '@/components/standings/PlayerStatsTable';
import { Player } from '@/types';

const StandingsPage = () => {
  const { teams } = useTeam();
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  const leagues = useMemo(() => {
    const leagueSet = new Set(teams.map(team => team.leagueDivision));
    return Array.from(leagueSet).sort();
  }, [teams]);

  const { displayedTeams, leaguePlayers } = useMemo(() => {
    const leagueToDisplay = selectedLeague || leagues[0];
    if (!leagueToDisplay) return { displayedTeams: [], leaguePlayers: [] };

    const filteredTeams = teams.filter(team => team.leagueDivision === leagueToDisplay);

    const sortedTeams = [...filteredTeams].sort((a, b) => {
      const pointsA = a.wins * 3 + a.draws;
      const pointsB = b.wins * 3 + b.draws;
      if (pointsB !== pointsA) return pointsB - pointsA;
      
      const goalDiffA = a.goalsFor - a.goalsAgainst;
      const goalDiffB = b.goalsFor - b.goalsAgainst;
      if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;

      return b.goalsFor - a.goalsFor;
    });

    const players = filteredTeams.flatMap(team => team.roster.map(p => ({...p, history: [{...p.history[p.history.length - 1], team: team.name}]} as Player)));

    return { displayedTeams: sortedTeams, leaguePlayers: players };
  }, [teams, selectedLeague, leagues]);

  const skaters = useMemo(() => leaguePlayers.filter(p => !p.positions.includes('G')), [leaguePlayers]);
  const goalies = useMemo(() => leaguePlayers.filter(p => p.positions.includes('G')), [leaguePlayers]);

  if (leagues.length === 0) {
    return <div>No leagues available.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">League Standings</h1>
        <p className="text-muted-foreground">View team standings and player leaderboards.</p>
      </div>
      <Select value={selectedLeague || (leagues.length > 0 ? leagues[0] : '')} onValueChange={(value) => setSelectedLeague(value)}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a league" />
        </SelectTrigger>
        <SelectContent>
          {leagues.map((league: string) => (
            <SelectItem key={league} value={league}>{league}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center">GP</TableHead>
            <TableHead className="text-center">W</TableHead>
            <TableHead className="text-center">L</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">GF</TableHead>
            <TableHead className="text-center">GA</TableHead>
            <TableHead className="text-center">GD</TableHead>
            <TableHead className="text-right">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedTeams.map((team, index) => {
            const points = team.wins * 3 + team.draws;
            const goalDifference = team.goalsFor - team.goalsAgainst;
            const gamesPlayed = team.wins + team.losses + team.draws;
            return (
              <TableRow key={team.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell className="text-center">{gamesPlayed}</TableCell>
                <TableCell className="text-center">{team.wins}</TableCell>
                <TableCell className="text-center">{team.losses}</TableCell>
                <TableCell className="text-center">{team.draws}</TableCell>
                <TableCell className="text-center">{team.goalsFor}</TableCell>
                <TableCell className="text-center">{team.goalsAgainst}</TableCell>
                <TableCell className="text-center">{goalDifference}</TableCell>
                <TableCell className="text-right font-bold">{points}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <PlayerStatsTable title="Top Goalscorers" players={skaters} stat="goals" category="skater" />
        <PlayerStatsTable title="Top Playmakers" players={skaters} stat="assists" category="skater" />
        <PlayerStatsTable title="Top Point Scorers" players={skaters} stat="points" category="skater" />
        <PlayerStatsTable title="Top GAA" players={goalies} stat="goalsAgainstAverage" category="goalie" />
        <PlayerStatsTable title="Top Save %" players={goalies} stat="savePercentage" category="goalie" />
        <PlayerStatsTable title="Top Shutouts" players={goalies} stat="shutouts" category="goalie" />
      </div>
    </div>
  );
};

export default StandingsPage;