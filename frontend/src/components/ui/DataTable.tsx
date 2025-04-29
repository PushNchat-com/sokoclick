import React, { useState } from "react";
import { cn } from "../../utils/cn";
import { useLanguage } from "../../store/LanguageContext";
import Checkbox from "./Checkbox";
import { TranslationObject } from "../../types";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
  indeterminate?: boolean;
}

const CustomCheckbox: React.FC<CheckboxProps> = ({
  label,
  className = "",
  id,
  indeterminate,
  ...props
}) => {
  const ref = React.useRef<HTMLInputElement>(null!);

  React.useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = !props.checked && indeterminate;
    }
  }, [ref, indeterminate, props.checked]);

  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        id={id}
        ref={ref}
        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
        {...props}
      />
      {label && (
        <label
          htmlFor={id}
          className="ml-2 block text-sm text-gray-700 cursor-pointer"
        >
          {label}
        </label>
      )}
    </div>
  );
};

export interface Column<T> {
  id: string;
  header: TranslationObject | React.ReactNode;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => React.ReactNode;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  enableSorting?: boolean;
  sortingFn?: (a: T, b: T) => number;
  minWidth?: number;
  maxWidth?: number;
  width?: number;
  align?: "left" | "center" | "right";
  hidden?: boolean;
  sticky?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  loadingRows?: number;
  emptyState?: React.ReactNode;
  caption?: { en: string; fr: string } | React.ReactNode;
  className?: string;
  rowClassName?: string | ((row: T) => string);
  enableSorting?: boolean;
  defaultSortColumn?: string;
  defaultSortDirection?: "asc" | "desc";
  rowActions?: (row: T) => React.ReactNode;
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean;
  zebra?: boolean;
  compact?: boolean;
  pagination?: {
    pageSize: number;
    currentPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  enableRowSelection?: boolean;
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (newSelection: Record<string, boolean>) => void;
}

export const DataTable = <T extends {}>({
  data,
  columns,
  keyField,
  onRowClick,
  isLoading = false,
  loadingRows = 5,
  emptyState,
  caption,
  className,
  rowClassName,
  enableSorting = true,
  defaultSortColumn,
  defaultSortDirection = "asc",
  rowActions,
  stickyHeader = false,
  stickyFirstColumn = false,
  zebra = true,
  compact = false,
  pagination,
  enableRowSelection = false,
  rowSelection = {},
  onRowSelectionChange,
}: DataTableProps<T>) => {
  const { t } = useLanguage();
  const [sortColumn, setSortColumn] = useState<string | undefined>(
    defaultSortColumn,
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    defaultSortDirection,
  );

  const paginatedData = React.useMemo(() => {
    if (!pagination) return data;

    const { pageSize, currentPage } = pagination;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    return data.slice(start, end);
  }, [data, pagination]);

  const paginatedKeys = React.useMemo(
    () => paginatedData.map((row) => String(row[keyField])),
    [paginatedData, keyField],
  );
  const selectedPaginatedKeys = React.useMemo(
    () => paginatedKeys.filter((key) => rowSelection[key]),
    [paginatedKeys, rowSelection],
  );
  const isAllSelected =
    paginatedKeys.length > 0 &&
    selectedPaginatedKeys.length === paginatedKeys.length;
  const isSomeSelected = selectedPaginatedKeys.length > 0 && !isAllSelected;

  const tableColumns = React.useMemo(() => {
    const baseColumns = columns.filter((column) => !column.hidden);

    if (enableRowSelection) {
      const selectionColumn: Column<T> = {
        id: "__select__",
        header: (
          <CustomCheckbox
            checked={isAllSelected}
            indeterminate={isSomeSelected}
            onChange={(e) => {
              const newSelection = { ...rowSelection };
              if (e.target.checked) {
                paginatedKeys.forEach((key) => (newSelection[key] = true));
              } else {
                paginatedKeys.forEach((key) => delete newSelection[key]);
              }
              onRowSelectionChange?.(newSelection);
            }}
            aria-label={t({
              en: "Select all rows on this page",
              fr: "Sélectionner toutes les lignes de cette page",
            })}
          />
        ),
        cell: (row: T) => {
          const rowKey = String(row[keyField]);
          return (
            <CustomCheckbox
              checked={!!rowSelection[rowKey]}
              onChange={(e) => {
                const newSelection = { ...rowSelection };
                if (e.target.checked) {
                  newSelection[rowKey] = true;
                } else {
                  delete newSelection[rowKey];
                }
                onRowSelectionChange?.(newSelection);
              }}
              aria-label={t({ en: "Select row", fr: "Sélectionner la ligne" })}
            />
          );
        },
        width: 50,
        align: "center",
        sticky: stickyFirstColumn,
        enableSorting: false,
      };
      return [selectionColumn, ...baseColumns];
    }
    return baseColumns;
  }, [
    columns,
    enableRowSelection,
    stickyFirstColumn,
    rowSelection,
    onRowSelectionChange,
    keyField,
    t,
    isAllSelected,
    isSomeSelected,
    paginatedKeys,
  ]);

  const handleSort = (columnId: string) => {
    if (!enableSorting) return;

    const column = columns.find((col) => col.id === columnId);
    if (!column?.enableSorting) return;

    if (sortColumn === columnId) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn || !enableSorting) return data;

    const column = columns.find((col) => col.id === sortColumn);
    if (!column?.enableSorting) return data;

    return [...data].sort((a, b) => {
      let result = 0;

      if (column.sortingFn) {
        result = column.sortingFn(a, b);
      } else if (column.accessorKey) {
        const aValue = a[column.accessorKey];
        const bValue = b[column.accessorKey];

        if (typeof aValue === "string" && typeof bValue === "string") {
          result = aValue.localeCompare(bValue);
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          result = aValue - bValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          result = aValue.getTime() - bValue.getTime();
        }
      } else if (column.accessorFn) {
        const aValue = column.accessorFn(a);
        const bValue = column.accessorFn(b);

        if (typeof aValue === "string" && typeof bValue === "string") {
          result = aValue.localeCompare(bValue);
        }
      }

      return sortDirection === "asc" ? result : -result;
    });
  }, [data, sortColumn, sortDirection, columns, enableSorting]);

  const renderColumnHeader = (column: Column<T>, index: number) => {
    const isSorted = sortColumn === column.id;
    const sortIcon = isSorted ? (
      sortDirection === "asc" ? (
        <svg
          className="w-4 h-4 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      )
    ) : null;

    const stickyStyles =
      (stickyFirstColumn && index === 0) || column.sticky
        ? "sticky left-0 z-20 border-r border-gray-200 bg-gray-50"
        : "";

    const headerStyles = cn(
      "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
      column.align === "center" && "text-center",
      column.align === "right" && "text-right",
      column.enableSorting !== false &&
        enableSorting &&
        "cursor-pointer hover:bg-gray-100",
      stickyStyles,
      column.className,
    );

    const headerContent =
      column.header &&
      typeof column.header === "object" &&
      "en" in column.header
        ? t(column.header)
        : column.header;

    const headerStyles2 = {
      minWidth: column.minWidth || 100,
      maxWidth: column.maxWidth,
      width: column.width,
    };

    return (
      <th
        key={column.id}
        scope="col"
        className={headerStyles}
        style={headerStyles2}
        onClick={() =>
          column.enableSorting !== false &&
          enableSorting &&
          handleSort(column.id)
        }
        aria-sort={
          isSorted
            ? sortDirection === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
      >
        <div className="flex items-center">
          {headerContent}
          {column.enableSorting !== false && enableSorting && (
            <span className="ml-1">{sortIcon}</span>
          )}
        </div>
      </th>
    );
  };

  const renderRows = () => {
    if (isLoading) {
      return Array.from({ length: loadingRows }).map((_, rowIndex) => (
        <tr key={`loading-${rowIndex}`} className="animate-pulse">
          {tableColumns.map((column, colIndex) => {
            const stickyStyles =
              (stickyFirstColumn && colIndex === 0) || column.sticky
                ? "sticky left-0 z-10 border-r border-gray-200 bg-white"
                : "";

            return (
              <td
                key={`loading-${rowIndex}-${colIndex}`}
                className={cn("px-6 py-4 whitespace-nowrap", stickyStyles)}
              >
                <div className="h-4 bg-gray-200 rounded"></div>
              </td>
            );
          })}
          {rowActions && (
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="h-8 w-20 bg-gray-200 rounded"></div>
            </td>
          )}
        </tr>
      ));
    }

    if (paginatedData.length === 0) {
      return (
        <tr>
          <td
            colSpan={tableColumns.length + (rowActions ? 1 : 0)}
            className="px-6 py-10 text-center text-sm text-gray-500"
          >
            {emptyState || (
              <div className="text-center py-6">
                {t({ en: "No data available", fr: "Aucune donnée disponible" })}
              </div>
            )}
          </td>
        </tr>
      );
    }

    return paginatedData.map((row, rowIndex) => {
      const key = String(row[keyField]);
      const baseRowClassName = "hover:bg-gray-50 transition-colors";
      const zebraClassName = zebra && rowIndex % 2 === 1 ? "bg-gray-50" : "";
      const clickableClassName = onRowClick ? "cursor-pointer" : "";

      let customRowClassName = "";
      if (typeof rowClassName === "function") {
        customRowClassName = rowClassName(row);
      } else if (rowClassName) {
        customRowClassName = rowClassName;
      }

      const cells: React.ReactNode[] = [];

      tableColumns.forEach((column, colIndex) => {
        let cellContent;

        if (column.cell) {
          cellContent = column.cell(row);
        } else if (column.accessorFn) {
          cellContent = column.accessorFn(row);
        } else if (column.accessorKey) {
          const value = row[column.accessorKey];
          if (value === null || value === undefined) {
            cellContent = "-";
          } else if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
          ) {
            cellContent = String(value);
          } else {
            cellContent = "[Object]";
          }
        } else {
          cellContent = "-";
        }

        const stickyStyles =
          (stickyFirstColumn && colIndex === 0) || column.sticky
            ? "sticky left-0 z-10 border-r border-gray-200 bg-white"
            : "";

        const cellClassName = cn(
          "px-6 py-4 whitespace-nowrap",
          compact ? "py-2" : "",
          column.align === "center" && "text-center",
          column.align === "right" && "text-right",
          stickyStyles,
          zebraClassName && stickyStyles && rowIndex % 2 === 1
            ? "bg-gray-50"
            : "",
        );

        cells.push(
          <td key={`${key}-${colIndex}`} className={cellClassName}>
            {cellContent}
          </td>,
        );
      });

      if (rowActions) {
        cells.push(
          <td
            key={`${key}-actions`}
            className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
          >
            {rowActions(row)}
          </td>,
        );
      }

      return (
        <tr
          key={key}
          className={cn(
            baseRowClassName,
            zebraClassName,
            clickableClassName,
            customRowClassName,
          )}
          onClick={() => onRowClick?.(row)}
          tabIndex={onRowClick ? 0 : undefined}
          onKeyDown={
            onRowClick ? (e) => e.key === "Enter" && onRowClick(row) : undefined
          }
        >
          {cells}
        </tr>
      );
    });
  };

  const renderPagination = () => {
    if (!pagination) return null;

    const { pageSize, currentPage, totalItems, onPageChange } = pagination;
    const totalPages = Math.ceil(totalItems / pageSize);

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    let pageNumbers: (number | "...")[] = [];
    if (totalPages <= 7) {
      pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      pageNumbers = [1];

      if (currentPage > 3) {
        pageNumbers.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (currentPage < totalPages - 2) {
        pageNumbers.push("...");
      }

      pageNumbers.push(totalPages);
    }

    return (
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              {t({
                en: `Showing ${startItem} to ${endItem} of ${totalItems} results`,
                fr: `Affichage de ${startItem} à ${endItem} sur ${totalItems} résultats`,
              })}
            </p>
          </div>
          <div>
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium",
                  currentPage === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:bg-gray-50",
                )}
              >
                <span className="sr-only">
                  {t({ en: "Previous", fr: "Précédent" })}
                </span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <div className="md:hidden flex items-center px-4 text-sm text-gray-700">
                <span>{currentPage}</span>
                <span className="mx-1">/</span>
                <span>{totalPages}</span>
              </div>

              <div className="hidden md:flex">
                {pageNumbers.map((page, index) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={`page-${page}`}
                      onClick={() => onPageChange(page)}
                      className={cn(
                        "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                        currentPage === page
                          ? "z-10 bg-primary-50 border-primary-500 text-primary-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50",
                      )}
                      aria-current={currentPage === page ? "page" : undefined}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className={cn(
                  "relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium",
                  currentPage === totalPages
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:bg-gray-50",
                )}
              >
                <span className="sr-only">
                  {t({ en: "Next", fr: "Suivant" })}
                </span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>

        <div className="flex items-center justify-between sm:hidden">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={cn(
              "relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md",
              currentPage === 1
                ? "text-gray-300 bg-gray-50 cursor-not-allowed"
                : "text-gray-700 bg-white hover:bg-gray-50",
            )}
          >
            {t({ en: "Previous", fr: "Précédent" })}
          </button>
          <div className="text-sm text-gray-700">
            <span>{currentPage}</span>
            <span className="mx-1">/</span>
            <span>{totalPages}</span>
          </div>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={cn(
              "relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md",
              currentPage === totalPages
                ? "text-gray-300 bg-gray-50 cursor-not-allowed"
                : "text-gray-700 bg-white hover:bg-gray-50",
            )}
          >
            {t({ en: "Next", fr: "Suivant" })}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-gray-200",
        className,
      )}
    >
      {caption && (
        <caption className="py-2 px-4 text-sm text-left text-gray-600 bg-gray-50 border-b border-gray-200">
          {typeof caption === "object" && "en" in caption
            ? t(caption)
            : caption}
        </caption>
      )}
      <div className="overflow-x-auto min-w-full">
        <table className="min-w-full divide-y divide-gray-200">
          <thead
            className={cn("bg-gray-50", stickyHeader && "sticky top-0 z-30")}
          >
            <tr>
              {tableColumns.map((column, index) =>
                renderColumnHeader(column, index),
              )}
              {rowActions && (
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">
                    {t({ en: "Actions", fr: "Actions" })}
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {renderRows()}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
};
