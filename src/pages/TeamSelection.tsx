import { useTeam } from '@/context/TeamContext';
import { getTeamOrganizations } from '@/data/teams';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { Trash2, PlusCircle, Download, Upload } from 'lucide-react';
import { useState, useRef } from 'react';
import { CreateClubDialog } from '@/components/dialogs/CreateClubDialog';
import Papa from 'papaparse';
import { toast } from 'sonner';

const ROSTER_TEMPLATE_CSV = `Team,Name,Number,Age,Nationality,Position(s),Year,Archetype,Estimated Player Quality
`;

const TeamSelection = () => {
    const { selectTeam, selectOrganization, savedGames, loadGame, deleteGame, teams } = useTeam();
    const organizations = getTeamOrganizations(teams);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSelectTeam = (teamName: string) => {
        selectTeam(teamName);
    };

    const handleSelectOrganization = (orgName: string) => {
        selectOrganization(orgName);
    };

    const handleDownloadTemplate = () => {
        const blob = new Blob([ROSTER_TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'Custom-Roster-Template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            toast.error("No file selected.");
            return;
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.trim(),
            complete: (results) => {
                if (results.errors.length) {
                    toast.error("Error parsing CSV", { description: results.errors[0].message });
                    return;
                }
                // Basic validation
                const requiredHeaders = ['Team', 'Name', 'Number', 'Age', 'Nationality', 'Position(s)', 'Year', 'Archetype', 'Estimated Player Quality'];
                const actualHeaders = Object.keys(results.data[0] as object);
                const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h));

                if (missingHeaders.length > 0) {
                    toast.error("Invalid CSV format", { description: `Missing required columns: ${missingHeaders.join(', ')}` });
                    return;
                }

                localStorage.setItem('customRoster', JSON.stringify(results.data));
                toast.success("Custom Roster Uploaded!", {
                    description: `${results.data.length} players loaded. Please refresh the page and select a team to start a new game.`,
                    duration: 8000,
                    action: {
                        label: 'Refresh Now',
                        onClick: () => window.location.reload(),
                    },
                });
            },
            error: (error) => {
                toast.error("Failed to read file", { description: error.message });
            }
        });
        
        // Reset file input
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-3xl space-y-8">
                {savedGames && savedGames.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Load Game</CardTitle>
                            <CardDescription>Continue one of your saved games.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {savedGames.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()).map(game => (
                                    <div key={game.saveName} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div>
                                            <p className="font-semibold">{game.saveName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {game.userTeamName} - {game.currentDate.month} {game.currentDate.year}, Week {game.currentDate.week}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Saved: {format(new Date(game.savedAt), "PPP p")}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button onClick={() => loadGame(game.saveName)}>Load</Button>
                                            <Button variant="destructive" size="icon" onClick={() => deleteGame(game.saveName)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="text-2xl">Start a New Game</CardTitle>
                        <CardDescription>Select an existing team or create your own club from scratch.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button className="w-full" size="lg" onClick={() => setIsCreateDialogOpen(true)}>
                                <PlusCircle className="mr-2 h-5 w-5" />
                                Create Your Own Club
                            </Button>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" onClick={handleDownloadTemplate}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Template
                                </Button>
                                <Button variant="outline" onClick={handleUploadClick}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Roster
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".csv"
                                />
                            </div>
                        </div>
                        <div className="relative flex justify-center">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                Or Select an Existing Club
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
            <CreateClubDialog isOpen={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
        </div>
    );
};

export default TeamSelection;