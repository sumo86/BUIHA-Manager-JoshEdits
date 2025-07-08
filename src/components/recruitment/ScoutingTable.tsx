import { useMemo } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Player } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { useState } from 'react';

export const ScoutingTable = () => {
  const { scoutingPool, recruitPlayer } = useTeam();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Player>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'age',
        header: 'Age',
      },
      {
        accessorKey: 'nationality',
        header: 'Nat',
      },
      {
        accessorKey: 'positions',
        header: 'Pos',
        cell: ({ row }) => row.original.positions.join(', '),
      },
      {
        accessorKey: 'estimatedQuality',
        header: 'Est. Quality',
        cell: ({ row }) => <Badge variant="outline">{row.original.estimatedQuality}</Badge>,
      },
      // Removed starRating column to keep it a surprise
      {
        accessorKey: 'recruitmentCost',
        header: 'Cost',
        cell: ({ row }) => `£${row.original.recruitmentCost?.toLocaleString()}`,
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <Button variant="secondary" size="sm" onClick={() => recruitPlayer(row.original.id)}>
            Recruit
          </Button>
        ),
      },
    ],
    [recruitPlayer]
  );

  const table = useReactTable({
    data: scoutingPool,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <div
                      {...{
                        className: header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                        onClick: header.column.getToggleSortingHandler(),
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No players in scouting pool.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end space-x-2 py-4 px-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
};