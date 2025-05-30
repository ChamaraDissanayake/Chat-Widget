// src/services/ChatService.ts
import axios from "axios";
import socket from "./helpers/socket";

const CHAT_BASE_URL = "http://localhost:3000/api";
// const CHAT_BASE_URL = "https://crmb.smartglobalhub.com/api";

export interface ChatMessage {
    id: string;
    text: string;
    sender: "assistant" | "user";
}

export interface ChatHistoryResponse {
    id: string;
    threadId: string;
    role: "assistant" | "user";
    content: string;
    createdAt: string;
}

declare global {
    interface Window {
        SMART_WIDGET_CONFIG?: {
            companyId: string;
            containerId?: string;
        };
    }
}

function getCompanyId(): string {
    const id = window.SMART_WIDGET_CONFIG?.companyId;
    if (!id) {
        throw new Error("Company ID is not set in SMART_WIDGET_CONFIG.");
    }
    return id;
}

const ChatService = {
    createCustomerThread: async (
        customerId: string,
        name: string,
        email: string,
        phone: string
    ): Promise<string> => {
        const companyId = getCompanyId();
        const response = await axios.post(`${CHAT_BASE_URL}/customer/create`, {
            customerId,
            companyId,
            name,
            email,
            phone,
        });
        return response.data.threadId;
    },

    sendChatMessage: async (
        threadId: string,
        message: string
    ): Promise<{ botResponse: string }> => {
        const companyId = getCompanyId();
        const response = await axios.post(`${CHAT_BASE_URL}/chat/chat-web`, {
            threadId,
            companyId,
            message,
        });
        return response.data;
    },

    getChatHistory: async (
        threadId: string,
        limit = 20,
        offset = 0
    ): Promise<ChatMessage[]> => {
        const response = await axios.get(`${CHAT_BASE_URL}/chat/chat-history`, {
            params: { threadId, limit, offset },
        });

        return response.data.map((msg: ChatHistoryResponse, index: number) => ({
            id: msg.id || String(index + 1),
            text: msg.content,
            sender: msg.role,
        }));
    },

    connectToThread: (
        threadId: string,
        onMessage: (msg: ChatMessage) => void
    ) => {
        if (!socket.connected) {
            socket.connect();
        }
        console.log('Chamara socket joining thread', threadId);

        socket.emit("join-thread", threadId);

        const handleNewMessage = (msg: ChatHistoryResponse) => {
            console.log('Chamara msg', msg);

            const message: ChatMessage = {
                id: msg.id,
                text: msg.content,
                sender: msg.role,
            };
            onMessage(message);
        };

        socket.on("new-message", handleNewMessage);

        return () => {
            socket.off("new-message", handleNewMessage);
        };
    },
};

export default ChatService;
