import { getStatusColor } from '../../utils/helpers';
import { mapStatusForUI } from '../../utils/statusHelpers';

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export default function StatusBadge({ status, size = 'md', className = '' }) {
  const applicationStatus = mapStatusForUI(status);
  const colorClass = applicationStatus.isKnown
    ? applicationStatus.className
    : getStatusColor(status);
  const label = applicationStatus.isKnown
    ? applicationStatus.label
    : (status || applicationStatus.label);

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full whitespace-nowrap ${colorClass} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {label}
    </span>
  );
}
