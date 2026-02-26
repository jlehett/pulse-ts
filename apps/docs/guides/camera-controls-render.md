# Guide: Camera + Controls + Render

This end-to-end guide wires Core + `@pulse-ts/input` + `@pulse-ts/three` to move a camera with keyboard/mouse and render a scene.

## Prerequisites

- `@pulse-ts/core`
- `@pulse-ts/input`
- `@pulse-ts/three`

## Overview

- Create a `World`
- Install Three service and render system
- Install Input service and bindings
- Create a Functional Node for a camera rig that reads input and updates a `Transform`
- Start the world

## Steps

### 1) Initialize world and services

```ts
import { World } from '@pulse-ts/core';
import { installThree } from '@pulse-ts/three';
import { installInput, Axis2D, PointerMovement, PointerWheelScroll, Key } from '@pulse-ts/input';

// Canvas from your DOM
const canvas = document.getElementById('app') as HTMLCanvasElement;

const world = new World();

// Three: renderer + systems
const three = installThree(world, { canvas, clearColor: 0x101218 });

// Input: default WASD/mouse bindings
installInput(world, {
  preventDefault: true,
  pointerLock: true,
  bindings: {
    move: Axis2D({
      x: { pos: Key('D'), neg: Key('A') },
      y: { pos: Key('W'), neg: Key('S') },
    }),
    look: PointerMovement({ scaleX: 0.1, scaleY: 0.1 }),
    zoom: PointerWheelScroll({ scale: 1.0 }),
  },
});
```

### 2) Camera rig node

```ts
import { useComponent, useFrameUpdate, useFrameLate, useState, Transform, Vec3, Quat } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { useAxis2D, useAxis1D } from '@pulse-ts/input';

function CameraRig() {
  const t = useComponent(Transform);
  const move = useAxis2D('move'); // { x, y }
  const look = useAxis2D('look'); // { x, y }
  const zoom = useAxis1D('zoom');
  const { camera } = useThreeContext();

  // Camera control state
  const [getDist, setDist] = useState('distance', 10);
  const [getRot, setRot] = useState('rotation', 0);
  const [getTilt, setTilt] = useState('tilt', Math.PI / 4);

  useFrameUpdate(
    (dt) => {
      const rx = look().x;
      const ry = look().y;
      const rz = zoom();

      setRot((r) => r + rx * dt);
      setTilt((t) => r + ry * dt);
      setDist((d) => d + rz * dt);
    }
  );

  useFrameLate(
    () => {
      const d = getDist();
      const r = getRot();
      const ti = getTilt();
      const wp = t.worldPosition;

      // Calculate camera position based on rotation and tilt
      const x = wp.x + Math.sin(r) * Math.cos(ti) * d;
      const y = wp.y + Math.sin(ti) * d;
      const z = wp.z + Math.cos(r) * Math.cos(ti) * d;

      camera.position.set(x, y, z);
      camera.lookAt(wp.x, wp.y, wp.z);
    }
  );
}
```

### 3) Add some scene content

Add a few visible objects so camera motion is obvious.

```ts
import * as THREE from 'three';
import { useMesh, useObject3D } from '@pulse-ts/three';
import { useFrameUpdate } from '@pulse-ts/core';

function SceneContent() {
  // Helpers
  useObject3D(new THREE.GridHelper(20, 20, 0x555555, 0x333333));
  useObject3D(new THREE.AxesHelper(2));

  // Lights
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(3, 5, 2);
  useObject3D(dir);
  useObject3D(new THREE.AmbientLight(0xffffff, 0.25));

  // Spinning cube
  const { mesh } = useMesh('box', {
    size: [1, 1, 1],
    color: 0x3aa3ff,
    roughness: 0.6,
  });
  mesh.position.set(0, 0.5, 0);

  useFrameUpdate((dt) => {
    mesh.rotation.y += 0.6 * dt;
  });
}
```

### 4) Mount and run

```ts
world.mount(SceneContent);
world.mount(CameraRig);
world.start();
```

You now have a controllable camera and visible scene content.
