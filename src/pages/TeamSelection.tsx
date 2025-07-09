import { useTeam } from '@/context/TeamContext';
import { getTeamOrganizations } from '@/data/teams';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const TeamSelection = () => {
    const { selectTeam } = useTeam();
    const organizations = getTeamOrganizations();

    const handleSelectTeam = (teamName: string) => {
        selectTeam(teamName);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Start a New Game</CardTitle>
                    <CardDescription>Select a team to begin your managerial career.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {organizations.map(org => (
                            <AccordionItem value={org.name} key={org.name}>
                                <AccordionTrigger>{org.name}</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                                        {org.teams.map(team => (
                                            <div key={team.name} className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">{team.name}</p>
                                                    <p className="text-sm text-muted-foreground">{team.leagueDivision}</p>
                                                </div>
                                                <Button onClick={() => handleSelectTeam(team.name)}>
                                                    Manage {team.name.split(' ').pop()}
                                                </Button>
                                            </div>
                                        ))}
                                        {org.teams.length > 1 && (
                                            <>
                                                <div className="border-t my-4"></div>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold">Manage Entire {org.name} Organization</p>
                                                        <p className="text-sm text-muted-foreground">Oversee all teams in the organization.</p>
                                                    </div>
                                                    <Button disabled>Coming Soon</Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
};

export default TeamSelection;