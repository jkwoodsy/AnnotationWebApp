export function addObjToSidebar(obj, scene, objectArray, cssLabelObjects, raycasterMeshes) {
    const list = document.getElementById("object-list");
    const listItem = document.createElement("li");
    listItem.textContent = obj.filename;

    const hideButton = document.createElement("button");
    hideButton.textContent = obj.visible ? "Hide" : "Show";
    hideButton.onclick = () => {
        console.log("hide button pressed");
        obj.visible = !obj.visible;
        hideButton.textContent = obj.visible ? "Hide" : "Show";
        obj.visible ? scene.add(obj) : scene.remove(obj); // Add or remove from scene

        cssLabelObjects.forEach(label => {
            if (label.object === obj) {
                if (obj.visible) {
                    scene.add(label); // Add label back to scene
                    label.element.style.display = "block";
                } else {
                    scene.remove(label); // Remove label from scene
                    label.element.style.display = "none";
                }
            }
        });

        console.log(raycasterMeshes.length);
        // Update raycasterMeshes to exclude hidden objects
        raycasterMeshes.length = 0;
        objectArray.filter(o => o.visible).forEach(o => {
            raycasterMeshes.push(...getMeshesFromFBXObject(o));
        }); 
    
    };

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = () => {
        console.log("delete button pressed");
        scene.remove(obj);
        //objectArray = objectArray.filter(o => o !== obj); // Remove object from array
        // Remove from objectArray
        const index = objectArray.indexOf(obj);
        if (index !== -1) objectArray.splice(index, 1);

        cssLabelObjects = cssLabelObjects.filter(label => {
            if (label.object === obj) {
                scene.remove(label);
                label.element.remove();
                return false; // Remove from the array
            }
            return true;
        });
        
        updateSidebar(objectArray, scene, cssLabelObjects, raycasterMeshes); // Refresh list if needed (you can also just remove this item from the list)
        raycasterMeshes.length = 0;
        objectArray.filter(o => o.visible).forEach(o => {
            raycasterMeshes.push(...getMeshesFromFBXObject(o));
        });
        // Find the list item corresponding to the object
    };

    listItem.appendChild(hideButton);
    listItem.appendChild(deleteButton);
    list.appendChild(listItem);
}

export function updateSidebar(objectArray, scene, cssLabelObjects, raycasterMeshes) {
    const list = document.getElementById("object-list");
    // Clear the current list
    list.innerHTML = "";

    // Iterate through the objectArray and re-add each object to the sidebar
    objectArray.forEach((obj) => {
        addObjToSidebar(obj, scene, objectArray, cssLabelObjects, raycasterMeshes);
    });
}

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