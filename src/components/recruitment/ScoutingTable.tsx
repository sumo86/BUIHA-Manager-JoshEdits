import { useMemo } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Player } from '@/types';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  SortingFn,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';

// Define the custom sorting function
const qualityOrder: Player['estimatedQuality'][] = ['Beginner', 'Moderate', 'Intermediate', 'Experienced', 'Elite'];

const qualitySortingFn: SortingFn<Player> = (rowA, rowB, columnId) => {
  const qualityA = rowA.getValue(columnId) as Player['estimatedQuality'];
  const qualityB = rowB.getValue(columnId) as Player['estimatedQuality'];
  // Custom sort logic: higher index (better quality) should come first when descending
  return qualityOrder.indexOf(qualityA) - qualityOrder.indexOf(qualityB);
};

export const ScoutingTable = ({ data }: { data: Player[] }) => {
    const { recruitPlayer } = useTeam();
    const [sorting, setSorting] = useState<SortingState>([]);

    const columns = useMemo<ColumnDef<Player>[]>(() => [
        {
            accessorKey: 'name',
            header: 'Name',
        },
        {
            accessorKey: 'estimatedQuality',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Est. Quality
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            sortingFn: qualitySortingFn,
        },
        {
            accessorKey: 'positions',
            header: 'Position(s)',
            cell: ({ row }) => row.original.positions.join(', '),
        },
        {
            accessorKey: 'age',
            header: 'Age',
        },
        {
            accessorKey: 'nationality',
            header: 'Nationality',
        },
        {
            accessorKey: 'source',
            header: 'Source',
        },
        {
            accessorKey: 'recruitmentCost',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Cost
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => `£${row.original.recruitmentCost?.toLocaleString()}`,
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const player = row.original;
                return (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => recruitPlayer(player.id)}
                    >
                        Recruit
                    </Button>
                );
            },
        },
    ], [recruitPlayer]);

    const table = useReactTable({
        data: data,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map(row => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && 'selected'}
                            >
                                {row.getVisibleCells().map(cell => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No potential recruits available.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};