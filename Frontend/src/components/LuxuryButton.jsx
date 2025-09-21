import React from "react";

function LuxuryButton({ children, onClick, to, className = "" }) {
  if (to) {
    return (
      <a href={to} className={`luxury-btn inline-block ${className}`}>
        {children}
      </a>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`luxury-btn inline-block ${className}`}
    >
      {children}
    </button>
  );
}

export default LuxuryButton;
