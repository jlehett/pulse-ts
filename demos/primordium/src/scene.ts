import * as THREE from 'three';
import { useDestroy, useFixedUpdate, useFrameLate } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { DEFAULT_ROSTER, MatchController } from './game/match';
import { CARD_LIST } from './sim/genome';
import { createRng } from './sim/rng';
import { DEFAULT_CONFIG } from './sim/types';
import type { EcosystemConfig } from './sim/types';

/**
 * A big, slow-growing world: much larger than the default so factions have room
 * to maneuver, with `reproCooldownScale` stretching the exponential bloom so the
 * map fills gradually over the match instead of being blanketed in seconds.
 */
const SCENE_CONFIG: EcosystemConfig = {
    ...DEFAULT_CONFIG,
    worldSize: 340,
    fieldCells: 104,
    lightRegen: 0.05,
    capacity: 30000,
    reproCooldownScale: 3.5,
};

/** Colour for the neutral wildlife critters. */
const WILDLIFE_COLOR = 0x9aa5b1;

/** Extra scale applied to organism spheres so they read at world scale. */
const RENDER_SCALE = 1.6;
/** Seconds a newborn takes to grow to full size (birth animation). */
const GROW_TIME = 0.5;
/** Seconds a death marker takes to shrink away (death animation). */
const DEATH_FADE = 0.5;

const HUMAN_LINEAGE = 0; // you play the first roster entry; the rest are AI
const MATCH_OPTS = {
    eventIntervalSec: 30,
    matchLengthSec: 240,
    pressureRate: 0.01,
    maxPressurePerTurn: 5,
    humanLineage: HUMAN_LINEAGE,
    wildlifeCount: 350, // stable background target (spawner-maintained, not breeding)
};

/**
 * The playable demo, mounted as one node. Runs a {@link MatchController} where you
 * control one lineage and three AIs control the rest. The sim runs in real time
 * and pauses at each evolve turn so you can spend Evolutionary Pressure on cards;
 * the AIs play their plans automatically. Rendered as an orthographic isometric
 * terrarium (one `InstancedMesh` per caste, drawn from the SoA arrays) with a
 * biomass leaderboard. Highest biomass at the buzzer wins.
 */
