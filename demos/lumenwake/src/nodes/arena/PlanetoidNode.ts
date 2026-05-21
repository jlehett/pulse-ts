import * as THREE from 'three';
import { useFrameUpdate, useService } from '@pulse-ts/core';
import { useCustomMesh, ThreeService } from '@pulse-ts/three';
import type { MapConfig } from '../../config/maps';

const PLAYER_TRAIL_LENGTH = 512;
const PROJ_TRAIL_LENGTH = 2048;
const GLOW_WIDTH = 2048;
const GLOW_HEIGHT = 1024;
const MAX_TRAIL_SPLATS = PLAYER_TRAIL_LENGTH * 2;
const MAX_ADD_SPLATS = (8 + PROJ_TRAIL_LENGTH + 32) * 2;
const MAX_ZONE_SPLATS = 64;

const SURFACE_VERTEX = /* glsl */ `
    uniform sampler2D uWorleyMap;
    uniform float uSphereRadius;
    uniform float uTime;
    varying vec3 vWorldPos;
    varying vec3 vSphereNormal;

    void main() {
        vec3 n = normalize(position);
        float theta = atan(n.x, n.z);
        float phi = asin(n.y);
        vec2 eqUV = vec2(theta / 6.28318 + 0.5, phi / 3.14159 + 0.5);

        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vSphereNormal = n;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

const SURFACE_FRAGMENT = /* glsl */ `
    uniform float uTime;
    uniform float uBaseLumenwake;
    uniform vec3 uSurfaceColor;
    uniform vec3 uEmissiveColor;
    uniform float uSphereRadius;
    uniform sampler2D uGlowMap;
    uniform sampler2D uWorleyMap;
    uniform vec3 uSunDir;
    uniform vec3 uSunColor;
    uniform float uSunStrength;
    varying vec3 vWorldPos;
    varying vec3 vSphereNormal;

    void main() {
        vec3 pos = vWorldPos;
        vec3 normal = vSphereNormal;

        float theta = atan(pos.x, pos.z);
        float phi = asin(normal.y);
        vec2 eqUV = vec2(theta / 6.28318 + 0.5, phi / 3.14159 + 0.5);

        vec2 texel = vec2(4.0 / 4096.0, 4.0 / 2048.0);
        vec4 wCenter = texture2D(uWorleyMap, eqUV);
        vec4 wR = texture2D(uWorleyMap, eqUV + vec2(texel.x, 0.0));
        vec4 wL = texture2D(uWorleyMap, eqUV - vec2(texel.x, 0.0));
        vec4 wU = texture2D(uWorleyMap, eqUV + vec2(0.0, texel.y));
        vec4 wD = texture2D(uWorleyMap, eqUV - vec2(0.0, texel.y));

        float edge = wCenter.r;
        float biome = wCenter.b;
        float rough = wCenter.a;

        vec3 up = abs(normal.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
        vec3 T = normalize(cross(up, normal));
        vec3 btan = normalize(cross(normal, T));

        // Normal perturbation from height field
        float hR = smoothstep(0.0, 0.12, wR.r);
        float hL = smoothstep(0.0, 0.12, wL.r);
        float hU = smoothstep(0.0, 0.12, wU.r);
        float hD = smoothstep(0.0, 0.12, wD.r);
        float rdx = hR - hL;
        float rdy = hU - hD;
        vec3 perturbedNormal = normalize(normal - T * rdx * 0.3 - btan * rdy * 0.3);

        // Rock surface with subtle warm/cool variation
        vec3 rockWarm = vec3(0.012, 0.012, 0.012);
        vec3 rockCool = vec3(0.010, 0.011, 0.012);
        vec3 rockBase = mix(rockWarm, rockCool, biome) * (0.85 + rough * 0.3);

        vec3 emitWarm = vec3(0.045, 0.045, 0.045);
        vec3 emitCool = vec3(0.04, 0.042, 0.045);
        vec3 rockEmit = mix(emitWarm, emitCool, biome);

        float grid = 1.0 - smoothstep(0.02, 0.05, edge);
        float height = smoothstep(0.0, 0.12, edge);
        float ao = 0.4 + 0.6 * height;

        // Glow map illumination (dynamic player/projectile light)
        vec4 glowSample = texture2D(uGlowMap, eqUV);
        float illumination = min(glowSample.a, 1.0);
        vec3 glowColor = glowSample.a > 0.0 ? glowSample.rgb / glowSample.a : vec3(0.0);

        // Derive glow light direction from gradient
        vec2 glowTexel = vec2(8.0 / 2048.0, 8.0 / 1024.0);
        float glR = texture2D(uGlowMap, eqUV + vec2(glowTexel.x, 0.0)).a;
        float glL = texture2D(uGlowMap, eqUV - vec2(glowTexel.x, 0.0)).a;
        float glU = texture2D(uGlowMap, eqUV + vec2(0.0, glowTexel.y)).a;
        float glD = texture2D(uGlowMap, eqUV - vec2(0.0, glowTexel.y)).a;
        vec3 glowLightDir = normalize(normal + T * (glR - glL) * 10.0 + btan * (glU - glD) * 10.0);

        float glowNdotL = max(dot(perturbedNormal, glowLightDir), 0.0);
        float glowWrap = smoothstep(-0.2, 0.8, dot(perturbedNormal, glowLightDir));
        float litAmount = pow(illumination, 1.3) * mix(0.4, 1.0, glowWrap) * (0.7 + 0.3 * ao);
        float litHot = pow(illumination, 0.6) * illumination;
        litAmount = mix(litAmount, litHot, illumination);

        // Sun directional light
        vec3 viewDir = normalize(cameraPosition - pos);
        float sunDot = dot(perturbedNormal, uSunDir);
        float sunNdotL = max(sunDot, 0.0);
        float sunWrap = smoothstep(-0.3, 0.6, sunDot);

        float NdotV = max(dot(perturbedNormal, viewDir), 0.0);
        float viewShade = 0.85 + 0.15 * NdotV;

        float crackDarken = 1.0 - grid * 0.08;

        vec3 surfaceLit = rockBase * crackDarken * uSunColor * sunWrap * ao * 1.8 * uSunStrength
                        + rockEmit * 0.4 * ao * sunNdotL * uSunStrength;
        surfaceLit *= viewShade;

        vec3 surfaceAmbient = rockBase * crackDarken * uSunColor * 1.4 * ao * uSunStrength;
        vec3 surfaceColor = surfaceAmbient + surfaceLit;

        // Lumenwake glow — acts as a light source illuminating the rock
        vec3 glowTint = mix(glowColor, vec3(1.0), illumination * 0.12);
        vec3 glowLit = rockBase * glowTint * glowWrap * ao * illumination * 12.0
                     + rockEmit * glowTint * glowNdotL * illumination * 3.0;
        surfaceColor += glowLit;

        gl_FragColor = vec4(surfaceColor, 1.0);
    }
`;

export interface PlanetoidProps {
    map: MapConfig;
}

/**
 * The main spherical arena surface with cellular grid shader,
 * player-reactive glow, wake trail, and darkness consumption.
 */
export function PlanetoidNode(props: PlanetoidProps) {
    const { map } = props;
    const three = useService(ThreeService);

    // Player trail stored in flat arrays
    const playerTrailData = new Float32Array(PLAYER_TRAIL_LENGTH * 4); // x, y, z, age
    const playerTrailColorData = new Float32Array(PLAYER_TRAIL_LENGTH * 3);

    // Projectile trail stored in flat arrays
    const projTrailData = new Float32Array(PROJ_TRAIL_LENGTH * 5); // x, y, z, age, intensity
    const projTrailColorData = new Float32Array(PROJ_TRAIL_LENGTH * 3);

    // Impact splats — longer-lived glow at projectile hit locations
    const IMPACT_MAX = 32;
    const IMPACT_LIFETIME = 3.5;
    const IMPACT_RADIUS = 4.5;
    let impactCount = 0;
    const impactData = new Float32Array(IMPACT_MAX * 4); // x, y, z, age
    const impactColorData = new Float32Array(IMPACT_MAX * 3);

    // GPU splat render target
    const glowRT = new THREE.WebGLRenderTarget(GLOW_WIDTH, GLOW_HEIGHT, {
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
    });

    // Precompute Worley noise to a texture (eliminates per-fragment noise in surface shader)
    const worleyRT = new THREE.WebGLRenderTarget(4096, 2048, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
    });
    {
        const worleyMat = new THREE.ShaderMaterial({
            vertexShader: /* glsl */ `
                varying vec2 vUV;
                void main() {
                    vUV = vec2(position.x * 0.5 + 0.5, position.y * 0.5 + 0.5);
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                }
            `,
            fragmentShader: /* glsl */ `
                uniform float uSphereRadius;
                varying vec2 vUV;

                vec3 hash3(vec3 p) {
                    p = vec3(
                        dot(p, vec3(127.1, 311.7, 74.7)),
                        dot(p, vec3(269.5, 183.3, 246.1)),
                        dot(p, vec3(113.5, 271.9, 124.6))
                    );
                    return fract(sin(p) * 43758.5453) - 0.5;
                }

                float worleyEdge(vec3 pos, float scale) {
                    vec3 p = pos * scale;
                    vec3 cell = floor(p);
                    vec3 local = fract(p);
                    float dist1 = 10.0;
                    float dist2 = 10.0;
                    for (int x = -1; x <= 1; x++) {
                        for (int y = -1; y <= 1; y++) {
                            for (int z = -1; z <= 1; z++) {
                                vec3 offset = vec3(float(x), float(y), float(z));
                                vec3 neighbor = cell + offset;
                                vec3 seed = offset + hash3(neighbor) * 0.8;
                                float d = length(local - seed);
                                if (d < dist1) { dist2 = dist1; dist1 = d; }
                                else if (d < dist2) { dist2 = d; }
                            }
                        }
                    }
                    return dist2 - dist1;
                }

                // Simplex-like noise for biome regions
                float snoise(vec3 v) {
                    vec3 i = floor(v + dot(v, vec3(1.0/3.0)));
                    vec3 x0 = v - i + dot(i, vec3(1.0/6.0));
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min(g, l.zxy);
                    vec3 i2 = max(g, l.zxy);
                    vec3 x1 = x0 - i1 + 1.0/6.0;
                    vec3 x2 = x0 - i2 + 1.0/3.0;
                    vec3 x3 = x0 - 0.5;
                    vec4 w;
                    w.x = dot(x0, x0); w.y = dot(x1, x1);
                    w.z = dot(x2, x2); w.w = dot(x3, x3);
                    w = max(0.6 - w, 0.0);
                    w *= w; w *= w;
                    float n = dot(w, vec4(
                        dot(x0, hash3(i)),
                        dot(x1, hash3(i + i1)),
                        dot(x2, hash3(i + i2)),
                        dot(x3, hash3(i + 1.0))
                    ));
                    return n * 52.0;
                }

                void main() {
                    float theta = (vUV.x - 0.5) * 6.28318;
                    float phi = (vUV.y - 0.5) * 3.14159;
                    float cPhi = cos(phi);
                    vec3 pos = vec3(cPhi * sin(theta), sin(phi), cPhi * cos(theta)) * uSphereRadius;
                    vec3 dir = normalize(pos);
                    float edge = worleyEdge(pos, 1.5);
                    float pebble = worleyEdge(pos, 3.0);

                    // Biome blend: large continental regions + subtle latitude
                    float n1 = snoise(dir * 0.8) * 0.5 + 0.5;
                    float n2 = snoise(dir * 1.6 + 7.0) * 0.5 + 0.5;
                    float lat = abs(dir.y);
                    float biome = clamp(n1 * 0.7 + n2 * 0.15 + lat * 0.2 - 0.1, 0.0, 1.0);

                    // Terrain roughness variation
                    float rough = snoise(dir * 8.0 + 20.0) * 0.5 + 0.5;

                    gl_FragColor = vec4(edge, pebble, biome, rough);
                }
            `,
            uniforms: { uSphereRadius: { value: map.sphereRadius } },
        });
        const geo = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geo, worleyMat);
        const scene = new THREE.Scene();
        scene.add(mesh);
        const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = three!.renderer;
        const prevRT = renderer.getRenderTarget();
        renderer.setRenderTarget(worleyRT);
        renderer.render(scene, cam);
        renderer.setRenderTarget(prevRT);
        geo.dispose();
        worleyMat.dispose();
    }

    // Shared splat shader source
    const splatVertSrc = /* glsl */ `
        attribute vec3 aCenter;
        attribute vec3 aColorFade;
        attribute vec2 aRadiusStrength;
        attribute float aUOffset;

        varying vec3 vCenter;
        varying vec3 vColorFade;
        varying float vRadius;
        varying float vStrength;
        varying vec2 vUV;

        uniform float uSphereRadius;

        void main() {
            vCenter = aCenter;
            vColorFade = aColorFade;
            vRadius = aRadiusStrength.x;
            vStrength = aRadiusStrength.y;

            vec3 n = normalize(aCenter);
            float theta = atan(n.x, n.z);
            float phi = asin(clamp(n.y, -1.0, 1.0));

            float centerU = theta / (2.0 * 3.14159265) + 0.5 + aUOffset;
            float centerV = phi / 3.14159265 + 0.5;

            float angularRadius = vRadius / uSphereRadius;
            float extentV = angularRadius * 1.2 / 3.14159265;

            // Widen U extent when quad reaches near a pole
            float maxAbsLat = abs(centerV - 0.5) + extentV;
            float polePhi = min(maxAbsLat * 3.14159265, 1.55);
            float cosLatEff = max(min(cos(phi), cos(polePhi)), 0.01);
            float extentU = angularRadius * 1.2 / (2.0 * 3.14159265 * cosLatEff);

            vec2 quadUV = vec2(
                centerU + position.x * extentU,
                centerV + position.y * extentV
            );

            vUV = quadUV;
            gl_Position = vec4(quadUV * 2.0 - 1.0, 0.0, 1.0);
        }
    `;

    const splatFragSrc = /* glsl */ `
        varying vec3 vCenter;
        varying vec3 vColorFade;
        varying float vRadius;
        varying float vStrength;
        varying vec2 vUV;

        uniform float uSphereRadius;

        void main() {
            float theta = (vUV.x - 0.5) * 2.0 * 3.14159265;
            float phi = (vUV.y - 0.5) * 3.14159265;
            float cPhi = cos(phi);
            vec3 fragDir = vec3(cPhi * sin(theta), sin(phi), cPhi * cos(theta));

            vec3 centerDir = normalize(vCenter);
            float d = dot(fragDir, centerDir);
            float dist2 = 2.0 * (1.0 - d) * uSphereRadius * uSphereRadius;
            float dist = sqrt(dist2);
            float t = dist / vRadius;

            float falloff = exp(-t * t * 3.0);
            if (falloff < 0.001) discard;

            float intensity = falloff * vStrength;
            float i2 = intensity * intensity;
            gl_FragColor = vec4(vColorFade * i2, i2);
        }
    `;

    const zoneFragSrc = /* glsl */ `
        varying vec3 vCenter;
        varying vec3 vColorFade;
        varying float vRadius;
        varying float vStrength;
        varying vec2 vUV;

        uniform float uSphereRadius;

        void main() {
            float theta = (vUV.x - 0.5) * 2.0 * 3.14159265;
            float phi = (vUV.y - 0.5) * 3.14159265;
            float cPhi = cos(phi);
            vec3 fragDir = vec3(cPhi * sin(theta), sin(phi), cPhi * cos(theta));

            vec3 centerDir = normalize(vCenter);
            float d = dot(fragDir, centerDir);
            float dist2 = 2.0 * (1.0 - d) * uSphereRadius * uSphereRadius;
            float dist = sqrt(dist2);
            float t = dist / vRadius;

            if (t > 1.05) discard;

            // Solid interior fill, brighter at center
            float fill = (1.0 - t * t * 0.4) * 0.9;

            // Hard bright ring at boundary
            float ring = smoothstep(0.82, 0.90, t) * (1.0 - smoothstep(0.93, 1.02, t));

            float intensity = (fill + ring * 2.2) * vStrength;
            float i2 = intensity * intensity;
            gl_FragColor = vec4(vColorFade * i2, i2);
        }
    `;

    // Helper to create instanced splat geometry
    const quadVerts = new Float32Array([
        -1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0,
    ]);

    function createSplatGeo(maxInstances: number) {
        const geo = new THREE.InstancedBufferGeometry();
        geo.instanceCount = 0;
        geo.setAttribute('position', new THREE.BufferAttribute(quadVerts, 3));
        const center = new THREE.InstancedBufferAttribute(
            new Float32Array(maxInstances * 3),
            3,
        );
        const colorFade = new THREE.InstancedBufferAttribute(
            new Float32Array(maxInstances * 3),
            3,
        );
        const radiusStrength = new THREE.InstancedBufferAttribute(
            new Float32Array(maxInstances * 2),
            2,
        );
        const uOffset = new THREE.InstancedBufferAttribute(
            new Float32Array(maxInstances),
            1,
        );
        center.setUsage(THREE.DynamicDrawUsage);
        colorFade.setUsage(THREE.DynamicDrawUsage);
        radiusStrength.setUsage(THREE.DynamicDrawUsage);
        uOffset.setUsage(THREE.DynamicDrawUsage);
        geo.setAttribute('aCenter', center);
        geo.setAttribute('aColorFade', colorFade);
        geo.setAttribute('aRadiusStrength', radiusStrength);
        geo.setAttribute('aUOffset', uOffset);
        return { geo, center, colorFade, radiusStrength, uOffset };
    }

    // Trail splats rendered first with MAX so overlapping trails don't stack
    const trailSplat = createSplatGeo(MAX_TRAIL_SPLATS);
    // Base glow + projectile splats rendered second with ADD so they layer on top
    const addSplat = createSplatGeo(MAX_ADD_SPLATS);

    const trailSplatMat = new THREE.ShaderMaterial({
        vertexShader: splatVertSrc,
        fragmentShader: splatFragSrc,
        uniforms: { uSphereRadius: { value: map.sphereRadius } },
        blending: THREE.CustomBlending,
        blendEquation: THREE.MaxEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        depthTest: false,
        depthWrite: false,
        transparent: true,
    });

    // Base glow + projectile splats use ADD blending
    const addSplatMat = new THREE.ShaderMaterial({
        vertexShader: splatVertSrc,
        fragmentShader: splatFragSrc,
        uniforms: { uSphereRadius: { value: map.sphereRadius } },
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        depthTest: false,
        depthWrite: false,
        transparent: true,
    });

    const trailSplatMesh = new THREE.Mesh(trailSplat.geo, trailSplatMat);
    trailSplatMesh.frustumCulled = false;
    trailSplatMesh.renderOrder = 0;

    const addSplatMesh = new THREE.Mesh(addSplat.geo, addSplatMat);
    addSplatMesh.frustumCulled = false;
    addSplatMesh.renderOrder = 1;

    // Zone splats rendered LAST with REPLACE so they overwrite all other lighting
    const zoneSplat = createSplatGeo(MAX_ZONE_SPLATS);

    const zoneSplatMat = new THREE.ShaderMaterial({
        vertexShader: splatVertSrc,
        fragmentShader: zoneFragSrc,
        uniforms: { uSphereRadius: { value: map.sphereRadius } },
        blending: THREE.CustomBlending,
        blendEquation: THREE.MaxEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        depthTest: false,
        depthWrite: false,
        transparent: true,
    });

    const zoneSplatMesh = new THREE.Mesh(zoneSplat.geo, zoneSplatMat);
    zoneSplatMesh.frustumCulled = false;
    zoneSplatMesh.renderOrder = 2;

    const splatScene = new THREE.Scene();
    splatScene.add(trailSplatMesh);
    splatScene.add(addSplatMesh);
    splatScene.add(zoneSplatMesh);
    const splatCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Player live positions for splatting each frame
    const playerPositions: THREE.Vector3[] = [];
    const playerColors: THREE.Color[] = [];
    let playerCount = 0;
    const PLAYER_GLOW_RADIUS = 6.5;

    // Per-frame zone splat buffer (filled each frame, cleared after upload)
    const zoneData: {
        x: number;
        y: number;
        z: number;
        r: number;
        g: number;
        b: number;
        radius: number;
        strength: number;
    }[] = [];

    const _savedClearColor = new THREE.Color();

    const sunDir = new THREE.Vector3(-0.7, -0.5, -0.4).normalize();

    const uniforms = {
        uTime: { value: 0 },
        uBaseLumenwake: { value: 1.0 },
        uSurfaceColor: { value: new THREE.Color(map.surfaceColor) },
        uEmissiveColor: { value: new THREE.Color(map.emissiveColor) },
        uSphereRadius: { value: map.sphereRadius },
        uGlowMap: { value: glowRT.texture },
        uWorleyMap: { value: worleyRT.texture },
        uSunDir: { value: sunDir },
        uSunColor: { value: new THREE.Color(0.9, 0.88, 0.85) },
        uSunStrength: { value: 1.0 },
    };

    useCustomMesh({
        geometry: () => new THREE.SphereGeometry(map.sphereRadius, 384, 256),
        material: () =>
            new THREE.ShaderMaterial({
                vertexShader: SURFACE_VERTEX,
                fragmentShader: SURFACE_FRAGMENT,
                uniforms,
            }),
    });

    // Atmospheric corona — Fresnel rim glow, sun-tinted on lit side
    const coronaScale = 1.5;
    const coronaMesh = useCustomMesh({
        geometry: () =>
            new THREE.SphereGeometry(map.sphereRadius * coronaScale, 128, 64),
        material: () =>
            new THREE.ShaderMaterial({
                uniforms: {
                    uSunDir: uniforms.uSunDir,
                    uSunColor: uniforms.uSunColor,
                    uSphereRadius: uniforms.uSphereRadius,
                    uSunStrength: uniforms.uSunStrength,
                },
                vertexShader: /* glsl */ `
                    varying vec3 vWorldPos;
                    void main() {
                        vec4 worldPos = modelMatrix * vec4(position, 1.0);
                        vWorldPos = worldPos.xyz;
                        gl_Position = projectionMatrix * viewMatrix * worldPos;
                    }
                `,
                fragmentShader: /* glsl */ `
                    uniform vec3 uSunDir;
                    uniform vec3 uSunColor;
                    uniform float uSphereRadius;
                    uniform float uSunStrength;
                    varying vec3 vWorldPos;

                    void main() {
                        // Ray from camera through this fragment
                        vec3 rayDir = normalize(vWorldPos - cameraPosition);

                        // Closest approach of view ray to sphere center (origin)
                        float tClosest = -dot(cameraPosition, rayDir);
                        vec3 closest = cameraPosition + rayDir * tClosest;
                        float minDist = length(closest);

                        // Skip fragments where ray hits the planetoid
                        // Account for water displacement below sphere radius
                        if (minDist < uSphereRadius) discard;

                        // Smooth falloff from planetoid surface outward
                        float coronaThickness = uSphereRadius * ${(coronaScale - 1.0).toFixed(2)};
                        float distFromSurface = minDist - uSphereRadius;
                        float glow = 1.0 - smoothstep(0.0, coronaThickness, distFromSurface);

                        // Sun-side coloring based on closest point direction
                        vec3 closestDir = normalize(closest);
                        float sunFacing = dot(closestDir, uSunDir);
                        float sunSide = smoothstep(-0.3, 0.6, sunFacing);

                        vec3 warmColor = uSunColor * 0.8;
                        vec3 coolColor = vec3(0.2, 0.35, 0.7);
                        vec3 coronaColor = mix(coolColor, warmColor, sunSide);

                        float intensity = mix(0.35, 0.5, sunSide) * uSunStrength;
                        float alpha = glow * intensity * 0.35;
                        if (alpha < 0.005) discard;
                        gl_FragColor = vec4(coronaColor * alpha, alpha);
                    }
                `,
                transparent: true,
                depthWrite: false,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
            }),
    });
    coronaMesh.object.frustumCulled = false;

    // Player trail management
    let playerTrailCount = 0;
    const PLAYER_TRAIL_LIFETIME = 4.5;
    const PLAYER_TRAIL_RADIUS = 3.8;
    const PLAYER_TRAIL_SPACING = 0.25;
    const lastTrailPos = new THREE.Vector3();
    let hasLastPos = false;

    // Projectile trail management
    let projTrailCount = 0;
    const PROJ_TRAIL_LIFETIME = 0.5;
    const PROJ_TRAIL_RADIUS = 1.5;

    function addInstance(
        idx: number,
        px: number,
        py: number,
        pz: number,
        cr: number,
        cg: number,
        cb: number,
        radius: number,
        strength: number,
        centers: Float32Array,
        colorsArr: Float32Array,
        rsArr: Float32Array,
        uOffsetsArr: Float32Array,
    ): number {
        const r = Math.sqrt(px * px + py * py + pz * pz);
        const nx = px / r,
            ny = py / r,
            nz = pz / r;
        const theta = Math.atan2(nx, nz);
        const phi = Math.asin(ny);
        const centerU = theta / (2 * Math.PI) + 0.5;
        const centerV = phi / Math.PI + 0.5;
        const angularRadius = radius / map.sphereRadius;
        const extentV = (angularRadius * 1.2) / Math.PI;
        const maxAbsLat = Math.abs(centerV - 0.5) + extentV;
        const polePhi = Math.min(maxAbsLat * Math.PI, 1.55);
        const cosLatEff = Math.max(
            Math.min(Math.cos(phi), Math.cos(polePhi)),
            0.01,
        );
        const extentU = (angularRadius * 1.2) / (2 * Math.PI * cosLatEff);

        centers[idx * 3] = px;
        centers[idx * 3 + 1] = py;
        centers[idx * 3 + 2] = pz;
        colorsArr[idx * 3] = cr;
        colorsArr[idx * 3 + 1] = cg;
        colorsArr[idx * 3 + 2] = cb;
        rsArr[idx * 2] = radius;
        rsArr[idx * 2 + 1] = strength;
        uOffsetsArr[idx] = 0;
        idx++;

        const coversFullWidth =
            centerU - extentU <= 0.0 && centerU + extentU >= 1.0;
        if (!coversFullWidth) {
            if (centerU - extentU < 0.0) {
                centers[idx * 3] = px;
                centers[idx * 3 + 1] = py;
                centers[idx * 3 + 2] = pz;
                colorsArr[idx * 3] = cr;
                colorsArr[idx * 3 + 1] = cg;
                colorsArr[idx * 3 + 2] = cb;
                rsArr[idx * 2] = radius;
                rsArr[idx * 2 + 1] = strength;
                uOffsetsArr[idx] = 1.0;
                idx++;
            } else if (centerU + extentU > 1.0) {
                centers[idx * 3] = px;
                centers[idx * 3 + 1] = py;
                centers[idx * 3 + 2] = pz;
                colorsArr[idx * 3] = cr;
                colorsArr[idx * 3 + 1] = cg;
                colorsArr[idx * 3 + 2] = cb;
                rsArr[idx * 2] = radius;
                rsArr[idx * 2 + 1] = strength;
                uOffsetsArr[idx] = -1.0;
                idx++;
            }
        }

        return idx;
    }

    const SUN_ORBIT_SPEED = 0.05;
    const LIGHTING_LERP_SPEED = 0.8;
    const orbitAxis = new THREE.Vector3()
        .crossVectors(sunDir, new THREE.Vector3(0, 1, 0))
        .normalize();
    const _sunRotQ = new THREE.Quaternion();
    let targetBaseLumenwake = 1.0;
    let targetSunStrength = 1.0;

    useFrameUpdate((dt) => {
        uniforms.uTime.value += dt;

        // Smoothly lerp lighting toward wave targets
        const lerpFactor = 1 - Math.exp(-LIGHTING_LERP_SPEED * dt);
        const curLumen = uniforms.uBaseLumenwake.value as number;
        const curSun = uniforms.uSunStrength.value as number;
        uniforms.uBaseLumenwake.value =
            curLumen + (targetBaseLumenwake - curLumen) * lerpFactor;
        uniforms.uSunStrength.value =
            curSun + (targetSunStrength - curSun) * lerpFactor;

        // Slowly orbit the sun — creates shifting light/dark hemispheres
        _sunRotQ.setFromAxisAngle(orbitAxis, SUN_ORBIT_SPEED * dt);
        sunDir.applyQuaternion(_sunRotQ).normalize();

        // Age player trail points
        for (let i = 0; i < playerTrailCount; i++) {
            playerTrailData[i * 4 + 3] += dt;
        }
        while (
            playerTrailCount > 0 &&
            playerTrailData[(playerTrailCount - 1) * 4 + 3] >=
                PLAYER_TRAIL_LIFETIME
        ) {
            playerTrailCount--;
        }

        // Age projectile trail points
        for (let i = 0; i < projTrailCount; i++) {
            projTrailData[i * 5 + 3] += dt;
        }
        while (
            projTrailCount > 0 &&
            projTrailData[(projTrailCount - 1) * 5 + 3] >= PROJ_TRAIL_LIFETIME
        ) {
            projTrailCount--;
        }

        // Age impact splats
        for (let i = 0; i < impactCount; i++) {
            impactData[i * 4 + 3] += dt;
        }
        while (
            impactCount > 0 &&
            impactData[(impactCount - 1) * 4 + 3] >= IMPACT_LIFETIME
        ) {
            impactCount--;
        }

        // Fill trail splat instances (MAX blending — no stacking)
        let trailIdx = 0;
        const tCenters = trailSplat.center.array as Float32Array;
        const tColors = trailSplat.colorFade.array as Float32Array;
        const tRS = trailSplat.radiusStrength.array as Float32Array;
        const tUO = trailSplat.uOffset.array as Float32Array;

        const TRAIL_RAMP = 0.5;
        for (let i = 0; i < playerTrailCount; i++) {
            const age = playerTrailData[i * 4 + 3];
            const ramp = age < TRAIL_RAMP ? age / TRAIL_RAMP : 1.0;
            const fade = ramp * (1 - age / PLAYER_TRAIL_LIFETIME);
            trailIdx = addInstance(
                trailIdx,
                playerTrailData[i * 4],
                playerTrailData[i * 4 + 1],
                playerTrailData[i * 4 + 2],
                playerTrailColorData[i * 3],
                playerTrailColorData[i * 3 + 1],
                playerTrailColorData[i * 3 + 2],
                PLAYER_TRAIL_RADIUS,
                0.7 * fade,
                tCenters,
                tColors,
                tRS,
                tUO,
            );
        }

        for (let i = 0; i < projTrailCount; i++) {
            const age = projTrailData[i * 5 + 3];
            const intensity = projTrailData[i * 5 + 4];
            const fade = 1 - age / PROJ_TRAIL_LIFETIME;
            trailIdx = addInstance(
                trailIdx,
                projTrailData[i * 5],
                projTrailData[i * 5 + 1],
                projTrailData[i * 5 + 2],
                projTrailColorData[i * 3],
                projTrailColorData[i * 3 + 1],
                projTrailColorData[i * 3 + 2],
                PROJ_TRAIL_RADIUS * intensity,
                0.6 * fade * intensity,
                tCenters,
                tColors,
                tRS,
                tUO,
            );
        }

        trailSplat.geo.instanceCount = trailIdx;
        trailSplat.center.needsUpdate = true;
        trailSplat.colorFade.needsUpdate = true;
        trailSplat.radiusStrength.needsUpdate = true;
        trailSplat.uOffset.needsUpdate = true;

        // Fill additive splat instances (player base + impacts)
        let addIdx = 0;
        const aCenters = addSplat.center.array as Float32Array;
        const aColors = addSplat.colorFade.array as Float32Array;
        const aRS = addSplat.radiusStrength.array as Float32Array;
        const aUO = addSplat.uOffset.array as Float32Array;

        for (let i = 0; i < playerCount; i++) {
            const p = playerPositions[i];
            const c = playerColors[i];
            if (!p || !c) continue;
            addIdx = addInstance(
                addIdx,
                p.x,
                p.y,
                p.z,
                c.r,
                c.g,
                c.b,
                PLAYER_GLOW_RADIUS,
                1.2,
                aCenters,
                aColors,
                aRS,
                aUO,
            );
        }

        for (let i = 0; i < impactCount; i++) {
            const age = impactData[i * 4 + 3];
            const fade = 1 - age / IMPACT_LIFETIME;
            addIdx = addInstance(
                addIdx,
                impactData[i * 4],
                impactData[i * 4 + 1],
                impactData[i * 4 + 2],
                impactColorData[i * 3],
                impactColorData[i * 3 + 1],
                impactColorData[i * 3 + 2],
                IMPACT_RADIUS,
                0.5 * fade * fade,
                aCenters,
                aColors,
                aRS,
                aUO,
            );
        }

        addSplat.geo.instanceCount = addIdx;
        addSplat.center.needsUpdate = true;
        addSplat.colorFade.needsUpdate = true;
        addSplat.radiusStrength.needsUpdate = true;
        addSplat.uOffset.needsUpdate = true;

        // Fill zone splat instances (per-frame, replace blending)
        let zoneIdx = 0;
        const zCenters = zoneSplat.center.array as Float32Array;
        const zColors = zoneSplat.colorFade.array as Float32Array;
        const zRS = zoneSplat.radiusStrength.array as Float32Array;
        const zUO = zoneSplat.uOffset.array as Float32Array;

        for (let i = 0; i < zoneData.length; i++) {
            const z = zoneData[i];
            zoneIdx = addInstance(
                zoneIdx,
                z.x,
                z.y,
                z.z,
                z.r,
                z.g,
                z.b,
                z.radius,
                z.strength,
                zCenters,
                zColors,
                zRS,
                zUO,
            );
        }
        zoneData.length = 0;

        zoneSplat.geo.instanceCount = zoneIdx;
        zoneSplat.center.needsUpdate = true;
        zoneSplat.colorFade.needsUpdate = true;
        zoneSplat.radiusStrength.needsUpdate = true;
        zoneSplat.uOffset.needsUpdate = true;

        // Render splats to glow map render target.
        // resetState() after rendering ensures the EffectComposer gets a
        // clean GL state — our custom blending and instanced draws can
        // leave residual state that confuses Three.js's state tracker.
        const renderer = three!.renderer;
        const prevRT = renderer.getRenderTarget();
        const prevClearColor = renderer.getClearColor(_savedClearColor);
        const prevClearAlpha = renderer.getClearAlpha();
        const prevAutoClear = renderer.autoClear;
        renderer.autoClear = false;
        renderer.setRenderTarget(glowRT);
        renderer.setClearColor(0x000000, 0);
        renderer.clear();
        renderer.render(splatScene, splatCamera);
        renderer.setRenderTarget(prevRT);
        renderer.setClearColor(prevClearColor, prevClearAlpha);
        renderer.autoClear = prevAutoClear;
        renderer.resetState();
    });

    return {
        uniforms,
        sunDir,
        glowTexture: glowRT.texture,
        getDarknessLevel() {
            return 1.0 - (uniforms.uBaseLumenwake.value as number);
        },
        setDarknessLevel(level: number) {
            targetBaseLumenwake = Math.max(0, Math.min(1, 1.0 - level));
        },
        setSunStrength(strength: number) {
            targetSunStrength = Math.max(0, Math.min(1, strength));
        },
        getSunStrength() {
            return uniforms.uSunStrength.value as number;
        },
        setPlayerPosition(index: number, x: number, y: number, z: number) {
            if (!playerPositions[index]) {
                playerPositions[index] = new THREE.Vector3();
            }
            playerPositions[index].set(x, y, z);
        },
        setPlayerColor(index: number, color: THREE.Color) {
            if (!playerColors[index]) {
                playerColors[index] = new THREE.Color();
            }
            playerColors[index].copy(color);
        },
        setPlayerCount(count: number) {
            playerCount = count;
        },
        addTrailPoint(x: number, y: number, z: number, color: THREE.Color) {
            if (hasLastPos) {
                const dx = x - lastTrailPos.x;
                const dy = y - lastTrailPos.y;
                const dz = z - lastTrailPos.z;
                if (
                    dx * dx + dy * dy + dz * dz <
                    PLAYER_TRAIL_SPACING * PLAYER_TRAIL_SPACING
                ) {
                    return;
                }
            }
            lastTrailPos.set(x, y, z);
            hasLastPos = true;

            const lastIdx = Math.min(playerTrailCount, PLAYER_TRAIL_LENGTH - 1);
            for (let i = lastIdx; i > 0; i--) {
                const dst4 = i * 4;
                const src4 = (i - 1) * 4;
                playerTrailData[dst4] = playerTrailData[src4];
                playerTrailData[dst4 + 1] = playerTrailData[src4 + 1];
                playerTrailData[dst4 + 2] = playerTrailData[src4 + 2];
                playerTrailData[dst4 + 3] = playerTrailData[src4 + 3];
                const dst3 = i * 3;
                const src3 = (i - 1) * 3;
                playerTrailColorData[dst3] = playerTrailColorData[src3];
                playerTrailColorData[dst3 + 1] = playerTrailColorData[src3 + 1];
                playerTrailColorData[dst3 + 2] = playerTrailColorData[src3 + 2];
            }

            playerTrailData[0] = x;
            playerTrailData[1] = y;
            playerTrailData[2] = z;
            playerTrailData[3] = 0;
            playerTrailColorData[0] = color.r;
            playerTrailColorData[1] = color.g;
            playerTrailColorData[2] = color.b;
            playerTrailCount = Math.min(
                playerTrailCount + 1,
                PLAYER_TRAIL_LENGTH,
            );
        },
        addImpactSplat(x: number, y: number, z: number, color: THREE.Color) {
            if (impactCount >= IMPACT_MAX) return;
            const lastIdx = Math.min(impactCount, IMPACT_MAX - 1);
            for (let i = lastIdx; i > 0; i--) {
                const dst4 = i * 4;
                const src4 = (i - 1) * 4;
                impactData[dst4] = impactData[src4];
                impactData[dst4 + 1] = impactData[src4 + 1];
                impactData[dst4 + 2] = impactData[src4 + 2];
                impactData[dst4 + 3] = impactData[src4 + 3];
                const dst3 = i * 3;
                const src3 = (i - 1) * 3;
                impactColorData[dst3] = impactColorData[src3];
                impactColorData[dst3 + 1] = impactColorData[src3 + 1];
                impactColorData[dst3 + 2] = impactColorData[src3 + 2];
            }
            impactData[0] = x;
            impactData[1] = y;
            impactData[2] = z;
            impactData[3] = 0;
            impactColorData[0] = color.r;
            impactColorData[1] = color.g;
            impactColorData[2] = color.b;
            impactCount = Math.min(impactCount + 1, IMPACT_MAX);
        },
        addProjectileTrailPoint(
            x: number,
            y: number,
            z: number,
            color: THREE.Color,
            intensity = 1,
        ) {
            // Shift existing points back
            const lastIdx = Math.min(projTrailCount, PROJ_TRAIL_LENGTH - 1);
            for (let i = lastIdx; i > 0; i--) {
                const dst5 = i * 5;
                const src5 = (i - 1) * 5;
                projTrailData[dst5] = projTrailData[src5];
                projTrailData[dst5 + 1] = projTrailData[src5 + 1];
                projTrailData[dst5 + 2] = projTrailData[src5 + 2];
                projTrailData[dst5 + 3] = projTrailData[src5 + 3];
                projTrailData[dst5 + 4] = projTrailData[src5 + 4];
                const dst3 = i * 3;
                const src3 = (i - 1) * 3;
                projTrailColorData[dst3] = projTrailColorData[src3];
                projTrailColorData[dst3 + 1] = projTrailColorData[src3 + 1];
                projTrailColorData[dst3 + 2] = projTrailColorData[src3 + 2];
            }

            projTrailData[0] = x;
            projTrailData[1] = y;
            projTrailData[2] = z;
            projTrailData[3] = 0;
            projTrailData[4] = intensity;
            projTrailColorData[0] = color.r;
            projTrailColorData[1] = color.g;
            projTrailColorData[2] = color.b;
            projTrailCount = Math.min(projTrailCount + 1, PROJ_TRAIL_LENGTH);
        },
        addZoneSplat(
            x: number,
            y: number,
            z: number,
            color: THREE.Color,
            radius: number,
            strength = 1,
        ) {
            zoneData.push({
                x,
                y,
                z,
                r: color.r,
                g: color.g,
                b: color.b,
                radius,
                strength,
            });
        },
    };
}
