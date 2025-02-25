import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { updateModelMaterials } from './materialUtils.js';

export class SceneManager {
    constructor(scene, camera, controls) {
        this.scene = scene;
        this.camera = camera;
        this.controls = controls;
        this.modelRef = null;
        this.currentScale = 1;
    }

    loadModel(modelPath, onLoad) {
        const loader = new GLTFLoader();

        loader.load(
            modelPath,
            (gltf) => {
                const model = gltf.scene;

                // Get the size of the model
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());

                // Calculate scale based on size
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 1000 / maxDim;
                model.scale.setScalar(scale);

                // Center the model horizontally only
                const center = box.getCenter(new THREE.Vector3());
                model.position.x = -center.x * scale;
                // Don't auto-center vertically for Chamber of Secrets
                if (!modelPath.includes('chamber_of_secrets')) {
                    model.position.y = -center.y * scale;
                }
                model.position.z = -center.z * scale;

                // Update materials
                updateModelMaterials(model);

                // Store references
                this.modelRef = model;
                this.currentScale = scale;

                // Add to scene
                this.scene.add(model);

                if (onLoad) onLoad(model, scale);
            },
            (progress) => {
                console.log('Loading:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading model:', error);
            }
        );
    }

    unloadCurrentModel() {
        if (this.modelRef) {
            this.scene.remove(this.modelRef);
            this.modelRef = null;
        }
    }
}
