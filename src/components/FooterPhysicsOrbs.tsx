"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ObstacleBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface OrbBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  omega: number;
  restTiltX: number;
  restTiltY: number;
  tiltX: number;
  tiltY: number;
  entered: boolean;
  spawned: boolean;
  mesh: THREE.Mesh;
  shadowMesh: THREE.Mesh;
}

const DESKTOP_ORB_COUNT = 13;
const MOBILE_ORB_COUNT = 9;
const SUBSTEPS = 6;
const GRAVITY = 1920; // px/s^2
const RESTITUTION_ORB = 0.72;
const RESTITUTION_WALL = 0.64;
const FOV_DEG = 18;

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function createStudioEnvTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#0c0d11";
    ctx.fillRect(0, 0, 1024, 512);

    // Primary upper-left studio softbox for crisp curved white highlight
    const keySoftbox = ctx.createRadialGradient(340, 115, 8, 340, 115, 210);
    keySoftbox.addColorStop(0, "#ffffff");
    keySoftbox.addColorStop(0.4, "rgba(255, 255, 255, 0.45)");
    keySoftbox.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = keySoftbox;
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle upper-right neutral rim diffuser
    const rimDiffuser = ctx.createRadialGradient(740, 140, 10, 740, 140, 190);
    rimDiffuser.addColorStop(0, "rgba(230, 236, 246, 0.38)");
    rimDiffuser.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = rimDiffuser;
    ctx.fillRect(0, 0, 1024, 512);

    // Gentle bottom neutral studio floor bounce
    const floorBounce = ctx.createLinearGradient(0, 390, 0, 512);
    floorBounce.addColorStop(0, "rgba(0, 0, 0, 0)");
    floorBounce.addColorStop(1, "rgba(228, 224, 218, 0.16)");
    ctx.fillStyle = floorBounce;
    ctx.fillRect(0, 390, 1024, 122);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createOrbFaceTexture(
  baseBg: string,
  spokeColor: string
): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;

    // Pure solid stroke-free base color — all 3D form comes from real spherical PBR shading
    ctx.fillStyle = baseBg;
    ctx.fillRect(0, 0, size, size);

    // Bold 8-spoke geometric asterisk centered on both front & back sphere poles
    const armRadius = size * 0.255;
    const lineWidth = size * 0.056;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = spokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "butt";
    for (let i = 0; i < 4; i += 1) {
      const a = (i * Math.PI) / 4;
      const dx = Math.cos(a) * armRadius;
      const dy = Math.sin(a) * armRadius;
      ctx.beginPath();
      ctx.moveTo(-dx, -dy);
      ctx.lineTo(dx, dy);
      ctx.stroke();
    }

    // Solid center union
    ctx.fillStyle = spokeColor;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.048, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createEmblemBumpTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;
    const armRadius = size * 0.255;
    const lineWidth = size * 0.056;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.filter = "blur(3.5px)";
    ctx.strokeStyle = "#353535";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "butt";
    for (let i = 0; i < 4; i += 1) {
      const a = (i * Math.PI) / 4;
      const dx = Math.cos(a) * armRadius;
      const dy = Math.sin(a) * armRadius;
      ctx.beginPath();
      ctx.moveTo(-dx, -dy);
      ctx.lineTo(dx, dy);
      ctx.stroke();
    }

    ctx.fillStyle = "#353535";
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.048, 0, Math.PI * 2);
    ctx.fill();
    ctx.filter = "none";
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function createSoftShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0, "rgba(0, 0, 0, 0.52)");
    grad.addColorStop(0.45, "rgba(0, 0, 0, 0.24)");
    grad.addColorStop(0.8, "rgba(0, 0, 0, 0.05)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  return new THREE.CanvasTexture(canvas);
}

