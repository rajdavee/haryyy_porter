import * as THREE from 'three';

export function setupLights(scene, locations) {
    // Remove any existing lights
    scene.children = scene.children.filter(child => !(child instanceof THREE.Light));

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Add directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(
        locations.lights.directional.position.x,
        locations.lights.directional.position.y,
        locations.lights.directional.position.z
    );
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Add warm point lights
    const pointLight1 = new THREE.PointLight(0xffeed1, 1.2);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffeed1, 1.2);
    pointLight2.position.set(-10, 10, -10);
    scene.add(pointLight2);

    return { ambientLight, dirLight, pointLight1, pointLight2 };
}
