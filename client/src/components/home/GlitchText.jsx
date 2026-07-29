import React from "react";

export default function GlitchText({ text, color = "#00bfff" }) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        color,
      }}
    >
      {text}

      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          color: "#ff003c",
          clipPath: "polygon(0 30%,100% 30%,100% 50%,0 50%)",
          animation: "glitch1 3.5s infinite",
          opacity: 0.7,
        }}
      >
        {text}
      </span>

      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          color: "#00ffcc",
          clipPath: "polygon(0 60%,100% 60%,100% 80%,0 80%)",
          animation: "glitch2 3.5s infinite",
          opacity: 0.6,
        }}
      >
        {text}
      </span>
    </span>
  );
}