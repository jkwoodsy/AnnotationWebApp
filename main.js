import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/ObjLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { setupScene } from './scene.js';
import { addLabel, removeAllLabels } from './label.js';
import { controlsStyling, toggleLabel } from './controls.js';
import { toggleCameraRotation, resetCamera} from './camera.js';
import { loadGoogleTranslate } from './translate.js';
import { addObjToSidebar, updateSidebar} from './sidebar.js';


// Import raycasting library
/*
    Raycasting allows us to select points on the 3D Model, by selecting this point, we can then add the labels to it.
*/
import { Raycaster } from 'three/src/core/Raycaster.js'

// Import GUI library for making a GUI
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// Inside main.js
document.addEventListener('DOMContentLoaded', function () {
    loadGoogleTranslate();  // Call the function to load Google Translate
});

document.addEventListener('DOMContentLoaded', function() {
    let initialRead = true;
    //let selectedButton = '';
    const buttonState = { selectedButton: '' };
    let raycasterMeshes = [];
    let labels = [];
    let fileName = "";
    let fileType = "";
    let labelsFileName = "";
    let cssLabelObjects = [];
    let scaleFactor = null;
    const objectRawDataMap = new Map();
    let isTransparent = false;  // Track the state of the transparency
    let angle = 0;

    // Initialize variables to track rotation state
    let isRotatingX = false;
    let isRotatingY = false;

    // Get the buttons by their IDs
    const rotateXButton = document.getElementById('rotate-x');
    const rotateYButton = document.getElementById('rotate-y');
    const transparencyButton = document.getElementById('toggle-transparency');

    let lastObjData = null; // Store last .obj data for reloading with .mtl

    // Mouse for capturing mouse position
    const mouse = new THREE.Vector2();

    // Box to have the bounding box of the object
    let box = new THREE.Box3();

    // An array to store the objects to add as raycasting parameter
    let objectArray = []; //const?

    // scene and clock setup
    const clock = new THREE.Clock();
    const { scene, camera, renderer, labelRenderer } = setupScene();
    
    let controls = new OrbitControls(camera, labelRenderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    controls.update();
    // To show the axes
    // scene.add(new THREE.AxesHelper(5));

    // Material for 3D objects
    const material = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
    //const material = new THREE.MeshStandardMaterial();
    material.side = THREE.DoubleSide;

    // Loaders for FBX, OBJ and STL files
    const fbxLoader = new FBXLoader();
    const objLoader = new OBJLoader();
    const stlLoader = new STLLoader();
    const mtlLoader = new MTLLoader();

    // load and replace 3D object
    function loadObject( data ) {
        
        console.log("Loading object...");
        console.log( data );
        if( data )
        {
            try {
                console.log('in try loop');
                let object = null;
                console.log(fileName);
                fileType = fileName.split('.').pop().toLowerCase(); 
                console.log(fileType);
                if (fileType == 'fbx'){
                    object = fbxLoader.parse( data, '' );
                    //object.scale.set(0.01, 0.01, 0.01);
                    document.getElementById('add-mtl-div').style.display = "none";
                }
                else if (fileType == 'obj'){
                    document.getElementById('add-mtl-div').style.display = "block";
                    console.log('obj type');
                    let textData = new TextDecoder().decode(data);
                    object = objLoader.parse( textData);
                    //object.scale.set(0.01,0.01,0.01);
                    objectRawDataMap.set(fileName, data);
                    object.rotation.x = -Math.PI / 2;

                    object.children.forEach((child) => {
                        if (child.isMesh) {
                            console.log('Mesh name:', child.name); // Mesh name from .obj file
                            // Apply materials, scaling, etc. here
                        }
                    });
                    
                }
                else if (fileType == 'stl'){
                    document.getElementById('add-mtl-div').style.display = "none";
                    const geometry = stlLoader.parse(data);
                    object = new THREE.Mesh(geometry, material);
                    object.rotation.x = -Math.PI / 2; // rotate it 90 degrees
                    //object.scale.set(1, 1, 1);                    
                } 
                else {
                    throw new Error('Unsupported file type. Please upload a .fbx, .obj, or .stl file.');
                }
                console.log("Object loaded successfully.");
                object.filename = fileName;
                console.log(object.filename);
                // Recalculate the bounding box
                object.position.set(0, 0, 0);
                box = new THREE.Box3().setFromObject(object);
                const size = box.getSize(new THREE.Vector3());
                console.log('Object size: ', size);
                
                // Scale the object automatically based on the largest dimension
                const maxDim = Math.max(size.x, size.y, size.z);
                scaleFactor = 1 / maxDim; // Scale factor to make the largest dimension equal to 1 unit
                console.log('current scale factor: ', scaleFactor);
                
                if(objectArray.length > 0){
                    const lastObject = objectArray[objectArray.length - 1];
                    const lastSF = lastObject.scale.x;
                    console.log('Last scale factor: ', lastSF);

                    scaleFactor = Math.min(scaleFactor, lastSF);
                    console.log('Updated scale factor: ', scaleFactor);
                }
                
                object.scale.set(scaleFactor, scaleFactor, scaleFactor); // Apply scaling 

                //const boxHelper = new THREE.BoxHelper(object, 0xffff00); // Yellow color
                //scene.add(boxHelper);
                
                object.traverse( function ( child ) {
                    if (child.isMesh) {
                        child.material = material
                        if (child.material) {
                            child.material.transparent = false
                        }
                    }
                });

                scene.add(object)
        
                //Object3D = object;
                objectArray.push(object);

                //addObjToSidebar(object, scene, objectArray, cssLabelObjects, raycasterMeshes);
                
                objectArray.forEach((obj) => {
                    if (obj) {
                        //obj.scale.set(0,0,0);
                        obj.scale.set(scaleFactor, scaleFactor, scaleFactor);
                    }
                });
                
                
                // Update the raycaster to use the new object's meshes
                raycasterMeshes = objectArray.flatMap((obj) => getMeshesFromFBXObject(obj));
                addObjToSidebar(object, scene, objectArray, cssLabelObjects, raycasterMeshes);
                // Redefine box
                box = new THREE.Box3().setFromObject(object);
                resetCamera(camera, controls, objectArray);

                animate();
            } catch (error) {
                console.log(error);
                alert("Incompatible file type. Please select a .fbx or .obj file.");
            }
        }
    };

    // Function to get meshes from FBX Object
    function getMeshesFromFBXObject ( object ) {
        // Store the meshes in an array
        const meshes = [];
        // Traverse the object and get the meshes
        object.traverse( child => {
            if ( child.isMesh ) {
                meshes.push( child );
            };
        });
        return meshes;
    };

    // Add a button event listener for toggling transparency
    document.getElementById('toggle-transparency').onclick = function() {
        isTransparent = !isTransparent;  // Toggle the transparency state

        // Iterate through all objects in the scene
        objectArray.forEach(object => {
            object.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.transparent = isTransparent;  // Set transparency to true or false
                    child.material.opacity = isTransparent ? 0.6 : 1.0;  // Set opacity to 0.7 when transparent, 1 when not
                }
            });
        });

        console.log(`Transparency set to: ${isTransparent ? 'Enabled' : 'Disabled'}`);
    };   


    // Render Scene
    function render() {
        // Render the 3D scene
        renderer.render( scene, camera );

        // Render the labels
        labelRenderer.render( scene, camera );

        raycaster.setFromCamera( mouse, camera );
    };

    /* 
    The following handles the raycasting which is responsible for selecting the points on the 3D Model
    */
    const raycaster = new THREE.Raycaster(); 

    function onMouseMove( event ) {
        // Get the mouse position in the scene
        // Get the mouse position relative to the screen and the pixel coordinates.
        // We then convert this to 3D coordinates.
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        // The negative sign is applied as in three.js the top of the screen is -1 and the bottom is 1
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        // Using the mouse coordinates, we then cast a ray to the 3D Model.
        raycaster.setFromCamera( mouse, camera );
    };

    function onClick( event ) {
        // Get the intersections
        // Check if it intersects with any of the children objects in the scene.
        //const intersections = raycaster.intersectObjects( getMeshesFromFBXObject(Object3D), false);
        const visibleMeshes = raycasterMeshes.filter(mesh => mesh.visible);
        
        const intersections = raycaster.intersectObjects(visibleMeshes, false);
        // If there are any intersections, then we will get the first one.
        switch( buttonState.selectedButton ) {
            case "select":
                break;
            case "add":
                if( intersections.length > 0) 
                {
                    // Add a label to this point in 3D space
                    const intersectedObject = intersections[0].object.parent; 
                    const label = addLabel(scene, intersections[0].point, labels, cssLabelObjects, buttonState);
                    label.object = intersectedObject;
                    console.log('text: ', label.text);
                    console.log('intersected object: ', intersectedObject.filename);
                    //cssLabelObjects.push(label);
                    console.log("add LABEL");
                    //addLabel( scene, intersections[0].point, labels, buttonState );
                }
                buttonState.selectedButton = 'add';
                break;
            case "delete":
                break;
            case "add":
                break;
        }
    };

    // Add event listeners for mouse movement and click
    document.addEventListener( 'mousemove', onMouseMove );
    document.addEventListener( 'click', onClick );

    // Set onclick listener for resetCamera
    document.getElementById('reset-camera').onclick = function() {
        resetCamera(camera,controls, objectArray);
        console.log("Camera reset to default position.");
    };

    // Set onclick listener for save
    document.getElementById('save-object').onclick = function() {
        console.log("SAVING LABELS!");
        // Save the object
        // Write labels to JSON file
        console.log(labels);

        let labelsData = labels.map((label, index) => {
            console.log("Processing label:", label.text);
        
            // Use the index to get the corresponding pair from cssLabelObjects
            let associatedObject = cssLabelObjects[index]?.object;  // Access the object using the same index
        
            console.log("Associated object:", associatedObject);
        
            return {
                text: label.text,
                coordinates: label.coordinates,  // Ensure position is stored
                filename: associatedObject?.filename || "unknown"  // Ensure filename is stored
            };
        });
        
    
        console.log(labelsData);
        let labelsJSON = JSON.stringify(labelsData, null, 2);
        //let labelsJSON = JSON.stringify(labels);

        // Create a Blob containing the JSON data
        let blob = new Blob([labelsJSON], { type: 'application/json' });

        let newFileName = fileName.split('.')[0];

        console.log(newFileName);

        // Ask user for a name
        let name = window.prompt("Please enter your name", "Name");

        // Create a temporary anchor element to trigger the download
        let a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = newFileName + "-" + name + '.json'; // Specify the filename
        a.click();

        // Cleanup
        URL.revokeObjectURL(a.href);
    };

    // Set onClick listener for initial button
    const initialObject = document.getElementById('initial-add-div');

    initialObject.onclick = function( event ) {
        event.preventDefault();

        fileInput.click();
    };

    // Set onClick listener for changeObject
    const fileInput = document.getElementById('add-object');

    fileInput.onclick = function( event ) {
        document.getElementById('file-select').click();

        document.getElementById('file-select').onchange = function (event) {
            const objFile = event.target.files[0];
            if (!objFile) {
                alert("No .obj file selected.");
                return;
            }
        
            fileName = objFile.name;
            console.log(fileName);
        
            // Remove all labels from the scene
           // removeAllLabels(scene, cssLabelObjects, labels);
            //labels = [];
           // cssLabelObjects = [];
        
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target.result;
        
                // Store the .obj data for reloading with materials later
                lastObjData = data;
        
                console.log('calling loadObject');
                loadObject(lastObjData);
            };
            reader.readAsArrayBuffer(objFile);    
        };
    };

    // Set onClick listener for upload
    document.getElementById('upload').onclick = function() {
        document.getElementById('json-file-select').click();
        console.log( 'uploading' );
    };

    // Set onchange event handler for json-file-select input element
    document.getElementById('json-file-select').onchange = function(event) {
        // Get file contents
        let file = event.target.files[0];
    
        removeAllLabels(scene, cssLabelObjects, labels);
        //cssLabelObjects = [];
        //labels = [];
        console.log("removed labels");
    
        if (file) {
            const fileReader = new FileReader();
            fileReader.onload = function(e) {
                const data = e.target.result;
                let tempLabels = JSON.parse(data.toString());
                console.log("uploading labels:", tempLabels);
    
                for (let i = 0; i < tempLabels.length; i++) {
                    const labelData = tempLabels[i];
                    console.log("Adding label with text:", labelData.text);
                    console.log("Coordinates:", labelData.coordinates);
                    
                    // Find the object that matches the filename in the label
                    const associatedObject = objectArray.find(obj => obj.filename === labelData.filename);
                    if (associatedObject) {
                        // Add the label and assign the object
                        const label = addLabel(scene, labelData.coordinates, labels, cssLabelObjects, buttonState, labelData.text);
                        label.object = associatedObject; // Assign the object to the label
                        console.log("TEXT:", label.text);
                        console.log(`Label "${label.text}" assigned to object with filename: ${associatedObject.filename}`);
                        
                        label.visible = associatedObject.visible;
                    } else {
                        console.error(`No object found for label with filename: ${labelData.filename}`);
                    }
                }
            };
            fileReader.readAsText(file);
        }
    
        document.getElementById('json-file-select').value = '';  // Reset the file input
    };

    document.getElementById('add-mtl').onclick = function () {
        // Trigger the hidden file input for .mtl
        document.getElementById('mtl-select').click();
    };

    document.getElementById('mtl-select').onchange = function (event) {
        const mtlFile = event.target.files[0];
        if (!mtlFile) {
            alert("No .mtl file selected.");
            return;
        }
    
        // Check if .mtl file is selected correctly
        console.log("Selected .mtl file:", mtlFile.name);
        
        const mtlReader = new FileReader();
        mtlReader.onload = (e) => {
            const mtlData = e.target.result;
            console.log("MTL data loaded:", mtlData);  // Debugging line
    
            try {
                const materials = mtlLoader.parse(mtlData);
                console.log("Parsed materials:", materials);  // Debugging line
                objLoader.setMaterials(materials);
                
                // Retrieve raw data for .obj
                const objFileName = mtlFile.name.replace(".mtl", ".obj");
                console.log('filename: ', objFileName);
                const objRawData = objectRawDataMap.get(objFileName);
                if (!objRawData) {
                    console.error("No raw .obj data found for the selected .mtl file.");
                    alert("No corresponding .obj file found for the .mtl.");
                    return;
                }
                const textData = new TextDecoder().decode(objRawData);
                const objectWithMaterials = objLoader.parse(textData);
                // Ensure no material is transparent
                objectWithMaterials.traverse((child) => {
                    if (child.isMesh && child.material) {
                            child.material.transparent = true;  // Apply transparency state
                            child.material.opacity = 1;  // Restore opacity setting
                        }
                });
                console.log(objectArray);  // Log the array
                console.log(objFileName);  // Log the file name you're trying to match
                const oldObjectIndex = objectArray.findIndex(obj => obj.filename === objFileName);
                console.log("object index: ", oldObjectIndex);
                if (oldObjectIndex !== -1) {
                    const oldObject = objectArray[oldObjectIndex];
                    
                    // Update labels to point to the new object
                    cssLabelObjects.forEach((label) => {
                        if (label.object === oldObject) {
                            label.object = objectWithMaterials; // Reassign to new object
                            console.log(`Label reassigned to new object: ${label.textContent}`);
                        }
                    });
                    
                    scene.remove(oldObject);
                    objectWithMaterials.filename = oldObject.filename;
                    console.log("Old object removed from scene.");
                    objectArray.splice(oldObjectIndex, 1); // Remove from the array
                    console.log("Old object removed from object array.");
                }
                console.log("error check 8");

                box = new THREE.Box3().setFromObject(objectWithMaterials);
                objectWithMaterials.scale.set(scaleFactor, scaleFactor, scaleFactor);
                objectWithMaterials.rotation.x = -Math.PI / 2;

                // Add the object with materials to the scene
                scene.add(objectWithMaterials);
                console.log("Object with materials added to scene.");

                // Add the new object to the array
                objectArray.push(objectWithMaterials);
                console.log("Object added to object array.");
                raycasterMeshes = objectArray.flatMap((obj) => getMeshesFromFBXObject(obj));
                updateSidebar(objectArray, scene, cssLabelObjects, raycasterMeshes);
            
            } catch (error) {
                console.error("Error applying .mtl file:", error);
                alert("Failed to apply materials. Please ensure the .mtl file is valid and matches the .obj file.");
            }
        };
    
        mtlReader.readAsText(mtlFile);
    };

    // Toggle rotation on X axis
    rotateXButton.onclick = function() {
        isRotatingX = !isRotatingX;
        
        if (isRotatingX) {
            console.log("Camera rotation x started.");
        } else {
            console.log("Camera rotation x stopped.");
        }
        rotateXButton.innerHTML = isRotatingX ? "Stop X Rotation" : "Start X Rotation";
    };

    // Toggle rotation on Y axis
    rotateYButton.onclick = function() {
        isRotatingY = !isRotatingY;

        if (isRotatingY) {
            console.log("Camera rotation y started.");
        } else {
            console.log("Camera rotation x stopped.");
        }
    };

    function animate() {
        requestAnimationFrame(animate)

        toggleCameraRotation(camera, controls, objectArray, isRotatingX, isRotatingY);

        render();

        // Update styling of controls
        controlsStyling(buttonState);
        toggleLabel();

        // Check if objectArray contains valid objects
        if (Array.isArray(objectArray) && objectArray.length > 0) {
            const hasValidObject = objectArray.some(obj => obj !== null && obj instanceof THREE.Object3D);

            if (hasValidObject) {
                document.getElementById('cover').hidden = true;
                document.getElementById('initial-add-div').style.display = "none";
            }
        }
    };

    animate();
});