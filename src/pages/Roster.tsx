import { useMemo, useState } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Player, Position } from '@/types';

const Roster = () => {
  const { userTeam } = useTeam();
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');
  const [eligibilityFilter, setEligibilityFilter] = useState('All');
  const [healthFilter, setHealthFilter] = useState('All');

  const positions = useMemo(() => {
    const allPositions = userTeam?.roster.flatMap(p => p.positions) || [];
    return ['All', ...Array.from(new Set(allPositions)).sort()];
  }, [userTeam]);

  const eligibilities = useMemo(() => {
    const allEligibilities = userTeam?.roster.map(p => p.eligibility) || [];
    return ['All', ...Array.from(new Set(allEligibilities)).sort()];
  }, [userTeam]);

  const healthStatuses = useMemo(() => {
    const allHealthStatuses = userTeam?.roster.map(p => p.healthStatus) || [];
    return ['All', ...Array.from(new Set(allHealthStatuses)).sort()];
  }, [userTeam]);

  const filteredRoster = useMemo(() => {
    if (!userTeam) return [];
    return userTeam.roster.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPosition = positionFilter === 'All' || player.positions.includes(positionFilter as Position);
      const matchesEligibility = eligibilityFilter === 'All' || player.eligibility === eligibilityFilter;
      const matchesHealth = healthFilter === 'All' || player.healthStatus === healthFilter;
      return matchesSearch && matchesPosition && matchesEligibility && matchesHealth;
    }).sort((a, b) => a.jerseyNumber - b.jerseyNumber);
  }, [userTeam, searchTerm, positionFilter, eligibilityFilter, healthFilter]);

  if (!userTeam) {
    return <div>Loading roster...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Roster</h1>
        <p className="text-muted-foreground">Manage your players and view their details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roster Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={positionFilter} onValueChange={(value: string) => setPositionFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by position" />
            </SelectTrigger>
            <SelectContent>
              {positions.map((pos: string) => (
                <SelectItem key={pos} value={pos}>{pos}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={eligibilityFilter} onValueChange={(value: string) => setEligibilityFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by eligibility" />
            </SelectTrigger>
            <SelectContent>
              {eligibilities.map((elig: string) => (
                <SelectItem key={elig} value={elig}>{elig}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={healthFilter} onValueChange={(value: string) => setHealthFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by health" />
            </SelectTrigger>
            <SelectContent>
              {healthStatuses.map((health: string) => (
                <SelectItem key={health} value={health}>{health}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Eligibility</TableHead>
            <TableHead>Star Rating</TableHead>
            <TableHead>Health</TableHead>
            <TableHead>Morale</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRoster.map((player: Player) => (
            <TableRow key={player.id}>
              <TableCell>{player.jerseyNumber}</TableCell>
              <TableCell>{player.positions.join(', ')}</TableCell>
              <TableCell>{player.age}</TableCell>
              <TableCell>{player.eligibility}</TableCell>
              <TableCell>{player.starRating.toFixed(1)} ⭐</TableCell>
              <TableCell>{player.healthStatus} {player.injury && `(${player.injury.duration} wks)`}</TableCell>
              <TableCell>{player.morale}</TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/player/${player.id}`}>View Profile</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Roster;