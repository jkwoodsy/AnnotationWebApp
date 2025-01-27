import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/ObjLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';


// Import raycasting library
/*
    Raycasting allows us to select points on the 3D Model, by selecting this point, we can then add the labels to it.
*/
import { Raycaster } from 'three/src/core/Raycaster.js'

// Import GUI library for making a GUI
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// Label class definition
class Label {
    constructor( coordinates, text) {
        this.coordinates = coordinates;
        this.text = text;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    let initialRead = true;
    let selectedButton = '';
    let raycasterMeshes = [];
    let labels = [];
    let fileName = "";
    let fileType = "";
    let labelsFileName = "";
    let cssLabelObjects = [];

    // Mouse for capturing mouse position
    const mouse = new THREE.Vector2();

    // Box to have the bounding box of the object
    let box = new THREE.Box3();

    // A variable to store the Object to add as raycasting parameter
    let Object3D = null;

    // scene and clock setup
    const scene = new THREE.Scene();
    const clock = new THREE.Clock();

    // To show the axes
    // scene.add(new THREE.AxesHelper(5));

    
    // The following handles lighting of the scene
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
    scene.add(new THREE.AmbientLight());

    // Camera and renderer setup
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 5000 );
    camera.position.x = 4; /* not sure what this line of code does */

    // Create renderer for 3D objects
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create 2D renderer for labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    document.body.appendChild( labelRenderer.domElement );

    // Controls setup
    let controls = new OrbitControls(camera, labelRenderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);

    // Material for 3D objects
    const material = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
    material.side = THREE.DoubleSide;

    // Loaders for FBX and OBJ files
    const fbxLoader = new FBXLoader();
    const objLoader = new OBJLoader();

    // load and replace 3D object
    function loadObject( data ) {
        // Check if there are any old objects in the scene
        if ( Object.is( Object3D, null ) == false ) { // Object3D !== null
            console.log("Removing old object...");
            // Remove all children meshes from the old object
            Object3D.traverse(child => {
                if (child.isMesh) {
                    child.geometry.dispose(); // dispose geometry
                    child.material.dispose(); // dispose material
                }
            });
            // Remove the old object from the scene
            scene.remove(Object3D);
        }
        
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
                    object.scale.set(0.01, 0.01, 0.01);
                }
                else if (fileType == 'obj'){
                    console.log('obj type');
                    let textData = new TextDecoder().decode(data);
                    object = objLoader.parse( textData);
                    console.log('obj type');
                    object.scale.set(1,1,1);
                }
                console.log("Object loaded successfully.");
                object.traverse( function ( child ) {
                    if (child.isMesh) {
                        child.material = material
                        if (child.material) {
                            child.material.transparent = false
                        }
                    }
                });
                //object.scale.set(0.01, 0.01, 0.01)
                //object.scale.set(1, 1, 1)
                scene.add(object)
        
                Object3D = object;

                // Update the raycaster to use the new object's meshes
                raycasterMeshes = getMeshesFromFBXObject(Object3D);

                // Redefine box
                box = new THREE.Box3().setFromObject(Object3D);
                resetCamera();

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

    // Render Scene
    function render() {
        // Render the 3D scene
        renderer.render( scene, camera );

        // Render the labels
        labelRenderer.render( scene, camera );

        raycaster.setFromCamera( mouse, camera );
    };

