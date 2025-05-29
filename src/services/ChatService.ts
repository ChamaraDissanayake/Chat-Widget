import axios from "axios";

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

// We'll read companyId dynamically from the global script
declare global {
    interface Window {
        SMART_WIDGET_CONFIG?: {
            companyId: string;
            containerId?: string;
        };
    }
}

const companyId = window.SMART_WIDGET_CONFIG?.companyId ?? "";

const ChatService = {
    createCustomerThread: async (
        customerId: string,
        name: string,
        email: string,
        phone: string
    ): Promise<string> => {
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
        console.log('Chamara response');

        return response.data.map((msg: ChatHistoryResponse, index: number) => ({
            id: msg.id || String(index + 1),
            text: msg.content,
            sender: msg.role,
        }));
    },
};

export default ChatService;
