import {
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  EquirectangularReflectionMapping,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  Shape,
  SRGBColorSpace,
  Vector2,
  type BufferGeometry,
} from "three";
import type { CertificateFrameFormat, CertificateItem } from "@/data/site";
import { getDevicePerfTier } from "@/lib/deviceTier";
import { clamp } from "@/lib/dom";
import {
  createManagedRenderer,
  createPmremEnv,
  createRadialShadowTexture,
  drawCoverImage,
} from "@/three/webglUtils";

export interface CertificateFrameController {
  setCertificate: (cert: CertificateItem, direction?: 1 | -1 | 0) => void;
  setDeck: (
    items: readonly CertificateItem[],
    activeIndex: number,
    direction?: 1 | -1 | 0
  ) => void;
  preloadImages: (srcs: readonly string[]) => void;
  setSwipeOffset: (pxOffset: number) => void;
  setPointerNormalized: (nx: number, ny: number) => void;
  resetPose: () => void;
  setDraggingDelta: (dxPx: number, dyPx: number) => void;
  endDrag: () => void;
  wake: () => void;
  dispose: () => void;
}

export interface CertificateFrameMountOptions {
  container: HTMLDivElement;
  certificate: CertificateItem;
  deckCertificates?: readonly CertificateItem[];
  activeDeckIndex?: number;
  allowWideOrbit?: boolean;
  onWebglFailed?: () => void;
}

const FOV_DEG = 32;
const RAIL_W = 0.2;
const FRAME_DEPTH = 0.16;
const BEVEL_SIZE = 0.018;
const BEVEL_THICKNESS = 0.022;
const FILLET_W = 0.015;
const SHUFFLE_DURATION_MS = 320;

interface FrameSpec {
  outerW: number;
  outerH: number;
  canvasW: number;
  canvasH: number;
  fitW: number;
  fitH: number;
  isPortrait: boolean;
}

const FRAME_SPECS: Record<CertificateFrameFormat, FrameSpec> = {
  landscape: {
    outerW: 3.59,
    outerH: 2.66,
    canvasW: 1200,
    canvasH: 846,
    fitW: 3.95,
    fitH: 2.98,
    isPortrait: false,
  },
  "landscape-4x3": {
    outerW: 3.4,
    outerH: 2.66,
    canvasW: 1200,
    canvasH: 900,
    fitW: 3.76,
    fitH: 2.98,
    isPortrait: false,
  },
  portrait: {
    outerW: 2.66,
    outerH: 3.59,
    canvasW: 846,
    canvasH: 1200,
    fitW: 3.04,
    fitH: 3.98,
    isPortrait: true,
  },
};

interface CardPose {
  x: number;
  y: number;
  z: number;
  rotY: number;
  rotZ: number;
  scale: number;
  brightness: number;
  opacity: number;
}

interface CardUnit {
  id: string;
  group: Group;
  artCanvas: HTMLCanvasElement;
  artTex: CanvasTexture;
  woodMat: MeshPhysicalMaterial;
  brassMat: MeshPhysicalMaterial;
  artMat: MeshStandardMaterial;
  glassMat: MeshPhysicalMaterial;
  glareMat: ShaderMaterial;
  backEdgeMat: MeshStandardMaterial | null;
  backFrontMat: MeshStandardMaterial | null;
  opaqueMeshes: Mesh[];
  glassMesh: Mesh;
  glareMesh: Mesh;
  baseGlassOpacity: number;
  baseGlareIntensity: number;
  loadSeq: number;
  currentBrightness: number;
  currentOpacity: number;
  fromSlot: number;
  toSlot: number;
  startPose: CardPose;
}

