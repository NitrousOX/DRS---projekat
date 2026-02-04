import { io } from "socket.io-client";

export const socket = io("/", {
  withCredentials: true, // šalje cookie
  transports: ["websocket"],
});
