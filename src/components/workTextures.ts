import {
  CanvasTexture,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
  type WebGLRenderer,
} from "three";
import type { WorkProjectItem } from "@/data/site";
import { getDevicePerfTier } from "@/lib/deviceTier";

export const WORK_PLANE_WIDTH = 4.52;
export const WORK_PLANE_HEIGHT = 2.82;

export const SHOWCASE_INNER_UV = {
  left: 0.16975,
  bottom: 0.17578,
  right: 0.83025,
  top: 0.82422,
} as const;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      img.onload = null;
      img.onerror = null;
      resolve(img);
    };
    img.onerror = () => {
      img.onload = null;
      img.onerror = null;
      resolve(null);
    };
    img.src = src;
  });
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number
): void {
  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;
  if (natW <= 0 || natH <= 0) return;
  const scale = Math.max(width / natW, height / natH);
  const dw = natW * scale;
  const dh = natH * scale;
  ctx.drawImage(img, (width - dw) * 0.5, (height - dh) * 0.5, dw, dh);
}

function drawGlassRim(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const edgeWidth = Math.max(1.5, 1.8 * (width / 1600));
  const inset = edgeWidth * 0.5;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.085)";
  ctx.lineWidth = edgeWidth;
  ctx.strokeRect(inset, inset, width - edgeWidth, height - edgeWidth);
}

/**
 * Composites a project slide onto an offscreen canvas texture sized appropriately
 * for the active device tier, then releases transient HTMLImageElement handles.
 */
export function createProjectTexture(
  renderer: WebGLRenderer,
  project: WorkProjectItem,
  onTextureUpdated?: () => void
): CanvasTexture {
  const maxTex = renderer.capabilities.maxTextureSize || 4096;
  const perf = getDevicePerfTier();
  const width = Math.min(perf.workTexWidth, maxTex);
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
  ctx.fillStyle = project.stageBg;
  ctx.fillRect(0, 0, width, height);
  texture.needsUpdate = true;

  if (project.imageSrc && project.posterSrc) {
    void Promise.all([
      loadImage(project.imageSrc),
      loadImage(project.posterSrc),
    ]).then(([bgImg, posterImg]) => {
      if (!bgImg || !posterImg) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, width, height);
      drawCoverImage(ctx, bgImg, width, height);

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
    });
    return texture;
  }

  if (project.mobileScreens && project.mobileScreens.length > 0) {
    const screenSrcs = project.mobileScreens;
    const bgPromise = project.imageSrc
      ? loadImage(project.imageSrc)
      : Promise.resolve(null);
    const screensPromise = Promise.all(screenSrcs.map((src) => loadImage(src)));

    void Promise.all([bgPromise, screensPromise]).then(([bgImg, screenImgs]) => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = project.stageBg;
      ctx.fillRect(0, 0, width, height);

      if (bgImg) {
        drawCoverImage(ctx, bgImg, width, height);
        const vignette = ctx.createRadialGradient(
          width * 0.5,
          height * 0.5,
          width * 0.16,
          width * 0.5,
          height * 0.5,
          width * 0.74
        );
        vignette.addColorStop(0, "rgba(0, 0, 0, 0.08)");
        vignette.addColorStop(1, "rgba(0, 0, 0, 0.34)");
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
        drawGlassRim(ctx, width, height);
      }

      const s = width / 1600;
      const slots =
        screenSrcs.length >= 3
          ? [
              { centerX: 418 * s, topY: 162 * s, height: 696 * s, drawOrder: 0 },
              { centerX: 800 * s, topY: 118 * s, height: 708 * s, drawOrder: 2 },
              { centerX: 1182 * s, topY: 162 * s, height: 696 * s, drawOrder: 1 },
            ]
          : [
              { centerX: 577.5 * s, topY: 114 * s, height: 760 * s, drawOrder: 0 },
              { centerX: 1022.5 * s, topY: 154 * s, height: 760 * s, drawOrder: 1 },
            ];

      const orderedIndices = Array.from(
        { length: Math.min(screenSrcs.length, slots.length) },
        (_, i) => i
      ).sort((a, b) => slots[a].drawOrder - slots[b].drawOrder);

      orderedIndices.forEach((idx) => {
        const img = screenImgs[idx];
        if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) return;
        const slot = slots[idx];
        const dh = slot.height;
        const dw = dh * (img.naturalWidth / img.naturalHeight);
        const dx = slot.centerX - dw * 0.5;
        const dy = slot.topY;

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.58)";
        ctx.shadowBlur = 48 * s;
        ctx.shadowOffsetY = 24 * s;
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.30)";
        ctx.shadowBlur = 12 * s;
        ctx.shadowOffsetY = 5 * s;
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      });

      texture.needsUpdate = true;
      onTextureUpdated?.();
    });
    return texture;
  }

  if (project.imageSrc) {
    void loadImage(project.imageSrc).then((img) => {
      if (!img) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, width, height);
      drawCoverImage(ctx, img, width, height);
      drawGlassRim(ctx, width, height);
      texture.needsUpdate = true;
      onTextureUpdated?.();
    });
  }

  return texture;
}
