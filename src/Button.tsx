import React from 'react';

export const Button = () => {
  return (
    <button style={{
      backgroundColor: "#2563EB",      // ← Should highlight (matches primary token)
      color: "rgb(255, 255, 255)",     // ← Should highlight (white)
      padding: "8px 16px",             // ← Matches spacing tokens
      borderRadius: "4px",
      cursor: "pointer"
    }}>
      Click me
    </button>
  );
};