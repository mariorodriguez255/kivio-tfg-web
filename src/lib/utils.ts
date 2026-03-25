import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return 'KV'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  const days = Math.floor((today.getTime() - d.getTime()) / 86400000)
  if (days < 7) return `Hace ${days}d`
  if (days < 30) return `Hace ${Math.floor(days / 7)}sem`
  return `Hace ${Math.floor(days / 30)}m`
}
