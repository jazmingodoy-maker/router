import React, { useState } from 'react';

const SECTIONS = ['PURPOSE', 'MOOD', 'AUDIENCE / BRAND FEEL', 'SUBJECT / SCENE', 'COMPOSITION / LAYOUT', 'COPY / TEXT', 'TYPOGRAPHY', 'COLOUR', 'AVOID'];

function parseOutput(text) {
  if (!text) return null;
  const result = {};
  let currentSection = null;
  let currentLines = [];

  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const matchedSection = SECTIONS.find(
      (s) => trimmed === s || trimmed === s + ':' || trimmed.startsWith(s + '\n')
    );
    if (matchedSection) {
      if (currentSection) result[currentSection] = currentLines.join('\n').trim();
      currentSection = matchedSection;
      currentLines = [];
    } else if (currentSection) {
      currentLines.push(line);
    }
  }
  if (currentSection) result[currentSection] = currentLines.join('\n').trim();
  return Object.keys(result).length >= 3 ? result : null;
}

const SECTION_COLORS = {
  'PURPOSE': '#7C3AED',
  'MOOD': '#8B5CF6',
  'AUDIENCE / BRAND FEEL': '#9D4EDD',
  'SUBJECT / SCENE': '#6D28D9',
  'COMPOSITION / LAYOUT': '#5B21B6',
  'COPY / TEXT': '#7C3AED',
  'TYPOGRAPHY': '#8B5CF6',
  'COLOUR': '#9D4EDD',
  'AVOID': '#DC2626',
};

export default function StructuredOutput({ output, isRunning, usage, error, onClear }) {
  const [copied, setCopied] = useState(false);

  const parsed = parseOutput(output);

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
          <button className={`btn btn-ghost ${copied ? 'copy-success' : ''}`} onClick={handleCopy} disabled={!output}>
            {copied ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
          </button>
          <button className="btn btn-ghost" onClick={onClear} disabled={!output && !error}>
            <ClearIcon /> Clear
          </button>
        </div>
      </div>

      <div className="panel-body response-body">
        {error && <div className="error-message">{error}</div>}

        {!output && !error && !isRunning && (
          <div className="response-placeholder">
            <div className="response-placeholder-icon">✦</div>
            <p>Enter a design brief and click <strong>Restructure Prompt</strong>.<br />Your structured Canva prompt will appear here.</p>
          </div>
        )}

        {(output || isRunning) && (
          parsed && !isRunning ? (
            <div className="structured-sections">
              {SECTIONS.map((section) => {
                const content = parsed[section];
                if (!content) return null;
                return (
                  <div key={section} className="section-card">
                    <div className="section-label" style={{ color: SECTION_COLORS[section] || '#7C3AED' }}>
                      {section}
                    </div>
                    <div className="section-content">{content}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="response-raw">
              {output}
              {isRunning && <span className="streaming-cursor" />}
            </div>
          )
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
