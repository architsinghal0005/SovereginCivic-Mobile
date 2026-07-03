const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error(
    "Configuration Error: EXPO_PUBLIC_BACKEND_URL is missing."
  );
}

export const CONFIG = {
  BACKEND_URL,
};