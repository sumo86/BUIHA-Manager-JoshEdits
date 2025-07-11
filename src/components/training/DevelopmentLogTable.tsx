import { DevelopmentLog } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import React from "react";

interface DevelopmentLogTableProps {
  logs: DevelopmentLog[];
}

export const DevelopmentLogTable = ({ logs }: DevelopmentLogTableProps) => {
  const logsByPlayer = React.useMemo(() => {
    if (logs.length === 0) {
      return [];
    }

    const grouped = logs.reduce((acc, log) => {
        const key = log.playerId;
        if (!acc[key]) {
            acc[key] = {
                playerName: log.playerName,
                logs: []
            };
        }
        acc[key].logs.push(log);
        return acc;
    }, {} as Record<string, { playerName: string; logs: DevelopmentLog[] }>);

    const months = ["August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June", "July"];

    Object.values(grouped).forEach(playerData => {
        playerData.logs.sort((a, b) => {
            if (a.date.year !== b.date.year) return b.date.year - a.date.year;
            const monthA = months.indexOf(a.date.month);
            const monthB = months.indexOf(b.date.month);
            if (monthA !== monthB) return monthB - monthA;
            return b.date.week - a.date.week;
        });
    });

    return Object.values(grouped).sort((a, b) => {
        if (!a.logs.length || !b.logs.length) return 0;
        const lastLogA = a.logs[0].date;
        const lastLogB = b.logs[0].date;
        if (lastLogA.year !== lastLogB.year) return lastLogB.year - lastLogA.year;
        const monthA = months.indexOf(lastLogA.month);
        const monthB = months.indexOf(lastLogB.month);
        if (monthA !== monthB) return monthB - monthA;
        return lastLogB.week - lastLogA.week;
    });
  }, [logs]);

  if (logsByPlayer.length === 0) {
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
            <TableHead>Player</TableHead>
            <TableHead>Total Updates</TableHead>
            <TableHead>Most Recent Change</TableHead>
            <TableHead className="w-[50px] text-right">View</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logsByPlayer.map((playerData) => (
            <Collapsible key={playerData.playerName} asChild>
              <>
                <TableRow className="border-b">
                  <TableCell className="font-medium">{playerData.playerName}</TableCell>
                  <TableCell>{playerData.logs.length}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {playerData.logs[0].date.month} {playerData.logs[0].date.year}, W{playerData.logs[0].date.week}
                  </TableCell>
                  <TableCell className="text-right">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronsUpDown className="h-4 w-4" />
                        <span className="sr-only">Toggle</span>
                      </Button>
                    </CollapsibleTrigger>
                  </TableCell>
                </TableRow>
                <CollapsibleContent asChild>
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <div className="p-4 bg-muted/50">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Attribute</TableHead>
                              <TableHead className="text-center">Change</TableHead>
                              <TableHead>New Rating</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {playerData.logs.map((log, index) => (
                              <TableRow key={index}>
                                <TableCell className="text-muted-foreground">
                                  {log.date.month} {log.date.year}, W{log.date.week}
                                </TableCell>
                                <TableCell>{log.attribute}</TableCell>
                                <TableCell className="text-center">
                                  {log.change > 0 ? (
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                      <ArrowUp className="mr-1 h-3 w-3" /> +{log.change.toFixed(2)}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-red-600 border-red-600">
                                      <ArrowDown className="mr-1 h-3 w-3" /> {log.change.toFixed(2)}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>{log.newRating.toFixed(1)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TableCell>
                  </TableRow>
                </CollapsibleContent>
              </>
            </Collapsible>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};