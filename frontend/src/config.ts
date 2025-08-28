// Pull the backend port from .env
export const BACKEND_PORT: string = import.meta.env.VITE_BACKEND_PORT || "53045";

// Build base URLs
export const BACKEND_HTTP_URL = `http://localhost:${BACKEND_PORT}`;
export const BACKEND_WS_URL = `ws://localhost:${BACKEND_PORT}`;
