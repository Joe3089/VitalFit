"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  VisibilityState,
} from "@tanstack/react-table";

import { PaginationControls } from "./PaginationControls";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Checkbox } from "../checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";

export type Column<T> = {
  header: string;
  accessor: keyof T;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  filterable?: boolean;
  filterType?: "text" | "select";
  filterOptions?: { label: string; value: string }[];
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  actions?: (row: T) => React.ReactNode;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  totalPages?: number;
  enableRowSelection?: boolean;
  rowIdKey?: keyof T;
  onFilterChange?: (key: string, value: string) => void;
  isLoading?: boolean;
};

export function DataTable<T extends object>({
  columns,
  data,
  actions,
  page = 1,
  pageSize = 10,
  onPageChange,
  totalPages = 1,
  enableRowSelection = true,
  isLoading = false,
  rowIdKey = "id" as keyof T,
}: DataTableProps<T>) {

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const columnDefs = React.useMemo<ColumnDef<T>[]>(() => {
    const cols: ColumnDef<T>[] = [];

    // if (enableRowSelection) {
    //   cols.push({
    //     id: "select",
    //     header: ({ table }) => (
    //       <Checkbox
    //         checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
    //         onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //         aria-label="Seleccionar todos"
    //       />
    //     ),
    //     cell: ({ row }) => (
    //       <Checkbox
    //         checked={row.getIsSelected()}
    //         onCheckedChange={(value) => row.toggleSelected(!!value)}
    //         aria-label="Seleccionar fila"
    //       />
    //     ),
    //     enableSorting: false,
    //   });
    // }

    cols.push(
      ...columns.map((col) => ({
        accessorKey: col.accessor as string,
        header: col.header,
        cell: ({ getValue, row }: any) => {
          const value = getValue();
          return col.render ? col.render(value, row.original) : String(value ?? "");
        },
      }))
    );

    if (actions) {
      cols.push({
        id: "actions",
        header: () => <div className="text-center">Acciones</div>,
        cell: ({ row }) => actions(row.original),
      });
    }

    return cols;
  }, [columns, actions, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: columnDefs,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
      pagination: {
        pageIndex: page - 1,
        pageSize: pageSize,
      },
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => String(row[rowIdKey]),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="w-full space-y-4">
      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <Table>
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ArrowUp className="h-3 w-3" />,
                        desc: <ArrowDown className="h-3 w-3" />,
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
         <TableBody>
            {/* VALIDACIÓN DE CARGA */}
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columnDefs.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    <span>Cargando datos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnDefs.length} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {data.length} fila(s) seleccionadas.
        </div>

        <PaginationControls
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange ?? (() => { })}
        />
      </div>
    </div>
  );
}