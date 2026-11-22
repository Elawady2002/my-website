export interface DevicePerfTier {
  isMobile: boolean;
  isLowTier: boolean;
  maxDpr: number;
  workTexWidth: number;
  planeSegs: readonly [number, number];
  orbColorSize: number;
  orbBumpSize: number;
  orbSegs: readonly [number, number];
}

/**
 * Classifies the client device GPU/memory tier so WebGL renderers scale
 * pixel ratios, mesh subdivisions, and offscreen texture resolutions safely
 * on mobile and low-memory hardware without altering desktop visual fidelity.
 */
export function getDevicePerfTier(): DevicePerfTier {
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isLowTier: false,
      maxDpr: 2,
      workTexWidth: 2240,
      planeSegs: [96, 56],
      orbColorSize: 1024,
      orbBumpSize: 512,
      orbSegs: [64, 48],
    };
  }

  const isMobile = window.innerWidth < 768;
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  const isWeakHardware = cores <= 4 || mem <= 4;
  const isLowTier = isMobile || isWeakHardware;

  return {
    isMobile,
    isLowTier,
    maxDpr: isLowTier ? 1.5 : 2,
    workTexWidth: isMobile
      ? isWeakHardware
        ? 1152
        : 1344
      : isLowTier
      ? 1600
      : 2240,
    planeSegs: isLowTier ? [64, 36] : [96, 56],
    orbColorSize: isLowTier ? 512 : 1024,
    orbBumpSize: isLowTier ? 256 : 512,
    orbSegs: isLowTier ? [44, 32] : [64, 48],
  };
}
