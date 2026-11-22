import type React from "react";
import {
  LinearFilter,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector4,
  VideoTexture,
} from "three";
import { getDevicePerfTier } from "@/lib/deviceTier";
import { scheduleIdle } from "@/lib/dom";
import type { WorkProjectItem } from "@/data/site";
import { WORK_CARD_STRIDE } from "@/three/constants";
import { createManagedRenderer } from "@/three/webglUtils";
import {
  SHOWCASE_INNER_UV,
  WORK_PLANE_HEIGHT,
  WORK_PLANE_WIDTH,
  createProjectTexture,
  type ProjectTextureHandle,
} from "@/three/workTextures";

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

    // Architectural corner upward lift during glide
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

    // Unconditional sampling preserves 2x2 quad derivatives for mipmaps
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

export interface WorkCarouselMountOptions {
  container: HTMLDivElement;
  projects: readonly WorkProjectItem[];
  captionContentRef: React.RefObject<HTMLDivElement | null>;
  targetTrackRef: React.RefObject<number>;
  currentTrackRef: React.RefObject<number>;
  smoothVelRef: React.RefObject<number>;
  activityRef: React.RefObject<number>;
  isDraggingRef: React.RefObject<boolean>;
  wheelSnapTimerRef: React.RefObject<number | null>;
  activeIdxRef: React.RefObject<number>;
  onActiveIdxChange: (idx: number) => void;
  onWebglFailed: () => void;
}

export interface WorkCarouselController {
  wake: () => void;
  kickAllVideos: () => void;
  dispose: () => void;
}

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    callback: (now: number, metadata: unknown) => void
  ) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

interface VideoEntry {
  video: HTMLVideoElement;
  texture: VideoTexture;
  isVisible: boolean;
  rvfcId: number | null;
  hasNewFrame: boolean;
  lastRenderedTime: number;
  startLoad: () => void;
  tryPlay: () => void;
  armFrameCallback: () => void;
  cancelFrameCallback: () => void;
  onCanPlay: () => void;
  onLoadedData: () => void;
  onPlaying: () => void;
}

