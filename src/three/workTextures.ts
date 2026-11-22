import {
  CanvasTexture,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
  type WebGLRenderer,
} from "three";
import type { WorkProjectItem } from "@/data/site";
import { getDevicePerfTier } from "@/lib/deviceTier";
import { drawCoverImage } from "@/three/webglUtils";

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
      if (typeof img.decode === "function") {
        img.decode().catch(() => {}).finally(() => resolve(img));
      } else {
        resolve(img);
      }
    };
    img.onerror = () => {
      img.onload = null;
      img.onerror = null;
      resolve(null);
    };
    img.src = src;
  });
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

export interface ProjectTextureHandle {
  texture: CanvasTexture;
  startLoad: () => void;
  dispose: () => void;
}

/**
 * Creates a lightweight solid-color placeholder texture immediately and defers
 * full-resolution image decoding, canvas compositing, and GPU upload until `startLoad()`.
 */
export function createProjectTexture(
  renderer: WebGLRenderer,
  project: WorkProjectItem,
  onTextureUpdated?: (loadedTex: CanvasTexture) => void
): ProjectTextureHandle {
  const maxTex = renderer.capabilities.maxTextureSize || 4096;
  const perf = getDevicePerfTier();
  const width = Math.min(perf.workTexWidth, maxTex);
  const height = Math.round((width * WORK_PLANE_HEIGHT) / WORK_PLANE_WIDTH);

  const placeholderCanvas = document.createElement("canvas");
  placeholderCanvas.width = 2;
  placeholderCanvas.height = 2;
  const placeholderCtx = placeholderCanvas.getContext("2d");
  if (placeholderCtx) {
    placeholderCtx.fillStyle = project.stageBg;
    placeholderCtx.fillRect(0, 0, 2, 2);
  }

  const placeholderTex = new CanvasTexture(placeholderCanvas);
  placeholderTex.colorSpace = SRGBColorSpace;
  placeholderTex.needsUpdate = true;

  let loadedTex: CanvasTexture | null = null;
  let started = false;
  let disposed = false;

  const commitCompositeCanvas = (canvas: HTMLCanvasElement) => {
    if (disposed) return;
    const nextTex = new CanvasTexture(canvas);
    nextTex.colorSpace = SRGBColorSpace;
    nextTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    nextTex.generateMipmaps = true;
    nextTex.minFilter = LinearMipmapLinearFilter;
    nextTex.needsUpdate = true;
    renderer.initTexture(nextTex);
    loadedTex = nextTex;
    onTextureUpdated?.(nextTex);
    placeholderTex.dispose();
  };

  const createCompositeCtx = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    return { canvas, ctx };
  };

  const startLoad = () => {
    if (started || disposed) return;
    started = true;

    if (project.imageSrc && project.posterSrc) {
      void Promise.all([
        loadImage(project.imageSrc),
        loadImage(project.posterSrc),
      ]).then(([bgImg, posterImg]) => {
        if (disposed || !bgImg || !posterImg) return;
        const surface = createCompositeCtx();
        if (!surface) return;
        const { canvas, ctx } = surface;

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
        commitCompositeCanvas(canvas);
      });
      return;
    }

    if (project.mobileScreens && project.mobileScreens.length > 0) {
      const screenSrcs = project.mobileScreens;
      const bgPromise = project.imageSrc
        ? loadImage(project.imageSrc)
        : Promise.resolve(null);
      const screensPromise = Promise.all(screenSrcs.map((src) => loadImage(src)));

      void Promise.all([bgPromise, screensPromise]).then(
        ([bgImg, screenImgs]) => {
          if (disposed) return;
          const surface = createCompositeCtx();
          if (!surface) return;
          const { canvas, ctx } = surface;

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
            if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) {
              return;
            }
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

          commitCompositeCanvas(canvas);
        }
      );
      return;
    }

    if (project.imageSrc) {
      void loadImage(project.imageSrc).then((img) => {
        if (disposed || !img) return;
        const surface = createCompositeCtx();
        if (!surface) return;
        const { canvas, ctx } = surface;
        drawCoverImage(ctx, img, width, height);
        drawGlassRim(ctx, width, height);
        commitCompositeCanvas(canvas);
      });
    }
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    placeholderTex.dispose();
    loadedTex?.dispose();
    loadedTex = null;
  };

  return {
    texture: placeholderTex,
    startLoad,
    dispose,
  };
}
