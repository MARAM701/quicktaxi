/*************************************************************
 * DEBUG: Catch any page unload or navigation
 *************************************************************/
window.addEventListener('beforeunload', (e) => {
    console.log("Page is unloading. Something triggered a reload or navigation.");
});

/*************************************************************
 * User ID Management
 *************************************************************/
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getUserId() {
    let userId = localStorage.getItem('quicktaxi_userId');
    if (!userId) {
        userId = generateUserId();
        localStorage.setItem('quicktaxi_userId', userId);
        console.log('New user ID generated:', userId);
    } else {
        console.log('Existing user ID found:', userId);
    }
    return userId;
}

/*************************************************************
 * Session ID Management
 *************************************************************/
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getSessionId() {
    let sessionId = sessionStorage.getItem('quicktaxi_sessionId');
    if (!sessionId) {
        sessionId = generateSessionId();
        sessionStorage.setItem('quicktaxi_sessionId', sessionId);
        console.log('New session ID generated:', sessionId);
    } else {
        console.log('Existing session ID found:', sessionId);
    }
    return sessionId;
}
/*************************************************************
 * Experiment Run ID Management
 *************************************************************/
function generateExperimentRunId() {
    return 'run_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getExperimentRunId() {
    // Always generate a new experiment run ID on page load
    const experimentRunId = generateExperimentRunId();
    sessionStorage.setItem('quicktaxi_experimentRunId', experimentRunId);
    console.log('New experiment run ID generated:', experimentRunId);
    return experimentRunId;
}
/*************************************************************
 * Technical Metadata Collection
 *************************************************************/
function getBrowserMetadata() {
    const ua = navigator.userAgent;
    const browserRegexes = {
        chrome: /Chrome\/([0-9.]+)/,
        firefox: /Firefox\/([0-9.]+)/,
        safari: /Safari\/([0-9.]+)/,
        edge: /Edg\/([0-9.]+)/,
        ie: /Trident\/([0-9.]+)/
    };

    // Detect browser and version
    let browser = 'Unknown';
    for (const [name, regex] of Object.entries(browserRegexes)) {
        const match = ua.match(regex);
        if (match) {
            browser = `${name.charAt(0).toUpperCase() + name.slice(1)} ${match[1]}`;
            break;
        }
    }

    // Detect OS
    let os = 'Unknown';
    if (ua.includes('Windows')) {
        os = ua.includes('Windows NT 10.0') ? 'Windows 10/11' : 'Windows';
    } else if (ua.includes('Mac')) {
        os = 'MacOS';
    } else if (ua.includes('Linux')) {
        os = 'Linux';
    } else if (ua.includes('Android')) {
        os = 'Android';
    } else if (ua.includes('iOS')) {
        os = 'iOS';
    }

    // Detect device type
    let device_type = 'Desktop';
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
        device_type = /iPad/i.test(ua) ? 'Tablet' : 'Mobile';
    }

    return {
        browser,
        os,
        device_type
    };
}

/*************************************************************
 * Prevent any accidental form submissions
 *************************************************************/
document.addEventListener('submit', function (e) {
    e.preventDefault();
    console.warn('Form submission prevented');
});

/*************************************************************
 * Global state
 *************************************************************/
let locationDecisionMade = false;
let initialDecision = null;
let decisionTimestamp = null; // Added for tracking initial decision time 
let iconTimestamp = null;  // Add this new variable
let consentData = {
    decision: null,
    timestamp: null
};
const userId = getUserId(); // Initialize user ID on page load
const sessionId = getSessionId(); // Initialize session ID on page load
const experimentRunId = getExperimentRunId(); // Initialize experiment run ID on page load

/*************************************************************
 * Function to get user's IP address
 *************************************************************/
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error fetching IP:', error);
        return 'unknown';
    }
}

/*************************************************************
 * Function to send tracking data to server
 *************************************************************/
