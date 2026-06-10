import { io } from "socket.io-client";

export const initSocket = () => {
  console.log("BACKEND URL =", process.env.REACT_APP_BACKEND_URL);

  return io(process.env.REACT_APP_BACKEND_URL, {
    forceNew: true,
    reconnectionAttempts: Infinity,
    timeout: 10000,
    transports: ["websocket"],
  });
};