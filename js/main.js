// js/main.js

import { initAuth, login, logout } from './auth.js';
import { listenForRecords, detachRecordsListener, persistRecord, deleteRecord } from './database.js';
import { $, notify } from './ui/dom.js';
import { getFormData, setFormData, clearForm, prefillDates, updateDocIdDisplay, updateQuoteContactDisplay } from './ui/form-handler.js';
import { renderEquipmentTabs, addEquipmentTab, deleteEquipmentTab } from './ui/equipment-handler.js';
import { renderSearchResults, clearSearchResults, handleSearchKeystrokes } from './ui/search-handler.js';
import { renderSummary, clearSummary } from './ui/summary-view.js';
import { generateServiceTicketOutput, generateQuoteOutput, printRecord, sendEmail, generatePaymentPDF } from './ui/output-generators.js';
import { updateLocationVisuals, handleStreetViewError, clearStreetViewError } from './ui/location-visuals.js';
import { setupTabs, showReviewTab, hideReviewTab } from './ui/tabs.js';
import { renderDiff, clearDiff } from './ui/review-handler.js';

// --- APPLICATION STATE ---
// The appState object now lives within the scope of main.js
// and its properties/methods are passed explicitly to other modules.
const appState = {
    currentUser: null,
    originalRecordData: {},
    pendingRecordData: {},
    currentViewRecords: [],
    currentEquipmentData: [], // Moved from window.appState to internal appState
    autoSaveTimer: null,
    
    /**
     * Handles automatic caching of form data to pending state and triggers diff rendering.
     */
    handleAutoCache: () => {
        clearTimeout(appState.autoSaveTimer);
        appState.autoSaveTimer = setTimeout(() => {
            const currentData = getFormData(appState.currentEquipmentData); // getFormData now accepts currentEquipmentData
            appState.pendingRecordData = currentData;
            const hasChanges = renderDiff(appState.originalRecordData, currentData);
            if (hasChanges) {
                showReviewTab();
            } else {
                hideReviewTab();
            }
        }, 1000);
    },

    /**
     * Approves and persists pending changes to the database.
     */
    approveChanges: async () => {
        if (!appState.currentUser) {
            notify("You must be logged in to save changes.");
            return;
        }
        try {
            const id = await persistRecord(appState.pendingRecordData);
            appState.pendingRecordData.id = id;
            appState.originalRecordData = { ...appState.pendingRecordData };
            notify('✅ Changes approved and saved!');
            hideReviewTab();
            clearDiff();
            renderSummary(appState.originalRecordData);
        } catch (error) {
            console.error("Failed to approve changes:", error);
            notify(`❌ Error saving changes: ${error.message}`);
        }
    },

    /**
     * Discards any pending changes and reverts the form to the original record data.
     */
    discardChanges: () => {
        // setFormData now accepts a callback for post-setting actions
        setFormData(appState.originalRecordData, (data) => {
            appState.currentEquipmentData = data.equipment || [];
            // renderEquipmentTabs now accepts equipmentData and a change handler
            renderEquipmentTabs(appState.currentEquipmentData, appState.handleAutoCache);
            renderSummary(data);
        });
        hideReviewTab();
        clearDiff();
        notify('Changes discarded.');
    },

    /**
     * Loads a specific record into the form for editing.
     * @param {string} recordId - The ID of the record to load.
     */
    loadRecord: (recordId) => {
        // Warn user if there are unapproved changes before loading a new record
        if (Object.keys(appState.pendingRecordData).length > 0 && JSON.stringify(appState.pendingRecordData) !== JSON.stringify(appState.originalRecordData)) {
            if (!confirm("You have un-approved changes. Are you sure you want to load a new record? Your changes will be lost.")) {
                return;
            }
        }

        const recordToEdit = appState.currentViewRecords.find(r => r.id === recordId);
        if (recordToEdit) {
            appState.originalRecordData = { ...recordToEdit };
            appState.pendingRecordData = {}; // Clear pending data when a new record is loaded
            
            // setFormData now accepts a callback for post-setting actions
            setFormData(recordToEdit, (data) => {
                appState.currentEquipmentData = data.equipment || [];
                // renderEquipmentTabs now accepts equipmentData and a change handler
                renderEquipmentTabs(appState.currentEquipmentData, appState.handleAutoCache);
                updateLocationVisuals(data.jobsite || '');
                updateDocIdDisplay(data.docId);
                updateQuoteContactDisplay();
                renderSummary(data);
            });
            hideReviewTab();
            clearDiff();
            notify('📝 Record loaded for editing.');
            window.scrollTo(0, 0);
            clearSearchResults();
            $('searchBox').value = '';
        }
    }
};
// The global window.appState is no longer necessary.
// Its functionalities are now managed within main.js and passed explicitly.
// Removed: window.appState = appState;

// --- AUTH HANDLERS ---
/**
 * Handles actions upon successful user login.
 * @param {object} user - The authenticated Firebase user object.
 */
