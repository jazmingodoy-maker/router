import React, { useState } from 'react';
import Header from './components/Header.jsx';
import BriefEditor from './components/BriefEditor.jsx';
import StructuredOutput from './components/StructuredOutput.jsx';
import PromptLibrary from './components/PromptLibrary.jsx';

const DEFAULT_STATE = {
  rawBrief: '',
  generationSystem: 'I2D',
  model: 'claude-sonnet-4-6',
};

export default function App() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState('');

  const handleRestructure = async () => {
    if (!state.rawBrief.trim()) return;

    setIsRunning(true);
    setOutput('');
    setError('');
    setUsage(null);

    try {
      const res = await fetch('/api/restructure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawBrief: state.rawBrief,
          generationSystem: state.generationSystem,
          model: state.model,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const msg = JSON.parse(line.slice(6).trim());
            if (msg.type === 'text') setOutput((prev) => prev + msg.text);
            else if (msg.type === 'usage') setUsage(msg.usage);
            else if (msg.type === 'error') setError(msg.error || 'Unknown error');
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setIsRunning(false);
    }
  };

  const handleClear = () => {
    setOutput('');
    setUsage(null);
    setError('');
  };

  const handleLoadSaved = (saved) => {
    setState((prev) => ({
      ...prev,
      rawBrief: saved.rawBrief || '',
      generationSystem: saved.generationSystem || 'I2D',
    }));
  };

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="main-panels">
            <BriefEditor
              state={state}
              onChange={setState}
              onRestructure={handleRestructure}
              isRunning={isRunning}
            />
            <StructuredOutput
              output={output}
              isRunning={isRunning}
              usage={usage}
              error={error}
              onClear={handleClear}
            />
          </div>
          <div className="bottom-section">
            <PromptLibrary state={state} output={output} onLoad={handleLoadSaved} />
          </div>
        </div>
      </div>
    </div>
  );
}
