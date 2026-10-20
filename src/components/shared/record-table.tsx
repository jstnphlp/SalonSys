"use client";
import { useMemo, useState, type ReactNode } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { AppDataTable } from "./app-data-table";
import { Input } from "@/components/ui/input";
export function RecordTable<T extends { id: string }>({
  data,
  columns,
  searchText,
  action,
  emptyTitle = "No records yet",
}: {
  data: T[];
  columns: ColumnDef<T>[];
  searchText: (row: T) => string;
  action?: ReactNode;
  emptyTitle?: string;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const filtered = useMemo(() => {
    const rows = data.filter((r) =>
      searchText(r).toLowerCase().includes(search.toLowerCase()),
    );
    const sort = sorting[0];
    if (sort)
      rows.sort((a, b) => {
        const x = String((a as Record<string, unknown>)[sort.id] ?? "");
        const y = String((b as Record<string, unknown>)[sort.id] ?? "");
        return (
          x.localeCompare(y, undefined, { numeric: true }) *
          (sort.desc ? -1 : 1)
        );
      });
    return rows;
  }, [data, search, searchText, sorting]);
  const safePage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / size) - 1),
  );
  return (
    <AppDataTable
      columns={columns}
      data={filtered.slice(safePage * size, (safePage + 1) * size)}
      pageIndex={safePage}
      pageSize={size}
      pageCount={Math.ceil(filtered.length / size)}
      totalRows={filtered.length}
      sorting={sorting}
      onSortingChange={(s) => {
        setSorting(s);
        setPage(0);
      }}
      onPageChange={setPage}
      onPageSizeChange={(s) => {
        setSize(s);
        setPage(0);
      }}
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="max-w-sm"
            aria-label="Search records"
            placeholder="Search records…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
          {action}
        </div>
      }
      emptyTitle={emptyTitle}
      emptyDescription="Add a record to get started, or change your search."
    />
  );
}
