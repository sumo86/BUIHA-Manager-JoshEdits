import { useParams } from 'react-router-dom';
import { teams } from '@/data/teams';
import { Player, SkaterAttributes, GoalieAttributes } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, User, MapPin, Shield, HeartPulse, GraduationCap, Zap, TrendingUp, StarHalf } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const PlayerProfile = () => {
    const { playerId } = useParams<{ playerId: string }>();
    
    const player = teams.flatMap(team => team.roster).find(p => p.id === playerId);

    if (!player) {
        return <div className="text-center p-10">Player not found.</div>;
    }

    const isSkater = 'acceleration' in player.attributes;
    const skaterAttrs = player.attributes as SkaterAttributes;
    const goalieAttrs = player.attributes as GoalieAttributes;

    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        return (
          <div className="flex">
            {[...Array(fullStars)].map((_, i) => (
              <Star key={`full-${i}`} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            ))}
            {halfStar && <StarHalf key="half" className="h-5 w-5 text-yellow-400 fill-yellow-400" />}
            {[...Array(emptyStars)].map((_, i) => (
              <Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
            ))}
          </div>
        );
    };

    const getAttributeColorClass = (value: number) => {
        if (value >= 17) return "text-green-700"; // Dark Green
        if (value >= 13) return "text-green-500"; // Light Green
        if (value >= 9) return "text-yellow-500"; // Yellow
        if (value >= 5) return "text-orange-500"; // Orange
        return "text-red-500"; // Red
    };

    const AttributeItem = ({ label, value }: { label: string, value: number }) => (
        <div className="flex justify-between items-center py-1">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className={`text-sm font-bold ${getAttributeColorClass(value)}`}>{value}</span>
        </div>
    );
    
    const AttributeCategory = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div>
            <h3 className="font-semibold mb-2 text-lg text-primary">{title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                {children}
            </div>
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
                        <Separator />
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><Star size={16} /> Division Rating</span> <span className="flex">{renderStars(player.starRating)}</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><Zap size={16} /> Current Ability</span> <span>{player.currentAbility}</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><TrendingUp size={16} /> Potential Ability</span> <span>{player.potentialAbility}</span></div>
                        <Separator />
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><Shield size={16} /> Morale</span> <Badge variant="outline">{player.morale}</Badge></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><HeartPulse size={16} /> Status</span> <Badge variant={player.healthStatus === 'Healthy' ? 'secondary' : 'destructive'}>{player.healthStatus}</Badge></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><GraduationCap size={16} /> Eligibility</span> <span>{player.eligibility}</span></div>
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
                            <div className="space-y-6">
                                <AttributeCategory title="Physical">
                                    <AttributeItem label="Acceleration" value={skaterAttrs.acceleration} />
                                    <AttributeItem label="Agility" value={skaterAttrs.agility} />
                                    <AttributeItem label="Balance" value={skaterAttrs.balance} />
                                    <AttributeItem label="Fighting" value={skaterAttrs.fighting} />
                                    <AttributeItem label="Speed" value={skaterAttrs.speed} />
                                    <AttributeItem label="Stamina" value={skaterAttrs.stamina} />
                                    <AttributeItem label="Strength" value={skaterAttrs.strength} />
                                    <AttributeItem label="Hitting" value={skaterAttrs.hitting} />
                                </AttributeCategory>
                                <Separator />
                                <AttributeCategory title="Mental">
                                    <AttributeItem label="Aggression" value={skaterAttrs.aggression} />
                                    <AttributeItem label="Bravery" value={skaterAttrs.bravery} />
                                    <AttributeItem label="Determination" value={skaterAttrs.determination} />
                                    <AttributeItem label="Leadership" value={skaterAttrs.leadership} />
                                    <AttributeItem label="Professionalism" value={skaterAttrs.professionalism} />
                                    <AttributeItem label="Team Player" value={skaterAttrs.teamPlayer} />
                                    <AttributeItem label="Temperament" value={skaterAttrs.temperament} />
                                </AttributeCategory>
                                <Separator />
                                <AttributeCategory title="Offensive">
                                    <AttributeItem label="Getting Open" value={skaterAttrs.gettingOpen} />
                                    <AttributeItem label="Offensive Read" value={skaterAttrs.offensiveRead} />
                                    <AttributeItem label="Passing" value={skaterAttrs.passing} />
                                    <AttributeItem label="Puckhandling" value={skaterAttrs.puckhandling} />
                                    <AttributeItem label="Screening" value={skaterAttrs.screening} />
                                    <AttributeItem label="Shooting Accuracy" value={skaterAttrs.shootingAccuracy} />
                                    <AttributeItem label="Shooting Range" value={skaterAttrs.shootingRange} />
                                </AttributeCategory>
                                <Separator />
                                <AttributeCategory title="Defensive">
                                    <AttributeItem label="Checking" value={skaterAttrs.checking} />
                                    <AttributeItem label="Defensive Read" value={skaterAttrs.defensiveRead} />
                                    <AttributeItem label="Faceoffs" value={skaterAttrs.faceoffs} />
                                    <AttributeItem label="Positioning" value={skaterAttrs.positioning} />
                                    <AttributeItem label="Shot Blocking" value={skaterAttrs.shotBlocking} />
                                    <AttributeItem label="Stickchecking" value={skaterAttrs.stickchecking} />
                                </AttributeCategory>
                            </div>
                        ) : (
                            <AttributeCategory title="Goaltending">
                                <AttributeItem label="Blocker" value={goalieAttrs.blocker} />
                                <AttributeItem label="Glove" value={goalieAttrs.glove} />
                                <AttributeItem label="Low Shots" value={goalieAttrs.lowShots} />
                                <AttributeItem label="Positioning" value={goalieAttrs.positioning} />
                                <AttributeItem label="Rebound Control" value={goalieAttrs.rebound} />
                                <AttributeItem label="Recovery" value={goalieAttrs.recovery} />
                                <AttributeItem label="Reflexes" value={goalieAttrs.reflexes} />
                                <AttributeItem label="Passing" value={goalieAttrs.passing} />
                                <AttributeItem label="Poke Check" value={goalieAttrs.pokeCheck} />
                                <AttributeItem label="Puckhandling" value={goalieAttrs.puckhandling} />
                                <AttributeItem label="Skating" value={goalieAttrs.skating} />
                                <AttributeItem label="Mental Toughness" value={goalieAttrs.mentalToughness} />
                                <AttributeItem label="Stamina" value={goalieAttrs.goaltenderStamina} />
                            </AttributeCategory>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PlayerProfile;