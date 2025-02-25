import * as THREE from 'three';

export function updateModelMaterials(model) {
    model.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material.envMapIntensity = 1;
            child.material.needsUpdate = true;
            if (child.material.map) {
                child.material.map.encoding = THREE.LinearEncoding;
            }
        }
    });
}
