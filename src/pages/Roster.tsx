import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { roles } from "@/data/roles";
import { useTeam } from "@/context/TeamContext";
import { Player, Position } from "@/types";
import { Star, StarHalf, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerMovement } from "@/components/roster/PlayerMovement";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Roster = () => {
  const navigate = useNavigate();
  const { userTeam: team, updateTeam } = useTeam();
  const [positionFilter, setPositionFilter] = useState('All');
  const [eligibilityFilter, setEligibilityFilter] = useState('All');
  const [starRatingFilter, setStarRatingFilter] = useState([0.5]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [viewMode, setViewMode] = useState<'attributes' | 'stats'>('attributes');

  const roleTypeColors: { [key: string]: string } = {
    Offensive: 'bg-red-500',
    Defensive: 'bg-yellow-500',
    'Two-Way': 'bg-blue-500',
    Physical: 'bg-purple-500',
    Specialist: 'bg-gray-500',
  };

  const roleTypeOrder = ['Offensive', 'Two-Way', 'Defensive', 'Physical', 'Specialist'];

  const handlePlayerClick = (playerId: string) => {
    navigate(`/player/${playerId}`);
  };

  const handleRoleChange = useCallback((playerId: string, newRole: string) => {
    const newRoster = team.roster.map(p => 
      p.id === playerId ? { ...p, role: newRole } : p
    );
    updateTeam({ ...team, roster: newRoster });
  }, [team, updateTeam]);

  const handleCaptaincyChange = useCallback((playerId: string, newRole: 'C' | 'A' | 'None') => {
    const newRoster = [...team.roster];
    const targetPlayer = newRoster.find(p => p.id === playerId);
    if (!targetPlayer) return;

    if (newRole === 'C') {
        const oldCaptain = newRoster.find(p => p.captaincy === 'C');
        if (oldCaptain) oldCaptain.captaincy = null;
        targetPlayer.captaincy = 'C';
    } else if (newRole === 'A') {
        const alternates = newRoster.filter(p => p.captaincy === 'A');
        if (alternates.length < 2) {
            targetPlayer.captaincy = 'A';
        } else {
            toast.error("Maximum of 2 alternate captains allowed.");
            return;
        }
    } else {
        targetPlayer.captaincy = null;
    }

    updateTeam({ ...team, roster: newRoster });
  }, [team, updateTeam]);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}
        {halfStar && <StarHalf key="half" className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
        {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />)}
      </div>
    );
  };

  const getAttributeColorClass = (value: number) => {
    if (!value) return "";
    if (value >= 17) return "text-green-700";
    if (value >= 13) return "text-green-500";
    if (value >= 9) return "text-yellow-500";
    if (value >= 5) return "text-orange-500";
    return "text-red-500";
  };

  const getApplicableRoles = useCallback((player: Player) => {
    if (player.positions.includes('G')) return [];
    const forwardPositions: Position[] = ['C', 'LW', 'RW'];
    const defencePositions: Position[] = ['LD', 'RD'];
    const isForward = forwardPositions.some(p => player.positions.includes(p));
    const isDefenceman = defencePositions.some(p => player.positions.includes(p));
    let filteredRoles = [];
    if (isForward && isDefenceman) filteredRoles = roles; 
    else if (isForward) filteredRoles = roles.filter(r => r.positions.includes('Forward'));
    else if (isDefenceman) filteredRoles = roles.filter(r => r.positions.includes('Defenceman'));
    return [...filteredRoles].sort((a, b) => {
        const typeA = roleTypeOrder.indexOf(a.type);
        const typeB = roleTypeOrder.indexOf(b.type);
        if (typeA === typeB) return a.name.localeCompare(b.name);
        return typeA - typeB;
    });
  }, [roleTypeOrder]);

  const renderEligibility = (player: Player) => {
    if ((player.eligibility === 'Masters' || player.eligibility === 'PhD') && player.yearsLeftInProgram) {
        const yearsText = player.yearsLeftInProgram === 1 ? '1 year left' : `${player.yearsLeftInProgram} years left`;
        return `${player.eligibility} (${yearsText})`;
    }
    return player.eligibility;
  };

  const uniqueEligibilities = ['All', ...Array.from(new Set(team.roster.map(p => p.eligibility)))];
  const positionCategories = ['All', 'Forward', 'Defence', 'Goaltender'];
  const forwardPositions: Position[] = ['C', 'LW', 'RW'];
  const defencePositions: Position[] = ['LD', 'RD'];

  const filteredRoster = useMemo(() => team.roster.filter(player => {
    if (positionFilter !== 'All') {
      const isForward = forwardPositions.some(p => player.positions.includes(p));
      const isDefence = defencePositions.some(p => player.positions.includes(p));
      const isGoaltender = player.positions.includes('G');
      if (positionFilter === 'Forward' && !isForward) return false;
      if (positionFilter === 'Defence' && !isDefence) return false;
      if (positionFilter === 'Goaltender' && !isGoaltender) return false;
    }
    if (eligibilityFilter !== 'All' && player.eligibility !== eligibilityFilter) return false;
    if (player.starRating < starRatingFilter[0]) return false;
    return true;
  }), [team.roster, positionFilter, eligibilityFilter, starRatingFilter]);

  const columns = useMemo<ColumnDef<Player>[]>(() => {
    const baseCols: ColumnDef<Player>[] = [
        {
            accessorKey: 'jerseyNumber',
            header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>#<ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
            cell: ({ row }) => <div className="font-bold">{row.original.jerseyNumber}</div>,
            size: 50,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Name<ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
            cell: ({ row }) => {
                const player = row.original;
                return <div>{player.name}{player.captaincy === 'C' && <span className="ml-2 font-bold text-yellow-700">C</span>}{player.captaincy === 'A' && <span className="ml-2 font-medium text-yellow-500">A</span>}</div>;
            }
        },
        { accessorKey: 'positions', header: 'Position(s)', cell: ({ row }) => row.original.positions.join(", ") },
    ];

    if (viewMode === 'stats') {
        return [
            ...baseCols,
            { accessorKey: 'currentStats.gamesPlayed', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>GP<ArrowUpDown className="ml-2 h-4 w-4" /></Button> },
            { accessorKey: 'currentStats.goals', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>G<ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => row.original.positions.includes('G') ? 'N/A' : row.original.currentStats.goals },
            { accessorKey: 'currentStats.assists', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>A<ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => row.original.positions.includes('G') ? 'N/A' : row.original.currentStats.assists },
            { accessorKey: 'currentStats.points', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>P<ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => row.original.positions.includes('G') ? 'N/A' : row.original.currentStats.points },
            { accessorKey: 'currentStats.penaltyMinutes', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>PIM<ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => row.original.positions.includes('G') ? 'N/A' : row.original.currentStats.penaltyMinutes },
            { accessorKey: 'currentStats.wins', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>W<ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => !row.original.positions.includes('G') ? 'N/A' : row.original.currentStats.wins },
            { accessorKey: 'currentStats.losses', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>L<ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => !row.original.positions.includes('G') ? 'N/A' : row.original.currentStats.losses },
            { accessorKey: 'currentStats.shutouts', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>SO<ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => !row.original.positions.includes('G') ? 'N/A' : row.original.currentStats.shutouts },
        ];
    }

    return [
        ...baseCols,
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => {
                const player = row.original;
                const applicableRoles = getApplicableRoles(player);
                const selectedRole = applicableRoles.find(r => r.name === player.role);
                return <div onClick={(e) => e.stopPropagation()}>{applicableRoles.length > 0 ? <Select value={player.role} onValueChange={(newRole) => handleRoleChange(player.id, newRole)}><SelectTrigger className="w-[220px]"><div className="flex items-center w-full">{selectedRole && <span className={`h-2 w-2 rounded-full mr-2 ${roleTypeColors[selectedRole.type]}`}></span>}<SelectValue placeholder="Select a role" /></div></SelectTrigger><SelectContent>{applicableRoles.map(role => <SelectItem key={role.name} value={role.name}><div className="flex justify-between w-full pr-2"><div className="flex items-center"><span className={`h-2 w-2 rounded-full mr-2 ${roleTypeColors[role.type]}`}></span><span>{role.name}</span></div><span className={`font-bold ${getAttributeColorClass(player.roleSuitability[role.name])}`}>{player.roleSuitability[role.name]}/20</span></div></SelectItem>)}</SelectContent></Select> : 'N/A'}</div>;
            }
        },
        { accessorKey: 'age', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Age<ArrowUpDown className="ml-2 h-4 w-4" /></Button> },
        { accessorKey: 'nationality', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Nationality<ArrowUpDown className="ml-2 h-4 w-4" /></Button> },
        { accessorKey: 'starRating', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Rating<ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => renderStars(row.original.starRating) },
        { accessorKey: 'morale', header: 'Morale', cell: ({ row }) => <Badge variant="outline">{row.original.morale}</Badge> },
        { 
            accessorKey: 'healthStatus', 
            header: 'Status', 
            cell: ({ row }) => {
                const player = row.original;
                const badge = <Badge variant={player.healthStatus === 'Healthy' ? 'secondary' : 'destructive'}>{player.healthStatus}</Badge>;
                if (player.injury) {
                    return (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>{badge}</TooltipTrigger>
                                <TooltipContent>
                                    <p>{player.injury.type} ({player.injury.duration} weeks left)</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                }
                return badge;
            } 
        },
        { accessorKey: 'eligibility', header: 'Eligibility', cell: ({ row }) => renderEligibility(row.original) },
        {
            id: 'actions',
            cell: ({ row }) => {
                const player = row.original;
                return <div className="text-right" onClick={(e) => e.stopPropagation()}>{player.positions[0] !== 'G' && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleCaptaincyChange(player.id, 'C')}>Assign Captain (C)</DropdownMenuItem><DropdownMenuItem onClick={() => handleCaptaincyChange(player.id, 'A')}>Assign Alternate (A)</DropdownMenuItem><DropdownMenuItem onClick={() => handleCaptaincyChange(player.id, 'None')}>Remove Captaincy</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</div>;
            }
        }
    ];
  }, [viewMode, getApplicableRoles, handleCaptaincyChange, handleRoleChange]);

  const table = useReactTable({
    data: filteredRoster,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{team.name} Roster</h1>
      <p className="text-lg text-muted-foreground mb-6">Manage your players, lines, and training schedules here.</p>
      
      <Tabs defaultValue="roster">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="roster">Player Roster</TabsTrigger>
          <TabsTrigger value="movement">Player Movement</TabsTrigger>
        </TabsList>
        <TabsContent value="roster" className="mt-4">
          <Card className="mb-6">
            <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2"><Label htmlFor="position-filter">Position</Label><Select value={positionFilter} onValueChange={setPositionFilter}><SelectTrigger id="position-filter"><SelectValue placeholder="Filter by position" /></SelectTrigger><SelectContent>{positionCategories.map(pos => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="eligibility-filter">Degree</Label><Select value={eligibilityFilter} onValueChange={setEligibilityFilter}><SelectTrigger id="eligibility-filter"><SelectValue placeholder="Filter by degree" /></SelectTrigger><SelectContent>{uniqueEligibilities.map((eligibility: string) => <SelectItem key={eligibility} value={eligibility}>{eligibility}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="star-filter">Minimum Star Rating: {starRatingFilter[0].toFixed(1)}</Label><Slider id="star-filter" min={0.5} max={5} step={0.5} value={starRatingFilter} onValueChange={setStarRatingFilter} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Player List</CardTitle>
                    <ToggleGroup type="single" value={viewMode} onValueChange={(value) => { if (value) setViewMode(value as any)}}>
                        <ToggleGroupItem value="attributes">Attributes</ToggleGroupItem>
                        <ToggleGroupItem value="stats">Stats</ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map(row => (
                      <TableRow key={row.id} onClick={() => handlePlayerClick(row.original.id)} className="cursor-pointer hover:bg-muted/50" data-state={row.getIsSelected() && 'selected'}>
                        {row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No players match filters.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="movement" className="mt-4">
          <PlayerMovement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Roster;