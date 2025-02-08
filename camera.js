import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let isRotatingX = false;
let isRotatingY = false;
let clock = new THREE.Clock();  // Initialize clock for smooth animation

export function toggleCameraRotation(camera, controls, objectArray, isRotatingX, isRotatingY) {
    if (isRotatingX || isRotatingY) {
        const combinedBox = new THREE.Box3();
        objectArray.forEach((object) => {
            if (object) {
                combinedBox.expandByObject(object);
            }
        });

        // Get the bounding sphere
        const boundingSphere = new THREE.Sphere();
        combinedBox.getBoundingSphere(boundingSphere);

        const { center, radius } = boundingSphere;

        // Set up the camera's automatic rotation around the center
        const elapsedTime = clock.getElapsedTime();
        const rotationSpeed = 0.4;  // Speed of rotation
        const orbitRadius = radius * 2;

        // X-axis rotation (left to right)
        if (isRotatingX) {
            const angleX = elapsedTime * rotationSpeed;
            camera.position.x = center.x + orbitRadius * Math.cos(angleX);
            camera.position.z = center.z + orbitRadius * Math.sin(angleX);
        }

        // Y-axis rotation (tilt up and down)
        if (isRotatingY) {
            const angleY = elapsedTime * rotationSpeed;
            // Only tilt the camera up and down without rotating left to right
            camera.position.y = center.y + orbitRadius * Math.sin(angleY);  // Up and down tilt
        }

        camera.lookAt(center);
        camera.updateProjectionMatrix();

        if (controls instanceof OrbitControls) {
            controls.target.copy(center);
            controls.update();
        }
    }
}

export function resetCamera(camera, controls, objects) {
    const combinedBox = new THREE.Box3();

    // Combine bounding boxes of all objects
    objects.forEach((object) => {
        if (object) {
            combinedBox.expandByObject(object);
        }
    });

    // Calculate bounding sphere from the combined box
    const boundingSphere = new THREE.Sphere();
    combinedBox.getBoundingSphere(boundingSphere);

    const { center, radius } = boundingSphere;

    // Calculate optimal camera distance
    const fov = THREE.MathUtils.degToRad(camera.fov); // Convert FOV to radians
    const distance = radius / Math.sin(fov / 2); // Distance based on FOV

    // Adjust for aspect ratio
    const aspect = camera.aspect;
    const adjustedDistance = distance / Math.sqrt(1 + Math.pow(1 / aspect, 2));

    // Position camera
    camera.position.set(center.x, center.y, center.z + adjustedDistance * 1.1); // Add slight padding
    camera.lookAt(center);
    camera.updateProjectionMatrix();

    // Reset controls if available
    if (controls instanceof OrbitControls) {
        controls.target.copy(center);
        controls.update();
    }
}
