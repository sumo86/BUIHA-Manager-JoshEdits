import { useState, useMemo } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Player, Team } from "@/types";
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlayerWithTeam extends Player {
    teamName: string;
}

const Standings = () => {
    const { teams } = useTeam();
    const navigate = useNavigate();

    const groupedTeams = useMemo(() => {
        const groups = teams.reduce((acc, team) => {
            const { leagueDivision } = team;
            if (!acc[leagueDivision]) {
                acc[leagueDivision] = [];
            }
            acc[leagueDivision].push(team);
            return acc;
        }, {} as Record<string, Team[]>);

        for (const division in groups) {
            groups[division].sort((a, b) => (b.wins * 2 + b.draws) - (a.wins * 2 + a.draws));
        }
        return groups;
    }, [teams]);
    const divisions = useMemo(() => Object.keys(groupedTeams).sort(), [groupedTeams]);

    const [selectedDivision, setSelectedDivision] = useState<string>(divisions[0] || '');
    const [skaterSorting, setSkaterSorting] = useState<SortingState>([]);
    const [goalieSorting, setGoalieSorting] = useState<SortingState>([]);

    const divisionPlayers = useMemo(() => {
        if (!selectedDivision) return [];
        return teams
            .filter(t => t.leagueDivision === selectedDivision)
            .flatMap(team => team.roster.map(player => ({ ...player, teamName: team.name })));
    }, [teams, selectedDivision]);

    const skaters = useMemo(() => divisionPlayers.filter(p => !p.positions.includes('G')), [divisionPlayers]);
    const goalies = useMemo(() => divisionPlayers.filter(p => p.positions.includes('G')), [divisionPlayers]);

    const skaterColumns = useMemo<ColumnDef<PlayerWithTeam>[]>(() => [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'teamName', header: 'Team' },
        { accessorKey: 'currentStats.gamesPlayed', header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>GP<ArrowUpDown className="ml-2 h-4 w-4" /></Button>) },
        { accessorKey: 'currentStats.goals', header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>G<ArrowUpDown className="ml-2 h-4 w-4" /></Button>) },
        { accessorKey: 'currentStats.assists', header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>A<ArrowUpDown className="ml-2 h-4 w-4" /></Button>) },
        { accessorKey: 'currentStats.points', header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>P<ArrowUpDown className="ml-2 h-4 w-4" /></Button>) },
        { accessorKey: 'currentStats.penaltyMinutes', header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>PIM<ArrowUpDown className="ml-2 h-4 w-4" /></Button>) },
        { id: 'actions', cell: ({ row }) => (<Button variant="outline" size="sm" onClick={() => navigate(`/player/${row.original.id}`)}><Eye className="h-4 w-4" /></Button>), },
    ], [navigate]);

    const goalieColumns = useMemo<ColumnDef<PlayerWithTeam>[]>(() => [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'teamName', header: 'Team' },
        { accessorKey: 'currentStats.gamesPlayed', header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>GP<ArrowUpDown className="ml-2 h-4 w-4" /></Button>) },
        { accessorKey: 'currentStats.wins', header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>W<ArrowUpDown className="ml-2 h-4 w-4" /></Button>) },
        { accessorKey: 'currentStats.losses', header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>L<ArrowUpDown className="ml-2 h-4 w-4" /></Button>) },
        { id: 'actions', cell: ({ row }) => (<Button variant="outline" size="sm" onClick={() => navigate(`/player/${row.original.id}`)}><Eye className="h-4 w-4" /></Button>), },
    ], [navigate]);

    const skaterTable = useReactTable({ data: skaters, columns: skaterColumns, state: { sorting: skaterSorting }, onSortingChange: setSkaterSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });
    const goalieTable = useReactTable({ data: goalies, columns: goalieColumns, state: { sorting: goalieSorting }, onSortingChange: setGoalieSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });

    const renderPlayerTable = (table: any) => (
        <Table>
            <TableHeader>{table.getHeaderGroups().map((hg: any) => <TableRow key={hg.id}>{hg.headers.map((h: any) => <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
            <TableBody>{table.getRowModel().rows.map((r: any) => <TableRow key={r.id}>{r.getVisibleCells().map((c: any) => <TableCell key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</TableCell>)}</TableRow>)}</TableBody>
        </Table>
    );

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">League Information</h1>
            <Tabs defaultValue="standings" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="standings">League Standings</TabsTrigger>
                    <TabsTrigger value="player-stats">Player Statistics</TabsTrigger>
                </TabsList>
                <TabsContent value="standings">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-4">
                        {Object.entries(groupedTeams).map(([division, teamsInDivision]) => (
                            <Card key={division}>
                                <CardHeader><CardTitle>{division}</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Team</TableHead>
                                                <TableHead>Pts</TableHead>
                                                <TableHead>W</TableHead>
                                                <TableHead>L</TableHead>
                                                <TableHead>D</TableHead>
                                                <TableHead>GF</TableHead>
                                                <TableHead>GA</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {teamsInDivision.map(team => (
                                                <TableRow key={team.name}>
                                                    <TableCell className="font-medium flex items-center gap-2">
                                                        {team.logo && <img src={team.logo} alt={team.name} className="h-6 w-6 object-contain" />}
                                                        {team.name}
                                                    </TableCell>
                                                    <TableCell>{team.wins * 2 + team.draws}</TableCell>
                                                    <TableCell>{team.wins}</TableCell>
                                                    <TableCell>{team.losses}</TableCell>
                                                    <TableCell>{team.draws}</TableCell>
                                                    <TableCell>{team.goalsFor}</TableCell>
                                                    <TableCell>{team.goalsAgainst}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="player-stats">
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Player Statistics</CardTitle>
                            <div className="pt-4">
                                <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                                    <SelectTrigger className="w-full md:w-[320px]">
                                        <SelectValue placeholder="Select a division" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {divisions.map(div => <SelectItem key={div} value={div}>{div}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="skaters">
                                <TabsList><TabsTrigger value="skaters">Skaters</TabsTrigger><TabsTrigger value="goalies">Goalies</TabsTrigger></TabsList>
                                <TabsContent value="skaters">{renderPlayerTable(skaterTable)}</TabsContent>
                                <TabsContent value="goalies">{renderPlayerTable(goalieTable)}</TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Standings;