export function formatBytes(bytes: number | string | null | undefined): string {
  const numericBytes = typeof bytes === 'number' ? bytes : Number(bytes);
  if (!Number.isFinite(numericBytes) || numericBytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(numericBytes) / Math.log(k));
  const unit = sizes[Math.min(i, sizes.length - 1)] || 'B';
  return parseFloat((numericBytes / Math.pow(k, i)).toFixed(2)) + ' ' + unit;
}

export function formatDate(timestamp: number | string | null | undefined): string {
  const numericTimestamp = typeof timestamp === 'number' ? timestamp : Number(timestamp);
  if (!Number.isFinite(numericTimestamp) || numericTimestamp <= 0) return '—';
  return new Date(numericTimestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(timestamp: number | string | null | undefined): string {
  const numericTimestamp = typeof timestamp === 'number' ? timestamp : Number(timestamp);
  if (!Number.isFinite(numericTimestamp) || numericTimestamp <= 0) return '—';
  return new Date(numericTimestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}