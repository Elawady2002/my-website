import { useEffect, useRef } from "react";
import type React from "react";

export interface UseMagneticHoverOptions {
  xFactor?: number;
  yFactor?: number;
  scale?: number;
}

export function useMagneticHover<T extends HTMLElement>({
  xFactor = 0.16,
  yFactor = 0.2,
  scale,
}: UseMagneticHoverOptions = {}) {
  const rectsRef = useRef<WeakMap<T, DOMRect>>(new WeakMap());
  const dirtyRef = useRef(true);

  useEffect(() => {
    const markDirty = () => {
      dirtyRef.current = true;
    };
    window.addEventListener("scroll", markDirty, { passive: true });
    window.addEventListener("resize", markDirty, { passive: true });
    return () => {
      window.removeEventListener("scroll", markDirty);
      window.removeEventListener("resize", markDirty);
    };
  }, []);

  const readRect = (el: T): DOMRect => {
    if (dirtyRef.current) {
      rectsRef.current = new WeakMap();
      dirtyRef.current = false;
    }
    let rect = rectsRef.current.get(el);
    if (!rect) {
      rect = el.getBoundingClientRect();
      rectsRef.current.set(el, rect);
    }
    return rect;
  };

  const onMouseEnter = (e: React.MouseEvent<T>) => {
    dirtyRef.current = false;
    rectsRef.current.set(e.currentTarget, e.currentTarget.getBoundingClientRect());
  };

  const onMouseMove = (e: React.MouseEvent<T>) => {
    const el = e.currentTarget;
    const rect = readRect(el);
    const dx = e.clientX - (rect.left + rect.width * 0.5);
    const dy = e.clientY - (rect.top + rect.height * 0.5);
    const scaleSuffix = scale !== undefined ? ` scale(${scale})` : "";
    el.style.transform = `translate3d(${(dx * xFactor).toFixed(1)}px, ${(
      dy * yFactor
    ).toFixed(1)}px, 0)${scaleSuffix}`;
  };

  const onMouseLeave = (e: React.MouseEvent<T>) => {
    rectsRef.current.delete(e.currentTarget);
    const scaleSuffix = scale !== undefined ? " scale(1)" : "";
    e.currentTarget.style.transform = `translate3d(0px, 0px, 0)${scaleSuffix}`;
  };

  return { onMouseEnter, onMouseMove, onMouseLeave };
}
