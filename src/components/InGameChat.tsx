import React, { useState, useEffect, useRef } from 'react';
import '../styles/components/InGameChat.css';

export interface ChatMessage {
    sender: string;
    message: string;
}

interface InGameChatProps {
    messages: ChatMessage[];
    myUsername: string;
    isOpen: boolean;
    onClose: () => void;
    onSend: (message: string) => void;
}

const InGameChat: React.FC<InGameChatProps> = ({ messages, myUsername, isOpen, onClose, onSend }) => {
    const [text, setText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    if (!isOpen) return null;

    const handleSend = () => {
        const clean = text.trim();
        if (clean !== '') {
            onSend(clean);
            setText('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="ingame-chat-overlay" onClick={onClose}>
            <div className="ingame-chat-modal" onClick={e => e.stopPropagation()}>
                <div className="ingame-chat-header">
                    <h3>Chat de partida</h3>
                    <button className="ingame-chat-close" onClick={onClose}>Cerrar</button>
                </div>

                <div className="ingame-chat-messages">
                    {messages.length === 0 ? (
                        <div className="ingame-chat-empty">No hay mensajes todavía.</div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMine = msg.sender === myUsername;
                            return (
                                <div key={index} className={`ingame-chat-bubble-container ${isMine ? 'ingame-chat-bubble-container--mine' : 'ingame-chat-bubble-container--others'}`}>
                                    {!isMine && <span className="ingame-chat-sender">{msg.sender}</span>}
                                    <div className={`ingame-chat-bubble ${isMine ? 'ingame-chat-bubble--mine' : 'ingame-chat-bubble--others'}`}>
                                        {msg.message}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="ingame-chat-input-area">
                    <input
                        type="text"
                        className="ingame-chat-input"
                        placeholder="Escribe un mensaje..."
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        autoFocus
                    />
                    <button 
                        className="ingame-chat-send" 
                        onClick={handleSend}
                        disabled={text.trim() === ''}
                    >
                        Enviar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InGameChat;
