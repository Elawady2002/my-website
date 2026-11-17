"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { StylizedText } from "@/components/StylizedText";
import {
  SHOWCASE_INNER_UV,
  createProjectTexture,
} from "@/components/workTextures";
import { siteConfig } from "@/data/site";

const VERTEX_SHADER = /* glsl */ `
  uniform float uAngle;
  uniform float uRadius;
  uniform float uVelocity;
  varying vec2 vUv;
  varying float vNdcX;

  void main() {
    vUv = uv;
    float alpha = uAngle + (position.x / uRadius);
    vec3 curved = vec3(
      uRadius * sin(alpha),
      position.y,
      -uRadius * cos(alpha)
    );
    curved.z += sin(uv.y * 3.14159265) * clamp(abs(uVelocity) * 4.0, 0.0, 0.45);
    vec4 mvPos = modelViewMatrix * vec4(curved, 1.0);
    vec4 clipPos = projectionMatrix * mvPos;
    vec2 ndc = clipPos.xy / max(abs(clipPos.w), 0.0001);
    float edgeFactor = max(abs(ndc.x) - 0.52, 0.0);
    float lensY = 1.0 + 0.34 * edgeFactor * edgeFactor;
    float lensX = 1.0 + 0.06 * ndc.x * ndc.x * (1.0 - 0.28 * ndc.y * ndc.y);
    clipPos.x *= lensX;
    clipPos.y *= lensY;
    vNdcX = clipPos.x / max(abs(clipPos.w), 0.0001);
    gl_Position = clipPos;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uVideoMap;
  uniform float uHasVideo;
  uniform vec4 uInnerRect;
  uniform float uVelocity;
  varying vec2 vUv;
  varying float vNdcX;

  vec3 srgbToLinear(vec3 c) {
    return mix(
      pow((c + 0.055) / 1.055, vec3(2.4)),
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
    float restEdge = pow(max(abs(vNdcX) - 0.62, 0.0) / 0.38, 2.2) * 0.016;
    float edge = restEdge + clamp(abs(uVelocity) * 0.05, 0.0, 0.016);
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

const CYLINDER_RADIUS = 6.2;

export function WorkSection() {
  const projects = siteConfig.workSection.projects;
  const count = projects.length;
  const stepAngle = (Math.PI * 2) / count;

  const introRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const captionRef = useRef<HTMLDivElement | null>(null);

  const [activeIdx, setActiveIdx] = useState(0);
  const [webglReady, setWebglReady] = useState(true);
  const activeIdxRef = useRef(0);

  const targetRotRef = useRef(0);
  const currentRotRef = useRef(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const dragStartRotRef = useRef(0);

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
    const camera = new THREE.PerspectiveCamera(37.5, 16 / 9, 0.1, 50);
    camera.position.set(0, 0, 1.45);
    camera.lookAt(0, 0, -1);

    const geometry = new THREE.PlaneGeometry(5.38, 3.22, 72, 48);
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
          uAngle: { value: i * stepAngle },
          uRadius: { value: CYLINDER_RADIUS },
          uVelocity: { value: 0 },
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
      activeRenderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w < 640 ? 58 : w < 1024 ? 46 : 37.5;
      camera.updateProjectionMatrix();
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const kickAllVideos = () => {
      videoEntries.forEach((entry) => entry?.tryPlay());
    };
    container.addEventListener("pointerdown", kickAllVideos);

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
      const prevRot = currentRotRef.current;
      currentRotRef.current +=
        (targetRotRef.current - currentRotRef.current) * 0.09;
      const velocity = currentRotRef.current - prevRot;

      for (let i = 0; i < count; i += 1) {
        const rawAngle = i * stepAngle + currentRotRef.current;
        const wrapped = Math.atan2(Math.sin(rawAngle), Math.cos(rawAngle));
        const visible = Math.abs(wrapped) < 1.85;
        meshes[i].visible = visible;
        materials[i].uniforms.uAngle.value = wrapped;
        materials[i].uniforms.uVelocity.value = velocity;

        const videoEntry = videoEntries[i];
        if (videoEntry) {
          materials[i].uniforms.uHasVideo.value =
            videoEntry.video.readyState >= 2 ? 1.0 : 0.0;
          if (visible && videoEntry.video.paused && videoEntry.video.readyState >= 2) {
            videoEntry.tryPlay();
          }
        }
      }

      const rawIdx = Math.round(-currentRotRef.current / stepAngle);
      const nextIdx = ((rawIdx % count) + count) % count;
      if (nextIdx !== activeIdxRef.current) {
        activeIdxRef.current = nextIdx;
        setActiveIdx(nextIdx);
      }

      if (captionRef.current) {
        const activeWrapped = Math.atan2(
          Math.sin(nextIdx * stepAngle + currentRotRef.current),
          Math.cos(nextIdx * stepAngle + currentRotRef.current)
        );
        const driftX = activeWrapped * 260;
        captionRef.current.style.transform = `translate3d(calc(-50% + ${driftX.toFixed(
          1
        )}px), 0, 0)`;
      }

      activeRenderer.render(scene, camera);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      io.disconnect();
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
  }, [count, projects, stepAngle]);

  const stepBy = (delta: number) => {
    const snapped = Math.round(targetRotRef.current / stepAngle) * stepAngle;
    targetRotRef.current = snapped - delta * stepAngle;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    dragStartRotRef.current = targetRotRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    targetRotRef.current += dx * 0.0028;
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const totalDx = e.clientX - startXRef.current;
    if (Math.abs(totalDx) > 40) {
      const snappedBase =
        Math.round(dragStartRotRef.current / stepAngle) * stepAngle;
      targetRotRef.current =
        totalDx < 0 ? snappedBase - stepAngle : snappedBase + stepAngle;
    } else if (Math.abs(totalDx) < 8) {
      const rect = e.currentTarget.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / Math.max(rect.width, 1);
      if (relX < 0.14) {
        stepBy(-1);
      } else if (relX > 0.86) {
        stepBy(1);
      } else {
        targetRotRef.current =
          Math.round(targetRotRef.current / stepAngle) * stepAngle;
      }
    } else {
      targetRotRef.current =
        Math.round(targetRotRef.current / stepAngle) * stepAngle;
    }
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

      {/* Part B: Interactive Three.js Concave 3D Glass Carousel */}
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
        className="relative w-full h-[100svh] min-h-[700px] max-h-[960px] overflow-hidden select-none cursor-grab active:cursor-grabbing -mt-4 sm:-mt-8 focus:outline-none"
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
          style={{ transform: "translate3d(-50%, 0, 0)" }}
          className="pointer-events-none absolute top-[9.5%] sm:top-[10.5%] left-1/2 z-20 text-center w-[90vw] max-w-[760px]"
        >
          <h3 className="text-[36px] sm:text-[56px] leading-[1.0] tracking-[-0.02em] font-normal uppercase text-[#e7e1d7]">
            <StylizedText text={activeProject.title} />
          </h3>
          <p className="mt-2 text-[12px] sm:text-[14px] uppercase tracking-[0.04em] text-[#e7e1d7]/65">
            <StylizedText text={activeProject.category} />
          </p>
        </div>

        {/* Bottom-Center Clean Counter */}
        <div
          data-work-counter=""
          className="pointer-events-none absolute bottom-[7.5%] sm:bottom-[8%] left-1/2 -translate-x-1/2 z-20 text-[13px] sm:text-[14px] font-normal tabular-nums tracking-[0.04em] text-[#e7e1d7]"
        >
          {counterLabel}
        </div>
      </section>
    </div>
  );
}
