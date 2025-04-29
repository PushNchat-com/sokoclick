import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../../utils/cn";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { Loader, LoaderSkeleton } from "../atoms/Loader";
import { ActionMenu } from "../molecules/ActionMenu";
import { useLanguage } from "../../../store/LanguageContext";

export interface Column<T> {
  id: string;
  header: { en: string; fr: string } | React.ReactNode;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => React.ReactNode;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  enableSorting?: boolean;
  sortingFn?: (a: T, b: T) => number;
  minWidth?: number;
  maxWidth?: number;
  width?: string | number;
  align?: "left" | "center" | "right";
  hidden?: boolean;
  sticky?: boolean;
  meta?: Record<string, any>;
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
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: string | ((row: T) => string);
  enableSorting?: boolean;
  defaultSortColumn?: string;
  defaultSortDirection?: "asc" | "desc";
  rowActions?: (row: T) => React.ReactNode;
  batchActions?: React.ReactNode;
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
  selectable?: boolean;
  selectedItems?: T[];
  onSelectItems?: (items: T[]) => void;
  selectionType?: "checkbox" | "radio";
  verticalScroll?: boolean;
  verticalScrollHeight?: string | number;
  horizontalScroll?: boolean;
  tooltips?: boolean;
  showRowNumbers?: boolean;
  noResults?: { en: string; fr: string } | string;
  loading?: { en: string; fr: string } | string;
  accessibilityLabel?: { en: string; fr: string } | string;
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
  tableClassName,
  headerClassName,
  bodyClassName,
  rowClassName,
  enableSorting = true,
  defaultSortColumn,
  defaultSortDirection = "asc",
  rowActions,
  batchActions,
  stickyHeader = false,
  stickyFirstColumn = false,
  zebra = true,
  compact = false,
  pagination,
  selectable = false,
  selectedItems = [],
  onSelectItems,
  selectionType = "checkbox",
  verticalScroll = false,
  verticalScrollHeight,
  horizontalScroll = false,
  tooltips = true,
  showRowNumbers = false,
  noResults,
  loading,
  accessibilityLabel,
}: DataTableProps<T>) => {
  const { t } = useLanguage();
  const [sortColumn, setSortColumn] = useState<string | undefined>(
    defaultSortColumn,
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    defaultSortDirection,
  );
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [allSelected, setAllSelected] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Text constants
  const textNoResults =
    typeof noResults === "object"
      ? t(noResults)
      : noResults || t({ en: "No results found", fr: "Aucun résultat trouvé" });
  const textLoading =
    typeof loading === "object"
      ? t(loading)
      : loading || t({ en: "Loading...", fr: "Chargement..." });
  const tableLabel =
    typeof accessibilityLabel === "object"
      ? t(accessibilityLabel)
      : accessibilityLabel || "";

  // Initialize selected rows from props
  useEffect(() => {
    if (selectedItems && selectedItems.length > 0) {
      const newSelectedRows: Record<string, boolean> = {};

      selectedItems.forEach((item) => {
        const key = String(item[keyField]);
        newSelectedRows[key] = true;
      });

      setSelectedRows(newSelectedRows);

      // Set allSelected if all rows are selected
      if (data.length > 0 && selectedItems.length === data.length) {
        setAllSelected(true);
      } else {
        setAllSelected(false);
      }
    } else {
      setSelectedRows({});
      setAllSelected(false);
    }
  }, [selectedItems, keyField, data]);

  // Detect horizontal overflow
  useEffect(() => {
    const checkOverflow = () => {
      if (scrollContainerRef.current) {
        const hasHorizontalOverflow =
          scrollContainerRef.current.scrollWidth >
          scrollContainerRef.current.clientWidth;
        setHasOverflow(hasHorizontalOverflow);
      }
    };

    checkOverflow();

    // Check on window resize
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [data, columns]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn || !enableSorting) return data;

    const column = columns.find((col) => col.id === sortColumn);
    if (!column) return data;

    return [...data].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      if (column.sortingFn) {
        return sortDirection === "asc"
          ? column.sortingFn(a, b)
          : column.sortingFn(b, a);
      }

      if (column.accessorFn) {
        valueA = column.accessorFn(a);
        valueB = column.accessorFn(b);
      } else if (column.accessorKey) {
        valueA = a[column.accessorKey];
        valueB = b[column.accessorKey];
      } else {
        return 0;
      }

      // Convert to comparable types
      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortDirection === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      // Handle dates
      if (valueA instanceof Date && valueB instanceof Date) {
        return sortDirection === "asc"
          ? valueA.getTime() - valueB.getTime()
          : valueB.getTime() - valueA.getTime();
      }

      // Default comparison
      if (valueA === valueB) return 0;

      if (valueA === null || valueA === undefined)
        return sortDirection === "asc" ? -1 : 1;
      if (valueB === null || valueB === undefined)
        return sortDirection === "asc" ? 1 : -1;

      return sortDirection === "asc"
        ? valueA < valueB
          ? -1
          : 1
        : valueA < valueB
          ? 1
          : -1;
    });
  }, [data, sortColumn, sortDirection, columns, enableSorting]);

  // Handle sorting
  const handleSort = (columnId: string) => {
    if (!enableSorting) return;

    const column = columns.find((col) => col.id === columnId);
    if (!column || column.enableSorting === false) return;

    if (sortColumn === columnId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  // Handle row selection
  const handleSelectRow = (
    event: React.ChangeEvent<HTMLInputElement>,
    rowKey: string,
  ) => {
    event.stopPropagation();

    const newSelectedRows = { ...selectedRows };

    if (selectionType === "radio") {
      // Radio selection (single select)
      Object.keys(newSelectedRows).forEach((key) => {
        newSelectedRows[key] = false;
      });
      newSelectedRows[rowKey] = event.target.checked;
    } else {
      // Checkbox selection (multi-select)
      newSelectedRows[rowKey] = event.target.checked;
    }

    setSelectedRows(newSelectedRows);

    // Update all selected state
    const allRowsSelected =
      data.length > 0 &&
      data.every((row) => newSelectedRows[String(row[keyField])]);
    setAllSelected(allRowsSelected);

    // Call onSelectItems callback with selected items
    if (onSelectItems) {
      const selectedItemsList = data.filter(
        (row) => newSelectedRows[String(row[keyField])],
      );
      onSelectItems(selectedItemsList);
    }
  };

  // Handle select all rows
  const handleSelectAllRows = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();

    const isChecked = event.target.checked;
    setAllSelected(isChecked);

    const newSelectedRows: Record<string, boolean> = {};
    data.forEach((row) => {
      newSelectedRows[String(row[keyField])] = isChecked;
    });

    setSelectedRows(newSelectedRows);

    // Call onSelectItems callback with selected items
    if (onSelectItems) {
      const selectedItemsList = isChecked ? [...data] : [];
      onSelectItems(selectedItemsList);
    }
  };

  // Render column headers
  const renderColumnHeader = (column: Column<T>, index: number) => {
    if (column.hidden) return null;

    const isSortable = enableSorting && column.enableSorting !== false;
    const isSorted = sortColumn === column.id;

    const handleHeaderClick = () => {
      if (isSortable) {
        handleSort(column.id);
      }
    };

    // Determine sort direction icon
    let sortIcon = null;
    if (isSorted) {
      sortIcon =
        sortDirection === "asc" ? (
          <Icon name="chevron-up" size="sm" aria-hidden="true" />
        ) : (
          <Icon name="chevron-down" size="sm" aria-hidden="true" />
        );
    } else if (isSortable) {
      sortIcon = (
        <Icon
          name="chevron-down"
          className="opacity-0 group-hover:opacity-50"
          size="sm"
          aria-hidden="true"
        />
      );
    }

    const isFirstColumn = index === 0;
    const isSelectionColumn = selectable && index === 0;
    const isRowNumberColumn =
      showRowNumbers && (selectable ? index === 1 : index === 0);

    // Header styles
    const headerStyles = {
      minWidth: column.minWidth,
      maxWidth: column.maxWidth,
      width: column.width,
      textAlign: column.align || "left",
    };

    // Header class names
    const headerClasses = cn(
      "px-3 py-3 font-medium text-sm text-gray-700 select-none",
      column.align === "center" && "text-center",
      column.align === "right" && "text-right",
      isSortable && "cursor-pointer hover:bg-gray-50 group",
      isSorted && "bg-gray-50",
      stickyHeader && "sticky top-0 bg-white z-20 shadow-sm",
      stickyFirstColumn && isFirstColumn && "sticky left-0 bg-white z-10",
      compact ? "py-2" : "py-3",
      column.headerClassName,
      headerClassName,
    );

    const headerContent =
      typeof column.header === "object" && "en" in column.header
        ? t(column.header)
        : column.header;

    // Special handling for selection column
    if (isSelectionColumn) {
      return (
        <th
          key={`th-${column.id}`}
          className={headerClasses}
          style={headerStyles}
          scope="col"
        >
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAllRows}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              aria-label={t({
                en: "Select all rows",
                fr: "Sélectionner toutes les lignes",
              })}
            />
          </div>
        </th>
      );
    }

    // Special handling for row number column
    if (isRowNumberColumn) {
      return (
        <th
          key={`th-${column.id}`}
          className={headerClasses}
          style={headerStyles}
          scope="col"
        >
          <span className="sr-only">
            {t({ en: "Row number", fr: "Numéro de ligne" })}
          </span>
          #
        </th>
      );
    }

    return (
      <th
        key={`th-${column.id}`}
        className={headerClasses}
        style={headerStyles}
        onClick={handleHeaderClick}
        scope="col"
        role={isSortable ? "columnheader button" : "columnheader"}
        aria-sort={
          isSorted
            ? sortDirection === "asc"
              ? "ascending"
              : "descending"
            : undefined
        }
        data-column-id={column.id}
        title={
          tooltips && isSortable
            ? t({
                en: `Sort by ${typeof headerContent === "string" ? headerContent : "column"}`,
                fr: `Trier par ${typeof headerContent === "string" ? headerContent : "colonne"}`,
              })
            : undefined
        }
      >
        <div
          className={cn(
            "flex items-center gap-1",
            column.align === "center" && "justify-center",
            column.align === "right" && "justify-end",
          )}
        >
          <span>{headerContent}</span>
          {sortIcon && <span className="flex-shrink-0">{sortIcon}</span>}
        </div>
      </th>
    );
  };

  // Render rows
  const renderRows = () => {
    if (isLoading) {
      // Render loading skeleton rows
      return Array.from({ length: loadingRows }).map((_, rowIndex) => (
        <tr key={`loading-row-${rowIndex}`} className="animate-pulse">
          {selectable && (
            <td className="px-3 py-4 whitespace-nowrap">
              <div className="flex justify-center">
                <div className="h-4 w-4 rounded bg-gray-200" />
              </div>
            </td>
          )}

          {showRowNumbers && (
            <td className="px-3 py-4 whitespace-nowrap text-gray-500 text-sm">
              <div className="h-4 w-8 bg-gray-200 rounded" />
            </td>
          )}

          {columns
            .filter((col) => !col.hidden)
            .filter((col) => !(selectable && col.id === "selection"))
            .filter((col) => !(showRowNumbers && col.id === "rowNumber"))
            .map((column, colIndex) => (
              <td
                key={`loading-cell-${rowIndex}-${colIndex}`}
                className={cn(
                  "px-3 py-4 whitespace-nowrap",
                  compact ? "py-2" : "py-4",
                  stickyFirstColumn &&
                    colIndex === 0 &&
                    "sticky left-0 bg-white",
                )}
              >
                <LoaderSkeleton height={16} width="80%" rounded="sm" />
              </td>
            ))}

          {rowActions && (
            <td className="px-3 py-4 whitespace-nowrap text-right text-sm">
              <div className="h-8 w-8 bg-gray-200 rounded-full mx-auto" />
            </td>
          )}
        </tr>
      ));
    }

    if (sortedData.length === 0) {
      return (
        <tr>
          <td
            colSpan={
              columns.filter((c) => !c.hidden).length +
              (selectable ? 1 : 0) +
              (showRowNumbers ? 1 : 0) +
              (rowActions ? 1 : 0)
            }
            className="px-3 py-8 text-center text-gray-500"
          >
            {emptyState || textNoResults}
          </td>
        </tr>
      );
    }

    return sortedData.map((row, rowIndex) => {
      const rowKey = String(row[keyField]);
      const isSelected = selectedRows[rowKey];

      const getRowClassName = () => {
        if (typeof rowClassName === "function") {
          return rowClassName(row);
        }
        return rowClassName;
      };

      return (
        <tr
          key={rowKey}
          className={cn(
            zebra && rowIndex % 2 === 1 ? "bg-gray-50" : "bg-white",
            (onRowClick || isSelected) && "hover:bg-gray-100 cursor-pointer",
            isSelected && "bg-blue-50 hover:bg-blue-100",
            getRowClassName(),
          )}
          onClick={() => onRowClick && onRowClick(row)}
          tabIndex={onRowClick ? 0 : undefined}
          onKeyDown={(e) => {
            if (onRowClick && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onRowClick(row);
            }
          }}
          role={onRowClick ? "button" : undefined}
          aria-selected={isSelected}
        >
          {selectable && (
            <td
              className={cn(
                "px-3 whitespace-nowrap",
                compact ? "py-2" : "py-4",
                stickyFirstColumn && "sticky left-0 bg-inherit z-10",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center">
                <input
                  type={selectionType}
                  checked={!!isSelected}
                  onChange={(e) => handleSelectRow(e, rowKey)}
                  className={
                    selectionType === "checkbox"
                      ? "h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      : "h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                  }
                  aria-label={t({
                    en: `Select row ${rowIndex + 1}`,
                    fr: `Sélectionner la ligne ${rowIndex + 1}`,
                  })}
                />
              </div>
            </td>
          )}

          {showRowNumbers && (
            <td
              className={cn(
                "px-3 whitespace-nowrap text-gray-500 text-sm",
                compact ? "py-2" : "py-4",
                !selectable &&
                  stickyFirstColumn &&
                  "sticky left-0 bg-inherit z-10",
              )}
            >
              {rowIndex + 1}
            </td>
          )}

          {columns
            .filter((col) => !col.hidden)
            .filter((col) => !(selectable && col.id === "selection"))
            .filter((col) => !(showRowNumbers && col.id === "rowNumber"))
            .map((column, colIndex) => {
              // Get cell value
              let cellContent: React.ReactNode = "";

              if (column.cell) {
                cellContent = column.cell(row);
              } else if (column.accessorFn) {
                cellContent = column.accessorFn(row);
              } else if (column.accessorKey) {
                cellContent = row[column.accessorKey];
              }

              // Cell class names
              const cellClassName = cn(
                "px-3 whitespace-nowrap",
                compact ? "py-2" : "py-4",
                column.align === "center" && "text-center",
                column.align === "right" && "text-right",
                !selectable &&
                  !showRowNumbers &&
                  colIndex === 0 &&
                  stickyFirstColumn &&
                  "sticky left-0 bg-inherit z-10",
                column.className,
              );

              // Cell styles
              const cellStyles = {
                minWidth: column.minWidth,
                maxWidth: column.maxWidth,
                width: column.width,
              };

              return (
                <td
                  key={`${rowKey}-${column.id}`}
                  className={cellClassName}
                  style={cellStyles}
                >
                  {cellContent}
                </td>
              );
            })}

          {rowActions && (
            <td
              className={cn(
                "px-3 whitespace-nowrap text-right text-sm",
                compact ? "py-2" : "py-4",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {rowActions(row)}
            </td>
          )}
        </tr>
      );
    });
  };

  // Render pagination controls
  const renderPagination = () => {
    if (!pagination) return null;

    const { pageSize, currentPage, totalItems, onPageChange } = pagination;
    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalPages <= 1) return null;

    // Create page numbers array
    const pageNumbers: (number | string)[] = [];
    const maxPageButtons = 5;

    if (totalPages <= maxPageButtons) {
      // Show all pages if there are not too many
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show a range of pages with ellipsis
      if (currentPage <= 3) {
        // Current page is near the start
        for (let i = 1; i <= Math.min(4, totalPages); i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Current page is near the end
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = Math.max(totalPages - 3, 1); i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Current page is in the middle
        pageNumbers.push(1);
        pageNumbers.push("...");
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return (
      <div className="flex justify-between items-center py-3 border-t border-gray-200">
        <div className="flex-1 flex justify-between sm:hidden">
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            {t({ en: "Previous", fr: "Précédent" })}
          </Button>
          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            {t({ en: "Next", fr: "Suivant" })}
          </Button>
        </div>

        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              {t({
                en: `Showing <strong>${Math.min((currentPage - 1) * pageSize + 1, totalItems)}</strong> to <strong>${Math.min(currentPage * pageSize, totalItems)}</strong> of <strong>${totalItems}</strong> results`,
                fr: `Affichage de <strong>${Math.min((currentPage - 1) * pageSize + 1, totalItems)}</strong> à <strong>${Math.min(currentPage * pageSize, totalItems)}</strong> sur <strong>${totalItems}</strong> résultats`,
              }).replace(/<strong>(.*?)<\/strong>/g, "$1")}
            </p>
          </div>

          <div>
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <Button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="ghost"
                size="sm"
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                aria-label={t({ en: "Previous page", fr: "Page précédente" })}
              >
                <Icon name="chevron-left" size="sm" aria-hidden="true" />
              </Button>

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

                const pageNumber = page as number;
                return (
                  <Button
                    key={pageNumber}
                    onClick={() => onPageChange(pageNumber)}
                    variant={currentPage === pageNumber ? "primary" : "ghost"}
                    size="sm"
                    className={cn(
                      "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                      currentPage === pageNumber
                        ? "z-10 bg-primary-50 border-primary-500 text-primary-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50",
                    )}
                    aria-current={
                      currentPage === pageNumber ? "page" : undefined
                    }
                  >
                    {pageNumber}
                  </Button>
                );
              })}

              <Button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="ghost"
                size="sm"
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                aria-label={t({ en: "Next page", fr: "Page suivante" })}
              >
                <Icon name="chevron-right" size="sm" aria-hidden="true" />
              </Button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  const wrapperClassNames = cn(
    "overflow-hidden border border-gray-200 rounded-lg shadow-sm",
    className,
  );

  const scrollContainerClassNames = cn(
    "overflow-auto",
    horizontalScroll ? "overflow-x-auto" : "overflow-x-hidden",
    verticalScroll ? "overflow-y-auto" : "overflow-y-hidden",
    hasOverflow && horizontalScroll && "has-overflow",
  );

  const scrollContainerStyles = {
    maxHeight: verticalScroll ? verticalScrollHeight || "400px" : undefined,
  };

  // Handle batch actions display
  const batchActionsVisible =
    selectable && selectedItems && selectedItems.length > 0 && batchActions;

  return (
    <div className={wrapperClassNames}>
      {caption && (
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {typeof caption === "object" && "en" in caption
              ? t(caption)
              : caption}
          </h2>
        </div>
      )}

      {batchActionsVisible && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {t({
              en: `${selectedItems.length} selected`,
              fr: `${selectedItems.length} sélectionné${selectedItems.length > 1 ? "s" : ""}`,
            })}
          </div>
          <div className="flex space-x-2">{batchActions}</div>
        </div>
      )}

      <div
        className={scrollContainerClassNames}
        style={scrollContainerStyles}
        ref={scrollContainerRef}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
            <Loader label={textLoading} size="lg" overlay={false} />
          </div>
        )}

        <table
          className={cn("min-w-full divide-y divide-gray-200", tableClassName)}
          ref={tableRef}
          aria-label={tableLabel}
          aria-busy={isLoading}
        >
          <thead className={cn("bg-gray-50", headerClassName)}>
            <tr>
              {selectable &&
                renderColumnHeader(
                  { id: "selection", header: "", width: 40 },
                  0,
                )}
              {showRowNumbers &&
                renderColumnHeader(
                  { id: "rowNumber", header: "#", width: 60 },
                  selectable ? 1 : 0,
                )}
              {columns
                .filter((col) => !col.hidden)
                .map((column, index) =>
                  renderColumnHeader(
                    column,
                    index + (selectable ? 1 : 0) + (showRowNumbers ? 1 : 0),
                  ),
                )}
              {rowActions && (
                <th scope="col" className="relative px-3 py-3 w-10"></th>
              )}
            </tr>
          </thead>
          <tbody
            className={cn("bg-white divide-y divide-gray-200", bodyClassName)}
          >
            {renderRows()}
          </tbody>
        </table>
      </div>

      {renderPagination()}
    </div>
  );
};

export default DataTable;
