// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
    // Instructions page elements
    const agreeButton = document.getElementById('agreeButton');
    const disagreeButton = document.getElementById('disagreeButton');
    const nextButton = document.getElementById('nextButton');
    const consentMessage = document.getElementById('consentMessage');
    const instructionsPage = document.getElementById('instructions-page');
    const mainPage = document.getElementById('main-page');

    // Main page elements
    const allowLocationButton = document.getElementById("allow-location-button");
    const customDialog = document.getElementById("custom-dialog");
    const customAlert = document.getElementById("custom-alert");
    const alertMessage = document.getElementById("alert-message");
    const surveyInstructions = document.getElementById("survey-instructions");
    const confirmationDialog = document.getElementById("confirmation-dialog");

    // Instructions page functionality
    function handleConsentClick(agreed) {
        agreeButton.classList.remove('selected');
        disagreeButton.classList.remove('selected');

        if (agreed) {
            agreeButton.classList.add('selected');
            nextButton.disabled = false;
            consentMessage.textContent = '';
        } else {
            disagreeButton.classList.add('selected');
            nextButton.disabled = true;
            consentMessage.textContent = 'You must agree to continue with the survey.';
        }
    }

    // Add instructions page event listeners
    agreeButton.addEventListener('click', () => handleConsentClick(true));
    disagreeButton.addEventListener('click', () => handleConsentClick(false));
    nextButton.addEventListener('click', () => {
        instructionsPage.style.display = 'none';
        mainPage.style.display = 'block';
    });

    // Show the custom dialog when location button is clicked
    allowLocationButton.addEventListener("click", function () {
        customDialog.style.display = "flex";
    });
});

// Handle location permission
function handleLocationPermission(action) {
    const customDialog = document.getElementById("custom-dialog");
    
    // Hide the dialog
    customDialog.style.display = "none";

    // Show appropriate message based on action
    let message;
    switch(action) {
        case 'allow':
            message = "Location access granted.";
            break;
        case 'block':
            message = "Location access denied.";
            break;
        case 'dismiss':
            message = "Location access dismissed.";
            break;
    }
    showCustomAlert(message);
}

// Show the custom alert
function showCustomAlert(message) {
    const customAlert = document.getElementById("custom-alert");
    const alertMessage = document.getElementById("alert-message");
    alertMessage.textContent = message;
    customAlert.style.display = "flex";
}

// Show survey instructions
function showSurveyInstructions() {
    const customAlert = document.getElementById("custom-alert");
    customAlert.style.display = "none";
    
    const surveyInstructions = document.getElementById("survey-instructions");
    surveyInstructions.style.display = "flex";
}

// Show the confirmation dialog for survey instructions
function showConfirmationDialog() {
    const confirmationDialog = document.getElementById("confirmation-dialog");
    confirmationDialog.style.display = "flex";
}

// Handle confirmation - Close the survey instructions
function confirmCloseDialog() {
    const surveyInstructions = document.getElementById("survey-instructions");
    const confirmationDialog = document.getElementById("confirmation-dialog");
    
    // Close both dialogs
    surveyInstructions.style.display = "none";
    confirmationDialog.style.display = "none";
}

// Handle cancellation - Return to survey instructions
function cancelCloseDialog() {
    const confirmationDialog = document.getElementById("confirmation-dialog");
    confirmationDialog.style.display = "none";
}

// Close custom alert (kept for potential backwards compatibility)
function closeCustomAlert() {
    const customAlert = document.getElementById("custom-alert");
    customAlert.style.display = "none";
}