import {
  CanvasTexture,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
  type WebGLRenderer,
} from "three";
import type { WorkProjectItem } from "@/data/site";

export const WORK_PLANE_WIDTH = 4.52;
export const WORK_PLANE_HEIGHT = 2.82;

export const SHOWCASE_INNER_UV = {
  left: 0.16975,
  bottom: 0.17578,
  right: 0.83025,
  top: 0.82422,
} as const;

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : clean;
  if (full.length !== 6) return { r: 255, g: 255, b: 255 };
  const num = Number.parseInt(full, 16);
  if (Number.isNaN(num)) return { r: 255, g: 255, b: 255 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isLightHex(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 150;
}

function drawStageBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  project: WorkProjectItem
) {
  const s = w / 1600;
  const lightStage = isLightHex(project.stageBg);

  ctx.fillStyle = project.stageBg;
  ctx.fillRect(0, 0, w, h);

  // Studio radial spotlight tuned to screen accent
  const grad = ctx.createRadialGradient(
    w * 0.5,
    h * 0.48,
    w * 0.03,
    w * 0.5,
    h * 0.48,
    w * 0.68
  );
  grad.addColorStop(0, hexToRgba(project.stageAccent, lightStage ? 0.08 : 0.14));
  grad.addColorStop(
    0.52,
    hexToRgba(project.stageAccent, lightStage ? 0.03 : 0.05)
  );
  grad.addColorStop(
    1,
    lightStage ? "rgba(0, 0, 0, 0.08)" : "rgba(0, 0, 0, 0.26)"
  );
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Precision centered dual-weight architectural square grid
  const cols = 28;
  const cell = w / cols;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const maxK = Math.ceil(cx / cell);
  const maxM = Math.ceil(cy / cell);

  ctx.strokeStyle = lightStage
    ? "rgba(20, 20, 22, 0.042)"
    : "rgba(244, 239, 232, 0.038)";
  ctx.lineWidth = Math.max(1, 1.1 * s);
  ctx.beginPath();
  for (let k = -maxK; k <= maxK; k += 1) {
    if (k % 4 === 0) continue;
    const x = cx + k * cell;
    if (x <= 0.5 || x >= w - 0.5) continue;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let m = -maxM; m <= maxM; m += 1) {
    if (m % 4 === 0) continue;
    const y = cy + m * cell;
    if (y <= 0.5 || y >= h - 0.5) continue;
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  ctx.strokeStyle = lightStage
    ? "rgba(20, 20, 22, 0.082)"
    : "rgba(244, 239, 232, 0.078)";
  ctx.lineWidth = Math.max(1.25, 1.45 * s);
  ctx.beginPath();
  for (let k = -maxK; k <= maxK; k += 1) {
    if (k % 4 !== 0) continue;
    const x = cx + k * cell;
    if (x <= 0.5 || x >= w - 0.5) continue;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let m = -maxM; m <= maxM; m += 1) {
    if (m % 4 !== 0) continue;
    const y = cy + m * cell;
    if (y <= 0.5 || y >= h - 0.5) continue;
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // Subtle architectural '+' micro-crosshairs at major intersections
  const arm = 4.5 * s;
  ctx.strokeStyle = lightStage
    ? "rgba(20, 20, 22, 0.13)"
    : hexToRgba(project.stageAccent, 0.16);
  ctx.lineWidth = Math.max(1, 1.2 * s);
  ctx.beginPath();
  for (let k = -maxK; k <= maxK; k += 4) {
    const x = cx + k * cell;
    if (x < w * 0.06 || x > w * 0.94) continue;
    for (let m = -maxM; m <= maxM; m += 4) {
      const y = cy + m * cell;
      if (y < h * 0.08 || y > h * 0.92) continue;
      ctx.moveTo(x - arm, y);
      ctx.lineTo(x + arm, y);
      ctx.moveTo(x, y - arm);
      ctx.lineTo(x, y + arm);
    }
  }
  ctx.stroke();

  // Gentle outer radial vignette so the grid softly recedes toward edges
  const vignette = ctx.createRadialGradient(
    w * 0.5,
    h * 0.5,
    w * 0.34,
    w * 0.5,
    h * 0.5,
    w * 0.74
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(
    1,
    lightStage ? "rgba(0, 0, 0, 0.07)" : "rgba(0, 0, 0, 0.30)"
  );
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Subtle inner glass edge highlight
  const edgeWidth = Math.max(1.5, 1.8 * s);
  const inset = edgeWidth * 0.5;
  ctx.strokeStyle = lightStage
    ? "rgba(255, 255, 255, 0.22)"
    : "rgba(255, 255, 255, 0.085)";
  ctx.lineWidth = edgeWidth;
  ctx.strokeRect(inset, inset, w - edgeWidth, h - edgeWidth);
}

function drawPhoneMockup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  project: WorkProjectItem,
  isSecondary: boolean
) {
  const isLight = project.cardBg.toLowerCase().startsWith("#f");
  const fg = isLight ? "#141416" : "#f4f1ea";
  const muted = isLight ? "rgba(20,20,22,0.58)" : "rgba(244,241,234,0.58)";

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 46;
  ctx.shadowOffsetY = 24;

  // Metallic bezel
  roundRectPath(ctx, x, y, w, h, 44);
  ctx.fillStyle = "#2b2b30";
  ctx.fill();
  ctx.restore();

  roundRectPath(ctx, x + 5, y + 5, w - 10, h - 10, 40);
  ctx.fillStyle = project.cardBg;
  ctx.fill();

  // Dynamic Island
  roundRectPath(ctx, x + w / 2 - 42, y + 20, 84, 20, 10);
  ctx.fillStyle = "#09090b";
  ctx.fill();

  const pad = 28;
  const cx = x + pad;
  const cw = w - pad * 2;

  if (!isSecondary) {
    // Primary Screen
    ctx.fillStyle = project.cardAccent;
    ctx.font = "700 16px Inter, system-ui, sans-serif";
    ctx.fillText(project.title, cx, y + 78);

    ctx.fillStyle = fg;
    ctx.font = "700 32px Inter, system-ui, sans-serif";
    const lines = project.headline.split("\n");
    lines.forEach((line, idx) => {
      ctx.fillText(line, cx, y + 128 + idx * 38);
    });

    // Accent KPI Card
    roundRectPath(ctx, cx, y + 206, cw, 150, 22);
    ctx.fillStyle = isLight ? "#ffffff" : "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.strokeStyle = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = muted;
    ctx.font = "600 13px Inter, system-ui, sans-serif";
    ctx.fillText("LIVE METRIC · 60FPS", cx + 20, y + 240);

    ctx.fillStyle = fg;
    ctx.font = "700 44px Inter, system-ui, sans-serif";
    ctx.fillText("$48,920", cx + 20, y + 298);

    roundRectPath(ctx, cx + 20, y + 318, 96, 22, 11);
    ctx.fillStyle = `${project.cardAccent}33`;
    ctx.fill();
    ctx.fillStyle = project.cardAccent;
    ctx.font = "700 12px Inter, system-ui, sans-serif";
    ctx.fillText("+24.8%", cx + 44, y + 333);

    // Action Pill
    roundRectPath(ctx, cx, y + 382, cw, 54, 27);
    ctx.fillStyle = project.cardAccent;
    ctx.fill();
    ctx.fillStyle = "#0b0b0b";
    ctx.font = "700 15px Inter, system-ui, sans-serif";
    ctx.fillText("LAUNCH EXPERIENCE  →", cx + 38, y + 414);

    // Bottom rows
    for (let r = 0; r < 3; r += 1) {
      const ry = y + 462 + r * 62;
      roundRectPath(ctx, cx, ry, cw, 48, 14);
      ctx.fillStyle = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)";
      ctx.fill();
      ctx.fillStyle = project.cardAccent;
      ctx.beginPath();
      ctx.arc(cx + 22, ry + 24, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fg;
      ctx.font = "600 14px Inter, system-ui, sans-serif";
      ctx.fillText(`Module 0${r + 1}`, cx + 44, ry + 29);
    }
  } else {
    // Secondary Analytics Screen
    ctx.fillStyle = muted;
    ctx.font = "600 14px Inter, system-ui, sans-serif";
    ctx.fillText("ARCHITECTURE", cx, y + 78);

    ctx.fillStyle = fg;
    ctx.font = "700 26px Inter, system-ui, sans-serif";
    ctx.fillText("Activity Flow", cx, y + 114);

    // Bar Chart
    const heights = [64, 110, 88, 148, 120, 172, 134];
    heights.forEach((bh, i) => {
      const bx = cx + i * 38;
      const by = y + 340 - bh;
      roundRectPath(ctx, bx, by, 24, bh, 8);
      ctx.fillStyle =
        i === 5
          ? project.cardAccent
          : isLight
          ? "rgba(0,0,0,0.12)"
          : "rgba(255,255,255,0.14)";
      ctx.fill();
    });

    // Bottom chips
    for (let c = 0; c < 2; c += 1) {
      const ry = y + 388 + c * 92;
      roundRectPath(ctx, cx, ry, cw, 74, 18);
      ctx.fillStyle = isLight ? "#ffffff" : "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.fillStyle = fg;
      ctx.font = "700 16px Inter, system-ui, sans-serif";
      ctx.fillText(c === 0 ? "Design Tokens" : "Flutter State", cx + 18, ry + 34);
      ctx.fillStyle = muted;
      ctx.font = "500 13px Inter, system-ui, sans-serif";
      ctx.fillText("Synced & Verified", cx + 18, ry + 56);
    }
  }
}

function drawDesktopFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  project: WorkProjectItem
) {
  const isLight = project.cardBg.toLowerCase().startsWith("#f");
  const fg = isLight ? "#141416" : "#f4f1ea";
  const muted = isLight ? "rgba(20,20,22,0.62)" : "rgba(244,241,234,0.62)";

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.58)";
  ctx.shadowBlur = 54;
  ctx.shadowOffsetY = 26;
  ctx.fillStyle = project.cardBg;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  // Top nav bar inside framed site
  ctx.fillStyle = project.cardAccent;
  roundRectPath(ctx, x + 42, y + 38, 28, 28, 7);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = "700 20px Inter, system-ui, sans-serif";
  ctx.fillText(project.title, x + 84, y + 59);

  ctx.fillStyle = muted;
  ctx.font = "600 13px Inter, system-ui, sans-serif";
  ctx.fillText("OVERVIEW", x + 410, y + 58);
  ctx.fillText("SYSTEM", x + 520, y + 58);
  ctx.fillText("MOBILE", x + 610, y + 58);

  roundRectPath(ctx, x + w - 180, y + 32, 142, 40, 8);
  ctx.fillStyle = project.cardAccent;
  ctx.fill();
  ctx.fillStyle = "#0b0b0b";
  ctx.font = "700 13px Inter, system-ui, sans-serif";
  ctx.fillText("CASE STUDY →", x + w - 156, y + 57);

  // Split Hero inside frame
  if (project.layout === "split") {
    // Big bold headline matching tomdekoning.work crisp editorial framing
    ctx.fillStyle = project.cardAccent;
    ctx.font = "800 62px Inter, system-ui, sans-serif";
    const lines = project.headline.split("\n");
    lines.forEach((line, idx) => {
      ctx.fillText(line, x + 240, y + 185 + idx * 68);
    });

    ctx.fillStyle = muted;
    ctx.font = "400 18px Inter, system-ui, sans-serif";
    const words = project.subcopy.split(" ");
    let row = "";
    let rowY = y + 315;
    words.forEach((word) => {
      const test = row ? `${row} ${word}` : word;
      if (ctx.measureText(test).width > w - 290) {
        ctx.fillText(row, x + 240, rowY);
        row = word;
        rowY += 26;
      } else {
        row = test;
      }
    });
    if (row) ctx.fillText(row, x + 240, rowY);

    // Accent CTA button
    roundRectPath(ctx, x + 240, y + 410, 210, 48, 8);
    ctx.fillStyle = project.cardAccent;
    ctx.fill();
    ctx.fillStyle = "#0b0b0b";
    ctx.font = "700 14px Inter, system-ui, sans-serif";
    ctx.fillText("EXPLORE SYSTEM  >", x + 266, y + 439);

    // Left accent mark
    ctx.fillStyle = `${project.cardAccent}28`;
    roundRectPath(ctx, x + 44, y + 128, 160, 320, 14);
    ctx.fill();
    ctx.fillStyle = project.cardAccent;
    ctx.font = "800 50px Inter, system-ui, sans-serif";
    ctx.fillText("01", x + 68, y + 204);
  } else {
    // Dashboard UI layout
    ctx.fillStyle = project.cardAccent;
    ctx.font = "700 14px Inter, system-ui, sans-serif";
    ctx.fillText(project.badge, x + 42, y + 124);

    ctx.fillStyle = fg;
    ctx.font = "700 50px Inter, system-ui, sans-serif";
    const lines = project.headline.split("\n");
    lines.forEach((line, idx) => {
      ctx.fillText(line, x + 42, y + 178 + idx * 56);
    });

    // 3 Glass metric panels
    const cardW = (w - 116) / 3;
    for (let i = 0; i < 3; i += 1) {
      const cx = x + 38 + i * (cardW + 20);
      const cy = y + 285;
      roundRectPath(ctx, cx, cy, cardW, 225, 16);
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.09)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = project.cardAccent;
      roundRectPath(ctx, cx + 22, cy + 22, 48, 10, 5);
      ctx.fill();

      ctx.fillStyle = fg;
      ctx.font = "700 30px Inter, system-ui, sans-serif";
      ctx.fillText(["99.4%", "60 FPS", "140+"][i], cx + 22, cy + 84);

      ctx.fillStyle = muted;
      ctx.font = "500 14px Inter, system-ui, sans-serif";
      ctx.fillText(
        ["Uptime Core", "Flutter Motion", "Design Tokens"][i],
        cx + 22,
        cy + 114
      );

      // Mini waveform/bar accent
      for (let b = 0; b < 5; b += 1) {
        const bh = 22 + ((b * 17 + i * 29) % 48);
        roundRectPath(ctx, cx + 22 + b * 28, cy + 196 - bh, 18, bh, 5);
        ctx.fillStyle =
          b === 3 ? project.cardAccent : "rgba(255,255,255,0.14)";
        ctx.fill();
      }
    }
  }

  // Bottom pagination indicator inside frame
  roundRectPath(ctx, x + 240, y + h - 58, 68, 34, 6);
  ctx.fillStyle = project.cardAccent;
  ctx.fill();
  ctx.fillStyle = "#0b0b0b";
  ctx.font = "700 15px Inter, system-ui, sans-serif";
  ctx.fillText("<  >", x + 258, y + h - 36);
}

