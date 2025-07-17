import { useTeam } from '@/context/TeamContext';
import { getTeamOrganizations } from '@/data/teams';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useEffect, useState } from 'react';

const TeamSelection = () => {
    const { selectTeam, selectOrganization, loadSavedGame } = useTeam();
    const organizations = getTeamOrganizations();
    const [savedGameInfo, setSavedGameInfo] = useState<{ teamName: string; orgName: string | null } | null>(null);

    useEffect(() => {
        const lastTeam = localStorage.getItem('lastActiveTeamName');
        const lastOrg = localStorage.getItem('lastManagedOrganization');
        if (lastTeam) {
            setSavedGameInfo({ teamName: lastTeam, orgName: lastOrg });
        }
    }, []);

    const handleSelectTeam = (teamName: string) => {
        selectTeam(teamName);
    };

    const handleSelectOrganization = (orgName: string) => {
        selectOrganization(orgName);
    };

    const handleLoadGame = () => {
        if (loadSavedGame) {
            loadSavedGame();
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">BUIHA Manager</CardTitle>
                    <CardDescription className="text-center">Load your previous session or start a new game.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {savedGameInfo && (
                        <div className="p-6 border rounded-lg bg-muted/50 flex flex-col items-center gap-4">
                            <h3 className="text-xl font-semibold">Continue Game</h3>
                            <p className="text-muted-foreground text-center">
                                Load your saved game managing <span className="font-bold text-primary">{savedGameInfo.orgName || savedGameInfo.teamName}</span>.
                            </p>
                            <Button onClick={handleLoadGame} size="lg" className="w-full">Load Saved Game</Button>
                        </div>
                    )}

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                                {savedGameInfo ? 'Or Start New' : 'Start a New Game'}
                            </span>
                        </div>
                    </div>

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
                                        {org.teams.map(team => (
                                            <div key={team.name} className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    {team.logo && <img src={team.logo} alt={team.name} className="h-6 w-6 object-contain" />}
                                                    <div>
                                                        <p className="font-semibold">{team.name}</p>
                                                        <p className="text-sm text-muted-foreground">{team.leagueDivision}</p>
                                                    </div>
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
                                                    <Button onClick={() => handleSelectOrganization(org.name)}>Manage Organization</Button>
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