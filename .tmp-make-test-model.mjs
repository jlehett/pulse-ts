// Generates a minimal valid glTF (magenta box) with Idle/Walk/Attack/Death
// TRS animations, for verifying the custom unit-model + animation pipeline.
// Run from demos/overclock so 'three' resolves.
import fs from 'node:fs';
import * as THREE from 'three';

const geo = new THREE.BoxGeometry(0.8, 1.4, 0.8);
const pos = geo.attributes.position.array; // Float32Array
const nrm = geo.attributes.normal.array;
const idx = new Uint16Array(geo.index.array);

const pad4 = (n) => Math.ceil(n / 4) * 4;
const chunks = [];
let offset = 0;
const bufferViews = [];
const accessors = [];

function push(arr, { target, type, componentType, withMinMax } = {}) {
    const bytes = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
    const byteOffset = offset;
    chunks.push({ bytes, byteOffset });
    offset = pad4(byteOffset + bytes.length);
    const viewIndex = bufferViews.length;
    const view = { buffer: 0, byteOffset, byteLength: bytes.length };
    if (target) view.target = target;
    bufferViews.push(view);
    const comps = { SCALAR: 1, VEC3: 3, VEC4: 4 }[type];
    const acc = {
        bufferView: viewIndex,
        componentType,
        count: arr.length / comps,
        type,
    };
    if (withMinMax) {
        const min = Array(comps).fill(Infinity);
        const max = Array(comps).fill(-Infinity);
        for (let i = 0; i < arr.length; i += comps) {
            for (let k = 0; k < comps; k++) {
                min[k] = Math.min(min[k], arr[i + k]);
                max[k] = Math.max(max[k], arr[i + k]);
            }
        }
        acc.min = min;
        acc.max = max;
    }
    accessors.push(acc);
    return accessors.length - 1;
}

const idxAcc = push(idx, {
    target: 34963,
    type: 'SCALAR',
    componentType: 5123,
});
const posAcc = push(new Float32Array(pos), {
    target: 34962,
    type: 'VEC3',
    componentType: 5126,
    withMinMax: true,
});
const nrmAcc = push(new Float32Array(nrm), {
    target: 34962,
    type: 'VEC3',
    componentType: 5126,
});

const quatZ = (a) => [0, 0, Math.sin(a / 2), Math.cos(a / 2)];
const quatY = (a) => [0, Math.sin(a / 2), 0, Math.cos(a / 2)];
const quatX = (a) => [Math.sin(a / 2), 0, 0, Math.cos(a / 2)];

const animations = [];
function addClip(name, path, times, values) {
    const timeAcc = push(new Float32Array(times), {
        type: 'SCALAR',
        componentType: 5126,
        withMinMax: true,
    });
    const valAcc = push(new Float32Array(values.flat()), {
        type: path === 'rotation' ? 'VEC4' : 'VEC3',
        componentType: 5126,
    });
    animations.push({
        name,
        samplers: [{ input: timeAcc, output: valAcc }],
        channels: [{ sampler: 0, target: { node: 0, path } }],
    });
}

addClip('Idle', 'scale', [0, 0.6, 1.2], [
    [1, 1, 1],
    [1.18, 0.82, 1.18],
    [1, 1, 1],
]);
addClip('Walk', 'rotation', [0, 0.3, 0.6], [
    quatZ(-0.3),
    quatZ(0.3),
    quatZ(-0.3),
]);
addClip('Attack', 'rotation', [0, 0.2, 0.4], [
    quatY(0),
    quatY(Math.PI),
    quatY(Math.PI * 2),
]);
addClip('Death', 'rotation', [0, 0.8], [quatX(0), quatX(Math.PI / 2)]);

const total = offset;
const buf = Buffer.alloc(total);
for (const c of chunks) c.bytes.copy(buf, c.byteOffset);

const gltf = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [
        {
            primitives: [
                {
                    attributes: { POSITION: posAcc, NORMAL: nrmAcc },
                    indices: idxAcc,
                    material: 0,
                },
            ],
        },
    ],
    materials: [
        {
            pbrMetallicRoughness: {
                baseColorFactor: [1, 0.1, 0.9, 1],
                metallicFactor: 0.1,
                roughnessFactor: 0.5,
            },
            emissiveFactor: [0.4, 0, 0.35],
        },
    ],
    animations,
    buffers: [
        {
            byteLength: total,
            uri:
                'data:application/octet-stream;base64,' +
                buf.toString('base64'),
        },
    ],
    bufferViews,
    accessors,
};

fs.writeFileSync('public/models/test-box.gltf', JSON.stringify(gltf));
console.log('wrote public/models/test-box.gltf', total, 'buffer bytes');