function handleLogin(user) {
    appState.currentUser = user;
    // Start listening for records relevant to the logged-in user.
    listenForRecords('', handleDataUpdate, handleDataError);
    $('loginScreen').style.display = 'none';
    $('mainAppContainer').style.display = 'block';
    $('profileSection').style.display = 'flex';
    $('userInfo').textContent = `Signed in as: ${user.displayName || user.email}`;
    
    // Set CSR Initials if available and not already set
    const initialsInput = $('initials');
    if (initialsInput && user.displayName && !initialsInput.value) {
        const nameParts = user.displayName.split(' ');
        let initials = nameParts[0].substring(0, 1) + (nameParts.length > 1 ? nameParts[nameParts.length - 1].substring(0, 1) : '');
        initialsInput.value = initials.toUpperCase();
    }
    // Clear the form and set initial document ID after login
    const keepInitialsCheckbox = $('keepInitials');
    clearForm(keepInitialsCheckbox?.checked, user); // Pass user to clearForm for initials pre-filling
}

/**
 * Handles actions upon user logout.
 */
function handleLogout() {
    appState.currentUser = null;
    detachRecordsListener(); // Stop listening for records
    $('loginScreen').style.display = 'flex';
    $('mainAppContainer').style.display = 'none';
}

// --- DATA HANDLERS ---
/**
 * Callback for when record data is updated from Firestore.
 * @param {Array<object>} records - The latest array of records.
 */
function handleDataUpdate(records) {
    appState.currentViewRecords = records;
    // Only re-render search results if the search box is active and has content
    if (document.activeElement === $('searchBox') && $('searchBox').value.length > 0) {
        renderSearchResults(records);
    }
}

/**
 * Callback for errors during Firestore data fetching.
 * @param {Error} error - The error object.
 */
function handleDataError(error) {
    notify('❌ Error loading records.');
    console.error(error);
}

// --- EVENT HANDLERS ---
/**
 * Clears the current form and initializes a new record.
 */
function handleNewForm() {
    const keepInitialsCheckbox = $('keepInitials');
    // Pass user to clearForm to pre-fill initials correctly
    const newId = clearForm(keepInitialsCheckbox?.checked, appState.currentUser);
    const newRecord = { docId: newId, equipment: [] };
    appState.originalRecordData = newRecord; // Set original for diff tracking
    appState.pendingRecordData = {}; // Clear any pending changes
    appState.currentEquipmentData = []; // Reset equipment data
    // renderEquipmentTabs now accepts equipmentData and a change handler
    renderEquipmentTabs(appState.currentEquipmentData, appState.handleAutoCache);
    clearSummary();
    hideReviewTab();
    clearDiff();
    notify('Form cleared for new record.');
}

// --- INITIALIZATION ---
/**
 * Initializes application settings like dark mode and Google Maps API key.
 */
function initializeSettings() {
    const darkModeToggle = $('darkModeToggle');
    darkModeToggle?.addEventListener('change', (e) => {
        localStorage.setItem('darkMode', e.target.checked);
        document.documentElement.classList.toggle('dark-mode', e.target.checked);
    });
    // Apply dark mode preference on load
    if (localStorage.getItem('darkMode') === 'true') darkModeToggle.checked = true;

    const googleMapsApiKeyInput = $('googleMapsApiKey');
    if (googleMapsApiKeyInput) {
        googleMapsApiKeyInput.value = localStorage.getItem('googleMapsApiKey') || '';
    }
}

/**
 * Binds all necessary event listeners for user interactions.
 */
