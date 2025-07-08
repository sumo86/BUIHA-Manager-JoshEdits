import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { roles } from "@/data/roles";
import { teams } from "@/data/teams";
import { Player, Position } from "@/types";
import { Star, StarHalf } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Roster = () => {
  const navigate = useNavigate();
  const [team, setTeam] = useState(() => teams[0]);

  const handlePlayerClick = (playerId: string) => {
    navigate(`/player/${playerId}`);
  };

  const handleRoleChange = (playerId: string, newRole: string) => {
    setTeam(prevTeam => ({
      ...prevTeam,
      roster: prevTeam.roster.map(p => 
        p.id === playerId ? { ...p, role: newRole } : p
      )
    }));
  };

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

  const getAttributeColorClass = (value: number) => {
    if (value >= 17) return "text-green-700";
    if (value >= 13) return "text-green-500";
    if (value >= 9) return "text-yellow-500";
    if (value >= 5) return "text-orange-500";
    return "text-red-500";
  };

  const getApplicableRoles = (player: Player) => {
    if (player.positions.includes('G')) return [];

    const forwardPositions: Position[] = ['C', 'LW', 'RW'];
    const defencePositions: Position[] = ['LD', 'RD'];

    const isForward = forwardPositions.some(p => player.positions.includes(p));
    const isDefenceman = defencePositions.some(p => player.positions.includes(p));

    if (isForward && isDefenceman) {
        return roles; 
    } else if (isForward) {
        return roles.filter(r => r.positions.includes('Forward'));
    } else if (isDefenceman) {
        return roles.filter(r => r.positions.includes('Defenceman'));
    }

    return [];
  };

  const renderEligibility = (player: Player) => {
    if ((player.eligibility === 'Masters' || player.eligibility === 'PhD') && player.yearsLeftInProgram) {
        const yearsText = player.yearsLeftInProgram === 1 ? '1 year left' : `${player.yearsLeftInProgram} years left`;
        return `${player.eligibility} (${yearsText})`;
    }
    return player.eligibility;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{team.name} Roster</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Manage your players, lines, and training schedules here.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Player List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Position(s)</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Morale</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Eligibility</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.roster.map((player: Player) => {
                const applicableRoles = getApplicableRoles(player);
                return (
                  <TableRow 
                    key={player.id} 
                    onClick={() => handlePlayerClick(player.id)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-bold">{player.jerseyNumber}</TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell>{player.positions.join(", ")}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {applicableRoles.length > 0 ? (
                        <Select
                          value={player.role}
                          onValueChange={(newRole) => handleRoleChange(player.id, newRole)}
                        >
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {applicableRoles.map(role => (
                              <SelectItem key={role.name} value={role.name}>
                                <div className="flex justify-between w-full pr-2">
                                  <span>{role.name}</span>
                                  <span className={`font-bold ${getAttributeColorClass(player.roleSuitability[role.name])}`}>
                                    {player.roleSuitability[role.name]}/20
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>{player.age}</TableCell>
                    <TableCell>{player.nationality}</TableCell>
                    <TableCell>{renderStars(player.starRating)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{player.morale}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={player.healthStatus === 'Healthy' ? 'secondary' : 'destructive'}>
                        {player.healthStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{renderEligibility(player)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Roster;