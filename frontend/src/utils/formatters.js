import { format, formatDistanceToNow } from 'date-fns'

export const formatDate = (date, fmt = 'dd MMM yyyy') =>
  date ? format(new Date(date), fmt) : '—'

export const formatDateTime = (date) =>
  date ? format(new Date(date), 'dd MMM yyyy, HH:mm') : '—'

export const timeAgo = (date) =>
  date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '—'

export const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount ?? 0)

export const formatNumber = (n) =>
  new Intl.NumberFormat('en-US').format(n ?? 0)

export const formatPercent = (n, decimals = 1) =>
  `${(n ?? 0).toFixed(decimals)}%`

export const truncate = (str, max = 40) =>
  str && str.length > max ? `${str.slice(0, max)}…` : str
