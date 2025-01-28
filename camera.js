import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';

export function resetCamera(camera, objects) {
    // Create a combined bounding box for all objects
    const combinedBox = new THREE.Box3();

    objects.forEach((object) => {
        if (object) {
            const objectBox = new THREE.Box3().setFromObject(object);
            combinedBox.union(objectBox); // Expand the combined box to include the object
        }
    });

    // Get the size and center of the combined bounding box
    const size = combinedBox.getSize(new THREE.Vector3());
    const center = combinedBox.getCenter(new THREE.Vector3());

    // Determine the maximum dimension of the box
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180); // Convert FOV to radians

    // Calculate the distance needed for the camera to fit the entire box
    const cameraZ = Math.abs(maxDim / Math.tan(fov / 2));

    // Update camera position and orientation
    camera.position.set(center.x, center.y, cameraZ + size.z); // Place camera behind the box
    camera.lookAt(center); // Make the camera look at the center of the bounding box
    camera.updateProjectionMatrix(); // Update the camera's projection matrix
}

