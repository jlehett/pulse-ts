import * as THREE from 'three';
import { useDestroy, useFrameUpdate } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { THEME } from '../../config/theme';

/** Parses a `#rrggbb` string into `[r, g, b]` bytes. */
function rgb(hex: string): [number, number, number] {
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
    ];
}

/**
 * Paints the nebula skybox texture: theme-colored radial blooms over the
 * deep-space background, sprinkled with stars.
 *
 * @returns A canvas texture suitable for `scene.background`.
 */
function makeNebulaTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bloom = (
        color: string,
        cx: number,
        cy: number,
        r: number,
        alpha: number,
    ) => {
        const [rr, gg, bb] = rgb(color);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `rgba(${rr},${gg},${bb},${alpha})`);
        grad.addColorStop(1, `rgba(${rr},${gg},${bb},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    bloom(THEME.accent, 300, 250, 400, 0.16);
    bloom(THEME.ally, 740, 340, 320, 0.12);
    bloom(THEME.gold, 520, 90, 300, 0.07);
    bloom(THEME.enemy, 120, 470, 260, 0.06);

    for (let i = 0; i < 240; i++) {
        const size = Math.random() < 0.12 ? 1.8 : 0.9;
        ctx.fillStyle = `rgba(255,255,255,${(0.25 + Math.random() * 0.55).toFixed(2)})`;
        ctx.fillRect(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            size,
            size,
        );
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    return tex;
}

/**
 * Deep-space atmosphere around the arena: nebula background, exponential
 * fog, a starfield shell, slowly drifting parallax dust and rising embers.
 *
 * Call inside a mounted node; owns `scene.background` / `scene.fog` for the
 * battle world and restores them on destroy.
 */
export function AtmosphereNode(): void {
    const { scene } = useThreeContext();

    const prevBackground = scene.background;
    const prevFog = scene.fog;
    const nebula = makeNebulaTexture();
    scene.background = nebula;
    scene.fog = new THREE.FogExp2(THEME.bgNum, 0.02);

    const group = new THREE.Group();
    scene.add(group);

    // Starfield shell.
    const starCount = 800;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const r = 32 + Math.random() * 46;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.55 + 3;
        starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    group.add(
        new THREE.Points(
            starGeo,
            new THREE.PointsMaterial({
                color: 0x9fc4d8,
                size: 0.14,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.85,
                fog: false,
            }),
        ),
    );

    // Far parallax dust.
    const dustCount = 100;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
        dustPos[i * 3] = (Math.random() - 0.5) * 66;
        dustPos[i * 3 + 1] = Math.random() * 24 - 3;
        dustPos[i * 3 + 2] = (Math.random() - 0.5) * 66;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(
        dustGeo,
        new THREE.PointsMaterial({
            color: 0xa8c2d6,
            size: 0.17,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.32,
            fog: false,
        }),
    );
    group.add(dust);

    // Drifting embers rising through the arena volume.
    const emberCount = 150;
    const emberPos = new Float32Array(emberCount * 3);
    const emberData: { speed: number; drift: number }[] = [];
    for (let i = 0; i < emberCount; i++) {
        emberPos[i * 3] = (Math.random() - 0.5) * 24;
        emberPos[i * 3 + 1] = Math.random() * 11;
        emberPos[i * 3 + 2] = (Math.random() - 0.5) * 24;
        emberData.push({
            speed: 0.15 + Math.random() * 0.45,
            drift: (Math.random() - 0.5) * 0.012,
        });
    }
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
    const embers = new THREE.Points(
        emberGeo,
        new THREE.PointsMaterial({
            color: THEME.edgeNum,
            size: 0.1,
            transparent: true,
            opacity: 0.65,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false,
        }),
    );
    group.add(embers);

    useFrameUpdate((dt) => {
        const attr = emberGeo.getAttribute('position') as THREE.BufferAttribute;
        const arr = attr.array as Float32Array;
        for (let i = 0; i < emberCount; i++) {
            let y = arr[i * 3 + 1] + emberData[i].speed * dt;
            arr[i * 3] += emberData[i].drift * dt * 60;
            if (y > 11) {
                y = 0;
                arr[i * 3] = (Math.random() - 0.5) * 24;
                arr[i * 3 + 2] = (Math.random() - 0.5) * 24;
            }
            arr[i * 3 + 1] = y;
        }
        attr.needsUpdate = true;
        dust.rotation.y += dt * 0.024;
    });

    useDestroy(() => {
        scene.remove(group);
        scene.background = prevBackground;
        scene.fog = prevFog;
        nebula.dispose();
        starGeo.dispose();
        dustGeo.dispose();
        emberGeo.dispose();
    });
}
