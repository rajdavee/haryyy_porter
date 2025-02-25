import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { locations } from './config/locations.js';
import { createLogger, removeAllLoggers } from './config/loggers.js'
import { portalVertexShader, portalFragmentShader } from './shaders/portal.js';
import { portalTexts } from './config/portalText.js';
import { setupLights } from './lights.js';
import { SceneManager } from './sceneManager.js';

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Add fog to scene at start
scene.fog = new THREE.Fog(0x000000, 1, 1000);

// Camera - Update position and rotation to the specified coordinates
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100000)
camera.position.set(
    locations.camera.initial.position.x,
    locations.camera.initial.position.y,
    locations.camera.initial.position.z
);

camera.rotation.set(
    THREE.MathUtils.degToRad(locations.camera.initial.rotation.x),
    THREE.MathUtils.degToRad(locations.camera.initial.rotation.y),
    THREE.MathUtils.degToRad(locations.camera.initial.rotation.z)
);
scene.add(camera)

// Define waypoints (different locations in the hall)
const waypoints = locations.waypoints;

let currentWaypoint = 0;

// Create loggers
const navigationLogger = createLogger('navigation');
const portalLogger = createLogger('portal');
const cameraLogger = createLogger('camera');
const scaleLogger = createLogger('scale');

// Add navigation controls
window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowRight':
            // Move to next waypoint
            currentWaypoint = (currentWaypoint + 1) % waypoints.length;
            moveToWaypoint(currentWaypoint);
            break;
        case 'ArrowLeft':
            // Move to previous waypoint
            currentWaypoint = (currentWaypoint - 1 + waypoints.length) % waypoints.length;
            moveToWaypoint(currentWaypoint);
            break;
    }
});

// Add click handler for portal placement
window.addEventListener('click', (event) => {
    // Get click coordinates as percentage of window
    const x = (event.clientX / window.innerWidth) * 100;
    const y = (event.clientY / window.innerHeight) * 100;

    // Get current camera details
    const pos = camera.position;
    const rot = camera.rotation;

    // Log potential portal location
    console.log('Portal Location:', {
        screenPosition: {
            x: x.toFixed(2) + '%',
            y: y.toFixed(2) + '%'
        },
        cameraPosition: {
            x: pos.x.toFixed(2),
            y: pos.y.toFixed(2),
            z: pos.z.toFixed(2)
        },
        cameraRotation: {
            x: THREE.MathUtils.radToDeg(rot.x).toFixed(2),
            y: THREE.MathUtils.radToDeg(rot.y).toFixed(2),
            z: THREE.MathUtils.radToDeg(rot.z).toFixed(2)
        }
    });
});

