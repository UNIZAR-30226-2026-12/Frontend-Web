import React, { useEffect, useRef, useState } from 'react';
import '../styles/components/InGameChat.css';

export interface ChatMessage {
    sender: string;
    message: string;
}

interface InGameChatProps {
    messages: ChatMessage[];
    myUsername: string;
    onSend: (message: string) => void;
    mode?: 'modal' | 'panel';
    isOpen?: boolean;
    onClose?: () => void;
    title?: string;
}

const InGameChat: React.FC<InGameChatProps> = ({
    messages,
    myUsername,
    onSend,
    mode = 'modal',
    isOpen = false,
    onClose,
    title = 'Chat de partida',
}) => {
    const [text, setText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousFocusedElementRef = useRef<HTMLElement | null>(null);
    const isModal = mode === 'modal';
    const shouldRender = isModal ? isOpen : true;
    const titleId = `${isModal ? 'ingame-chat-modal' : 'ingame-chat-panel'}-title`;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (shouldRender) {
            scrollToBottom();
        }
    }, [messages, shouldRender]);

    useEffect(() => {
        if (!isModal || !isOpen) {
            return;
        }

        previousFocusedElementRef.current = document.activeElement as HTMLElement | null;
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        window.requestAnimationFrame(() => {
            if (focusableElements && focusableElements.length > 0) {
                focusableElements[0].focus();
            } else {
                closeButtonRef.current?.focus();
            }
        });

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!modalRef.current) {
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                onClose?.();
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            const focusable = Array.from(
                modalRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                )
            );

            if (focusable.length === 0) {
                event.preventDefault();
                modalRef.current.focus();
                return;
            }

            const firstElement = focusable[0];
            const lastElement = focusable[focusable.length - 1];
            const activeElement = document.activeElement as HTMLElement | null;

            if (event.shiftKey) {
                if (activeElement === firstElement || !modalRef.current.contains(activeElement)) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else if (activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            previousFocusedElementRef.current?.focus?.();
        };
    }, [isModal, isOpen, onClose]);

    if (!shouldRender) {
        return null;
    }

    const handleSend = () => {
        const clean = text.trim();
        if (clean !== '') {
            onSend(clean);
            setText('');
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleSend();
        }
    };

    const isSendDisabled = text.trim() === '';

    const chatContent = (
        <>
            <div className="ingame-chat-header">
                <h3 id={titleId}>{title}</h3>
                {isModal && (
                    <button type="button" className="ingame-chat-close" onClick={onClose} ref={closeButtonRef}>
                        Cerrar
                    </button>
                )}
            </div>

            <div className="ingame-chat-messages" role="log" aria-live="polite" aria-relevant="additions text">
                {messages.length === 0 ? (
                    <div className="ingame-chat-empty">No hay mensajes todavia.</div>
                ) : (
                    messages.map((msg, index) => {
                        const isMine = msg.sender === myUsername;
                        return (
                            <div
                                key={index}
                                className={`ingame-chat-bubble-container ${isMine ? 'ingame-chat-bubble-container--mine' : 'ingame-chat-bubble-container--others'}`}
                            >
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
                <label htmlFor={`${mode}-ingame-chat-input`} className="sr-only">
                    Escribe un mensaje
                </label>
                <input
                    id={`${mode}-ingame-chat-input`}
                    type="text"
                    className="ingame-chat-input"
                    placeholder="Escribe un mensaje..."
                    value={text}
                    onChange={event => setText(event.target.value)}
                    onKeyDown={handleKeyPress}
                    autoFocus={isModal}
                />
                <button
                    type="button"
                    className={`ingame-chat-send ${isModal ? '' : 'ingame-chat-send--icon'}`.trim()}
                    onClick={handleSend}
                    disabled={isSendDisabled}
                    aria-label="Enviar mensaje"
                >
                    {isModal ? (
                        'Enviar'
                    ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M3 20.5L21 12L3 3.5V10.2L15.8 12L3 13.8V20.5Z" fill="currentColor" />
                        </svg>
                    )}
                </button>
            </div>
        </>
    );

    if (isModal) {
        return (
            <div className="ingame-chat-overlay" onClick={onClose}>
                <div
                    className="ingame-chat-modal"
                    onClick={event => event.stopPropagation()}
                    ref={modalRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    tabIndex={-1}
                >
                    {chatContent}
                </div>
            </div>
        );
    }

    return (
        <section className="ingame-chat-panel" aria-labelledby={titleId}>
            {chatContent}
        </section>
    );
};

export default InGameChat;
