import React from 'react';

export default function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <div className="header-logo-icon">✦</div>
        <div>
          <h1 className="header-title">Canva <span>Prompt Studio</span></h1>
          <p className="header-tagline">Restructure briefs into high-quality Canva design prompts</p>
        </div>
      </div>
      <div className="header-badge">Beta</div>
    </header>
  );
}
