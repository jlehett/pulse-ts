import { TextureLoader } from 'three';

/**
 * Create a texture loader.
 * @returns The texture loader.
 */
export function createTextureLoader(): TextureLoader {
    return new TextureLoader();
}
