import { io, Socket } from "socket.io-client";
import type { ChatHistoryResponse } from "../ChatService";

interface ServerToClientEvents {
    "new-message": (message: ChatHistoryResponse) => void;
}

interface ClientToServerEvents {
    "join-thread": (threadId: string) => void;
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
    "https://crmb.smartglobalhub.com",
    {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        autoConnect: false,
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
    }
);

export default socket;