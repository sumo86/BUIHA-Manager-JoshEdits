import { DevelopmentLog } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DevelopmentLogTableProps {
  logs: DevelopmentLog[];
}

export const DevelopmentLogTable = ({ logs }: DevelopmentLogTableProps) => {
  if (logs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No development changes have been logged yet. Advance the week to see player progression.
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Attribute</TableHead>
            <TableHead className="text-center">Change</TableHead>
            <TableHead>New Star Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log, index) => (
            <TableRow key={`${log.playerId}-${log.attribute}-${index}`}>
              <TableCell className="text-muted-foreground">
                {log.date.month} {log.date.year}, W{log.date.week}
              </TableCell>
              <TableCell className="font-medium">{log.playerName}</TableCell>
              <TableCell>{log.attribute}</TableCell>
              <TableCell className="text-center">
                {log.change > 0 ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <ArrowUp className="mr-1 h-3 w-3" /> +{log.change}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    <ArrowDown className="mr-1 h-3 w-3" /> {log.change}
                  </Badge>
                )}
              </TableCell>
              <TableCell>{log.newRating.toFixed(1)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};