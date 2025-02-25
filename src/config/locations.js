export const locations = {
    camera: {
        initial: {
            position: { x: 588.62, y: -154.82, z: -15.96 },
            rotation: { x: -108.78, y: 85.19, z: 108.85 }
        },
        target: { x: 0, y: -154.82, z: 0 },
        staffTable: {
            position: { x: -99.97, y: -157.00, z: 0.96 },
            rotation: { x: 66.18, y: -88.64, z: 66.17 }
        },
        chamberOfSecrets: {
            position: { x: -417.94, y: -229.70, z: 67.48 },
            rotation: { x: 73.63, y: -60.20, z: 71.30 }
        }
    },

    waypoints: [
        {
            position: { x: 588.62, y: -154.82, z: -15.96 },
            rotation: { x: -108.78, y: 85.19, z: 108.85 },
            name: "Main Entrance"
        },
        {
            position: { x: -180.60, y: -120.45, z: -3.49 },
            rotation: { x: -95.81, y: -79.17, z: -95.91 },
            name: "Staff Table"
        },
        {
            position: { x: -99.14, y: -141.84, z: -1.92 },
            rotation: { x: -98.39, y: -82.46, z: -98.47 },
            name: "Hall Center"
        }
    ],

    portal: {
        position: { x: 523.19, y: -154.80, z: 4.43 },
        rotation: { x: -0.26, y: 89.51, z: 0.26 },
        dimensions: {
            width: 600,  // 3 times bigger than height
            height: 300  // Keep existing height
        }
    },

    lights: {
        directional: {
            position: { x: 0, y: 1000, z: 0 },
            intensity: 3
        },
        point1: {
            position: { x: 10, y: 10, z: 10 },
            intensity: 1
        },
        point2: {
            position: { x: -10, y: 10, z: -10 },
            intensity: 1
        },
        ambient: {
            intensity: 2
        }
    }
};