export function mountWorkCarouselScene({
  container,
  projects,
  captionContentRef,
  targetTrackRef,
  currentTrackRef,
  smoothVelRef,
  activityRef,
  isDraggingRef,
  wheelSnapTimerRef,
  activeIdxRef,
  onActiveIdxChange,
  onWebglFailed,
}: WorkCarouselMountOptions): WorkCarouselController {
  const count = projects.length;
  const totalSpan = count * WORK_CARD_STRIDE;
  const perf = getDevicePerfTier();

  const activeRenderer = createManagedRenderer(container, {
    maxDpr: perf.maxDpr,
    className: "block h-full w-full",
    touchAction: "pan-y pinch-zoom",
  });
  if (!activeRenderer) {
    queueMicrotask(onWebglFailed);
    return { wake: () => {}, kickAllVideos: () => {}, dispose: () => {} };
  }

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 16 / 9, 0.1, 60);
  camera.position.set(0, 0, 6.5);
  camera.lookAt(0, 0, 0);

  const geometry = new PlaneGeometry(
    WORK_PLANE_WIDTH,
    WORK_PLANE_HEIGHT,
    perf.planeSegs[0],
    perf.planeSegs[1]
  );

  let rafId = 0;
  let isInView = false;
  let disposed = false;
  let videoPreloadArmed = false;
  let needsForcedRender = true;
  let wasSettled = false;

  const scheduleLoop = () => {
    if (disposed || !isInView || document.hidden || rafId !== 0) return;
    rafId = window.requestAnimationFrame(tick);
  };

  const wake = () => {
    if (disposed) return;
    needsForcedRender = true;
    if (isInView) scheduleLoop();
    else renderFrame();
  };

  const materials: ShaderMaterial[] = [];
  const meshes: Mesh[] = [];
  let videoEntries: (VideoEntry | null)[] = [];

  const textureHandles: ProjectTextureHandle[] = projects.map((p, idx) =>
    createProjectTexture(activeRenderer, p, (loadedTex) => {
      if (disposed) return;
      const mat = materials[idx];
      if (mat) {
        mat.uniforms.uMap.value = loadedTex;
        if (!videoEntries[idx]) {
          mat.uniforms.uVideoMap.value = loadedTex;
        }
      }
      wake();
    })
  );

  const innerRectVec = new Vector4(
    SHOWCASE_INNER_UV.left,
    SHOWCASE_INNER_UV.bottom,
    SHOWCASE_INNER_UV.right,
    SHOWCASE_INNER_UV.top
  );

  let supportsRVFC = false;

  videoEntries = projects.map((p, idx) => {
    if (!p.videoSrc) return null;
    const video = document.createElement("video") as VideoWithFrameCallback;
    video.src = p.videoSrc;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.crossOrigin = "anonymous";

    const hasRVFC = typeof video.requestVideoFrameCallback === "function";
    if (hasRVFC) supportsRVFC = true;

    const videoTex = new VideoTexture(video);
    videoTex.colorSpace = SRGBColorSpace;
    videoTex.minFilter = LinearFilter;
    videoTex.magFilter = LinearFilter;
    videoTex.generateMipmaps = false;

    let hasLoaded = false;
    const entry: VideoEntry = {
      video,
      texture: videoTex,
      isVisible:
        Math.abs(wrapTrackOffset(idx * WORK_CARD_STRIDE, totalSpan)) <=
        WORK_CARD_STRIDE * 1.35,
      rvfcId: null,
      hasNewFrame: false,
      lastRenderedTime: -1,
      cancelFrameCallback: () => {
        if (entry.rvfcId !== null && hasRVFC) {
          video.cancelVideoFrameCallback?.(entry.rvfcId);
          entry.rvfcId = null;
        }
      },
      armFrameCallback: () => {
        if (
          !hasRVFC ||
          entry.rvfcId !== null ||
          disposed ||
          !isInView ||
          document.hidden ||
          !entry.isVisible ||
          video.paused
        ) {
          return;
        }
        entry.rvfcId = video.requestVideoFrameCallback!(() => {
          entry.rvfcId = null;
          if (disposed) return;
          entry.hasNewFrame = true;
          if (isInView && !document.hidden && entry.isVisible) {
            scheduleLoop();
            if (!video.paused) entry.armFrameCallback();
          }
        });
      },
      startLoad: () => {
        if (!hasLoaded) {
          hasLoaded = true;
          video.preload = "auto";
          video.load();
        }
        if (isInView && entry.isVisible) entry.tryPlay();
      },
      tryPlay: () => {
        if (!hasLoaded || !isInView || !entry.isVisible) return;
        if (video.paused) video.play().catch(() => {});
        else entry.armFrameCallback();
      },
      onCanPlay: () => {
        entry.hasNewFrame = true;
        entry.tryPlay();
        syncNearbyVideos();
        wake();
      },
      onLoadedData: () => {
        entry.hasNewFrame = true;
        syncNearbyVideos();
        wake();
      },
      onPlaying: () => {
        entry.hasNewFrame = true;
        entry.armFrameCallback();
        wake();
      },
    };

    video.addEventListener("canplay", entry.onCanPlay);
    video.addEventListener("loadeddata", entry.onLoadedData);
    video.addEventListener("playing", entry.onPlaying);

    return entry;
  });

  for (let i = 0; i < count; i += 1) {
    const videoEntry = videoEntries[i];
    const mat = new ShaderMaterial({
      uniforms: {
        uMap: { value: textureHandles[i].texture },
        uVideoMap: {
          value: videoEntry ? videoEntry.texture : textureHandles[i].texture,
        },
        uHasVideo: { value: 0 },
        uInnerRect: { value: innerRectVec },
        uOffset: { value: i * WORK_CARD_STRIDE },
        uActivity: { value: 0 },
        uVelocity: { value: 0 },
        uPlaneY: { value: PLANE_Y_OFFSET },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });
    const mesh = new Mesh(geometry, mat);
    mesh.frustumCulled = false;
    scene.add(mesh);
    materials.push(mat);
    meshes.push(mesh);
  }

  const immediateTextureSet = new Set<number>();
  [0, 1, count - 1].forEach((idx) => {
    if (idx >= 0 && idx < count && !immediateTextureSet.has(idx)) {
      immediateTextureSet.add(idx);
      textureHandles[idx].startLoad();
    }
  });

  const deferredIndices: number[] = [];
  for (let i = 0; i < count; i += 1) {
    if (!immediateTextureSet.has(i)) deferredIndices.push(i);
  }

  let deferredCursor = 0;
  let cancelDeferredLoad: (() => void) | null = null;

  const scheduleNextTextureLoad = () => {
    if (disposed || deferredCursor >= deferredIndices.length) return;
    cancelDeferredLoad = scheduleIdle(
      () => {
        cancelDeferredLoad = null;
        if (disposed || deferredCursor >= deferredIndices.length) return;
        const idx = deferredIndices[deferredCursor];
        deferredCursor += 1;
        textureHandles[idx].startLoad();
        scheduleNextTextureLoad();
      },
      120,
      45
    );
  };
  scheduleNextTextureLoad();

  const videoLoadRadius = perf.isLowTier
    ? WORK_CARD_STRIDE * 0.65
    : WORK_CARD_STRIDE * 1.35;

  const isCenterVideoBlocking = () =>
    videoEntries.some((entry, idx) => {
      if (!entry) return false;
      const wrapped = wrapTrackOffset(
        idx * WORK_CARD_STRIDE + currentTrackRef.current,
        totalSpan
      );
      return (
        Math.abs(wrapped) <= WORK_CARD_STRIDE * 0.65 && entry.video.readyState < 2
      );
    });

  const syncNearbyVideos = () => {
    if (!videoPreloadArmed || disposed) return;
    const centerBlocking = isCenterVideoBlocking();
    for (let i = 0; i < count; i += 1) {
      const entry = videoEntries[i];
      if (!entry) continue;
      const wrapped = wrapTrackOffset(
        i * WORK_CARD_STRIDE + currentTrackRef.current,
        totalSpan
      );
      const absWrapped = Math.abs(wrapped);
      if (
        absWrapped <= WORK_CARD_STRIDE * 0.65 ||
        (!centerBlocking && absWrapped <= videoLoadRadius)
      ) {
        entry.startLoad();
      }
    }
  };

  const kickAllVideos = () => {
    videoPreloadArmed = true;
    syncNearbyVideos();
    videoEntries.forEach((entry) => entry?.tryPlay());
    wake();
  };

  const pauseAllVideos = () => {
    videoEntries.forEach((entry) => {
      if (!entry) return;
      if (!entry.video.paused) entry.video.pause();
      entry.cancelFrameCallback();
    });
  };

  const renderFrame = (): boolean => {
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

    const motionSettled =
      !isDraggingRef.current &&
      Math.abs(targetTrackRef.current - currentTrackRef.current) < 0.0002 &&
      Math.abs(smoothVelRef.current) < 0.0002 &&
      Math.abs(activityRef.current) < 0.0008;

    if (motionSettled) {
      currentTrackRef.current = targetTrackRef.current;
      smoothVelRef.current = 0;
      activityRef.current = 0;
    }

    const centerBlocking =
      videoPreloadArmed && isInView ? isCenterVideoBlocking() : false;
    let hasVisiblePlayingVideo = false;
    let anyVideoHasNewFrame = false;

    for (let i = 0; i < count; i += 1) {
      const wrapped = wrapTrackOffset(
        i * WORK_CARD_STRIDE + currentTrackRef.current,
        totalSpan
      );
      const absWrapped = Math.abs(wrapped);
      const visible = absWrapped <= WORK_CARD_STRIDE * 1.75;
      const playEligible = visible && absWrapped <= WORK_CARD_STRIDE * 1.35;

      if (absWrapped <= WORK_CARD_STRIDE * 2.1) {
        textureHandles[i].startLoad();
      }

      meshes[i].visible = visible;
      materials[i].uniforms.uOffset.value = wrapped;
      materials[i].uniforms.uActivity.value = activityRef.current;
      materials[i].uniforms.uVelocity.value = smoothVelRef.current;

      const videoEntry = videoEntries[i];
      if (videoEntry) {
        videoEntry.isVisible = playEligible;
        if (
          videoPreloadArmed &&
          isInView &&
          (absWrapped <= WORK_CARD_STRIDE * 0.65 ||
            (!centerBlocking && absWrapped <= videoLoadRadius))
        ) {
          videoEntry.startLoad();
        }
        const hasReadyVideo = videoEntry.video.readyState >= 2;
        materials[i].uniforms.uHasVideo.value = hasReadyVideo ? 1.0 : 0.0;
        if (isInView && !document.hidden && playEligible) {
          if (videoEntry.video.paused && hasReadyVideo) videoEntry.tryPlay();
          if (!videoEntry.video.paused && hasReadyVideo) {
            hasVisiblePlayingVideo = true;
            videoEntry.armFrameCallback();
            if (
              (supportsRVFC && videoEntry.hasNewFrame) ||
              (!supportsRVFC &&
                videoEntry.video.currentTime !== videoEntry.lastRenderedTime)
            ) {
              anyVideoHasNewFrame = true;
            }
          }
        } else {
          if (!videoEntry.video.paused) videoEntry.video.pause();
          videoEntry.cancelFrameCallback();
        }
      }
    }

    const rawIdx = Math.round(-currentTrackRef.current / WORK_CARD_STRIDE);
    const nextIdx = ((rawIdx % count) + count) % count;
    if (nextIdx !== activeIdxRef.current) {
      activeIdxRef.current = nextIdx;
      onActiveIdxChange(nextIdx);
    }

    if (captionContentRef.current) {
      const activeWrapped = wrapTrackOffset(
        nextIdx * WORK_CARD_STRIDE + currentTrackRef.current,
        totalSpan
      );
      const distNorm = Math.min(
        1,
        Math.abs(activeWrapped) / (WORK_CARD_STRIDE * 0.48)
      );
      const opacity = Math.max(0.18, 1 - distNorm * 0.84);
      const shiftY = distNorm * 16;
      captionContentRef.current.style.opacity = opacity.toFixed(3);
      captionContentRef.current.style.transform = `translate3d(0, ${shiftY.toFixed(
        1
      )}px, 0)`;
    }

    const shouldRender =
      !motionSettled ||
      !wasSettled ||
      wheelSnapTimerRef.current !== null ||
      needsForcedRender ||
      anyVideoHasNewFrame;
    wasSettled = motionSettled;

    if (shouldRender) {
      activeRenderer.render(scene, camera);
      needsForcedRender = false;
      for (let i = 0; i < count; i += 1) {
        const videoEntry = videoEntries[i];
        if (videoEntry && videoEntry.isVisible && !videoEntry.video.paused) {
          videoEntry.hasNewFrame = false;
          videoEntry.lastRenderedTime = videoEntry.video.currentTime;
        }
      }
    }

    if (supportsRVFC) {
      return motionSettled && wheelSnapTimerRef.current === null;
    }
    return (
      motionSettled &&
      !hasVisiblePlayingVideo &&
      wheelSnapTimerRef.current === null
    );
  };

  function tick() {
    rafId = 0;
    if (disposed || !isInView || document.hidden) return;
    if (!renderFrame()) rafId = window.requestAnimationFrame(tick);
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
    wake();
  };

  handleResize();

  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(container);
  container.addEventListener("pointerdown", kickAllVideos);

  const handleWheel = (e: WheelEvent) => {
    if (
      Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.15 &&
      Math.abs(e.deltaX) > 3
    ) {
      e.preventDefault();
      targetTrackRef.current -= e.deltaX * 0.0065;
      if (wheelSnapTimerRef.current !== null) {
        window.clearTimeout(wheelSnapTimerRef.current);
      }
      wheelSnapTimerRef.current = window.setTimeout(() => {
        targetTrackRef.current =
          Math.round(targetTrackRef.current / WORK_CARD_STRIDE) * WORK_CARD_STRIDE;
        wheelSnapTimerRef.current = null;
        wake();
      }, 150);
      wake();
    }
  };
  container.addEventListener("wheel", handleWheel, { passive: false });

  const handleVisibility = () => {
    if (document.hidden) {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      pauseAllVideos();
    } else if (isInView) {
      syncNearbyVideos();
      videoEntries.forEach((entry) => entry?.tryPlay());
      wake();
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);

  const preloadIo = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        videoPreloadArmed = true;
        syncNearbyVideos();
        preloadIo.disconnect();
      }
    },
    { rootMargin: "650px 0px", threshold: 0 }
  );
  preloadIo.observe(container);

  const viewIo = new IntersectionObserver(
    (entries) => {
      const nextInView = entries.some((entry) => entry.isIntersecting);
      isInView = nextInView;
      if (nextInView && !document.hidden) {
        videoPreloadArmed = true;
        syncNearbyVideos();
        videoEntries.forEach((entry) => entry?.tryPlay());
        wake();
      } else {
        if (rafId !== 0) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
        pauseAllVideos();
      }
    },
    { rootMargin: "300px 0px", threshold: 0 }
  );
  viewIo.observe(container);

  return {
    wake,
    kickAllVideos,
    dispose: () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      cancelDeferredLoad?.();
      cancelDeferredLoad = null;
      if (wheelSnapTimerRef.current !== null) {
        window.clearTimeout(wheelSnapTimerRef.current);
        wheelSnapTimerRef.current = null;
      }
      preloadIo.disconnect();
      viewIo.disconnect();
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("pointerdown", kickAllVideos);
      resizeObserver.disconnect();
      geometry.dispose();
      materials.forEach((m) => m.dispose());
      textureHandles.forEach((h) => h.dispose());
      videoEntries.forEach((entry) => {
        if (!entry) return;
        entry.cancelFrameCallback();
        entry.video.removeEventListener("canplay", entry.onCanPlay);
        entry.video.removeEventListener("loadeddata", entry.onLoadedData);
        entry.video.removeEventListener("playing", entry.onPlaying);
        entry.video.pause();
        entry.video.removeAttribute("src");
        entry.video.load();
        entry.texture.dispose();
      });
      activeRenderer.dispose();
      if (activeRenderer.domElement.parentNode === container) {
        container.removeChild(activeRenderer.domElement);
      }
    },
  };
}
