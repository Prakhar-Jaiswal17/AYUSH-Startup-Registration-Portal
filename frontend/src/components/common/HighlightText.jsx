import React from 'react';

/**
 * Highlights matches of query within text safely.
 */
export default function HighlightText({ text = '', query = '', className = '' }) {
  const content = typeof text === 'string' ? text : String(text ?? '');
  if (!query || !query.trim() || !content) {
    return <span className={className}>{content}</span>;
  }

  const cleanQuery = query.trim();
  const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const splitRegex = new RegExp(`(${escaped})`, 'gi');
  const matchRegex = new RegExp(escaped, 'i');
  const parts = content.split(splitRegex);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        matchRegex.test(part) ? (
          <mark key={index} className="bg-amber-200 text-amber-900 rounded-sm px-0.5 font-medium">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}
