import React, { useState, useEffect, useMemo } from "react";
import { cn } from "../../utils/cn";
import Checkbox from "../atoms/Checkbox";

export interface Column<T> {
  id: string;
  header: React.ReactNode;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  headerClassName?: string;
  cellClassName?: string;
}

export type SortDirection = "asc" | "desc";

export interface SortState {
  id: string;
  direction: SortDirection;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onRowClick?: (item: T) => void;
  sortable?: boolean;
  initialSortState?: SortState;
  onSortChange?: (sortState: SortState) => void;
  loading?: boolean;
  loadingRows?: number;
  emptyMessage?: React.ReactNode;
  striped?: boolean;
  bordered?: boolean;
  dense?: boolean;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: string;
  getCellProps?: (column: Column<T>, item: T) => Record<string, any>;
  getRowProps?: (item: T) => Record<string, any>;
}

function Table<T>({
  data,
  columns,
  keyExtractor,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  onRowClick,
  sortable = false,
  initialSortState,
  onSortChange,
  loading = false,
  loadingRows = 5,
  emptyMessage = "No data to display",
  striped = true,
  bordered = false,
  dense = false,
  className = "",
  tableClassName = "",
  headerClassName = "",
  bodyClassName = "",
  rowClassName = "",
  getCellProps,
  getRowProps,
}: TableProps<T>) {
  const [internalSelectedIds, setInternalSelectedIds] =
    useState<string[]>(selectedIds);
  const [sortState, setSortState] = useState<SortState | undefined>(
    initialSortState,
  );

  // Update internal selection state when props change
  useEffect(() => {
    setInternalSelectedIds(selectedIds);
  }, [selectedIds]);

  // Handle row selection
  const handleRowSelection = (id: string, checked: boolean) => {
    let newSelectedIds: string[];
    if (checked) {
      newSelectedIds = [...internalSelectedIds, id];
    } else {
      newSelectedIds = internalSelectedIds.filter(
        (selectedId) => selectedId !== id,
      );
    }

    setInternalSelectedIds(newSelectedIds);
    onSelectionChange?.(newSelectedIds);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    let newSelectedIds: string[];
    if (checked) {
      newSelectedIds = data.map(keyExtractor);
    } else {
      newSelectedIds = [];
    }

    setInternalSelectedIds(newSelectedIds);
    onSelectionChange?.(newSelectedIds);
  };

  // Handle sorting
  const handleSort = (columnId: string) => {
    if (!sortable) return;

    let newSortState: SortState;

    if (sortState?.id === columnId) {
      // Toggle direction if already sorting by this column
      newSortState = {
        id: columnId,
        direction: sortState.direction === "asc" ? "desc" : "asc",
      };
    } else {
      // Default to ascending for a new sort column
      newSortState = {
        id: columnId,
        direction: "asc",
      };
    }

    setSortState(newSortState);
    onSortChange?.(newSortState);
  };

  // Determine if all rows are selected
  const allSelected =
    data.length > 0 && internalSelectedIds.length === data.length;
  const someSelected =
    internalSelectedIds.length > 0 && internalSelectedIds.length < data.length;

  // Table container classes
  const containerClasses = cn("overflow-x-auto", className);

  // Table classes
  const tableClasses = cn(
    "min-w-full divide-y divide-gray-200",
    bordered ? "border border-gray-200" : "",
    tableClassName,
  );

  // Header classes
  const headerClasses = cn("bg-gray-50", headerClassName);

  // Body classes
  const bodyClasses = cn("bg-white divide-y divide-gray-200", bodyClassName);

  // Generate skeleton rows for loading state
  const loadingRowsArray = useMemo(() => {
    return Array.from({ length: loadingRows }).map((_, index) => index);
  }, [loadingRows]);

  return (
    <div className={containerClasses}>
      <table className={tableClasses}>
        <thead className={headerClasses}>
          <tr>
            {selectable && (
              <th scope="col" className="px-3 py-3.5 w-10">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Select all"
                  hideLabel
                />
              </th>
            )}

            {columns.map((column) => {
              const headerCellClasses = cn(
                "px-3 py-3.5 text-left text-sm font-semibold text-gray-900",
                column.headerClassName,
                column.sortable && sortable
                  ? "cursor-pointer hover:bg-gray-100"
                  : "",
                dense ? "py-2" : "",
              );

              const sortIcon =
                sortState?.id === column.id ? (
                  <span className="ml-1 inline-block">
                    {sortState.direction === "asc" ? (
                      <svg
                        className="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </span>
                ) : null;

              return (
                <th
                  key={column.id}
                  scope="col"
                  className={headerCellClasses}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                  }}
                  onClick={() =>
                    column.sortable && sortable
                      ? handleSort(column.id)
                      : undefined
                  }
                  aria-sort={
                    sortState?.id === column.id
                      ? sortState.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && sortable && sortIcon}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className={bodyClasses}>
          {loading ? (
            // Loading state
            loadingRowsArray.map((index) => (
              <tr key={`loading-${index}`} className="animate-pulse">
                {selectable && (
                  <td className="px-3 py-4 w-10">
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={`loading-${index}-${column.id}`}
                    className="px-3 py-4"
                  >
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            // Empty state
            <tr>
              <td
                colSpan={selectable ? columns.length + 1 : columns.length}
                className="px-3 py-4 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            // Data rows
            data.map((item, rowIndex) => {
              const rowId = keyExtractor(item);
              const isSelected = internalSelectedIds.includes(rowId);

              const rowClasses = cn(
                isSelected
                  ? "bg-blue-50"
                  : striped && rowIndex % 2 === 1
                    ? "bg-gray-50"
                    : "",
                onRowClick ? "cursor-pointer hover:bg-gray-100" : "",
                rowClassName,
              );

              const customRowProps = getRowProps ? getRowProps(item) : {};

              return (
                <tr
                  key={rowId}
                  className={rowClasses}
                  onClick={() => onRowClick && onRowClick(item)}
                  {...customRowProps}
                >
                  {selectable && (
                    <td
                      className="px-3 py-4 w-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        id={`select-${rowId}`}
                        checked={isSelected}
                        onChange={(e) =>
                          handleRowSelection(rowId, e.target.checked)
                        }
                        aria-label={`Select row ${rowId}`}
                        hideLabel
                      />
                    </td>
                  )}

                  {columns.map((column) => {
                    const cellClasses = cn(
                      "px-3 py-4 text-sm text-gray-500",
                      column.cellClassName,
                      dense ? "py-2" : "",
                    );

                    const customCellProps = getCellProps
                      ? getCellProps(column, item)
                      : {};

                    return (
                      <td
                        key={`${rowId}-${column.id}`}
                        className={cellClasses}
                        {...customCellProps}
                      >
                        {column.accessor(item)}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
