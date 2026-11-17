"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { StylizedText } from "@/components/StylizedText";
import {
  SHOWCASE_INNER_UV,
  WORK_PLANE_HEIGHT,
  WORK_PLANE_WIDTH,
  createProjectTexture,
} from "@/components/workTextures";
import { siteConfig } from "@/data/site";

const CARD_STRIDE = 5.02;
const PLANE_Y_OFFSET = -0.33;

const VERTEX_SHADER = /* glsl */ `
  uniform float uOffset;
  uniform float uActivity;
  uniform float uVelocity;
  uniform float uPlaneY;
  varying vec2 vUv;
  varying float vCorner;

  void main() {
    vUv = uv;
    float zPull = uActivity * 1.25;
    float F = 1.56 * (1.0 - 0.14 * uActivity);
    float R = 1.88;
    float thetaMax = 1.24;

    float s = uOffset + position.x;
    float absS = abs(s);
    float sgn = s >= 0.0 ? 1.0 : -1.0;
    float conc = 0.05 * (s * s) / (2.5 + s * s);

    float wx;
    float wz;
    float theta;

    if (absS <= F) {
      wx = s;
      wz = conc - zPull;
      theta = 0.0;
    } else {
      float u = absS - F;
      float rawTh = u / R;
      if (rawTh <= thetaMax) {
        theta = rawTh;
        wx = sgn * (F + R * sin(theta));
        wz = conc + R * (1.0 - cos(theta)) - zPull;
      } else {
        theta = thetaMax;
        float rem = u - thetaMax * R;
        wx = sgn * (F + R * sin(thetaMax) + rem * cos(thetaMax));
        wz = conc + R * (1.0 - cos(thetaMax)) + rem * sin(thetaMax) - zPull;
      }
    }

    // Subtle liquid velocity shear & silk pillow during drag/glide
    float velShear = clamp(uVelocity * 1.35, -0.14, 0.14);
    wx += (uv.y - 0.5) * velShear;
    wz += sin(uv.x * 3.14159265) * sin(uv.y * 3.14159265) * clamp(abs(uVelocity) * 2.2, 0.0, 0.22);

    // Architectural corner upward lift matching tomdekoning.work mid-drag silhouette
    float wy = uPlaneY + position.y + 0.20 * (1.0 - cos(theta)) * (0.25 + 0.75 * uActivity);

    vCorner = clamp(theta / thetaMax, 0.0, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(wx, wy, wz, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uVideoMap;
  uniform float uHasVideo;
  uniform vec4 uInnerRect;
  uniform float uVelocity;
  varying vec2 vUv;
  varying float vCorner;

  vec3 srgbToLinear(vec3 c) {
    return mix(
      pow(max((c + 0.055) / 1.055, vec3(0.0)), vec3(2.4)),
      c / 12.92,
      vec3(lessThanEqual(c, vec3(0.04045)))
    );
  }

  vec3 sampleSlide(vec2 uv, vec2 fw) {
    vec3 baseCol = texture2D(uMap, uv).rgb;
    if (uHasVideo > 0.5) {
      vec2 lo = smoothstep(uInnerRect.xy - fw * 1.25, uInnerRect.xy + fw * 0.35, uv);
      vec2 hi = 1.0 - smoothstep(uInnerRect.zw - fw * 0.35, uInnerRect.zw + fw * 1.25, uv);
      float mask = lo.x * lo.y * hi.x * hi.y;
      if (mask > 0.001) {
        vec2 vidUv = (uv - uInnerRect.xy) / (uInnerRect.zw - uInnerRect.xy);
        vec3 vidCol = srgbToLinear(
          texture2D(uVideoMap, clamp(vidUv, vec2(0.001), vec2(0.999))).rgb
        );
        return mix(baseCol, vidCol, mask);
      }
    }
    return baseCol;
  }

  void main() {
    vec2 fw = max(fwidth(vUv), vec2(0.0004));
    float safeCorner = clamp(vCorner, 0.0, 1.0);
    float restEdge = pow(safeCorner, 1.75) * 0.022;
    float edge = restEdge + clamp(abs(uVelocity) * 0.075, 0.0, 0.015);
    vec2 uvR = clamp(vUv + vec2(edge, 0.0), vec2(0.002), vec2(0.998));
    vec2 uvG = clamp(vUv, vec2(0.002), vec2(0.998));
    vec2 uvB = clamp(vUv - vec2(edge, 0.0), vec2(0.002), vec2(0.998));

    float r = sampleSlide(uvR, fw).r;
    float g = sampleSlide(uvG, fw).g;
    float b = sampleSlide(uvB, fw).b;

    vec3 col = vec3(r, g, b);
    float glassRim = smoothstep(0.0, 0.04, vUv.x) * smoothstep(1.0, 0.96, vUv.x)
                   * smoothstep(0.0, 0.04, vUv.y) * smoothstep(1.0, 0.96, vUv.y);
    col *= mix(0.95, 1.0, glassRim);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function wrapTrackOffset(rawPos: number, totalSpan: number): number {
  return (
    ((((rawPos + totalSpan * 0.5) % totalSpan) + totalSpan) % totalSpan) -
    totalSpan * 0.5
  );
}

export function WorkSection() {
  const projects = siteConfig.workSection.projects;
  const count = projects.length;
  const totalSpan = count * CARD_STRIDE;

  const introRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const captionRef = useRef<HTMLDivElement | null>(null);
  const captionContentRef = useRef<HTMLDivElement | null>(null);

  const [activeIdx, setActiveIdx] = useState(0);
  const [webglReady, setWebglReady] = useState(true);
  const activeIdxRef = useRef(0);

  const targetTrackRef = useRef(0);
  const currentTrackRef = useRef(0);
  const smoothVelRef = useRef(0);
  const activityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const pointerVxRef = useRef(0);
  const dragStartTrackRef = useRef(0);
  const wheelSnapTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const el = introRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.setAttribute("data-revealed", "true");
          }
        });
      },
      { threshold: 0.18 }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = stageRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      queueMicrotask(() => setWebglReady(false));
      return;
    }

    const activeRenderer = renderer;
    activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    activeRenderer.domElement.className = "block h-full w-full";
    activeRenderer.domElement.style.touchAction = "pan-y pinch-zoom";
    container.appendChild(activeRenderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 60);
    camera.position.set(0, 0, 6.5);
    camera.lookAt(0, 0, 0);

    const geometry = new THREE.PlaneGeometry(
      WORK_PLANE_WIDTH,
      WORK_PLANE_HEIGHT,
      96,
      56
    );
    const textures = projects.map((p) =>
      createProjectTexture(THREE, activeRenderer, p)
    );
    const innerRectVec = new THREE.Vector4(
      SHOWCASE_INNER_UV.left,
      SHOWCASE_INNER_UV.bottom,
      SHOWCASE_INNER_UV.right,
      SHOWCASE_INNER_UV.top
    );

    const videoEntries: (
      | {
          video: HTMLVideoElement;
          texture: THREE.VideoTexture;
          tryPlay: () => void;
        }
      | null
    )[] = projects.map((p) => {
      if (!p.videoSrc) return null;
      const video = document.createElement("video");
      video.src = p.videoSrc;
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "auto";
      video.crossOrigin = "anonymous";

      const videoTex = new THREE.VideoTexture(video);
      videoTex.colorSpace = THREE.SRGBColorSpace;
      videoTex.minFilter = THREE.LinearFilter;
      videoTex.magFilter = THREE.LinearFilter;
      videoTex.generateMipmaps = false;

      const tryPlay = () => {
        if (video.paused) {
          video.play().catch(() => {});
        }
      };
      video.addEventListener("canplay", tryPlay);
      tryPlay();

      return { video, texture: videoTex, tryPlay };
    });

    const materials: THREE.ShaderMaterial[] = [];
    const meshes: THREE.Mesh[] = [];

    for (let i = 0; i < count; i += 1) {
      const videoEntry = videoEntries[i];
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: textures[i] },
          uVideoMap: { value: videoEntry ? videoEntry.texture : textures[i] },
          uHasVideo: { value: 0 },
          uInnerRect: { value: innerRectVec },
          uOffset: { value: i * CARD_STRIDE },
          uActivity: { value: 0 },
          uVelocity: { value: 0 },
          uPlaneY: { value: PLANE_Y_OFFSET },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
      });
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.frustumCulled = false;
      scene.add(mesh);
      materials.push(mat);
      meshes.push(mesh);
    }

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 1280;
      const h = container.clientHeight || 720;
      const aspect = w / Math.max(h, 1);
      const camZ = 7.15 + Math.max(0, (1.42 - aspect) * 8.6);
      const planeY = aspect >= 1.0 ? -0.33 : -0.18;
      activeRenderer.setSize(w, h, false);
      camera.aspect = aspect;
      camera.fov = 38;
      camera.position.set(0, 0, camZ);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      materials.forEach((m) => {
        m.uniforms.uPlaneY.value = planeY;
      });
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const kickAllVideos = () => {
      videoEntries.forEach((entry) => entry?.tryPlay());
    };
    container.addEventListener("pointerdown", kickAllVideos);

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.15 && Math.abs(e.deltaX) > 3) {
        e.preventDefault();
        targetTrackRef.current -= e.deltaX * 0.0065;
        if (wheelSnapTimerRef.current !== null) {
          window.clearTimeout(wheelSnapTimerRef.current);
        }
        wheelSnapTimerRef.current = window.setTimeout(() => {
          targetTrackRef.current =
            Math.round(targetTrackRef.current / CARD_STRIDE) * CARD_STRIDE;
          wheelSnapTimerRef.current = null;
        }, 150);
      }
    };
    container.addEventListener("wheel", handleWheel, { passive: false });

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          kickAllVideos();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(container);

    let rafId = 0;
    const tick = () => {
      const prevTrack = currentTrackRef.current;
      const lerpFactor = isDraggingRef.current ? 0.18 : 0.085;
      currentTrackRef.current +=
        (targetTrackRef.current - currentTrackRef.current) * lerpFactor;

      const rawVel = currentTrackRef.current - prevTrack;
      smoothVelRef.current += (rawVel - smoothVelRef.current) * 0.22;

      const wantActivity = isDraggingRef.current
        ? Math.min(1, 0.44 + Math.abs(smoothVelRef.current) * 6.5)
        : Math.min(1, Math.abs(smoothVelRef.current) * 5.4);
      const actRate = wantActivity > activityRef.current ? 0.14 : 0.075;
      activityRef.current += (wantActivity - activityRef.current) * actRate;

      for (let i = 0; i < count; i += 1) {
        const rawPos = i * CARD_STRIDE + currentTrackRef.current;
        const wrapped = wrapTrackOffset(rawPos, totalSpan);
        const visible = Math.abs(wrapped) <= CARD_STRIDE * 2.1;
        meshes[i].visible = visible;
        materials[i].uniforms.uOffset.value = wrapped;
        materials[i].uniforms.uActivity.value = activityRef.current;
        materials[i].uniforms.uVelocity.value = smoothVelRef.current;

        const videoEntry = videoEntries[i];
        if (videoEntry) {
          materials[i].uniforms.uHasVideo.value =
            videoEntry.video.readyState >= 2 ? 1.0 : 0.0;
          if (
            visible &&
            videoEntry.video.paused &&
            videoEntry.video.readyState >= 2
          ) {
            videoEntry.tryPlay();
          }
        }
      }

      const rawIdx = Math.round(-currentTrackRef.current / CARD_STRIDE);
      const nextIdx = ((rawIdx % count) + count) % count;
      if (nextIdx !== activeIdxRef.current) {
        activeIdxRef.current = nextIdx;
        setActiveIdx(nextIdx);
      }

      if (captionContentRef.current) {
        const activeWrapped = wrapTrackOffset(
          nextIdx * CARD_STRIDE + currentTrackRef.current,
          totalSpan
        );
        const distNorm = Math.min(
          1,
          Math.abs(activeWrapped) / (CARD_STRIDE * 0.48)
        );
        const opacity = Math.max(0.18, 1 - distNorm * 0.84);
        const shiftY = distNorm * 16;
        captionContentRef.current.style.opacity = opacity.toFixed(3);
        captionContentRef.current.style.transform = `translate3d(0, ${shiftY.toFixed(
          1
        )}px, 0)`;
      }

      activeRenderer.render(scene, camera);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (wheelSnapTimerRef.current !== null) {
        window.clearTimeout(wheelSnapTimerRef.current);
        wheelSnapTimerRef.current = null;
      }
      io.disconnect();
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("pointerdown", kickAllVideos);
      resizeObserver.disconnect();
      geometry.dispose();
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      videoEntries.forEach((entry) => {
        if (!entry) return;
        entry.video.removeEventListener("canplay", entry.tryPlay);
        entry.video.pause();
        entry.video.removeAttribute("src");
        entry.video.load();
        entry.texture.dispose();
      });
      activeRenderer.dispose();
      if (activeRenderer.domElement.parentNode === container) {
        container.removeChild(activeRenderer.domElement);
      }
    };
  }, [count, projects, totalSpan]);

  const stepBy = (delta: number) => {
    const snapped = Math.round(targetTrackRef.current / CARD_STRIDE) * CARD_STRIDE;
    targetTrackRef.current = snapped - delta * CARD_STRIDE;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (wheelSnapTimerRef.current !== null) {
      window.clearTimeout(wheelSnapTimerRef.current);
      wheelSnapTimerRef.current = null;
    }
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    pointerVxRef.current = 0;
    dragStartTrackRef.current = targetTrackRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const now = performance.now();
    const dt = Math.max(now - lastTimeRef.current, 1);
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    lastTimeRef.current = now;
    pointerVxRef.current = pointerVxRef.current * 0.55 + (dx / dt) * 0.45;

    const containerWidth =
      stageRef.current?.clientWidth || e.currentTarget.clientWidth || 1280;
    const worldPerPx =
      (containerWidth < 640 ? 9.5 : 7.2) / Math.max(containerWidth, 320);
    targetTrackRef.current += dx * worldPerPx;
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const totalDx = e.clientX - startXRef.current;
    const vx = pointerVxRef.current;
    const dragStartSnapped =
      Math.round(dragStartTrackRef.current / CARD_STRIDE) * CARD_STRIDE;

    if (Math.abs(totalDx) > 36 || Math.abs(vx) > 0.38) {
      if (Math.abs(targetTrackRef.current - dragStartSnapped) > CARD_STRIDE * 0.65) {
        targetTrackRef.current =
          Math.round(targetTrackRef.current / CARD_STRIDE) * CARD_STRIDE;
      } else {
        const dir = Math.abs(totalDx) >= 12 ? totalDx : vx;
        targetTrackRef.current =
          dragStartSnapped + (dir < 0 ? -CARD_STRIDE : CARD_STRIDE);
      }
    } else if (Math.abs(totalDx) < 8) {
      const rect = e.currentTarget.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / Math.max(rect.width, 1);
      if (relX < 0.2) {
        stepBy(-1);
      } else if (relX > 0.8) {
        stepBy(1);
      } else {
        targetTrackRef.current =
          Math.round(targetTrackRef.current / CARD_STRIDE) * CARD_STRIDE;
      }
    } else {
      targetTrackRef.current =
        Math.round(targetTrackRef.current / CARD_STRIDE) * CARD_STRIDE;
    }
    pointerVxRef.current = 0;
  };

  const activeProject = projects[activeIdx];
  const counterLabel = `${String(activeIdx + 1).padStart(2, "0")}/${String(
    count
  ).padStart(2, "0")}`;

  return (
    <div className="relative z-10 w-full bg-[#0b0b0b]">
      {/* Part A: Giant Staggered WORK Intro Heading */}
      <div
        id="work-intro"
        ref={introRef}
        className="px-4 sm:px-6 pt-16 sm:pt-24"
      >
        <h6 className="text-[13px] sm:text-[14px] font-normal uppercase tracking-[0.05em] text-[#e7e1d7]/80">
          <StylizedText text={siteConfig.workSection.eyebrow} />
        </h6>

        <h2
          aria-label={siteConfig.workSection.heading}
          className="mt-4 w-full text-center text-[27vw] leading-[0.82] tracking-[-0.04em] font-normal uppercase text-[#e7e1d7] select-none overflow-clip"
        >
          {Array.from(siteConfig.workSection.heading).map((char, idx) => {
            const isO = char === "O" || char === "o";
            return (
              <span
                key={idx}
                style={
                  { "--work-delay": `${idx * 70}ms` } as React.CSSProperties
                }
                className={`work-intro-char inline-block ${
                  isO ? "playfair-o" : ""
                }`}
              >
                {char}
              </span>
            );
          })}
        </h2>
      </div>

      {/* Part B: Interactive Three.js Rounded-Box 3D Glass Carousel */}
      <section
        id="work"
        aria-label="Selected projects carousel"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") stepBy(1);
          if (e.key === "ArrowLeft") stepBy(-1);
        }}
        tabIndex={0}
        className="relative w-full h-[100svh] min-h-[820px] max-h-[1020px] overflow-hidden select-none cursor-grab active:cursor-grabbing focus:outline-none"
      >
        {/* WebGL Three.js Canvas Mount (rendered before caption in DOM for clean layer order) */}
        {webglReady ? (
          <div ref={stageRef} className="absolute inset-0 z-10" />
        ) : (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
            <div
              style={{ backgroundColor: activeProject.stageBg }}
              className="w-full max-w-[780px] aspect-[16/10] rounded-2xl border border-[#e7e1d7]/15 p-10 flex flex-col justify-between"
            >
              <span className="text-xs uppercase tracking-widest text-[#f34213]">
                {activeProject.badge}
              </span>
              <div>
                <h4 className="text-4xl font-semibold text-[#e7e1d7]">
                  {activeProject.headline}
                </h4>
                <p className="mt-3 text-base text-[#e7e1d7]/75">
                  {activeProject.subcopy}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top-Center Floating Project Caption */}
        <div
          ref={captionRef}
          aria-live="polite"
          className="pointer-events-none absolute top-[84px] sm:top-[102px] left-1/2 -translate-x-1/2 z-20 text-center w-[90vw] max-w-[760px]"
        >
          <div ref={captionContentRef} className="will-change-transform">
            <h3 className="text-[28px] sm:text-[46px] leading-[1.0] tracking-[-0.02em] font-normal uppercase text-[#e7e1d7]">
              <StylizedText text={activeProject.title} />
            </h3>
            <p className="mt-2 text-[11px] sm:text-[13px] leading-[1.3] uppercase tracking-[0.05em] text-[#e7e1d7]/65">
              <StylizedText text={activeProject.category} />
            </p>
          </div>
        </div>

        {/* Bottom-Center Clean Counter */}
        <div
          data-work-counter=""
          className="pointer-events-none absolute bottom-[28px] sm:bottom-[34px] left-1/2 -translate-x-1/2 z-20 text-[13px] sm:text-[14px] font-normal tabular-nums tracking-[0.04em] text-[#e7e1d7]"
        >
          {counterLabel}
        </div>
      </section>
    </div>
  );
}
