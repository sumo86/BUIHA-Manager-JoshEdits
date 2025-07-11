import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamRecord, RecordCategory } from "@/types";

interface HistoryRecordsProps {
  title: string;
  records: { [key in RecordCategory]?: TeamRecord };
  categories: RecordCategory[];
  showSeason?: boolean;
}

export const HistoryRecords = ({ title, records, categories, showSeason = false }: HistoryRecordsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">Record</TableHead>
              {showSeason && <TableHead>Season</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(category => {
              const record = records[category];
              return (
                <TableRow key={category}>
                  <TableCell className="font-semibold">{category}</TableCell>
                  {record ? (
                    <>
                      <TableCell>{record.playerName}</TableCell>
                      <TableCell>{record.teamName}</TableCell>
                      <TableCell className="text-right">{record.value.toLocaleString()}</TableCell>
                      {showSeason && <TableCell>{record.season}</TableCell>}
                    </>
                  ) : (
                    <TableCell colSpan={showSeason ? 4 : 3} className="text-center text-muted-foreground">
                      No Record
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};