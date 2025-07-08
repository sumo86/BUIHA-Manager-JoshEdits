import { useTeam } from '@/context/TeamContext';
import { Player } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Star, StarHalf } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    const starClass = "h-4 w-4";
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className={`${starClass} text-yellow-400 fill-yellow-400`} />)}
        {halfStar && <StarHalf key="half" className={`${starClass} text-yellow-400 fill-yellow-400`} />}
        {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className={`${starClass} text-gray-300`} />)}
      </div>
    );
};

export const RecruitsTable = () => {
    const { recruitedPool, assignPlayerToRoster, discardRecruit } = useTeam();
    const navigate = useNavigate();

    const handleAssign = (player: Player) => {
        assignPlayerToRoster(player.id);
        toast.success(`${player.name} has been assigned to your roster.`);
    };

    const handleDiscard = (player: Player) => {
        discardRecruit(player.id);
        toast.info(`${player.name} has been discarded.`);
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Position(s)</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Nationality</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recruitedPool.length > 0 ? (
                        recruitedPool.map(player => (
                            <TableRow key={player.id}>
                                <TableCell className="font-medium hover:underline cursor-pointer" onClick={() => navigate(`/player/${player.id}`)}>
                                    {player.name}
                                </TableCell>
                                <TableCell>{renderStars(player.starRating)}</TableCell>
                                <TableCell>{player.positions.join(', ')}</TableCell>
                                <TableCell>{player.age}</TableCell>
                                <TableCell>{player.nationality}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button size="sm" variant="outline" onClick={() => handleAssign(player)}>Assign to Roster</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDiscard(player)}>Discard</Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                You have no recruited players.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};