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
} from "three";
import type { CertificateItem } from "@/data/site";
import { getDevicePerfTier } from "@/lib/deviceTier";
import { clamp } from "@/lib/dom";
import {
  createManagedRenderer,
  createPmremEnv,
  createRadialShadowTexture,
  drawCoverImage,
} from "@/three/webglUtils";

export interface CertificateFrameController {
  setCertificate: (cert: CertificateItem) => void;
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
  allowWideOrbit?: boolean;
  onWebglFailed?: () => void;
}

const FOV_DEG = 32;
const OUTER_W = 3.59;
const OUTER_H = 2.66;
const RAIL_W = 0.2;
const FRAME_DEPTH = 0.16;
const BEVEL_SIZE = 0.018;
const BEVEL_THICKNESS = 0.022;

const HW = OUTER_W * 0.5;
const HH = OUTER_H * 0.5;
const IHW = HW - RAIL_W;
const IHH = HH - RAIL_W;

const FILLET_W = 0.015;
const ART_W = (IHW - FILLET_W) * 2;
const ART_H = (IHH - FILLET_W) * 2;

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
let cachedBackboardCanvas: HTMLCanvasElement | null = null;

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

  const size = 512;
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

function getBackboardCanvas(): HTMLCanvasElement {
  if (cachedBackboardCanvas) return cachedBackboardCanvas;

  const width = 512;
  const height = 384;
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
    ctx.fillText("ABDULLAHELAWADY.STUDIO", width * 0.5, height * 0.48);

    ctx.fillStyle = "rgba(243, 66, 19, 0.72)";
    ctx.font =
      '500 10px Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';
    ctx.fillText("ARCHIVAL CREDENTIAL EDITION", width * 0.5, height * 0.55);
  }

  cachedBackboardCanvas = canvas;
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

