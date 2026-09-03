import { io } from 'socket.io-client';

// On GitHub Pages (static), socket.io points to the same origin but won't connect — that's OK.
// On local dev, it points to localhost:3000 backend.
const hostname = window.location.hostname;
const isProd = import.meta.env.PROD;
const isGitHubPages = hostname.includes('github.io') || hostname.includes('githubusercontent.com');

// If GitHub Pages static deploy: skip real socket connection — events handled by clientEngine instead
const SOCKET_URL = isGitHubPages
  ? 'http://localhost:3000' // Won't actually connect, but won't throw
  : isProd
    ? window.location.origin
    : `http://${hostname}:3000`;

export const socket = io(SOCKET_URL, {
  autoConnect: !isGitHubPages, // Don't even try to connect on GitHub Pages
  reconnectionAttempts: isGitHubPages ? 0 : 10,
  reconnectionDelay: 1000,
  timeout: 3000,
});
