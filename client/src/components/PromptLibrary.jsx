import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'canva_prompt_studio_library';

function loadLibrary() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLibrary(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export default function PromptLibrary({ state, output, onLoad }) {
  const [library, setLibrary] = useState(loadLibrary);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    saveLibrary(library);
  }, [library]);

  const handleSave = () => {
    const name = saveName.trim();
    if (!name || !state?.rawBrief?.trim()) return;
    const entry = {
      id: Date.now().toString(),
      name,
      rawBrief: state.rawBrief,
      generationSystem: state.generationSystem,
      output: output || '',
      createdAt: new Date().toISOString(),
    };
    setLibrary((prev) => [entry, ...prev]);
    setSaveName('');
  };

  const handleDelete = (id) => {
    setLibrary((prev) => prev.filter((e) => e.id !== id));
  };

  const preview = (text) => {
    if (!text) return '(empty)';
    return text.length > 50 ? text.slice(0, 50) + '…' : text;
  };

  return (
    <div className="panel library-panel">
      <div className="panel-header">
        <span className="panel-title">Prompt Library</span>
        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{library.length} saved</span>
      </div>
      <div className="panel-body">
        <div className="library-save-row">
          <input
            className="form-input"
            type="text"
            placeholder="Name this prompt…"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!saveName.trim() || !state?.rawBrief?.trim()}
          >
            Save
          </button>
        </div>

        <div className="library-list">
          {library.length === 0 ? (
            <p className="library-empty">No saved prompts yet. Save one above!</p>
          ) : (
            library.map((entry) => (
              <div key={entry.id} className="library-card">
                <div className="library-card-info">
                  <div className="library-card-name">{entry.name}</div>
                  <div className="library-card-preview">{entry.generationSystem} · {preview(entry.rawBrief)}</div>
                </div>
                <div className="library-card-actions">
                  <button
                    className="btn btn-ghost"
                    onClick={() => onLoad(entry)}
                    title="Load prompt"
                  >
                    Load
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(entry.id)}
                    title="Delete prompt"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