function createSculptedSphereGeometry(): THREE.SphereGeometry {
  const geo = new THREE.SphereGeometry(1, 64, 48);
  const posAttr = geo.attributes.position;
  const uvAttr = geo.attributes.uv;

  // Conformal arc-length hemisphere projection so front & back emblems stay distortion-free
  if (posAttr && uvAttr) {
    for (let i = 0; i < posAttr.count; i += 1) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      const absZ = clamp(Math.abs(z), 0, 1);
      const theta = Math.acos(absZ); // 0 at pole, pi/2 at equator
      const rho = theta / (Math.PI * 0.5); // 0..1
      const phi = Math.atan2(y, x);
      const dirX = z >= 0 ? Math.cos(phi) : -Math.cos(phi);
      uvAttr.setXY(i, 0.5 + 0.5 * rho * dirX, 0.5 + 0.5 * rho * Math.sin(phi));
    }
    uvAttr.needsUpdate = true;
  }

  return geo;
}

export function FooterPhysicsOrbs() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    const activeRenderer = renderer;
    activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    activeRenderer.toneMapping = THREE.NeutralToneMapping;
    activeRenderer.toneMappingExposure = 1.08;
    activeRenderer.domElement.className = "block h-full w-full cursor-pointer";
    activeRenderer.domElement.style.touchAction = "pan-y";
    container.appendChild(activeRenderer.domElement);

    const scene = new THREE.Scene();
    let width = container.clientWidth || 1280;
    let height = container.clientHeight || 680;
    const camera = new THREE.PerspectiveCamera(
      FOV_DEG,
      width / Math.max(1, height),
      80,
      5000
    );

    const syncCamera = () => {
      const camZ = (height * 0.5) / Math.tan((FOV_DEG * Math.PI) / 360);
      camera.aspect = width / Math.max(1, height);
      camera.position.set(width * 0.5, -height * 0.5, camZ);
      camera.lookAt(width * 0.5, -height * 0.5, 0);
      camera.far = camZ + 1200;
      camera.updateProjectionMatrix();
    };
    syncCamera();

    const pmrem = new THREE.PMREMGenerator(activeRenderer);
    const rawEnvTex = createStudioEnvTexture();
    const envTarget = pmrem.fromEquirectangular(rawEnvTex);
    scene.environment = envTarget.texture;

    const obsTex = createOrbFaceTexture("#18181d", "#f34213");
    const vermTex = createOrbFaceTexture("#f34213", "#0f0f12");
    const sandTex = createOrbFaceTexture("#eee8de", "#121215");
    const emblemBumpTex = createEmblemBumpTexture();

    const materials: THREE.MeshPhysicalMaterial[] = [
      // Obsidian Onyx Sphere
      new THREE.MeshPhysicalMaterial({
        map: obsTex,
        metalness: 0.08,
        roughness: 0.26,
        clearcoat: 1.0,
        clearcoatRoughness: 0.07,
        ior: 1.54,
        reflectivity: 0.9,
        sheen: 0.22,
        sheenColor: new THREE.Color(0xd8dde8),
        sheenRoughness: 0.38,
        envMapIntensity: 1.25,
        bumpMap: emblemBumpTex,
        bumpScale: 1.0,
      }),
      // Vermilion Lacquer Sphere
      new THREE.MeshPhysicalMaterial({
        map: vermTex,
        metalness: 0.05,
        roughness: 0.22,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        ior: 1.52,
        reflectivity: 0.9,
        sheen: 0.14,
        sheenColor: new THREE.Color(0xffbfa8),
        sheenRoughness: 0.35,
        envMapIntensity: 1.15,
        bumpMap: emblemBumpTex,
        bumpScale: 1.0,
      }),
      // Glazed Ceramic Ivory Sphere
      new THREE.MeshPhysicalMaterial({
        map: sandTex,
        metalness: 0.03,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        ior: 1.52,
        reflectivity: 0.88,
        sheen: 0.12,
        sheenColor: new THREE.Color(0xffffff),
        sheenRoughness: 0.32,
        envMapIntensity: 1.05,
        bumpMap: emblemBumpTex,
        bumpScale: 1.0,
      }),
    ];

    // Neutral 3-point product studio lighting (prevents orange rim contamination)
    const hemiLight = new THREE.HemisphereLight(0xfffdf9, 0x18191f, 0.95);
    const keyLight = new THREE.DirectionalLight(0xfffcf8, 2.35);
    keyLight.position.set(-420, 560, 680);

    const fillLight = new THREE.DirectionalLight(0xdbe2ee, 0.72);
    fillLight.position.set(480, -200, 440);

    const crownLight = new THREE.DirectionalLight(0xffffff, 0.82);
    crownLight.position.set(40, 620, 180);

    scene.add(hemiLight, keyLight, fillLight, crownLight);

    const geometry = createSculptedSphereGeometry();
    const shadowGeo = new THREE.PlaneGeometry(2.35, 2.35);
    const shadowTex = createSoftShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    });

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let floorY = Math.max(height * 0.66, height - 150);
    let obstacles: ObstacleBox[] = [];

    const measureArena = () => {
      const cRect = container.getBoundingClientRect();
      width = container.clientWidth || cRect.width || 1280;
      height = container.clientHeight || cRect.height || 680;
      activeRenderer.setSize(width, height, false);
      syncCamera();

      const footerRoot = container.closest("footer");
      const dividerEl = footerRoot?.querySelector<HTMLElement>(
        "[data-footer-divider]"
      );
      if (dividerEl) {
        const dRect = dividerEl.getBoundingClientRect();
        const relFloor = dRect.top - cRect.top;
        if (relFloor > height * 0.45 && relFloor < height - 40) {
          floorY = relFloor;
        } else {
          floorY = height * 0.78;
        }
      } else {
        floorY = height * 0.78;
      }

      const nextObstacles: ObstacleBox[] = [];
      const obsEls = footerRoot?.querySelectorAll<HTMLElement>(
        "[data-footer-obstacle]"
      );
      obsEls?.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          nextObstacles.push({
            left: r.left - cRect.left - 8,
            top: r.top - cRect.top - 8,
            right: r.right - cRect.left + 8,
            bottom: r.bottom - cRect.top + 8,
          });
        }
      });
      obstacles = nextObstacles;
    };

    const getOrbRadius = (w: number): number => {
      const diameter =
        w >= 768
          ? clamp(w / 14.2, 76, 102)
          : clamp(w / 6.8, 54, 68);
      return diameter * 0.5;
    };

    measureArena();

    const orbCount = width >= 768 ? DESKTOP_ORB_COUNT : MOBILE_ORB_COUNT;
    const baseRadius = getOrbRadius(width);
    const orbs: OrbBody[] = [];

    for (let i = 0; i < orbCount; i += 1) {
      const mat = materials[i % materials.length];
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.visible = false;

      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.visible = false;

      scene.add(shadowMesh, mesh);

      const radius = baseRadius * (i % 3 === 0 ? 1.03 : i % 3 === 1 ? 0.97 : 1);
      const slotNorm = (i + 0.5) / orbCount;
      const jitter = (((i * 37) % 10) - 5) * 0.008;
      const startX = clamp(
        width * (0.14 + (slotNorm + jitter) * 0.72),
        radius + 20,
        width - radius - 20
      );
      const restTiltX = ((i % 5) - 2) * 0.07;
      const restTiltY = (((i * 3) % 5) - 2) * 0.07;

      orbs.push({
        x: startX,
        y: -radius * 1.6,
        vx: (i % 2 === 0 ? 1 : -1) * (40 + (i % 4) * 28),
        vy: 60 + (i % 3) * 35,
        radius,
        angle: (i * 0.7) % (Math.PI * 2),
        omega: (i % 2 === 0 ? 1 : -1) * 1.4,
        restTiltX,
        restTiltY,
        tiltX: restTiltX,
        tiltY: restTiltY,
        entered: false,
        spawned: false,
        mesh,
        shadowMesh,
      });
    }

    container.setAttribute("data-orbs-spawned", "0");
    container.setAttribute("data-orbs-active-motion", "0");

    // Pointer / brush / drag / click state
    let pointerActive = false;
    let cursorX = -1000;
    let cursorY = -1000;
    let prevCursorX = -1000;
    let prevCursorY = -1000;
    let cursorVx = 0;
    let cursorVy = 0;
    let grabbedIdx: number | null = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let didDragMove = false;
    let hoverOrbIdx: number | null = null;

    const getLocalPoint = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const resolveStaticObstacles = (orb: OrbBody) => {
      for (let k = 0; k < obstacles.length; k += 1) {
        const box = obstacles[k];
        const closestX = clamp(orb.x, box.left, box.right);
        const closestY = clamp(orb.y, box.top, box.bottom);
        const dx = orb.x - closestX;
        const dy = orb.y - closestY;
        const distSq = dx * dx + dy * dy;
        const r = orb.radius;

        if (distSq < r * r) {
          if (distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = r - dist;
            orb.x += nx * overlap;
            orb.y += ny * overlap;

            const vn = orb.vx * nx + orb.vy * ny;
            if (vn < 0) {
              orb.vx -= (1 + RESTITUTION_WALL) * vn * nx;
              orb.vy -= (1 + RESTITUTION_WALL) * vn * ny;
              // Tangent floor roll friction on top of contact blocks
              if (ny < -0.5) {
                orb.vx *= 0.975;
                orb.omega += (orb.vx / r - orb.omega) * 0.2;
              }
            }
          } else {
            // Inside AABB fallback: push up to top ledge
            orb.y = box.top - r;
            if (orb.vy > 0) orb.vy = -orb.vy * RESTITUTION_WALL;
          }
        }
      }
    };

    const stepPhysics = (dt: number) => {
      const subDt = dt / SUBSTEPS;

      for (let s = 0; s < SUBSTEPS; s += 1) {
        for (let i = 0; i < orbs.length; i += 1) {
          const orb = orbs[i];
          if (!orb.spawned) continue;

          if (grabbedIdx === i && pointerActive) {
            const kSpring = 24;
            const targetVx = (cursorX - orb.x) * kSpring;
            const targetVy = (cursorY - orb.y) * kSpring;
            orb.vx = clamp(targetVx, -1600, 1600);
            orb.vy = clamp(targetVy, -1600, 1600);
            orb.x += orb.vx * subDt;
            orb.y += orb.vy * subDt;
            orb.omega = clamp(orb.vx / orb.radius, -14, 14);
          } else {
            orb.vy += GRAVITY * subDt;
            orb.vx *= 1 - 0.14 * subDt;
            orb.vy *= 1 - 0.08 * subDt;
            orb.omega *= 1 - 0.35 * subDt;

            orb.x += orb.vx * subDt;
            orb.y += orb.vy * subDt;
            orb.angle += orb.omega * subDt;
          }

          if (!orb.entered && orb.y > orb.radius + 16) {
            orb.entered = true;
          }

          // Arena perimeter boundaries
          const leftWall = 12 + orb.radius;
          const rightWall = Math.max(leftWall + 40, width - 12 - orb.radius);
          const floorLimit = floorY - orb.radius - 2;

          if (orb.x < leftWall) {
            orb.x = leftWall;
            orb.vx = Math.abs(orb.vx) * RESTITUTION_WALL;
            orb.omega += orb.vy * 0.01;
          } else if (orb.x > rightWall) {
            orb.x = rightWall;
            orb.vx = -Math.abs(orb.vx) * RESTITUTION_WALL;
            orb.omega -= orb.vy * 0.01;
          }

          if (orb.entered && orb.y < 14 + orb.radius) {
            orb.y = 14 + orb.radius;
            if (orb.vy < 0) orb.vy = Math.abs(orb.vy) * RESTITUTION_WALL;
          }

          if (orb.y > floorLimit) {
            orb.y = floorLimit;
            if (orb.vy > 0) {
              orb.vy = -orb.vy * RESTITUTION_WALL;
              if (Math.abs(orb.vy) < 42) orb.vy = 0;
            }
            orb.vx *= 0.985;
            orb.omega += (orb.vx / orb.radius - orb.omega) * 0.18;
          }

          resolveStaticObstacles(orb);

          // Mouse brush kinematic repulsor collider (when not dragging an orb)
          if (pointerActive && grabbedIdx === null) {
            const brushR = orb.radius * 0.56;
            const dx = orb.x - cursorX;
            const dy = orb.y - cursorY;
            const distSq = dx * dx + dy * dy;
            const minDist = orb.radius + brushR;

            if (distSq < minDist * minDist) {
              const dist = Math.max(1, Math.sqrt(distSq));
              const nx = dx / dist;
              const ny = dy / dist;
              const pen = minDist - dist;

              orb.x += nx * pen * 0.72;
              orb.y += ny * pen * 0.72;

              const kick =
                210 + clamp(Math.hypot(cursorVx, cursorVy) * 0.34, 0, 520);
              orb.vx += nx * kick + clamp(cursorVx * 0.16, -240, 240);
              orb.vy += ny * kick - 135;
              orb.omega += nx * 1.4;
            }
          }
        }

        // Pairwise rigid-body circle-circle collisions
        for (let i = 0; i < orbs.length; i += 1) {
          const a = orbs[i];
          if (!a.spawned) continue;
          for (let j = i + 1; j < orbs.length; j += 1) {
            const b = orbs[j];
            if (!b.spawned) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const minDist = a.radius + b.radius;
            const distSq = dx * dx + dy * dy;

            if (distSq < minDist * minDist) {
              const dist = Math.max(0.01, Math.sqrt(distSq));
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDist - dist;

              const aStatic = grabbedIdx === i;
              const bStatic = grabbedIdx === j;
              if (!aStatic && !bStatic) {
                a.x -= nx * overlap * 0.5;
                a.y -= ny * overlap * 0.5;
                b.x += nx * overlap * 0.5;
                b.y += ny * overlap * 0.5;
              } else if (aStatic && !bStatic) {
                b.x += nx * overlap;
                b.y += ny * overlap;
              } else if (!aStatic && bStatic) {
                a.x -= nx * overlap;
                a.y -= ny * overlap;
              }

              const rvx = b.vx - a.vx;
              const rvy = b.vy - a.vy;
              const velAlongNormal = rvx * nx + rvy * ny;

              if (velAlongNormal < 0) {
                const jImpulse =
                  -(1 + RESTITUTION_ORB) * velAlongNormal * 0.5;
                const ix = jImpulse * nx;
                const iy = jImpulse * ny;

                if (!aStatic) {
                  a.vx -= ix;
                  a.vy -= iy;
                  a.omega -= (rvx * ny - rvy * nx) * 0.004;
                }
                if (!bStatic) {
                  b.vx += ix;
                  b.vy += iy;
                  b.omega += (rvx * ny - rvy * nx) * 0.004;
                }
              }
            }
          }
        }
      }
    };

    const bounceBurstAt = (
      clickX: number,
      clickY: number,
      hitIdx: number | null
    ) => {
      if (hitIdx !== null) {
        const direct = orbs[hitIdx];
        const sideSign =
          clickX < direct.x
            ? 1
            : clickX > direct.x
            ? -1
            : hitIdx % 2 === 0
            ? 1
            : -1;
        direct.vy = -860 - Math.random() * 200;
        direct.vx += sideSign * (280 + Math.random() * 200);
        direct.omega += sideSign * (5.5 + Math.random() * 4);
      }

      // Rank nearby spawned orbs so clicks also send playful chain bounces
      const ranked = orbs
        .map((orb, idx) => ({
          orb,
          idx,
          dist: Math.hypot(orb.x - clickX, orb.y - clickY),
        }))
        .filter((item) => item.orb.spawned && item.idx !== hitIdx)
        .sort((a, b) => a.dist - b.dist);

      const affectCount =
        hitIdx !== null ? Math.min(5, ranked.length) : Math.min(7, ranked.length);
      for (let k = 0; k < affectCount; k += 1) {
        const { orb, idx, dist } = ranked[k];
        if (hitIdx !== null && dist > orb.radius * 5.2 && k > 2) break;
        const falloff = clamp(1 - dist / Math.max(width * 0.45, 320), 0.35, 1);
        const dirX =
          orb.x !== clickX
            ? Math.sign(orb.x - clickX)
            : idx % 2 === 0
            ? 1
            : -1;
        orb.vy = Math.min(orb.vy, (-560 - Math.random() * 320) * falloff);
        orb.vx += dirX * (220 + Math.random() * 240) * falloff;
        orb.omega += dirX * (3.2 + Math.random() * 4) * falloff;
      }
    };

    const findOrbAt = (px: number, py: number): number | null => {
      for (let i = orbs.length - 1; i >= 0; i -= 1) {
        const orb = orbs[i];
        if (!orb.spawned) continue;
        if (Math.hypot(orb.x - px, orb.y - py) <= orb.radius * 1.06) {
          return i;
        }
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      const { x, y } = getLocalPoint(e.clientX, e.clientY);
      pointerActive = true;
      cursorX = x;
      cursorY = y;
      prevCursorX = x;
      prevCursorY = y;
      dragStartX = x;
      dragStartY = y;
      didDragMove = false;
      grabbedIdx = findOrbAt(x, y);
      if (grabbedIdx !== null) {
        activeRenderer.domElement.style.cursor = "grabbing";
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const { x, y } = getLocalPoint(e.clientX, e.clientY);
      pointerActive = true;
      prevCursorX = cursorX;
      prevCursorY = cursorY;
      cursorX = x;
      cursorY = y;

      if (grabbedIdx !== null && Math.hypot(x - dragStartX, y - dragStartY) > 6) {
        didDragMove = true;
      }

      if (grabbedIdx === null) {
        const hit = findOrbAt(x, y);
        if (hit !== hoverOrbIdx) {
          hoverOrbIdx = hit;
          activeRenderer.domElement.style.cursor = hit !== null ? "grab" : "pointer";
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const { x, y } = getLocalPoint(e.clientX, e.clientY);
      const releasedOrb = grabbedIdx;
      const wasClick = !didDragMove;
      grabbedIdx = null;
      didDragMove = false;
      activeRenderer.domElement.style.cursor =
        findOrbAt(x, y) !== null ? "grab" : "pointer";

      if (wasClick) {
        bounceBurstAt(x, y, releasedOrb);
      }
    };

    const onPointerLeave = () => {
      pointerActive = false;
      cursorX = -1000;
      cursorY = -1000;
      grabbedIdx = null;
      didDragMove = false;
      hoverOrbIdx = null;
      activeRenderer.domElement.style.cursor = "pointer";
    };

    const domEl = activeRenderer.domElement;
    domEl.addEventListener("pointerdown", onPointerDown);
    domEl.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    domEl.addEventListener("pointerleave", onPointerLeave);

    let hasStartedCascade = false;
    let isInView = false;
    let spawnedCount = 0;
    let spawnTimer: number | null = null;
    let rafId = 0;
    let lastTime = performance.now();

    const syncMeshesAndRender = () => {
      let totalSpeed = 0;
      for (let i = 0; i < orbs.length; i += 1) {
        const orb = orbs[i];
        if (!orb.spawned) continue;

        const targetTiltX = orb.restTiltX + clamp(orb.vy * 0.00042, -0.42, 0.42);
        const targetTiltY = orb.restTiltY + clamp(orb.vx * 0.00042, -0.42, 0.42);
        orb.tiltX += (targetTiltX - orb.tiltX) * 0.16;
        orb.tiltY += (targetTiltY - orb.tiltY) * 0.16;

        orb.mesh.position.set(orb.x, -orb.y, 0);
        orb.mesh.scale.set(orb.radius, orb.radius, orb.radius * 0.88);
        orb.mesh.rotation.set(orb.tiltX, orb.tiltY, -orb.angle);

        orb.shadowMesh.position.set(
          orb.x + orb.radius * 0.11,
          -orb.y - orb.radius * 0.14,
          -orb.radius * 0.96
        );
        orb.shadowMesh.scale.set(orb.radius, orb.radius, 1);

        totalSpeed += Math.hypot(orb.vx, orb.vy);
      }
      container.setAttribute(
        "data-orbs-active-motion",
        String(Math.round(totalSpeed))
      );
      activeRenderer.render(scene, camera);
    };

    if (reducedMotion) {
      for (let i = 0; i < orbs.length; i += 1) {
        orbs[i].spawned = true;
        orbs[i].entered = true;
        orbs[i].y = floorY - orbs[i].radius - (i >= 10 ? orbs[i].radius * 1.9 : 0);
        orbs[i].vx = 0;
        orbs[i].vy = 0;
        orbs[i].omega = 0;
        orbs[i].mesh.visible = true;
        orbs[i].shadowMesh.visible = true;
      }
      for (let step = 0; step < 30; step += 1) {
        stepPhysics(0.016);
      }
      container.setAttribute("data-orbs-spawned", String(orbs.length));
      syncMeshesAndRender();
    }

    const scheduleNextSpawn = () => {
      if (spawnedCount >= orbs.length) return;
      const orb = orbs[spawnedCount];
      orb.spawned = true;
      orb.mesh.visible = true;
      orb.shadowMesh.visible = true;
      spawnedCount += 1;
      container.setAttribute("data-orbs-spawned", String(spawnedCount));

      if (spawnedCount < orbs.length) {
        spawnTimer = window.setTimeout(scheduleNextSpawn, 85);
      }
    };

    const tick = (now: number) => {
      const rawDt = (now - lastTime) * 0.001;
      lastTime = now;
      const dt = Math.min(0.032, Math.max(0.001, rawDt));

      if (pointerActive && prevCursorX > -500) {
        cursorVx = (cursorX - prevCursorX) / dt;
        cursorVy = (cursorY - prevCursorY) / dt;
        prevCursorX = cursorX;
        prevCursorY = cursorY;
      } else {
        cursorVx *= 0.8;
        cursorVy *= 0.8;
      }

      stepPhysics(dt);
      syncMeshesAndRender();

      if (isInView) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    };

    const startLoop = () => {
      if (reducedMotion) return;
      if (!rafId) {
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const footerSection = container.closest("footer") || container;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isInView = entry.isIntersecting;
          if (entry.isIntersecting) {
            measureArena();
            if (!reducedMotion) {
              if (!hasStartedCascade && entry.intersectionRatio >= 0.1) {
                hasStartedCascade = true;
                scheduleNextSpawn();
              }
              startLoop();
            } else {
              syncMeshesAndRender();
            }
          } else if (rafId) {
            window.cancelAnimationFrame(rafId);
            rafId = 0;
          }
        });
      },
      { threshold: [0, 0.1, 0.25] }
    );
    io.observe(footerSection);

    const resizeObserver = new ResizeObserver(() => {
      const oldW = width;
      measureArena();
      if (Math.abs(width - oldW) > 4) {
        const nextR = getOrbRadius(width);
        orbs.forEach((orb, idx) => {
          orb.radius = nextR * (idx % 3 === 0 ? 1.03 : idx % 3 === 1 ? 0.97 : 1);
          orb.x = clamp(orb.x, orb.radius + 16, width - orb.radius - 16);
        });
      }
      syncMeshesAndRender();
    });
    resizeObserver.observe(container);
    if (footerSection !== container) {
      resizeObserver.observe(footerSection);
    }

    return () => {
      io.disconnect();
      resizeObserver.disconnect();
      if (spawnTimer !== null) window.clearTimeout(spawnTimer);
      if (rafId) window.cancelAnimationFrame(rafId);
      domEl.removeEventListener("pointerdown", onPointerDown);
      domEl.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      domEl.removeEventListener("pointerleave", onPointerLeave);
      geometry.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();
      materials.forEach((mat) => mat.dispose());
      obsTex.dispose();
      vermTex.dispose();
      sandTex.dispose();
      emblemBumpTex.dispose();
      rawEnvTex.dispose();
      envTarget.dispose();
      pmrem.dispose();
      activeRenderer.dispose();
      if (domEl.parentNode === container) {
        container.removeChild(domEl);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-footer-orbs=""
      aria-label="Interactive glossy 3D studio spheres — click or brush to bounce"
      className="absolute inset-0 z-20"
    />
  );
}
