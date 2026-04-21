export default function StageNav({ activeStage, onStageChange, handoff }) {
  const stages = [
    {
      id: 'router',
      label: 'Router',
      num: 1,
      desc: 'Classify & route',
      done: !!handoff.routerBrief,
    },
    {
      id: 'builder',
      label: 'Prompt Builder',
      num: 2,
      desc: 'Craft the prompt',
      done: !!handoff.canvaPrompt,
    },
    {
      id: 'evaluator',
      label: 'Evaluator',
      num: 3,
      desc: 'Score the output',
      done: false,
    },
  ];

  return (
    <header className="stage-nav">
      <div className="stage-nav__brand">
        <span className="stage-nav__logo">✦</span>
        <span className="stage-nav__title">Design Pipeline</span>
      </div>

      <nav className="stage-nav__stages">
        {stages.map((stage, i) => (
          <div key={stage.id} className="stage-nav__item-wrap">
            <button
              className={[
                'stage-nav__item',
                activeStage === stage.id ? 'stage-nav__item--active' : '',
                stage.done ? 'stage-nav__item--done' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onStageChange(stage.id)}
            >
              <span className="stage-nav__num">
                {stage.done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  stage.num
                )}
              </span>
              <span className="stage-nav__label">{stage.label}</span>
              <span className="stage-nav__desc">{stage.desc}</span>
            </button>
            {i < stages.length - 1 && (
              <div className={`stage-nav__connector ${stage.done ? 'stage-nav__connector--done' : ''}`} />
            )}
          </div>
        ))}
      </nav>

      <div className="stage-nav__status">
        {handoff.routerBrief && !handoff.canvaPrompt && (
          <span className="badge badge--info">Brief routed</span>
        )}
        {handoff.canvaPrompt && handoff.designs.length === 0 && (
          <span className="badge badge--warning">Prompt ready</span>
        )}
        {handoff.designs.length > 0 && (
          <span className="badge badge--success">{handoff.designs.length} design{handoff.designs.length !== 1 ? 's' : ''} generated</span>
        )}
      </div>
    </header>
  );
}
