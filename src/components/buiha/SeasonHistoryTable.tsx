import { useMemo, useState } from 'react';
import { TeamSeasonHistory } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SortConfig = {
  key: keyof TeamSeasonHistory | 'goalDifference';
  direction: 'asc' | 'desc';
} | null;

interface SeasonHistoryTableProps {
  standings: TeamSeasonHistory[];
}

export const SeasonHistoryTable = ({ standings }: SeasonHistoryTableProps) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'points', direction: 'desc' });
  const [divisionFilter, setDivisionFilter] = useState<string>('all');

  const uniqueDivisions = useMemo(() => {
    return [...new Set(standings.map(s => s.leagueDivision))].sort();
  }, [standings]);

  const filteredAndSortedStandings = useMemo(() => {
    let data = [...standings];

    if (divisionFilter !== 'all') {
      data = data.filter(s => s.leagueDivision === divisionFilter);
    }

    if (sortConfig !== null) {
      data.sort((a, b) => {
        let aVal, bVal;
        if (sortConfig.key === 'goalDifference') {
          aVal = a.goalsFor - a.goalsAgainst;
          bVal = b.goalsFor - b.goalsAgainst;
        } else {
          aVal = a[sortConfig.key as keyof TeamSeasonHistory];
          bVal = b[sortConfig.key as keyof TeamSeasonHistory];
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        
        // Secondary sort by goal difference, then goals for
        const aGD = a.goalsFor - a.goalsAgainst;
        const bGD = b.goalsFor - b.goalsAgainst;
        if (aGD < bGD) return 1;
        if (aGD > bGD) return -1;
        if (a.goalsFor < b.goalsFor) return 1;
        if (a.goalsFor > b.goalsFor) return -1;

        return 0;
      });
    }
    return data;
  }, [standings, sortConfig, divisionFilter]);

  const requestSort = (key: keyof TeamSeasonHistory | 'goalDifference') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({ sortKey, children }: { sortKey: keyof TeamSeasonHistory | 'goalDifference', children: React.ReactNode }) => (
    <TableHead>
      <Button variant="ghost" onClick={() => requestSort(sortKey)} className="px-2">
        {children}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  return (
    <div>
      <div className="mb-4">
        <Select value={divisionFilter} onValueChange={setDivisionFilter}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Filter by division..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Divisions</SelectItem>
            {uniqueDivisions.map(div => <SelectItem key={div} value={div}>{div}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <SortableHeader sortKey="teamName">Team</SortableHeader>
              <SortableHeader sortKey="leagueDivision">Division</SortableHeader>
              <SortableHeader sortKey="wins">W</SortableHeader>
              <SortableHeader sortKey="losses">L</SortableHeader>
              <SortableHeader sortKey="draws">D</SortableHeader>
              <SortableHeader sortKey="goalsFor">GF</SortableHeader>
              <SortableHeader sortKey="goalsAgainst">GA</SortableHeader>
              <SortableHeader sortKey="goalDifference">GD</SortableHeader>
              <SortableHeader sortKey="points">Pts</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedStandings.map((team, index) => (
              <TableRow key={team.teamName}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{team.teamName}</TableCell>
                <TableCell>{team.leagueDivision}</TableCell>
                <TableCell>{team.wins}</TableCell>
                <TableCell>{team.losses}</TableCell>
                <TableCell>{team.draws}</TableCell>
                <TableCell>{team.goalsFor}</TableCell>
                <TableCell>{team.goalsAgainst}</TableCell>
                <TableCell>{team.goalsFor - team.goalsAgainst}</TableCell>
                <TableCell className="font-bold">{team.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};