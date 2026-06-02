import React, { useRef, useEffect, useState } from 'react';

export default function ResponseViewer({ response, isRunning, usage, error, onClear }) {
  const contentRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [response]);

  const handleCopy = async () => {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = response;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isEmpty = !response && !error && !isRunning;

  return (
    <div className="panel response-panel">
      <div className="panel-header">
        <span className="panel-title">Response</span>
        <div className="response-actions">
          <button
            className={`btn btn-ghost${copied ? ' copy-success' : ''}`}
            onClick={handleCopy}
            disabled={!response}
            title="Copy to clipboard"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={onClear}
            disabled={!response && !error}
            title="Clear response"
          >
            <TrashIcon />
            Clear
          </button>
        </div>
      </div>

      <div className="panel-body" style={{ padding: 0, overflow: 'hidden' }}>
        <div ref={contentRef} className="response-content" style={{ padding: '20px', flex: 1 }}>
          {isEmpty && (
            <div className="response-placeholder">
              <div className="response-placeholder-icon">✨</div>
              <p>Your response will appear here.<br />Configure your prompt and hit <strong>Run Prompt</strong>.</p>
            </div>
          )}
          {isRunning && !response && (
            <div className="response-placeholder">
              <div className="response-placeholder-icon" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>⏳</div>
              <p>Generating response…</p>
              <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            </div>
          )}
          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}
          {response && (
            <span>
              {response}
              {isRunning && <span className="streaming-cursor" />}
            </span>
          )}
        </div>
      </div>

      {usage && (
        <div className="usage-bar">
          <div className="usage-item">
            <span className="usage-label">Input</span>
            <span className="usage-value">{usage.inputTokens.toLocaleString()} tokens</span>
          </div>
          <div className="usage-divider" />
          <div className="usage-item">
            <span className="usage-label">Output</span>
            <span className="usage-value">{usage.outputTokens.toLocaleString()} tokens</span>
          </div>
          <div className="usage-divider" />
          <div className="usage-item">
            <span className="usage-label">Total</span>
            <span className="usage-value">{(usage.inputTokens + usage.outputTokens).toLocaleString()} tokens</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
