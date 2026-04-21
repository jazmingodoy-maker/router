import ReactMarkdown from 'react-markdown';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isStreaming = message.streaming;

  // Strip context injection prefix from user messages for display
  const displayContent = isUser
    ? message.content.replace(/^\[Context from previous stage\][\s\S]*?---\n\n/m, '').trim()
    : message.content;

  return (
    <div className={`bubble-wrap ${isUser ? 'bubble-wrap--user' : 'bubble-wrap--assistant'}`}>
      <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--assistant'}`}>
        {isUser ? (
          <p>{displayContent}</p>
        ) : (
          <div className="bubble__markdown">
            <ReactMarkdown>{displayContent}</ReactMarkdown>
            {isStreaming && <span className="bubble__cursor" aria-hidden="true" />}
          </div>
        )}
      </div>
    </div>
  );
}