// Function to move camera to waypoint
function moveToWaypoint(index) {
    const waypoint = waypoints[index];
    const duration = 3000;

    // Animate position and rotation
    new TWEEN.Tween(camera.position)
        .to(waypoint.position, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();

    new TWEEN.Tween(camera.rotation)
        .to({
            x: THREE.MathUtils.degToRad(waypoint.rotation.x),
            y: THREE.MathUtils.degToRad(waypoint.rotation.y),
            z: THREE.MathUtils.degToRad(waypoint.rotation.z)
        }, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start()
        .onComplete(() => {
            if (index === 1) {
                if (!portal) {
                    portal = createPortal();
                }
                // First move to staff table position
                const staffTablePosition = {
                    position: { x: -99.97, y: -157.00, z: 0.96 },
                    rotation: { x: 66.18, y: -88.64, z: 66.17 }
                };

                new TWEEN.Tween(camera.position)
                    .to(staffTablePosition.position, 2000)
                    .easing(TWEEN.Easing.Cubic.InOut)
                    .start();

                new TWEEN.Tween(camera.rotation)
                    .to({
                        x: THREE.MathUtils.degToRad(staffTablePosition.rotation.x),
                        y: THREE.MathUtils.degToRad(staffTablePosition.rotation.y),
                        z: THREE.MathUtils.degToRad(staffTablePosition.rotation.z)
                    }, 2000)
                    .easing(TWEEN.Easing.Cubic.InOut)
                    .start()
                    .onComplete(() => {
                        startPortalSequence();
                    });
            }
        });
}

// Add function to handle portal sequence
function startPortalSequence() {
    const overlay = document.getElementById('portalOverlay');
    let step = 0;
    overlay.style.opacity = '1';

    const sequence = setInterval(() => {
        if (step < portalTexts.activate.length) {
            overlay.innerHTML = `
                <div class="portal-text">${portalTexts.hover}</div>
                <div class="portal-spell">${portalTexts.activate[step]}</div>
                <div class="portal-runes">${generateRunes()}</div>
            `;
            step++;
        } else {
            clearInterval(sequence);

            // Add enter chamber button
            overlay.innerHTML = `
                <div class="portal-text">Enter the Chamber of Secrets</div>
                <div class="portal-spell">Descend into darkness...</div>
                <div class="portal-runes">${generateRunes()}</div>
                <button id="enterChamber" class="enter-chamber-btn">Enter Chamber</button>
            `;

            // Add click handler for enter button
            document.getElementById('enterChamber').addEventListener('click', () => {
                loadChamberOfSecrets();
                setTimeout(() => {
                    overlay.style.opacity = '0';
                }, 1500);
            });
        }
    }, 1000);
}

// Helper function to generate random runes
function generateRunes() {
    return Array(5).fill(0)
        .map(() => String.fromCharCode(0x16A0 + Math.floor(Math.random() * 76)))
        .join(' ');
}

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.screenSpacePanning = false
controls.minDistance = 100
controls.maxDistance = 5000
controls.target.set(0, 0, 0)

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    preserveDrawingBuffer: true
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x808080) // Restore original gray background
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// Model loader
const loader = new GLTFLoader()

// Keep track of the model
let modelRef = null;
let currentScale = 1;

loader.load(
    '/models/hogwarts_grand_hall/scene.gltf',
    (gltf) => {
        // Get the size of the model
        const box = new THREE.Box3().setFromObject(gltf.scene)
        const size = box.getSize(new THREE.Vector3())

        // Calculate scale based on size
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 1000 / maxDim // Scale to roughly 1000 units
        gltf.scene.scale.setScalar(scale)

        // Center the model
        const center = box.getCenter(new THREE.Vector3())
        gltf.scene.position.x = -center.x * scale
        gltf.scene.position.y = -center.y * scale
        gltf.scene.position.z = -center.z * scale

        modelRef = gltf.scene;
        currentScale = scale; // Store initial scale

        // Add keyboard controls for scaling
        window.addEventListener('keydown', (event) => {
            switch (event.key) {
                case '+':
                case '=':
                    currentScale *= 1.1; // Increase scale by 10%
                    modelRef.scale.setScalar(currentScale);
                    break;
                case '-':
                case '_':
                    currentScale *= 0.9; // Decrease scale by 10%
                    modelRef.scale.setScalar(currentScale);
                    break;
            }
        });

        scene.add(gltf.scene)

        // Start automatic navigation sequence after model loads
        setTimeout(() => {
            // Simply move to Staff Table after delay
            moveToWaypoint(1);
            currentWaypoint = 1;
        }, 2000); // Wait 2 seconds after model loads before moving

        // Update controls target to match the new camera position
        controls.target.set(0, -154.82, 0) // Keep Y the same as camera
        controls.update()

        // Log for debugging
        console.log('Model loaded', {
            size: size,
            scale: scale,
            position: gltf.scene.position
        })

        // Apply material updates
        updateModelMaterials(gltf.scene)
    },
    (progress) => {
        console.log('Loading:', (progress.loaded / progress.total * 100) + '%')
    },
    (error) => {
        console.error('Error:', error)
    }
)

// Create function to setup portal
function createPortal() {
    const { position, rotation, dimensions } = locations.portal;

    // Create portal group
    const portalGroup = new THREE.Group();

    // Create main portal with custom shader
    const portalGeometry = new THREE.PlaneGeometry(dimensions.width, dimensions.height, 32, 32);
    const portalMaterial = new THREE.ShaderMaterial({
        vertexShader: portalVertexShader,
        fragmentShader: portalFragmentShader,
        uniforms: {
            time: { value: 0 },
            portalColor1: { value: new THREE.Color(0x00ffff) },
            portalColor2: { value: new THREE.Color(0x0000ff) },
            hoverState: { value: 0.0 }
        },
        transparent: true,
        side: THREE.DoubleSide
    });

    const portal = new THREE.Mesh(portalGeometry, portalMaterial);

    // Add energy ring effect
    const ringGeometry = new THREE.TorusGeometry(dimensions.width * 0.5, 10, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.5
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);

    // Add particle system for sparkles
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * dimensions.width * 0.5;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        sizes[i] = Math.random() * 2;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particlesMaterial = new THREE.PointsMaterial({
        color: 0x00ffff,
        size: 2,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);

    // Add everything to portal group
    portalGroup.add(portal);
    portalGroup.add(ring);
    portalGroup.add(particles);

    // Position and rotate
    portalGroup.position.copy(new THREE.Vector3(position.x, position.y, position.z));
    portalGroup.rotation.set(
        THREE.MathUtils.degToRad(rotation.x),
        THREE.MathUtils.degToRad(rotation.y),
        THREE.MathUtils.degToRad(rotation.z)
    );

    // Add to scene
    scene.add(portalGroup);

    // Store animation properties
    portal.userData.isPortal = true;
    portal.userData.ring = ring;
    portal.userData.particles = particles;
    portal.userData.animate = (time) => {
        // Update shader time
        portalMaterial.uniforms.time.value = time;

        // Rotate ring
        ring.rotation.z = time * 0.5;

        // Animate particles
        const positions = particlesGeometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3 + 2] = Math.sin(time * 2 + i) * 5;
        }
        particlesGeometry.attributes.position.needsUpdate = true;
    };

    // Add portal interaction with raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const overlay = document.getElementById('portalOverlay');

    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(portal);

        if (intersects.length > 0) {
            // Mouse is over portal
            portalMaterial.uniforms.hoverState.value = 1.0;
            document.body.style.cursor = 'pointer';
        } else {
            // Mouse is not over portal
            portalMaterial.uniforms.hoverState.value = 0.0;
            document.body.style.cursor = 'default';
        }
    });

    window.addEventListener('click', (event) => {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(portal);

        if (intersects.length > 0) {
            // Portal clicked
            let step = 0;
            overlay.style.opacity = '1';

            const sequence = setInterval(() => {
                if (step < portalTexts.activate.length) {
                    overlay.innerHTML = `
                        <div class="portal-text">${portalTexts.hover}</div>
                        <div class="portal-spell">${portalTexts.activate[step]}</div>
                        <div class="portal-runes">${generateRunes()}</div>
                    `;
                    step++;
                } else {
                    clearInterval(sequence);
                    // Add your transition code here
                }
            }, 1500);
        }
    });

    // Helper function to generate random runes
    function generateRunes() {
        return Array(5).fill(0)
            .map(() => String.fromCharCode(0x16A0 + Math.floor(Math.random() * 76)))
            .join(' ');
    }

    return portal;
}

