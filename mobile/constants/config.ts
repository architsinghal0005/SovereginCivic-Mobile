const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error(
    "Configuration Error: EXPO_PUBLIC_BACKEND_URL is missing."
  );
}

export const CONFIG = {
  BACKEND_URL,
};

export const getFullUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('https') || url.startsWith('file://') || url.startsWith('data:')) {
    return url;
  }
  const baseUrl = CONFIG.BACKEND_URL.endsWith('/') ? CONFIG.BACKEND_URL.slice(0, -1) : CONFIG.BACKEND_URL;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${path}`;
};