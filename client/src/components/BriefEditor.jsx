import React, { useEffect, useState } from 'react';

const GENERATION_SYSTEMS = [
  { id: '', label: 'Auto', description: 'Detect from prompt', icon: '⚡' },
  { id: 'I2D', label: 'I2D', description: 'Image-to-Design', icon: '🖼' },
  { id: 'Liberation', label: 'Liberation', description: 'Template-first', icon: '📐' },
  { id: 'CDA', label: 'CDA / Canva AI', description: 'Orchestration-first', icon: '✨' },
];

export default function BriefEditor({ state, onChange, onRestructure, isRunning }) {
  const [models, setModels] = useState([
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6 (Recommended)' },
    { id: 'claude-opus-4-8', name: 'Claude Opus 4.8' },
    { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
  ]);

  useEffect(() => {
    fetch('/api/models')
      .then((r) => r.json())
      .then((data) => { if (data.models?.length) setModels(data.models); })
      .catch(() => {});
  }, []);

  const set = (key) => (e) => onChange({ ...state, [key]: e.target.value });

  return (
    <div className="panel editor-panel">
      <div className="panel-header">
        <span className="panel-title">Input Prompt</span>
        <span className="panel-subtitle">Paste your Canva prompt</span>
      </div>
      <div className="panel-body">

        <div className="form-group">
          <label className="form-label">Generation System</label>
          <div className="system-cards">
            {GENERATION_SYSTEMS.map((sys) => (
              <button
                key={sys.id}
                className={`system-card ${state.generationSystem === sys.id ? 'system-card--active' : ''}`}
                onClick={() => onChange({ ...state, generationSystem: sys.id })}
                type="button"
              >
                <span className="system-card-icon">{sys.icon}</span>
                <span className="system-card-label">{sys.label}</span>
                <span className="system-card-desc">{sys.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label className="form-label">Your Canva Prompt</label>
          <textarea
            className="form-textarea brief-textarea"
            placeholder="Paste your existing Canva AI prompt here, or describe your design idea in plain language. The assistant will restructure it into a stronger, copy-paste-ready prompt."
            value={state.rawPrompt}
            onChange={set('rawPrompt')}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Model</label>
          <select className="form-select" value={state.model} onChange={set('model')}>
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-primary btn-run"
          onClick={onRestructure}
          disabled={isRunning || !state.rawPrompt.trim()}
        >
          {isRunning
            ? <><SpinnerIcon /> Restructuring...</>
            : <><MagicIcon /> Restructure Prompt</>}
        </button>

      </div>
    </div>
  );
}

function MagicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
