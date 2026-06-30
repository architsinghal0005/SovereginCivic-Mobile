// Configuration and Environment Variables

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error(
    "Configuration Error: EXPO_PUBLIC_BACKEND_URL is missing. " +
    "Please create a .env file based on .env.example and provide the BACKEND_URL."
  );
}

export const CONFIG = {
  BACKEND_URL,
};
