const APPLICATION_STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'gray', className: 'bg-gray-100 text-gray-700' },
  SUBMITTED: { label: 'Submitted', color: 'blue', className: 'bg-blue-50 text-blue-700' },
  UNDER_REVIEW: { label: 'Under Review', color: 'yellow', className: 'bg-amber-50 text-amber-700' },
  QUERY_RAISED: { label: 'Clarification Required', color: 'orange', className: 'bg-orange-50 text-orange-700' },
  RESUBMITTED: { label: 'Resubmitted', color: 'purple', className: 'bg-indigo-50 text-indigo-700' },
  APPROVED: { label: 'Approved', color: 'green', className: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { label: 'Rejected', color: 'red', className: 'bg-red-50 text-red-700' },
};

const DISPLAY_LABEL_TO_STATUS = Object.fromEntries(
  Object.entries(APPLICATION_STATUS_CONFIG).map(([status, config]) => [config.label.toLowerCase(), status]),
);

export const STATUS_LABELS = Object.fromEntries(
  Object.entries(APPLICATION_STATUS_CONFIG).map(([status, config]) => [status, config.label]),
);

export const STATUS_COLORS = Object.fromEntries(
  Object.entries(APPLICATION_STATUS_CONFIG).map(([status, config]) => [status, config.color]),
);

export function getCanonicalStatus(status) {
  if (typeof status !== 'string') return null;

  const value = status.trim();
  if (!value) return null;

  const canonical = value.toUpperCase();
  if (Object.hasOwn(APPLICATION_STATUS_CONFIG, canonical)) return canonical;

  return DISPLAY_LABEL_TO_STATUS[value.toLowerCase()] || null;
}

export function mapStatusForUI(status) {
  const canonical = getCanonicalStatus(status);
  if (canonical) {
    return {
      canonical,
      label: STATUS_LABELS[canonical],
      color: STATUS_COLORS[canonical],
      className: APPLICATION_STATUS_CONFIG[canonical].className,
      isKnown: true,
    };
  }

  const unknownLabel = typeof status === 'string' && status.trim()
    ? status
    : 'Unknown status';

  return {
    canonical: null,
    label: unknownLabel,
    color: 'gray',
    className: 'bg-gray-100 text-gray-700',
    isKnown: false,
  };
}

export function getStatusLabel(status) {
  return mapStatusForUI(status).label;
}

export function getStatusColor(status) {
  return mapStatusForUI(status).color;
}
