import { io } from "socket.io-client";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  "https://creators-connect-backend-1.onrender.com/api";
const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  apiBaseUrl.replace(/\/api\/?$/, "");

const socket = io(socketUrl, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"]
});

export default socket;
