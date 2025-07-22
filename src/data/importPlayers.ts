import Papa from "papaparse";

export interface Player {
    Team: string;
    Name: string;
    Number: number;
    Age: number;
    Nationality: string;
    Positions: string;
    Year: number;
    Archetype: string;
    EstimatedPlayerQuality: number;
}

export const uploadPlayersFromCSV = (
    file: File,
    onSuccess: (players: Player[]) => void,
    onError: (error: any) => void
) => {
    Papa.parse<Player>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            try {
                const players: Player[] = results.data.map((player: any) => ({
                    Team: player.Team,
                    Name: player.Name,
                    Number: parseInt(player.Number),
                    Age: parseInt(player.Age),
                    Nationality: player.Nationality,
                    Positions: player["Position(s)"],
                    Year: parseInt(player.Year),
                    Archetype: player.Archetype,
                    EstimatedPlayerQuality: parseInt(player["Estimated Player Quality"]),
                }));
                onSuccess(players);
            } catch (error) {
                onError(error);
            }
        },
        error: onError,
    });
};