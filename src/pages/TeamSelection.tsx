import { useTeam } from '@/context/TeamContext';
import { getTeamOrganizations } from '@/data/teams';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Upload } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const TeamSelection = () => {
    const { selectTeam, selectOrganization, getSavedGames, loadGame, deleteGame } = useTeam();
    const organizations = getTeamOrganizations();
    const [savedGames, setSavedGames] = useState<{ name: string, savedAt: string }[]>([]);

    useEffect(() => {
        setSavedGames(getSavedGames());
    }, []);

    const handleLoadGame = (saveName: string) => {
        loadGame(saveName);
    };

    const handleDeleteGame = (saveName: string) => {
        deleteGame(saveName);
        setSavedGames(getSavedGames()); // Refresh list
    };

    const handleSelectTeam = (teamName: string) => {
        selectTeam(teamName);
    };

    const handleSelectOrganization = (orgName: string) => {
        selectOrganization(orgName);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle className="text-3xl text-center">BUIHA GM</CardTitle>
                    <CardDescription className="text-center">Your University Ice Hockey General Manager Saga</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-2 border-b pb-4">
                        <h2 className="text-2xl font-semibold">Load Game</h2>
                    </div>
                    <div className="md:col-span-2">
                        {savedGames.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {savedGames.map(game => (
                                    <div key={game.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div>
                                            <p className="font-semibold">{game.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Saved {formatDistanceToNow(new Date(game.savedAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" onClick={() => handleLoadGame(game.name)}>
                                                <Upload className="h-4 w-4 md:mr-2" />
                                                <span className="hidden md:inline">Load</span>
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" variant="destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete the save file "{game.name}". This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteGame(game.name)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                <p>No saved games found.</p>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2 border-b pb-4 mt-4">
                        <h2 className="text-2xl font-semibold">Start a New Game</h2>
                    </div>
                    <div className="md:col-span-2">
                        <p className="text-muted-foreground mb-4">Select a team or an entire organization to begin your managerial career.</p>
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
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TeamSelection;