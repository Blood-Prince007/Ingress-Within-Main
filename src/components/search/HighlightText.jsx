import React from 'react';

/**
 * Highlights matches of query tokens within text safely.
 * Handles regex escaping, case-insensitivity, and multiple tokens.
 */
export default function HighlightText({
  text = '',
  query = '',
  className = '',
  highlightClassName = 'bg-accent/15 text-accent font-semibold px-0.5 rounded'
}) {
  if (text === null || text === undefined) return null;
  const str = String(text);
  const trimmed = typeof query === 'string' ? query.trim() : '';

  if (!trimmed || !str) {
    return <span className={className}>{str}</span>;
  }

  // Split query into distinct non-empty tokens and escape regex characters
  const tokens = trimmed
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (tokens.length === 0) {
    return <span className={className}>{str}</span>;
  }

  try {
    const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
    const parts = str.split(regex);

    return (
      <span className={className}>
        {parts.map((part, i) => {
          const isMatch = tokens.some((token) => new RegExp(`^${token}$`, 'i').test(part));
          return isMatch ? (
            <mark key={i} className={highlightClassName}>
              {part}
            </mark>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          );
        })}
      </span>
    );
  } catch (e) {
    return <span className={className}>{str}</span>;
  }
}
