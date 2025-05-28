// ChatFab.tsx
import React, { useState } from "react";
import ChatBot from "./ChatBot";

const ChatFab: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div className="fixed bottom-4 right-4 z-50">
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-4 right-4 px-4 py-2 bg-transparent"
                    >
                        <img src='/chat.png' alt="Chat" className="w-12 h-12" />
                    </button>
                )}
            </div>
            {isOpen && <ChatBot onClose={() => setIsOpen(false)} />}
        </>
    );
};

export default ChatFab;
