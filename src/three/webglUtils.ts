import {
  CanvasTexture,
  DirectionalLight,
  EquirectangularReflectionMapping,
  HemisphereLight,
  NeutralToneMapping,
  PMREMGenerator,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  WebGLRenderer,
} from "three";

export interface ManagedRendererOptions {
  maxDpr: number;
  className?: string;
  touchAction?: string;
  toneMappingExposure?: number;
}

export function createManagedRenderer(
  container: HTMLElement,
  {
    maxDpr,
    className = "block h-full w-full pointer-events-none",
    touchAction,
    toneMappingExposure,
  }: ManagedRendererOptions
): WebGLRenderer | null {
  try {
    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    if (toneMappingExposure !== undefined) {
      renderer.toneMapping = NeutralToneMapping;
      renderer.toneMappingExposure = toneMappingExposure;
    }
    renderer.domElement.className = className;
    if (touchAction) {
      renderer.domElement.style.touchAction = touchAction;
    }
    container.appendChild(renderer.domElement);
    return renderer;
  } catch {
    return null;
  }
}

export function createPmremEnv(
  renderer: WebGLRenderer,
  rawEnvTex: Texture
): { texture: Texture; dispose: () => void } {
  const pmrem = new PMREMGenerator(renderer);
  const envTarget = pmrem.fromEquirectangular(rawEnvTex);
  return {
    texture: envTarget.texture,
    dispose: () => {
      rawEnvTex.dispose();
      envTarget.dispose();
      pmrem.dispose();
    },
  };
}

export function drawCoverImage(
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

export interface StudioEnvOptions {
  width?: number;
  height?: number;
  bg?: string;
  keyMidStop?: string;
  rimStop?: string;
  floorStop?: string;
}

/**
 * Generates an equirectangular studio softbox reflection map for glossy clearcoat orbs.
 */
export function createStudioEnvTexture({
  width = 256,
  height = 128,
  bg = "#0c0d11",
  keyMidStop = "rgba(255, 255, 255, 0.45)",
  rimStop = "rgba(230, 236, 246, 0.38)",
  floorStop = "rgba(228, 224, 218, 0.16)",
}: StudioEnvOptions = {}): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const keyX = width * (340 / 1024);
    const keyY = height * (115 / 512);
    const keySoftbox = ctx.createRadialGradient(
      keyX,
      keyY,
      width * (8 / 1024),
      keyX,
      keyY,
      width * (210 / 1024)
    );
    keySoftbox.addColorStop(0, "#ffffff");
    keySoftbox.addColorStop(0.41, keyMidStop);
    keySoftbox.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = keySoftbox;
    ctx.fillRect(0, 0, width, height);

    const rimX = width * (745 / 1024);
    const rimY = height * (142 / 512);
    const rimDiffuser = ctx.createRadialGradient(
      rimX,
      rimY,
      width * (10 / 1024),
      rimX,
      rimY,
      width * (190 / 1024)
    );
    rimDiffuser.addColorStop(0, rimStop);
    rimDiffuser.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = rimDiffuser;
    ctx.fillRect(0, 0, width, height);

    const floorY = Math.round(height * (390 / 512));
    const floorBounce = ctx.createLinearGradient(0, floorY, 0, height);
    floorBounce.addColorStop(0, "rgba(0, 0, 0, 0)");
    floorBounce.addColorStop(1, floorStop);
    ctx.fillStyle = floorBounce;
    ctx.fillRect(0, floorY, width, height - floorY);
  }

  const tex = new CanvasTexture(canvas);
  tex.mapping = EquirectangularReflectionMapping;
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/**
 * Generates a radial drop/contact shadow alpha sprite.
 */
export function createRadialShadowTexture(
  centerAlpha: number,
  midAlpha: number
): CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const half = size * 0.5;
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0, `rgba(0, 0, 0, ${centerAlpha})`);
    grad.addColorStop(0.45, `rgba(0, 0, 0, ${midAlpha})`);
    grad.addColorStop(0.8, "rgba(0, 0, 0, 0.05)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  return new CanvasTexture(canvas);
}

/**
 * Builds a sphere geometry with conformal arc-length hemisphere UVs so front
 * and back planar logos project without polar pinching.
 */
export function createConformalSphereGeometry(
  widthSegments = 64,
  heightSegments = 48
): SphereGeometry {
  const geo = new SphereGeometry(1, widthSegments, heightSegments);
  const posAttr = geo.attributes.position;
  const uvAttr = geo.attributes.uv;

  if (posAttr && uvAttr) {
    for (let i = 0; i < posAttr.count; i += 1) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      const absZ = Math.max(0, Math.min(1, Math.abs(z)));
      const theta = Math.acos(absZ);
      const rho = theta / (Math.PI * 0.5);
      const phi = Math.atan2(y, x);
      const dirX = z >= 0 ? Math.cos(phi) : -Math.cos(phi);
      uvAttr.setXY(i, 0.5 + 0.5 * rho * dirX, 0.5 + 0.5 * rho * Math.sin(phi));
    }
    uvAttr.needsUpdate = true;
  }

  return geo;
}

/**
 * Adds neutral 3-point product studio lighting scaled to the scene world units.
 */
export function addStudioThreePointLights(
  scene: Scene,
  posScale: number,
  groundColor: number
): void {
  const hemiLight = new HemisphereLight(0xfffdf9, groundColor, 0.95);
  const keyLight = new DirectionalLight(0xfffcf8, 2.35);
  keyLight.position.set(-4.2 * posScale, 5.6 * posScale, 6.8 * posScale);

  const fillLight = new DirectionalLight(0xdbe2ee, 0.72);
  fillLight.position.set(4.8 * posScale, -2.0 * posScale, 4.4 * posScale);

  const crownLight = new DirectionalLight(0xffffff, 0.82);
  crownLight.position.set(0.4 * posScale, 6.2 * posScale, 1.8 * posScale);

  scene.add(hemiLight, keyLight, fillLight, crownLight);
}