let portal = null;

// Handle window resize
window.addEventListener('resize', () => {
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Animation loop
const clock = new THREE.Clock();

const animate = () => {
    // Update controls
    controls.update()

    // Update TWEEN
    TWEEN.update()

    // Update camera position logger
    const pos = camera.position
    const rot = camera.rotation
    cameraLogger.innerHTML = `
        Camera Position:
        x: ${pos.x.toFixed(2)}
        y: ${pos.y.toFixed(2)}
        z: ${pos.z.toFixed(2)}
        
        Camera Rotation:
        x: ${THREE.MathUtils.radToDeg(rot.x).toFixed(2)}°
        y: ${THREE.MathUtils.radToDeg(rot.y).toFixed(2)}°
        z: ${THREE.MathUtils.radToDeg(rot.z).toFixed(2)}°
    `.replace(/\n/g, '<br>')

    // Update scale logger if model exists
    if (modelRef) {
        scaleLogger.innerHTML = `
            Model Scale: ${currentScale.toFixed(4)}
            Use + and - keys to adjust scale
        `.replace(/\n/g, '<br>')
    }

    // Update navigation logger
    navigationLogger.innerHTML = `
        Location: ${waypoints[currentWaypoint].name}
        (${currentWaypoint + 1}/${waypoints.length})
        
        Use ← → arrows to navigate
    `.replace(/\n/g, '<br>')

    // Update portal logger with mouse position
    const mouseX = (scene.userData.mouseX || 0).toFixed(2);
    const mouseY = (scene.userData.mouseY || 0).toFixed(2);
    portalLogger.innerHTML = `
        Click anywhere to log portal position
        Current mouse position:
        x: ${mouseX}%
        y: ${mouseY}%
    `.replace(/\n/g, '<br>');

    // Update portal measurements and references if portal exists
    if (portal && portal.userData.updateMeasurements) {
        portal.userData.updateMeasurements();

        // Update reference objects scale
        const refs = portal.userData.referenceObjects;
        if (refs) {
            refs.human.scale.set(portal.scale.x, portal.scale.y, 1);
            refs.widthLine.scale.set(portal.scale.x, portal.scale.y, 1);
            refs.heightLine.scale.set(portal.scale.x, portal.scale.y, 1);
        }
    }

    // Update portal effects
    if (portal) {
        portal.userData.animate(clock.getElapsedTime());
    }

    // Update any model animations
    scene.traverse((object) => {
        if (object.userData.mixer) {
            object.userData.mixer.update(clock.getDelta());
        }
    });

    // Render
    renderer.render(scene, camera)

    // Call animate again on the next frame
    window.requestAnimationFrame(animate)
}

animate()

// Track mouse position
window.addEventListener('mousemove', (event) => {
    scene.userData.mouseX = (event.clientX / window.innerWidth) * 100;
    scene.userData.mouseY = (event.clientY / window.innerHeight) * 100;
});

// Add portal interaction
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(scene.children)

    for (const intersect of intersects) {
        if (intersect.object.userData.isPortal) {
            // Portal clicked - add your portal transition effect here
            console.log('Portal activated!')

            // Example transition effect
            new TWEEN.Tween(scene.fog)
                .to({ density: 0.1 }, 1000)
                .easing(TWEEN.Easing.Quadratic.In)
                .start()
                .onComplete(() => {
                    // Load new scene or teleport here
                    console.log('Portal transition complete')
                })
        }
    }
})

