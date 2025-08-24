import { TextureLoader } from 'three';

export function createTextureLoader(): TextureLoader {
    return new TextureLoader();
}