async function sendTrackingData(decision, surveyClicked = false) {
    try {
        const currentSessionId = sessionStorage.getItem('quicktaxi_sessionId');
        console.log('Current sessionId before sending:', currentSessionId);
        
        if (!currentSessionId) {
            console.log('No sessionId found, generating new one');
            const newSessionId = getSessionId();
            console.log('Generated new sessionId:', newSessionId);
        }

        const userIP = await getUserIP();
        const currentTimestamp = new Date().toISOString();
        const metadata = getBrowserMetadata();

        const trackingData = {
            session_id: sessionStorage.getItem('quicktaxi_sessionId'), 
            experiment_run_id: sessionStorage.getItem('quicktaxi_experimentRunId'),
            user_id: userId,
            ip_address: userIP,
            browser: metadata.browser,
            operating_system: metadata.os,
            device_type: metadata.device_type,
            consent_decision: consentData.decision || 'Unknown',
            consent_timestamp: consentData.timestamp || currentTimestamp, 
            icon_timestamp: iconTimestamp,  // Add this new field
            permission_decision: decision,
            decision_timestamp: decisionTimestamp,  // Use stored decision timestamp
            survey_clicked: surveyClicked,
            survey_timestamp: surveyClicked ? currentTimestamp : false  // Only set timestamp for survey clicks
        };

        console.log('Debug - Full tracking data being sent:', trackingData);

        const response = await fetch('https://tracking-server-qi6e.onrender.com/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(trackingData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error('Failed to send tracking data: ' + (errorData.message || ''));
        }

        const result = await response.json();
        console.log('Tracking response:', result);

        return true;
    } catch (error) {
        console.error('Tracking error:', error);
        console.error('Debug - Current storage state:', {
            sessionId: sessionStorage.getItem('quicktaxi_sessionId'),
            userId: userId
        });
        return false;
    }
}

/*************************************************************
 * Initialize page elements
 *************************************************************/
function initializePageElements() {
    const elements = {
        // Instructions page elements
        agreeButton: document.getElementById('agreeButton'),
        disagreeButton: document.getElementById('disagreeButton'),
        nextButton: document.getElementById('nextButton'),
        consentMessage: document.getElementById('consentMessage'),
        instructionsPage: document.getElementById('instructions-page'),
        mainPage: document.getElementById('main-page'),

        // Main page elements
        allowLocationButton: document.getElementById("allow-location-button"),
        customDialog: document.getElementById("custom-dialog"),
        customAlert: document.getElementById("custom-alert"),
        alertMessage: document.getElementById("alert-message"),
        surveyInstructions: document.getElementById("survey-instructions"),
        confirmationDialog: document.getElementById("confirmation-dialog"),

        // Survey link
        surveyLink: document.querySelector('.survey-link a'),
        // Final page elements
        finalPage: document.getElementById('final-page'),
        finalSurveyLink: document.getElementById('final-survey-link')
    };

    // Verify all elements are found
    Object.entries(elements).forEach(([key, element]) => {
        if (!element) {
            console.warn(`Element not found: ${key}`);
        }
    });

    return elements;
}

/*************************************************************
 * Handle location permission
 *************************************************************/
async function handleLocationPermission(action, event) {
    if (event) {
        event.preventDefault();
    }

    if (locationDecisionMade) {
        console.warn('Location decision already made');
        return;
    }

    const elements = {
        customDialog: document.getElementById("custom-dialog"),
        customAlert: document.getElementById("custom-alert"),
        alertMessage: document.getElementById("alert-message")
    };

    try {
        // Set the initial decision and timestamp
        initialDecision = action;
        decisionTimestamp = new Date().toISOString(); // Set decision timestamp once here

        // Hide the permission dialog first
        elements.customDialog.style.display = "none";

        // Send tracking data
        const trackingSuccess = await sendTrackingData(action, false);

        if (!trackingSuccess) {
            console.warn('Failed to track decision, but continuing user flow');
        }

        // Only set locationDecisionMade after successful tracking
        locationDecisionMade = true;

        // Show appropriate message
        let message = {
            'allow': "Location access granted.",
            'block': "Location access denied.",
            'dismiss': "Location access dismissed."
        }[action] || "Unknown action occurred.";

        // Show the alert with the message
        showCustomAlert(message);

    } catch (error) {
        console.error('Error in handleLocationPermission:', error);
        // Reset the state on error
        initialDecision = null;
        decisionTimestamp = null;
        locationDecisionMade = false;
        showCustomAlert("An error occurred. Please try again.");
    }
}

/*************************************************************
 * Dialog Management Functions
 *************************************************************/
function showCustomAlert(message) {
    const customAlert = document.getElementById("custom-alert");
    const alertMessage = document.getElementById("alert-message");

    if (customAlert && alertMessage) {
        alertMessage.textContent = message;
        customAlert.style.display = "flex";
    }
}

