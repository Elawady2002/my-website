import {
  Color,
  DirectionalLight,
  Euler,
  Group,
  Matrix3,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  Quaternion,
  Scene,
  SphereGeometry,
  Vector3,
} from "three";
import { getDevicePerfTier } from "@/lib/deviceTier";
import { BALL_BOX_SCALE } from "@/three/constants";
import {
  addStudioThreePointLights,
  createManagedRenderer,
  createPmremEnv,
  createStudioEnvTexture,
} from "@/three/webglUtils";

export interface PreloaderFootballController {
  renderFrame: (spinAngle: number, squashX: number, squashY: number) => void;
  dispose: () => void;
}

const FOV_DEG = 22;

function buildFootballFacePlanes(): Vector3[] {
  const phi = (1 + Math.sqrt(5)) * 0.5;

  const icoVerts: Vector3[] = [
    new Vector3(0, 1, phi),
    new Vector3(0, -1, phi),
    new Vector3(0, 1, -phi),
    new Vector3(0, -1, -phi),
    new Vector3(1, phi, 0),
    new Vector3(-1, phi, 0),
    new Vector3(1, -phi, 0),
    new Vector3(-1, -phi, 0),
    new Vector3(phi, 0, 1),
    new Vector3(-phi, 0, 1),
    new Vector3(phi, 0, -1),
    new Vector3(-phi, 0, -1),
  ];

  const canonicalPentVerts: Vector3[] = [
    new Vector3(0, 1, phi),
    new Vector3(0, -1, phi),
    new Vector3(1, phi, 0),
    new Vector3(-1, phi, 0),
    new Vector3(phi, 0, 1),
    new Vector3(-phi, 0, 1),
  ];

  const dPent = (1 / 3 + phi * phi) / Math.sqrt(1 + phi * phi);
  const dHex = (phi * phi) / Math.sqrt(3);

  const planes: Vector3[] = [];

  for (let i = 0; i < canonicalPentVerts.length; i += 1) {
    planes.push(
      canonicalPentVerts[i]
        .clone()
        .normalize()
        .multiplyScalar(1 / dPent)
    );
  }

  for (let i = 0; i < icoVerts.length; i += 1) {
    for (let j = i + 1; j < icoVerts.length; j += 1) {
      if (icoVerts[i].distanceToSquared(icoVerts[j]) >= 4.1) continue;
      for (let k = j + 1; k < icoVerts.length; k += 1) {
        if (
          icoVerts[i].distanceToSquared(icoVerts[k]) < 4.1 &&
          icoVerts[j].distanceToSquared(icoVerts[k]) < 4.1
        ) {
          const hexNormal = icoVerts[i]
            .clone()
            .add(icoVerts[j])
            .add(icoVerts[k])
            .normalize();
          const isCanonical =
            hexNormal.z > 1e-4 ||
            (Math.abs(hexNormal.z) <= 1e-4 &&
              (hexNormal.y > 1e-4 ||
                (Math.abs(hexNormal.y) <= 1e-4 && hexNormal.x > 0)));
          if (isCanonical) {
            planes.push(hexNormal.multiplyScalar(1 / dHex));
          }
        }
      }
    }
  }

  return planes;
}

const FACE_PLANES = buildFootballFacePlanes();

export function mountPreloaderFootballScene(
  container: HTMLDivElement,
  boxSizePx: number
): PreloaderFootballController | null {
  const perf = getDevicePerfTier();
  const activeRenderer = createManagedRenderer(container, {
    maxDpr: perf.maxDpr,
    toneMappingExposure: 1.08,
  });
  if (!activeRenderer) return null;
  activeRenderer.setSize(boxSizePx, boxSizePx, false);

  const scene = new Scene();

  const halfFovRad = (FOV_DEG * Math.PI) / 360;
  const tanAlpha = (1 / BALL_BOX_SCALE) * Math.tan(halfFovRad);
  const alpha = Math.atan(tanAlpha);
  const camZ = 1 / Math.sin(alpha);

  const camera = new PerspectiveCamera(FOV_DEG, 1, 0.5, 25);
  camera.position.set(0, 0, camZ);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();

  const env = createPmremEnv(
    activeRenderer,
    createStudioEnvTexture({
      bg: "#101116",
      keyMidStop: "rgba(255, 255, 255, 0.52)",
      rimStop: "rgba(236, 240, 248, 0.44)",
      floorStop: "rgba(243, 66, 19, 0.16)",
    })
  );
  scene.environment = env.texture;

  addStudioThreePointLights(scene, 1, 0x1a1918);

  const rimLight = new DirectionalLight(0xf6f3ec, 1.15);
  rimLight.position.set(3.2, 2.8, -3.6);
  const vermilionBounce = new DirectionalLight(0xf34213, 0.42);
  vermilionBounce.position.set(0.5, -5.0, 2.2);
  scene.add(rimLight, vermilionBounce);

  const ballNormalMat = new Matrix3();
  const modelViewMat = new Matrix4();

  const material = new MeshPhysicalMaterial({
    color: new Color(0xffffff),
    metalness: 0.02,
    roughness: 0.26,
    clearcoat: 0.82,
    clearcoatRoughness: 0.12,
    ior: 1.5,
    reflectivity: 0.85,
    envMapIntensity: 1.15,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFacePlanes = { value: FACE_PLANES };
    shader.uniforms.uBallNormalMat = { value: ballNormalMat };

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vBallObjPos;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vBallObjPos = position;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform vec3 uFacePlanes[16];
uniform mat3 uBallNormalMat;
varying vec3 vBallObjPos;

float fbHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.23));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float fbNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix(fbHash(i + vec3(0.0, 0.0, 0.0)), fbHash(i + vec3(1.0, 0.0, 0.0)), f.x),
      mix(fbHash(i + vec3(0.0, 1.0, 0.0)), fbHash(i + vec3(1.0, 1.0, 0.0)), f.x),
      f.y
    ),
    mix(
      mix(fbHash(i + vec3(0.0, 0.0, 1.0)), fbHash(i + vec3(1.0, 0.0, 1.0)), f.x),
      mix(fbHash(i + vec3(0.0, 1.0, 1.0)), fbHash(i + vec3(1.0, 1.0, 1.0)), f.x),
      f.y
    ),
    f.z
  );
}

