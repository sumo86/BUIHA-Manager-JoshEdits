import { useTeam } from '@/context/TeamContext';
import { getTeamOrganizations } from '@/data/teams';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const TeamSelection = () => {
    const { selectOrganization } = useTeam();

    const handleSelectOrganization = (orgName: string) => {
        selectOrganization(orgName);
    };

    const organizations = getTeamOrganizations();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Start a New Game</CardTitle>
                    <CardDescription>Select an organization to begin your managerial career.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {organizations.map(org => (
                            <AccordionItem value={org.name} key={org.name}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-4">
                                        {org.teams[0].logo && <img src={org.teams[0].logo} alt={org.name} className="h-8 w-8 object-contain" />}
                                        <span>{org.name}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground">This organization includes the following teams:</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {org.teams.map(team => (
                                                <li key={team.name}>{team.name} ({team.leagueDivision})</li>
                                            ))}
                                        </ul>
                                        <div className="border-t my-4"></div>
                                        <div className="flex justify-end items-center">
                                            <Button onClick={() => handleSelectOrganization(org.name)}>Manage {org.name}</Button>
                                        </div>
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