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
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";

import { ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";
import { Input } from "../Input";
import { Checkbox } from "../Checkbox";
import { PaginationControls } from "./PaginationControls";

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
};

export function DataTable<T extends object>({
  columns,
  data,
  actions,
  page,
  pageSize,
  onPageChange,
  totalPages,
  enableRowSelection = true,
  rowIdKey = "id" as keyof T,
  onFilterChange,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [filters, setFilters] = React.useState<Record<string, string>>({});

  const columnDefs = React.useMemo<ColumnDef<T>[]>(() => {
    const cols: ColumnDef<T>[] = [];

    if (enableRowSelection) {
      cols.push({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
            aria-label="Seleccionar todas las filas"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Seleccionar fila"
            className="translate-y-[2px]"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      });
    }

    cols.push(
      ...columns.map((col) => ({
        accessorKey: col.accessor as string,
        header: col.header,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cell: ({ getValue, row }: { getValue: any; row: any }) => {
          const value = getValue() as T[keyof T];
          const originalRow = row.original;
          return col.render
            ? col.render(value, originalRow)
            : String(value ?? "");
        },
      })),
    );

    if (actions) {
      cols.push({
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            {actions(row.original)}
          </div>
        ),
      });
    }

    return cols;
  }, [columns, actions, enableRowSelection]);

  // eslint-disable-next-line
  const table = useReactTable({
    data,
    columns: columnDefs,
    state: { sorting, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => String(row[rowIdKey]),
  });

  // Paginación
  const pageRows = table.getRowModel().rows;
  const [internalPage, setInternalPage] = React.useState(1);

  const currentPage = page ?? internalPage;
  // CORRECCIÓN 1: Eliminamos 'currentPageSize' que no se usaba.

  // CORRECCIÓN 2: Usamos if/else en lugar de ternario para evitar el error de "unused expression"
  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  React.useEffect(() => {
    if (pageSize) {
      table.setPageSize(pageSize);
    }
    if (page) {
      table.setPageIndex(page - 1);
    }
  }, [table, pageSize, page]);

  const renderFilters = () => (
    <div className="flex flex-wrap gap-4 mb-4">
      {columns
        .filter((col) => col.filterable)
        .map((col) => (
          <div key={String(col.accessor)} className="flex flex-col">
            <label className="text-sm font-medium">{col.header}</label>

            {col.filterType === "select" && col.filterOptions ? (
              <select
                value={filters[col.accessor as string] || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters((prev) => ({
                    ...prev,
                    [col.accessor as string]: value,
                  }));
                  onFilterChange?.(col.accessor as string, value);
                }}
                className="border rounded p-2 text-sm"
              >
                <option value="">Todos</option>
                {col.filterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                placeholder={`Buscar ${col.header}`}
                value={filters[col.accessor as string] || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters((prev) => ({
                    ...prev,
                    [col.accessor as string]: value,
                  }));
                  onFilterChange?.(col.accessor as string, value);
                }}
              />
            )}
          </div>
        ))}
    </div>
  );

  return (
    <div className="w-full">
      {renderFilters()}

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer select-none"
                  >
                    {header.isPlaceholder ? null : (
                      <span className="inline-flex items-center">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "asc" && (
                          <ArrowUp className="ml-1 h-4 w-4" />
                        )}
                        {header.column.getIsSorted() === "desc" && (
                          <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {pageRows.length ? (
              pageRows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay datos disponibles
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        page={currentPage}
        totalPages={totalPages ?? table.getPageCount()}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
