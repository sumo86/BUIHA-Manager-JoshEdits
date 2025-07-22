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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DivisionWinnersHistory from '@/components/buiha/DivisionWinnersHistory';
import NationalsHistoryView from '@/components/buiha/NationalsHistoryView';

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

const PlayerOverview = () => {
  const navigate = useNavigate();
  const { teams, teamAchievements, nationalsData, currentDate } = useTeam(); // Destructure teamAchievements and nationalsData
  
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
        // Explicitly cast to any for comparison to avoid symbol type issues
        if (aVal < (bVal as any)) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > (bVal as any)) return sortConfig.direction === 'asc' ? 1 : -1;
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
    <TableHead
      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center">
        {children}
        {sortConfig?.key === sortKey && (
          <ArrowUpDown className={`ml-2 h-4 w-4 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
        )}
      </div>
    </TableHead>
  );

  // Prepare data for DivisionWinnersHistory
  const divisionWinnersLogs = useMemo(() => {
    const logs: { teamName: string; season: string; division: string; }[] = [];
    for (const teamName in teamAchievements) {
      teamAchievements[teamName].forEach(achievement => {
        if (achievement.type === 'Division Title') {
          logs.push({
            teamName: teamName,
            season: achievement.season,
            division: achievement.division
          });
        }
      });
    }
    return logs.sort((a, b) => b.season.localeCompare(a.season) || a.division.localeCompare(b.division));
  }, [teamAchievements]);

  // Prepare data for NationalsHistoryView
  const nationalsHistoryForCurrentYear = useMemo(() => {
    // Pass the object directly, as NationalsHistoryView expects { [division: string]: NationalsTournament }
    return nationalsData[currentDate.year] || {}; 
  }, [nationalsData, currentDate.year]);


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">BUiHA Overview</h1>

      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="division-winners">Division Winners</TabsTrigger>
          <TabsTrigger value="nationals-history">Nationals History</TabsTrigger>
        </TabsList>
        <TabsContent value="players">
          <Card>
            <CardHeader>
              <CardTitle>Player Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <Select onValueChange={(value) => handleFilterChange('team', value)} defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {uniqueTeams.map(team => (
                      <SelectItem key={team} value={team}>{team}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => handleFilterChange('division', value)} defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Nationals Division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    {uniqueDivisions.map(division => (
                      <SelectItem key={division} value={division}>{division}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => handleFilterChange('position', value)} defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {uniquePositions.map(position => (
                      <SelectItem key={position} value={position}>{position}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Search by Name"
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                />
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader sortKey="name">Name</SortableHeader>
                      <SortableHeader sortKey="teamName">Team</SortableHeader>
                      <SortableHeader sortKey="nationalsDivision">Nationals Division</SortableHeader>
                      <SortableHeader sortKey="age">Age</SortableHeader>
                      <SortableHeader sortKey="positions">Positions</SortableHeader>
                      <SortableHeader sortKey="starRating">Rating</SortableHeader>
                      <SortableHeader sortKey="eligibility">Eligibility</SortableHeader> {/* Corrected closing tag */}
                      <TableHead>Morale</TableHead>
                      <TableHead>Health</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedPlayers.length > 0 ? (
                      filteredAndSortedPlayers.map(player => (
                        <TableRow key={player.id} onClick={() => navigate(`/player/${player.id}`)} className="cursor-pointer">
                          <TableCell className="font-medium">{player.name}</TableCell>
                          <TableCell>{player.teamName}</TableCell>
                          <TableCell>{player.nationalsDivision}</TableCell>
                          <TableCell>{player.age}</TableCell>
                          <TableCell>{player.positions.join(', ')}</TableCell>
                          <TableCell>{renderStars(player.starRating)}</TableCell>
                          <TableCell>{renderEligibility(player)}</TableCell>
                          <TableCell>{player.morale}</TableCell>
                          <TableCell>{player.healthStatus}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">No players found matching your criteria.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="division-winners">
          <DivisionWinnersHistory standings={divisionWinnersLogs} /> {/* Changed prop name to 'standings' */}
        </TabsContent>
        <TabsContent value="nationals-history">
          <NationalsHistoryView nationalsDataForYear={nationalsHistoryForCurrentYear} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlayerOverview;