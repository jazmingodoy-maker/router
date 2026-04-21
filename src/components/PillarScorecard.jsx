const PILLAR_ICONS = {
  'User Intent': '🎯',
  'Visual Excellence': '✨',
  'Stylistic Integrity': '🎨',
  'Diversity & Inclusion': '🌍',
  'Usability': '🖱️',
  'Canva-Readiness': '⭐',
};

function ScoreBar({ score }) {
  const pct = (score / 5) * 100;
  const color = score >= 4 ? 'var(--color-success)' : score === 3 ? 'var(--color-warning)' : 'var(--color-error)';
  return (
    <div className="score-bar">
      <div className="score-bar__track">
        <div className="score-bar__fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="score-bar__num" style={{ color }}>{score}/5</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { PASS: 'badge--success', FLAG: 'badge--warning', FAIL: 'badge--error' };
  return <span className={`badge ${map[status] ?? ''}`}>{status}</span>;
}

function VerdictBanner({ verdict, score, topFix, secondaryFixes }) {
  const map = {
    PASS: { cls: 'verdict--pass', label: 'PASS' },
    REVISE: { cls: 'verdict--revise', label: 'REVISE' },
    REJECT: { cls: 'verdict--reject', label: 'REJECT' },
  };
  const { cls, label } = map[verdict] ?? { cls: '', label: verdict };

  return (
    <div className={`verdict ${cls}`}>
      <div className="verdict__header">
        <span className="verdict__label">{label}</span>
        {score != null && <span className="verdict__score">{score}/5 overall</span>}
      </div>
      {topFix && (
        <div className="verdict__fix">
          <strong>Top fix:</strong> {topFix}
        </div>
      )}
      {secondaryFixes && (
        <div className="verdict__secondary">
          <strong>Also:</strong>
          <div className="verdict__secondary-text">{secondaryFixes}</div>
        </div>
      )}
    </div>
  );
}

export default function PillarScorecard({ evaluation, variationLabel }) {
  const { pillars, verdict, overallScore, topFix, secondaryFixes, comparative } = evaluation;

  if (!pillars || pillars.length === 0) return null;

  return (
    <div className="scorecard">
      {variationLabel && <h3 className="scorecard__label">{variationLabel}</h3>}

      <div className="scorecard__grid">
        {pillars.map((pillar) => (
          <div key={pillar.name} className="pillar-card">
            <div className="pillar-card__header">
              <span className="pillar-card__icon">{PILLAR_ICONS[pillar.name] ?? '•'}</span>
              <span className="pillar-card__name">{pillar.name}</span>
              <StatusBadge status={pillar.status} />
            </div>
            <ScoreBar score={pillar.score} />
            <p className="pillar-card__diagnosis">{pillar.diagnosis}</p>
          </div>
        ))}
      </div>

      {verdict && (
        <VerdictBanner
          verdict={verdict}
          score={overallScore}
          topFix={topFix}
          secondaryFixes={secondaryFixes}
        />
      )}

      {comparative && (
        <div className="scorecard__comparative">
          <strong>Comparative recommendation:</strong> {comparative}
        </div>
      )}
    </div>
  );
}
