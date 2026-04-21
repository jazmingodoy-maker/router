import { useState, useCallback, useRef } from 'react';

export function useStreamingChat({ systemPrompt, model, maxTokens = 1500 }) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  const sendMessage = useCallback(
    async (userText, extraContext = null) => {
      // Build message list, optionally injecting context as a system-level note
      const userContent = extraContext
        ? `[Context from previous stage]\n${extraContext}\n\n---\n\n${userText}`
        : userText;

      const userMessage = { role: 'user', content: userContent };
      const history = [...messages, userMessage];

      setMessages([...history, { role: 'assistant', content: '', streaming: true }]);
      setIsStreaming(true);

      let accumulated = '';

      try {
        const controller = new AbortController();
        abortRef.current = controller;

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            messages: history,
            system: systemPrompt,
            model,
            max_tokens: maxTokens,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(err.error || `HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete line

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            try {
              const event = JSON.parse(raw);
              if (event.type === 'text') {
                accumulated += event.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: accumulated,
                    streaming: true,
                  };
                  return updated;
                });
              } else if (event.type === 'error') {
                throw new Error(event.error);
              }
            } catch (parseErr) {
              if (parseErr.message !== 'Unexpected end of JSON input') {
                console.warn('SSE parse error:', parseErr.message);
              }
            }
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return '';
        accumulated = `⚠️ Error: ${err.message}`;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: accumulated };
          return updated;
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        // Mark streaming done
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[updated.length - 1]?.streaming) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              streaming: false,
            };
          }
          return updated;
        });
      }

      return accumulated;
    },
    [messages, systemPrompt, model, maxTokens]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    abort();
    setMessages([]);
    setIsStreaming(false);
  }, [abort]);

  const injectAssistantMessage = useCallback((content) => {
    setMessages((prev) => [...prev, { role: 'assistant', content }]);
  }, []);

  return { messages, sendMessage, isStreaming, abort, reset, injectAssistantMessage, setMessages };
}
