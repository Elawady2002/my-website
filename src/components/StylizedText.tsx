import React from "react";

export function StylizedText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={className}>
      {Array.from(text).map((char, idx) =>
        char === "O" || char === "o" ? (
          <span key={idx} className="playfair-o">
            {char}
          </span>
        ) : (
          <React.Fragment key={idx}>{char}</React.Fragment>
        )
      )}
    </span>
  );
}
