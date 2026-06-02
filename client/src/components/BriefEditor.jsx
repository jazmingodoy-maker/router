import React, { useEffect, useState } from 'react';
import { STYLE_SYSTEMS, GENERATION_SYSTEMS, TAGS, CATEGORY_LABELS } from '../data/styleTags.js';

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

  const toggleTag = (category, tag) => {
    const current = state.selectedTags?.[category] || [];
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    const newTags = { ...state.selectedTags, [category]: updated };
    onChange({ ...state, selectedTags: newTags, rawPrompt: buildPrompt(newTags, state.customInputs || {}) });
  };

  const setCustomInput = (category, value) => {
    const newCustom = { ...state.customInputs, [category]: value };
    onChange({ ...state, customInputs: newCustom, rawPrompt: buildPrompt(state.selectedTags || {}, newCustom) });
  };

  const buildPrompt = (tags, customs) => {
    const parts = [];
    for (const cat of Object.keys(CATEGORY_LABELS)) {
      const selected = tags[cat] || [];
      const custom = customs[cat] || '';
      const all = [...selected, ...(custom ? [custom] : [])];
      if (all.length) parts.push(`${CATEGORY_LABELS[cat].label}: ${all.join(', ')}`);
    }
    return parts.join('. ');
  };

  const activeStyle = state.styleSystem || 'auto';
  const tagData = activeStyle !== 'auto' ? TAGS[activeStyle] : null;
  const hasSelections = Object.values(state.selectedTags || {}).some((v) => v.length > 0)
    || Object.values(state.customInputs || {}).some((v) => v.trim());

  return (
    <div className="panel editor-panel">
      <div className="panel-header">
        <span className="panel-title">Build Your Prompt</span>
        <span className="panel-subtitle">select tags or describe freely</span>
      </div>
      <div className="panel-body">

        {/* Style System */}
        <div className="form-group">
          <div className="section-row-label">
            <span className="form-label">Style System</span>
            <span className="form-hint">filters available tags</span>
          </div>
          <div className="style-system-cards">
            {STYLE_SYSTEMS.map((sys) => (
              <button
                key={sys.id}
                className={`style-card ${activeStyle === sys.id ? 'style-card--active' : ''}`}
                onClick={() => onChange({ ...state, styleSystem: sys.id, selectedTags: {}, customInputs: {}, rawPrompt: '' })}
                type="button"
              >
                <span className="style-card-icon">{sys.icon}</span>
                <span className="style-card-label">{sys.label}</span>
                <span className="style-card-desc">{sys.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tag categories */}
        {Object.keys(CATEGORY_LABELS).map((cat) => {
          const { label, hint } = CATEGORY_LABELS[cat];
          const tags = tagData?.[cat] || [];
          const selectedTags = state.selectedTags?.[cat] || [];
          const customVal = state.customInputs?.[cat] || '';

          return (
            <div key={cat} className="form-group tag-group">
              <div className="section-row-label">
                <span className="form-label">{label}</span>
                <span className="form-hint">{hint}</span>
              </div>

              {tags.length > 0 ? (
                <div className="tag-chips">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      className={`tag-chip ${selectedTags.includes(tag) ? 'tag-chip--active' : ''}`}
                      onClick={() => toggleTag(cat, tag)}
                      type="button"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="tags-empty-hint">Select a style system above to see relevant tags</p>
              )}

              <input
                className="form-input tag-custom-input"
                type="text"
                placeholder={`Add your own ${label.toLowerCase()}…`}
                value={customVal}
                onChange={(e) => setCustomInput(cat, e.target.value)}
              />
            </div>
          );
        })}

        {/* Assembled preview */}
        {hasSelections && (
          <div className="form-group">
            <div className="section-row-label">
              <span className="form-label">Assembled Prompt</span>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => onChange({ ...state, selectedTags: {}, customInputs: {}, rawPrompt: '' })}
                type="button"
              >
                Clear all
              </button>
            </div>
            <div className="assembled-prompt">{state.rawPrompt}</div>
          </div>
        )}

        {/* Free-text override */}
        {!hasSelections && (
          <div className="form-group">
            <div className="section-row-label">
              <span className="form-label">Or describe freely</span>
            </div>
            <textarea
              className="form-textarea brief-textarea"
              placeholder="Paste an existing Canva prompt or describe your design in plain language…"
              value={state.rawPrompt}
              onChange={set('rawPrompt')}
            />
          </div>
        )}

        {/* Generation system */}
        <div className="form-group">
          <div className="section-row-label">
            <span className="form-label">Generation System</span>
            <span className="form-hint">Canva model</span>
          </div>
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

        {/* Model */}
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
          disabled={isRunning || !state.rawPrompt?.trim()}
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
