//src/components/ChatBot.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import ChatService, { type ChatMessage } from "../services/ChatService";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

interface ChatBotProps {
    onClose: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ onClose }) => {
    const WELCOME_MESSAGE = useMemo<ChatMessage>(() => ({
        id: "0",
        text: "Welcome! How can I assist you?",
        sender: "assistant",
    }), []);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState<string>("");
    const [isSending, setIsSending] = useState<boolean>(false);
    const [threadId, setThreadId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingGif = "https://bot.smartglobalhub.com/typing.gif";

    // On first load, check localStorage for threadId
    useEffect(() => {
        const storedThreadId = localStorage.getItem("threadId");
        if (storedThreadId) {
            setThreadId(storedThreadId);
            setShowForm(false);
            setLoading(true);
        }
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Load chat history
    useEffect(() => {
        const loadChatHistory = async () => {
            if (threadId) {
                try {
                    const history = await ChatService.getChatHistory(threadId);
                    setMessages([WELCOME_MESSAGE, ...history.reverse()]);
                } catch (error: unknown) {
                    if (axios.isAxiosError(error) && error.response) {
                        const statusCode = error.response.status;

                        if (statusCode === 404) {
                            console.warn(error.response.data.error);
                            localStorage.removeItem("threadId");
                            setThreadId(null);
                            setShowForm(true);
                        } else {
                            console.error("Failed to load chat history:", error);
                        }
                    } else {
                        console.error("An unexpected error occurred:", error);
                    }
                } finally {
                    setLoading(false);
                }
            }
        };

        if (threadId) loadChatHistory();
    }, [WELCOME_MESSAGE, threadId]);

    useEffect(() => {
        if (!threadId) return;

        const cleanup = ChatService.connectToThread(threadId, (msg) => {
            // 🚫 Ignore user messages from the socket (already handled locally)
            if (msg.sender !== 'assistant') return;

            setMessages((prev) => {
                const hasTyping = prev.find((m) => m.id === "typing");

                if (hasTyping) {
                    // Replace "typing" message with real response
                    return prev.map((m) =>
                        m.id === "typing"
                            ? {
                                id: msg.id,
                                text: msg.text,
                                sender: msg.sender,
                            }
                            : m
                    );
                } else {
                    // Append new assistant message
                    return [...prev, {
                        id: msg.id,
                        text: msg.text,
                        sender: msg.sender,
                    }];
                }
            });
        });

        return () => {
            cleanup();
        };
    }, [threadId]);

    // Handle form submission
    const handleFormSubmit = async () => {
        const newCustomerId = uuidv4();
        try {
            const threadId = await ChatService.createCustomerThread(newCustomerId, name, email, phone);
            localStorage.setItem("threadId", threadId);
            setThreadId(threadId);
            setShowForm(false);
            setMessages([WELCOME_MESSAGE]);
        } catch (error) {
            console.error("Failed to create customer:", error);
        }
    };

    // Handle message sending
    const handleSendMessage = async () => {
        if (inputText.trim() === "" || isSending || !threadId) return;

        const userMessage: ChatMessage = {
            id: String(messages.length + 1),
            text: inputText.trim(),
            sender: "user",
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText("");
        setIsSending(true);

        // Showing typing gif with a delay before sending the response
        setTimeout(async () => {
            const typingMessage: ChatMessage = {
                id: "typing",
                text: typingGif,
                sender: "assistant",
            };

            setMessages((prev) => [...prev, typingMessage]);

            try {
                await ChatService.sendChatMessage(threadId, userMessage.text);
                // const response = await ChatService.sendChatMessage(threadId, userMessage.text);

                // setMessages((prev) =>
                //     prev.map((msg) =>
                //         msg.id === "typing"
                //             ? {
                //                 id: String(prev.length + 1),
                //                 text: response.botResponse,
                //                 sender: "assistant",
                //             }
                //             : msg
                //     )
                // );
            } catch (error) {
                console.error("Failed to send message:", error);
            } finally {
                setIsSending(false);
            }
        }, 3000); // 3 second delay before showing typing gif and sending response
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div
            className="fixed bottom-0 right-0 bg-gray-800 rounded-lg shadow-lg z-1000 w-[calc(100%-1rem)] mx-2 sm:mx-0 sm:w-96 h-[calc(100vh-4rem)] sm:h-[400px] sm:bottom-4 sm:right-4 overflow-hidden font-sans"
            style={{ boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)" }}
        >
            <div className="flex flex-col h-full">
                <span
                    className="absolute text-3xl text-gray-100 cursor-pointer top-2 right-5 hover:text-gray-300"
                    onClick={onClose}
                >
                    &times;
                </span>

                {/* Chat header */}
                <div className="flex items-center p-4 bg-blue-900 rounded-t-lg">
                    <img
                        src={'https://bot.smartglobalhub.com/bot.jpg'}
                        alt="Profile"
                        className="w-10 h-10 mr-3 rounded-full"
                    />
                    <div className="text-white">
                        <h4 className="text-lg font-semibold">Ayisha</h4>
                        <span className="text-sm opacity-70">SR Customer Happiness Advisor</span>
                    </div>
                </div>

                {/* Render form, spinner, or chat */}
                {showForm ? (
                    <div className="flex flex-col items-center justify-center flex-1 gap-3 p-4 text-white bg-gray-900">
                        <p className="text-sm text-center">
                            To give you a better experience, please tell us a bit about yourself.
                        </p>
                        <input
                            type="text"
                            placeholder="Your Name"
                            className="w-full p-2 bg-gray-800 border border-blue-500 rounded"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <input
                            type="email"
                            placeholder="Your Email"
                            className="w-full p-2 bg-gray-800 border border-blue-500 rounded"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="tel"
                            placeholder="Your Phone"
                            className="w-full p-2 bg-gray-800 border border-blue-500 rounded"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <button
                            onClick={handleFormSubmit}
                            className="px-4 py-2 mt-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                            Start Chat
                        </button>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center flex-1 bg-gray-900">
                        <img src={typingGif} alt="Loading..." className="w-12 h-6" />
                    </div>
                ) : (
                    <>
                        {/* Chat body */}
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-950">
                            <div className="flex flex-col gap-3">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`p-3 rounded-lg max-w-[80%] sm:max-w-[70%] ${message.sender === "assistant"
                                            ? "bg-blue-100 self-start rounded-bl-none text-blue-800"
                                            : "bg-green-100 self-end rounded-br-none text-green-800"
                                            }`}
                                    >
                                        {message.text === typingGif ? (
                                            <img src={typingGif} alt="Typing..." className="w-12 h-6" />
                                        ) : (
                                            <p className="text-sm">{message.text}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat input area */}
                        <div className="flex gap-2 p-4 border-t border-red-900">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="text-white flex-1 p-2 bg-gray-900 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isSending}
                                className={`px-4 py-2 text-white rounded-lg ${isSending
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-500 hover:bg-blue-600"
                                    }`}
                            >
                                Send
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatBot;
