// WhatsApp brand colors
export const COLORS = {
  primary: '#075E54',
  secondary: '#128C7E',
  accent: '#25D366',
  light: '#DCF8C6',
  dark: '#111B21',
  blue: '#53BDEB',
  grey: '#8696A0',
} as const;

// Dynamic URL: use the browser's current hostname so LAN/phone access works
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3001`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

export const API_URL = getBaseUrl();
export const WS_URL = getBaseUrl();

export const EMOJI_REACTIONS = ['❤️', '😂', '😮', '😢', '🙏', '👍'];

export const STATUS_COLORS = [
  '#075E54', '#128C7E', '#25D366', '#FF6B6B',
  '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE',
  '#E74C3C', '#3498DB', '#2ECC71', '#E67E22'
];
