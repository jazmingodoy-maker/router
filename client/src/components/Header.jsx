import React from 'react';

export default function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <div className="header-logo-icon">C</div>
        <h1 className="header-title">
          Canva <span>Prompt Studio</span>
        </h1>
      </div>
      <div className="header-badge">Beta</div>
    </header>
  );
}
