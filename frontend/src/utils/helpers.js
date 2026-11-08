export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export function getStatusColor(status) {
  const colors = {
    Draft: 'bg-gray-100 text-gray-700',
    Submitted: 'bg-blue-50 text-blue-700',
    'Under Review': 'bg-amber-50 text-amber-700',
    'Clarification Required': 'bg-orange-50 text-orange-700',
    Resubmitted: 'bg-indigo-50 text-indigo-700',
    Approved: 'bg-emerald-50 text-emerald-700',
    Rejected: 'bg-red-50 text-red-700',
    // Document statuses
    Uploaded: 'bg-blue-50 text-blue-700',
    'Pending Verification': 'bg-amber-50 text-amber-700',
    Verified: 'bg-emerald-50 text-emerald-700',
    'Replacement Required': 'bg-orange-50 text-orange-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getStatusDotColor(status) {
  const colors = {
    Draft: 'bg-gray-400',
    Submitted: 'bg-blue-500',
    'Under Review': 'bg-amber-500',
    'Clarification Required': 'bg-orange-500',
    Resubmitted: 'bg-indigo-500',
    Approved: 'bg-emerald-500',
    Rejected: 'bg-red-500',
    Uploaded: 'bg-blue-500',
    'Pending Verification': 'bg-amber-500',
    Verified: 'bg-emerald-500',
    'Replacement Required': 'bg-orange-500',
  };
  return colors[status] || 'bg-gray-400';
}

export function truncate(str, length = 50) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

export function generateAppId() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900 + 100);
  return `APP-${year}-${random}`;
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

