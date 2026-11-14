/**
 * Utility functions for exporting curated AYUSH resources.
 */

export function exportResourcesToJSON(resources, filename = 'ayush-resources.json') {
  const cleanData = resources.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    summary: r.summary || r.description,
    url: r.url || 'N/A',
    type: r.type || 'official',
    isAvailable: r.isAvailable !== false,
  }));

  const blob = new Blob([JSON.stringify(cleanData, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerDownload(blob, filename);
}

export function exportResourcesToCSV(resources, filename = 'ayush-resources.csv') {
  const headers = ['ID', 'Title', 'Category', 'Summary', 'URL', 'Type', 'Available'];
  const rows = resources.map((r) => [
    escapeCSV(r.id),
    escapeCSV(r.title),
    escapeCSV(r.category),
    escapeCSV(r.summary || r.description || ''),
    escapeCSV(r.url || 'N/A'),
    escapeCSV(r.type || 'official'),
    r.isAvailable !== false ? 'Yes' : 'No',
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

function escapeCSV(str) {
  if (str === null || str === undefined) return '""';
  const text = String(str).replace(/"/g, '""');
  return `"${text}"`;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
