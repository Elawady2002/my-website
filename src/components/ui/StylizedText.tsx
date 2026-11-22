import React from "react";

export const StylizedText = React.memo(function StylizedText({
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
});

export const StylizedWords = React.memo(function StylizedWords({
  text,
}: {
  text: string;
}) {
  return (
    <>
      {text.split(" ").map((word, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 ? " " : null}
          <span className="inline-block whitespace-nowrap">
            <StylizedText text={word} />
          </span>
        </React.Fragment>
      ))}
    </>
  );
});