function drawFallbackCertificatePlate(
  canvas: HTMLCanvasElement,
  cert: CertificateItem
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.fillStyle = "#f5efe3";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#b5904c";
  ctx.lineWidth = 3;
  ctx.strokeRect(56, 56, width - 112, height - 112);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#5c5246";
  ctx.font =
    '600 22px Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';
  ctx.fillText(cert.issuer.toUpperCase(), width * 0.5, height * 0.28);

  ctx.fillStyle = "#171412";
  ctx.font =
    '700 52px Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';
  ctx.fillText("ABDULLAH ELAWADY", width * 0.5, height * 0.44);

  ctx.font =
    '600 42px Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';
  ctx.fillText(cert.title, width * 0.5, height * 0.58);

  ctx.fillStyle = "#7a6f63";
  ctx.font =
    '500 20px Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';
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
  side: "top" | "bottom" | "left" | "right"
): ExtrudeGeometry {
  const b = BEVEL_SIZE;
  const eps = 0.0008;
  const diag = (b + eps) * Math.SQRT2;
  const miterDelta = HW - HH;

  const shape = new Shape();

  if (side === "top") {
    const y0 = IHH + b;
    const y1 = HH - b;
    shape.moveTo(-miterDelta + diag - y1, y1);
    shape.lineTo(-miterDelta + diag - y0, y0);
    shape.lineTo(miterDelta - diag + y0, y0);
    shape.lineTo(miterDelta - diag + y1, y1);
    shape.closePath();
  } else if (side === "bottom") {
    const y0 = -IHH - b;
    const y1 = -HH + b;
    shape.moveTo(-miterDelta + diag + y0, y0);
    shape.lineTo(-miterDelta + diag + y1, y1);
    shape.lineTo(miterDelta - diag - y1, y1);
    shape.lineTo(miterDelta - diag - y0, y0);
    shape.closePath();
  } else if (side === "left") {
    const x0 = -HW + b;
    const x1 = -IHW - b;
    shape.moveTo(x0, -miterDelta - diag - x0);
    shape.lineTo(x0, miterDelta + diag + x0);
    shape.lineTo(x1, miterDelta + diag + x1);
    shape.lineTo(x1, -miterDelta - diag - x1);
    shape.closePath();
  } else {
    const x0 = IHW + b;
    const x1 = HW - b;
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

export function mountCertificateFrameScene({
  container,
  certificate,
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

  const woodMaterial = new MeshPhysicalMaterial({
    map: woodColorTex,
    bumpMap: woodBumpTex,
    bumpScale: 0.018,
    roughness: 0.42,
    metalness: 0.04,
    clearcoat: 0.38,
    clearcoatRoughness: 0.28,
    envMapIntensity: 1.05,
  });

  const brassMaterial = new MeshPhysicalMaterial({
    color: new Color(0xc9a66b),
    metalness: 0.85,
    roughness: 0.26,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.35,
  });

  const certCanvas = document.createElement("canvas");
  certCanvas.width = 1600;
  certCanvas.height = 1128;
  if (certificate.imageSrc) {
    const cCtx = certCanvas.getContext("2d");
    if (cCtx) {
      cCtx.fillStyle = "#181614";
      cCtx.fillRect(0, 0, certCanvas.width, certCanvas.height);
    }
  } else {
    drawFallbackCertificatePlate(certCanvas, certificate);
  }

  const certTex = new CanvasTexture(certCanvas);
  certTex.colorSpace = SRGBColorSpace;
  certTex.anisotropy = Math.min(8, maxAniso);
  certTex.generateMipmaps = true;
  certTex.minFilter = LinearMipmapLinearFilter;
  certTex.needsUpdate = true;

  const artMaterial = new MeshStandardMaterial({
    map: certTex,
    roughness: 0.72,
    metalness: 0.02,
    envMapIntensity: 0.35,
  });

  const glassMaterial = new MeshPhysicalMaterial({
    color: new Color(0xe4eff7),
    transparent: true,
    opacity: 0.055,
    roughness: 0.025,
    metalness: 0.02,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    ior: 1.52,
    reflectivity: 1.0,
    envMapIntensity: 1.8,
    depthWrite: false,
  });

  const glareMaterial = new ShaderMaterial({
    uniforms: {
      uTilt: { value: new Vector2(0, 0) },
      uIntensity: { value: 1.0 },
    },
    vertexShader: GLASS_GLARE_VERTEX,
    fragmentShader: GLASS_GLARE_FRAGMENT,
    transparent: true,
    depthWrite: false,
  });

  const backboardTex = new CanvasTexture(getBackboardCanvas());
  backboardTex.colorSpace = SRGBColorSpace;
  backboardTex.needsUpdate = true;

  const backboardEdgeMaterial = new MeshStandardMaterial({
    color: new Color(0x161412),
    roughness: 0.85,
    metalness: 0.05,
  });

  const backboardFrontMaterial = new MeshStandardMaterial({
    map: backboardTex,
    roughness: 0.82,
    metalness: 0.04,
  });

  const shadowTex = createRadialShadowTexture(0.62, 0.24);
  const shadowMat = new MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });

  const geometries: Array<{ dispose: () => void }> = [];
  const frameGroup = new Group();
  scene.add(frameGroup);

  (["top", "bottom", "left", "right"] as const).forEach((side) => {
    const geo = createMiterRailGeometry(side);
    geometries.push(geo);
    frameGroup.add(new Mesh(geo, woodMaterial));
  });

  const filletW = FILLET_W;
  const filletDepth = 0.088;
  const filletZ = -0.008;
  const topBotFilletGeo = new BoxGeometry(IHW * 2, filletW, filletDepth);
  const sideFilletGeo = new BoxGeometry(
    filletW,
    (IHH - filletW) * 2,
    filletDepth
  );
  geometries.push(topBotFilletGeo, sideFilletGeo);

  [
    [topBotFilletGeo, 0, IHH - filletW * 0.5],
    [topBotFilletGeo, 0, -(IHH - filletW * 0.5)],
    [sideFilletGeo, -(IHW - filletW * 0.5), 0],
    [sideFilletGeo, IHW - filletW * 0.5, 0],
  ].forEach(([geo, x, y]) => {
    const m = new Mesh(geo as BoxGeometry, brassMaterial);
    m.position.set(x as number, y as number, filletZ);
    frameGroup.add(m);
  });

  const artGeo = new PlaneGeometry(ART_W + 0.024, ART_H + 0.024);
  geometries.push(artGeo);
  const artMesh = new Mesh(artGeo, artMaterial);
  artMesh.position.z = -0.052;
  frameGroup.add(artMesh);

  const glassGeo = new PlaneGeometry(IHW * 2 - 0.004, IHH * 2 - 0.004);
  geometries.push(glassGeo);
  const glassMesh = new Mesh(glassGeo, glassMaterial);
  glassMesh.position.z = 0.044;
  glassMesh.renderOrder = 2;
  frameGroup.add(glassMesh);

  const glareGeo = new PlaneGeometry(IHW * 2 - 0.006, IHH * 2 - 0.006);
  geometries.push(glareGeo);
  const glareMesh = new Mesh(glareGeo, glareMaterial);
  glareMesh.position.z = 0.048;
  glareMesh.renderOrder = 3;
  frameGroup.add(glareMesh);

  const backBoxGeo = new BoxGeometry(OUTER_W - 0.08, OUTER_H - 0.08, 0.028);
  const backStampGeo = new PlaneGeometry(OUTER_W - 0.1, OUTER_H - 0.1);
  geometries.push(backBoxGeo, backStampGeo);
  const backBoxMesh = new Mesh(backBoxGeo, backboardEdgeMaterial);
  backBoxMesh.position.z = -0.092;
  const backStampMesh = new Mesh(backStampGeo, backboardFrontMaterial);
  backStampMesh.position.z = -0.108;
  backStampMesh.rotation.y = Math.PI;
  frameGroup.add(backBoxMesh, backStampMesh);

  const shadowGeo = new PlaneGeometry(4.6, 3.6);
  geometries.push(shadowGeo);
  const shadowMesh = new Mesh(shadowGeo, shadowMat);
  shadowMesh.position.set(0.06, -0.08, -0.45);
  scene.add(shadowMesh);

  let curRotX = 0.1;
  let curRotY = 0.24;
  let targetRotX = 0.045;
  let targetRotY = -0.085;
  let dragRotX = 0;
  let dragRotY = 0;
  let isDragging = false;
  let pointerActive = false;

  frameGroup.rotation.set(curRotX, curRotY, 0);

  let disposed = false;
  let rafId = 0;
  let isInView = true;
  let needsForcedRender = true;
  let certLoadSeq = 0;

  const scheduleLoop = () => {
    if (disposed || !isInView || document.hidden || rafId !== 0) return;
    rafId = window.requestAnimationFrame(tick);
  };

  const renderFrame = (): boolean => {
    const goalX = isDragging ? clamp(dragRotX, -0.55, 0.55) : targetRotX;
    const maxYaw = allowWideOrbit ? Math.PI : 0.95;
    const goalY = isDragging ? clamp(dragRotY, -maxYaw, maxYaw) : targetRotY;

    const lerp = isDragging ? 0.24 : 0.095;
    curRotX += (goalX - curRotX) * lerp;
    curRotY += (goalY - curRotY) * lerp;

    const settled =
      !isDragging &&
      Math.abs(goalX - curRotX) < 0.0005 &&
      Math.abs(goalY - curRotY) < 0.0005;

    if (settled) {
      curRotX = goalX;
      curRotY = goalY;
    }

    frameGroup.rotation.set(curRotX, curRotY, 0);
    shadowMesh.position.set(
      0.06 - curRotY * 0.35,
      -0.08 + curRotX * 0.28,
      -0.45
    );
    glareMaterial.uniforms.uTilt.value.set(curRotX, curRotY);

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

  const wake = () => {
    if (disposed) return;
    needsForcedRender = true;
    if (isInView && !document.hidden) scheduleLoop();
    else activeRenderer.render(scene, camera);
  };

  const loadCertificateArtwork = (cert: CertificateItem) => {
    certLoadSeq += 1;
    const seq = certLoadSeq;

    if (!cert.imageSrc) {
      drawFallbackCertificatePlate(certCanvas, cert);
      certTex.needsUpdate = true;
      wake();
      return;
    }

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      img.onload = null;
      img.onerror = null;
      if (disposed || seq !== certLoadSeq) return;
      drawScannedCertificateImage(certCanvas, img);
      certTex.needsUpdate = true;
      wake();
    };
    img.onerror = () => {
      img.onload = null;
      img.onerror = null;
      if (disposed || seq !== certLoadSeq) return;
      drawFallbackCertificatePlate(certCanvas, cert);
      certTex.needsUpdate = true;
      wake();
    };
    img.src = cert.imageSrc;
  };

  if (certificate.imageSrc) loadCertificateArtwork(certificate);

  const handleResize = () => {
    if (disposed || !container) return;
    const w = Math.max(container.clientWidth, 160);
    const h = Math.max(container.clientHeight, 160);
    const aspect = w / h;
    const halfTan = Math.tan((FOV_DEG * Math.PI) / 360);
    const camZHeight = (2.98 * 0.5) / halfTan;
    const camZWidth = (3.95 * 0.5) / (halfTan * aspect);
    const camZ = Math.max(5.15, camZHeight, camZWidth);

    activeRenderer.setSize(w, h, false);
    camera.aspect = aspect;
    camera.position.set(0, 0, camZ);
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

  return {
    setCertificate: (nextCert) => {
      if (disposed) return;
      curRotY += curRotY >= 0 ? -0.34 : 0.34;
      if (!pointerActive && !isDragging) {
        targetRotX = 0.045;
        targetRotY = -0.085;
      }
      loadCertificateArtwork(nextCert);
    },
    setPointerNormalized: (nx, ny) => {
      if (disposed || isDragging) return;
      pointerActive = true;
      targetRotY = clamp(nx, -1, 1) * 0.28;
      targetRotX = clamp(-ny, -1, 1) * 0.18;
      wake();
    },
    resetPose: () => {
      if (disposed) return;
      pointerActive = false;
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
      certLoadSeq += 1;
      document.removeEventListener("visibilitychange", handleVisibility);
      viewIo.disconnect();
      resizeObserver.disconnect();
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      geometries.forEach((g) => g.dispose());
      woodMaterial.dispose();
      brassMaterial.dispose();
      artMaterial.dispose();
      glassMaterial.dispose();
      glareMaterial.dispose();
      backboardEdgeMaterial.dispose();
      backboardFrontMaterial.dispose();
      shadowMat.dispose();
      woodColorTex.dispose();
      woodBumpTex.dispose();
      certTex.dispose();
      backboardTex.dispose();
      shadowTex.dispose();
      env.dispose();
      activeRenderer.dispose();
      activeRenderer.domElement.remove();
    },
  };
}
