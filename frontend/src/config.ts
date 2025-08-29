const port = typeof process !== "undefined"
  ? process.env.VITE_BACKEND_PORT
  : "53045";

export const BACKEND_PORT = port;
export const BACKEND_HTTP_URL = `http://localhost:${BACKEND_PORT}`;
export const BACKEND_WS_URL = `ws://localhost:${BACKEND_PORT}`;
