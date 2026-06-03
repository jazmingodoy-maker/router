import React, { useEffect, useState } from 'react';

export default function PromptEditor({ config, onChange, onRun, isRunning }) {
  const [models, setModels] = useState([
    { id: 'claude-opus-4-8', name: 'Claude Opus 4.8' },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
    { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
  ]);

  useEffect(() => {
    fetch('/api/models')
      .then((r) => r.json())
      .then((data) => {
        if (data.models && data.models.length > 0) {
          setModels(data.models);
        }
      })
      .catch(() => {
        // keep defaults
      });
  }, []);

  const set = (key) => (e) => onChange({ ...config, [key]: e.target.value });
  const setNum = (key) => (e) => onChange({ ...config, [key]: Number(e.target.value) });

  return (
    <div className="panel editor-panel">
      <div className="panel-header">
        <span className="panel-title">Prompt Editor</span>
      </div>
      <div className="panel-body">
        <div className="form-group">
          <label className="form-label">System Prompt</label>
          <textarea
            className="form-textarea"
            rows={4}
            placeholder="You are a helpful assistant..."
            value={config.systemPrompt}
            onChange={set('systemPrompt')}
          />
        </div>

        <div className="form-group">
          <label className="form-label">User Prompt</label>
          <textarea
            className="form-textarea"
            rows={6}
            placeholder="Enter your prompt here..."
            value={config.userPrompt}
            onChange={set('userPrompt')}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Model</label>
          <select
            className="form-select"
            value={config.model}
            onChange={set('model')}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Temperature
          </label>
          <div className="slider-row">
            <input
              className="form-slider"
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={config.temperature}
              onChange={setNum('temperature')}
            />
            <span className="slider-value">{config.temperature.toFixed(1)}</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Max Tokens</label>
          <input
            className="form-input"
            type="number"
            min={100}
            max={4000}
            step={100}
            value={config.maxTokens}
            onChange={setNum('maxTokens')}
          />
        </div>

        <button
          className="btn btn-primary btn-run"
          onClick={onRun}
          disabled={isRunning || !config.userPrompt.trim()}
        >
          {isRunning ? (
            <>
              <SpinnerIcon />
              Running...
            </>
          ) : (
            <>
              <RunIcon />
              Run Prompt
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function RunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
