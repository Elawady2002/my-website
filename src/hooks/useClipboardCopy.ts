import { useEffect, useRef, useState } from "react";

export function useClipboardCopy(resetDelayMs = 1600) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copy = (value: string) => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setCopied(false);
    }, resetDelayMs);
  };

  return { copied, copy };
}
