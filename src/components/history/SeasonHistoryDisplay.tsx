import { useState, useMemo } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Team } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const StandingsTable = ({ teams }: { teams: Team[] }) => {
  const sortedTeams = [...teams].sort((a, b) => {
    const pointsA = a.wins * 2 + a.draws;
    const pointsB = b.wins * 2 + b.draws;
    if (pointsB !== pointsA) return pointsB - pointsA;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    return b.goalsFor - a.goalsFor;
  });

  return (
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
          <TableHead className="text-center">Pts</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedTeams.map((team, index) => (
          <TableRow key={team.id}>
            <TableCell>{index + 1}</TableCell>
            <TableCell className="font-medium">{team.name}</TableCell>
            <TableCell className="text-center">{team.wins + team.losses + team.draws}</TableCell>
            <TableCell className="text-center">{team.wins}</TableCell>
            <TableCell className="text-center">{team.losses}</TableCell>
            <TableCell className="text-center">{team.draws}</TableCell>
            <TableCell className="text-center">{team.goalsFor}</TableCell>
            <TableCell className="text-center">{team.goalsAgainst}</TableCell>
            <TableCell className="text-center">{team.goalsFor - team.goalsAgainst}</TableCell>
            <TableCell className="text-center font-bold">{team.wins * 2 + team.draws}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export const SeasonHistoryDisplay = () => {
  const { historicalStandings } = useTeam();
  const availableSeasons = useMemo(() => Object.keys(historicalStandings).sort((a, b) => b.localeCompare(a)), [historicalStandings]);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(availableSeasons[0] || null);

  const seasonData = useMemo(() => {
    if (!selectedSeason || !historicalStandings[selectedSeason]) return null;
    return historicalStandings[selectedSeason];
  }, [selectedSeason, historicalStandings]);

  if (availableSeasons.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No season history has been recorded yet. Complete a season to see its standings here.</p>;
  }

  return (
    <div className="space-y-4">
      <Select value={selectedSeason || ''} onValueChange={setSelectedSeason}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a season" />
        </SelectTrigger>
        <SelectContent>
          {availableSeasons.map(season => (
            <SelectItem key={season} value={season}>{season}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {seasonData ? (
        <Accordion type="multiple" className="w-full" defaultValue={Object.keys(seasonData)}>
          {Object.entries(seasonData).map(([division, teams]) => (
            <AccordionItem value={division} key={division}>
              <AccordionTrigger className="text-xl font-semibold">{division}</AccordionTrigger>
              <AccordionContent>
                <StandingsTable teams={teams} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="text-muted-foreground text-center py-8">Select a season to view its history.</p>
      )}
    </div>
  );
};