vec4 fbNoiseGrad(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  vec3 u = f * f * (3.0 - 2.0 * f);
  vec3 du = 6.0 * f * (1.0 - f);

  float c000 = fbHash(i + vec3(0.0, 0.0, 0.0));
  float c100 = fbHash(i + vec3(1.0, 0.0, 0.0));
  float c010 = fbHash(i + vec3(0.0, 1.0, 0.0));
  float c110 = fbHash(i + vec3(1.0, 1.0, 0.0));
  float c001 = fbHash(i + vec3(0.0, 0.0, 1.0));
  float c101 = fbHash(i + vec3(1.0, 0.0, 1.0));
  float c011 = fbHash(i + vec3(0.0, 1.0, 1.0));
  float c111 = fbHash(i + vec3(1.0, 1.0, 1.0));

  float k0 = c000;
  float k1 = c100 - c000;
  float k2 = c010 - c000;
  float k3 = c001 - c000;
  float k4 = c000 - c100 - c010 + c110;
  float k5 = c000 - c010 - c001 + c011;
  float k6 = c000 - c100 - c001 + c101;
  float k7 = -c000 + c100 + c010 - c110 + c001 - c101 - c011 + c111;

  float val = k0 + k1 * u.x + k2 * u.y + k3 * u.z + k4 * u.x * u.y + k5 * u.y * u.z + k6 * u.z * u.x + k7 * u.x * u.y * u.z;
  vec3 grad = du * vec3(
    k1 + k4 * u.y + k6 * u.z + k7 * u.y * u.z,
    k2 + k5 * u.z + k4 * u.x + k7 * u.z * u.x,
    k3 + k6 * u.x + k5 * u.y + k7 * u.x * u.y
  );
  return vec4(val, grad);
}`
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
vec3 fbP = normalize(vBallObjPos);
float fbS1 = -1e5;
float fbS2 = -1e5;
float fbS3 = -1e5;
vec3 fbG1 = vec3(0.0);
vec3 fbG2 = vec3(0.0);
vec3 fbG3 = vec3(0.0);
float fbIsPent = 0.0;

for (int i = 0; i < 16; i++) {
  vec3 fbG = uFacePlanes[i];
  float fbS = dot(fbP, fbG);
  if (fbS < 0.0) {
    fbS = -fbS;
    fbG = -fbG;
  }
  if (fbS > fbS1) {
    fbS3 = fbS2; fbG3 = fbG2;
    fbS2 = fbS1; fbG2 = fbG1;
    fbS1 = fbS;  fbG1 = fbG;
    fbIsPent = (i < 6) ? 1.0 : 0.0;
  } else if (fbS > fbS2) {
    fbS3 = fbS2; fbG3 = fbG2;
    fbS2 = fbS;  fbG2 = fbG;
  } else if (fbS > fbS3) {
    fbS3 = fbS;  fbG3 = fbG;
  }
}

vec3 fbDiff12 = fbG1 - fbG2;
vec3 fbDiff13 = fbG1 - fbG3;
float fbLen12 = max(length(fbDiff12), 1e-4);
float fbLen13 = max(length(fbDiff13), 1e-4);
float fbD12 = (fbS1 - fbS2) / fbLen12;
float fbD13 = (fbS1 - fbS3) / fbLen13;

float fbK = 0.014;
float fbH = clamp(0.5 + 0.5 * (fbD13 - fbD12) / fbK, 0.0, 1.0);
float fbSeamDist = mix(fbD13, fbD12, fbH) - fbK * fbH * (1.0 - fbH);

float fbAA = max(fwidth(fbSeamDist), 0.0025);
float fbSeamMask = smoothstep(0.010 - fbAA * 0.5, 0.018 + fbAA, fbSeamDist);

vec4 fbGrainRes = fbNoiseGrad(fbP * 88.0);
float fbGrain = fbGrainRes.x;
float fbGrainFine = fbNoise(fbP * 195.0);
float fbLeatherTone = (fbGrain - 0.5) * 0.045 + (fbGrainFine - 0.5) * 0.025;

vec3 fbWhitePanel = vec3(0.905, 0.892, 0.858) + fbLeatherTone;
vec3 fbBlackPanel = vec3(0.014, 0.015, 0.019) + fbLeatherTone * 0.18;
vec3 fbSeamColor = vec3(0.004, 0.004, 0.006);

vec3 fbPanelColor = mix(fbWhitePanel, fbBlackPanel, fbIsPent);
diffuseColor.rgb = mix(fbSeamColor, fbPanelColor, fbSeamMask);`
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
roughnessFactor = mix(0.82, mix(0.24, 0.33, fbIsPent) + (fbGrain - 0.5) * 0.04, fbSeamMask);`
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
vec3 fbT12Raw = fbDiff12 - fbP * dot(fbP, fbDiff12);
vec3 fbT12 = fbT12Raw / max(length(fbT12Raw), 1e-4);
vec3 fbT13Raw = fbDiff13 - fbP * dot(fbP, fbDiff13);
vec3 fbT13 = fbT13Raw / max(length(fbT13Raw), 1e-4);

float fbBevelW = 0.044;
float fbB12 = clamp(1.0 - max(fbD12 - 0.008, 0.0) / fbBevelW, 0.0, 1.0);
float fbB13 = clamp(1.0 - max(fbD13 - 0.008, 0.0) / fbBevelW, 0.0, 1.0);
float fbSlope12 = fbB12 * fbB12 * 0.58 * fbSeamMask;
float fbSlope13 = fbB13 * fbB13 * 0.58 * fbSeamMask;

vec3 fbFaceDir = normalize(fbG1);
vec3 fbRadialRaw = fbP - fbFaceDir * dot(fbP, fbFaceDir);
vec3 fbPillowOffset = fbRadialRaw * (0.16 * fbSeamMask);

vec3 fbGrainGrad = fbGrainRes.yzw;
fbGrainGrad -= fbP * dot(fbP, fbGrainGrad);

vec3 fbPerturbedObjN = normalize(
  fbP - fbT12 * fbSlope12 - fbT13 * fbSlope13 + fbPillowOffset - fbGrainGrad * (0.16 * fbSeamMask)
);
normal = normalize(uBallNormalMat * fbPerturbedObjN);

vec3 fbClearcoatObjN = normalize(
  fbP - fbT12 * (fbSlope12 * 0.72) - fbT13 * (fbSlope13 * 0.72) + fbPillowOffset * 0.8
);
vec3 fbClearcoatViewN = normalize(uBallNormalMat * fbClearcoatObjN);`
      )
      .replace(
        "#include <clearcoat_normal_fragment_maps>",
        `#include <clearcoat_normal_fragment_maps>
#ifdef USE_CLEARCOAT
  clearcoatNormal = fbClearcoatViewN;
#endif`
      )
      .replace(
        "#include <lights_physical_fragment>",
        `#include <lights_physical_fragment>
#ifdef USE_CLEARCOAT
  material.clearcoat *= fbSeamMask;
#endif`
      )
      .replace(
        "#include <aomap_fragment>",
        `#include <aomap_fragment>
float fbSeamAO = mix(0.22, 1.0, smoothstep(0.0, 0.032, fbSeamDist));
reflectedLight.directDiffuse *= mix(0.45, 1.0, fbSeamMask);
reflectedLight.indirectDiffuse *= fbSeamAO;
reflectedLight.indirectSpecular *= fbSeamAO;
#if defined( USE_CLEARCOAT )
  clearcoatSpecularIndirect *= fbSeamAO;
#endif`
      );
  };

  const geometry = new SphereGeometry(1, perf.orbSegs[0], perf.orbSegs[1]);
  const ballMesh = new Mesh(geometry, material);
  const deformGroup = new Group();
  deformGroup.add(ballMesh);
  scene.add(deformGroup);

  const initialQuat = new Quaternion().setFromEuler(new Euler(0.32, -0.42, 0.15));
  const spinAxis = new Vector3(0.24, 0.32, -1.0).normalize();
  const spinQuat = new Quaternion();

  let disposed = false;

  const renderFrame = (
    spinAngle: number,
    squashX: number,
    squashY: number
  ) => {
    if (disposed) return;
    spinQuat.setFromAxisAngle(spinAxis, spinAngle);
    ballMesh.quaternion.copy(spinQuat).multiply(initialQuat);
    deformGroup.scale.set(squashX, squashY, squashX);
    deformGroup.position.y = -(1 - squashY);
    scene.updateMatrixWorld();
    modelViewMat.multiplyMatrices(camera.matrixWorldInverse, ballMesh.matrixWorld);
    ballNormalMat.getNormalMatrix(modelViewMat);
    activeRenderer.render(scene, camera);
  };

  renderFrame(0, 1, 1);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    geometry.dispose();
    material.dispose();
    env.dispose();
    activeRenderer.dispose();
    activeRenderer.domElement.remove();
  };

  return { renderFrame, dispose };
}
