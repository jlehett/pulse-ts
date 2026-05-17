export type BoundaryShape = 'circle' | 'rectangle' | 'hexagon';

export interface ObstacleConfig {
    position: [x: number, z: number];
    type: 'pillar' | 'wall';
    radius?: number;
    width?: number;
    depth?: number;
    height?: number;
}

export interface SpawnPoint {
    position: [x: number, z: number];
    direction: [x: number, z: number];
}

export interface MapConfig {
    id: string;
    name: string;
    boundaryShape: BoundaryShape;
    boundaryRadius: number;
    obstacles: ObstacleConfig[];
    enemySpawns: SpawnPoint[];
    playerSpawns: [x: number, z: number][];
}

export const MAP_NEXUS: MapConfig = {
    id: 'nexus',
    name: 'Nexus',
    boundaryShape: 'circle',
    boundaryRadius: 18,
    obstacles: [
        { position: [0, 0], type: 'pillar', radius: 1.2, height: 4 },
        { position: [6, 0], type: 'pillar', radius: 0.6, height: 2.5 },
        { position: [-6, 0], type: 'pillar', radius: 0.6, height: 2.5 },
        { position: [0, 6], type: 'pillar', radius: 0.6, height: 2.5 },
        { position: [0, -6], type: 'pillar', radius: 0.6, height: 2.5 },
    ],
    enemySpawns: [
        { position: [17, 0], direction: [-1, 0] },
        { position: [-17, 0], direction: [1, 0] },
        { position: [0, 17], direction: [0, -1] },
        { position: [0, -17], direction: [0, 1] },
        { position: [12, 12], direction: [-1, -1] },
        { position: [-12, 12], direction: [1, -1] },
        { position: [12, -12], direction: [-1, 1] },
        { position: [-12, -12], direction: [1, 1] },
    ],
    playerSpawns: [
        [-3, -3],
        [3, -3],
        [-3, 3],
        [3, 3],
    ],
};

export const MAP_FRACTURE: MapConfig = {
    id: 'fracture',
    name: 'Fracture',
    boundaryShape: 'rectangle',
    boundaryRadius: 20,
    obstacles: [
        { position: [-8, -4], type: 'wall', width: 3, depth: 0.4, height: 2.5 },
        { position: [8, 4], type: 'wall', width: 3, depth: 0.4, height: 2.5 },
        { position: [-4, 6], type: 'pillar', radius: 0.8, height: 3 },
        { position: [4, -6], type: 'pillar', radius: 0.8, height: 3 },
        { position: [0, 0], type: 'wall', width: 5, depth: 0.4, height: 2 },
    ],
    enemySpawns: [
        { position: [19, 0], direction: [-1, 0] },
        { position: [-19, 0], direction: [1, 0] },
        { position: [0, 13], direction: [0, -1] },
        { position: [0, -13], direction: [0, 1] },
        { position: [19, 10], direction: [-1, -1] },
        { position: [-19, -10], direction: [1, 1] },
    ],
    playerSpawns: [
        [-5, 0],
        [5, 0],
        [0, -4],
        [0, 4],
    ],
};

export const MAP_CONVERGENCE: MapConfig = {
    id: 'convergence',
    name: 'Convergence',
    boundaryShape: 'hexagon',
    boundaryRadius: 18,
    obstacles: [
        { position: [9, 0], type: 'pillar', radius: 0.9, height: 3.5 },
        { position: [-9, 0], type: 'pillar', radius: 0.9, height: 3.5 },
        { position: [4.5, 7.8], type: 'pillar', radius: 0.9, height: 3.5 },
        { position: [-4.5, 7.8], type: 'pillar', radius: 0.9, height: 3.5 },
        { position: [4.5, -7.8], type: 'pillar', radius: 0.9, height: 3.5 },
        { position: [-4.5, -7.8], type: 'pillar', radius: 0.9, height: 3.5 },
    ],
    enemySpawns: [
        { position: [17, 0], direction: [-1, 0] },
        { position: [-17, 0], direction: [1, 0] },
        { position: [8.5, 14.7], direction: [-0.5, -0.87] },
        { position: [-8.5, 14.7], direction: [0.5, -0.87] },
        { position: [8.5, -14.7], direction: [-0.5, 0.87] },
        { position: [-8.5, -14.7], direction: [0.5, 0.87] },
    ],
    playerSpawns: [
        [-2, -2],
        [2, -2],
        [-2, 2],
        [2, 2],
    ],
};

export const ALL_MAPS: MapConfig[] = [MAP_NEXUS, MAP_FRACTURE, MAP_CONVERGENCE];
