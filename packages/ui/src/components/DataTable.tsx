import { useState } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface Column<T> {
  key: keyof T
  header: string
  render?: (value: any, row: T) => React.ReactNode
  hideOnMobile?: boolean
  priority?: number
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  responsive?: boolean
  pageSize?: number
}

export function DataTable<T>({ 
  data, 
  columns, 
  onRowClick, 
  responsive = true,
  pageSize = 10 
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const totalPages = Math.ceil(data.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = data.slice(startIndex, startIndex + pageSize)

  const toggleRow = (index: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const visibleColumns = responsive
    ? columns.filter(col => !col.hideOnMobile)
    : columns

  const hiddenColumns = responsive
    ? columns.filter(col => col.hideOnMobile)
    : []

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No data available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Desktop/Tablet Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={cn(
                    'px-4 py-3 text-left text-sm font-semibold text-gray-300',
                    responsive && column.hideOnMobile && 'hidden lg:table-cell'
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={startIndex + rowIndex}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-gray-800 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-gray-800/50'
                )}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      'px-4 py-3 text-sm text-gray-300',
                      responsive && column.hideOnMobile && 'hidden lg:table-cell'
                    )}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedData.map((row, rowIndex) => (
          <div
            key={startIndex + rowIndex}
            onClick={() => onRowClick?.(row)}
            className={cn(
              'bg-gray-800 rounded-lg border border-gray-700 p-4',
              onRowClick && 'cursor-pointer hover:bg-gray-700/50'
            )}
          >
            {visibleColumns.slice(0, 3).map((column, colIndex) => (
              <div key={colIndex} className="mb-2 last:mb-0">
                <div className="text-xs text-gray-400 mb-1">{column.header}</div>
                <div className="text-sm text-gray-200">
                  {column.render
                    ? column.render(row[column.key], row)
                    : String(row[column.key] ?? '')}
                </div>
              </div>
            ))}
            
            {hiddenColumns.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleRow(rowIndex)
                }}
                className="mt-3 text-sm text-primary-400 hover:text-primary-300"
              >
                {expandedRows.has(rowIndex) ? 'Show less' : `Show ${hiddenColumns.length} more`}
              </button>
            )}

            {expandedRows.has(rowIndex) && (
              <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                {hiddenColumns.map((column, colIndex) => (
                  <div key={colIndex}>
                    <div className="text-xs text-gray-400 mb-1">{column.header}</div>
                    <div className="text-sm text-gray-200">
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] ?? '')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, data.length)} of {data.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm rounded bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm rounded bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
