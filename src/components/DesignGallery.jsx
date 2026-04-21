import { useState } from 'react';

function DesignCard({ design, index, onSelect, selected }) {
  return (
    <div
      className={`design-card ${selected ? 'design-card--selected' : ''}`}
      onClick={() => onSelect(design)}
    >
      <div className="design-card__preview">
        {design.thumbnailUrl ? (
          <img src={design.thumbnailUrl} alt={`Design ${index + 1}`} className="design-card__img" />
        ) : (
          <div className="design-card__placeholder">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
              <rect x="4" y="4" width="24" height="24" rx="3" />
              <circle cx="12" cy="12" r="2.5" />
              <path d="M4 22l7-7 5 5 3-3 9 9" />
            </svg>
            <span>No preview</span>
          </div>
        )}
        {selected && (
          <div className="design-card__check">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2">
              <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      <div className="design-card__meta">
        <span className="design-card__num">Variation {index + 1}</span>
        {design.designId && (
          <a
            href={design.editUrl || `https://www.canva.com/design/${design.designId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="design-card__link"
            onClick={(e) => e.stopPropagation()}
          >
            Open in Canva ↗
          </a>
        )}
      </div>
    </div>
  );
}

export default function DesignGallery({ designs, rawResponse, isGenerating, onEvaluate }) {
  const [selected, setSelected] = useState(new Set());

  const toggleSelect = (design) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(design)) next.delete(design);
      else next.add(design);
      return next;
    });
  };

  const handleEvaluate = () => {
    const toEvaluate = selected.size > 0 ? [...selected] : designs;
    onEvaluate(toEvaluate);
  };

  if (isGenerating) {
    return (
      <div className="gallery gallery--loading">
        <div className="spinner" />
        <p>Generating designs in Canva…</p>
      </div>
    );
  }

  return (
    <div className="gallery">
      <div className="gallery__header">
        <h3 className="gallery__title">
          {designs.length > 0
            ? `${designs.length} Design${designs.length !== 1 ? 's' : ''} Generated`
            : 'Canva Generation Output'}
        </h3>
        {designs.length > 0 && (
          <div className="gallery__actions">
            <span className="gallery__hint">
              {selected.size === 0 ? 'Click to select • all will be evaluated' : `${selected.size} selected`}
            </span>
            <button className="btn btn--primary" onClick={handleEvaluate}>
              Evaluate {selected.size > 0 ? `${selected.size}` : 'all'} →
            </button>
          </div>
        )}
      </div>

      {designs.length > 0 ? (
        <div className="gallery__grid">
          {designs.map((design, i) => (
            <DesignCard
              key={i}
              design={design}
              index={i}
              onSelect={toggleSelect}
              selected={selected.has(design)}
            />
          ))}
        </div>
      ) : rawResponse ? (
        <div className="gallery__raw">
          <p className="gallery__raw-label">Raw Canva response:</p>
          <pre className="gallery__raw-text">{rawResponse}</pre>
          <button className="btn btn--secondary" onClick={() => onEvaluate([{ description: rawResponse }])}>
            Evaluate this output →
          </button>
        </div>
      ) : null}
    </div>
  );
}
