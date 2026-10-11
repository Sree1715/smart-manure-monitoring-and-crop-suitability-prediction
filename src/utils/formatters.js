export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined) return '—'
  return Number(value).toFixed(decimals)
}
