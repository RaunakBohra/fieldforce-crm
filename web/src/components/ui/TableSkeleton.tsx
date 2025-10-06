interface TableSkeletonProps {
  /** Number of skeleton rows to show */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Optional table headers */
  headers?: string[];
}

/**
 * Skeleton loader for tables
 *
 * @example
 * <TableSkeleton rows={5} columns={6} />
 *
 * @example
 * <TableSkeleton
 *   rows={3}
 *   headers={['Name', 'Email', 'Phone', 'Status', 'Actions']}
 * />
 */
export function TableSkeleton({ rows = 5, columns = 5, headers }: TableSkeletonProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-neutral-200">
        {headers && (
          <thead className="bg-neutral-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="bg-white divide-y divide-neutral-200">
          {[...Array(rows)].map((_, rowIndex) => (
            <tr key={rowIndex} className="animate-pulse">
              {[...Array(columns)].map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div
                    className={`h-4 bg-neutral-200 rounded ${
                      colIndex === 0 ? 'w-32' : colIndex === columns - 1 ? 'w-8' : 'w-24'
                    }`}
                  ></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
