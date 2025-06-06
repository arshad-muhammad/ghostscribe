// API URL configuration
export const API_URL = (() => {
  // Check if we're in production (Vercel)
  if (import.meta.env.PROD) {
    // Use VERCEL_URL if available, otherwise fallback to the configured API URL
    const vercelUrl = import.meta.env.VITE_VERCEL_URL || process.env.VERCEL_URL;
    if (vercelUrl) {
      return `https://${vercelUrl}`;
    }
    // Fallback to configured API URL
    return import.meta.env.VITE_API_URL || '';
  }
  // In development, use the configured API URL or fallback to localhost
  return import.meta.env.VITE_API_URL || window.location.origin;
})(); 