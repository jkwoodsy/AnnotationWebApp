import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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
