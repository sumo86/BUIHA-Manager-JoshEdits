import { useTeam } from "@/context/TeamContext";
import { getOrganizationName } from "@/data/teams";
import { Team, Player } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSub, // Added for sub-menus
    DropdownMenuSubContent, // Added for sub-menus
    DropdownMenuSubTrigger, // Added for sub-menus
} from "@/components/ui/dropdown-menu";
import { ArrowLeftRight, ChevronUp, ChevronDown, Star, StarHalf } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}
        {halfStar && <StarHalf key="half" className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
        {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />)}
      </div>
    );
  };

export const PlayerMovement = () => {
    const { userTeam, teams, movePlayer, requestPlayerTransfer, managedOrganization, managedTeams } = useTeam();
    const navigate = useNavigate();

    const organizationTeams = useMemo(() => {
        if (!userTeam) return [];
        // If managing an organization, use managedTeams directly
        if (managedOrganization) {
            return managedTeams.sort((a, b) => a.name.localeCompare(b.name));
        }
        // Otherwise, filter by organization name (for single team mode)
        const orgName = getOrganizationName(userTeam.name);
        return teams
            .filter(t => getOrganizationName(t.name) === orgName)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [userTeam, teams, managedOrganization, managedTeams]);

    if (!userTeam || organizationTeams.length <= 1) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Player Movement</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Your organization only has one team, so there are no player movement options available.</p>
                </CardContent>
            </Card>
        );
    }

    const userTeamIndex = organizationTeams.findIndex(t => t.name === userTeam.name);

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizationTeams.map((team, teamIndex) => (
                <Card key={team.name}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {team.logo && <img src={team.logo} alt={team.name} className="h-6 w-6 object-contain" />}
                            {team.name}
                            {team.name === userTeam.name && <span className="text-xs font-normal text-primary">(Your Team)</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {team.roster.map(player => {
                                const isUserPlayer = team.name === userTeam.name;
                                const canCallUp = !isUserPlayer && teamIndex > userTeamIndex;
                                const canRequestDown = !isUserPlayer && teamIndex < userTeamIndex;
                                const sendDownOptions = isUserPlayer ? organizationTeams.filter((_, index) => index > userTeamIndex) : [];

                                const hasOptions = managedOrganization || canCallUp || canRequestDown || sendDownOptions.length > 0;

                                return (
                                    <div key={player.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                        <div className="cursor-pointer flex-grow" onClick={() => navigate(`/player/${player.id}`)}>
                                            <p className="font-medium">{player.name}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm text-muted-foreground">{player.positions.join(', ')}</p>
                                                {renderStars(player.starRating)}
                                            </div>
                                        </div>
                                        {hasOptions && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                                        <ArrowLeftRight className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    {managedOrganization ? (
                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger>
                                                                <ArrowLeftRight className="mr-2 h-4 w-4" /> Move Player
                                                            </DropdownMenuSubTrigger>
                                                            <DropdownMenuSubContent>
                                                                {organizationTeams
                                                                    .filter(t => t.name !== team.name) // Exclude current team
                                                                    .map(targetTeam => (
                                                                        <DropdownMenuItem 
                                                                            key={targetTeam.name} 
                                                                            onClick={() => {
                                                                                movePlayer(player.id, team.name, targetTeam.name);
                                                                                toast.success(`${player.name} moved to ${targetTeam.name}.`);
                                                                            }}
                                                                        >
                                                                            {targetTeam.name}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuSub>
                                                    ) : (
                                                        <>
                                                            {canCallUp && (
                                                                <DropdownMenuItem onClick={() => {
                                                                    movePlayer(player.id, team.name, userTeam.name);
                                                                    toast.success(`${player.name} has been called up to ${userTeam.name}.`);
                                                                }}>
                                                                    <ChevronUp className="mr-2 h-4 w-4" /> Call Up to {userTeam.name}
                                                                </DropdownMenuItem>
                                                            )}
                                                            {canRequestDown && (
                                                                <DropdownMenuItem onClick={() => requestPlayerTransfer(player.id, team.name, userTeam.name)}>
                                                                    <ChevronDown className="mr-2 h-4 w-4" /> Request from {team.name}
                                                                </DropdownMenuItem>
                                                            )}
                                                            {sendDownOptions.length > 0 && sendDownOptions.map(targetTeam => (
                                                                <DropdownMenuItem key={targetTeam.name} onClick={() => {
                                                                    movePlayer(player.id, userTeam.name, targetTeam.name);
                                                                    toast.success(`${player.name} has been sent down to ${targetTeam.name}.`);
                                                                }}>
                                                                    <ChevronDown className="mr-2 h-4 w-4" /> Send Down to {targetTeam.name}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                );
                            })}
                             {team.roster.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">No players on this roster.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};