export function PrimordiumScene(): void {
    const { scene, renderer } = useThreeContext();
    const cfg = SCENE_CONFIG;
    const half = cfg.worldSize / 2;

    const match = new MatchController(
        DEFAULT_ROSTER,
        createRng(20260804),
        cfg,
        MATCH_OPTS,
    );
    const eco = match.eco;
    eco.recordDeaths = true; // so we can animate deaths (fade-out) in the renderer
    const humanName = DEFAULT_ROSTER[HUMAN_LINEAGE].name;
    const casteColor = (k: number) => {
        const lin = eco.lineageOf[k];
        return lin < DEFAULT_ROSTER.length
            ? DEFAULT_ROSTER[lin].color
            : WILDLIFE_COLOR; // neutral wildlife
    };
    const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

    // --- Lighting ---------------------------------------------------------
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(1, 2, 1.5);
    scene.add(sun);

    // --- Ground plane, textured with the light field ----------------------
    const cells = cfg.fieldCells;
    const texData = new Uint8Array(cells * cells * 4);
    const tex = new THREE.DataTexture(texData, cells, cells, THREE.RGBAFormat);
    tex.needsUpdate = true;
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(cfg.worldSize, cfg.worldSize),
        new THREE.MeshBasicMaterial({ map: tex }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    scene.add(ground);

    // --- One instanced mesh per caste (per-instance colour = energy) -------
    const geo = new THREE.SphereGeometry(1, 6, 5);
    const meshes = eco.castes.map(() => {
        const mesh = new THREE.InstancedMesh(
            geo,
            // Base colour is white; per-instance colour carries caste colour dimmed
            // by the organism's energy, so healthy = bright, starving = dark.
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
            cfg.capacity,
        );
        mesh.frustumCulled = false;
        mesh.count = 0;
        scene.add(mesh);
        return mesh;
    });

    // Per-caste base colour as a THREE.Color, for tinting by energy.
    const baseColors = eco.castes.map((_, k) => new THREE.Color(casteColor(k)));
    const tint = new THREE.Color();

    // --- Combat hit flashes ----------------------------------------------
    const HIT_FLASH = 0.28; // seconds
    const HIT_CAP = 1500;
    const hitMesh = new THREE.InstancedMesh(
        new THREE.SphereGeometry(1, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
        HIT_CAP,
    );
    hitMesh.frustumCulled = false;
    hitMesh.count = 0;
    scene.add(hitMesh);
    let hits: { x: number; y: number; life: number }[] = [];

    // --- Orthographic isometric camera ------------------------------------
    const camera = new THREE.OrthographicCamera(
        -1,
        1,
        1,
        -1,
        0.1,
        cfg.worldSize * 4,
    );
    const iso = new THREE.Vector3(1, 1, 1).normalize();
    camera.position.copy(iso.multiplyScalar(cfg.worldSize * 1.5));
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);

    const fitCamera = () => {
        const el = renderer.domElement;
        const aspect = (el.clientWidth || 1) / (el.clientHeight || 1);
        const viewH = cfg.worldSize * 0.72;
        camera.top = viewH;
        camera.bottom = -viewH;
        camera.left = -viewH * aspect;
        camera.right = viewH * aspect;
        camera.updateProjectionMatrix();
    };
    fitCamera();

    // --- DOM leaderboard --------------------------------------------------
    const hud = document.createElement('div');
    hud.style.cssText =
        'position:fixed;top:12px;left:12px;color:#dfeaf2;' +
        'font:13px/1.6 ui-monospace,SFMono-Regular,monospace;' +
        'background:rgba(0,0,0,.5);padding:10px 14px;border-radius:8px;' +
        'pointer-events:none;white-space:pre;min-width:320px;';
    document.body.appendChild(hud);

    // --- Card panel (shown while paused at an evolve turn) -----------------
    const panel = document.createElement('div');
    panel.style.cssText =
        'position:fixed;top:0;right:0;height:100vh;width:340px;box-sizing:border-box;' +
        'display:none;overflow-y:auto;color:#e8eef4;' +
        'font:13px/1.5 ui-monospace,SFMono-Regular,monospace;' +
        'background:rgba(8,12,18,.94);border-left:1px solid #223;padding:16px;';
    document.body.appendChild(panel);

    const renderPanel = () => {
        const you = match.human;
        if (!you) return;
        const p = Math.floor(you.pressure);
        const cards = CARD_LIST.map((c) => {
            const owned = you.genome.includes(c);
            const afford = !owned && c.cost <= you.pressure;
            const bg = owned ? '#12261a' : afford ? '#16324a' : '#1a1f26';
            const fg = afford ? '#dff0ff' : '#5a6672';
            const tag = owned
                ? '<span style="color:#5ce07a">✓ owned</span>'
                : `<span style="color:#ffd24a">⚡${c.cost}</span>`;
            return (
                `<button data-card="${c.id}" ${afford ? '' : 'disabled'} ` +
                `style="display:block;width:100%;text-align:left;margin:6px 0;` +
                `padding:8px 10px;border:1px solid #2a3a4a;border-radius:6px;` +
                `background:${bg};color:${fg};cursor:${afford ? 'pointer' : 'default'};` +
                `font:inherit">` +
                `<b>${c.name}</b>  ${tag}` +
                `<br><small style="color:#9fb0bf">${c.text}</small></button>`
            );
        }).join('');
        const genome = you.genome.length
            ? you.genome.map((c) => c.name).join(', ')
            : '(base genome)';
        panel.innerHTML =
            `<div style="font-size:15px"><b>EVOLVE TURN ${match.eventCount}</b></div>` +
            `<div style="margin:6px 0 12px">Evolve <b style="color:${hex(
                DEFAULT_ROSTER[HUMAN_LINEAGE].color,
            )}">${humanName}</b> — you have ` +
            `<b style="color:#ffd24a">⚡ ${p}</b> Pressure</div>` +
            `<div style="margin-bottom:10px;color:#9fb0bf">Genome: ${genome}</div>` +
            cards +
            `<button data-resume style="width:100%;margin-top:14px;padding:10px;` +
            `border:0;border-radius:6px;background:#2e7d32;color:#fff;` +
            `cursor:pointer;font:inherit"><b>Resume ▶</b></button>`;
    };

    panel.addEventListener('click', (e) => {
        const el = e.target as HTMLElement;
        const cardBtn = el.closest('[data-card]') as HTMLElement | null;
        if (cardBtn) {
            const card = CARD_LIST.find((c) => c.id === cardBtn.dataset.card);
            if (card && match.playHumanCard(card)) renderPanel();
            return;
        }
        if (el.closest('[data-resume]')) match.resume();
    });

    // --- Update wiring -----------------------------------------------------
    const dummy = new THREE.Object3D();
    const counts = new Array(meshes.length).fill(0);
    // Transient death markers: shrinking ghosts left where organisms died.
    let markers: { x: number; y: number; caste: number; life: number }[] = [];

    useFixedUpdate(() => {
        match.step(); // no-ops while paused for the player or finished
    });

    useFrameLate((dt) => {
        const pop = eco.pop;

        counts.fill(0);
        // Living organisms — newborns grow in over GROW_TIME; per-instance colour
        // is the caste colour dimmed by energy (bright = healthy, dark = starving).
        for (let i = 0; i < pop.count; i++) {
            const k = pop.caste[i];
            const cs = eco.castes[k];
            const grow = Math.min(1, pop.age[i] / GROW_TIME);
            dummy.position.set(pop.x[i] - half, 0, pop.y[i] - half);
            dummy.scale.setScalar(cs.size * RENDER_SCALE * grow);
            dummy.updateMatrix();
            meshes[k].setMatrixAt(counts[k], dummy.matrix);
            const ref = cs.spawnThreshold < 12 ? cs.spawnThreshold : 12;
            const b = Math.max(
                0.28,
                Math.min(1, 0.28 + (0.72 * pop.energy[i]) / ref),
            );
            tint.copy(baseColors[k]).multiplyScalar(b);
            meshes[k].setColorAt(counts[k], tint);
            counts[k]++;
        }

        // Collect this frame's deaths as shrinking markers, then age all markers.
        for (let d = 0; d < eco.deathX.length; d++) {
            markers.push({
                x: eco.deathX[d],
                y: eco.deathY[d],
                caste: eco.deathCaste[d],
                life: DEATH_FADE,
            });
        }
        // Collect this frame's combat kills as expanding flashes.
        for (let d = 0; d < eco.hitX.length; d++) {
            hits.push({ x: eco.hitX[d], y: eco.hitY[d], life: HIT_FLASH });
        }
        eco.clearDeaths();

        const survivors: typeof markers = [];
        for (const m of markers) {
            m.life -= dt;
            if (m.life <= 0) continue;
            survivors.push(m);
            const k = m.caste;
            if (counts[k] >= cfg.capacity) continue; // mesh full — skip drawing
            const fade = m.life / DEATH_FADE;
            dummy.position.set(m.x - half, 0, m.y - half);
            dummy.scale.setScalar(eco.castes[k].size * RENDER_SCALE * fade);
            dummy.updateMatrix();
            meshes[k].setMatrixAt(counts[k], dummy.matrix);
            tint.copy(baseColors[k]).multiplyScalar(0.5 * fade);
            meshes[k].setColorAt(counts[k], tint);
            counts[k]++;
        }
        markers = survivors;

        for (let k = 0; k < meshes.length; k++) {
            meshes[k].count = counts[k];
            meshes[k].instanceMatrix.needsUpdate = true;
            if (meshes[k].instanceColor)
                meshes[k].instanceColor!.needsUpdate = true;
        }

        // Combat flashes: bright spheres that expand and dim quickly.
        const liveHits: typeof hits = [];
        let hc = 0;
        for (const h of hits) {
            h.life -= dt;
            if (h.life <= 0) continue;
            liveHits.push(h);
            if (hc >= HIT_CAP) continue;
            const t = 1 - h.life / HIT_FLASH; // 0 → 1 over the flash
            dummy.position.set(h.x - half, 0.5, h.y - half);
            dummy.scale.setScalar((1 + t * 3) * RENDER_SCALE);
            dummy.updateMatrix();
            hitMesh.setMatrixAt(hc, dummy.matrix);
            tint.setScalar(1 - t); // white → black (fades on the dark ground)
            hitMesh.setColorAt(hc, tint);
            hc++;
        }
        hits = liveHits;
        hitMesh.count = hc;
        hitMesh.instanceMatrix.needsUpdate = true;
        if (hitMesh.instanceColor) hitMesh.instanceColor.needsUpdate = true;

        // Paint the light field into the ground texture (teal = light present).
        const v = eco.light.values;
        for (let idx = 0; idx < v.length; idx++) {
            const l = v[idx] / cfg.lightCap;
            const o = idx * 4;
            texData[o] = 8 * l;
            texData[o + 1] = 40 * l;
            texData[o + 2] = 52 * l;
            texData[o + 3] = 255;
        }
        tex.needsUpdate = true;

        fitCamera();
        renderer.render(scene, camera);

        // Show/hide the evolve panel as the match pauses/resumes.
        const showing = panel.style.display !== 'none';
        if (match.awaitingPlayer && !showing) {
            renderPanel();
            panel.style.display = 'block';
        } else if (!match.awaitingPlayer && showing) {
            panel.style.display = 'none';
        }

        // Leaderboard.
        const rows = match.standings();
        const header = match.finished
            ? `<b>PRIMORDIUM</b>   FINAL   winner: ${rows[0].name}`
            : match.awaitingPlayer
              ? `<b>PRIMORDIUM</b>   ⏸ EVOLVE TURN ${match.eventCount} — play your cards →`
              : `<b>PRIMORDIUM</b>   t = ${eco.time.toFixed(0)}s / ${MATCH_OPTS.matchLengthSec}s`;
        const board = rows
            .map((r) => {
                const you = r.name === humanName ? ' (you)' : '';
                return (
                    `<span style="color:${hex(r.color)}">●</span> ` +
                    `${(r.name + you).padEnd(11)} ${r.biomass.toFixed(0).padStart(6)}  ` +
                    `⚡${String(Math.floor(r.pressure)).padStart(3)}  ${r.cards}c`
                );
            })
            .join('\n');

        // Round log — what each lineage evolved last turn, so the game is readable
        // at the strategy level, not just the sphere soup.
        const played = match.lastPlays.filter((pl) => pl.cards.length > 0);
        const log =
            match.eventCount > 0 && !match.awaitingPlayer && played.length
                ? `\n\n<b>Last evolve (turn ${match.eventCount}):</b>\n` +
                  played
                      .map(
                          (pl) =>
                              `<span style="color:${hex(pl.color)}">●</span> ` +
                              `${pl.name}: ${pl.cards.map((c) => c.name).join(', ')}`,
                      )
                      .join('\n')
                : '';

        hud.innerHTML = header + '\n\n' + board + log;
    });

    useDestroy(() => {
        hud.remove();
        panel.remove();
        scene.remove(ground, ...meshes, hitMesh, sun);
        for (const m of meshes) m.dispose();
        hitMesh.dispose();
        geo.dispose();
        tex.dispose();
    });
}