    // Handle window resizing
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        labelRenderer.setSize(window.innerWidth, window.innerHeight)
        render()
    };

    window.addEventListener('resize', onWindowResize, false);

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
        const intersections = raycaster.intersectObjects( getMeshesFromFBXObject(Object3D), false);

        // If there are any intersections, then we will get the first one.
        switch( selectedButton ) {
            case "select":
                break;
            case "add":
                if( intersections.length > 0) 
                {
                    // Add a label to this point in 3D space
                    addLabel( intersections[0].point );
                }
                // selectedButton = 'add';
                break;
            case "delete":
                break;
            case "change":
                break;
        }
    };

    // Add label to 3D scene
    function addLabel( coordinates, text = "" ) {
        // Create a div element
        const div = document.createElement( 'div' );

        div.className = 'label';

        if(text == "" ) {
            text = window.prompt("Enter the text for the label", "Label");
        }

        div.textContent = text.toUpperCase();

        labels.push( new Label(coordinates, div.textContent) );

        // Add an event listener to the HTML element wrapping the label
        div.addEventListener( 'pointerdown', function () {
            if( selectedButton === 'delete' ) {
                if( window.confirm( "You would like to delete the label: " + text) )
                {
                    // Remove the label from the scene
                    scene.remove( label );
                    div.remove();

                    // Remove the labels text from the labels array
                    for( let i = 0; i < labels.length; i++ ) {
                        if( labels[i].text === text  && labels[i].coordinates === coordinates) {
                            labels.splice(i, 1);
                        }
                    }
                }
            }
            else if( selectedButton === 'change' ) {
                let newText = window.prompt("Enter the new text for the label", "Label").toUpperCase();
                div.textContent = newText;
            } 
        });

        // Create the new label
        const label = new CSS2DObject( div );

        cssLabelObjects.push( label );

        // Set the position of the label
        label.position.set( coordinates.x, coordinates.y, coordinates.z );

        scene.add( label );
    };

    // Add event listeners for mouse movement and click
    document.addEventListener( 'mousemove', onMouseMove );
    document.addEventListener( 'click', onClick );

    // Handle button controls for label visibility and control mode
    function controlsStyling() {
        let controlNames = document.querySelectorAll('.controls-container input[type="radio"][name="control"]');

        // When a control is clicked, we will change the styling of the control
        controlNames.forEach( control => {
            // Check if the radio button is selected and change the styling
            if(control.checked) {
                control.parentElement.className = "no-select button-div-selected";
                selectedButton = control.id;
            }
            else {
                control.parentElement.className = "no-select button-div-not-selected";
            }
        });
    };

    // Function to check whether or not to hide or show the labels.
    function toggleLabel() {
        const labelButtons = document.querySelectorAll('.controls-container input[type="radio"][name="toggle"]');

        // When a control is clicked, we will change the styling of the control
        labelButtons.forEach( control => {
            // Check if the radio button is selected and change the styling
            if( control.checked ) {
                control.parentElement.className = "no-select selected";

                if( control.id == "show" )
                {
                    // Show the labels
                    document.querySelectorAll('.label').forEach( label => {
                        label.style.display = "block";
                    });
                }
                else
                {
                    // Hide the labels
                    document.querySelectorAll('.label').forEach( label => {
                        label.style.display = "none";
                    });
                }
            }
            else {
                control.parentElement.className = "no-select not-selected";
            }
        });
    }

    function resetCamera() {
        // Get the dimensions of the bounding box
        const size = new THREE.Vector3();
        box.getSize(size);

        // Calculate the maximum dimension to determine a reasonable distance for the camera
        const maxDimension = Math.max(size.x, size.y, size.z);

        // Calculate the distance for the camera based on the maximum dimension
        // You may adjust the multiplier to fit your specific needs
        const cameraDistance = maxDimension * 1.5;

        // Set the camera position based on the calculated distance
        camera.position.set(cameraDistance, 0, 0);

        // Make sure the camera is looking at the center of the object
        const center = new THREE.Vector3(0, 0, 0);
        camera.lookAt( center );

        console.log( center );
    }

    // Set onclick listener for resetCamera
    document.getElementById('reset-camera').onclick = function() {
        resetCamera();
        console.log("Camera reset to default position.");
    };

    // Set onclick listener for save
    document.getElementById('save-object').onclick = function() {
        // Save the object
        // Write labels to JSON file
        let labelsJSON = JSON.stringify(labels);

        // Create a Blob containing the JSON data
        let blob = new Blob([labelsJSON], { type: 'application/json' });

        newFileName = fileName.split('.')[0];

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
    const fileInput = document.getElementById('change-object');

    fileInput.onclick = function( event ) {
        document.getElementById('file-select').click();

        document.getElementById('file-select').onchange = function( event ) {
            // Get file contents
            let file = event.target.files[0];

            fileName = file.name;
            /*const fileType = fileName.split('.').pop().toLowerCase(); 
            console.log(fileType);*/

            console.log( file.name );

            // Remove all labels from the scene 
            removeAllLabels();

            labels = [];

            if( file ) {
                // Make the button hidden
                initialObject.hidden = true;

                const fileReader = new FileReader();
                fileReader.onload = function( e ) {
                    const data = e.target.result;
                    console.log( 'calling loadObject' );
                    loadObject( data );
                };
                fileReader.readAsArrayBuffer(file);
            }
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

        removeAllLabels();

        labelsFileName = file.name;

        if ( file ) {
            const fileReader = new FileReader();
            fileReader.onload = function(e) {
                const data = e.target.result;
                let tempLabels = JSON.parse(data.toString());

                for (let i = 0; i < tempLabels.length; i++) {
                    // Call addLabel function to add labels
                    addLabel(tempLabels[i].coordinates, tempLabels[i].text);
                }
            };
            fileReader.readAsText(file);
        }

        document.getElementById('json-file-select').value = '';
    };

    function removeAllLabels() {
        // Remove from labels[] the labels we do not want
        // for each loop

        cssLabelObjects.forEach( label => {
            scene.remove( label );
        });

        labels = [];
    }

    // Set event listener for camera-toggle
    document.getElementById('control-switch').onchange = function() {
        if(document.getElementById('control-switch').checked) {
            // Hide the labels.
            document.getElementById('control-hide').click();

            // Get rid of the old controls and its settings
            controls.dispose();

            controls = new FirstPersonControls(camera, labelRenderer.domElement);
            controls.movementSpeed = 0.1;
            controls.lookSpeed = 0.1;

            controls.verticalMin = -Math.PI;
            controls.verticalMax = Math.PI;
        }
        else {
            // Show the labels
            document.getElementById('control-show').click();
            
            controls.dispose();
            resetCamera();
            controls = new OrbitControls(camera, labelRenderer.domElement);
            controls.enableDamping = true;
            controls.target.set(0, 0, 0);
        }
    };

    function animate() {
        requestAnimationFrame(animate)

        if(document.getElementById('control-switch').checked) {
            controls.update( clock.getDelta() );
        }
        else {
            controls.update()
        }

        render();

        // Update styling of controls
        controlsStyling();
        toggleLabel();

        if( Object.is( Object3D, null ) == false ) {
            document.getElementById('cover').hidden = true;
            document.getElementById('initial-add-div').style.display = "none";
        }
    };

    animate();
});