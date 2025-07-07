import { useParams } from 'react-router-dom';
import { teams } from '@/data/teams';
import { Player, SkaterAttributes, GoalieAttributes } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, User, MapPin, Calendar, Shield, HeartPulse, GraduationCap, BarChart2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const PlayerProfile = () => {
    const { playerId } = useParams<{ playerId: string }>();
    
    const player = teams.flatMap(team => team.roster).find(p => p.id === playerId);

    if (!player) {
        return <div className="text-center p-10">Player not found.</div>;
    }

    const isSkater = 'skating' in player.attributes;

    const renderStars = (rating: number) => (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-5 w-5 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
        ))}
      </div>
    );

    const AttributeItem = ({ label, value }: { label: string, value: number }) => (
        <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className="text-sm font-bold">{value}</span>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader className="text-center">
                        <div className="text-6xl font-extrabold text-muted-foreground/50 -mb-2">{player.jerseyNumber}</div>
                        <CardTitle className="text-3xl">{player.name}</CardTitle>
                        <CardDescription>{player.positions.join(' / ')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><User size={16} /> Age</span> <span>{player.age}</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><MapPin size={16} /> Nationality</span> <span>{player.nationality}</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><Star size={16} /> Rating</span> <span className="flex">{renderStars(player.starRating)}</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><Shield size={16} /> Morale</span> <Badge variant="outline">{player.morale}</Badge></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><HeartPulse size={16} /> Status</span> <Badge variant={player.healthStatus === 'Healthy' ? 'secondary' : 'destructive'}>{player.healthStatus}</Badge></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><GraduationCap size={16} /> Eligibility</span> <span>{player.eligibility}</span></div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart2 size={20} /> Archetype</CardTitle>
                        <CardDescription>{player.archetype.type} {player.archetype.position}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{player.archetype.description}</p>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Player Attributes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isSkater ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                <AttributeItem label="Skating" value={(player.attributes as SkaterAttributes).skating} />
                                <AttributeItem label="Shooting" value={(player.attributes as SkaterAttributes).shooting} />
                                <AttributeItem label="Passing" value={(player.attributes as SkaterAttributes).passing} />
                                <AttributeItem label="Puck Control" value={(player.attributes as SkaterAttributes).puckControl} />
                                <Separator className="my-2 md:col-span-2" />
                                <AttributeItem label="Defensive Awareness" value={(player.attributes as SkaterAttributes).defensiveAwareness} />
                                <AttributeItem label="Stick Checking" value={(player.attributes as SkaterAttributes).stickChecking} />
                                <Separator className="my-2 md:col-span-2" />
                                <AttributeItem label="Body Checking" value={(player.attributes as SkaterAttributes).bodyChecking} />
                                <AttributeItem label="Strength" value={(player.attributes as SkaterAttributes).strength} />
                                <AttributeItem label="Aggressiveness" value={(player.attributes as SkaterAttributes).aggressiveness} />
                                <Separator className="my-2 md:col-span-2" />
                                <AttributeItem label="Hockey IQ" value={(player.attributes as SkaterAttributes).hockeyIQ} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                <AttributeItem label="Glove High" value={(player.attributes as GoalieAttributes).gloveHigh} />
                                <AttributeItem label="Glove Low" value={(player.attributes as GoalieAttributes).gloveLow} />
                                <AttributeItem label="Stick High" value={(player.attributes as GoalieAttributes).stickHigh} />
                                <AttributeItem label="Stick Low" value={(player.attributes as GoalieAttributes).stickLow} />
                                <AttributeItem label="Five Hole" value={(player.attributes as GoalieAttributes).fiveHole} />
                                <AttributeItem label="Positioning" value={(player.attributes as GoalieAttributes).positioning} />
                                <AttributeItem label="Rebound Control" value={(player.attributes as GoalieAttributes).reboundControl} />
                                <AttributeItem label="Puck Handling" value={(player.attributes as GoalieAttributes).puckHandling} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PlayerProfile;