function bindEventListeners() {
    const mainContainer = $('mainAppContainer');
    const form = $('intakeForm');
    const searchBox = $('searchBox');

    // --- Delegated Click Handler for the whole app ---
    if (mainContainer) {
        mainContainer.addEventListener('click', (e) => {
            const target = e.target;
            
            // Buttons with simple actions
            if (target.id === 'loginBtn') login();
            if (target.id === 'logoutBtn') logout();
            if (target.id === 'newFormBtnTop') handleNewForm();
            // Pass the current equipment data for output generation
            if (target.id === 'genServiceTicketOutputBtn') generateServiceTicketOutput(appState.currentEquipmentData);
            if (target.id === 'genQuoteOutputBtn') generateQuoteOutput(appState.currentEquipmentData);
            if (target.id === 'printBtn') printRecord(appState.currentEquipmentData);
            // Email and PDF generation functions don't explicitly need currentEquipmentData
            if (target.id === 'emailQuoteBtn') sendEmail('quote');
            if (target.id === 'emailInvoiceBtn') sendEmail('invoice');
            if (target.id === 'emailDepositBtn') sendEmail('depositReceipt');
            if (target.id === 'paymentPdfBtn') generatePaymentPDF();
            if (target.id === 'approveChangesBtn') appState.approveChanges();
            if (target.id === 'discardChangesBtn') appState.discardChanges();
            
            // Handle "Add New Door" button click
            if (target.closest('#add-door-btn')) {
                // Pass currentEquipmentData and the auto-cache handler to addEquipmentTab
                addEquipmentTab(appState.currentEquipmentData, appState.handleAutoCache);
            }

            // Handle Menu Icon click (toggle dropdown)
            if (target.closest('.menu-icon')) {
                $('menuDropdown').classList.toggle('show');
            }

            // Handle "Delete Door" button click within equipment accordions
            if (target.classList.contains('delete-door-btn')) {
                const index = parseInt(target.dataset.deleteIndex, 10);
                // Pass the index, currentEquipmentData, and auto-cache handler to deleteEquipmentTab
                deleteEquipmentTab(index, appState.currentEquipmentData, appState.handleAutoCache);
            }
            
            // Trigger auto-cache when an equipment accordion header is clicked (for state update)
            if (target.closest('.equipment-accordion-header')) {
                appState.handleAutoCache();
            }

            // Handle location tab (Map/Street View) clicks
            if (target.closest('.location-tab-btn')) {
                const view = target.dataset.view;
                document.querySelectorAll('.location-tab-btn').forEach(btn => btn.classList.remove('active'));
                target.classList.add('active');
                
                $('mapView').style.display = (view === 'map') ? 'block' : 'none';
                $('streetViewImg').style.display = (view === 'streetview') ? 'block' : 'none';
        
                // Check for street view errors when switching to street view
                if(view === 'streetview' && $('streetViewImg').src && $('streetViewImg').naturalWidth === 0) {
                   handleStreetViewError();
                } else {
                   clearStreetViewError();
                }
            }
        });
    }
    
    // --- Input and other specific listeners ---
    // Trigger auto-cache on any form input change
    if(form) form.addEventListener('input', appState.handleAutoCache);
    
    // Handle Google Maps API key input and update visuals
    const googleMapsApiKeyInput = $('googleMapsApiKey');
    if (googleMapsApiKeyInput) {
        googleMapsApiKeyInput.addEventListener('input', (e) => {
            localStorage.setItem('googleMapsApiKey', e.target.value);
            if ($('jobsite')) {
                updateLocationVisuals($('jobsite').value);
            }
        });
    }

    // Format phone number input as (XXX) XXX-XXXX
    const phoneInput = $('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            const input = e.target.value.replace(/\D/g, ''); // Remove non-digits
            const match = input.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/); // Match patterns
            if (!match) return; // Exit if no match
            let formatted = '';
            if (match[1]) formatted += `(${match[1]}`;
            if (match[2]) formatted += `) ${match[2]}`;
            if (match[3]) formatted += `-${match[3]}`;
            e.target.value = formatted;
        });
    }
    
    // Dynamically show/hide payment/PO related fields based on selection
    const poTypeInput = $('poType');
    if(poTypeInput) {
        poTypeInput.addEventListener('change', (e) => {
            const selection = e.target.value;
            $('poNumberGroup').style.display = (selection === 'PO Number') ? 'block' : 'none';
            $('verbalPoGroup').style.display = (selection === 'Verbal PO') ? 'block' : 'none';
            $('warrantyGroup').style.display = (selection === 'Warranty') ? 'block' : 'none';
            $('cc-info-group').style.display = (selection === 'CC on File') ? 'block' : 'none';
        });
    }
    
    // Sync Jobsite Address with Billing Address if checkbox is checked
    const sameAsBillingCheckbox = $('sameAsBilling');
    if (sameAsBillingCheckbox) {
        sameAsBillingCheckbox.addEventListener('change', (e) => {
            if(e.target.checked) {
                $('jobsite').value = $('billing').value;
                // Trigger an input event on jobsite to ensure handleAutoCache picks up the change
                $('jobsite').dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    }

    // Handle search box input and keyboard navigation
    if (searchBox) {
        searchBox.addEventListener('input', () => {
            const searchTerm = searchBox.value.trim();
            if(searchTerm.length > 0) {
                // Pass local handleDataUpdate and handleDataError to listenForRecords
                listenForRecords(searchTerm, handleDataUpdate, handleDataError);
            } else {
                clearSearchResults();
            }
        });
        searchBox.addEventListener('keydown', handleSearchKeystrokes);
        // Clear search results after a short delay on blur, to allow click events to register
        searchBox.addEventListener('blur', () => setTimeout(clearSearchResults, 200));
    }
}

// --- Main Execution ---
/**
 * Main function to initialize the application when the DOM is ready.
 */
function main() {
    document.addEventListener('DOMContentLoaded', () => {
        setupTabs();
        prefillDates();
        initializeSettings();
        bindEventListeners();
        // Initialize authentication, passing local handlers for login/logout
        initAuth(handleLogin, handleLogout);
    });
}

// Start the application
main();
