import { useState, useMemo } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Player, Position } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export const ScoutingTable = () => {
    const { scoutingPool, recruitPlayer } = useTeam();
    const [positionFilter, setPositionFilter] = useState('All');
    const [sourceFilter, setSourceFilter] = useState('All');
    const [qualityFilter, setQualityFilter] = useState('All');
    const [nameFilter, setNameFilter] = useState('');

    const filteredPlayers = useMemo(() => {
        return scoutingPool.filter(player => {
            const posMatch = positionFilter === 'All' || player.positions.includes(positionFilter as Position);
            const sourceMatch = sourceFilter === 'All' || player.source === sourceFilter;
            const qualityMatch = qualityFilter === 'All' || player.estimatedQuality === qualityFilter;
            const nameMatch = nameFilter === '' || player.name.toLowerCase().includes(nameFilter.toLowerCase());
            return posMatch && sourceMatch && qualityMatch && nameMatch;
        });
    }, [scoutingPool, positionFilter, sourceFilter, qualityFilter, nameFilter]);

    const handleRecruit = (player: Player) => {
        recruitPlayer(player.id);
        toast.success(`${player.name} has been moved to your recruits list.`);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
                <Input 
                    placeholder="Filter by name..." 
                    value={nameFilter} 
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Position" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Positions</SelectItem>
                        <SelectItem value="C">Centre</SelectItem>
                        <SelectItem value="LW">Left Wing</SelectItem>
                        <SelectItem value="RW">Right Wing</SelectItem>
                        <SelectItem value="LD">Left Defence</SelectItem>
                        <SelectItem value="RD">Right Defence</SelectItem>
                        <SelectItem value="G">Goalie</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Source" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Sources</SelectItem>
                        <SelectItem value="Local">Local</SelectItem>
                        <SelectItem value="Transfer">Transfer</SelectItem>
                        <SelectItem value="International">International</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={qualityFilter} onValueChange={setQualityFilter}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Est. Quality" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Qualities</SelectItem>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Experienced">Experienced</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Age</TableHead>
                            <TableHead>Nationality</TableHead>
                            <TableHead>Position(s)</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Est. Quality</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPlayers.length > 0 ? (
                            filteredPlayers.map(player => (
                                <TableRow key={player.id}>
                                    <TableCell className="font-medium">{player.name}</TableCell>
                                    <TableCell>{player.age}</TableCell>
                                    <TableCell>{player.nationality}</TableCell>
                                    <TableCell>{player.positions.join(', ')}</TableCell>
                                    <TableCell>{player.source}</TableCell>
                                    <TableCell>{player.estimatedQuality}</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" onClick={() => handleRecruit(player)}>Recruit</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No players match the current filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};