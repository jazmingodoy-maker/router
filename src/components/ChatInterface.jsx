import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble.jsx';

export default function ChatInterface({
  messages,
  onSend,
  isStreaming,
  placeholder = 'Type a message…',
  initialMessage = null,
  disabled = false,
  onAbort,
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const didSendInitial = useRef(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send initial message once if provided and no messages exist
  useEffect(() => {
    if (initialMessage && messages.length === 0 && !didSendInitial.current) {
      didSendInitial.current = true;
      onSend(initialMessage);
    }
  }, [initialMessage, messages.length, onSend]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming || disabled) return;
    setInput('');
    onSend(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat">
      <div className="chat__messages">
        {messages.length === 0 && (
          <div className="chat__empty">
            <p>Start the conversation below.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat__form" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className="chat__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'Waiting for response…' : placeholder}
          disabled={isStreaming || disabled}
          rows={1}
        />
        {isStreaming ? (
          <button
            type="button"
            className="chat__btn chat__btn--stop"
            onClick={onAbort}
            title="Stop generation"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="3" width="10" height="10" rx="1" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            className="chat__btn chat__btn--send"
            disabled={!input.trim() || disabled}
            title="Send (Enter)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2L2 6.5l5 1.5 1.5 5L14 2z" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </form>
    </div>
  );
}
