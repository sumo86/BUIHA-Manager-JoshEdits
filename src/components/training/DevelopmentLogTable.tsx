import { DevelopmentLog, Player } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DevelopmentLogTableProps {
  logs: DevelopmentLog[];
  roster: Player[];
}

export const DevelopmentLogTable = ({ logs, roster }: DevelopmentLogTableProps) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState('all');

  if (logs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No development changes have been logged yet. Advance the week to see player progression.
      </div>
    );
  }

  const filteredLogs = selectedPlayerId === 'all'
    ? logs
    : logs.filter(log => log.playerId === selectedPlayerId);

  return (
    <div className="space-y-4">
        <div className="w-full sm:w-1/3">
            <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by player..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Players</SelectItem>
                    {roster.sort((a,b) => a.name.localeCompare(b.name)).map(player => (
                        <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Attribute</TableHead>
                    <TableHead className="text-center">Change</TableHead>
                    <TableHead>New Value</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredLogs.length > 0 ? filteredLogs.map((log, index) => (
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
                    <TableCell>{log.newRating}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No development logs for the selected player.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
    </div>
  );
};