// Add function to toggle debug mode
function toggleDebugMode() {
    const debugElements = document.querySelectorAll('[data-logger]');
    debugElements.forEach(el => {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    });
}

// Toggle debug mode with a key (e.g., 'H' key)
window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'h') {
        toggleDebugMode();
    }
});

// Add toggle for reference objects
window.addEventListener('keydown', (event) => {
    if (event.key === 'r' && portal) {
        const refs = portal.userData.referenceObjects;
        Object.values(refs).forEach(ref => {
            ref.visible = !ref.visible;
        });
    }
});

// Add CSS for enter chamber button
const style = document.createElement('style');
style.textContent = `
    .enter-chamber-btn {
        margin-top: 30px;
        padding: 15px 30px;
        font-size: 24px;
        font-family: 'Luminari', fantasy;
        color: #9b6dff;
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid #9b6dff;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
        text-shadow: 0 0 10px #9b6dff;
        box-shadow: 0 0 20px rgba(155, 109, 255, 0.3);
        pointer-events: auto;
    }

    .enter-chamber-btn:hover {
        background: rgba(155, 109, 255, 0.2);
        transform: scale(1.05);
        box-shadow: 0 0 30px rgba(155, 109, 255, 0.5);
    }
`;
document.head.appendChild(style);

// Update lighting
scene.remove(...scene.children.filter(child => child instanceof THREE.Light))

// Update fog settings
scene.fog = new THREE.Fog(0x808080, 100, 2000) // Match background color

// Update material settings
function updateModelMaterials(model) {
    model.traverse((child) => {
        if (child.isMesh) {
            if (child.material) {
                child.material.envMapIntensity = 1
                child.material.needsUpdate = true
                // Restore original material settings
                if (child.material.map) {
                    child.material.map.encoding = THREE.LinearEncoding
                }
            }
        }
    })
}

