import * as THREE from 'three';

export function createLighting(scene) {
    // Point Lights with higher intensity and range
    const light = new THREE.PointLight(0xffffff, 10, 50);
    const lightTwo = new THREE.PointLight(0xffffff, 7, 50);
    const lightThree = new THREE.PointLight(0xffffff, 7, 50);
    const lightFour = new THREE.PointLight(0xffffff, 7, 50);

    // Adjust positions
    light.position.set(0.8, 1.4, 1.0);
    lightTwo.position.set(-0.8, 0, -1.0);
    lightThree.position.set(0, 2.5, 0);
    lightFour.position.set(0, -3, 0);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    
    // Directional Light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
    directionalLight.position.set(5, 10, 5);
    
    // Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);

    // Add to scene
    scene.add(light, lightTwo, lightThree, lightFour, ambientLight, directionalLight, hemiLight);
}

