import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isYesterday } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm');
}

export function formatChatDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return 'Hari ini';
  if (isYesterday(d)) return 'Kemarin';
  return format(d, 'dd/MM/yyyy');
}

export function formatLastSeen(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return `hari ini pukul ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `kemarin pukul ${format(d, 'HH:mm')}`;
  return format(d, 'dd/MM/yyyy HH:mm');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getOtherUser(members: any[], currentUserId: string) {
  return members.find((m: any) => m.id !== currentUserId);
}

export function getChatDisplayName(chat: any, currentUserId: string): string {
  if (chat.isGroup) return chat.name || 'Grup';
  const other = getOtherUser(chat.members, currentUserId);
  return other?.name || 'Unknown';
}

export function getChatAvatar(chat: any, currentUserId: string): string | null {
  if (chat.isGroup) return chat.avatar;
  const other = getOtherUser(chat.members, currentUserId);
  return other?.avatar;
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '...';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getMediaType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}