// Update chamber loading function with specific chamber coordinates
function loadChamberOfSecrets() {
    const fadeOutDuration = 2000;
    const initialChamberPosition = {
        position: { x: -417.94, y: -229.70, z: 67.48 },
        rotation: { x: 73.63, y: -60.20, z: 71.30 }
    };
    const finalChamberPosition = {
        position: { x: -145.76, y: -189.59, z: -40.97 },
        rotation: { x: 139.68, y: -69.76, z: 141.47 }
    };

    new TWEEN.Tween(scene.fog)
        .to({ far: 10 }, fadeOutDuration)
        .easing(TWEEN.Easing.Quadratic.In)
        .start()
        .onComplete(() => {
            // Remove ALL existing objects except lights and camera
            const objectsToRemove = scene.children.filter(child =>
                !(child instanceof THREE.Light) &&
                !(child instanceof THREE.Camera)
            );
            objectsToRemove.forEach(obj => scene.remove(obj));

            // First move to initial chamber position
            new TWEEN.Tween(camera.position)
                .to(initialChamberPosition.position, 2000)
                .easing(TWEEN.Easing.Cubic.InOut)
                .start();

            new TWEEN.Tween(camera.rotation)
                .to({
                    x: THREE.MathUtils.degToRad(initialChamberPosition.rotation.x),
                    y: THREE.MathUtils.degToRad(initialChamberPosition.rotation.y),
                    z: THREE.MathUtils.degToRad(initialChamberPosition.rotation.z)
                }, 2000)
                .easing(TWEEN.Easing.Cubic.InOut)
                .start()
                .onComplete(() => {
                    // Then move to final chamber position after a delay
                    setTimeout(() => {
                        new TWEEN.Tween(camera.position)
                            .to(finalChamberPosition.position, 2000)
                            .easing(TWEEN.Easing.Cubic.InOut)
                            .start();

                        new TWEEN.Tween(camera.rotation)
                            .to({
                                x: THREE.MathUtils.degToRad(finalChamberPosition.rotation.x),
                                y: THREE.MathUtils.degToRad(finalChamberPosition.rotation.y),
                                z: THREE.MathUtils.degToRad(finalChamberPosition.rotation.z)
                            }, 2000)
                            .easing(TWEEN.Easing.Cubic.InOut)
                            .start()
                            .onComplete(() => {
                                // Load Firecrab model with correct position and rotation
                                loader.load('/models/firecrab/scene.gltf', (gltf) => {
                                    const firecrab = gltf.scene;
                                    firecrab.scale.setScalar(25); // Keep larger scale

                                    // Adjusted Y position to move lower
                                    firecrab.position.set(95.26, -230.14, 30.06); // Changed Y from -150.14 to -180.14
                                    firecrab.rotation.set(
                                        THREE.MathUtils.degToRad(-8.84),
                                        THREE.MathUtils.degToRad(72.29),
                                        THREE.MathUtils.degToRad(8.43)
                                    );

                                    scene.add(firecrab);

                                    // Add animation if the model has it
                                    if (gltf.animations && gltf.animations.length) {
                                        const mixer = new THREE.AnimationMixer(firecrab);
                                        const action = mixer.clipAction(gltf.animations[0]);
                                        action.play();

                                        // Add mixer to animation loop
                                        firecrab.userData.mixer = mixer;
                                    }
                                });
                            });
                    }, 1000); // Wait 1 second before moving to final position
                });

            // Load Chamber of Secrets model
            sceneManager.loadModel('/models/chamber_of_secrets/scene.gltf', (model) => {
                model.rotation.set(0, Math.PI, 0);
                model.position.set(0, -100, 0);

                // Fade back in
                new TWEEN.Tween(scene.fog)
                    .to({ far: 1000 }, fadeOutDuration)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .delay(500)
                    .start();
            });

            // Remove portal overlay
            const overlay = document.getElementById('portalOverlay');
            overlay.style.display = 'none';
        });
}

// Setup lights
const lights = setupLights(scene, locations);

// Create scene manager
const sceneManager = new SceneManager(scene, camera, controls);

// Load initial model
sceneManager.loadModel('/models/hogwarts_grand_hall/scene.gltf', (model, scale) => {
    // Setup model controls
    window.addEventListener('keydown', (event) => {
        switch (event.key) {
            case '+':
            case '=':
                sceneManager.currentScale *= 1.1;
                model.scale.setScalar(sceneManager.currentScale);
                break;
            case '-':
            case '_':
                sceneManager.currentScale *= 0.9;
                model.scale.setScalar(sceneManager.currentScale);
                break;
        }
    });

    // Start navigation sequence
    setTimeout(() => {
        moveToWaypoint(1);
        currentWaypoint = 1;
    }, 2000);
});

// Update initial camera position and rotation
camera.position.set(
    locations.camera.initial.position.x,
    locations.camera.initial.position.y,
    locations.camera.initial.position.z
);

camera.rotation.set(
    THREE.MathUtils.degToRad(locations.camera.initial.rotation.x),
    THREE.MathUtils.degToRad(locations.camera.initial.rotation.y),
    THREE.MathUtils.degToRad(locations.camera.initial.rotation.z)
);

// Update controls target
controls.target.set(
    locations.camera.target.x,
    locations.camera.target.y,
    locations.camera.target.z
);
controls.update();
