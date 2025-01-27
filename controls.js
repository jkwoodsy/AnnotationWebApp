// Handle button controls for label visibility and control mode
export function controlsStyling(buttonState) {
    let controlNames = document.querySelectorAll('.controls-container input[type="radio"][name="control"]');

    // When a control is clicked, we will change the styling of the control
    controlNames.forEach( control => {
        // Check if the radio button is selected and change the styling
        if(control.checked) {
            control.parentElement.className = "no-select button-div-selected";
            buttonState.selectedButton = control.id;
        }
        else {
            control.parentElement.className = "no-select button-div-not-selected";
        }
    });
};

// Function to check whether or not to hide or show the labels.
export function toggleLabel() {
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