import { useMemo, useState } from 'react';
import { Player } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface CareerStatsTableProps {
  players: Player[];
}

type SortKey = 'name' | 'team' | 'gp' | 'g' | 'a' | 'pts' | 'pim';

export const CareerStatsTable = ({ players }: CareerStatsTableProps) => {
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'pts', direction: 'descending' });

  const skaters = useMemo(() => {
    return players
      .filter(p => !p.positions.includes('G'))
      .map(player => {
        const allStats = [...player.history, ...player.currentStats];
        const careerStats = allStats.reduce((acc, season) => {
          acc.gp += season.gamesPlayed || 0;
          acc.g += season.goals || 0;
          acc.a += season.assists || 0;
          acc.pts += season.points || 0;
          acc.pim += season.penaltyMinutes || 0;
          return acc;
        }, { gp: 0, g: 0, a: 0, pts: 0, pim: 0 });
        
        const lastTeam = player.history[player.history.length - 1]?.team || 'N/A';

        return {
          ...player,
          careerStats,
          lastTeam,
        };
      });
  }, [players]);

  const sortedSkaters = useMemo(() => {
    let sortableItems = [...skaters];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key === 'name') {
          aValue = a.name;
          bValue = b.name;
        } else if (sortConfig.key === 'team') {
          aValue = a.lastTeam;
          bValue = b.lastTeam;
        } else {
          aValue = a.careerStats[sortConfig.key as keyof typeof b.careerStats];
          bValue = b.careerStats[sortConfig.key as keyof typeof b.careerStats];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [skaters, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' ? '🔼' : '🔽';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Career Player Statistics (Skaters)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Button variant="ghost" onClick={() => requestSort('name')}>Player {getSortIcon('name')}</Button></TableHead>
              <TableHead><Button variant="ghost" onClick={() => requestSort('team')}>Last Team {getSortIcon('team')}</Button></TableHead>
              <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('gp')}>GP {getSortIcon('gp')}</Button></TableHead>
              <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('g')}>G {getSortIcon('g')}</Button></TableHead>
              <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('a')}>A {getSortIcon('a')}</Button></TableHead>
              <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('pts')}>Pts {getSortIcon('pts')}</Button></TableHead>
              <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('pim')}>PIM {getSortIcon('pim')}</Button></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSkaters.map(player => (
              <TableRow key={player.id} onClick={() => navigate(`/player/${player.id}`)} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell>{player.lastTeam}</TableCell>
                <TableCell className="text-right">{player.careerStats.gp}</TableCell>
                <TableCell className="text-right">{player.careerStats.g}</TableCell>
                <TableCell className="text-right">{player.careerStats.a}</TableCell>
                <TableCell className="text-right font-bold">{player.careerStats.pts}</TableCell>
                <TableCell className="text-right">{player.careerStats.pim}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};