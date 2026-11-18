import {
  CanvasTexture,
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import { getDevicePerfTier } from "@/lib/deviceTier";
import {
  addStudioThreePointLights,
  clamp,
  createConformalSphereGeometry,
  createRadialShadowTexture,
  createStudioEnvTexture,
} from "@/lib/threeOrbShared";

export interface SuccessOrbController {
  setHoverTilt: (nx: number, ny: number) => void;
  dispose: () => void;
}

const FOV_DEG = 20;

function createEmeraldCheckTextures(
  maxAnisotropy: number,
  colorSize: number,
  bumpSize: number
): {
  colorTex: CanvasTexture;
  bumpTex: CanvasTexture;
} {
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = colorSize;
  colorCanvas.height = colorSize;
  const colorCtx = colorCanvas.getContext("2d");

  if (colorCtx) {
    colorCtx.save();
    colorCtx.scale(colorSize / 1024, colorSize / 1024);
    const bgGrad = colorCtx.createRadialGradient(
      380,
      340,
      40,
      512,
      512,
      560
    );
    bgGrad.addColorStop(0, "#1cd166");
    bgGrad.addColorStop(0.55, "#119e49");
    bgGrad.addColorStop(1, "#0a6930");
    colorCtx.fillStyle = bgGrad;
    colorCtx.fillRect(0, 0, 1024, 1024);

    // Bold optically centered checkmark (~52% of sphere width)
    colorCtx.strokeStyle = "#ffffff";
    colorCtx.lineWidth = 108;
    colorCtx.lineCap = "round";
    colorCtx.lineJoin = "round";
    colorCtx.beginPath();
    colorCtx.moveTo(314, 532);
    colorCtx.lineTo(452, 670);
    colorCtx.lineTo(720, 366);
    colorCtx.stroke();
    colorCtx.restore();
  }

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = bumpSize;
  bumpCanvas.height = bumpSize;
  const bumpCtx = bumpCanvas.getContext("2d");

  if (bumpCtx) {
    bumpCtx.fillStyle = "#ffffff";
    bumpCtx.fillRect(0, 0, bumpSize, bumpSize);

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = bumpSize;
    maskCanvas.height = bumpSize;
    const maskCtx = maskCanvas.getContext("2d");
    if (maskCtx) {
      maskCtx.save();
      maskCtx.scale(bumpSize / 512, bumpSize / 512);
      maskCtx.strokeStyle = "#303030";
      maskCtx.lineWidth = 54;
      maskCtx.lineCap = "round";
      maskCtx.lineJoin = "round";
      maskCtx.beginPath();
      maskCtx.moveTo(157, 266);
      maskCtx.lineTo(226, 335);
      maskCtx.lineTo(360, 183);
      maskCtx.stroke();
      maskCtx.restore();

      bumpCtx.save();
      bumpCtx.filter = `blur(${(3.5 * (bumpSize / 512)).toFixed(2)}px)`;
      bumpCtx.drawImage(maskCanvas, 0, 0);
      bumpCtx.filter = "none";
      bumpCtx.restore();
    }
  }

  const colorTex = new CanvasTexture(colorCanvas);
  colorTex.colorSpace = SRGBColorSpace;
  colorTex.anisotropy = Math.min(8, maxAnisotropy);

  const bumpTex = new CanvasTexture(bumpCanvas);
  bumpTex.anisotropy = Math.min(4, maxAnisotropy);

  return { colorTex, bumpTex };
}

export function mountSuccessOrbScene(
  container: HTMLDivElement,
  { onTriggerChime }: { onTriggerChime?: () => void } = {}
): SuccessOrbController | null {
  const perf = getDevicePerfTier();
  let renderer: WebGLRenderer | null = null;
  try {
    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }

  const activeRenderer = renderer;
  activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, perf.maxDpr));
  activeRenderer.toneMapping = NeutralToneMapping;
  activeRenderer.toneMappingExposure = 1.08;
  activeRenderer.domElement.className =
    "block h-full w-full cursor-grab active:cursor-grabbing touch-none select-none";
  container.appendChild(activeRenderer.domElement);

  const width = container.clientWidth || 84;
  const height = container.clientHeight || 84;
  activeRenderer.setSize(width, height, false);

  const camera = new PerspectiveCamera(
    FOV_DEG,
    width / Math.max(1, height),
    1,
    30
  );
  camera.position.set(0, 0.04, 8.35);
  camera.lookAt(0, -0.02, 0);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(activeRenderer);
  const rawEnvTex = createStudioEnvTexture({
    bg: "#0d110e",
    keyMidStop: "rgba(255, 255, 255, 0.48)",
    rimStop: "rgba(232, 245, 240, 0.42)",
    floorStop: "rgba(220, 240, 228, 0.2)",
  });
  const envTarget = pmrem.fromEquirectangular(rawEnvTex);
  scene.environment = envTarget.texture;

  const maxAniso = activeRenderer.capabilities.getMaxAnisotropy();
  const { colorTex, bumpTex } = createEmeraldCheckTextures(
    maxAniso,
    perf.orbColorSize,
    perf.orbBumpSize
  );

  const material = new MeshPhysicalMaterial({
    map: colorTex,
    metalness: 0.05,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.055,
    ior: 1.52,
    reflectivity: 0.92,
    sheen: 0.18,
    sheenColor: new Color(0xbbf7d0),
    sheenRoughness: 0.32,
    envMapIntensity: 1.18,
    bumpMap: bumpTex,
    bumpScale: 1.05,
  });

  const geometry = createConformalSphereGeometry(perf.orbSegs[0], perf.orbSegs[1]);
  const orbMesh = new Mesh(geometry, material);
  scene.add(orbMesh);

  // Subtle grounded contact shadow beneath the 3D sphere
  const shadowGeo = new PlaneGeometry(2.5, 0.72);
  const shadowTex = createRadialShadowTexture(0.65, 0.26);
  const shadowMat = new MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.7,
  });
  const shadowMesh = new Mesh(shadowGeo, shadowMat);
  shadowMesh.position.set(0, -1.16, 0);
  scene.add(shadowMesh);

  addStudioThreePointLights(scene, 1, 0x121814);

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let scale = reducedMotion ? 1 : 0.3;
  let scaleVel = reducedMotion ? 0 : 7.2;
  let angleY = reducedMotion ? 0 : -Math.PI;
  let omegaY = reducedMotion ? 0 : 7.8;

  let tiltX = 0;
  let tiltY = 0;
  let dragTiltX = 0;
  let targetHoverX = 0;
  let targetHoverY = 0;
  let hoveredOrb = false;

  let dragging = false;
  let dragPointerId = -1;
  let lastX = 0;
  let lastY = 0;
  let lastTime = 0;
  let flickOmegaY = 0;
  let totalDragDist = 0;

  let disposed = false;
  let rafId = 0;
  let prevNow = performance.now();

  const applyPose = () => {
    orbMesh.scale.setScalar(scale);
    orbMesh.rotation.set(tiltX, angleY + tiltY, 0);
    shadowMesh.scale.setScalar(0.85 + scale * 0.15);
    shadowMat.opacity = clamp(0.68 * scale, 0.15, 0.72);
  };

  const wake = () => {
    if (disposed || rafId !== 0) return;
    prevNow = performance.now();
    rafId = window.requestAnimationFrame(tick);
  };

  const tick = (now: number) => {
    rafId = 0;
    if (disposed) return;

    const dt = Math.min(0.032, Math.max(0.001, (now - prevNow) / 1000));
    prevNow = now;

    const targetScale = dragging ? 1.03 : hoveredOrb ? 1.07 : 1.0;
    scaleVel += (targetScale - scale) * 185 * dt;
    scaleVel *= Math.exp(-15 * dt);
    scale += scaleVel * dt;

    if (!dragging) {
      angleY += omegaY * dt;
      omegaY *= Math.exp(-2.8 * dt);

      // Gentle magnetic settle toward nearest upright hemisphere (0, ±PI, ...)
      const nearestPi = Math.round(angleY / Math.PI) * Math.PI;
      if (Math.abs(omegaY) < 3.4) {
        omegaY += (nearestPi - angleY) * 14 * dt;
      }

      dragTiltX *= Math.exp(-9 * dt);
    }

    const desiredTiltX = clamp(dragTiltX + targetHoverX, -0.78, 0.78);
    tiltX += (desiredTiltX - tiltX) * (1 - Math.exp(-13 * dt));
    tiltY += (targetHoverY - tiltY) * (1 - Math.exp(-13 * dt));

    applyPose();
    activeRenderer.render(scene, camera);

    const nearestPi = Math.round(angleY / Math.PI) * Math.PI;
    const settled =
      !dragging &&
      Math.abs(omegaY) < 0.0025 &&
      Math.abs(nearestPi - angleY) < 0.0025 &&
      Math.abs(scale - targetScale) < 0.0015 &&
      Math.abs(scaleVel) < 0.003 &&
      Math.abs(desiredTiltX - tiltX) < 0.002 &&
      Math.abs(targetHoverY - tiltY) < 0.002;

    if (!settled) {
      rafId = window.requestAnimationFrame(tick);
    } else {
      angleY = nearestPi;
      omegaY = 0;
      scale = targetScale;
      scaleVel = 0;
      tiltX = desiredTiltX;
      tiltY = targetHoverY;
      applyPose();
      activeRenderer.render(scene, camera);
    }
  };

  const canvasEl = activeRenderer.domElement;

  const onPointerEnter = () => {
    hoveredOrb = true;
    wake();
  };

  const onPointerDown = (e: PointerEvent) => {
    dragging = true;
    dragPointerId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = performance.now();
    flickOmegaY = 0;
    totalDragDist = 0;
    omegaY = 0;
    canvasEl.setPointerCapture(e.pointerId);
    wake();
  };

  const onPointerMove = (e: PointerEvent) => {
    const rect = canvasEl.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2;
    if (!dragging) {
      targetHoverY = clamp(nx * 0.34, -0.38, 0.38);
      targetHoverX = clamp(ny * 0.3, -0.34, 0.34);
      wake();
      return;
    }

    if (e.pointerId !== dragPointerId) return;
    const now = performance.now();
    const dt = Math.max(0.004, (now - lastTime) / 1000);
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = now;

    totalDragDist += Math.hypot(dx, dy);
    angleY += dx * 0.022;
    dragTiltX = clamp(dragTiltX + dy * 0.016, -0.75, 0.75);
    flickOmegaY = flickOmegaY * 0.45 + clamp((dx * 0.022) / dt, -24, 24) * 0.55;
    wake();
  };

  const finishDrag = (e: PointerEvent) => {
    if (!dragging || e.pointerId !== dragPointerId) return;
    dragging = false;
    if (canvasEl.hasPointerCapture(e.pointerId)) {
      canvasEl.releasePointerCapture(e.pointerId);
    }

    if (totalDragDist < 6) {
      omegaY += 11.5;
      scaleVel += 3.2;
      onTriggerChime?.();
    } else {
      omegaY = clamp(flickOmegaY, -22, 22);
    }
    wake();
  };

  const onPointerLeave = () => {
    hoveredOrb = false;
    if (!dragging) {
      targetHoverX = 0;
      targetHoverY = 0;
    }
    wake();
  };

  canvasEl.addEventListener("pointerenter", onPointerEnter);
  canvasEl.addEventListener("pointerdown", onPointerDown);
  canvasEl.addEventListener("pointermove", onPointerMove);
  canvasEl.addEventListener("pointerup", finishDrag);
  canvasEl.addEventListener("pointercancel", finishDrag);
  canvasEl.addEventListener("pointerleave", onPointerLeave);

  applyPose();
  activeRenderer.render(scene, camera);
  if (!reducedMotion) {
    wake();
  }

  return {
    setHoverTilt: (nx: number, ny: number) => {
      if (dragging || hoveredOrb) return;
      targetHoverY = clamp(nx * 0.28, -0.34, 0.34);
      targetHoverX = clamp(ny * 0.24, -0.28, 0.28);
      wake();
    },
    dispose: () => {
      disposed = true;
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      canvasEl.removeEventListener("pointerenter", onPointerEnter);
      canvasEl.removeEventListener("pointerdown", onPointerDown);
      canvasEl.removeEventListener("pointermove", onPointerMove);
      canvasEl.removeEventListener("pointerup", finishDrag);
      canvasEl.removeEventListener("pointercancel", finishDrag);
      canvasEl.removeEventListener("pointerleave", onPointerLeave);

      geometry.dispose();
      shadowGeo.dispose();
      material.dispose();
      shadowMat.dispose();
      colorTex.dispose();
      bumpTex.dispose();
      shadowTex.dispose();
      rawEnvTex.dispose();
      envTarget.dispose();
      pmrem.dispose();
      activeRenderer.dispose();
      if (canvasEl.parentNode === container) {
        container.removeChild(canvasEl);
      }
    },
  };
}
