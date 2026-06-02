import React, { useState } from 'react';

const SECTION_LABELS = [
  'PURPOSE',
  'MOOD',
  'AUDIENCE / BRAND FEEL',
  'SUBJECT / SCENE',
  'COMPOSITION / LAYOUT',
  'COPY / TEXT',
  'TYPOGRAPHY',
  'COLOUR',
  'AVOID',
];

function highlightSections(text) {
  if (!text) return null;
  const parts = [];
  let remaining = text;
  let lastIndex = 0;

  const allMatches = [];
  for (const label of SECTION_LABELS) {
    let idx = remaining.indexOf(label);
    while (idx !== -1) {
      allMatches.push({ idx, label, len: label.length });
      idx = remaining.indexOf(label, idx + 1);
    }
  }
  allMatches.sort((a, b) => a.idx - b.idx);

  const usedStarts = new Set();
  let result = [];
  let cursor = 0;

  for (const match of allMatches) {
    if (match.idx < cursor) continue;
    if (match.idx > cursor) {
      result.push(<span key={`txt-${cursor}`}>{remaining.slice(cursor, match.idx)}</span>);
    }
    result.push(
      <span key={`lbl-${match.idx}`} className="prompt-section-label">
        {match.label}
      </span>
    );
    cursor = match.idx + match.len;
  }
  if (cursor < remaining.length) {
    result.push(<span key={`txt-end`}>{remaining.slice(cursor)}</span>);
  }

  return result;
}

export default function StructuredOutput({ output, isRunning, usage, error, onClear }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="panel response-panel">
      <div className="panel-header">
        <span className="panel-title">Restructured Prompt</span>
        <div className="response-actions">
          <button
            className={`btn btn-ghost ${copied ? 'copy-success' : ''}`}
            onClick={handleCopy}
            disabled={!output}
          >
            {copied ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy all</>}
          </button>
          <button className="btn btn-ghost" onClick={onClear} disabled={!output && !error}>
            <ClearIcon /> Clear
          </button>
        </div>
      </div>

      <div className="response-body">
        {error && <div className="error-message">{error}</div>}

        {!output && !error && !isRunning && (
          <div className="response-placeholder">
            <div className="response-placeholder-icon">✦</div>
            <p>Paste a Canva prompt on the left and click <strong>Restructure Prompt</strong>.</p>
            <p className="response-placeholder-sub">The output will be a single continuous block, ready to copy directly into Canva AI.</p>
          </div>
        )}

        {(output || isRunning) && (
          <div className="prompt-output-block">
            <div className="prompt-output-text">
              {highlightSections(output)}
              {isRunning && <span className="streaming-cursor" />}
            </div>
          </div>
        )}
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

function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
