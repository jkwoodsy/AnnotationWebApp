import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const buttonState = { selectedButton: '' };

// Label class definition
export class Label {
    constructor( coordinates, text) {
        this.coordinates = coordinates;
        this.text = text;
    }
}

let cssLabelObjects = [];

// Add label to 3D scene
export function addLabel( scene, coordinates, labels, cssLabelObjects, buttonState, text = "") {
    // Create a div element
    const div = document.createElement( 'div' );
    div.className = 'label';

    if(text == "" ) {
        text = window.prompt("Enter the text for the label", "Label");
    }

    div.textContent = text.toUpperCase();
    labels.push( new Label(coordinates, div.textContent) );
    console.log(labels);

    // Create the new label
    const label = new CSS2DObject( div );
    label.position.copy(coordinates);

    // Add an event listener to the HTML element wrapping the label
    div.addEventListener( 'pointerdown', function () {
        console.log(buttonState.selectedButton);
        if( buttonState.selectedButton === 'delete' ) {
            if( window.confirm( "You would like to delete the label: " + text) ) {
                // Remove the label from the scene
                scene.remove( label );
                div.remove();

                // Remove the labels text from the labels array
                for( let i = 0; i < labels.length; i++ ) {
                    if( labels[i].text === text  && labels[i].coordinates === coordinates) {
                        labels.splice(i, 1);
                    }
                }

                // Remove the label from cssLabelObjects
                const index = cssLabelObjects.indexOf(label);
                if (index > -1) {
                    cssLabelObjects.splice(index, 1);
                }       
            }
        }
        else if( buttonState.selectedButton === 'change' ) {
            let newText = window.prompt("Enter the new text for the label", "Label").toUpperCase();
            div.textContent = newText;
        } 
    });

    // Create the new label
    /*const label = new CSS2DObject( div );

    label.position.copy(coordinates);*/
    //labelObject.userData.parentObject = parentObject; // Associate label with object   
   
    cssLabelObjects.push( label );

    // Set the position of the label
    //label.position.set( coordinates.x, coordinates.y, coordinates.z );

    scene.add( label );

    label.element = div;

    return label;
};


export function removeAllLabels(scene, labels) {
    // Remove from labels[] the labels we do not want
    // for each loop

    cssLabelObjects.forEach( label => {
        scene.remove( label );
    });

    //labels = [];
    cssLabelObjects.length = 0;
    labels.length = 0;
    console.log("in remove label funcnction");
    console.log(labels);
}