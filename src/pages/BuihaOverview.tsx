import { useMemo, useState } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Player, Position } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Star, StarHalf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type PlayerWithTeamInfo = Player & {
  teamName: string;
  leagueDivision: string;
  nationalsDivision: string;
};

type SortConfig = {
  key: keyof PlayerWithTeamInfo | 'teamName';
  direction: 'asc' | 'desc';
} | null;

const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
        ))}
        {halfStar && <StarHalf key="half" className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
      </div>
    );
};

const renderEligibility = (player: Player) => {
    if ((player.eligibility === 'Masters' || player.eligibility === 'PhD') && player.yearsLeftInProgram !== undefined) {
        const yearsText = player.yearsLeftInProgram === 1 ? '1 year left' : `${player.yearsLeftInProgram} years left`;
        return `${player.eligibility} (${yearsText})`;
    }
    return player.eligibility;
};

const BuihaOverview = () => {
  const navigate = useNavigate();
  const { teams } = useTeam();
  
  const [filters, setFilters] = useState({ team: 'all', division: 'all', position: 'all', name: '' });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'starRating', direction: 'desc' });

  const allPlayers = useMemo<PlayerWithTeamInfo[]>(() => {
    return teams.flatMap(team => 
      team.roster.map(player => ({
        ...player,
        teamName: team.name,
        leagueDivision: team.leagueDivision,
        nationalsDivision: team.nationalsDivision,
      }))
    );
  }, [teams]);

  const filteredAndSortedPlayers = useMemo(() => {
    let players = [...allPlayers];

    if (filters.team !== 'all') players = players.filter(p => p.teamName === filters.team);
    if (filters.division !== 'all') players = players.filter(p => p.nationalsDivision === filters.division);
    if (filters.position !== 'all') players = players.filter(p => p.positions.includes(filters.position as any));
    if (filters.name) players = players.filter(p => p.name.toLowerCase().includes(filters.name.toLowerCase()));

    if (sortConfig !== null) {
      players.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return players;
  }, [allPlayers, filters, sortConfig]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const requestSort = (key: keyof PlayerWithTeamInfo | 'teamName') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const uniqueTeams = useMemo(() => [...new Set(teams.map(t => t.name))].sort(), [teams]);
  const uniqueDivisions = useMemo(() => [...new Set(teams.map(t => t.nationalsDivision))].sort(), [teams]);
  const uniquePositions: Position[] = ["C", "LW", "RW", "LD", "RD", "G"];

  const SortableHeader = ({ sortKey, children }: { sortKey: keyof PlayerWithTeamInfo | 'teamName', children: React.ReactNode }) => (
    <TableHead>
      <Button variant="ghost" onClick={() => requestSort(sortKey)} className="px-2">
        {children}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>BUIHA Player Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Input placeholder="Filter by name..." value={filters.name} onChange={e => handleFilterChange('name', e.target.value)} />
          <Select value={filters.team} onValueChange={value => handleFilterChange('team', value)}>
            <SelectTrigger><SelectValue placeholder="Filter by team..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {uniqueTeams.map((team: string) => <SelectItem key={team} value={team}>{team}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.division} onValueChange={value => handleFilterChange('division', value)}>
            <SelectTrigger><SelectValue placeholder="Filter by division..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              {uniqueDivisions.map((div: string) => <SelectItem key={div} value={div}>{div}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.position} onValueChange={value => handleFilterChange('position', value)}>
            <SelectTrigger><SelectValue placeholder="Filter by position..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {uniquePositions.map((pos: Position) => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader sortKey="name">Name</SortableHeader>
                <SortableHeader sortKey="teamName">Team</SortableHeader>
                <SortableHeader sortKey="starRating">Rating</SortableHeader>
                <SortableHeader sortKey="age">Age</SortableHeader>
                <SortableHeader sortKey="positions">Position</SortableHeader>
                <SortableHeader sortKey="eligibility">Eligibility</SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedPlayers.map(player => (
                <TableRow key={player.id} onClick={() => navigate(`/player/${player.id}`)} className="cursor-pointer">
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{player.teamName}</TableCell>
                  <TableCell>{renderStars(player.starRating)}</TableCell>
                  <TableCell>{player.age}</TableCell>
                  <TableCell>{player.positions.join(', ')}</TableCell>
                  <TableCell>{renderEligibility(player)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BuihaOverview;