export function createProjectTexture(
  renderer: WebGLRenderer,
  project: WorkProjectItem,
  onTextureUpdated?: () => void
): CanvasTexture {
  const maxTex = renderer.capabilities.maxTextureSize || 4096;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const width = project.imageSrc
    ? Math.min(isMobile ? 1536 : 2048, maxTex)
    : project.mobileScreens
    ? Math.min(isMobile ? 1600 : 2400, maxTex)
    : 1600;
  const height = Math.round((width * WORK_PLANE_HEIGHT) / WORK_PLANE_WIDTH);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;

  if (!ctx) return texture;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (project.imageSrc && project.posterSrc) {
    ctx.fillStyle = project.stageBg;
    ctx.fillRect(0, 0, width, height);
    texture.needsUpdate = true;

    const bgImg = new window.Image();
    const posterImg = new window.Image();
    bgImg.crossOrigin = "anonymous";
    posterImg.crossOrigin = "anonymous";
    bgImg.decoding = "async";
    posterImg.decoding = "async";

    let loaded = 0;
    const renderComposite = () => {
      loaded += 1;
      if (loaded < 2) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, width, height);

      // Cover-fit thematic atmospheric backdrop across full slide
      const scale = Math.max(width / bgImg.width, height / bgImg.height);
      const dw = bgImg.width * scale;
      const dh = bgImg.height * scale;
      ctx.drawImage(bgImg, (width - dw) / 2, (height - dh) / 2, dw, dh);

      // Exact sharp-cornered inner showcase frame matching tomdekoning.work proportions
      const ix = width * SHOWCASE_INNER_UV.left;
      const iy = height * (1 - SHOWCASE_INNER_UV.top);
      const iw = width * (SHOWCASE_INNER_UV.right - SHOWCASE_INNER_UV.left);
      const ih = height * (SHOWCASE_INNER_UV.top - SHOWCASE_INNER_UV.bottom);

      const pad = 2;
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.34)";
      ctx.shadowBlur = Math.round(width * 0.015);
      ctx.shadowOffsetY = Math.round(height * 0.006);
      ctx.fillStyle = project.cardBg;
      ctx.fillRect(ix + pad, iy + pad, iw - pad * 2, ih - pad * 2);
      ctx.restore();

      ctx.drawImage(posterImg, ix + pad, iy + pad, iw - pad * 2, ih - pad * 2);
      texture.needsUpdate = true;
      onTextureUpdated?.();
    };

    bgImg.onload = renderComposite;
    posterImg.onload = renderComposite;
    bgImg.src = project.imageSrc;
    posterImg.src = project.posterSrc;

    return texture;
  }

  if (project.imageSrc) {
    // Solid stage fill while real project image finishes decoding (zero mockup flash)
    ctx.fillStyle = project.stageBg;
    ctx.fillRect(0, 0, width, height);
    texture.needsUpdate = true;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      const scale = Math.max(width / img.width, height / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
      texture.needsUpdate = true;
      onTextureUpdated?.();
    };
    img.src = project.imageSrc;

    return texture;
  }

  if (project.mobileScreens) {
    drawStageBackdrop(ctx, width, height, project);
    texture.needsUpdate = true;

    const screenSrcs = project.mobileScreens;
    const loadedScreens: (HTMLImageElement | null)[] = [null, null];
    let settled = 0;

    const renderMobileScreens = () => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, width, height);
      drawStageBackdrop(ctx, width, height, project);

      const s = width / 1600;
      const ambientGlow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.51,
        width * 0.04,
        width * 0.5,
        height * 0.51,
        width * 0.34
      );
      ambientGlow.addColorStop(0, "rgba(255, 252, 246, 0.055)");
      ambientGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, width, height);

      const slots = [
        { centerX: 577.5 * s, topY: 114 * s, height: 760 * s },
        { centerX: 1022.5 * s, topY: 154 * s, height: 760 * s },
      ];

      loadedScreens.forEach((img, idx) => {
        if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) return;
        const slot = slots[idx];
        const dh = slot.height;
        const dw = dh * (img.naturalWidth / img.naturalHeight);
        const dx = slot.centerX - dw / 2;
        const dy = slot.topY;

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.52)";
        ctx.shadowBlur = 46 * s;
        ctx.shadowOffsetY = 24 * s;
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.26)";
        ctx.shadowBlur = 12 * s;
        ctx.shadowOffsetY = 5 * s;
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      });

      texture.needsUpdate = true;
      onTextureUpdated?.();
    };

    screenSrcs.forEach((src, idx) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload = () => {
        loadedScreens[idx] = img;
        settled += 1;
        if (settled === screenSrcs.length) {
          renderMobileScreens();
        }
      };
      img.onerror = () => {
        settled += 1;
        if (settled === screenSrcs.length) {
          renderMobileScreens();
        }
      };
      img.src = src;
    });

    return texture;
  }

  drawStageBackdrop(ctx, width, height, project);

  if (project.layout === "mobile") {
    drawPhoneMockup(ctx, 390, 114, 375, 760, project, false);
    drawPhoneMockup(ctx, 835, 154, 375, 760, project, true);
  } else {
    const ix = Math.round(width * SHOWCASE_INNER_UV.left);
    const iy = Math.round(height * (1 - SHOWCASE_INNER_UV.top));
    const iw = Math.round(
      width * (SHOWCASE_INNER_UV.right - SHOWCASE_INNER_UV.left)
    );
    const ih = Math.round(
      height * (SHOWCASE_INNER_UV.top - SHOWCASE_INNER_UV.bottom)
    );
    drawDesktopFrame(ctx, ix, iy, iw, ih, project);
  }

  texture.needsUpdate = true;
  return texture;
}
