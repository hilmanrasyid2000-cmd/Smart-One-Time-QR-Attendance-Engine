import { io } from 'socket.io-client';

// Determine socket connection URL
// When accessed via network IP (e.g. 192.168.1.5:5173), socket connects to 192.168.1.5:3000
const isProd = import.meta.env.PROD;
const hostname = window.location.hostname;
const SOCKET_URL = isProd ? window.location.origin : `http://${hostname}:3000`;

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
