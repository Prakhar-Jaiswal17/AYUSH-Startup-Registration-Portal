import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  emptyMessage = 'No data available',
  onRowClick,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDirection]);

  const SortIcon = ({ columnKey }) => {
    if (sortKey !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-[#6B756F]/50" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-[#145A43]" />
    ) : (
      <ChevronDown className="w-4 h-4 text-[#145A43]" />
    );
  };

  if (!data.length) {
    return (
      <div className="card p-12 text-center">
        <p className="text-[#6B756F] text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F7F9F6]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-semibold text-[#202A25] whitespace-nowrap cursor-pointer select-none hover:bg-[#eef1ec] transition-colors"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    <SortIcon columnKey={col.key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {sortedData.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                className={`transition-colors ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-[#F7F9F6]'
                    : 'hover:bg-[#FAFBFA]'
                } ${rowIdx % 2 === 1 ? 'bg-[#FCFCFB]' : 'bg-white'}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-[#202A25] whitespace-nowrap"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden divide-y divide-[#E5E7EB]">
        {sortedData.map((row, rowIdx) => (
          <div
            key={row.id || rowIdx}
            className={`p-4 space-y-2 ${onRowClick ? 'cursor-pointer active:bg-[#F7F9F6]' : ''}`}
            onClick={() => onRowClick && onRowClick(row)}
          >
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between items-start gap-3">
                <span className="text-xs font-medium text-[#6B756F] flex-shrink-0">
                  {col.label}
                </span>
                <span className="text-sm text-[#202A25] text-right">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
