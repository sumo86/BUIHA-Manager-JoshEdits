import { useState, useMemo } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Player } from '@/types';
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlayerWithTeam extends Player {
    teamName: string;
}

const SeasonOverview = () => {
    const { userTeam, teams } = useTeam();
    const navigate = useNavigate();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [goalieSorting, setGoalieSorting] = useState<SortingState>([]);

    const divisionTeams = useMemo(() => teams
        .filter(t => t.leagueDivision === userTeam.leagueDivision)
        .sort((a, b) => (b.wins * 2 + b.otLosses) - (a.wins * 2 + a.otLosses)), [teams, userTeam.leagueDivision]);

    const divisionPlayers = useMemo(() => 
        teams
            .filter(t => t.leagueDivision === userTeam.leagueDivision)
            .flatMap(team => team.roster.map(player => ({ ...player, teamName: team.name }))),
    [teams, userTeam.leagueDivision]);

    const skaters = useMemo(() => divisionPlayers.filter(p => !p.positions.includes('G')), [divisionPlayers]);
    const goalies = useMemo(() => divisionPlayers.filter(p => p.positions.includes('G')), [divisionPlayers]);

    const skaterColumns = useMemo<ColumnDef<PlayerWithTeam>[]>(() => [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'teamName', header: 'Team' },
        { accessorKey: 'currentStats.gamesPlayed', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>GP<ArrowUpDown className="ml-2 h-4 w-4" /></Button> },
        { accessorKey: 'currentStats.goals', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>G<ArrowUpDown className="ml-2 h-4 w-4" /></Button> },
        { accessorKey: 'currentStats.assists', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>A<ArrowUpDown className="ml-2 h-4 w-4" /></Button> },
        { accessorKey: 'currentStats.points', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>P<ArrowUpDown className="ml-2 h-4 w-4" /></Button> },
        { accessorKey: 'currentStats.penaltyMinutes', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>PIM<ArrowUpDown className="ml-2 h-4 w-4" /></Button> },
        {
            id: 'actions',
            cell: ({ row }) => (
                <Button variant="outline" size="sm" onClick={() => navigate(`/player/${row.original.id}`)}>
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        },
    ], [navigate]);

    const goalieColumns = useMemo<ColumnDef<PlayerWithTeam>[]>(() => [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'teamName', header: 'Team' },
        { accessorKey: 'currentStats.gamesPlayed', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>GP<ArrowUpDown className="ml-2 h-4 w-4" /></Button> },
        { accessorKey: 'currentStats.wins', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>W<ArrowUpDown className="ml-2 h-4 w-4" /></Button> },
        { accessorKey: 'currentStats.losses', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>L<ArrowUpDown className="ml-2 h-4 w-4" /></Button> },
        {
            id: 'actions',
            cell: ({ row }) => (
                <Button variant="outline" size="sm" onClick={() => navigate(`/player/${row.original.id}`)}>
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        },
    ], [navigate]);

    const skaterTable = useReactTable({ data: skaters, columns: skaterColumns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });
    const goalieTable = useReactTable({ data: goalies, columns: goalieColumns, state: { sorting: goalieSorting }, onSortingChange: setGoalieSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });

    const renderTable = (table: any) => (
        <Table>
            <TableHeader>{table.getHeaderGroups().map((hg: any) => <TableRow key={hg.id}>{hg.headers.map((h: any) => <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
            <TableBody>{table.getRowModel().rows.map((r: any) => <TableRow key={r.id}>{r.getVisibleCells().map((c: any) => <TableCell key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</TableCell>)}</TableRow>)}</TableBody>
        </Table>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Season Overview</h1>
            <Card>
                <CardHeader><CardTitle>{userTeam.leagueDivision} Standings</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Team</TableHead><TableHead>GP</TableHead><TableHead>W</TableHead><TableHead>L</TableHead><TableHead>OTL</TableHead><TableHead>GF</TableHead><TableHead>GA</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {divisionTeams.map(team => (
                                <TableRow key={team.name} className={team.name === userTeam.name ? 'bg-muted/50' : ''}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        {team.logo && <img src={team.logo} alt={team.name} className="h-6 w-6 object-contain" />}
                                        {team.name}
                                    </TableCell>
                                    <TableCell>{team.wins + team.losses + team.otLosses}</TableCell>
                                    <TableCell>{team.wins}</TableCell>
                                    <TableCell>{team.losses}</TableCell>
                                    <TableCell>{team.otLosses}</TableCell>
                                    <TableCell>{team.goalsFor}</TableCell>
                                    <TableCell>{team.goalsAgainst}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Player Statistics</CardTitle><CardDescription>Statistics for all players in your division.</CardDescription></CardHeader>
                <CardContent>
                    <Tabs defaultValue="skaters">
                        <TabsList><TabsTrigger value="skaters">Skaters</TabsTrigger><TabsTrigger value="goalies">Goalies</TabsTrigger></TabsList>
                        <TabsContent value="skaters">{renderTable(skaterTable)}</TabsContent>
                        <TabsContent value="goalies">{renderTable(goalieTable)}</TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default SeasonOverview;