const GLASS_GLARE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const GLASS_GLARE_FRAGMENT = /* glsl */ `
  uniform vec2 uTilt;
  uniform float uIntensity;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 N = normalize(vWorldNormal);
    float ndotv = clamp(abs(dot(N, viewDir)), 0.0, 1.0);
    float schlick = 0.04 + 0.96 * pow(1.0 - ndotv, 4.2);

    vec3 R = reflect(-viewDir, N);
    R.xy += vec2(-uTilt.y * 0.22, uTilt.x * 0.18);

    // Primary soft gallery softbox reflection
    vec2 s = R.xy - vec2(-0.24, 0.15);
    float softbox = smoothstep(0.52, 0.12, abs(s.x + s.y * 0.28)) *
                    smoothstep(0.36, 0.06, abs(s.y - s.x * 0.18));
    softbox *= mix(0.45, 1.0, smoothstep(-0.1, 0.95, vUv.y));

    // Subtle secondary right-side studio window bounce
    vec2 f = R.xy - vec2(0.36, 0.20);
    float fillWindow = smoothstep(0.48, 0.10, abs(f.x - f.y * 0.22)) *
                       smoothstep(0.34, 0.08, abs(f.y + f.x * 0.14));

    float skyGrad = smoothstep(-0.35, 0.45, R.y);

    // Hairline physical glass edge catch inside the brass/wood rabbet
    float topEdge = 1.0 - smoothstep(0.0, 0.006, 1.0 - vUv.y);
    float leftEdge = 1.0 - smoothstep(0.0, 0.005, vUv.x);
    float botEdge = 1.0 - smoothstep(0.0, 0.005, vUv.y);
    float rightEdge = 1.0 - smoothstep(0.0, 0.004, 1.0 - vUv.x);
    float edgeGlint = clamp(
      topEdge * 0.9 + leftEdge * 0.75 + botEdge * 0.25 + rightEdge * 0.25,
      0.0,
      1.0
    );

    float baseAlpha = clamp(0.028 + schlick * 0.14, 0.0, 0.11);
    vec3 baseColor = vec3(0.11, 0.14, 0.18);

    float specAlpha = clamp(
      (softbox * (0.095 + schlick * 0.85) +
       fillWindow * (0.055 + schlick * 0.65) +
       skyGrad * (0.018 + schlick * 0.22) +
       edgeGlint * (0.11 + schlick * 0.25)) * uIntensity,
      0.0,
      0.28
    );

    vec3 specColor = mix(
      vec3(0.95, 0.97, 1.0),
      vec3(1.0, 0.985, 0.96),
      clamp(softbox * 0.6, 0.0, 0.6)
    );
    float specDominance = smoothstep(0.008, 0.065, specAlpha);
    vec3 finalColor = mix(baseColor, specColor, specDominance);
    float finalAlpha = max(baseAlpha, specAlpha);

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

let cachedWoodColorCanvas: HTMLCanvasElement | null = null;
let cachedWoodBumpCanvas: HTMLCanvasElement | null = null;
let cachedEnvCanvas: HTMLCanvasElement | null = null;
let cachedBackboardLandscape: HTMLCanvasElement | null = null;
let cachedBackboardPortrait: HTMLCanvasElement | null = null;

function pseudoNoise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function getWoodCanvases(): {
  colorCanvas: HTMLCanvasElement;
  bumpCanvas: HTMLCanvasElement;
} {
  if (cachedWoodColorCanvas && cachedWoodBumpCanvas) {
    return {
      colorCanvas: cachedWoodColorCanvas,
      bumpCanvas: cachedWoodBumpCanvas,
    };
  }

  const size = 256;
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext("2d");

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext("2d");

  if (cCtx && bCtx) {
    const cImg = cCtx.createImageData(size, size);
    const bImg = bCtx.createImageData(size, size);
    const cData = cImg.data;
    const bData = bImg.data;
    const twoPi = Math.PI * 2;

    for (let y = 0; y < size; y += 1) {
      const ny = y / size;
      for (let x = 0; x < size; x += 1) {
        const nx = x / size;
        const warp =
          Math.sin(twoPi * nx * 1.0 + twoPi * ny * 2.0) * 0.045 +
          Math.sin(twoPi * nx * 2.0 - twoPi * ny * 3.0) * 0.022;
        const ring = 0.5 + 0.5 * Math.sin(twoPi * (ny + warp) * 14.0);
        const fineFiber =
          0.5 +
          0.5 *
            Math.sin(twoPi * (ny * 58.0 + Math.sin(twoPi * nx * 3.0) * 0.85));
        const pore = pseudoNoise(x * 0.45, y * 1.6);
        const tone = ring * 0.56 + fineFiber * 0.3 + pore * 0.14;

        const idx = (y * size + x) * 4;
        cData[idx] = Math.round(35 + tone * 64);
        cData[idx + 1] = Math.round(19 + tone * 44);
        cData[idx + 2] = Math.round(10 + tone * 30);
        cData[idx + 3] = 255;

        const bumpVal = clamp(
          Math.round(92 + (ring * 0.45 + fineFiber * 0.4 - pore * 0.18) * 140),
          0,
          255
        );
        bData[idx] = bumpVal;
        bData[idx + 1] = bumpVal;
        bData[idx + 2] = bumpVal;
        bData[idx + 3] = 255;
      }
    }

    cCtx.putImageData(cImg, 0, 0);
    bCtx.putImageData(bImg, 0, 0);
  }

  cachedWoodColorCanvas = colorCanvas;
  cachedWoodBumpCanvas = bumpCanvas;
  return { colorCanvas, bumpCanvas };
}

function getGalleryEnvCanvas(): HTMLCanvasElement {
  if (cachedEnvCanvas) return cachedEnvCanvas;

  const width = 512;
  const height = 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#0a0a0b";
    ctx.fillRect(0, 0, width, height);

    const keyGrad = ctx.createRadialGradient(
      width * 0.3,
      height * 0.24,
      6,
      width * 0.3,
      height * 0.24,
      width * 0.24
    );
    keyGrad.addColorStop(0, "rgba(255, 250, 242, 0.95)");
    keyGrad.addColorStop(0.42, "rgba(255, 244, 230, 0.38)");
    keyGrad.addColorStop(1, "rgba(255, 244, 230, 0)");
    ctx.fillStyle = keyGrad;
    ctx.fillRect(0, 0, width, height);

    const rimGrad = ctx.createRadialGradient(
      width * 0.74,
      height * 0.26,
      8,
      width * 0.74,
      height * 0.26,
      width * 0.2
    );
    rimGrad.addColorStop(0, "rgba(222, 236, 255, 0.7)");
    rimGrad.addColorStop(0.5, "rgba(210, 226, 248, 0.22)");
    rimGrad.addColorStop(1, "rgba(210, 226, 248, 0)");
    ctx.fillStyle = rimGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width * 0.5, height * 0.36);
    ctx.rotate(-0.42);
    const stripGrad = ctx.createLinearGradient(0, -14, 0, 14);
    stripGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
    stripGrad.addColorStop(0.5, "rgba(248, 252, 255, 0.68)");
    stripGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = stripGrad;
    ctx.fillRect(-width * 0.45, -14, width * 0.9, 28);
    ctx.restore();

    const floorGrad = ctx.createLinearGradient(0, height * 0.72, 0, height);
    floorGrad.addColorStop(0, "rgba(243, 66, 19, 0)");
    floorGrad.addColorStop(1, "rgba(243, 66, 19, 0.14)");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, height * 0.72, width, height * 0.28);
  }

  cachedEnvCanvas = canvas;
  return canvas;
}

function getBackboardCanvas(isPortrait: boolean): HTMLCanvasElement {
  if (isPortrait && cachedBackboardPortrait) return cachedBackboardPortrait;
  if (!isPortrait && cachedBackboardLandscape) return cachedBackboardLandscape;

  const width = isPortrait ? 384 : 512;
  const height = isPortrait ? 512 : 384;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#161412";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(231, 225, 215, 0.08)";
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(231, 225, 215, 0.48)";
    ctx.font =
      '500 13px Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';
    ctx.fillText("ABDULLAH ELAWADY", width * 0.5, height * 0.48);

    ctx.fillStyle = "rgba(243, 66, 19, 0.72)";
    ctx.font =
      '500 10px Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';
    ctx.fillText("ARCHIVAL CREDENTIAL EDITION", width * 0.5, height * 0.55);
  }

  if (isPortrait) cachedBackboardPortrait = canvas;
  else cachedBackboardLandscape = canvas;
  return canvas;
}

function drawRecessedFrameShadow(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const bands: Array<[number, number, number, number, string]> = [
    [0, 0, width, 46, "rgba(12, 8, 4, 0.3)"],
    [0, height - 26, width, height, "rgba(12, 8, 4, 0.15)"],
    [0, 0, 38, height, "rgba(12, 8, 4, 0.24)"],
    [width - 28, 0, width, height, "rgba(12, 8, 4, 0.16)"],
  ];
  bands.forEach(([x0, y0, x1, y1, color], idx) => {
    const horizontal = idx >= 2;
    const grad = horizontal
      ? ctx.createLinearGradient(x0, 0, x1, 0)
      : ctx.createLinearGradient(0, y0, 0, y1);
    const reverse = idx === 1 || idx === 3;
    grad.addColorStop(reverse ? 1 : 0, color);
    grad.addColorStop(reverse ? 0 : 1, "rgba(12, 8, 4, 0)");
    ctx.fillStyle = grad;
    const rx = x0;
    const ry = y0;
    const rw = horizontal ? x1 - x0 : width;
    const rh = horizontal ? height : y1 - y0;
    ctx.fillRect(rx, ry, rw, rh);
  });
}

const loadedCertImages = new Map<string, HTMLImageElement>();
const inFlightCertCallbacks = new Map<
  string,
  Set<(img: HTMLImageElement | null) => void>
>();

function loadCachedImage(
  src: string,
  onDone?: (img: HTMLImageElement | null) => void
): void {
  const cached = loadedCertImages.get(src);
  if (cached) {
    onDone?.(cached);
    return;
  }

  let listeners = inFlightCertCallbacks.get(src);
  if (listeners) {
    if (onDone) listeners.add(onDone);
    return;
  }

  listeners = new Set();
  if (onDone) listeners.add(onDone);
  inFlightCertCallbacks.set(src, listeners);

  const img = new window.Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  img.onload = () => {
    img.onload = null;
    img.onerror = null;
    loadedCertImages.set(src, img);
    const cbs = inFlightCertCallbacks.get(src);
    inFlightCertCallbacks.delete(src);
    cbs?.forEach((cb) => cb(img));
  };
  img.onerror = () => {
    img.onload = null;
    img.onerror = null;
    const cbs = inFlightCertCallbacks.get(src);
    inFlightCertCallbacks.delete(src);
    cbs?.forEach((cb) => cb(null));
  };
  img.src = src;
}

function drawFallbackCertificatePlate(
  canvas: HTMLCanvasElement,
  cert: CertificateItem
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const scale = width / 1600;
  const inset = Math.round(56 * scale);
  ctx.fillStyle = "#f5efe3";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#b5904c";
  ctx.lineWidth = Math.max(2, Math.round(3 * scale));
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#5c5246";
  ctx.font = `600 ${Math.round(22 * scale)}px Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText(cert.issuer.toUpperCase(), width * 0.5, height * 0.28);

  ctx.fillStyle = "#171412";
  ctx.font = `700 ${Math.round(52 * scale)}px Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText("ABDULLAH ELAWADY", width * 0.5, height * 0.44);

  ctx.font = `600 ${Math.round(42 * scale)}px Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText(cert.title, width * 0.5, height * 0.58);

  ctx.fillStyle = "#7a6f63";
  ctx.font = `500 ${Math.round(20 * scale)}px Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText(
    `${cert.issuedDate.toUpperCase()} · ${cert.details.toUpperCase()}`,
    width * 0.5,
    height * 0.72
  );

  drawRecessedFrameShadow(ctx, width, height);
}

function drawScannedCertificateImage(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement
): void {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#181614";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  drawCoverImage(ctx, img, width, height);
  drawRecessedFrameShadow(ctx, width, height);
}

function createMiterRailGeometry(
  side: "top" | "bottom" | "left" | "right",
  hw: number,
  hh: number
): ExtrudeGeometry {
  const ihw = hw - RAIL_W;
  const ihh = hh - RAIL_W;
  const b = BEVEL_SIZE;
  const eps = 0.0008;
  const diag = (b + eps) * Math.SQRT2;
  const miterDelta = hw - hh;

  const shape = new Shape();

  if (side === "top") {
    const y0 = ihh + b;
    const y1 = hh - b;
    shape.moveTo(-miterDelta + diag - y1, y1);
    shape.lineTo(-miterDelta + diag - y0, y0);
    shape.lineTo(miterDelta - diag + y0, y0);
    shape.lineTo(miterDelta - diag + y1, y1);
    shape.closePath();
  } else if (side === "bottom") {
    const y0 = -ihh - b;
    const y1 = -hh + b;
    shape.moveTo(-miterDelta + diag + y0, y0);
    shape.lineTo(-miterDelta + diag + y1, y1);
    shape.lineTo(miterDelta - diag - y1, y1);
    shape.lineTo(miterDelta - diag - y0, y0);
    shape.closePath();
  } else if (side === "left") {
    const x0 = -hw + b;
    const x1 = -ihw - b;
    shape.moveTo(x0, -miterDelta - diag - x0);
    shape.lineTo(x0, miterDelta + diag + x0);
    shape.lineTo(x1, miterDelta + diag + x1);
    shape.lineTo(x1, -miterDelta - diag - x1);
    shape.closePath();
  } else {
    const x0 = ihw + b;
    const x1 = hw - b;
    shape.moveTo(x0, x0 - miterDelta - diag);
    shape.lineTo(x0, -(x0 - miterDelta - diag));
    shape.lineTo(x1, -(x1 - miterDelta - diag));
    shape.lineTo(x1, x1 - miterDelta - diag);
    shape.closePath();
  }

  const geo = new ExtrudeGeometry(shape, {
    depth: FRAME_DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL_THICKNESS,
    bevelSize: BEVEL_SIZE,
    bevelSegments: 3,
    curveSegments: 1,
  });

  geo.translate(0, 0, -FRAME_DEPTH * 0.5);

  const uv = geo.attributes.uv;
  if (uv) {
    const uvScale = 0.42;
    for (let i = 0; i < uv.count; i += 1) {
      const u = uv.getX(i) * uvScale;
      const v = uv.getY(i) * uvScale;
      if (side === "left" || side === "right") uv.setXY(i, v, u);
      else uv.setXY(i, u, v);
    }
    uv.needsUpdate = true;
  }

  return geo;
}

function createCertCanvasTexture(
  canvas: HTMLCanvasElement,
  maxAniso: number
): CanvasTexture {
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAniso);
  tex.generateMipmaps = true;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function createBackboardTexture(isPortrait: boolean): CanvasTexture {
  const tex = new CanvasTexture(getBackboardCanvas(isPortrait));
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function getSlotPose(slot: number, total: number): CardPose {
  if (total <= 1 || slot <= 0) {
    return {
      x: 0,
      y: 0,
      z: 0,
      rotY: 0,
      rotZ: 0,
      scale: 1,
      brightness: 1,
      opacity: 1,
    };
  }
  if (slot === 1) {
    return {
      x: 0.3,
      y: 0.1,
      z: -0.42,
      rotY: -0.04,
      rotZ: -0.028,
      scale: 0.955,
      brightness: 0.74,
      opacity: 1,
    };
  }
  if (slot === 2) {
    return {
      x: 0.56,
      y: 0.19,
      z: -0.84,
      rotY: -0.075,
      rotZ: -0.052,
      scale: 0.91,
      brightness: 0.54,
      opacity: 1,
    };
  }
  return {
    x: 0.66,
    y: 0.24,
    z: -1.16,
    rotY: -0.09,
    rotZ: -0.06,
    scale: 0.87,
    brightness: 0.38,
    opacity: 0,
  };
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPose(a: CardPose, b: CardPose, t: number): CardPose {
  return {
    x: lerpNum(a.x, b.x, t),
    y: lerpNum(a.y, b.y, t),
    z: lerpNum(a.z, b.z, t),
    rotY: lerpNum(a.rotY, b.rotY, t),
    rotZ: lerpNum(a.rotZ, b.rotZ, t),
    scale: lerpNum(a.scale, b.scale, t),
    brightness: lerpNum(a.brightness, b.brightness, t),
    opacity: lerpNum(a.opacity, b.opacity, t),
  };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

const SWEEP_PEAK_POSE: CardPose = {
  x: -1.08,
  y: 0.05,
  z: 0.24,
  rotY: 0.24,
  rotZ: 0.04,
  scale: 0.93,
  brightness: 0.85,
  opacity: 0,
};

function readCardLivePose(card: CardUnit): CardPose {
  return {
    x: card.group.position.x,
    y: card.group.position.y,
    z: card.group.position.z,
    rotY: card.group.rotation.y,
    rotZ: card.group.rotation.z,
    scale: card.group.scale.x,
    brightness: card.currentBrightness,
    opacity: card.currentOpacity,
  };
}

function applyCardOpacityAndBrightness(
  card: CardUnit,
  opacity: number,
  brightness: number
): void {
  const op = clamp(opacity, 0, 1);
  const br = clamp(brightness, 0, 1);
  card.currentOpacity = op;
  card.currentBrightness = br;

  if (op <= 0.004) {
    card.group.visible = false;
    return;
  }
  card.group.visible = true;

  const isTranslucent = op < 0.995;
  const opaqueMats = [
    card.woodMat,
    card.brassMat,
    card.artMat,
    ...(card.backEdgeMat ? [card.backEdgeMat] : []),
    ...(card.backFrontMat ? [card.backFrontMat] : []),
  ];
  opaqueMats.forEach((mat) => {
    if (mat.transparent !== isTranslucent) {
      mat.transparent = isTranslucent;
      mat.depthWrite = !isTranslucent;
    }
    mat.opacity = op;
  });

  card.artMat.color.setScalar(br);
  card.woodMat.color.setScalar(0.7 + 0.3 * br);
  card.brassMat.color.setRGB(
    (0xc9 / 255) * (0.65 + 0.35 * br),
    (0xa6 / 255) * (0.65 + 0.35 * br),
    (0x6b / 255) * (0.65 + 0.35 * br)
  );

  card.glassMat.opacity = card.baseGlassOpacity * op;
  card.glareMat.uniforms.uIntensity.value = card.baseGlareIntensity * op;
}

function applyCardPose(card: CardUnit, pose: CardPose): void {
  card.group.position.set(pose.x, pose.y, pose.z);
  card.group.rotation.set(0, pose.rotY, pose.rotZ);
  card.group.scale.setScalar(pose.scale);
  applyCardOpacityAndBrightness(card, pose.opacity, pose.brightness);
}

export function mountCertificateFrameScene({
  container,
  certificate,
  deckCertificates,
  activeDeckIndex = 0,
  allowWideOrbit = false,
  onWebglFailed,
}: CertificateFrameMountOptions): CertificateFrameController {
  const perf = getDevicePerfTier();
  const activeRenderer = createManagedRenderer(container, {
    maxDpr: perf.maxDpr,
    toneMappingExposure: 1.08,
  });
  if (!activeRenderer) {
    if (onWebglFailed) queueMicrotask(onWebglFailed);
    return {
      setCertificate: () => {},
      setDeck: () => {},
      preloadImages: () => {},
      setSwipeOffset: () => {},
      setPointerNormalized: () => {},
      resetPose: () => {},
      setDraggingDelta: () => {},
      endDrag: () => {},
      wake: () => {},
      dispose: () => {},
    };
  }

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV_DEG, 1, 0.1, 30);

  const rawEnvTex = new CanvasTexture(getGalleryEnvCanvas());
  rawEnvTex.mapping = EquirectangularReflectionMapping;
  rawEnvTex.colorSpace = SRGBColorSpace;
  rawEnvTex.needsUpdate = true;
  const env = createPmremEnv(activeRenderer, rawEnvTex);
  scene.environment = env.texture;

  const hemiLight = new HemisphereLight(0xfffdf9, 0x1a1512, 0.9);
  const keyLight = new DirectionalLight(0xfff8ee, 2.25);
  keyLight.position.set(-3.8, 4.8, 6.2);
  const fillLight = new DirectionalLight(0xd8e4f5, 0.85);
  fillLight.position.set(4.5, -1.2, 4.8);
  const vermilionRim = new DirectionalLight(0xf36b3c, 0.55);
  vermilionRim.position.set(-2.5, -3.5, 2.0);
  scene.add(hemiLight, keyLight, fillLight, vermilionRim);

  const maxAniso = activeRenderer.capabilities.getMaxAnisotropy();

  const { colorCanvas: woodColorCanvas, bumpCanvas: woodBumpCanvas } =
    getWoodCanvases();
  const woodColorTex = new CanvasTexture(woodColorCanvas);
  woodColorTex.colorSpace = SRGBColorSpace;
  woodColorTex.wrapS = RepeatWrapping;
  woodColorTex.wrapT = RepeatWrapping;
  woodColorTex.anisotropy = Math.min(8, maxAniso);
  woodColorTex.needsUpdate = true;

  const woodBumpTex = new CanvasTexture(woodBumpCanvas);
  woodBumpTex.wrapS = RepeatWrapping;
  woodBumpTex.wrapT = RepeatWrapping;
  woodBumpTex.anisotropy = Math.min(8, maxAniso);
  woodBumpTex.needsUpdate = true;

  const initialItems =
    deckCertificates && deckCertificates.length > 0
      ? deckCertificates
      : [certificate];
  const initialActiveIdx = clamp(
    activeDeckIndex,
    0,
    Math.max(0, initialItems.length - 1)
  );
  const initialActiveCert = initialItems[initialActiveIdx] ?? certificate;

  let currentFormat: CertificateFrameFormat =
    initialActiveCert.frameFormat ?? "landscape";
  let activeSpec = FRAME_SPECS[currentFormat];
  let backboardTex = createBackboardTexture(activeSpec.isPortrait);

  const shadowTex = createRadialShadowTexture(0.62, 0.24);
  const shadowMat = new MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });

  const deckRoot = new Group();
  scene.add(deckRoot);

  let shadowGeo: BufferGeometry = new PlaneGeometry(1, 1);
  const shadowMesh = new Mesh(shadowGeo, shadowMat);
  shadowMesh.position.set(0.06, -0.08, -0.45);
  scene.add(shadowMesh);

  let sharedRailGeos: ExtrudeGeometry[] = [];
  let sharedTopBotFilletGeo: BoxGeometry | null = null;
  let sharedSideFilletGeo: BoxGeometry | null = null;
  let sharedArtGeo: PlaneGeometry | null = null;
  let sharedGlassGeo: PlaneGeometry | null = null;
  let sharedGlareGeo: PlaneGeometry | null = null;
  let sharedBackBoxGeo: BoxGeometry | null = null;
  let sharedBackStampGeo: PlaneGeometry | null = null;

  const disposeSharedCardGeos = () => {
    sharedRailGeos.forEach((g) => g.dispose());
    sharedRailGeos = [];
    sharedTopBotFilletGeo?.dispose();
    sharedTopBotFilletGeo = null;
    sharedSideFilletGeo?.dispose();
    sharedSideFilletGeo = null;
    sharedArtGeo?.dispose();
    sharedArtGeo = null;
    sharedGlassGeo?.dispose();
    sharedGlassGeo = null;
    sharedGlareGeo?.dispose();
    sharedGlareGeo = null;
    sharedBackBoxGeo?.dispose();
    sharedBackBoxGeo = null;
    sharedBackStampGeo?.dispose();
    sharedBackStampGeo = null;
  };

  const buildSharedCardGeos = (spec: FrameSpec, isDeck: boolean) => {
    disposeSharedCardGeos();

    const hw = spec.outerW * 0.5;
    const hh = spec.outerH * 0.5;
    const ihw = hw - RAIL_W;
    const ihh = hh - RAIL_W;
    const artW = (ihw - FILLET_W) * 2;
    const artH = (ihh - FILLET_W) * 2;

    sharedRailGeos = (["top", "bottom", "left", "right"] as const).map((side) =>
      createMiterRailGeometry(side, hw, hh)
    );

    const filletDepth = 0.088;
    sharedTopBotFilletGeo = new BoxGeometry(ihw * 2, FILLET_W, filletDepth);
    sharedSideFilletGeo = new BoxGeometry(
      FILLET_W,
      (ihh - FILLET_W) * 2,
      filletDepth
    );
    sharedArtGeo = new PlaneGeometry(artW + 0.024, artH + 0.024);
    sharedGlassGeo = new PlaneGeometry(ihw * 2 - 0.004, ihh * 2 - 0.004);
    sharedGlareGeo = new PlaneGeometry(ihw * 2 - 0.006, ihh * 2 - 0.006);
    sharedBackBoxGeo = new BoxGeometry(
      spec.outerW - 0.08,
      spec.outerH - 0.08,
      0.028
    );
    sharedBackStampGeo = new PlaneGeometry(
      spec.outerW - 0.1,
      spec.outerH - 0.1
    );

    shadowGeo.dispose();
    shadowGeo = new PlaneGeometry(
      spec.outerW + (isDeck ? 1.85 : 1.0),
      spec.outerH + (isDeck ? 1.35 : 0.94)
    );
    shadowMesh.geometry = shadowGeo;
  };

  let cards: CardUnit[] = [];
  let deckSignature = "";
  let currentActiveIdx = initialActiveIdx;

  let disposed = false;
  let rafId = 0;
  let isInView = true;
  let needsForcedRender = true;

  let curRotX = 0.1;
  let curRotY = 0.24;
  let targetRotX = 0.045;
  let targetRotY = -0.085;
  let dragRotX = 0;
  let dragRotY = 0;
  let isDragging = false;
  let curSwipeNorm = 0;
  let targetSwipeNorm = 0;

  let curDeckX = initialItems.length > 1 ? -0.18 : 0;
  let curDeckY = initialItems.length > 1 ? -0.05 : 0;
  let targetDeckX = curDeckX;
  let targetDeckY = curDeckY;
  let curCamZ = 5.15;
  let targetCamZ = 5.15;

  let isShuffling = false;
  let shuffleStartTime = 0;
  let shuffleDir: 1 | -1 = 1;

  const scheduleLoop = () => {
    if (disposed || !isInView || document.hidden || rafId !== 0) return;
    rafId = window.requestAnimationFrame(tick);
  };

  const wake = () => {
    if (disposed) return;
    needsForcedRender = true;
    if (isInView && !document.hidden) scheduleLoop();
    else activeRenderer.render(scene, camera);
  };

  const loadCardArtwork = (card: CardUnit, cert: CertificateItem) => {
    card.loadSeq += 1;
    const seq = card.loadSeq;

    if (!cert.imageSrc) {
      drawFallbackCertificatePlate(card.artCanvas, cert);
      card.artTex.needsUpdate = true;
      wake();
      return;
    }

    loadCachedImage(cert.imageSrc, (img) => {
      if (disposed || seq !== card.loadSeq) return;
      if (img) drawScannedCertificateImage(card.artCanvas, img);
      else drawFallbackCertificatePlate(card.artCanvas, cert);
      card.artTex.needsUpdate = true;
      wake();
    });
  };

  const disposeCards = () => {
    cards.forEach((card) => {
      card.loadSeq += 1;
      card.woodMat.dispose();
      card.brassMat.dispose();
      card.artMat.dispose();
      card.glassMat.dispose();
      card.glareMat.dispose();
      card.backEdgeMat?.dispose();
      card.backFrontMat?.dispose();
      card.artTex.dispose();
    });
    cards = [];
    deckRoot.clear();
  };

  const createCardUnit = (
    cert: CertificateItem,
    spec: FrameSpec,
    isDeck: boolean
  ): CardUnit => {
    const hw = spec.outerW * 0.5;
    const hh = spec.outerH * 0.5;
    const ihw = hw - RAIL_W;
    const ihh = hh - RAIL_W;

    const woodMat = new MeshPhysicalMaterial({
      map: woodColorTex,
      bumpMap: woodBumpTex,
      bumpScale: 0.018,
      roughness: 0.42,
      metalness: 0.04,
      clearcoat: 0.38,
      clearcoatRoughness: 0.28,
      envMapIntensity: 1.05,
    });

    const brassMat = new MeshPhysicalMaterial({
      color: new Color(0xc9a66b),
      metalness: 0.85,
      roughness: 0.26,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.35,
    });

    const artCanvas = document.createElement("canvas");
    artCanvas.width = spec.canvasW;
    artCanvas.height = spec.canvasH;
    if (cert.imageSrc) {
      const cCtx = artCanvas.getContext("2d");
      if (cCtx) {
        cCtx.fillStyle = "#181614";
        cCtx.fillRect(0, 0, artCanvas.width, artCanvas.height);
      }
    } else {
      drawFallbackCertificatePlate(artCanvas, cert);
    }

    const artTex = createCertCanvasTexture(artCanvas, maxAniso);
    const artMat = new MeshStandardMaterial({
      map: artTex,
      roughness: 0.72,
      metalness: 0.02,
      envMapIntensity: 0.35,
    });

    const baseGlassOpacity = 0.055;
    const glassMat = new MeshPhysicalMaterial({
      color: new Color(0xe4eff7),
      transparent: true,
      opacity: baseGlassOpacity,
      roughness: 0.025,
      metalness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      ior: 1.52,
      reflectivity: 1.0,
      envMapIntensity: 1.8,
      depthWrite: false,
    });

    const baseGlareIntensity = 1.0;
    const glareMat = new ShaderMaterial({
      uniforms: {
        uTilt: { value: new Vector2(0, 0) },
        uIntensity: { value: baseGlareIntensity },
      },
      vertexShader: GLASS_GLARE_VERTEX,
      fragmentShader: GLASS_GLARE_FRAGMENT,
      transparent: true,
      depthWrite: false,
    });

    const backEdgeMat = !isDeck
      ? new MeshStandardMaterial({
          color: new Color(0x161412),
          roughness: 0.85,
          metalness: 0.05,
        })
      : null;

    const backFrontMat = !isDeck
      ? new MeshStandardMaterial({
          map: backboardTex,
          roughness: 0.82,
          metalness: 0.04,
        })
      : null;

    const group = new Group();
    const opaqueMeshes: Mesh[] = [];

    sharedRailGeos.forEach((geo) => {
      const m = new Mesh(geo, woodMat);
      opaqueMeshes.push(m);
      group.add(m);
    });

    const filletZ = -0.008;
    if (sharedTopBotFilletGeo && sharedSideFilletGeo) {
      [
        [sharedTopBotFilletGeo, 0, ihh - FILLET_W * 0.5],
        [sharedTopBotFilletGeo, 0, -(ihh - FILLET_W * 0.5)],
        [sharedSideFilletGeo, -(ihw - FILLET_W * 0.5), 0],
        [sharedSideFilletGeo, ihw - FILLET_W * 0.5, 0],
      ].forEach(([geo, x, y]) => {
        const m = new Mesh(geo as BoxGeometry, brassMat);
        m.position.set(x as number, y as number, filletZ);
        opaqueMeshes.push(m);
        group.add(m);
      });
    }

    if (sharedArtGeo) {
      const artMesh = new Mesh(sharedArtGeo, artMat);
      artMesh.position.z = -0.052;
      opaqueMeshes.push(artMesh);
      group.add(artMesh);
    }

    const glassMesh = new Mesh(sharedGlassGeo!, glassMat);
    glassMesh.position.z = 0.044;
    group.add(glassMesh);

    const glareMesh = new Mesh(sharedGlareGeo!, glareMat);
    glareMesh.position.z = 0.048;
    group.add(glareMesh);

    if (!isDeck && backEdgeMat && backFrontMat && sharedBackBoxGeo && sharedBackStampGeo) {
      const backBoxMesh = new Mesh(sharedBackBoxGeo, backEdgeMat);
      backBoxMesh.position.z = -0.092;
      const backStampMesh = new Mesh(sharedBackStampGeo, backFrontMat);
      backStampMesh.position.z = -0.108;
      backStampMesh.rotation.y = Math.PI;
      opaqueMeshes.push(backBoxMesh, backStampMesh);
      group.add(backBoxMesh, backStampMesh);
    }

    const restPose = getSlotPose(0, 1);
    const card: CardUnit = {
      id: cert.id,
      group,
      artCanvas,
      artTex,
      woodMat,
      brassMat,
      artMat,
      glassMat,
      glareMat,
      backEdgeMat,
      backFrontMat,
      opaqueMeshes,
      glassMesh,
      glareMesh,
      baseGlassOpacity,
      baseGlareIntensity,
      loadSeq: 0,
      currentBrightness: 1,
      currentOpacity: 1,
      fromSlot: 0,
      toSlot: 0,
      startPose: restPose,
    };

    if (cert.imageSrc) loadCardArtwork(card, cert);
    return card;
  };

  const computeIdealCameraZ = (isDeck: boolean): number => {
    const w = Math.max(container.clientWidth, 160);
    const h = Math.max(container.clientHeight, 160);
    const aspect = w / h;
    const halfTan = Math.tan((FOV_DEG * Math.PI) / 360);
    const fitW = activeSpec.fitW + (isDeck ? 1.05 : 0);
    const fitH = activeSpec.fitH + (isDeck ? 0.45 : 0);
    const camZHeight = (fitH * 0.5) / halfTan;
    const camZWidth = (fitW * 0.5) / (halfTan * aspect);
    return Math.max(5.15, camZHeight, camZWidth);
  };

  const buildDeck = (
    items: readonly CertificateItem[],
    activeIdx: number,
    snapCamera: boolean
  ) => {
    const safeIdx = clamp(activeIdx, 0, Math.max(0, items.length - 1));
    const activeCert = items[safeIdx] ?? items[0];
    const nextFormat: CertificateFrameFormat =
      activeCert.frameFormat ?? "landscape";
    const nextSpec = FRAME_SPECS[nextFormat];
    const isDeck = items.length > 1;

    if (nextSpec.isPortrait !== activeSpec.isPortrait) {
      backboardTex.dispose();
      backboardTex = createBackboardTexture(nextSpec.isPortrait);
    }

    currentFormat = nextFormat;
    activeSpec = nextSpec;
    buildSharedCardGeos(activeSpec, isDeck);

    disposeCards();
    isShuffling = false;
    curSwipeNorm = 0;
    targetSwipeNorm = 0;
    currentActiveIdx = safeIdx;
    deckSignature = items.map((c) => c.id).join("|");

    cards = items.map((cert, i) => {
      const card = createCardUnit(cert, activeSpec, isDeck);
      const slot = (i - safeIdx + items.length) % items.length;
      const pose = getSlotPose(slot, items.length);
      card.fromSlot = slot;
      card.toSlot = slot;
      card.startPose = pose;
      applyCardPose(card, pose);
      deckRoot.add(card.group);
      return card;
    });

    targetDeckX = isDeck ? -0.18 : 0;
    targetDeckY = isDeck ? -0.05 : 0;
    targetCamZ = computeIdealCameraZ(isDeck);

    if (snapCamera) {
      curDeckX = targetDeckX;
      curDeckY = targetDeckY;
      curCamZ = targetCamZ;
      deckRoot.position.set(curDeckX, curDeckY, 0);
      camera.position.set(0, 0, curCamZ);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }

    wake();
  };

  buildDeck(initialItems, initialActiveIdx, true);
  deckRoot.rotation.set(curRotX, curRotY, 0);

  const computeShufflePose = (card: CardUnit, t: number): CardPose => {
    const total = cards.length;
    const toPose = getSlotPose(card.toSlot, total);

    if (shuffleDir > 0) {
      // Forward (Next): front card sweeps out left and tucks into rear slot
      if (card.fromSlot === 0) {
        if (t < 0.46) {
          const u = t / 0.46;
          const e = easeOutCubic(u);
          const pose = lerpPose(card.startPose, SWEEP_PEAK_POSE, e);
          const fadeT = clamp((u - 0.28) / 0.72, 0, 1);
          pose.opacity = card.startPose.opacity * (1 - fadeT * fadeT);
          return pose;
        }
        if (t < 0.52) {
          return { ...toPose, z: toPose.z - 0.32, opacity: 0 };
        }
        const u = clamp((t - 0.52) / 0.48, 0, 1);
        const e = easeOutQuart(u);
        const backStart: CardPose = {
          ...toPose,
          z: toPose.z - 0.32,
          scale: toPose.scale * 0.96,
          opacity: 0,
        };
        const pose = lerpPose(backStart, toPose, e);
        pose.opacity = toPose.opacity > 0 ? easeOutCubic(u) * toPose.opacity : 0;
        return pose;
      }

      // Multi-slot jump where a card beyond slot 1 moves directly to front
      if (card.toSlot === 0 && card.fromSlot > 1) {
        if (t < 0.22) {
          const u = t / 0.22;
          return {
            ...card.startPose,
            z: card.startPose.z - 0.22 * u,
            opacity: card.startPose.opacity * (1 - u),
          };
        }
        if (t < 0.44) {
          return { ...SWEEP_PEAK_POSE, opacity: 0 };
        }
        const u = clamp((t - 0.44) / 0.56, 0, 1);
        const e = easeOutQuart(u);
        const pose = lerpPose(SWEEP_PEAK_POSE, toPose, e);
        pose.opacity = clamp(u / 0.42, 0, 1);
        return pose;
      }

      const u = clamp((t - 0.05) / 0.95, 0, 1);
      return lerpPose(card.startPose, toPose, easeOutQuart(u));
    }

    // Backward (Prev): incoming front card swoops in from the left
    if (card.toSlot === 0) {
      if (card.startPose.opacity > 0.05 && card.startPose.x >= -0.2) {
        if (t < 0.14) {
          const u = t / 0.14;
          return {
            ...card.startPose,
            z: card.startPose.z - 0.24 * u,
            opacity: card.startPose.opacity * (1 - u),
          };
        }
        const u = clamp((t - 0.14) / 0.86, 0, 1);
        const e = easeOutQuart(u);
        const pose = lerpPose(SWEEP_PEAK_POSE, toPose, e);
        pose.opacity = clamp(u / 0.36, 0, 1);
        return pose;
      }

      const fromPose =
        card.startPose.x < -0.2
          ? card.startPose
          : { ...SWEEP_PEAK_POSE, opacity: 0 };
      const u = clamp(t, 0, 1);
      const e = easeOutQuart(u);
      const pose = lerpPose(fromPose, toPose, e);
      pose.opacity = clamp(Math.max(fromPose.opacity, u / 0.38), 0, 1);
      return pose;
    }

    const u = clamp(t / 0.86, 0, 1);
    return lerpPose(card.startPose, toPose, easeOutQuart(u));
  };

  const renderFrame = (): boolean => {
    const total = cards.length;
    const isDeck = total > 1;

    const goalX = isDragging ? clamp(dragRotX, -0.55, 0.55) : targetRotX;
    const maxYaw = allowWideOrbit ? Math.PI : 0.95;
    const goalY = isDragging ? clamp(dragRotY, -maxYaw, maxYaw) : targetRotY;

    const lerp = isDragging ? 0.24 : 0.085;
    curRotX += (goalX - curRotX) * lerp;
    curRotY += (goalY - curRotY) * lerp;

    const swipeLerp = Math.abs(targetSwipeNorm) > 0.001 ? 0.24 : 0.13;
    curSwipeNorm += (targetSwipeNorm - curSwipeNorm) * swipeLerp;
    if (Math.abs(targetSwipeNorm - curSwipeNorm) < 0.001) {
      curSwipeNorm = targetSwipeNorm;
    }

    curDeckX += (targetDeckX - curDeckX) * 0.14;
    curDeckY += (targetDeckY - curDeckY) * 0.14;
    curCamZ += (targetCamZ - curCamZ) * 0.14;
    if (Math.abs(targetDeckX - curDeckX) < 0.001) curDeckX = targetDeckX;
    if (Math.abs(targetDeckY - curDeckY) < 0.001) curDeckY = targetDeckY;
    if (Math.abs(targetCamZ - curCamZ) < 0.002) curCamZ = targetCamZ;

    deckRoot.rotation.set(curRotX, curRotY, 0);
    deckRoot.position.set(curDeckX, curDeckY, 0);
    if (Math.abs(camera.position.z - curCamZ) > 0.0005) {
      camera.position.set(0, 0, curCamZ);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }

    if (isShuffling) {
      const elapsed = performance.now() - shuffleStartTime;
      const t = clamp(elapsed / SHUFFLE_DURATION_MS, 0, 1);
      cards.forEach((card) => {
        applyCardPose(card, computeShufflePose(card, t));
      });
      if (t >= 1) {
        isShuffling = false;
        cards.forEach((card) => {
          const finalPose = getSlotPose(card.toSlot, total);
          card.fromSlot = card.toSlot;
          card.startPose = finalPose;
          applyCardPose(card, finalPose);
        });
      }
    } else if (isDeck) {
      const pull = Math.abs(curSwipeNorm);
      const frontPose = getSlotPose(0, total);
      cards.forEach((card, i) => {
        const slot = (i - currentActiveIdx + total) % total;
        const basePose = getSlotPose(slot, total);
        if (slot === 0 && pull > 0.0005) {
          applyCardPose(card, {
            x: curSwipeNorm * 0.65,
            y: pull * 0.02,
            z: pull * 0.12,
            rotY: -curSwipeNorm * 0.12,
            rotZ: -curSwipeNorm * 0.04,
            scale: 1 - pull * 0.025,
            brightness: 1,
            opacity: 1,
          });
        } else if (slot === 1 && curSwipeNorm < -0.0005) {
          applyCardPose(card, lerpPose(basePose, frontPose, pull * 0.28));
        } else if (slot === total - 1 && curSwipeNorm > 0.0005) {
          if (basePose.opacity <= 0.05) {
            const peekPose = lerpPose(SWEEP_PEAK_POSE, frontPose, pull * 0.28);
            peekPose.opacity = clamp(pull * 1.15, 0, 0.9);
            applyCardPose(card, peekPose);
          } else {
            applyCardPose(card, lerpPose(basePose, frontPose, pull * 0.22));
          }
        } else {
          applyCardPose(card, basePose);
        }
      });
    }

    // Dynamic back-to-front render order for crisp glass transparency
    const sorted = [...cards].sort(
      (a, b) => a.group.position.z - b.group.position.z
    );
    sorted.forEach((card, rank) => {
      const baseOrder = rank * 4;
      card.opaqueMeshes.forEach((m) => {
        m.renderOrder = baseOrder;
      });
      card.glassMesh.renderOrder = baseOrder + 1;
      card.glareMesh.renderOrder = baseOrder + 2;
      card.glareMat.uniforms.uTilt.value.set(
        curRotX,
        curRotY + card.group.rotation.y
      );
    });

    const frontShiftX =
      isDeck && cards[currentActiveIdx]
        ? cards[currentActiveIdx].group.position.x * 0.45
        : 0;
    shadowMesh.position.set(
      0.06 + curDeckX + frontShiftX - curRotY * 0.35,
      -0.08 + curDeckY + curRotX * 0.28,
      -0.95
    );

    const settled =
      !isDragging &&
      !isShuffling &&
      Math.abs(goalX - curRotX) < 0.0005 &&
      Math.abs(goalY - curRotY) < 0.0005 &&
      Math.abs(targetSwipeNorm - curSwipeNorm) < 0.001 &&
      Math.abs(targetDeckX - curDeckX) < 0.001 &&
      Math.abs(targetDeckY - curDeckY) < 0.001 &&
      Math.abs(targetCamZ - curCamZ) < 0.002;

    if (settled) {
      curRotX = goalX;
      curRotY = goalY;
    }

    if (!settled || needsForcedRender) {
      activeRenderer.render(scene, camera);
      needsForcedRender = false;
    }

    return settled;
  };

  function tick() {
    rafId = 0;
    if (disposed || !isInView || document.hidden) return;
    if (!renderFrame()) rafId = window.requestAnimationFrame(tick);
  }

  const handleResize = () => {
    if (disposed || !container) return;
    const w = Math.max(container.clientWidth, 160);
    const h = Math.max(container.clientHeight, 160);
    const aspect = w / h;
    const isDeck = cards.length > 1;
    targetCamZ = computeIdealCameraZ(isDeck);
    curCamZ = targetCamZ;

    activeRenderer.setSize(w, h, false);
    camera.aspect = aspect;
    camera.position.set(0, 0, curCamZ);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    wake();
  };

  handleResize();

  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(container);

  const viewIo = new IntersectionObserver(
    (entries) => {
      isInView = entries.some((entry) => entry.isIntersecting);
      if (isInView && !document.hidden) wake();
      else if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    },
    { rootMargin: "120px 0px", threshold: 0 }
  );
  viewIo.observe(container);

  const handleVisibility = () => {
    if (document.hidden && rafId !== 0) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    } else if (!document.hidden && isInView) {
      wake();
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);

  const setDeck = (
    items: readonly CertificateItem[],
    activeIndex: number,
    direction: 1 | -1 | 0 = 0
  ) => {
    if (disposed || items.length === 0) return;

    const safeIdx = clamp(activeIndex, 0, items.length - 1);
    const nextSig = items.map((c) => c.id).join("|");
    const activeCert = items[safeIdx];
    const nextFormat: CertificateFrameFormat =
      activeCert.frameFormat ?? "landscape";

    if (
      nextSig !== deckSignature ||
      nextFormat !== currentFormat ||
      cards.length !== items.length
    ) {
      buildDeck(items, safeIdx, false);
      return;
    }

    if (safeIdx === currentActiveIdx) return;

    const total = cards.length;
    if (total <= 1) {
      currentActiveIdx = 0;
      return;
    }

    // Choose collision-free direction; absorb any active swipe offset seamlessly
    const isOneStepBack = (currentActiveIdx - 1 + total) % total === safeIdx;
    const isOneStepForward = (currentActiveIdx + 1) % total === safeIdx;
    let effectiveDir: 1 | -1;
    if (total === 2) {
      effectiveDir = direction < 0 ? -1 : 1;
    } else if (isOneStepForward && !isOneStepBack) {
      effectiveDir = 1;
    } else if (isOneStepBack && !isOneStepForward) {
      effectiveDir = -1;
    } else {
      effectiveDir = direction < 0 ? -1 : 1;
    }

    cards.forEach((card, i) => {
      card.startPose = readCardLivePose(card);
      card.fromSlot = (i - currentActiveIdx + total) % total;
      card.toSlot = (i - safeIdx + total) % total;
    });

    curSwipeNorm = 0;
    targetSwipeNorm = 0;
    currentActiveIdx = safeIdx;
    shuffleDir = effectiveDir;
    shuffleStartTime = performance.now();
    isShuffling = true;
    wake();
  };

  return {
    setCertificate: (nextCert, direction = 0) => {
      setDeck([nextCert], 0, direction);
    },
    setDeck,
    preloadImages: (srcs) => {
      if (disposed) return;
      for (const src of srcs) {
        if (src) loadCachedImage(src);
      }
    },
    setSwipeOffset: (pxOffset) => {
      if (disposed) return;
      if (isShuffling && Math.abs(pxOffset) > 0.5) {
        isShuffling = false;
        const total = cards.length;
        cards.forEach((card) => {
          const finalPose = getSlotPose(card.toSlot, total);
          card.fromSlot = card.toSlot;
          card.startPose = finalPose;
          applyCardPose(card, finalPose);
        });
      }
      targetSwipeNorm = Math.tanh(pxOffset / 220);
      wake();
    },
    setPointerNormalized: (nx, ny) => {
      if (disposed || isDragging) return;
      targetRotY = clamp(nx, -1, 1) * 0.24;
      targetRotX = clamp(-ny, -1, 1) * 0.16;
      wake();
    },
    resetPose: () => {
      if (disposed) return;
      isDragging = false;
      targetRotX = 0.045;
      targetRotY = -0.085;
      wake();
    },
    setDraggingDelta: (dxPx, dyPx) => {
      if (disposed) return;
      if (!isDragging) {
        isDragging = true;
        dragRotX = curRotX;
        dragRotY = curRotY;
      }
      const sens = allowWideOrbit ? 0.0085 : 0.0065;
      const maxYaw = allowWideOrbit ? Math.PI : 0.95;
      dragRotY = clamp(dragRotY + dxPx * sens, -maxYaw, maxYaw);
      dragRotX = clamp(dragRotX + dyPx * sens, -0.55, 0.55);
      wake();
    },
    endDrag: () => {
      if (disposed || !isDragging) return;
      isDragging = false;
      if (!allowWideOrbit) {
        targetRotX = 0.045;
        targetRotY = -0.085;
      } else {
        targetRotX = clamp(curRotX * 0.35, -0.25, 0.25);
        targetRotY = clamp(curRotY * 0.35, -0.45, 0.45);
      }
      wake();
    },
    wake,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      viewIo.disconnect();
      resizeObserver.disconnect();
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      disposeCards();
      disposeSharedCardGeos();
      shadowGeo.dispose();
      shadowMat.dispose();
      woodColorTex.dispose();
      woodBumpTex.dispose();
      backboardTex.dispose();
      shadowTex.dispose();
      env.dispose();
      activeRenderer.dispose();
      activeRenderer.domElement.remove();
    },
  };
}
