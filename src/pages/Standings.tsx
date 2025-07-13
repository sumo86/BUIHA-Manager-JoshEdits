import { useMemo, useState } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Team } from '@/types';

const StandingsPage = () => {
  const { teams } = useTeam();
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  const leagues = useMemo(() => {
    const leagueSet = new Set(teams.map(team => team.leagueDivision));
    return Array.from(leagueSet).sort();
  }, [teams]);

  const displayedTeams = useMemo(() => {
    const leagueToDisplay = selectedLeague || leagues[0];
    if (!leagueToDisplay) return [];

    return teams
      .filter(team => team.leagueDivision === leagueToDisplay)
      .sort((a, b) => {
        const pointsA = a.wins * 3 + a.draws;
        const pointsB = b.wins * 3 + b.draws;
        if (pointsB !== pointsA) return pointsB - pointsA;
        
        const goalDiffA = a.goalsFor - a.goalsAgainst;
        const goalDiffB = b.goalsFor - b.goalsAgainst;
        if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;

        return b.goalsFor - a.goalsFor;
      });
  }, [teams, selectedLeague, leagues]);

  if (leagues.length === 0) {
    return <div>No leagues available.</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">League Standings</h1>
      <Select value={selectedLeague || leagues[0]} onValueChange={setSelectedLeague}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a league" />
        </SelectTrigger>
        <SelectContent>
          {leagues.map(league => (
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
    </div>
  );
};

export default StandingsPage;