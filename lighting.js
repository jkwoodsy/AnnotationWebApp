// lighting.js
import * as THREE from 'three';

// Function to set up lighting for the scene
export function createLighting(scene) {
    // Creating lights
    const light = new THREE.PointLight(0xffffff, 6);
    const lightTwo = new THREE.PointLight(0xffffff, 4);
    const lightThree = new THREE.PointLight(0xffffff, 4);
    const lightFour = new THREE.PointLight(0xffffff, 4);

    // Placing lights
    light.position.set(0.8, 1.4, 1.0);
    lightTwo.position.set(-0.8, 0, -1.0);
    lightThree.position.set(0, 2.5, 0);
    lightFour.position.set(0,-3,0);

    // Adding lights to the scene
    scene.add(light, lightTwo, lightThree, lightFour);
    /*scene.add(light);
    scene.add(lightTwo);
    scene.add(lightThree);
    scene.add(lightFour);*/
    /* const ambientLight = new THREE.AmbientLight();
    scene.add(ambientLight); */
    /*scene.add(new THREE.AmbientLight());*/
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
}