function showSurveyInstructions(event) {
    if (event) {
        event.preventDefault();
    }

    const customAlert = document.getElementById("custom-alert");
    const surveyInstructions = document.getElementById("survey-instructions");

    if (customAlert && surveyInstructions) {
        customAlert.style.display = "none";
        surveyInstructions.style.display = "flex";
    }
}

function showConfirmationDialog(event) {
    if (event) {
        event.preventDefault();
    }

    const confirmationDialog = document.getElementById("confirmation-dialog");
    if (confirmationDialog) {
        confirmationDialog.style.display = "flex";
    }
}

function confirmCloseDialog(event) {
    if (event) {
        event.preventDefault();
    }
    
    const surveyInstructions = document.getElementById("survey-instructions");
    const confirmationDialog = document.getElementById("confirmation-dialog");
    const mainPage = document.getElementById("main-page");
    const finalPage = document.getElementById("final-page");

    if (surveyInstructions && confirmationDialog) {
        surveyInstructions.style.display = "none";
        confirmationDialog.style.display = "none";
        mainPage.style.display = "none";
        finalPage.style.display = "block";  // Show the final page
    }
}

function cancelCloseDialog(event) {
    if (event) {
        event.preventDefault();
    }

    const confirmationDialog = document.getElementById("confirmation-dialog");
    if (confirmationDialog) {
        confirmationDialog.style.display = "none";
    }
}

/*************************************************************
 * Survey Link Tracking
 *************************************************************/
function initializeSurveyTracking(elements) {
    // Handle main survey link
    if (elements.surveyLink) {
        elements.surveyLink.addEventListener('click', async function (e) {
            try {
                if (initialDecision) {
                    sendTrackingData(initialDecision, true).catch(error =>
                        console.error('Error tracking survey click:', error)
                    );
                }
            } catch (error) {
                console.error('Error in survey click handler:', error);
            }
        });
    }

    // Handle final page survey link
    if (elements.finalSurveyLink) {
        elements.finalSurveyLink.addEventListener('click', async function (e) {
            try {
                if (initialDecision) {
                    sendTrackingData(initialDecision, true).catch(error =>
                        console.error('Error tracking final survey click:', error)
                    );
                }
            } catch (error) {
                console.error('Error in final survey click handler:', error);
            }
        });
    }
}

/*************************************************************
 * Main initialization
 *************************************************************/
document.addEventListener("DOMContentLoaded", function () {
    const elements = initializePageElements();

    // Ensure all buttons are type="button"
    document.querySelectorAll('button').forEach(button => {
        if (!button.type) {
            button.type = 'button';
        }
    });

    // Initialize survey tracking
    initializeSurveyTracking(elements);

    // Handle consent
    function handleConsentClick(agreed) {
        elements.agreeButton.classList.remove('selected');
        elements.disagreeButton.classList.remove('selected');

        // Record consent decision and timestamp
        consentData.decision = agreed ? 'Agree' : 'Disagree';
        consentData.timestamp = new Date().toISOString();

        if (agreed) {
            elements.agreeButton.classList.add('selected');
            elements.nextButton.disabled = false;
            elements.consentMessage.textContent = '';
        } else {
            elements.disagreeButton.classList.add('selected');
            elements.nextButton.disabled = true;
            elements.consentMessage.textContent = 'You must agree to continue with the survey.';
        }
    }

    // Event Listeners
    if (elements.agreeButton && elements.disagreeButton) {
        elements.agreeButton.addEventListener('click', function (e) {
            e.preventDefault();
            handleConsentClick(true);
        });

        elements.disagreeButton.addEventListener('click', function (e) {
            e.preventDefault();
            handleConsentClick(false);
        });
    }

    if (elements.nextButton) {
        elements.nextButton.addEventListener('click', function (e) {
            e.preventDefault();
            elements.instructionsPage.style.display = 'none';
            elements.mainPage.style.display = 'block';
        });
    }

    if (elements.allowLocationButton) {
        elements.allowLocationButton.addEventListener("click", function (e) {
            e.preventDefault();
            if (!locationDecisionMade) { 
                iconTimestamp = new Date().toISOString();  // Add this line
                elements.customDialog.style.display = "flex";
            }
        });
    }
});
